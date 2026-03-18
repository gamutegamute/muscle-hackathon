from fastapi import FastAPI
from app.routers import profile, records, ai

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Muscle Hackathon API is running!"}


app.include_router(profile.router)
app.include_router(records.router)
app.include_router(ai.router)