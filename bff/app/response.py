"""响应信封：{code,message,data,requestId,serverTime}，code==='0' 成功。"""
import time
import uuid
from fastapi.responses import JSONResponse


def new_request_id() -> str:
    return uuid.uuid4().hex[:24]


def ok(request, data):
    return JSONResponse({
        "code": "0",
        "message": "success",
        "data": data,
        "requestId": getattr(request.state, "request_id", new_request_id()),
        "serverTime": int(time.time() * 1000),
    })


def error(request, status, code, message, details=None):
    return JSONResponse(
        status_code=status,
        content={
            "code": code,
            "message": message,
            "details": details or {},
            "requestId": getattr(request.state, "request_id", new_request_id()),
            "serverTime": int(time.time() * 1000),
        },
    )


class ApiError(Exception):
    def __init__(self, status, code, message, details=None):
        self.status = status
        self.code = code
        self.message = message
        self.details = details or {}
