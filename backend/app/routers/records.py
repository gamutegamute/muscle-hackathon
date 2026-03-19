from fastapi import APIRouter
from app.schemas.record import RecordCreate
from datetime import datetime
import uuid

router = APIRouter(prefix="/records", tags=["records"])

from app.firebase import db

def save_record(data: dict):
    db.collection("records").add(data)

def get_user_records(user_id: str):
    docs = db.collection("records").where("userId", "==", user_id).stream()
    return [doc.to_dict() for doc in docs]


# --- API ---
@router.post("")
def create_record(record: RecordCreate):
    data = record.model_dump()

    record_data = {
        "recordId": str(uuid.uuid4()),   # 一意ID
        "userId": data["userId"],
        "menuName": data["menuName"],
        "count": data["count"],
        "duration": data.get("duration"),
        "memo": data.get("memo"),
        "createdAt": datetime.utcnow()
    }

    save_record(record_data)

    return {"message": "record saved"}


@router.get("/{user_id}")
def get_records(user_id: str):
    records = get_user_records(user_id)

    return {"records": records}