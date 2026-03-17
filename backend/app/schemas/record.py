from pydantic import BaseModel
from typing import Optional


class RecordCreate(BaseModel):
    userId: str
    menuName: str
    count: Optional[int] = None
    duration: Optional[int] = None
    memo: Optional[str] = None