from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib import error, parse, request

from app.services.records_summary import build_records_summary, format_record


DEFAULT_LEVEL = "中級者（週1〜3回）"
_ENV_LOADED = False

LEVEL_DEFAULTS = {
    "初心者（これから始める）": {
        "today": {"menuName": "スクワット", "count": 10, "sets": 2, "mins": 0, "secs": 0},
        "recovery": {"menuName": "ストレッチ", "count": 1, "sets": 1, "mins": 5, "secs": 0},
        "nutrition": {"menuName": "ウォーキング", "count": 1, "sets": 1, "mins": 10, "secs": 0},
        "plateau": {"menuName": "プランク", "count": 1, "sets": 2, "mins": 0, "secs": 30},
        "split": {"menuName": "プッシュアップ", "count": 8, "sets": 2, "mins": 0, "secs": 0},
        "strength": {"menuName": "スクワット", "count": 12, "sets": 3, "mins": 0, "secs": 0},
        "intensity": {"menuName": "ランジ", "count": 10, "sets": 2, "mins": 0, "secs": 0},
        "free": {"menuName": "ウォーキング", "count": 1, "sets": 1, "mins": 10, "secs": 0},
    },
    "中級者（週1〜3回）": {
        "today": {"menuName": "プッシュアップ", "count": 15, "sets": 3, "mins": 0, "secs": 0},
        "recovery": {"menuName": "ストレッチ", "count": 1, "sets": 1, "mins": 8, "secs": 0},
        "nutrition": {"menuName": "ウォーキング", "count": 1, "sets": 1, "mins": 15, "secs": 0},
        "plateau": {"menuName": "プランク", "count": 1, "sets": 3, "mins": 1, "secs": 0},
        "split": {"menuName": "チンニング", "count": 8, "sets": 3, "mins": 0, "secs": 0},
        "strength": {"menuName": "デッドリフト", "count": 5, "sets": 5, "mins": 0, "secs": 0},
        "intensity": {"menuName": "ベンチプレス", "count": 10, "sets": 4, "mins": 0, "secs": 0},
        "free": {"menuName": "プランク", "count": 1, "sets": 3, "mins": 1, "secs": 0},
    },
    "上級者（ガチ勢）": {
        "today": {"menuName": "バーベルスクワット", "count": 10, "sets": 5, "mins": 0, "secs": 0},
        "recovery": {"menuName": "アクティブレスト", "count": 1, "sets": 1, "mins": 12, "secs": 0},
        "nutrition": {"menuName": "ウォーキング", "count": 1, "sets": 1, "mins": 20, "secs": 0},
        "plateau": {"menuName": "プランク", "count": 1, "sets": 4, "mins": 1, "secs": 30},
        "split": {"menuName": "チンニング", "count": 12, "sets": 4, "mins": 0, "secs": 0},
        "strength": {"menuName": "デッドリフト", "count": 5, "sets": 5, "mins": 0, "secs": 0},
        "intensity": {"menuName": "ベンチプレス", "count": 12, "sets": 4, "mins": 0, "secs": 0},
        "free": {"menuName": "ブルガリアンスクワット", "count": 12, "sets": 3, "mins": 0, "secs": 0},
    },
}

UPPER_BODY_KEYWORDS = ("ベンチ", "チンニング", "ショルダー", "プレス", "ロー", "腕立て", "懸垂", "胸")
LOWER_BODY_KEYWORDS = ("スクワット", "ランジ", "デッド", "ヒップ", "ブルガリアン", "脚")

