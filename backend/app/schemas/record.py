from datetime import datetime
from typing import Optional
from pydantic import Field

from app.schemas.common import CamelModel


class RecordCreate(CamelModel):
    userId: str = Field(min_length=1, max_length=100)
    menuName: str = Field(min_length=1, max_length=100)
    count: int = Field(ge=0, le=100000)
    duration: float = Field(ge=0, le=86400)
    interval: Optional[float] = Field(default=0, ge=0, le=86400)
    rounds: Optional[int] = Field(default=1, ge=1, le=1000)
    memo: Optional[str] = Field(default=None, max_length=1000)
    createdAt: Optional[datetime] = None
