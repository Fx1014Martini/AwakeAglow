"""饮品仓储层：MySQL + SQLAlchemy（对齐 v6/server/app_v1/repositories/drinks.py 契约）。

SQLite -> MySQL 转换要点：
- FTS5 MATCH -> MySQL MATCH ... AGAINST IN NATURAL LANGUAGE MODE
- rowid -> sort_order / id 排序
- JSON 列仍用 Python json.loads 解析（MySQL JSON_EXTRACT 按需）
- card_json 物化 DrinkSummary，列表直出
"""
from __future__ import annotations
import json
import random
import time
from typing import Any
from sqlalchemy import text
from app.db import SessionLocal
from app.models import Drink, Taxonomy, DrinkSimilar, Meta, UserProfile, UserFavorite, UserHistory
from app.response import ApiError

INSTALL_HEADER_MAX = 64
# 用户表时间列均为 VARCHAR(16)：时间戳用 "%Y-%m-%dT%H:%M:%S"（16 字符）落库，超出会被 MySQL 截断拒绝（1406）
HISTORY_LIMIT = 50
SIMILAR_TOP = 10
SIMILAR_SUMMARY = 3
FEATURED_PER_MODE = 4


# 固定值 -> 数据库 attributes 精确值列表（组内 OR；空列表 = 数据库无对应档，诚实不命中）
FIXED_TO_DB_EXACT: dict[str, dict[str, list[str]]] = {
    "coffeeType": {
        "浓缩咖啡": ["浓缩基底"],
        "黑咖啡": ["黑咖啡"],
        "奶咖": ["奶咖"],
        "手冲咖啡": ["手冲", "手冲过滤"],
        "冷萃咖啡": ["冷萃"],
        "咖啡特调": ["风味咖啡", "茶咖"],  # 近似：加味/茶咖类特调
    },
    "milk": {
        "无奶": ["无奶"],
        "牛奶": ["含乳"],
        "燕麦奶": ["燕麦奶"],
        "椰奶": ["椰奶"],
        "其他植物奶": ["杏仁奶", "豆奶"],
        "奶油": [],  # 数据库 milk 无奶油档（奶油产品归入 extra）
    },
    "sweetBitter": {
        "不甜低苦": ["不甜微苦"],
        "不甜偏苦": ["不甜偏苦"],
        "微甜低苦": ["微甜低苦"],
        "微甜偏苦": ["微甜偏苦"],
        "偏甜低苦": ["偏甜低苦"],
        "偏甜偏苦": ["偏甜微苦"],  # 近似：数据库甜度档最接近
    },
    "temperature": {"热饮": ["热饮"], "冰饮": ["冰饮"], "常温": ["常温"]},
    "caffeine": {
        "无咖啡因": ["低咖啡因"],  # 数据库无无咖啡因档，脱咖产品标低咖啡因
        "低咖啡因": ["低咖啡因"],
        "中等咖啡因": ["中等咖啡因"],
        "较高咖啡因": ["较高咖啡因"],
        "高咖啡因": ["高咖啡因"],
    },
    "baseSpirit": {
        "金酒": ["金酒基底"],
        "伏特加": ["伏特加基底"],
        "朗姆酒": ["朗姆基底"],
        "威士忌": ["威士忌基底", "波本基底", "黑麦基底"],
        "龙舌兰/梅斯卡尔": ["龙舌兰基底"],
        "白兰地": ["白兰地基底", "干邑基底"],
        "无单一基酒": ["未标注基酒"],
    },
    "cocktailType": {
        "高球长饮": ["高球"],
        "酸甜短饮": ["酸型鸡尾酒", "酸基"],
        "烈酒短饮": ["烈酒主导"],
        "气泡型": ["菲兹", "科林斯"],
        "热带果汁型": ["提基"],
        "咖啡/甜点型": ["咖啡鸡尾酒", "奶油"],
        "热鸡尾酒": [],  # 数据库类型无热饮档（hot toddy 类归古典家族，不映射避免误筛）
    },
    "abv": {
        "无酒精": ["酒精度未知"],  # 数据库无无酒精档（低醇产品标酒精度未知）
        "低度≤10%": ["低度≤10%"],
        "中度＞10%～20%": ["中度＞10%～20%"],
        "较高＞20%～30%": ["较高＞20%～30%"],
        "高度＞30%": ["高度＞30%"],
    },
    "extra": {
        "柠檬/青柠": ["新鲜青柠汁", "新鲜柠檬汁", "柠檬苏打"],
        "其他水果": ["新鲜橙汁", "新鲜葡萄柚汁", "橙汁", "芒果汁", "苹果汁", "百香果汁", "百香果糖浆", "菠萝汁", "蔓越莓汁", "荔枝糖浆", "草莓糖浆", "树莓糖浆"],
        "苏打/汤力": ["苏打水", "汤力水", "气泡水", "姜汁汽水", "柠檬苏打"],
        "咖啡": ["浓缩咖啡液", "双份浓缩咖啡液", "冷萃浓缩液"],
        "奶/奶油": ["全脂牛奶", "稀奶油", "打发奶油", "椰奶", "椰浆"],
        "蛋清": ["蛋清"],
        "姜辣香料": ["姜汁啤酒", "姜汁汽水", "辣酱", "细海盐", "肉桂棒", "罗勒叶", "迷迭香"],
        "无明显非酒精成分": ["无明显非酒精成分"],
    },
}

