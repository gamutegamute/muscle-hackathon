import json
import os

import firebase_admin
from firebase_admin import credentials, firestore

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
json_path = os.getenv("FIREBASE_KEY_PATH", os.path.join(BASE_DIR, "serviceAccountKey.json"))

if not firebase_admin._apps:
    if service_account_json:
        cred = credentials.Certificate(json.loads(service_account_json))
    else:
        cred = credentials.Certificate(json_path)

    firebase_admin.initialize_app(cred)

db = firestore.client()
