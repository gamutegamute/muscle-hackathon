import os
import firebase_admin
from firebase_admin import credentials, firestore

# serviceAccountKey.json のパス（安全に取得）
BASE_DIR = os.path.dirname(__file__)
json_path = os.getenv(
    "FIREBASE_KEY_PATH",
    os.path.join(BASE_DIR, "serviceAccountKey.json")
)

# 二重初期化防止
if not firebase_admin._apps:
    cred = credentials.Certificate(json_path)
    firebase_admin.initialize_app(cred)

# Firestoreクライアント
db = firestore.client()