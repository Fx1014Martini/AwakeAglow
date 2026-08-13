"""醒醺 BFF（微信云托管版）。

FastAPI + SQLAlchemy + MySQL，容器化部署到微信云托管。
基础路径 /api/v1，端口 80（云托管要求）。
小程序通过 HTTPS 直连公网域名调用（wx.request）。
"""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import drinks as drinks_api
from app.api import me as me_api
from app.response import ApiError, error, new_request_id
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("awakeaglow")

app = FastAPI(title="醒醺 BFF", version="1.0.0", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drinks_api.router, prefix="/api/v1", tags=["drinks"])
app.include_router(me_api.router, prefix="/api/v1", tags=["me"])


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request.state.request_id = new_request_id()
    t0 = time.time()
    response = await call_next(request)
    response.headers["X-Request-Id"] = request.state.request_id
    response.headers["Server-Timing"] = f"total;dur={int((time.time() - t0) * 1000)}"
    return response


@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError):
    return error(request, exc.status, exc.code, exc.message, exc.details)


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    logger.exception("Unhandled: %s", request.url.path)
    return error(request, 500, "INTERNAL_ERROR", "服务内部错误")


@app.get("/health/live")
def health_live():
    return {"status": "alive"}


@app.get("/health/ready")
def health_ready():
    try:
        from app import repository as repo
        meta = repo.get_meta()
        if not meta.get("release_code"):
            return JSONResponse(status_code=503, content={"status": "not_ready", "reason": "no_release"})
        return {"status": "ready", "content_release": meta["release_code"]}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "not_ready", "reason": str(e)})
