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


def update_user(user_id: str, data: dict):
    db.collection("users").document(user_id).update(data)


# --- API ---

# 作成
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


# 取得
@router.get("/{user_id}")
def get_profile(user_id: str):
    data = get_user(user_id)

    if not data:
        raise HTTPException(status_code=404, detail="user not found")

    return {
        **data,
        "userId": user_id
    }


# 更新（←今回追加）
@router.patch("/{user_id}")
def update_profile(user_id: str, profile: dict):
    existing_user = get_user(user_id)

    if not existing_user:
        raise HTTPException(status_code=404, detail="user not found")

    # 更新可能なフィールドだけ上書き
    update_data = {}

    for key in ["name", "age", "height", "weight", "bodyFat"]:
        if key in profile:
            update_data[key] = profile[key]

    # 更新日時つける
    update_data["updatedAt"] = datetime.utcnow()

    update_user(user_id, update_data)

    return {
        "message": "profile updated",
        "userId": user_id,
        "updated": update_data
    }