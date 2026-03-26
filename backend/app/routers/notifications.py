from datetime import datetime, timezone
import random

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.firebase import db

try:
    from exponent_server_sdk import PushClient, PushMessage
except ImportError:  # pragma: no cover - runtime guard for local setup
    PushClient = None
    PushMessage = None


router = APIRouter(prefix="/notifications", tags=["notifications"])

MESSAGES = {
    "active": [
        "おはようございます。今日も少しだけ体を動かしてみましょう。",
        "継続は力なりです。今日もサクッと筋トレいきましょう。",
        "いい流れです。今日の自分を少しだけ超えてみましょう。",
    ],
    "3days": [
        "3日ぶりですね。まずは軽めのメニューから再開してみましょう。",
        "少し間が空いても大丈夫です。今日また1歩進めばOKです。",
        "そろそろ体を動かしたくなっていませんか。1分だけでも十分です。",
    ],
    "1week": [
        "1週間おつかれさまでした。今日はストレッチからでも大丈夫です。",
        "久しぶりの運動は軽めでOKです。まずは再開してみましょう。",
        "また一緒に記録を積み上げていきましょう。",
    ],
    "1month": [
        "1か月ぶりです。新しい気持ちでまた始めてみませんか。",
        "久しぶりでも大丈夫です。今日の一回が再スタートになります。",
        "前の頑張りは消えていません。今日からまた積み上げましょう。",
    ],
    "6months": [
        "半年ぶりですね。無理せず初心に戻って始めてみましょう。",
        "久しぶりでも大丈夫です。また少しずつ戻していけます。",
        "今日が新しいスタートラインです。できるところから始めましょう。",
    ],
}


class TestNotificationRequest(BaseModel):
    title: str = Field(default="筋トレ応援アラート", min_length=1, max_length=100)
    body: str = Field(default="テスト通知です。届いたら成功です。", min_length=1, max_length=300)


def ensure_push_sdk():
    if PushClient is None or PushMessage is None:
        raise HTTPException(
            status_code=500,
            detail="exponent_server_sdk is not installed. Run `pip install exponent-server-sdk` in backend venv.",
        )


def send_push_message(*, expo_push_token: str, title: str, body: str, data: dict | None = None):
    ensure_push_sdk()
    push_client = PushClient()
    push_client.publish(
        PushMessage(
            to=expo_push_token,
            title=title,
            body=body,
            data=data or {},
        )
    )


def get_days_since_last_activity(last_activity) -> int | None:
    if not last_activity:
        return None

    if hasattr(last_activity, "tzinfo") and last_activity.tzinfo is None:
        last_activity = last_activity.replace(tzinfo=timezone.utc)

    return (datetime.now(timezone.utc) - last_activity).days


def pick_category(days: int) -> str | None:
    if days <= 2:
        return "active"
    if days == 3:
        return "3days"
    if days == 7:
        return "1week"
    if days == 30:
        return "1month"
    if days == 180:
        return "6months"
    return None


@router.post("/test-user/{user_id}")
def send_test_notification(user_id: str, payload: TestNotificationRequest):
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="user not found")

    user_data = user_doc.to_dict() or {}
    expo_push_token = user_data.get("expoPushToken")
    if not expo_push_token:
        raise HTTPException(status_code=400, detail="expoPushToken not found for user")

    send_push_message(
        expo_push_token=expo_push_token,
        title=payload.title,
        body=payload.body,
        data={"type": "test"},
    )

    return {
        "status": "sent",
        "userId": user_id,
        "expoPushToken": expo_push_token,
        "title": payload.title,
        "body": payload.body,
    }


@router.post("/send-reminders")
def send_reminders():
    ensure_push_sdk()

    users_ref = db.collection("users").stream()
    results = []

    for user_doc in users_ref:
        user_data = user_doc.to_dict() or {}
        expo_push_token = user_data.get("expoPushToken")
        days = get_days_since_last_activity(user_data.get("lastActivityDate"))

        if not expo_push_token or days is None:
            continue

        category = pick_category(days)
        if category is None:
            continue

        selected_message = random.choice(MESSAGES[category])

        try:
            send_push_message(
                expo_push_token=expo_push_token,
                title="筋トレ応援アラート",
                body=selected_message,
                priority="high",
                data={"days": days, "category": category},
            )
            status = "sent"
        except Exception as exc:  # pragma: no cover - external SDK
            status = f"error: {exc}"

        results.append(
            {
                "userId": user_doc.id,
                "days": days,
                "category": category,
                "message": selected_message,
                "status": status,
            }
        )

    return {"status": "success", "processedUsers": results}
