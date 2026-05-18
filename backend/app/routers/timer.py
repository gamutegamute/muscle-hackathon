from fastapi import APIRouter, Depends
from firebase_admin import firestore

from app.auth import CurrentUser, get_current_user_optional, resolve_user_id
from app.firebase import db
from app.schemas.record import RecordCreate
from app.services.records_summary import format_record

router = APIRouter(prefix="/timers", tags=["timers"])


def update_user_last_activity(user_id: str):
    db.collection("users").document(user_id).set(
        {
            "lastActivity": firestore.SERVER_TIMESTAMP,
            "lastActivityDate": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )


@router.post("")
def create_timer_record(record: RecordCreate, current_user: CurrentUser = Depends(get_current_user_optional)):
    data = record.model_dump()
    user_id = resolve_user_id(data["userId"], current_user)

    timer_data = {
        "userId": user_id,
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
    update_user_last_activity(user_id)

    return {"message": "timer record saved", "data": format_record(persisted_data)}
