from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import CamelModel


class RecordUpdate(CamelModel):
    menuName: Optional[str] = Field(default=None, min_length=1, max_length=100)
    count: Optional[int] = Field(default=None, ge=0, le=100000)
    duration: Optional[float] = Field(default=None, ge=0, le=86400)
    interval: Optional[float] = Field(default=None, ge=0, le=86400)
    rounds: Optional[int] = Field(default=None, ge=1, le=1000)
    memo: Optional[str] = Field(default=None, max_length=1000)
    type: Optional[str] = Field(default=None, pattern="^(normal|timer)$")
    createdAt: Optional[datetime] = None
