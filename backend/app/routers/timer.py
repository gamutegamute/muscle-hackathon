from fastapi import APIRouter
from firebase_admin import firestore

from app.firebase import db
from app.schemas.record import RecordCreate
from app.services.records_summary import format_record

router = APIRouter(prefix="/timers", tags=["timers"])


@router.post("")
def create_timer_record(record: RecordCreate):
    data = record.model_dump()

    timer_data = {
        "userId": data["userId"],
        "menuName": data["menuName"],
        "count": data["count"],
        "duration": float(data.get("duration", 0)),
        "interval": float(data.get("interval", 0)),
        "rounds": int(data.get("rounds", 1)),
        "memo": data.get("memo"),
        "type": "timer",
        "createdAt": firestore.SERVER_TIMESTAMP,
    }

    doc_ref = db.collection("records").document()
    persisted_data = {**timer_data, "recordId": doc_ref.id}
    doc_ref.set(persisted_data)

    return {"message": "timer record saved", "data": format_record(persisted_data)}
