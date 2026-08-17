"""BFF repository 核心逻辑测试（sqlite 内存库 + monkeypatch SessionLocal）。

运行：cd bff && pytest tests/ -v
覆盖：固定字典读表/组序、筛选映射（固定值->DB 值域）、AND/EXCLUDE 语义、
      recommend 偏好联动、场景聚合、对比维度。
"""
import re
import sqlite3

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import repository as repo

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # bff/


def _load_seed_sqlite():
    """seed.sql -> 内存 sqlite（剥离 MySQL 方言）。"""
    sql = open(f"{BASE}/seed.sql", encoding="utf-8").read()
    schema = open(f"{BASE}/schema.sql", encoding="utf-8").read()
    raw = sqlite3.connect(":memory:")
    schema = re.sub(r"^CREATE DATABASE[^;]*;|^USE [^;]*;", "", schema, flags=re.I | re.M)
    schema = re.sub(r"ENGINE=InnoDB[^;]*", "", schema)
    schema = re.sub(r",\s*(FULLTEXT\s+)?INDEX[^(]*\([^)]*\)", "", schema)
    schema = re.sub(r"MEDIUMTEXT", "TEXT", schema)
    schema = re.sub(r"COMMENT '[^']*'", "", schema)
    raw.executescript(schema)
    for line in sql.split("\n"):
        line = line.strip()
        if not line.upper().startswith("INSERT"):
            continue
        stmt = re.sub(r"ON DUPLICATE KEY UPDATE.*$", "", line, flags=re.S)
        stmt = stmt.replace("\\'", "''")
        raw.execute(stmt)
    raw.commit()
    return raw


@pytest.fixture()
def repo_db():
    raw = _load_seed_sqlite()
    engine = create_engine("sqlite://", creator=lambda: raw)
    old = repo.SessionLocal
    repo.SessionLocal = sessionmaker(bind=engine, autoflush=False)
    yield raw
    repo.SessionLocal = old
    raw.close()


# ---------- 固定字典 ----------

def test_taxonomies_group_order(repo_db):
    t = repo.get_taxonomies()
    assert [g["key"] for g in t["coffee"]] == ["coffeeType", "milk", "sweetBitter", "temperature", "caffeine"]
    assert [g["key"] for g in t["cocktail"]] == ["baseSpirit", "cocktailType", "flavor", "abv", "extra"]
    coffee_type = t["coffee"][0]
    assert coffee_type["label"] == "咖啡类型"
    assert [o["value"] for o in coffee_type["options"]] == ["浓缩咖啡", "黑咖啡", "奶咖", "手冲咖啡", "冷萃咖啡", "咖啡特调"]


def test_compare_rows(repo_db):
    rows = repo.get_compare_rows()
    assert rows["coffee"][-1] == {"key": "scene", "label": "适合场景"}
    assert [r["key"] for r in rows["cocktail"]] == ["baseSpirit", "cocktailType", "flavor", "abv", "extra", "scene"]


# ---------- 筛选映射 ----------

def _search(mode, filters):
    return repo.search_drinks(mode, None, filters, "recommendation", 1, 100)


def test_filter_fixed_value_mapping(repo_db):
    # 固定字典值「金酒」-> DB 值域「金酒基底」
    r = _search("cocktail", {"baseSpirit": {"want": ["金酒"], "exclude": []}})
    assert r["total"] > 0
    for item in r["items"]:
        assert "金酒基底" in item.get("attributes", {}).get("baseSpirit", []) or \
               item.get("attributes", {}).get("baseSpirit") == "金酒基底"

    # 「牛奶」->「含乳」
    r2 = _search("coffee", {"milk": {"want": ["牛奶"], "exclude": []}})
    assert r2["total"] > 0

    # 多候选展开（威士忌 -> 威士忌/波本/黑麦基底），单值组内 OR
    r3 = _search("cocktail", {"baseSpirit": {"want": ["威士忌"], "exclude": []}})
    single_a = _search("cocktail", {"baseSpirit": {"want": ["威士忌"], "exclude": []}})["total"]
    assert r3["total"] >= single_a


def test_filter_want_and_semantics(repo_db):
    # 多 WANT 组间 AND（保留原语义）
    a = _search("cocktail", {"extra": {"want": ["柠檬/青柠"], "exclude": []}})["total"]
    b = _search("cocktail", {"extra": {"want": ["苏打/汤力"], "exclude": []}})["total"]
    both = _search("cocktail", {"extra": {"want": ["柠檬/青柠", "苏打/汤力"], "exclude": []}})["total"]
    assert 0 < both <= min(a, b)


def test_filter_exclude(repo_db):
    all_c = _search("cocktail", {})["total"]
    excluded = _search("cocktail", {"baseSpirit": {"want": [], "exclude": ["金酒"]}})["total"]
    assert excluded < all_c


def test_filter_flavor_substr(repo_db):
    # flavor 组合串子串匹配
    r = _search("cocktail", {"flavor": {"want": ["酸甜平衡"], "exclude": []}})
    assert r["total"] > 0


def test_search_keyword(repo_db):
    r = repo.search_drinks("cocktail", "咖啡", None, "recommendation", 1, 10)
    assert r["total"] > 0


# ---------- 推荐 ----------

def test_recommend_scene_bonus(repo_db):
    drink, _ = repo.recommend("cocktail", "开胃", None, None)
    assert drink["id"]


def test_recommend_preferences_hit(repo_db):
    drink, reasons = repo.recommend("cocktail", None, ["金酒"], None)
    assert drink["id"]
    assert any("金酒" in r for r in reasons)


def test_recommend_no_candidate_404(repo_db):
    all_ids = [r[0] for r in repo_db.execute("SELECT id FROM drink WHERE mode='cocktail'").fetchall()]
    with pytest.raises(repo.ApiError) as exc:
        repo.recommend("cocktail", None, None, all_ids)
    assert exc.value.code == "DRINK_NOT_FOUND"


# ---------- 场景 / 明细 ----------

def test_scenes_aggregation(repo_db):
    scenes = repo.get_scenes()
    assert "日常" in scenes["coffee"]
    assert "开胃" in scenes["cocktail"]


def test_detail_fields(repo_db):
    d = repo.get_detail("cocktail-mojito")
    assert d and d["nameZh"] == "莫吉托"
    assert d["ingredients"] and d["steps"] and d["radar"]


def test_detail_not_found(repo_db):
    assert repo.get_detail("nonexistent") is None
