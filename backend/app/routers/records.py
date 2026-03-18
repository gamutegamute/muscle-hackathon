from fastapi import APIRouter
from app.schemas.record import RecordCreate
from datetime import datetime
import uuid

router = APIRouter(prefix="/records", tags=["records"])

# 仮DB
fake_records_db = []


# --- DB操作（あとでFirestoreに差し替える） ---
def save_record(data: dict):
    fake_records_db.append(data)


def get_user_records(user_id: str):
    return [r for r in fake_records_db if r["userId"] == user_id]


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