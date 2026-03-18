from pydantic import BaseModel
from typing import Optional


class AdviceRequest(BaseModel):
    name: str
    menuName: str
    count: Optional[int] = None
    duration: Optional[int] = None