# 固定值 -> 数据库子串（flavor 为组合串，如「果香、柑橘」，用子串包含匹配）
FIXED_TO_DB_SUBSTR: dict[str, dict[str, list[str]]] = {
    "flavor": {
        "酸味明显": ["酸甜"],
        "甜味明显": ["甜感明显"],
        "苦味明显": ["苦味明显", "苦感主导"],
        "辛辣刺激": ["辛辣"],
        "酸甜平衡": ["酸甜"],
        "甜苦平衡": ["甜感明显", "苦味明显", "苦感主导"],  # 近似：甜苦并存任一命中
        "偏干不甜": ["偏干"],
    },
}


def _expand_fixed(key: str, value: str) -> tuple[list[str], bool]:
    """固定字典值 -> (数据库候选值列表, 是否子串匹配)。未映射时原样精确匹配。"""
    exact = FIXED_TO_DB_EXACT.get(key, {}).get(value)
    if exact is not None:
        return exact, False
    substr = FIXED_TO_DB_SUBSTR.get(key, {}).get(value)
    if substr is not None:
        return substr, True
    return [value], False


def _attr_match_fixed(attr_json: str, key: str, want: list, exclude: list) -> bool:
    """固定字典筛选匹配：单个固定值展开候选组内 OR；多个 WANT 之间 AND；EXCLUDE 任一命中剔除。"""
    attrs = _loads(attr_json, {})
    raw = attrs.get(key)
    values = raw if isinstance(raw, list) else ([raw] if raw else [])

    def hit(value: str) -> bool:
        cands, is_substr = _expand_fixed(key, value)
        if not cands:
            return False
        if is_substr:
            return any(any(c in v for v in values) for c in cands)
        return any(c in values for c in cands)

    want_pass = not want or all(hit(w) for w in want)
    exclude_pass = not exclude or not any(hit(e) for e in exclude)
    return want_pass and exclude_pass


def _pref_hit(p: str, attr_values: list, tags: list, scenes: list) -> bool:
    """偏好值（固定字典）是否命中产品：直接命中（mock 语义）或展开映射命中。"""
    if p in attr_values or p in tags or p in scenes:
        return True
    for key, mapping in FIXED_TO_DB_EXACT.items():
        cands = mapping.get(p)
        if cands and any(c in attr_values for c in cands):
            return True
    for key, mapping in FIXED_TO_DB_SUBSTR.items():
        cands = mapping.get(p)
        if cands and any(any(c in v for v in attr_values) for c in cands):
            return True
    return False


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


# ---------- taxonomies ----------