BODY_PART_MENUS = {
    "shoulder": {
        "keywords": ("肩", "三角筋", "shoulder", "ショルダー", "サイドレイズ", "リアレイズ"),
        "label": "肩",
        "menus": {
            "初心者（これから始める）": {"menuName": "サイドレイズ", "count": 10, "sets": 2, "mins": 0, "secs": 0},
            "中級者（週1〜3回）": {"menuName": "サイドレイズ", "count": 12, "sets": 3, "mins": 0, "secs": 0},
            "上級者（ガチ勢）": {"menuName": "ショルダープレス", "count": 10, "sets": 4, "mins": 0, "secs": 0},
        },
        "tip": "反動を使わず、肩をすくめない範囲でゆっくり上げ下げするのがポイントです。",
    },
    "chest": {
        "keywords": ("胸", "大胸筋", "chest", "ベンチ", "腕立て", "プッシュアップ"),
        "label": "胸",
        "menus": {
            "初心者（これから始める）": {"menuName": "膝つきプッシュアップ", "count": 8, "sets": 2, "mins": 0, "secs": 0},
            "中級者（週1〜3回）": {"menuName": "プッシュアップ", "count": 12, "sets": 3, "mins": 0, "secs": 0},
            "上級者（ガチ勢）": {"menuName": "ベンチプレス", "count": 10, "sets": 4, "mins": 0, "secs": 0},
        },
        "tip": "胸を張り、肩だけで押さずに胸の前側を使う意識で行いましょう。",
    },
    "back": {
        "keywords": ("背中", "広背筋", "back", "ロー", "懸垂", "チンニング"),
        "label": "背中",
        "menus": {
            "初心者（これから始める）": {"menuName": "タオルローイング", "count": 12, "sets": 2, "mins": 0, "secs": 0},
            "中級者（週1〜3回）": {"menuName": "チンニング", "count": 6, "sets": 3, "mins": 0, "secs": 0},
            "上級者（ガチ勢）": {"menuName": "チンニング", "count": 10, "sets": 4, "mins": 0, "secs": 0},
        },
        "tip": "腕だけで引かず、肩甲骨を寄せるイメージを入れると背中に入りやすいです。",
    },
    "legs": {
        "keywords": ("脚", "足", "下半身", "太もも", "お尻", "leg", "スクワット", "ランジ"),
        "label": "下半身",
        "menus": {
            "初心者（これから始める）": {"menuName": "スクワット", "count": 10, "sets": 2, "mins": 0, "secs": 0},
            "中級者（週1〜3回）": {"menuName": "ランジ", "count": 10, "sets": 3, "mins": 0, "secs": 0},
            "上級者（ガチ勢）": {"menuName": "ブルガリアンスクワット", "count": 12, "sets": 3, "mins": 0, "secs": 0},
        },
        "tip": "膝とつま先の向きをそろえ、痛みが出る深さまでは無理に下げないでください。",
    },
    "arms": {
        "keywords": ("腕", "二頭", "三頭", "力こぶ", "arm", "アームカール"),
        "label": "腕",
        "menus": {
            "初心者（これから始める）": {"menuName": "アームカール", "count": 10, "sets": 2, "mins": 0, "secs": 0},
            "中級者（週1〜3回）": {"menuName": "アームカール", "count": 12, "sets": 3, "mins": 0, "secs": 0},
            "上級者（ガチ勢）": {"menuName": "ディップス", "count": 10, "sets": 4, "mins": 0, "secs": 0},
        },
        "tip": "反動を使いすぎず、上げる時も下ろす時もコントロールしましょう。",
    },
    "abs": {
        "keywords": ("腹", "腹筋", "体幹", "お腹", "abs", "プランク"),
        "label": "腹筋",
        "menus": {
            "初心者（これから始める）": {"menuName": "プランク", "count": 1, "sets": 2, "mins": 0, "secs": 20},
            "中級者（週1〜3回）": {"menuName": "プランク", "count": 1, "sets": 3, "mins": 0, "secs": 40},
            "上級者（ガチ勢）": {"menuName": "プランク", "count": 1, "sets": 4, "mins": 1, "secs": 0},
        },
        "tip": "腰を反らせず、頭からかかとまで一直線を保つ意識で行いましょう。",
    },
}

ALLOWED_RESPONSE_TYPES = {
    "workout",
    "today",
    "body_part",
    "plan",
    "split",
    "strength",
    "intensity",
    "plateau",
    "goal_strategy",
    "progress",
    "data_analysis",
    "recovery",
    "injury",
    "nutrition",
    "supplement",
    "form",
    "motivation",
    "app_info",
    "privacy",
    "general",
    "unsafe",
}
RECORDABLE_TOPIC_KEYS = {"today", "body_part", "split", "strength", "intensity", "plateau", "plan", "workout"}
SERVER_FORCED_RESPONSE_TYPES = {
    "unsafe",
    "injury",
    "privacy",
    "app_info",
    "form",
    "nutrition",
    "supplement",
    "recovery",
    "goal_strategy",
    "progress",
    "data_analysis",
    "general",
    "motivation",
}


@dataclass
class AdviceContext:
    user_name: str
    level: str | None
    topic: str
    message: str | None
    records: list[dict[str, Any]]


def _normalize_text(value: str | None) -> str:
    return (value or "").strip().lower()


