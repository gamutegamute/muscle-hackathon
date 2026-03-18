from pydantic import BaseModel
from typing import Optional

class RecordCreate(BaseModel):
    userId: str
    menuName: str
    count: int
    duration: Optional[int] = None
    memo: Optional[str] = None