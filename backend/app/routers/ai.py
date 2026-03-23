from fastapi import APIRouter

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
def get_advice(request: AdviceRequest):
    profile = get_user(request.userId) or {}
    records = get_user_records(request.userId)
    user_name = profile.get("name") or "あなた"

    return build_ai_advice(
        user_name=user_name,
        level=request.level,
        topic=request.topic,
        message=request.message,
        records=records,
    )