def detect_topic(topic: str, message: str | None) -> str:
    normalized = _normalize_text(f"{topic} {message or ''}")

    if any(keyword in normalized for keyword in ("ステロイド", "ドーピング", "拒食", "吐く", "何も食べない", "絶食", "1日でムキムキ", "一日でムキムキ")):
        return "unsafe"
    if any(keyword in normalized for keyword in ("個人情報", "安全", "セキュリティ", "プライバシー", "他人", "フレンドに", "公開", "体重見える", "データ", "保存先")) and not any(keyword in normalized for keyword in ("ログ", "分析", "評価", "計算", "調整", "変化")):
        return "privacy"
    if any(keyword in normalized for keyword in ("アプリ", "muscloop", "マッスループ", "何ができ", "使い方", "機能")):
        return "app_info"
    if any(keyword in normalized for keyword in ("ログ", "記録から", "成長分析", "栄養バランス", "評価して", "分析して", "最適化", "計算して", "次回メニュー調整", "プラン修正", "体重の変化", "体脂肪の変化")):
        return "data_analysis"
    if any(keyword in normalized for keyword in ("重量", "伸びない", "伸ばしたい", "停滞", "限界", "セット数", "回数", "オーバートレーニング", "成長", "見た目変わる", "どれくらいで変わる")):
        return "progress"
    if any(keyword in normalized for keyword in ("モテ", "かっこよ", "見た目", "スタイル", "痩せ", "やせ", "ダイエット", "細マッチョ", "腹筋割", "逆三角形", "vシェイプ", "顔周り", "姿勢よく")):
        return "general"
    if any(keyword in normalized for keyword in ("フォーム", "姿勢", "やり方", "方法", "コツ", "正しい", "効かない", "可動域", "チート", "反動", "呼吸", "ゆっくり", "速く", "腰を痛めない", "肩痛くなる原因")):
        return "form"
    if any(keyword in normalized for keyword in ("やる気", "続かない", "めんど", "不安", "緊張", "モチベ", "サボ", "習慣", "比べて", "落ち込")):
        return "motivation"
    if any(keyword in normalized for keyword in ("痛い", "痛み", "怪我", "けが", "腰痛", "膝痛", "肩痛", "痛む", "治療", "診断")):
        return "injury"
    if any(keyword in normalized for keyword in ("疲れ", "だるい", "休み", "回復", "筋肉痛", "寝不足", "睡眠", "ストレッチ", "疲労")):
        return "recovery"
    if any(keyword in normalized for keyword in ("プロテイン", "クレアチン", "bcaa", "サプリ", "ホエイ", "ソイ")):
        return "supplement"
    if any(keyword in normalized for keyword in ("食事", "栄養", "protein", "たんぱく", "タンパク", "コンビニ", "カロリー", "増量", "減量", "お酒", "酒", "寝る前", "安く", "食費", "高タンパク")):
        return "nutrition"
    if any(keyword in normalized for keyword in ("体脂肪", "体重", "身長", "目標設定", "目標を作", "バルク", "カット", "筋肥大", "脂肪減少", "3ヶ月で", "三ヶ月で")):
        return "goal_strategy"
    if any(keyword in normalized for keyword in ("目標", "プラン", "計画", "今日", "メニュー組", "メニュー作", "週何回", "ルーティン", "生活", "通学", "バイト", "30分", "時間", "家トレ", "ジム", "ダンベル", "器具", "全身法", "分割法", "部位分け", "有酸素", "腹筋は毎日", "1週間", "一週間", "軽めメニュー", "補助種目", "脚トレ")):
        return "plan"

    if any(keyword in normalized for keyword in ("ステロイド", "ドーピング", "拒食", "吐く", "何も食べない", "絶食", "1日でムキムキ", "一日でムキムキ")):
        return "unsafe"
    if any(keyword in normalized for keyword in ("個人情報", "安全", "セキュリティ", "プライバシー", "他人", "フレンドに", "公開", "体重見える", "データ", "保存先")):
        return "privacy"
    if any(keyword in normalized for keyword in ("アプリ", "muscloop", "マッスループ", "何ができ", "使い方", "機能")):
        return "app_info"
    if any(keyword in normalized for keyword in ("重量", "伸びない", "停滞", "限界", "セット数", "回数", "オーバートレーニング", "成長", "見た目変わる")):
        return "progress"
    if any(keyword in normalized for keyword in ("モテ", "かっこよ", "見た目", "スタイル", "痩せ", "やせ", "ダイエット", "細マッチョ", "腹筋割", "逆三角形", "vシェイプ", "顔周り", "姿勢よく")):
        return "general"
    if any(keyword in normalized for keyword in ("フォーム", "姿勢", "やり方", "コツ", "正しい", "効かない")):
        return "form"
    if any(keyword in normalized for keyword in ("やる気", "続かない", "めんど", "不安", "緊張", "モチベ", "サボ")):
        return "motivation"
    if any(keyword in normalized for keyword in ("痛い", "痛み", "怪我", "けが", "腰痛", "膝痛", "肩痛", "病院", "治療", "診断")):
        return "injury"
    if any(keyword in normalized for keyword in ("疲れ", "だるい", "休み", "回復", "筋肉痛", "寝不足", "睡眠", "ストレッチ")):
        return "recovery"
    if any(keyword in normalized for keyword in ("プロテイン", "クレアチン", "bcaa", "サプリ", "ホエイ", "ソイ")):
        return "supplement"
    if any(keyword in normalized for keyword in ("食事", "栄養", "protein", "たんぱく", "タンパク", "コンビニ", "カロリー", "増量", "減量", "お酒", "酒")):
        return "nutrition"
    if any(keyword in normalized for keyword in ("体脂肪", "体重", "身長", "目標設定", "目標を作", "バルク", "カット", "筋肥大", "脂肪減少")):
        return "goal_strategy"
    if any(keyword in normalized for keyword in ("目標", "プラン", "計画", "3ヶ月", "三ヶ月", "週何回", "ルーティン", "生活", "通学", "バイト", "30分", "時間")):
        return "plan"
    if detect_body_part(topic, message):
        return "body_part"
    if any(keyword in normalized for keyword in ("停滞", "伸びない", "マンネリ", "plateau")):
        return "plateau"
    if any(keyword in normalized for keyword in ("部位", "分割", "split")):
        return "split"
    if any(keyword in normalized for keyword in ("max", "重量", "高重量", "筋力")):
        return "strength"
    if any(keyword in normalized for keyword in ("きつめ", "追い込み", "強度", "ハード")):
        return "intensity"
    if any(keyword in normalized for keyword in ("今日", "メニュー", "おすすめ", "何やる")):
        return "today"
    return "free"


