from dataclasses import dataclass

from fastapi import Header, HTTPException
from firebase_admin import auth as firebase_auth


@dataclass(frozen=True)
class CurrentUser:
    uid: str | None
    is_guest: bool


def is_guest_user_id(user_id: str) -> bool:
    return user_id.startswith("guest-")


def get_current_user_optional(authorization: str | None = Header(default=None)) -> CurrentUser:
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
    if current_user.uid:
        return current_user.uid

    if is_guest_user_id(requested_user_id):
        return requested_user_id

    raise HTTPException(status_code=401, detail="login required")


def assert_record_owner(record: dict, current_user: CurrentUser):
    owner_id = str(record.get("userId") or "")
    resolve_user_id(owner_id, current_user)
