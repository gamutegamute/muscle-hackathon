from fastapi import APIRouter
from app.schemas.record import RecordCreate # スキーマは共通でOK
from app.firebase import db
from firebase_admin import firestore

# プレフィックスを /timers にすると分かりやすいです
router = APIRouter(prefix="/timers", tags=["timers"])

@router.post("")
def create_timer_record(record: RecordCreate):
    data = record.model_dump()
    
    # タイマー専用の保存形式
    timer_data = {
        "userId": data["userId"],
        "menuName": data["menuName"],
        "duration": float(data.get("duration", 0)),
        "interval": float(data.get("interval", 0)),
        "rounds": int(data.get("rounds", 1)),
        "type": "timer", # 後でグラフ化するときに「タイマーのデータだ」と判別しやすくなります
        "createdAt": firestore.SERVER_TIMESTAMP
    }

    doc_ref = db.collection("records").document() # 保存先は同じ records でもOK
    timer_data["recordId"] = doc_ref.id
    doc_ref.set(timer_data)

    return {"message": "timer record saved", "data": timer_data}

# ✅ 【ここを追加！】 Step 4: usersコレクションの「最新運動日」を更新
    user_ref = db.collection("users").document(user_id)
    user_ref.set({
        "lastActivity": firestore.SERVER_TIMESTAMP,
        "lastActivityDate": firestore.SERVER_TIMESTAMP # 計算しやすいように2つ持っておくと便利です
    }, merge=True) # merge=Trueにすることで、他のプロフィール情報を消さずに「追加・更新」できます

    return {"message": "timer record saved and user activity updated", "data": timer_data}