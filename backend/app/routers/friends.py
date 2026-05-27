from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from firebase_admin import firestore

from app.auth import get_current_user
from app.firebase import db
from app.routers.profile import generate_default_friend_id, update_user
from app.schemas.user import (
    FriendApproveRequest,
    FriendProfileResponse,
    FriendRejectRequest,
    FriendRequestRequest,
)
from app.services.records_summary import build_records_summary, format_record

router = APIRouter(prefix="/friends", tags=["friends"])


def get_user_doc(user_id: str) -> dict | None:
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() if doc.exists else None


def get_user_records(user_id: str) -> list[dict]:
    docs = db.collection("records").where("userId", "==", user_id).stream()
    return [doc.to_dict() for doc in docs]


def build_public_profile(user_id: str) -> FriendProfileResponse | None:
    user_data = get_user_doc(user_id)
    if not user_data:
        return None

    friend_id = user_data.get("friendId") or generate_default_friend_id(user_id, user_data.get("name"))
    if not user_data.get("friendId"):
        update_user(user_id, {"friendId": friend_id, "updatedAt": firestore.SERVER_TIMESTAMP})

    records = get_user_records(user_id)
    summary = build_records_summary(user_id, records)
    recent_records = [format_record(record) for record in records]
    recent_records.sort(key=lambda record: record.get("createdAt") or "", reverse=True)
    recent_activity = [
        f"{record.get('menuName') or 'トレーニング'} {record.get('minutes', 0)}分"
        for record in recent_records[:3]
    ]

    name = user_data.get("name") or user_data.get("displayName") or "名前なし"
    avatar = user_data.get("avatar") or user_data.get("photoURL")
    rank = user_data.get("equippedBadge") or user_data.get("rank") or ""

    return FriendProfileResponse(
        userId=user_id,
        friendId=friend_id,
        name=name,
        avatar=avatar,
        rank=rank,
        consecutiveDays=summary.get("streakDays", 0),
        totalTime=int(summary.get("totalMinutes", 0) or 0),
        achievementCount=int(user_data.get("achievementCount") or 0),
        recentActivity=recent_activity,
        displayName=name,
        photoURL=avatar,
        streakDays=summary.get("streakDays", 0),
        statusMessage=user_data.get("statusMessage", ""),
    )


@router.get("", response_model=List[FriendProfileResponse])
async def get_friends_list(current_uid: str = Depends(get_current_user)):
    try:
        friend_docs = db.collection("users").document(current_uid).collection("friends").stream()
        friend_ids = [
            doc.id
            for doc in friend_docs
            if (doc.to_dict() or {}).get("status") == "accepted"
        ]

        profiles = []
        for friend_id in friend_ids:
            profile = build_public_profile(friend_id)
            if profile:
                profiles.append(profile)
        return profiles
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get friends: {str(exc)}",
        ) from exc


@router.get("/requests", response_model=List[FriendProfileResponse])
async def get_friend_requests(current_uid: str = Depends(get_current_user)):
    try:
        request_docs = db.collection("users").document(current_uid).collection("friendRequests").stream()
        request_ids = [
            doc.id
            for doc in request_docs
            if (doc.to_dict() or {}).get("status") == "pending"
        ]

        profiles = []
        for requester_id in request_ids:
            profile = build_public_profile(requester_id)
            if profile:
                profiles.append(profile)
        return profiles
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"failed to get friend requests: {str(exc)}",
        ) from exc


@router.get("/search", response_model=List[FriendProfileResponse])
async def search_users(
    query: str = Query(min_length=3, max_length=100),
    current_uid: str = Depends(get_current_user),
):
    normalized_query = query.strip().lower()
    if not normalized_query:
        return []

    matches: dict[str, FriendProfileResponse] = {}
    direct_doc = db.collection("users").document(query.strip()).get()
    if direct_doc.exists and direct_doc.id != current_uid:
        profile = build_public_profile(direct_doc.id)
        if profile:
            matches[profile.userId] = profile

    friend_id_docs = (
        db.collection("users")
        .where("friendId", "==", normalized_query)
        .limit(5)
        .stream()
    )
    for doc in friend_id_docs:
        if doc.id == current_uid:
            continue
        profile = build_public_profile(doc.id)
        if profile:
            matches[profile.userId] = profile

    return list(matches.values())


@router.post("/request", status_code=status.HTTP_201_CREATED)
async def send_friend_request(
    request: FriendRequestRequest,
    current_uid: str = Depends(get_current_user),
):
    to_uid = request.toUserId
    if current_uid == to_uid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="cannot request yourself")

    if not get_user_doc(to_uid):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")

    my_friend_ref = db.collection("users").document(current_uid).collection("friends").document(to_uid)
    existing_doc = my_friend_ref.get()
    if existing_doc.exists:
        status_now = (existing_doc.to_dict() or {}).get("status")
        if status_now == "accepted":
            return {"message": "already friends"}
        if status_now in {"pending", "sent"}:
            return {"message": "friend request already sent"}

    batch = db.batch()
    batch.set(
        my_friend_ref,
        {"status": "pending", "direction": "sent", "createdAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )
    batch.set(
        db.collection("users").document(to_uid).collection("friendRequests").document(current_uid),
        {"status": "pending", "fromUserId": current_uid, "createdAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )
    batch.commit()

    return {"message": "friend request sent"}


@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve_friend_request(
    request: FriendApproveRequest,
    current_uid: str = Depends(get_current_user),
):
    friend_uid = request.friendUserId
    if current_uid == friend_uid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="cannot approve yourself")

    request_ref = db.collection("users").document(current_uid).collection("friendRequests").document(friend_uid)
    if not request_ref.get().exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="friend request not found")

    batch = db.batch()
    batch.set(
        db.collection("users").document(current_uid).collection("friends").document(friend_uid),
        {"status": "accepted", "createdAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )
    batch.set(
        db.collection("users").document(friend_uid).collection("friends").document(current_uid),
        {"status": "accepted", "createdAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )
    batch.delete(request_ref)
    batch.commit()

    return {"message": "friend request approved"}


@router.post("/reject", status_code=status.HTTP_200_OK)
async def reject_friend_request(
    request: FriendRejectRequest,
    current_uid: str = Depends(get_current_user),
):
    friend_uid = request.friendUserId
    batch = db.batch()
    batch.delete(db.collection("users").document(current_uid).collection("friendRequests").document(friend_uid))
    batch.delete(db.collection("users").document(friend_uid).collection("friends").document(current_uid))
    batch.commit()
    return {"message": "friend request rejected"}
