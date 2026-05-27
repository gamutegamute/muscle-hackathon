from datetime import datetime
import re

from fastapi import APIRouter, Depends, HTTPException

from app.auth import CurrentUser, get_current_user_optional, is_guest_user_id, resolve_user_id
from app.firebase import db
from app.schemas.profile import ProfileCreate
from app.schemas.profile_update import ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


def normalize_friend_id(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9_]", "", value).lower()
    return normalized[:30]


def generate_default_friend_id(user_id: str, name: str | None = None) -> str:
    name_part = normalize_friend_id(name or "")
    uid_part = normalize_friend_id(user_id)[-8:] or "user"
    if name_part and len(name_part) >= 3:
        return f"{name_part[:16]}_{uid_part}"[:30]
    return f"mlp_{uid_part}"[:30]


def assert_unique_friend_id(friend_id: str, user_id: str):
    docs = db.collection("users").where("friendId", "==", friend_id).limit(1).stream()
    for doc in docs:
        if doc.id != user_id:
            raise HTTPException(status_code=409, detail="friendId already exists")


def save_user(user_id: str, data: dict):
    db.collection("users").document(user_id).set(data)


def get_user(user_id: str):
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None


def update_user(user_id: str, data: dict):
    db.collection("users").document(user_id).update(data)


def delete_guest_user_data(user_id: str) -> int:
    deleted_records = 0
    docs = db.collection("records").where("userId", "==", user_id).stream()
    for doc in docs:
        doc.reference.delete()
        deleted_records += 1

    db.collection("users").document(user_id).delete()
    return deleted_records


@router.post("")
def create_profile(profile: ProfileCreate, current_user: CurrentUser = Depends(get_current_user_optional)):
    data = profile.model_dump()
    user_id = resolve_user_id(data["userId"], current_user)
    friend_id = normalize_friend_id(data.get("friendId") or "") or generate_default_friend_id(user_id, data["name"])
    assert_unique_friend_id(friend_id, user_id)

    user_data = {
        "userId": user_id,
        "friendId": friend_id,
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

    save_user(user_id, user_data)

    return {"message": "profile saved", "data": user_data}


@router.get("/{user_id}")
def get_profile(user_id: str, current_user: CurrentUser = Depends(get_current_user_optional)):
    resolved_user_id = resolve_user_id(user_id, current_user)
    data = get_user(resolved_user_id)

    if not data:
        raise HTTPException(status_code=404, detail="user not found")

    friend_id = data.get("friendId") or generate_default_friend_id(resolved_user_id, data.get("name"))
    if not data.get("friendId"):
        update_user(resolved_user_id, {"friendId": friend_id, "updatedAt": datetime.utcnow()})

    return {**data, "userId": resolved_user_id, "friendId": friend_id}


@router.patch("/{user_id}")
def update_profile(user_id: str, profile: ProfileUpdate, current_user: CurrentUser = Depends(get_current_user_optional)):
    resolved_user_id = resolve_user_id(user_id, current_user)
    existing_user = get_user(resolved_user_id)

    if not existing_user:
        raise HTTPException(status_code=404, detail="user not found")

    update_data = profile.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="no profile fields to update")

    if "friendId" in update_data and update_data["friendId"] is not None:
        update_data["friendId"] = normalize_friend_id(update_data["friendId"])
        if len(update_data["friendId"]) < 3:
            raise HTTPException(status_code=400, detail="friendId must be at least 3 characters")
        assert_unique_friend_id(update_data["friendId"], resolved_user_id)

    update_data["updatedAt"] = datetime.utcnow()
    update_user(resolved_user_id, update_data)

    return {
        "message": "profile updated",
        "userId": resolved_user_id,
        "updated": update_data,
    }


@router.delete("/guest/{user_id}")
def delete_guest_profile(user_id: str, current_user: CurrentUser = Depends(get_current_user_optional)):
    resolved_user_id = resolve_user_id(user_id, current_user)

    if not is_guest_user_id(resolved_user_id):
        raise HTTPException(status_code=400, detail="only guest user data can be deleted here")

    deleted_records = delete_guest_user_data(resolved_user_id)
    return {
        "message": "guest data deleted",
        "userId": resolved_user_id,
        "deletedRecords": deleted_records,
    }
