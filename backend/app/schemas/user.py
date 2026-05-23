from pydantic import BaseModel
from typing import Optional

class FriendProfileResponse(BaseModel):
    """
    フレンド一覧やランキング画面で、他人に公開しても安全なプロフィール情報
    ※ 体重(weight)や体脂肪(bodyFat)、HealthKit詳細、通知トークンなどは含めない！
    """
    userId: str
    displayName: str
    photoURL: Optional[str] = None
    streakDays: int = 0  # 筋トレ連続継続日数（あればモチベ上がる！）
    statusMessage: Optional[str] = ""  # 一言コメント

    class Config:
        from_attributes = True