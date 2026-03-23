from fastapi import APIRouter
from app.schemas.record import RecordCreate
from datetime import datetime
from app.firebase import db
from collections import defaultdict

router = APIRouter(prefix="/records", tags=["records"])


def save_record(data: dict):
    doc_ref = db.collection("records").document()
    data["recordId"] = doc_ref.id
    doc_ref.set(data)
    return data


def get_user_records(user_id: str):
    docs = db.collection("records").where("userId", "==", user_id).stream()
    return [doc.to_dict() for doc in docs]


def to_iso(dt):
    if dt is None:
        return None
    if hasattr(dt, "isoformat"):
        return dt.isoformat()
    return str(dt)


def format_record(record: dict):
    created_at = record.get("createdAt")
    created_at_iso = to_iso(created_at)

    date_str = None
    if created_at_iso:
        date_str = created_at_iso[:10]

    count_value = record.get("count")
    duration_value = record.get("duration")
    memo_value = record.get("memo")
    record_type = record.get("type", "normal")

    return {
        "recordId": record.get("recordId", ""),
        "userId": record.get("userId", ""),
        "menuName": record.get("menuName", ""),
        "count": int(count_value or 0),
        "duration": float(duration_value or 0),
        "memo": memo_value if memo_value is not None else "",
        "createdAt": created_at_iso,
        "date": date_str,
        "minutes": float(duration_value or 0),
        "type": record_type,
    }


@router.post("")
def create_record(record: RecordCreate):
    data = record.model_dump()

    record_data = {
        "userId": data["userId"],
        "menuName": data["menuName"],
        "count": data["count"],
        "duration": data.get("duration"),
        "memo": data.get("memo"),
        "type": "normal",
        "createdAt": datetime.utcnow()
    }

    saved_data = save_record(record_data)

    return {
        "message": "record saved",
        "data": saved_data
    }


@router.get("/summary/{user_id}")
def get_records_summary(user_id: str):
    records = get_user_records(user_id)
    formatted = [format_record(r) for r in records]

    daily_map = defaultdict(float)
    for r in formatted:
        if r["date"]:
            daily_map[r["date"]] += float(r.get("minutes") or 0)

    daily_records = [
        {"date": date, "minutes": minutes}
        for date, minutes in sorted(daily_map.items())
    ]

    return {
        "userId": user_id,
        "totalMinutes": sum(r.get("minutes", 0) or 0 for r in formatted),
        "totalRecords": len(formatted),
        "dailyRecords": daily_records
    }


@router.get("/{user_id}")
def get_records(user_id: str):
    records = get_user_records(user_id)
    formatted = [format_record(r) for r in records]

    formatted.sort(
        key=lambda r: r.get("createdAt") or "",
        reverse=True
    )

    return {
        "userId": user_id,
        "totalRecords": len(formatted),
        "records": formatted
    }