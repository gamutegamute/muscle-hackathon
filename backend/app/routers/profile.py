from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.firebase import db
from app.schemas.profile import ProfileCreate
from app.schemas.profile_update import ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


def save_user(user_id: str, data: dict):
    db.collection("users").document(user_id).set(data)


def get_user(user_id: str):
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None


def update_user(user_id: str, data: dict):
    db.collection("users").document(user_id).update(data)


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
        "expoPushToken": data.get("expoPushToken"),
        "avatar": data.get("avatar"),
        "themeColor": data.get("themeColor"),
        "equippedBadge": data.get("equippedBadge"),
        "isVibrationEnabled": data.get("isVibrationEnabled"),
        "createdAt": datetime.utcnow(),
    }

    save_user(data["userId"], user_data)

    return {"message": "profile saved", "data": user_data}


@router.get("/{user_id}")
def get_profile(user_id: str):
    data = get_user(user_id)

    if not data:
        raise HTTPException(status_code=404, detail="user not found")

    return {**data, "userId": user_id}


@router.patch("/{user_id}")
def update_profile(user_id: str, profile: ProfileUpdate):
    existing_user = get_user(user_id)

    if not existing_user:
        raise HTTPException(status_code=404, detail="user not found")

    update_data = profile.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="no profile fields to update")

    update_data["updatedAt"] = datetime.utcnow()
    update_user(user_id, update_data)

    return {
        "message": "profile updated",
        "userId": user_id,
        "updated": update_data,
    }
