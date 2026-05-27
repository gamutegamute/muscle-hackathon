from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore

from app.auth import CurrentUser, assert_record_owner, get_current_user_optional, resolve_user_id
from app.firebase import db
from app.schemas.record import RecordCreate
from app.schemas.record_update import RecordUpdate
from app.services.records_summary import JST, build_records_summary, format_record

router = APIRouter(prefix="/records", tags=["records"])


def save_record(data: dict):
    doc_ref = db.collection("records").document()
    persisted_data = {**data, "recordId": doc_ref.id}
    doc_ref.set(persisted_data)
    return persisted_data


def get_user_records(user_id: str):
    docs = db.collection("records").where("userId", "==", user_id).stream()
    return [doc.to_dict() for doc in docs]


def get_record_by_id(record_id: str):
    doc = db.collection("records").document(record_id).get()
    return doc.to_dict() if doc.exists else None


def update_record(record_id: str, data: dict):
    db.collection("records").document(record_id).update(data)


def delete_record(record_id: str):
    db.collection("records").document(record_id).delete()


def update_user_last_activity(user_id: str):
    db.collection("users").document(user_id).set(
        {
            "lastActivity": firestore.SERVER_TIMESTAMP,
            "lastActivityDate": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )


@router.post("")
def create_record(record: RecordCreate, current_user: CurrentUser = Depends(get_current_user_optional)):
    data = record.model_dump()
    user_id = resolve_user_id(data["userId"], current_user)

    record_data = {
        "userId": user_id,
        "menuName": data["menuName"],
        "count": data["count"],
        "duration": data.get("duration"),
        "interval": data.get("interval"),
        "rounds": data.get("rounds"),
        "memo": data.get("memo"),
        "type": "normal",
        "createdAt": data.get("createdAt") or datetime.utcnow(),
    }

    saved_data = save_record(record_data)
    update_user_last_activity(user_id)
    return {"message": "record saved", "data": format_record(saved_data)}


@router.get("/summary/{user_id}")
def get_records_summary(user_id: str, current_user: CurrentUser = Depends(get_current_user_optional)):
    resolved_user_id = resolve_user_id(user_id, current_user)
    return build_records_summary(resolved_user_id, get_user_records(resolved_user_id))


@router.get("/today/{user_id}")
def get_today_records(user_id: str, current_user: CurrentUser = Depends(get_current_user_optional)):
    resolved_user_id = resolve_user_id(user_id, current_user)
    today_str = datetime.now(JST).date().isoformat()
    records = [format_record(record) for record in get_user_records(resolved_user_id)]
    today_records = [record for record in records if record.get("date") == today_str]
    today_records.sort(key=lambda record: record.get("createdAt") or "", reverse=True)

    return {
        "userId": resolved_user_id,
        "date": today_str,
        "totalRecords": len(today_records),
        "totalMinutes": round(sum(record.get("minutes", 0) or 0 for record in today_records), 1),
        "records": today_records,
    }


@router.get("/{user_id}")
def get_records(user_id: str, current_user: CurrentUser = Depends(get_current_user_optional)):
    resolved_user_id = resolve_user_id(user_id, current_user)
    records = [format_record(record) for record in get_user_records(resolved_user_id)]
    records.sort(key=lambda record: record.get("createdAt") or "", reverse=True)

    return {"userId": resolved_user_id, "totalRecords": len(records), "records": records}


@router.patch("/{record_id}")
def update_record_by_id(
    record_id: str,
    record: RecordUpdate,
    current_user: CurrentUser = Depends(get_current_user_optional),
):
    existing_record = get_record_by_id(record_id)

    if not existing_record:
        raise HTTPException(status_code=404, detail="record not found")
    assert_record_owner(existing_record, current_user)

    update_data = record.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="no record fields to update")

    update_data["updatedAt"] = datetime.utcnow()
    update_record(record_id, update_data)

    updated_record = get_record_by_id(record_id)
    return {
        "message": "record updated",
        "recordId": record_id,
        "data": format_record(updated_record),
    }


@router.delete("/{record_id}")
def delete_record_by_id(record_id: str, current_user: CurrentUser = Depends(get_current_user_optional)):
    existing_record = get_record_by_id(record_id)

    if not existing_record:
        raise HTTPException(status_code=404, detail="record not found")
    assert_record_owner(existing_record, current_user)

    delete_record(record_id)
    return {"message": "record deleted", "recordId": record_id}
