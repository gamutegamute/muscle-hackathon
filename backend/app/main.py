from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()


# 動作確認用
@app.get("/")
def read_root():
    return {"message": "Muscle Hackathon API is running!"}


# プロフィール用
class Profile(BaseModel):
    name: str
    age: int | None = None
    height: float | None = None
    weight: float | None = None
    body_fat: float | None = None


# 記録用
class WorkoutRecord(BaseModel):
    menu: str
    count: int | None = None
    duration: float | None = None
    memo: str | None = None


profiles: List[Profile] = []
records: List[WorkoutRecord] = []


@app.get("/profiles")
def get_profiles():
    return profiles


@app.post("/profiles")
def create_profile(profile: Profile):
    profiles.append(profile)
    return {"message": "Profile created", "data": profile}


@app.get("/records")
def get_records():
    return records


@app.post("/records")
def create_record(record: WorkoutRecord):
    records.append(record)
    return {"message": "Record created", "data": record}