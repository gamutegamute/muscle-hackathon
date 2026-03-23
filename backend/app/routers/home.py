from fastapi import APIRouter

router = APIRouter(prefix="/summary", tags=["home"])


@router.get("/{userId}")
def get_summary(userId: str):
    # 仮データ（あとでrecordsと連携）
    return {
        "userId": userId,
        "total_workouts": 10,
        "streak_days": 5,
        "last_workout": "2026-03-20",
        "message": "いい感じ！この調子で続けよう🔥"
    }