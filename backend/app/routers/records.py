from fastapi import APIRouter
from app.schemas.record import RecordCreate

router = APIRouter(prefix="/records", tags=["records"])


@router.post("")
def create_record(record: RecordCreate):
    return {
        "message": "record saved",
        "data": record.dict()
    }


@router.get("/{user_id}")
def get_records(user_id: str):
    return {
        "records": [
            {
                "recordId": "record_001",
                "userId": user_id,
                "menuName": "push up",
                "count": 20,
                "duration": None,
                "memo": "good"
            }
        ]
    }