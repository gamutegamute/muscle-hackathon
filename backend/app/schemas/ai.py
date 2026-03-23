from typing import Optional
from pydantic import Field

from app.schemas.common import CamelModel


class AdviceRequest(CamelModel):
    name: str = Field(min_length=1, max_length=50)
    menuName: str = Field(min_length=1, max_length=100)
    count: Optional[int] = Field(default=None, ge=0, le=100000)
    duration: Optional[int] = Field(default=None, ge=0, le=86400)
