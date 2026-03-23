from fastapi import APIRouter

from app.schemas.ai import AdviceRequest

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/advice")
def get_advice(request: AdviceRequest):
    effort_hint = "まずはフォームを崩さず続けていこう。"
    if request.count and request.count >= 20:
        effort_hint = "かなり追い込めているので、今日はしっかり休息も意識しよう。"
    elif request.duration and request.duration >= 1800:
        effort_hint = "長めに取り組めていて良い流れ。水分補給も忘れずに。"

    return {
        "message": f"{request.name}さん、今日の{request.menuName}もお疲れさま！{effort_hint}",
        "summary": {
            "menuName": request.menuName,
            "count": request.count,
            "duration": request.duration,
        },
    }
