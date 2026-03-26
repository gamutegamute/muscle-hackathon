from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from apscheduler.schedulers.background import BackgroundScheduler
except ImportError:  # pragma: no cover - optional local dependency
    BackgroundScheduler = None

from app.routers import ai, home, notifications, profile, records, timer
from app.routers.notifications import send_reminders

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


def start_scheduler():
    if BackgroundScheduler is None:
        print("APScheduler is not installed. Skip scheduled notification job.")
        return

    scheduler = BackgroundScheduler()
    scheduler.add_job(send_reminders, "cron", hour=9, minute=0)
    scheduler.start()
    print("Notification scheduler started. Daily reminders run at 09:00.")


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
