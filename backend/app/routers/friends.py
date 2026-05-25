from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user  # 🔑 ガチ認証Dependency
from app.firebase import db
from app.schemas.user import FriendProfileResponse
from typing import List
from app.schemas.user import FriendProfileResponse, FriendApproveRequest

router = APIRouter(prefix="/friends", tags=["friends"])

@router.get("", response_model=List[FriendProfileResponse])
async def get_friends_list(
    # 🔒 ログイン必須ゲート
    current_uid: str = Depends(get_current_user) 
):
    try:
        # 1. Firestoreの `users/{current_uid}/friends` サブコレクションからドキュメントをすべて取得
        friend_docs = db.collection("users").document(current_uid).collection("friends").stream()
        
        # 2. ステータスが "accepted"（承認済み）の相手のUIDだけを抽出する
        friend_ids = []
        for doc in friend_docs:
            doc_data = doc.to_dict() or {}
            # ⭕️ ここでチェック！ status が "accepted" の人だけをリストに入れます
            if doc_data.get("status") == "accepted":
                friend_ids.append(doc.id)

        # 承認済みのフレンドが1人もいない場合は空配列を返す
        if not friend_ids:
            return []

        # 3. 取得したフレンドたちのプロフィール情報を `users` コレクションから一括取得
        friends_profiles = []
        for f_id in friend_ids:
            user_doc = db.collection("users").document(f_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict() or {}
                
                # 必要な安全なデータだけを抽出し、スキーマに当てはめる
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
    
@router.post("/approve", status_code=status.HTTP_200_OK)
async def approve_friend_request(
    request: FriendApproveRequest,
    current_uid: str = Depends(get_current_user)  # 🔒 ログイン必須（承認する側のBさん）
):
    try:
        friend_uid = request.friendUserId  # 申請をくれた側（Aさん）のUID

        # 自分自身を承認しようとしている場合はバグなので弾く
        if current_uid == friend_uid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="自分自身の申請を承認することはできません。"
            )

        # 🤝 Firestoreのトランザクション（バッチ処理）を開始
        batch = db.batch()

        # ① 承認した側（自分：Bさん）のサブコレクションに、相手を「accepted」で保存
        my_friend_ref = db.collection("users").document(current_uid).collection("friends").document(friend_uid)
        batch.set(my_friend_ref, {"status": "accepted"})

        # ② 申請した側（相手：Aさん）のサブコレクションのステータスも「accepted」に更新
        their_friend_ref = db.collection("users").document(friend_uid).collection("friends").document(current_uid)
        batch.set(their_friend_ref, {"status": "accepted"}, merge=True)

        # 2つの書き込みを同時に実行（鉄壁のアトミック処理！）
        batch.commit()

        return {"message": "フレンド申請を承認しました！お互いにフレンドになりました。"}

    except HTTPException:
        # 400エラー（自分自身の承認など）はそのままフロントに投げる
        raise
    except Exception as e:
        # それ以外のシステムエラー（Firestoreの通信失敗など）は500で返す
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"フレンド申請の承認に失敗しました: {str(e)}"
        )