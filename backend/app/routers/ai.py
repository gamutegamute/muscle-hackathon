from fastapi import APIRouter
from app.schemas.ai import AdviceRequest

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/advice")
def get_advice(request: AdviceRequest):
    return {
        "message": f"{request.name}さん、今日も記録お疲れさま！少しずつ積み上げていこう！"
    }