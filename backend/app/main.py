from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# routers
from app.routers import profile, records, ai, timer

app = FastAPI(
    title="Muscle Hackathon API",
    description="筋トレ記録アプリのバックエンドAPI",
    version="1.0.0"
)

# CORS設定（スマホ・フロント接続用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番は制限した方がいい
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 動作確認用
@app.get("/")
def root():
    return {"message": "Muscle Hackathon API is running!"}

# ルーター登録
app.include_router(profile.router)
app.include_router(records.router)
app.include_router(ai.router)
app.include_router(timer.router)