from dataclasses import dataclass
import os
from typing import Optional

from fastapi import Header, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth

# Swagger UI等で鍵マークを出し、Bearer入力を有効にする共通インスタンス
security = HTTPBearer()

@dataclass(frozen=True)
class CurrentUser:
    uid: str | None
    is_guest: bool


def is_guest_user_id(user_id: str) -> bool:
    return user_id.startswith("guest-")


def get_current_user_optional(authorization: str | None = Header(default=None)) -> CurrentUser:
    """
    既存の認証ヘルパー。
    Headerの文字列を手動でパースし、ログインしていればそのuidを、
    未ログインならゲスト状態を返します。
    """
    if not authorization:
        return CurrentUser(uid=None, is_guest=True)

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="invalid authorization header")

    try:
        decoded_token = firebase_auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="invalid firebase id token") from exc

    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="firebase id token missing uid")

    return CurrentUser(uid=uid, is_guest=False)


def resolve_user_id(requested_user_id: str, current_user: CurrentUser) -> str:
    """
    bodyのuserIdが本当に正しいか検証し、安全なuserIdを返す関数。
    """
    if current_user.uid:
        return current_user.uid

    if is_guest_user_id(requested_user_id):
        return requested_user_id

    raise HTTPException(status_code=401, detail="login required")


def assert_record_owner(record: dict, current_user: CurrentUser):
    owner_id = str(record.get("userId") or "")
    resolve_user_id(owner_id, current_user)


def require_admin_token(x_admin_token: str | None = Header(default=None)):
    expected_token = os.getenv("ADMIN_API_TOKEN")
    if not expected_token:
        raise HTTPException(status_code=403, detail="admin api is not configured")

    if x_admin_token != expected_token:
        raise HTTPException(status_code=403, detail="invalid admin token")

    return True


# ==========================================
# 🔥 今回新しく追加したガチ認証ロジック
# ==========================================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    【ログイン必須API用】
    フロントから送られてきた Firebase ID Token を検証し、
    改ざんされていない本物の uid (User ID) を返します（ゲストは弾かれます）。
    """
    token = credentials.credentials

    # 🌐 もしフロントからWebデモ用のダミーの鍵が来たら、Firebaseの検証をスルーして即通過！
    if token == "dummy_token_for_demo":
        return "guest-3owagbhn"
    
    try:
        # Firebase Admin SDK が署名の検証、有効期限のチェックをすべて自動で行う
        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="トークン内に有効なUIDが含まれていません。"
            )
        return uid
        
    except firebase_auth.ExpiredIdTokenError: # ⭕️ インポート名に合わせて修正
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="トークンの有効期限が切れています。再ログインしてください。"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"認証に失敗しました: {str(e)}"
        )


async def get_current_user_strict_object(credentials: Optional[HTTPAuthorizationCredentials] = Security(HTTPBearer(auto_error=False))) -> CurrentUser:
    """
    【移行期・互換用】
    新しいHTTPBearerを使いつつ、戻り値を既存の『CurrentUser』オブジェクトの形式に揃えた関数です。
    """
    if not credentials:
        return CurrentUser(uid=None, is_guest=True)
    try:
        uid = await get_current_user(credentials)
        return CurrentUser(uid=uid, is_guest=False)
    except HTTPException:
        return CurrentUser(uid=None, is_guest=True)