# 筛选组展示顺序（固定字典；taxonomy 表按 group_key 字母序存储，展示时按此顺序）
GROUP_ORDER: dict[str, list[str]] = {
    "coffee": ["coffeeType", "milk", "sweetBitter", "temperature", "caffeine"],
    "cocktail": ["baseSpirit", "cocktailType", "flavor", "abv", "extra"],
}


def get_taxonomies() -> dict[str, list[dict]]:
    """返回筛选字典（读 taxonomy 表，数据为固定字典，契约 FilterOption{value,label}）。"""
    db = SessionLocal()
    try:
        rows = db.query(Taxonomy).order_by(Taxonomy.mode, Taxonomy.group_key, Taxonomy.sort_order).all()
        groups: dict[tuple[str, str], dict] = {}
        for r in rows:
            key = (r.mode, r.group_key)
            if key not in groups:
                groups[key] = {"key": r.group_key, "label": r.group_label, "options": []}
            groups[key]["options"].append({"value": r.option_value, "label": r.option_label})
        out: dict[str, list[dict]] = {}
        for mode, keys in GROUP_ORDER.items():
            out[mode] = [groups[(mode, k)] for k in keys if (mode, k) in groups]
        return out
    finally:
        db.close()


# ---------- bootstrap ----------

def _summary_with_poster(r: Drink) -> dict:
    """card_json 缓存不含 posterUrl，从数据库列补齐 imageUrl/posterUrl，与 get_detail 对齐。"""
    card = _loads(r.card_json, {})
    card["imageUrl"] = r.image_url
    card["posterUrl"] = r.poster_url
    return card


def featured_summaries() -> list[dict]:
    """每模式取推荐分 top FEATURED_PER_MODE 款，按日期轮换（同一天稳定，每天不同）。"""
    db = SessionLocal()
    try:
        day_seed = int(time.strftime("%Y%m%d"))  # 如 20260817
        random.seed(day_seed)
        out: list[dict] = []
        for mode in ("coffee", "cocktail"):
            # 取高分池（top 12），按日期偏移选 4 款
            pool = db.query(Drink).filter(Drink.mode == mode) \
                .order_by(Drink.recommendation_score.desc()) \
                .limit(FEATURED_PER_MODE * 3).all()
            if len(pool) <= FEATURED_PER_MODE:
                selected = pool
            else:
                offset = random.randint(0, len(pool) - FEATURED_PER_MODE)
                selected = pool[offset:offset + FEATURED_PER_MODE]
            out.extend(_summary_with_poster(r) for r in selected)
        return out
    finally:
        db.close()


# ---------- scenes / compare-rows / discovery / knowledge ----------

def get_scenes() -> dict[str, list[str]]:
    """聚合各模式 drink.scene_json 的去重场景（保持推荐分序首次出现顺序）。"""
    db = SessionLocal()
    try:
        rows = db.query(Drink).order_by(Drink.recommendation_score.desc()).all()
        seen: dict[str, list[str]] = {"coffee": [], "cocktail": []}
        for r in rows:
            for s in _loads(r.scene_json, []):
                if isinstance(s, str) and s and s not in seen[r.mode]:
                    seen[r.mode].append(s)
        return seen
    finally:
        db.close()


def get_compare_rows() -> dict[str, list[dict]]:
    """对比维度 = taxonomy 分组 + 适合场景（前端 buildRows 按 attributes[key] 取值，scene 特判）。"""
    taxonomies = get_taxonomies()
    out: dict[str, list[dict]] = {}
    for mode, groups in taxonomies.items():
        rows = [{"key": g["key"], "label": g["label"]} for g in groups]
        rows.append({"key": "scene", "label": "适合场景"})
        out[mode] = rows
    return out


