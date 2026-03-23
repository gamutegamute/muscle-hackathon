from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# routers 一括インポート
from app.routers import profile, records, ai, home, timer

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発中は全部許可でOK
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルート確認
@app.get("/")
def read_root():
    return {"message": "Muscle Hackathon API is running!"}


# --- ルーター登録 ---
app.include_router(profile.router)
app.include_router(records.router)
app.include_router(ai.router)
app.include_router(home.router)
app.include_router(timer.router)