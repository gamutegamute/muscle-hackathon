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

    if any(keyword in normalized for keyword in ("疲れ", "だるい", "休み", "回復", "筋肉痛")):
        return "recovery"
    if any(keyword in normalized for keyword in ("停滞", "伸びない", "マンネリ", "plateau")):
        return "plateau"
    if any(keyword in normalized for keyword in ("部位", "分割", "split")):
        return "split"
    if any(keyword in normalized for keyword in ("max", "重量", "高重量", "筋力")):
        return "strength"
    if any(keyword in normalized for keyword in ("きつめ", "追い込み", "強度", "ハード")):
        return "intensity"
    if any(keyword in normalized for keyword in ("食事", "栄養", "protein", "たんぱく")):
        return "nutrition"
    if any(keyword in normalized for keyword in ("今日", "メニュー", "おすすめ", "何やる")):
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
) -> str:
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
    recommendation = choose_menu(context.level, topic_key, recent_focus)
    reason = build_reason(
        user_name=context.user_name,
        topic_key=topic_key,
        streak_days=summary["streakDays"],
        today_records=summary["todayRecords"],
        recent_menu_names=recent_menu_names,
        recent_focus=recent_focus,
    )
    message_text = build_message(
        user_name=context.user_name,
        topic_key=topic_key,
        recommendation=recommendation,
        reason=reason,
        summary=summary,
    )

    return {
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
    return (
        "あなたは筋トレ初心者が継続できるよう支援する日本語コーチです。\n"
        "必ず JSON オブジェクトのみを返してください。Markdown やコードブロックは禁止です。\n"
        "出力形式:\n"
        '{'
        '"message":"ユーザーに見せる自然な提案文",'
        '"reason":"提案理由を1文で",'
        '"recommendation":{"menuName":"種目名","count":10,"sets":3,"mins":0,"secs":0}'
        '}\n'
        "制約:\n"
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

    return {
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


def _call_gemini(prompt: str) -> dict[str, Any]:
    _load_local_env_once()
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set.")

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
