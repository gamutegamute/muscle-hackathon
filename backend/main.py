from fastapi import FastAPI
# 「.（ドット）」を消して、同じフォルダ内の firebase.py を指定します
from firebase import db 
from app.routers import timer
from app.routers import notifications

app = FastAPI()

@app.get("/")
def root():
    return {"status": "SUCCESS", "message": "Firebase接続完了 (backendフォルダ内実行)"}

app.include_router(timer.router)

app.include_router(notifications.router)