"""饮品仓储层：MySQL + SQLAlchemy（对齐 v6/server/app_v1/repositories/drinks.py 契约）。

SQLite -> MySQL 转换要点：
- FTS5 MATCH -> MySQL MATCH ... AGAINST IN NATURAL LANGUAGE MODE
- rowid -> sort_order / id 排序
- JSON 列仍用 Python json.loads 解析（MySQL JSON_EXTRACT 按需）
- card_json 物化 DrinkSummary，列表直出
"""
from __future__ import annotations
import json
import time
from typing import Any
from sqlalchemy import text
from app.db import SessionLocal
from app.models import Drink, Taxonomy, DrinkSimilar, Meta, UserProfile, UserFavorite, UserHistory
from app.response import ApiError

INSTALL_HEADER_MAX = 64
HISTORY_LIMIT = 50
SIMILAR_TOP = 10
SIMILAR_SUMMARY = 3
FEATURED_PER_MODE = 4


def _loads(value, default):
    if not value:
        return default
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


def valid_identity(raw: str | None) -> str | None:
    if not raw or len(raw) > INSTALL_HEADER_MAX:
        return None
    return raw.strip()


# ---------- meta ----------

def get_meta() -> dict[str, str]:
    db = SessionLocal()
    try:
        rows = db.query(Meta).all()
        return {r.key: r.value for r in rows}
    finally:
        db.close()


def get_release_code() -> str | None:
    return get_meta().get("release_code")


# ---------- taxonomies ----------

def get_taxonomies() -> dict[str, list[dict]]:
    db = SessionLocal()
    try:
        rows = db.query(Taxonomy).order_by(Taxonomy.mode, Taxonomy.sort_order).all()
        groups: dict[tuple[str, str], dict] = {}
        order: dict[str, list[str]] = {"coffee": [], "cocktail": []}
        for r in rows:
            key = (r.mode, r.group_key)
            if key not in groups:
                groups[key] = {"key": r.group_key, "label": r.group_label, "options": []}
                order[r.mode].append(r.group_key)
            groups[key]["options"].append({"value": r.option_value, "label": r.option_label})
        return {mode: [groups[(mode, k)] for k in order[mode]] for mode in ("coffee", "cocktail")}
    finally:
        db.close()


# ---------- bootstrap ----------

def featured_summaries() -> list[dict]:
    db = SessionLocal()
    try:
        rows = db.query(Drink).filter(Drink.recommendation_score >= 90) \
            .order_by(Drink.recommendation_score.desc()) \
            .limit(FEATURED_PER_MODE * 2).all()
        return [_loads(r.card_json, {}) for r in rows]
    finally:
        db.close()


def get_profile(identity: str | None) -> dict:
    if not identity:
        return {
            "id": "anonymous", "displayName": "匿名访客", "avatarText": "A",
            "favorites": [], "history": [],
            "coffeePreferences": [], "cocktailPreferences": [],
        }
    db = SessionLocal()
    try:
        prof = db.query(UserProfile).filter_by(install_identity=identity).first()
        favs = [r.drink_id for r in db.query(UserFavorite).filter_by(install_identity=identity).all()]
        hist = [r.drink_id for r in db.query(UserHistory)
                .filter_by(install_identity=identity)
                .order_by(UserHistory.viewed_at.desc()).limit(HISTORY_LIMIT).all()]
        if not prof:
            return {
                "id": identity, "displayName": "醒醺用户", "avatarText": identity[0].upper() if identity else "A",
                "favorites": favs, "history": hist,
                "coffeePreferences": [], "cocktailPreferences": [],
            }
        return {
            "id": identity,
            "displayName": prof.display_name or "醒醺用户",
            "avatarUrl": prof.avatar_url,
            "avatarText": prof.avatar_text or (identity[0].upper() if identity else "A"),
            "favorites": favs, "history": hist,
            "coffeePreferences": _loads(prof.coffee_preferences_json, []),
            "cocktailPreferences": _loads(prof.cocktail_preferences_json, []),
        }
    finally:
        db.close()


# ---------- search ----------

