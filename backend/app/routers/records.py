from fastapi import APIRouter
from app.schemas.record import RecordCreate
from datetime import datetime
from app.firebase import db
from collections import defaultdict
from fastapi import APIRouter, HTTPException


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

def get_record_by_id(record_id: str):
    doc = db.collection("records").document(record_id).get()
    return doc.to_dict() if doc.exists else None


def update_record(record_id: str, data: dict):
    db.collection("records").document(record_id).update(data)


def delete_record(record_id: str):
    db.collection("records").document(record_id).delete()


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

    formatted.sort(
        key=lambda r: r.get("createdAt") or "",
        reverse=True
    )

    daily_map = defaultdict(float)
    menu_map = defaultdict(int)

    for r in formatted:
        if r["date"]:
            daily_map[r["date"]] += float(r.get("minutes") or 0)

        menu = r.get("menuName")
        if menu:
            menu_map[menu] += int(r.get("count") or 0)

    daily_records = [
        {"date": date, "minutes": minutes}
        for date, minutes in sorted(daily_map.items())
    ]

    menu_summary = [
        {"menuName": menu_name, "totalCount": total_count}
        for menu_name, total_count in menu_map.items()
    ]

    latest_record = formatted[0]["createdAt"] if formatted else None

    return {
        "userId": user_id,
        "totalMinutes": sum(r.get("minutes", 0) or 0 for r in formatted),
        "totalRecords": len(formatted),
        "latestRecord": latest_record,
        "dailyRecords": daily_records,
        "menuSummary": menu_summary
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

@router.patch("/{record_id}")
def update_record_by_id(record_id: str, record: dict):
    existing_record = get_record_by_id(record_id)

    if not existing_record:
        raise HTTPException(status_code=404, detail="record not found")

    update_data = {}

    for key in ["menuName", "count", "duration", "memo", "type"]:
        if key in record:
            update_data[key] = record[key]

    if "count" in update_data:
        update_data["count"] = int(update_data["count"] or 0)

    if "duration" in update_data:
        update_data["duration"] = float(update_data["duration"] or 0)

    update_data["updatedAt"] = datetime.utcnow()

    update_record(record_id, update_data)

    updated_record = get_record_by_id(record_id)

    return {
        "message": "record updated",
        "recordId": record_id,
        "data": format_record(updated_record)
    }

@router.delete("/{record_id}")
def delete_record_by_id(record_id: str):
    existing_record = get_record_by_id(record_id)

    if not existing_record:
        raise HTTPException(status_code=404, detail="record not found")

    delete_record(record_id)

    return {
        "message": "record deleted",
        "recordId": record_id
    }