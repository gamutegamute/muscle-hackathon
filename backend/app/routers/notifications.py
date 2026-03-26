from datetime import datetime, timezone
import random

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.firebase import db

try:
    from exponent_server_sdk import PushClient, PushMessage
except ImportError:  # pragma: no cover - local runtime guard
    PushClient = None
    PushMessage = None


router = APIRouter(prefix="/notifications", tags=["notifications"])

MESSAGES = {
    "active": [
        "Good morning. Let's move your body a little today.",
        "Consistency matters. How about a short workout today?",
        "You are doing well. Take one more small step today.",
        "Let's keep updating today's version of you.",
        "Workout time. Start with something small and easy.",
    ],
    "3days": [
        "It has been 3 days. Even light stretching is a great restart.",
        "A small gap is okay. Try moving for just one minute today.",
        "Let's restart from today.",
        "A little movement can refresh your mood too.",
        "It's been a while, so let's start small without pressure.",
    ],
    "1week": [
        "It has been a week. Try coming back with a light workout.",
        "No problem if it has been a while. Let's move a little today.",
        "Let's start building your streak again.",
        "A short workout is a good way to get back in rhythm.",
        "Let's restart training together.",
    ],
    "1month": [
        "It has been a month. Let's start again with a fresh mindset.",
        "Remember your past effort and ease back into it.",
        "Today can be your new restart day.",
        "Start again at a pace that fits you now.",
        "One new record is enough for today.",
    ],
    "6months": [
        "It has been six months. Let's begin again slowly.",
        "Even after a long break, you can come back step by step.",
        "Let's make today your new starting line.",
        "We can build things up together again.",
        "Whenever you come back, we will be cheering for you.",
    ],
}


class TestNotificationRequest(BaseModel):
    title: str = Field(default="Workout Reminder", min_length=1, max_length=100)
    body: str = Field(default="This is a test notification.", min_length=1, max_length=300)
    priority: str | None = Field(default="high")


def ensure_push_sdk():
    if PushClient is None or PushMessage is None:
        raise HTTPException(
            status_code=500,
            detail="exponent_server_sdk is not installed. Run `pip install exponent-server-sdk` in backend venv.",
        )


def send_push_message(*, expo_push_token: str, title: str, body: str, priority: str = "high", data: dict | None = None):
    ensure_push_sdk()
    push_client = PushClient()
    push_client.publish(
        PushMessage(
            to=expo_push_token,
            title=title,
            body=body,
            priority=priority,
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
        priority=payload.priority or "high",
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
                title="Workout Reminder",
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
