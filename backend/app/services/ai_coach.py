from __future__ import annotations

from typing import Any

from app.services.records_summary import build_records_summary, format_record


LEVEL_DEFAULTS = {
    "初心者（これから始める）": {
        "today": {"menuName": "膝つき腕立て", "count": 10, "sets": 2, "mins": 0, "secs": 0},
        "recovery": {"menuName": "ストレッチ", "count": 1, "sets": 1, "mins": 5, "secs": 0},
        "nutrition": {"menuName": "クランチ", "count": 15, "sets": 2, "mins": 0, "secs": 0},
        "plateau": {"menuName": "プランク", "count": 1, "sets": 2, "mins": 1, "secs": 0},
        "split": {"menuName": "スクワット", "count": 12, "sets": 2, "mins": 0, "secs": 0},
        "strength": {"menuName": "腕立て伏せ", "count": 12, "sets": 3, "mins": 0, "secs": 0},
        "intensity": {"menuName": "ランジ", "count": 10, "sets": 2, "mins": 0, "secs": 0},
        "free": {"menuName": "ウォーキング", "count": 1, "sets": 1, "mins": 10, "secs": 0},
    },
    "中級者（週1〜2回）": {
        "today": {"menuName": "スクワット", "count": 15, "sets": 3, "mins": 0, "secs": 0},
        "recovery": {"menuName": "ストレッチ", "count": 1, "sets": 1, "mins": 8, "secs": 0},
        "nutrition": {"menuName": "クランチ", "count": 20, "sets": 3, "mins": 0, "secs": 0},
        "plateau": {"menuName": "プランク", "count": 1, "sets": 3, "mins": 1, "secs": 0},
        "split": {"menuName": "チンニング", "count": 10, "sets": 3, "mins": 0, "secs": 0},
        "strength": {"menuName": "デッドリフト", "count": 5, "sets": 5, "mins": 0, "secs": 0},
        "intensity": {"menuName": "ベンチプレス", "count": 12, "sets": 4, "mins": 0, "secs": 0},
        "free": {"menuName": "プランク", "count": 1, "sets": 3, "mins": 1, "secs": 0},
    },
    "上級者（ガチ勢🔥）": {
        "today": {"menuName": "バーベルスクワット", "count": 10, "sets": 5, "mins": 0, "secs": 0},
        "recovery": {"menuName": "アクティブレスト", "count": 1, "sets": 1, "mins": 12, "secs": 0},
        "nutrition": {"menuName": "クランチ", "count": 25, "sets": 4, "mins": 0, "secs": 0},
        "plateau": {"menuName": "プランク", "count": 1, "sets": 4, "mins": 1, "secs": 30},
        "split": {"menuName": "チンニング", "count": 12, "sets": 4, "mins": 0, "secs": 0},
        "strength": {"menuName": "デッドリフト", "count": 5, "sets": 5, "mins": 0, "secs": 0},
        "intensity": {"menuName": "ベンチプレス", "count": 12, "sets": 4, "mins": 0, "secs": 0},
        "free": {"menuName": "ブルガリアンスクワット", "count": 12, "sets": 3, "mins": 0, "secs": 0},
    },
}

UPPER_BODY_KEYWORDS = ("腕立て", "ベンチ", "チンニング", "懸垂", "ショルダー", "プレス", "ロー", "プル")
LOWER_BODY_KEYWORDS = ("スクワット", "ランジ", "デッド", "ヒップ", "カーフ")


def _normalize_text(value: str | None) -> str:
    return (value or "").strip().lower()


def detect_topic(topic: str, message: str | None) -> str:
    text = f"{topic} {message or ''}"
    normalized = _normalize_text(text)

    if "筋肉痛" in normalized or "痛" in normalized or "疲" in normalized:
        return "recovery"
    if "停滞" in normalized:
        return "plateau"
    if "分割" in normalized:
        return "split"
    if "max" in normalized or "重量" in normalized or "高重量" in normalized:
        return "strength"
    if "追い込み" in normalized or "限界" in normalized:
        return "intensity"
    if "プロテイン" in normalized or "食事" in normalized or "栄養" in normalized:
        return "nutrition"
    if "今日" in normalized or "メニュー" in normalized:
        return "today"
    return "free"


def infer_recent_focus(records: list[dict[str, Any]]) -> str | None:
    recent_names = [str(record.get("menuName") or "") for record in records[:3]]
    upper_hits = sum(1 for name in recent_names if any(keyword in name for keyword in UPPER_BODY_KEYWORDS))
    lower_hits = sum(1 for name in recent_names if any(keyword in name for keyword in LOWER_BODY_KEYWORDS))

    if upper_hits > lower_hits and upper_hits > 0:
        return "upper"
    if lower_hits > upper_hits and lower_hits > 0:
        return "lower"
    return None