def detect_body_part(topic: str, message: str | None) -> str | None:
    normalized = _normalize_text(f"{topic} {message or ''}")
    direct_keywords = {
        "shoulder": ("肩", "三角筋", "ショルダー", "サイドレイズ", "リアレイズ"),
        "chest": ("胸", "大胸筋", "ベンチプレス", "腕立て", "プッシュアップ"),
        "back": ("背中", "広背筋", "懸垂", "チンニング", "ローイング"),
        "legs": ("脚", "足", "下半身", "太もも", "お尻", "スクワット", "ランジ"),
        "arms": ("腕", "二頭筋", "三頭筋", "力こぶ", "アームカール"),
        "abs": ("腹", "腹筋", "体幹", "お腹", "プランク"),
    }
    for body_part, keywords in direct_keywords.items():
        if any(keyword.lower() in normalized for keyword in keywords):
            return body_part
    for body_part, config in BODY_PART_MENUS.items():
        if any(keyword.lower() in normalized for keyword in config["keywords"]):
            return body_part
    return None


def infer_recent_focus(records: list[dict[str, Any]]) -> str | None:
    recent_names = [str(record.get("menuName") or "") for record in records[:3]]
    upper_hits = sum(1 for name in recent_names if any(keyword in name for keyword in UPPER_BODY_KEYWORDS))
    lower_hits = sum(1 for name in recent_names if any(keyword in name for keyword in LOWER_BODY_KEYWORDS))

    if upper_hits > lower_hits and upper_hits > 0:
        return "upper"
    if lower_hits > upper_hits and lower_hits > 0:
        return "lower"
    return None


def choose_menu(level: str | None, topic_key: str, recent_focus: str | None, body_part: str | None = None) -> dict[str, Any]:
    if body_part and body_part in BODY_PART_MENUS:
        menus = BODY_PART_MENUS[body_part]["menus"]
        return dict(menus.get(level or "", menus[DEFAULT_LEVEL]))

    preset = LEVEL_DEFAULTS.get(level or "", LEVEL_DEFAULTS[DEFAULT_LEVEL])
    menu = dict(preset.get(topic_key, preset["free"]))

    if topic_key == "today":
        if recent_focus == "lower":
            menu = {"menuName": "チンニング", "count": 8, "sets": max(menu["sets"], 3), "mins": 0, "secs": 0}
        elif recent_focus == "upper":
            menu = {"menuName": "スクワット", "count": 15, "sets": max(menu["sets"], 3), "mins": 0, "secs": 0}

    return menu


def build_reason(
    *,
    user_name: str,
    topic_key: str,
    streak_days: int,
    today_records: int,
    recent_menu_names: list[str],
    recent_focus: str | None,
    body_part: str | None = None,
) -> str:
    if topic_key == "body_part" and body_part:
        label = BODY_PART_MENUS[body_part]["label"]
        return f"{label}を鍛えたい相談なので、初心者でもフォームを崩しにくく記録しやすい種目を選びました。"
    if topic_key == "recovery":
        return f"{user_name}さんは最近も継続できているので、今日は無理をしすぎず回復寄りにした方が続けやすいです。"
    if topic_key == "plateau":
        return "最近の流れを変えるために、短時間でも刺激を変えられるメニューを優先しました。"
    if topic_key == "split":
        if recent_focus == "upper":
            return "直近は上半身寄りだったので、今日は下半身も入れて全身のバランスを整えやすくしました。"
        if recent_focus == "lower":
            return "直近は下半身寄りだったので、今日は上半身メニューを入れて偏りを減らせるようにしました。"
        return "部位分けの相談だったので、初心者でも組みやすい無理のない候補に寄せています。"
    if topic_key == "nutrition":
        return "食事の相談でも、まず続けやすい軽めの運動を添えると習慣化しやすいのでその前提で提案しています。"
    if topic_key == "form":
        return "フォームの相談なので、無理に回数を増やすより安全に確認しやすい内容を優先しました。"
    if topic_key == "motivation":
        return "やる気が低い日でも始めやすいように、心理的なハードルが低い内容を優先しました。"
    if topic_key == "app_info":
        return "アプリについての質問なので、メニュー提案よりもmuscloopでできることを直接説明します。"
    if topic_key == "privacy":
        return "プライバシーやデータの質問なので、公開範囲と安全方針を直接説明します。"
    if topic_key == "injury":
        return "痛みや怪我に関わる相談なので、原因を断定せず安全を優先します。"
    if topic_key == "unsafe":
        return "危険または不健康な内容なので、実行方法は案内せず安全な代替案を出します。"
    if topic_key == "supplement":
        return "サプリの相談なので、一般情報に留めて過度な期待や危険な使い方を避けます。"
    if topic_key == "data_analysis":
        return "記録や数値の分析相談なので、推測で断定せず、手元にある記録で分かる範囲と追加で必要な情報を分けて返します。"
    if topic_key == "data_analysis":
        return (
            f"{user_name}さん、記録を使った分析ですね。\n"
            "手元にある筋トレ記録から傾向は見られますが、食事ログ・体重・体脂肪など未入力の情報は推測で断定しません。\n"
            "今ある記録で分かる範囲を整理し、足りない情報があれば追加で聞きながら次の調整案を出します。"
        )
    if topic_key == "progress":
        return "成長や停滞の相談なので、記録の見方と安全な調整方針を返します。"
    if topic_key == "plan":
        return "生活や目標に合わせた相談なので、無理なく続けられる方針を優先します。"
    if topic_key == "goal_strategy":
        return "体型や目標設定の相談なので、情報不足を断定せず、必要情報と安全な考え方を返します。"
    if topic_key == "general":
        return "雑談や目的相談なので、特定メニューを押しつけず、考え方を短く返します。"
    if today_records > 0:
        return f"今日はすでに{today_records}件記録があるので、追加でも負担が大きすぎない内容にしました。"
    if streak_days >= 3:
        return f"{streak_days}日連続で続いているので、勢いを切らさずに取り組めるメニューを優先しました。"
    if recent_menu_names:
        return f"最近の記録が {', '.join(recent_menu_names[:2])} だったので、偏りすぎない内容を意識しています。"
    return "まだ記録が少ないので、まずは続けやすくて始めやすいメニューを選びました。"


