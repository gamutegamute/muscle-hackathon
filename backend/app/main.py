from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# スケジューラー関連のインポート
from apscheduler.schedulers.background import BackgroundScheduler
from app.routers import ai, home, profile, records, timer, notifications
from app.routers.notifications import send_reminders

app = FastAPI(
    title="Muscle Hackathon API",
    version="0.1.0",
    description="Backend API for workout profile, records, summaries, timers, and coaching hints.",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# スケジューラーの設定関数
def start_scheduler():
    scheduler = BackgroundScheduler()
    # 毎日 朝9:00 に1回だけ実行する設定
    scheduler.add_job(send_reminders, 'cron', hour=9, minute=0)
    scheduler.start()
    print("⏰ スケジューラーが起動しました（毎日 09:00 に実行）")

# FastAPI起動時にスケジューラーを開始
@app.on_event("startup")
def on_startup():
    start_scheduler()

@app.get("/")
def read_root():
    return {"message": "Muscle Hackathon API is running!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# ルーターの登録
app.include_router(profile.router)
app.include_router(records.router)
app.include_router(ai.router)
app.include_router(home.router)
app.include_router(timer.router)
app.include_router(notifications.router)