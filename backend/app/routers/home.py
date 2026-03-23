from fastapi import APIRouter

from app.routers.records import get_user_records
from app.services.records_summary import build_records_summary

router = APIRouter(prefix="/summary", tags=["home"])


@router.get("/{userId}")
def get_summary(userId: str):
    return build_records_summary(userId, get_user_records(userId), daily_value_key="count")
