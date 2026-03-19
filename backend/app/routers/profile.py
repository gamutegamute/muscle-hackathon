from fastapi import APIRouter, HTTPException
from app.schemas.profile import ProfileCreate
from datetime import datetime
from app.firebase import db

router = APIRouter(prefix="/profile", tags=["profile"])


# --- DB操作 ---
def save_user(user_id: str, data: dict):
    db.collection("users").document(user_id).set(data)


def get_user(user_id: str):
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None


# --- API ---
@router.post("")
def create_profile(profile: ProfileCreate):
    data = profile.model_dump()

    user_data = {
        "userId": data["userId"],
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
        raise HTTPException(status_code=404, detail="user not found")

    return {
        **data,
        "userId": user_id
    }