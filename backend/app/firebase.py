import os
import firebase_admin
from firebase_admin import credentials, firestore

# backendフォルダまで戻る
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

json_path = os.getenv(
    "FIREBASE_KEY_PATH",
    os.path.join(BASE_DIR, "serviceAccountKey.json")
)

if not firebase_admin._apps:
    cred = credentials.Certificate(json_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()