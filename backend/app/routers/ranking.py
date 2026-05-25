from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.auth import get_current_user  # 🔑 ガチ認証（ログイン必須）
from app.firebase import db
from app.schemas.user import UserRankingResponse

router = APIRouter(prefix="/ranking", tags=["ranking"])

@router.get("", response_model=List[UserRankingResponse])
async def get_leaderboard(
    # 🔒 ログイン必須ゲート
    current_uid: str = Depends(get_current_user)
):
    try:
        # 1. usersコレクションから、筋トレ継続日数（streakDays）が多い順に上位100件を取得
        # ※ direction=db.Query.DESCENDING で降順（大きい順）ソートになります
        users_query = (
            db.collection("users")
            .order_by("streakDays", direction=db.Query.DESCENDING)
            .limit(100)
            .stream()
        )

        ranking_list = []
        current_rank = 1

        # 2. 取得したデータを安全なスキーマに詰め替えつつ、順位（rank）を付与
        for doc in users_query:
            user_data = doc.to_dict() or {}
            
            # 体重などの機密情報はしっかり除外
            user_rank_data = UserRankingResponse(
                rank=current_rank,
                userId=doc.id,
                displayName=user_data.get("displayName", "名無しのマッチョ"),
                photoURL=user_data.get("photoURL"),
                streakDays=user_data.get("streakDays", 0),
                statusMessage=user_data.get("statusMessage", "")
            )
            ranking_list.append(user_rank_data)
            current_rank += 1  # 次のユーザーの順位を進める

        return ranking_list

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ランキングの取得に失敗しました: {str(e)}"
        )