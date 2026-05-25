from typing import Optional
from app.schemas.common import CamelModel

class FriendProfileResponse(CamelModel):
    """
    フレンド一覧やランキング画面で、他人に公開しても安全なプロフィール情報
    ※ 体重(weight)や体脂肪(bodyFat)、HealthKit詳細、通知トークンなどは含めない！
    """
    userId: str
    displayName: str
    photoURL: Optional[str] = None
    streakDays: int = 0  # 筋トレ連続継続日数
    statusMessage: Optional[str] = ""  # 一言コメント
    
    # ⭕️ CamelModelを継承しているため、class Config の記述は削除してOKです！


class UserRankingResponse(CamelModel):   # ⭕️ こちらは最初からバッチリです！
    """
    ランキング画面で、他人に公開しても安全なプロフィール＋順位情報
    ※ こちらも体重や体脂肪などの機密情報は絶対に含めない！
    """
    rank: int          # 順位（1位、2位…）
    userId: str
    displayName: str
    photoURL: Optional[str] = None
    streakDays: int = 0  # 筋トレ連続継続日数（これでソートします）
    statusMessage: Optional[str] = ""

class FriendApproveRequest(CamelModel):
    """
    フレンド申請を承認する際のリクエストボディ
    """
    friendUserId: str  # 承認したい相手（申請をくれた人）のUID

class FriendRequestRequest(CamelModel):
    """
    フレンド申請を送信する際のリクエストボディ
    """
    toUserId: str  # 申請を送りたい相手のUID