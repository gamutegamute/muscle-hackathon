from typing import Optional
from pydantic import Field

from app.schemas.common import CamelModel


class ProfileCreate(CamelModel):
    userId: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=50)
    age: Optional[int] = Field(default=None, ge=0, le=130)
    height: Optional[float] = Field(default=None, ge=0, le=300)
    weight: Optional[float] = Field(default=None, ge=0, le=500)
    bodyFat: Optional[float] = Field(default=None, ge=0, le=100)
    expoPushToken: Optional[str] = Field(default=None, min_length=1, max_length=255)