# 发现场景静态配置（与前端 mock/discoveryScenes.json + homeScene 映射一致）
_DISCOVERY_SCENES = [
    {"id": "morning-focus", "scene": "晨间专注", "mode": "coffee", "desc": "清醒开始一天，低苦醇厚", "homeScene": "日常"},
    {"id": "afternoon-break", "scene": "午后小憩", "mode": "coffee", "desc": "柔和奶香，不抢注意力", "homeScene": "下午茶"},
    {"id": "weekend-brew", "scene": "周末手冲", "mode": "coffee", "desc": "花时间理解风味层次", "homeScene": "新手友好"},
    {"id": "social-night", "scene": "社交夜晚", "mode": "cocktail", "desc": "酸甜平衡，适合举杯", "homeScene": "开胃"},
    {"id": "solo-relax", "scene": "独处微醺", "mode": "cocktail", "desc": "克制烈感，慢慢品", "homeScene": "经典"},
    {"id": "party-fresh", "scene": "派对清爽", "mode": "cocktail", "desc": "高球长饮，清爽不腻", "homeScene": "夏季"},
]


def get_discovery_scenes() -> list[dict]:
    return [dict(s) for s in _DISCOVERY_SCENES]


# 知识百科静态内容（消费者向，与前端 MockService 同构）
_KNOWLEDGE_CATEGORIES = [
    {"id": "coffee-basics", "title": "咖啡基础", "desc": "浓缩、手冲、奶咖的区别", "mode": "coffee"},
    {"id": "coffee-beans", "title": "豆种与产地", "desc": "阿拉比卡、罗布斯塔、产区风味", "mode": "coffee"},
    {"id": "coffee-brew", "title": "冲煮参数", "desc": "粉水比、研磨度、水温", "mode": "coffee"},
    {"id": "cocktail-basics", "title": "鸡尾酒入门", "desc": "基酒、技法、经典结构", "mode": "cocktail"},
    {"id": "cocktail-spirits", "title": "六大基酒", "desc": "金酒、伏特加、朗姆、威士忌、龙舌兰、白兰地", "mode": "cocktail"},
    {"id": "cocktail-iba", "title": "IBA 经典", "desc": "国际调酒师协会官方配方", "mode": "cocktail"},
]

_KNOWLEDGE_ARTICLES = {
    "coffee-basics": {"title": "咖啡基础", "lead": "先理解结构，再选择风味。", "points": ["浓缩是基底，风味集中、口感厚实。", "奶咖用牛奶或植物奶拉长口感，甜感更柔和。", "手冲强调豆子产地与冲煮参数，层次更清晰。"]},
    "coffee-beans": {"title": "豆种与产地", "lead": "同一杯咖啡，产区会改变它的性格。", "points": ["阿拉比卡通常香气更复杂，罗布斯塔更醇厚有力。", "高海拔豆常见花香、果酸与更明亮的尾韵。", "深烘焙偏坚果、可可与焦糖，浅烘焙更突出产地风味。"]},
    "coffee-brew": {"title": "冲煮参数", "lead": "粉水比、研磨度和水温共同决定萃取。", "points": ["研磨越细，萃取越快；苦涩时可适当调粗。", "水温高会带来更充分萃取，浅烘豆通常更适合高温。", "先固定粉水比，再一次只调整一个变量。"]},
    "cocktail-basics": {"title": "鸡尾酒入门", "lead": "基酒决定骨架，甜酸决定平衡。", "points": ["先辨认基酒，再看甜、酸、苦与气泡的关系。", "摇和适合果汁、糖浆等需要充分融合的配方。", "搅拌保留清澈与丝滑口感，常用于烈酒型经典。"]},
    "cocktail-spirits": {"title": "六大基酒", "lead": "从基酒入门，是最快建立味觉地图的方法。", "points": ["金酒带草本与杜松子香，伏特加干净中性。", "朗姆偏甘蔗与热带风味，威士忌常见木质、谷物和烟熏。", "龙舌兰有植物与泥土感，白兰地更偏果香与熟成。"]},
    "cocktail-iba": {"title": "IBA 经典", "lead": "经典配方是理解鸡尾酒结构的共同语言。", "points": ["先按标准配方体验，再根据个人口味微调。", "杯型、冰块和稀释量会显著影响最终口感。", "经典不是固定答案，而是一套可复用的平衡方法。"]},
}