def build_message(
    *,
    user_name: str,
    topic_key: str,
    recommendation: dict[str, Any],
    reason: str,
    summary: dict[str, Any],
    body_part: str | None = None,
) -> str:
    if recommendation["mins"] or recommendation["secs"]:
        menu_text = (
            f"{recommendation['menuName']} "
            f"{recommendation['mins']}分"
            f"{f'{recommendation['secs']}秒' if recommendation['secs'] else ''}"
            f" × {recommendation['sets']}セット"
        )
    else:
        menu_text = (
            f"{recommendation['menuName']} "
            f"{recommendation['count']}回 × {recommendation['sets']}セット"
        )

    if topic_key == "app_info":
        return (
            f"{user_name}さん、muscloopはAI相談、筋トレ記録、実績、通知で継続を支えるアプリです。\n"
            "今日のメニュー相談からそのまま記録につなげられるので、初心者でも迷わず続けやすいのが特徴です。\n"
            "今後はフレンドやランキング、Web公開、Apple Watch連携も強化していく予定です。"
        )
    if topic_key == "privacy":
        return (
            "muscloopでは、フレンドに見せる情報と本人だけの情報を分ける方針です。\n"
            "体重・体脂肪・メモ・食事・HealthKit詳細・画像・通知トークンのような情報は、基本的に公開しない設計にしています。\n"
            "API側もFirebase ID tokenで本人確認し、他人のuserIdを勝手に指定できない形へ移行しています。"
        )
    if topic_key == "injury":
        return (
            f"{user_name}さん、痛みがある場合は無理に筋トレを続けない方が安全です。\n"
            "原因はここでは断定できないので、強い痛みや長引く痛みがあるなら専門家に相談してください。\n"
            "今日は痛みのない範囲で休むか、軽いストレッチ程度にしておきましょう。"
        )
    if topic_key == "unsafe":
        return (
            "その内容は安全におすすめできません。\n"
            "短期間で極端に体を変える方法や、健康を損なう可能性がある方法は避けましょう。\n"
            "muscloopでは、食事・睡眠・無理のない運動を続ける方向でサポートします。"
        )
    if topic_key == "supplement":
        return (
            f"{user_name}さん、サプリはあくまで食事を補うものとして考えるのが安全です。\n"
            "まずは普段の食事でたんぱく質を確保し、足りない時にプロテインなどを検討するくらいで十分です。\n"
            "体調や持病がある場合、サプリの使用は専門家に確認してください。"
        )
    if topic_key == "progress":
        return (
            f"{user_name}さん、伸び悩みは誰にでもあります。\n"
            "まずは記録を見て、重量・回数・セット数・休息のどこが詰まっているか確認しましょう。\n"
            "毎回限界まで追い込むより、フォームを保てる範囲で少しずつ負荷を上げるのがおすすめです。"
        )
    if topic_key == "plan":
        return (
            f"{user_name}さん、忙しい中で続けるなら、完璧な計画よりも週2〜3回の短いメニューを固定するのがおすすめです。\n"
            "まずは30分以内で、スクワット・腕立て・プランクのような全身に効く種目を組み合わせると続けやすいです。\n"
            "具体的な曜日や使える時間を教えてくれたら、より現実的な週間プランにできます。"
        )
    if topic_key == "goal_strategy":
        return (
            f"{user_name}さん、体脂肪率や体重から正確な目標を作るには、現在の身長・体重・体脂肪率・目標期間・運動頻度が必要です。\n"
            "ここでは断定せず、まずは3ヶ月で無理なく続けられる小さな目標にするのがおすすめです。\n"
            "数値を教えてくれたら、減量・維持・筋肥大のどれを優先するか一緒に整理できます。"
        )
    if topic_key == "general":
        return (
            f"{user_name}さん、見た目を整えたいなら、まずは大きい筋肉を無理なく続けるのが近道です。\n"
            "胸・背中・脚をバランスよく鍛えると姿勢やシルエットが変わりやすく、印象も良くなりやすいです。\n"
            "具体的にメニューを組みたい時は、鍛えたい部位や使える道具を教えてください。"
        )
    if topic_key == "motivation":
        return (
            f"{user_name}さん、やる気が出ない日でも相談してくれた時点で一歩進んでいます。\n"
            "今日は完璧にやるより、1分だけ体を動かすくらいで十分です。\n"
            "できたら記録して、できなければ明日の自分に回しても大丈夫です。"
        )
    if topic_key == "form":
        return (
            f"{user_name}さん、フォームが不安な時は回数より安全を優先しましょう。\n"
            "痛みがない範囲でゆっくり動き、鏡や動画で姿勢を確認するのがおすすめです。\n"
            f"試すなら {menu_text} くらいの軽さから始めて、違和感があれば中止してください。"
        )
    if topic_key == "body_part" and body_part:
        label = BODY_PART_MENUS[body_part]["label"]
        tip = BODY_PART_MENUS[body_part]["tip"]
        return (
            f"{user_name}さん、{label}を鍛えたいなら今日は {menu_text} がおすすめです。\n"
            f"{tip}\n"
            "最初は軽めでフォームを優先して、きつければ回数やセット数を減らしてOKです。"
        )

    if topic_key == "recovery":
        opener = f"{user_name}さん、今日は無理をしすぎず、軽く体を動かすイメージでいきましょう。"
    elif topic_key == "nutrition":
        opener = f"{user_name}さん、食事と合わせて続けやすい軽めの内容にしました。"
    elif topic_key == "plateau":
        opener = f"{user_name}さん、少し変化をつけつつも取り組みやすい内容でいきましょう。"
    else:
        opener = f"{user_name}さん、今日の体調ならまずはこれくらいから始めるのがおすすめです。"

    status = (
        f"これまでの合計は {summary['totalMinutes']}分、"
        f"連続日数は {summary['streakDays']}日、"
        f"今日の記録は {summary['todayRecords']}件です。"
    )

    return (
        f"{opener}\n"
        f"おすすめは {menu_text} です。\n"
        f"{reason}\n"
        "きつそうなら回数やセット数を少し減らしても大丈夫です。\n"
        f"{status}"
    )


