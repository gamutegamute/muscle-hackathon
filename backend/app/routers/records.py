from fastapi import APIRouter
from app.schemas.record import RecordCreate
from datetime import datetime
from app.firebase import db

router = APIRouter(prefix="/records", tags=["records"])


def save_record(data: dict):
    db.collection("records").add(data)


def get_user_records(user_id: str):
    docs = db.collection("records").where("userId", "==", user_id).stream()
    return [doc.to_dict() for doc in docs]


@router.post("")
def create_record(record: RecordCreate):
    data = record.model_dump()

    record_data = {
        "userId": data["userId"],
        "menuName": data["menuName"],
        "count": data["count"],
        "duration": data.get("duration"),
        "memo": data.get("memo"),
        "createdAt": datetime.utcnow()
    }

    save_record(record_data)

    return {
        "message": "record saved",
        "data": record_data
    }


@router.get("/{user_id}")
def get_records(user_id: str):
    records = get_user_records(user_id)

    return {
        "records": records
    }


@router.get("/{user_id}")
def get_records(user_id: str):
    records = get_user_records(user_id)

    return {
        "records": records
    }