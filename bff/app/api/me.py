"""用户态端点（对齐 v6/server/app_v1/api/me.py 契约）。"""
from fastapi import APIRouter, Request
from app import repository as repo
from app.response import ApiError, ok
from app.schemas import UpdatePreferencesRequest

router = APIRouter()


def _identity(request: Request) -> str:
    identity = repo.valid_identity(request.headers.get("x-install-identity"))
    if not identity:
        raise ApiError(400, "INVALID_IDENTITY", "缺少有效的 X-Install-Identity 头")
    return identity


@router.get("/profile")
def get_profile(request: Request):
    return ok(request, repo.get_profile(_identity(request)))


@router.put("/profile/preferences")
def update_preferences(request: Request, body: UpdatePreferencesRequest):
    return ok(request, repo.update_preferences(_identity(request), body.mode, body.values))


@router.post("/favorites/{drink_id}/toggle")
def toggle_favorite(request: Request, drink_id: str):
    return ok(request, repo.toggle_favorite(_identity(request), drink_id))
