from fastapi import APIRouter, Depends

from app.auth import CurrentUser, get_current_user_optional, resolve_user_id
from app.routers.records import get_user_records
from app.services.records_summary import build_records_summary

router = APIRouter(prefix="/summary", tags=["home"])


@router.get("/{userId}")
def get_summary(userId: str, current_user: CurrentUser = Depends(get_current_user_optional)):
    resolved_user_id = resolve_user_id(userId, current_user)
    return build_records_summary(resolved_user_id, get_user_records(resolved_user_id), daily_value_key="count")
