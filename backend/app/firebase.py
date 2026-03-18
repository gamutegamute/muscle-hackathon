import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")#後で変更
firebase_admin.initialize_app(cred)

db = firestore.client()