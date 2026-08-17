"""扩展端点：场景字典 / 对比维度 / 发现场景 / 知识百科（对齐前端 AppService 契约）。"""
from fastapi import APIRouter, Request
from app import repository as repo
from app.response import ok

router = APIRouter()


@router.get("/scenes")
def get_scenes(request: Request):
    return ok(request, repo.get_scenes())


@router.get("/compare-rows")
def get_compare_rows(request: Request):
    return ok(request, repo.get_compare_rows())


@router.get("/discovery-scenes")
def get_discovery_scenes(request: Request):
    return ok(request, repo.get_discovery_scenes())


@router.get("/knowledge")
def get_knowledge(request: Request):
    return ok(request, repo.get_knowledge())