def _build_summary(records: list[dict[str, Any]]) -> tuple[dict[str, Any], list[dict[str, Any]], list[str], str | None]:
    summary = build_records_summary("guest", records)
    formatted_records = [format_record(record) for record in records]
    formatted_records.sort(key=lambda record: record.get("createdAt") or "", reverse=True)

    recent_focus = infer_recent_focus(formatted_records)
    recent_menu_names = [record["menuName"] for record in formatted_records[:3] if record.get("menuName")]

    advice_summary = {
        "streakDays": summary["streakDays"],
        "totalMinutes": summary["totalMinutes"],
        "todayRecords": summary["todayRecords"],
        "todayTotalMinutes": summary["todayTotalMinutes"],
        "recentMenus": recent_menu_names,
    }
    return advice_summary, formatted_records, recent_menu_names, recent_focus


def _fallback_ai_advice(context: AdviceContext) -> dict[str, Any]:
    summary, formatted_records, recent_menu_names, recent_focus = _build_summary(context.records)
    topic_key = detect_topic(context.topic, context.message)
    body_part = detect_body_part(context.topic, context.message)
    recommendation = choose_menu(context.level, topic_key, recent_focus, body_part)
    reason = build_reason(
        user_name=context.user_name,
        topic_key=topic_key,
        streak_days=summary["streakDays"],
        today_records=summary["todayRecords"],
        recent_menu_names=recent_menu_names,
        recent_focus=recent_focus,
        body_part=body_part,
    )
    message_text = build_message(
        user_name=context.user_name,
        topic_key=topic_key,
        recommendation=recommendation,
        reason=reason,
        summary=summary,
        body_part=body_part,
    )

    return {
        "responseType": topic_key,
        "showRecordButton": topic_key in RECORDABLE_TOPIC_KEYS,
        "message": message_text,
        "reason": reason,
        "recommendation": recommendation,
        "summary": summary,
    }


def _extract_text_from_gemini_response(payload: dict[str, Any]) -> str:
    candidates = payload.get("candidates") or []
    if not candidates:
        raise ValueError("Gemini response does not contain candidates.")

    parts = (((candidates[0] or {}).get("content") or {}).get("parts")) or []
    texts = [part.get("text", "") for part in parts if isinstance(part, dict)]
    text = "\n".join(chunk for chunk in texts if chunk).strip()
    if not text:
        raise ValueError("Gemini response does not contain text.")
    return text


