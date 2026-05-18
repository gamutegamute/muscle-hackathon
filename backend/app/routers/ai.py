from fastapi import APIRouter, Depends

from app.auth import CurrentUser, get_current_user_optional, resolve_user_id
from app.firebase import db
from app.schemas.ai import AdviceRequest, AdviceResponse
from app.services.ai_coach import build_ai_advice

router = APIRouter(prefix="/ai", tags=["ai"])


def get_user(user_id: str):
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None


def get_user_records(user_id: str):
    docs = db.collection("records").where("userId", "==", user_id).stream()
    return [doc.to_dict() for doc in docs]


@router.post("/advice", response_model=AdviceResponse)
def get_advice(request_data: AdviceRequest, current_user: CurrentUser = Depends(get_current_user_optional)):
    user_id = resolve_user_id(request_data.userId, current_user)
    profile = get_user(user_id) or {}
    records = get_user_records(user_id)
    user_name = profile.get("name") or "あなた"

    return build_ai_advice(
        user_name=user_name,
        level=request_data.level,
        topic=request_data.topic,
        message=request_data.message,
        records=records,
    )
