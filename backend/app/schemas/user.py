from typing import Optional

from app.schemas.common import CamelModel


class FriendProfileResponse(CamelModel):
    userId: str
    friendId: str
    name: str
    avatar: Optional[str] = None
    rank: str = ""
    consecutiveDays: int = 0
    totalTime: int = 0
    achievementCount: int = 0
    recentActivity: list[str] = []

    # Backward-compatible fields for existing ranking/friend clients.
    displayName: Optional[str] = None
    photoURL: Optional[str] = None
    streakDays: int = 0
    statusMessage: Optional[str] = ""


class UserRankingResponse(CamelModel):
    rank: int
    userId: str
    friendId: str = ""
    name: str = ""
    avatar: Optional[str] = None
    totalTime: int = 0
    displayName: str
    photoURL: Optional[str] = None
    streakDays: int = 0
    statusMessage: Optional[str] = ""


class FriendApproveRequest(CamelModel):
    friendUserId: str


class FriendRejectRequest(CamelModel):
    friendUserId: str


class FriendRequestRequest(CamelModel):
    toUserId: str
