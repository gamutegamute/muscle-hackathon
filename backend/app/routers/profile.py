from fastapi import APIRouter
from app.schemas.profile import ProfileCreate
from datetime import datetime

router = APIRouter(prefix="/profile", tags=["profile"])

from app.firebase import db

def save_user(user_id: str, data: dict):
    db.collection("users").document(user_id).set(data)

def get_user(user_id: str):
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None


@router.post("")
def create_profile(profile: ProfileCreate):
    data = profile.model_dump()

    user_data = {
        "userId": data["userId"],  # ← 追加
        "name": data["name"],
        "age": data["age"],
        "height": data["height"],
        "weight": data["weight"],
        "bodyFat": data["bodyFat"],
        "createdAt": datetime.utcnow()
    }

    save_user(data["userId"], user_data)

    return {
        "message": "profile saved",
        "data": user_data
    }


@router.get("/{user_id}")
def get_profile(user_id: str):
    data = get_user(user_id)

    if not data:
        return {"error": "user not found"}

    return {
        **data,
        "userId": user_id
    }