def _build_prompt(context: AdviceContext, summary: dict[str, Any], recent_menu_names: list[str], recent_focus: str | None) -> str:
    recent_text = ", ".join(recent_menu_names) if recent_menu_names else "なし"
    topic_key = detect_topic(context.topic, context.message)
    body_part = detect_body_part(context.topic, context.message)
    body_part_text = BODY_PART_MENUS[body_part]["label"] if body_part else "なし"
    policy = (
        "You are the AI trainer for muscloop. Answer the user's actual question first, in natural Japanese.\n"
        "Do not force every answer into a workout menu. First classify the intent, then answer.\n"
        "Return only one JSON object with responseType, showRecordButton, message, reason, and recommendation.\n"
        "Allowed responseType values: workout, today, body_part, plan, split, strength, intensity, plateau, goal_strategy, progress, data_analysis, recovery, injury, nutrition, supplement, form, motivation, app_info, privacy, general, unsafe.\n"
        "Use showRecordButton=true only when the user is asking for an actionable workout/menu that can be recorded now.\n"
        "Use showRecordButton=false for form explanations, nutrition, supplements, pain/injury, privacy, app info, motivation, goal strategy, progress analysis, data analysis, and casual questions.\n"
        "If the question is outside expected examples, still answer generally when safe. Use general or motivation instead of inventing an unsupported app feature.\n"
        "For pain, injury, diagnosis, treatment, extreme dieting, steroids, doping, or unsafe requests, do not give risky instructions; explain that you cannot determine the cause here and suggest safe alternatives or professional consultation.\n"
        "For app capability/privacy questions, only say what muscloop currently supports. Do not promise unavailable features.\n"
        "For data analysis, distinguish known workout records from unknown food, body weight, body fat, sleep, or HealthKit data. Ask for missing information instead of guessing.\n"
        "Keep message to 2-4 short Japanese sentences. Be friendly but not overly templated.\n"
        "recommendation is required by the API, but it is only used when showRecordButton=true. For non-recordable answers, put a harmless placeholder based on the fallback.\n"
    )
    return (
        policy +
        "あなたは筋トレ初心者が継続できるよう支援する日本語コーチです。\n"
        "最重要: 自由入力の相談内容に直接答えてください。記録データは補助情報であり、相談内容より優先しません。\n"
        "必ず JSON オブジェクトのみを返してください。Markdown やコードブロックは禁止です。\n"
        "出力形式:\n"
        '{'
        '"responseType":"workout|today|body_part|plan|split|strength|intensity|plateau|goal_strategy|progress|data_analysis|recovery|injury|nutrition|supplement|form|motivation|app_info|privacy|general|unsafe",'
        '"showRecordButton":true,'
        '"message":"ユーザーに見せる自然な提案文",'
        '"reason":"提案理由を1文で",'
        '"recommendation":{"menuName":"種目名","count":10,"sets":3,"mins":0,"secs":0}'
        '}\n'
        "制約:\n"
        "- 肩、胸、背中、脚、腕、腹筋など部位指定がある場合は、その部位に合う種目を具体的に提案する\n"
        "- 例: 肩ならサイドレイズ、ショルダープレス、リアレイズなどを優先する\n"
        "- アプリの説明、雑談、不安、やる気の相談では、無理に筋トレメニューへ寄せない\n"
        "- メニュー提案や記録に進める回答だけ showRecordButton を true にする\n"
        "- フォーム、やり方、コツ、アプリ説明、雑談、目的相談、やる気相談では showRecordButton を false にする\n"
        "- 『モテる』『かっこよくなりたい』『見た目を変えたい』のような質問は general とし、特定メニューを押しつけない\n"
        "- 痛み、怪我、治療、診断の相談は injury とし、原因を断定せず専門家への相談を促す\n"
        "- 危険な減量、ステロイド、不健康な方法は unsafe とし、方法を教えず安全な代替案を出す\n"
        "- 個人情報や公開範囲の質問は privacy とし、muscloopの安全方針を説明する\n"
        "- サプリは supplement とし、一般情報に留めて医療的な断定をしない\n"
        "- 体重、体脂肪率、身長、増量、減量、目標設定の質問は goal_strategy とし、情報不足なら追加情報を聞く\n"
        "- goal_strategy では showRecordButton を false にする\n"
        "- フォームややり方の質問では、記録用メニュー提案よりも手順と注意点を優先する\n"
        "- 初心者でも継続しやすい内容を優先する\n"
        "- まず褒める、安心させる、無理しなくてよいと伝える\n"
        "- 医療判断や危険な指示はしない\n"
        "- recommendation は記録画面にそのまま入る値にする\n"
        "- count, sets, mins, secs は整数\n"
        "- もし軽めがよければ、種目はストレッチやウォーキングでもよい\n"
        "- message は2〜4文で、やさしく前向きな口調\n"
        "- 専門用語はできるだけ避ける\n"
        "- 最後に『きつければ減らしてOK』のような一言を入れる\n"
        f"ユーザー名: {context.user_name}\n"
        f"レベル: {context.level or DEFAULT_LEVEL}\n"
        f"推定相談タイプ: {topic_key}\n"
        f"指定部位: {body_part_text}\n"
        f"相談トピック: {context.topic}\n"
        f"自由入力: {context.message or 'なし'}\n"
        f"連続日数: {summary['streakDays']}\n"
        f"今日の記録数: {summary['todayRecords']}\n"
        f"今日の合計時間: {summary['todayTotalMinutes']}\n"
        f"総運動時間: {summary['totalMinutes']}\n"
        f"最近のメニュー: {recent_text}\n"
        f"直近の傾向: {recent_focus or '不明'}\n"
    )


