import os
import firebase_admin
from firebase_admin import credentials, firestore

# 秘密鍵のパス設定
current_dir = os.path.dirname(__file__)
json_path = os.path.join(current_dir, "serviceAccountKey.json")

# Firebaseの初期化（二重初期化を防ぐチェック付き）
if not firebase_admin._apps:
    cred = credentials.Certificate(json_path)
    firebase_admin.initialize_app(cred)

# データベース(Firestore)のインスタンスを作成
db = firestore.client()