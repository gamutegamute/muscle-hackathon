from datetime import datetime, timezone
import random
import time

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.auth import CurrentUser, get_current_user_optional, resolve_user_id
from app.firebase import db

try:
    from exponent_server_sdk import PushClient, PushMessage
except ImportError:  # pragma: no cover - runtime guard for local setup
    PushClient = None
    PushMessage = None


router = APIRouter(prefix="/notifications", tags=["notifications"])

MESSAGES = {
    "active": [
        "おはよう！今日の筋トレ、何から始める？",
        "継続は力なり！今日もサクッと体を動かそう。",
        "今日も絶好調だね！マッチョになる準備はできてる？",
        "いい感じ！今日の自分をさらに超えていこう。",
        "筋トレの時間だよ！準備はいいかな？",
    ],
    "3days": [
        "3日間お休み中かな？そろそろ体がウズウズしてない？",
        "3日坊主はもったいない！今日1分だけやってみない？",
        "お疲れ様！また今日から再スタートしてみよう。",
        "筋肉が君を待ってるよ！少しだけ動いてリフレッシュ！",
        "3日ぶり！無理せずスクワット1回から始めよう。",
    ],
    "1week": [
        "1週間経ったよ！まずはストレッチからでもOK！",
        "お久しぶり！また一緒に汗を流せるのを楽しみにしてるよ。",
        "1週間お休みしてリフレッシュできたかな？再開しよう！",
        "体が重くなってない？1週間ぶりの運動でスッキリしよう！",
        "久しぶり！君の頑張りをまた記録させてね！",
    ],
    "1month": [
        "1か月ぶり！新しい気持ちでまた始めてみない？",
        "久しぶり！1か月前の君はあんなに頑張ってたよ、思い出して！",
        "筋肉が寂しがってるよ！今日から再デビューしちゃおう！",
        "1か月経つのは早いね！今の自分が一番若いよ、動こう！",
        "おーい！元気？また一緒にマッチョを目指そうぜ！",
    ],
    "6months": [
        "半年ぶり！元気だった？また初心に戻ってやってみよう！",
        "もう半年かぁ。懐かしいね！また少しずつ始めない？",
        "久しぶりすぎて忘れちゃったかな？君ならまたできるよ！",
        "半年ぶりの再会！今日が新しいスタートラインだ！",
        "半年経っても君を応援してるよ！いつでも戻ってきてね！",
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
    ticket = push_client.publish(
        PushMessage(
            to=expo_push_token,
            title=title,
            body=body,
            priority="high",
            data=data or {},
        )
    )
    return {
        "rawTicket": ticket,
        "status": ticket.status,
        "ticketId": ticket.id,
        "message": ticket.message,
        "details": ticket.details,
    }


def get_push_receipt(push_ticket, *, retry_count: int = 3, wait_seconds: float = 1.0):
    ensure_push_sdk()
    if not push_ticket or not getattr(push_ticket, "id", None):
        return {
            "status": "missing_ticket_id",
            "message": "ticket id was empty",
            "details": None,
        }

    push_client = PushClient()

    for attempt in range(retry_count):
        if attempt > 0:
            time.sleep(wait_seconds)

        receipts = push_client.check_receipts([push_ticket])
        if not receipts:
            continue

        receipt = receipts[0]
        return {
            "status": receipt.status,
            "message": receipt.message,
            "details": receipt.details,
            "receiptId": receipt.id,
        }

    return {
        "status": "pending",
        "message": "receipt is not ready yet",
        "details": None,
    }


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
def send_test_notification(
    user_id: str,
    payload: TestNotificationRequest,
    current_user: CurrentUser = Depends(get_current_user_optional),
):
    resolved_user_id = resolve_user_id(user_id, current_user)
    user_doc = db.collection("users").document(resolved_user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="user not found")

    user_data = user_doc.to_dict() or {}
    expo_push_token = user_data.get("expoPushToken")
    if not expo_push_token:
        raise HTTPException(status_code=400, detail="expoPushToken not found for user")

    push_result = send_push_message(
        expo_push_token=expo_push_token,
        title=payload.title,
        body=payload.body,
        data={"type": "test"},
    )
    receipt_result = get_push_receipt(push_result["rawTicket"])

    return {
        "status": push_result["status"],
        "userId": resolved_user_id,
        "expoPushToken": expo_push_token,
        "title": payload.title,
        "body": payload.body,
        "ticket": {
            "status": push_result["status"],
            "ticketId": push_result["ticketId"],
            "message": push_result["message"],
            "details": push_result["details"],
        },
        "receipt": receipt_result,
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
            push_result = send_push_message(
                expo_push_token=expo_push_token,
                title="筋トレ応援アラート",
                body=selected_message,
                data={"days": days, "category": category},
            )
            status = push_result["status"]
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
