from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime, timedelta, timezone
from typing import Any


JST = timezone(timedelta(hours=9))


def ensure_datetime(value: Any) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value

    try:
        parsed = datetime.fromisoformat(str(value))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed


def to_jst_date_string(value: Any) -> str | None:
    parsed = ensure_datetime(value)
    if parsed is None:
        return None
    return parsed.astimezone(JST).date().isoformat()


def to_isoformat(value: Any) -> str | None:
    parsed = ensure_datetime(value)
    if parsed is None:
        return None
    return parsed.isoformat()


def calculate_streak_days(records: list[dict[str, Any]]) -> int:
    date_set = {
        date_str
        for record in records
        if (date_str := to_jst_date_string(record.get("createdAt")))
    }

    if not date_set:
        return 0

    current_day = datetime.now(JST).date()
    streak = 0

    while current_day.isoformat() in date_set:
        streak += 1
        current_day -= timedelta(days=1)

    return streak


def format_record(record: dict[str, Any]) -> dict[str, Any]:
    duration_seconds = float(record.get("duration") or 0)

    return {
        "recordId": record.get("recordId", ""),
        "userId": record.get("userId", ""),
        "menuName": record.get("menuName", ""),
        "count": int(record.get("count") or 0),
        "duration": duration_seconds,
        "durationSeconds": duration_seconds,
        "minutes": round(duration_seconds / 60, 1),
        "interval": float(record.get("interval") or 0),
        "rounds": int(record.get("rounds") or 1),
        "memo": record.get("memo") or "",
        "createdAt": to_isoformat(record.get("createdAt")),
        "updatedAt": to_isoformat(record.get("updatedAt")),
        "date": to_jst_date_string(record.get("createdAt")),
        "type": record.get("type", "normal"),
    }


def build_records_summary(
    user_id: str,
    records: list[dict[str, Any]],
    *,
    daily_value_key: str = "minutes",
) -> dict[str, Any]:
    formatted = [format_record(record) for record in records]
    formatted.sort(key=lambda record: record.get("createdAt") or "", reverse=True)

    daily_map: defaultdict[str, float] = defaultdict(float)
    menu_map: defaultdict[str, int] = defaultdict(int)

    today_str = datetime.now(JST).date().isoformat()
    today_total_minutes = 0.0

    for record in formatted:
        date = record.get("date")
        if date:
            increment = 1 if daily_value_key == "count" else float(record.get("minutes") or 0)
            daily_map[date] += increment

        menu_name = record.get("menuName")
        if menu_name:
            menu_map[menu_name] += int(record.get("count") or 0)

        if date == today_str:
            today_total_minutes += float(record.get("minutes") or 0)

    daily_records = []
    for date, value in sorted(daily_map.items()):
        if daily_value_key == "count":
            daily_records.append({"date": date, "count": int(value)})
        else:
            daily_records.append({"date": date, "minutes": round(value, 1)})

    menu_summary = [
        {"menuName": menu_name, "totalCount": total_count}
        for menu_name, total_count in sorted(menu_map.items())
    ]

    return {
        "userId": user_id,
        "totalMinutes": round(sum(record.get("minutes", 0) or 0 for record in formatted), 1),
        "totalRecords": len(formatted),
        "todayRecords": sum(1 for record in formatted if record.get("date") == today_str),
        "todayTotalMinutes": round(today_total_minutes, 1),
        "streakDays": calculate_streak_days(records),
        "latestRecord": formatted[0] if formatted else None,
        "dailyRecords": daily_records,
        "menuSummary": menu_summary,
    }
