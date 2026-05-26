from typing import Optional

from pydantic import Field

from app.schemas.common import CamelModel


class AdviceRequest(CamelModel):
    userId: str = Field(min_length=1, max_length=100)
    topic: str = Field(min_length=1, max_length=100)
    level: Optional[str] = Field(default=None, max_length=50)
    message: Optional[str] = Field(default=None, max_length=500)


class AdviceMenu(CamelModel):
    menuName: str = Field(min_length=1, max_length=100)
    count: int = Field(ge=0, le=100000)
    sets: int = Field(ge=1, le=100)
    mins: int = Field(ge=0, le=1440)
    secs: int = Field(ge=0, le=59)


class AdviceResponse(CamelModel):
    responseType: str = Field(default="workout", max_length=50)
    showRecordButton: bool = True
    message: str
    reason: str
    recommendation: AdviceMenu
    summary: dict
