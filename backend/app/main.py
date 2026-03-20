from fastapi import FastAPI
from app.routers import profile, records, ai
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # とりあえず全部許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Muscle Hackathon API is running!"}


app.include_router(profile.router)
app.include_router(records.router)
app.include_router(ai.router)