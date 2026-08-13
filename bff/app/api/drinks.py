"""公开饮品端点（对齐 v6/server/app_v1/api/drinks.py 契约）。"""
from fastapi import APIRouter, Query, Request
from app import repository as repo
from app.response import ApiError, ok
from app.schemas import RecommendationRequest, ComparisonRequest

router = APIRouter()


def _identity(request: Request) -> str | None:
    return repo.valid_identity(request.headers.get("x-install-identity"))


@router.get("/bootstrap")
def get_bootstrap(request: Request):
    return ok(request, {
        "taxonomies": repo.get_taxonomies(),
        "profile": repo.get_profile(_identity(request)),
        "featured": repo.featured_summaries(),
    })


@router.get("/taxonomies")
def get_taxonomies(request: Request):
    return ok(request, repo.get_taxonomies())


@router.get("/drinks")
def list_drinks(
    request: Request,
    mode: str = Query(...),
    keyword: str | None = Query(default=None, max_length=100),
    filters: str | None = Query(default=None),
    sort: str = Query(default="recommendation"),
    page: int = Query(default=1, ge=1),
    pageSize: int = Query(default=20, ge=1, le=100),
):
    parsed = repo.parse_filters(filters)
    return ok(request, repo.search_drinks(mode, keyword, parsed, sort, page, pageSize))


@router.get("/drinks/{drink_id}")
def get_drink_detail(request: Request, drink_id: str):
    detail = repo.get_detail(drink_id)
    if not detail:
        raise ApiError(404, "DRINK_NOT_FOUND", f"饮品不存在：{drink_id}")
    identity = _identity(request)
    if identity:
        repo.record_history(identity, drink_id)
    return ok(request, detail)


@router.post("/recommendations")
def recommend_drink(request: Request, body: RecommendationRequest):
    drink, reasons = repo.recommend(
        body.mode,
        (body.scene or "").strip() or None,
        body.preferences,
        body.excludedDrinkIds,
    )
    return ok(request, {"drink": drink, "reasons": reasons})


@router.post("/comparisons")
def compare_drinks(request: Request, body: ComparisonRequest):
    if len(body.drinkIds) != 2:
        raise ApiError(400, "COMPARE_REQUIRES_TWO", "对比需要且仅需要两款饮品")
    items = []
    for drink_id in body.drinkIds:
        detail = repo.get_detail(drink_id)
        if not detail:
            raise ApiError(404, "DRINK_NOT_FOUND", f"饮品不存在：{drink_id}")
        items.append(detail)
    return ok(request, {"items": items, "conclusion": repo.build_conclusion(items[0], items[1])})
