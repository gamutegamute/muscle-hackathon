import os
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI

app = FastAPI()

# --- ここが秘密鍵を読み込む設定 ---
# 実行しているファイル（main.py）と同じ階層にある JSON を指定します
current_dir = os.path.dirname(__file__)
json_path = os.path.join(current_dir, "serviceAccountKey.json")

# Firebaseを初期化（鍵を差し込む）
cred = credentials.Certificate(json_path)
firebase_admin.initialize_app(cred)

# データベース(Firestore)を使える状態にする
db = firestore.client()
# ------------------------------

@app.get("/")
def root():
    return {"status": "SUCCESS", "message": "Firebaseに接続できました！"}