from fastapi import APIRouter
from app.schemas.profile import ProfileCreate

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("")
def create_profile(profile: ProfileCreate):
    return {
        "message": "profile saved",
        "data": profile.model_dump()
    }


@router.get("/{user_id}")
def get_profile(user_id: str):
    return {
        "userId": user_id,
        "name": "test",
        "age": 20,
        "height": 170,
        "weight": 60,
        "bodyFat": 15
    }