def _parse_llm_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("Gemini response is not valid JSON.")

    return json.loads(cleaned[start : end + 1])


def _coerce_int(value: Any, default: int, minimum: int, maximum: int) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        number = default
    return max(minimum, min(maximum, number))


def _sanitize_advice_payload(payload: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    recommendation = payload.get("recommendation") if isinstance(payload, dict) else None
    fallback_recommendation = fallback["recommendation"]

    safe_recommendation = {
        "menuName": str((recommendation or {}).get("menuName") or fallback_recommendation["menuName"]).strip()
        or fallback_recommendation["menuName"],
        "count": _coerce_int((recommendation or {}).get("count"), fallback_recommendation["count"], 0, 100000),
        "sets": _coerce_int((recommendation or {}).get("sets"), fallback_recommendation["sets"], 1, 100),
        "mins": _coerce_int((recommendation or {}).get("mins"), fallback_recommendation["mins"], 0, 1440),
        "secs": _coerce_int((recommendation or {}).get("secs"), fallback_recommendation["secs"], 0, 59),
    }

    message = str(payload.get("message") or fallback["message"]).strip() or fallback["message"]
    reason = str(payload.get("reason") or fallback["reason"]).strip() or fallback["reason"]
    fallback_response_type = str(fallback.get("responseType") or "workout").strip() or "workout"
    response_type = str(payload.get("responseType") or fallback_response_type).strip() or fallback_response_type
    if response_type not in ALLOWED_RESPONSE_TYPES:
        response_type = "general"

    if fallback_response_type in SERVER_FORCED_RESPONSE_TYPES:
        response_type = fallback_response_type
        show_record_button = False
    else:
        show_record_button = payload.get("showRecordButton", fallback.get("showRecordButton", True))
        if not isinstance(show_record_button, bool):
            show_record_button = bool(fallback.get("showRecordButton", True))
        show_record_button = show_record_button and response_type in RECORDABLE_TOPIC_KEYS

    return {
        "responseType": response_type,
        "showRecordButton": show_record_button,
        "message": message,
        "reason": reason,
        "recommendation": safe_recommendation,
        "summary": fallback["summary"],
    }


def _load_local_env_once() -> None:
    global _ENV_LOADED
    if _ENV_LOADED:
        return

    env_path = Path(__file__).resolve().parents[2] / ".env"
    if env_path.exists():
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

    _ENV_LOADED = True


def _call_gemini_model(*, api_key: str, model_name: str, prompt: str) -> dict[str, Any]:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{parse.quote(model_name)}:generateContent?key={parse.quote(api_key)}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "responseMimeType": "application/json",
        },
    }

    req = request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Gemini API request failed: {exc.code} {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Gemini API network error: {exc.reason}") from exc

    return json.loads(raw)


def _call_gemini(prompt: str) -> dict[str, Any]:
    _load_local_env_once()
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    primary_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
    fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash-lite").strip()

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")

    model_names = [primary_model]
    if fallback_model and fallback_model not in model_names:
        model_names.append(fallback_model)

    errors: list[str] = []
    for model_name in model_names:
        try:
            return _call_gemini_model(api_key=api_key, model_name=model_name, prompt=prompt)
        except RuntimeError as exc:
            errors.append(f"{model_name}: {exc}")

    raise RuntimeError("Gemini API request failed for all models. " + " | ".join(errors))


def build_ai_advice(
    *,
    user_name: str,
    level: str | None,
    topic: str,
    message: str | None,
    records: list[dict[str, Any]],
) -> dict[str, Any]:
    context = AdviceContext(
        user_name=user_name,
        level=level,
        topic=topic,
        message=message,
        records=records,
    )
    fallback = _fallback_ai_advice(context)

    try:
        summary = fallback["summary"]
        recent_menu_names = summary["recentMenus"]
        recent_focus = infer_recent_focus([format_record(record) for record in records])
        prompt = _build_prompt(context, summary, recent_menu_names, recent_focus)
        gemini_response = _call_gemini(prompt)
        llm_text = _extract_text_from_gemini_response(gemini_response)
        llm_payload = _parse_llm_json(llm_text)
        return _sanitize_advice_payload(llm_payload, fallback)
    except Exception as exc:
        print(f"Gemini advice fallback activated: {exc}")
        return fallback