def parse_filters(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            raise ValueError("not dict")
        return parsed
    except (TypeError, ValueError):
        raise ApiError(400, "INVALID_REQUEST", "filters 参数不是合法 JSON")


def search_drinks(mode, keyword, filters, sort, page, page_size) -> dict:
    db = SessionLocal()
    try:
        q = db.query(Drink).filter(Drink.mode == mode)

        # 关键词搜索：名称/拼音 LIKE -> MySQL FULLTEXT 兜底
        if keyword and keyword.strip():
            kw = f"%{keyword.strip()}%"
            q = q.filter(
                Drink.name_zh.like(kw) | Drink.name_en.like(kw) |
                Drink.name_pinyin.like(kw) | Drink.name_pinyin_initials.like(kw)
            )

        rows = q.order_by(
            Drink.recommendation_score.desc() if sort == "recommendation" else Drink.name_zh
        ).all()

        # 属性筛选（Python 端，同 SQLite 版）
        for key, rule in (filters or {}).items():
            if not rule:
                continue
            want = rule.get("want", [])
            exclude = rule.get("exclude", [])
            rows = [r for r in rows if _attr_match(r.attributes_json, key, want, exclude)]

        total = len(rows)
        start = (page - 1) * page_size
        paged = rows[start:start + page_size]
        items = [_loads(r.card_json, {}) for r in paged]
        return {
            "items": items, "page": page, "pageSize": page_size,
            "total": total, "hasMore": start + page_size < total,
        }
    finally:
        db.close()


def _attr_match(attr_json: str, key: str, want: list, exclude: list) -> bool:
    attrs = _loads(attr_json, {})
    raw = attrs.get(key)
    values = raw if isinstance(raw, list) else ([raw] if raw else [])
    want_pass = not want or all(w in values for w in want)
    exclude_pass = not exclude or all(e not in values for e in exclude)
    return want_pass and exclude_pass


# ---------- detail ----------

def get_detail(drink_id: str) -> dict | None:
    db = SessionLocal()
    try:
        d = db.query(Drink).filter_by(id=drink_id).first()
        if not d:
            return None
        similar_ids = [r.similar_id for r in db.query(DrinkSimilar)
                       .filter_by(drink_id=drink_id).order_by(DrinkSimilar.rank).limit(SIMILAR_TOP).all()]
        similar_summaries = []
        for sid in similar_ids[:SIMILAR_SUMMARY]:
            s = db.query(Drink).filter_by(id=sid).first()
            if s:
                similar_summaries.append(_loads(s.card_json, {}))
        return {
            "id": d.id, "mode": d.mode, "category": d.category,
            "nameZh": d.name_zh, "nameEn": d.name_en,
            "intro": d.intro, "description": d.description,
            "imageUrl": d.image_url, "posterUrl": d.poster_url,
            "recommendationScore": d.recommendation_score,
            "tags": _loads(d.tags_json, []), "scene": _loads(d.scene_json, []),
            "attributes": _loads(d.attributes_json, {}),
            "ingredients": _loads(d.ingredients_json, []),
            "steps": _loads(d.steps_json, []),
            "radar": _loads(d.radar_json, []),
            "similarIds": similar_ids, "similar": similar_summaries,
            "sourceInfo": {"sourceLevel": d.source_level, "updatedAt": d.updated_at, "reviewed": bool(d.reviewed)},
        }
    finally:
        db.close()


# ---------- recommend ----------

def recommend(mode, scene, preferences, excluded_ids) -> tuple[dict, list[str]]:
    db = SessionLocal()
    try:
        q = db.query(Drink).filter(Drink.mode == mode)
        if excluded_ids:
            q = q.filter(~Drink.id.in_(excluded_ids))
        rows = q.order_by(Drink.recommendation_score.desc()).all()

        # 场景加分
        if scene:
            scored = []
            for r in rows:
                scenes = _loads(r.scene_json, [])
                bonus = 12 if any(scene in s or s in scene for s in scenes) else 0
                scored.append((r, r.recommendation_score + bonus))
            scored.sort(key=lambda x: x[1], reverse=True)
            rows = [x[0] for x in scored]

        d = rows[0] if rows else None
        if not d:
            raise ApiError(404, "DRINK_NOT_FOUND", "暂无推荐")
        detail = get_detail(d.id)
        tags = _loads(d.tags_json, [])
        reasons = [
            f"推荐指数 {d.recommendation_score}%",
            '与"' + (scene or '当前状态') + '"更接近',
            f"风味标签：{'、'.join(tags[:3])}",
        ]
        return detail, reasons
    finally:
        db.close()


# ---------- compare ----------

def build_conclusion(a: dict, b: dict) -> list[str]:
    mode = a.get("mode", "coffee")
    if mode == "coffee":
        return ["左侧更适合专注办公", "右侧更适合清爽提神"]
    return ["左侧更适合社交优雅", "右侧更适合轻松放松"]


# ---------- user state ----------

def record_history(identity: str, drink_id: str):
    db = SessionLocal()
    try:
        existing = db.query(UserHistory).filter_by(install_identity=identity, drink_id=drink_id).first()
        now = time.strftime("%Y-%m-%dT%H:%M:%S")
        if existing:
            existing.viewed_at = now
        else:
            db.add(UserHistory(install_identity=identity, drink_id=drink_id, viewed_at=now))
        db.commit()
    finally:
        db.close()


def toggle_favorite(identity: str, drink_id: str) -> dict:
    db = SessionLocal()
    try:
        existing = db.query(UserFavorite).filter_by(install_identity=identity, drink_id=drink_id).first()
        if existing:
            db.delete(existing)
            fav = False
        else:
            db.add(UserFavorite(install_identity=identity, drink_id=drink_id,
                                created_at=time.strftime("%Y-%m-%dT%H:%M:%S")))
            fav = True
        db.commit()
        favs = [r.drink_id for r in db.query(UserFavorite).filter_by(install_identity=identity).all()]
        return {"favorite": fav, "favorites": favs}
    finally:
        db.close()


def update_preferences(identity: str, mode: str, values: list[str]) -> dict:
    db = SessionLocal()
    try:
        prof = db.query(UserProfile).filter_by(install_identity=identity).first()
        now = time.strftime("%Y-%m-%dT%H:%M:%S")
        if not prof:
            prof = UserProfile(
                install_identity=identity, display_name="醒醺用户",
                coffee_preferences_json="[]", cocktail_preferences_json="[]",
                updated_at=now,
            )
            db.add(prof)
        if mode == "coffee":
            prof.coffee_preferences_json = json.dumps(values, ensure_ascii=False)
        else:
            prof.cocktail_preferences_json = json.dumps(values, ensure_ascii=False)
        prof.updated_at = now
        db.commit()
        return get_profile(identity)
    finally:
        db.close()
