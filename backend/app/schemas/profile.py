from pydantic import BaseModel
from typing import Optional


class ProfileCreate(BaseModel):
    userId: str
    name: str
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    bodyFat: Optional[float] = None