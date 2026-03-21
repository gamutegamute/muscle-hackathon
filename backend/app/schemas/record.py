from pydantic import BaseModel
from typing import Optional

class RecordCreate(BaseModel):
    userId: str
    menuName: str
    count: int
    duration: float  # 計測したトレーニング時間（秒）
    interval: Optional[float] = 0  # 追加：インターバル時間（秒）
    rounds: Optional[int] = 1      # 追加：周回数（セット数）
    memo: Optional[str] = None