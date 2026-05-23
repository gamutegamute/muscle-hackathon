import os
from pathlib import Path
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import friends


def load_backend_env():
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_backend_env()

from app.routers import ai, home, notifications, profile, records, timer
from app.routers.notifications import run_reminders

app = FastAPI(
    title="Muscle Hackathon API",
    version="0.1.0",
    description="Backend API for workout profile, records, summaries, timers, and coaching hints.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler(timezone=ZoneInfo("Asia/Tokyo"))


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(run_reminders, "cron", hour=9, minute=0, id="daily_reminders", replace_existing=True)
        scheduler.start()
        print("Notification scheduler started. Daily reminders run at 09:00 JST.")


@app.on_event("startup")
def on_startup():
    start_scheduler()


@app.get("/")
def read_root():
    return {"message": "Muscle Hackathon API is running!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(profile.router)
app.include_router(records.router)
app.include_router(ai.router)
app.include_router(home.router)
app.include_router(timer.router)
app.include_router(notifications.router)
app.include_router(friends.router)