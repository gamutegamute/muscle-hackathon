from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ai, home, profile, records, timer
from app.routers import notifications
from pydantic import BaseModel
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