def get_knowledge() -> dict:
    return {
        "categories": [dict(c) for c in _KNOWLEDGE_CATEGORIES],
        "articles": {k: {"title": v["title"], "lead": v["lead"], "points": list(v["points"])} for k, v in _KNOWLEDGE_ARTICLES.items()},
    }


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

        # 关键词搜索：名称/拼音/简介 LIKE；标签与场景在 JSON 文本上 LIKE
        # （对齐前端语义：搜索咖啡名称 / 风味 / 场景）
        if keyword and keyword.strip():
            kw = f"%{keyword.strip()}%"
            q = q.filter(
                Drink.name_zh.like(kw) | Drink.name_en.like(kw) |
                Drink.name_pinyin.like(kw) | Drink.name_pinyin_initials.like(kw) |
                Drink.intro.like(kw) | Drink.tags_json.like(kw) | Drink.scene_json.like(kw)
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
            rows = [r for r in rows if _attr_match_fixed(r.attributes_json, key, want, exclude)]

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

def _flat_attr_values(attrs: dict) -> list:
    """attributes 值展平（list 展开元素，标量转单元素列表，None/空跳过）。"""
    out: list = []
    for vv in attrs.values():
        if isinstance(vv, list):
            out.extend(v for v in vv if v)
        elif vv:
            out.append(vv)
    return out


def recommend(mode, scene, preferences, excluded_ids) -> tuple[dict, list[str]]:
    db = SessionLocal()
    try:
        q = db.query(Drink).filter(Drink.mode == mode)
        if excluded_ids:
            q = q.filter(~Drink.id.in_(excluded_ids))
        rows = q.order_by(Drink.recommendation_score.desc()).all()

        prefs = [p for p in (preferences or []) if isinstance(p, str) and p]

        # 场景加分 + 偏好加分（偏好与 attributes 值/tags/scene 命中各 +5，封顶 +25）：
        # 用户在「我的-偏好筛选」保存的标签实际影响推荐排序
        scored = []
        for r in rows:
            scenes = _loads(r.scene_json, [])
            tags = _loads(r.tags_json, [])
            attr_values = _flat_attr_values(_loads(r.attributes_json, {}))
            scene_bonus = 12 if (scene and any(scene in s or s in scene for s in scenes)) else 0
            pref_hits = sum(1 for p in prefs if _pref_hit(p, attr_values, tags, scenes))
            pref_bonus = min(pref_hits * 5, 25)
            scored.append((r, r.recommendation_score + scene_bonus + pref_bonus))
        scored.sort(key=lambda x: x[1], reverse=True)
        rows = [x[0] for x in scored]

        if not rows:
            raise ApiError(404, "DRINK_NOT_FOUND", "暂无推荐")
        # 从 top 3 加权随机（分数高概率大），偏好命中款必然优先
        if prefs:
            hit_rows = [r for r in rows[:10] if sum(1 for p in prefs if _pref_hit(p, _flat_attr_values(_loads(r.attributes_json, {})), _loads(r.tags_json, []), _loads(r.scene_json, []))) > 0]
            if hit_rows:
                rows = hit_rows[:3]
        top = rows[:3]
        weights = [max(1, r.recommendation_score - 50) for r in top]
        d = random.choices(top, weights=weights, k=1)[0]
        detail = get_detail(d.id)
        tags = _loads(d.tags_json, [])
        reasons = [
            f"推荐指数 {d.recommendation_score}%",
            '与"' + (scene or '当前状态') + '"更接近',
            f"风味标签：{'、'.join(tags[:3])}",
        ]
        if prefs:
            d_attrs = _flat_attr_values(_loads(d.attributes_json, {}))
            d_scenes = _loads(d.scene_json, [])
            hit_prefs = [p for p in prefs if _pref_hit(p, d_attrs, tags, d_scenes)]
            if hit_prefs:
                reasons.insert(1, f"符合你的偏好：{'、'.join(hit_prefs[:4])}")
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
        if not db.query(Drink.id).filter_by(id=drink_id).first():
            raise ApiError(404, "DRINK_NOT_FOUND", f"饮品不存在：{drink_id}")
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
