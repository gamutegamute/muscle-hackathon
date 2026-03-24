from fastapi import APIRouter
from app.firebase import db
from datetime import datetime, timezone
import random
from exponent_server_sdk import PushClient, PushMessage

router = APIRouter(prefix="/notifications", tags=["notifications"])

# --- 25種類のメッセージストック ---
MESSAGES = {
    "active": [
        "おはよう！今日の筋トレ、何から始める？",
        "継続は力なり！今日もサクッと体動かそう:muscle:",
        "今日も絶好調だね！マッチョになる準備はできてる？",
        "いい感じ！今日の自分をさらに超えていこう:sparkles:",
        "筋トレの時間だよ！準備はいいかな？"
    ],
    "3days": [
        "3日間お休み中かな？そろそろ体がウズウズしてない？",
        "3日坊主はもったいない！今日1分だけやってみない？",
        "お疲れ様！また今日から再スタートしてみよう:blush:",
        "筋肉が君を待ってるよ！少しだけ動いてリフレッシュ！",
        "3日ぶり！無理せずスクワット1回から始めよう"
    ],
    "1week": [
        "1週間経ったよ！まずはストレッチからでもOK！",
        "お久しぶり！また一緒に汗を流せるのを楽しみにしてるよ:person_running:",
        "1週間お休みしてリフレッシュできたかな？再開しよう！",
        "体が重くなってない？1週間ぶりの運動でスッキリしよう！",
        "久しぶり！君の頑張りをまた記録させてね！"
    ],
    "1month": [
        "1か月ぶり！新しい気持ちでまた始めてみない？",
        "久しぶり！1か月前の君はあんなに頑張ってたよ、思い出して！",
        "筋肉が寂しがってるよ！今日から再デビューしちゃおう:sparkles:",
        "1か月経つのは早いね！今の自分が一番若いよ、動こう！",
        "おーい！元気？また一緒にマッチョを目指そうぜ！"
    ],
    "6months": [
        "半年ぶり！元気だった？また初心に戻ってやってみよう！",
        "もう半年かぁ…懐かしいね！また少しずつ始めない？",
        "久しぶりすぎて忘れちゃったかな？君ならまたできるよ！",
        "半年ぶりの再会！今日が新しいスタートラインだ！",
        "半年経っても君を応援してるよ！いつでも戻ってきてね！"
    ]
}

@router.post("/send-reminders")
def send_reminders():
    users_ref = db.collection("users").stream()
    now = datetime.now(timezone.utc)
    results = []
    
    push_client = PushClient()

    for user_doc in users_ref:
        user_data = user_doc.to_dict()
        last_activity = user_data.get("lastActivityDate")
        expo_push_token = user_data.get("expoPushToken")
        
        if not last_activity or not expo_push_token:
            continue

        if last_activity.tzinfo is None:
            last_activity = last_activity.replace(tzinfo=timezone.utc)

        delta = now - last_activity
        days = delta.days
            
        # 経過日数の計算
        delta = now - last_activity
        days = delta.days

        # メッセージの選定ロジック
        if days <= 2:
            category = "active"
        elif days == 3:
            category = "3days"
        elif days == 7:
            category = "1week"
        elif days == 30:
            category = "1month"
        elif days == 180:
            category = "6months"
        else:
            continue # 4~6日目などは今回は送らない設定（必要なら調整可）

        selected_message = random.choice(MESSAGES[category])
        
        try:
            push_client.publish(
                PushMessage(
                    to=expo_push_token,
                    body=selected_message,
                    title="筋トレ応援アラート", # 通知のタイトル
                    data={"days": days}       # アプリ側で受け取れる追加データ
                )
            )
            status = "sent"
        except Exception as e:
            status = f"error: {str(e)}"
        results.append({
            "userId": user_doc.id,
            "days": days,
            "message": selected_message
        })

    return {"status": "success", "processed_users": results}