from fastapi import APIRouter
from app.schemas.profile import ProfileCreate
from datetime import datetime

router = APIRouter(prefix="/profile", tags=["profile"])

# 仮DB（Firestoreの代わり）
fake_users_db = {}


def save_user(user_id: str, data: dict):
    fake_users_db[user_id] = data


def get_user(user_id: str):
    return fake_users_db.get(user_id)


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