def choose_menu(level: str | None, topic_key: str, recent_focus: str | None) -> dict[str, Any]:
    preset = LEVEL_DEFAULTS.get(level or "", LEVEL_DEFAULTS["中級者（週1〜2回）"])
    menu = dict(preset.get(topic_key, preset["free"]))

    if topic_key == "today":
        if recent_focus == "lower":
            menu = {"menuName": "チンニング", "count": 10, "sets": max(menu["sets"], 3), "mins": 0, "secs": 0}
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
) -> str:
    if topic_key == "recovery":
        return f"{user_name}さんは最近もしっかり動けているので、今日は回復を優先して次につながるメニューにしています。"
    if topic_key == "plateau":
        return "最近の流れを見ると刺激が固定されやすそうなので、いつもと少し違う負荷を入れる提案にしています。"
    if topic_key == "split":
        if recent_focus == "upper":
            return "直近は上半身寄りなので、今日は下半身か体幹に寄せてバランスを取るのがおすすめです。"
        if recent_focus == "lower":
            return "直近は下半身寄りなので、今日は上半身に寄せて全身のバランスを整える提案です。"
        return "分割法は部位の偏りを作らないのが大事なので、最近の記録を見ながら偏りにくい提案にしています。"
    if topic_key == "nutrition":
        return "食事の相談でも、軽く体を動かしてから栄養を入れると流れを作りやすいので、短めメニューを添えています。"
    if today_records > 0:
        return f"今日はすでに{today_records}件記録できているので、やり過ぎになりにくい内容に寄せています。"
    if streak_days >= 3:
        return f"{streak_days}日続けられていて良い流れなので、継続しやすさを優先した提案にしています。"
    if recent_menu_names:
        recent_text = "、".join(recent_menu_names[:2])
        return f"最近は {recent_text} に取り組んでいるので、偏りすぎないようにメニューを選びました。"
    return "まずは無理なく続けやすい内容から始めるのがいちばんなので、取り組みやすいメニューを選んでいます。"


def build_message(
    *,
    user_name: str,
    topic_key: str,
    recommendation: dict[str, Any],
    reason: str,
    summary: dict[str, Any],
) -> str:
    if topic_key == "recovery":
        opener = f"{user_name}さん、今日は無理に追い込まず整える日にしましょう。"
    elif topic_key == "nutrition":
        opener = f"{user_name}さん、栄養の相談いいですね。"
    elif topic_key == "plateau":
        opener = f"{user_name}さん、停滞期っぽさがあるなら刺激を変えてみましょう。"
    elif topic_key == "strength":
        opener = f"{user_name}さん、今日は出力を意識したメニューが合いそうです。"
    else:
        opener = f"{user_name}さん、今日の流れならこのメニューがおすすめです。"

    menu_text = (
        f"{recommendation['menuName']}を"
        f"{recommendation['count']}回 × {recommendation['sets']}セット"
    )
    if recommendation["mins"] or recommendation["secs"]:
        menu_text = (
            f"{recommendation['menuName']}を"
            f"{recommendation['mins']}分"
            + (f"{recommendation['secs']}秒" if recommendation["secs"] else "")
            + f" × {recommendation['sets']}セット"
        )

    status = (
        f"現在は累計{summary['totalMinutes']}分、"
        f"連続{summary['streakDays']}日、"
        f"今日の記録は{summary['todayRecords']}件です。"
    )

    return f"{opener}\nおすすめは {menu_text} です。\n{reason}\n{status}"


def build_ai_advice(
    *,
    user_name: str,
    level: str | None,
    topic: str,
    message: str | None,
    records: list[dict[str, Any]],
) -> dict[str, Any]:
    summary = build_records_summary("guest", records)
    formatted_records = [format_record(record) for record in records]
    formatted_records.sort(key=lambda record: record.get("createdAt") or "", reverse=True)

    recent_focus = infer_recent_focus(formatted_records)
    topic_key = detect_topic(topic, message)
    recommendation = choose_menu(level, topic_key, recent_focus)
    recent_menu_names = [record["menuName"] for record in formatted_records[:3] if record.get("menuName")]

    advice_summary = {
        "streakDays": summary["streakDays"],
        "totalMinutes": summary["totalMinutes"],
        "todayRecords": summary["todayRecords"],
        "todayTotalMinutes": summary["todayTotalMinutes"],
        "recentMenus": recent_menu_names,
    }
    reason = build_reason(
        user_name=user_name,
        topic_key=topic_key,
        streak_days=advice_summary["streakDays"],
        today_records=advice_summary["todayRecords"],
        recent_menu_names=recent_menu_names,
        recent_focus=recent_focus,
    )
    message_text = build_message(
        user_name=user_name,
        topic_key=topic_key,
        recommendation=recommendation,
        reason=reason,
        summary=advice_summary,
    )

    return {
        "message": message_text,
        "reason": reason,
        "recommendation": recommendation,
        "summary": advice_summary,
    }
