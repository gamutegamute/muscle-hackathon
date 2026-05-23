from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user  # 🔑 ガチ認証Dependency
from app.firebase import db
from app.schemas.user import FriendProfileResponse
from typing import List

router = APIRouter(prefix="/friends", tags=["friends"])

@router.get("", response_model=List[FriendProfileResponse])
async def get_friends_list(
    # 🔒 ログイン必須！有効なトークンを持った本物のuidしかここを通過できません
    current_uid: str = Depends(get_current_user) 
):
    try:
        # 1. Firestoreの `users/{current_uid}/friends` サブコレクションからフレンドのUID一覧を取得
        # (設計案: 拡張性を持たせるため、フレンドはユーザーごとのサブコレクション管理が綺麗です)
        friend_docs = db.collection("users").document(current_uid).collection("friends").stream()
        friend_ids = [doc.id for doc in friend_docs]

        if not friend_ids:
            return []

        # 2. 取得したフレンドたちのプロフィール情報を `users` コレクションから一括取得
        friends_profiles = []
        for f_id in friend_ids:
            user_doc = db.collection("users").document(f_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict() or {}
                
                # 3. 必要な安全なデータだけを抽出し、スキーマに当てはめる
                profile = FriendProfileResponse(
                    userId=f_id,
                    displayName=user_data.get("displayName", "名無しのマッチョ"),
                    photoURL=user_data.get("photoURL"),
                    streakDays=user_data.get("streakDays", 0),
                    statusMessage=user_data.get("statusMessage", "")
                )
                friends_profiles.append(profile)

        return friends_profiles

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"フレンド一覧の取得に失敗しました: {str(e)}"
        )