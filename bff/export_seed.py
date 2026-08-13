#!/usr/bin/env python3
"""导出 SQLite 数据为 MySQL seed.sql（微信云托管用）。

用法：
  python3 export_seed.py > seed.sql
"""
import sqlite3
import json
import os
import re

SQLITE_PATH = os.environ.get(
    "SQLITE_PATH",
    "/Users/fangxin/vibe_coding/AwakeAglow/v6/workspace/db/awakeaglow_v6_simple.db",
)

PLACEHOLDER = "/assets/images/placeholder.jpg"


def fix_url(url, drink_id):
    """修正图片 URL：本地 127.0.0.1 地址替换为小程序本地资源或占位图。"""
    if not url:
        return PLACEHOLDER
    if "127.0.0.1" not in url:
        return url
    # 本地开发地址：http://127.0.0.1:8020/static/products/{id}/card.webp?v=...
    # 优先用小程序 assets/images/posters/{id}-hero.webp（26 个有海报的产品）
    hero = f"/assets/images/posters/{drink_id}-hero.webp"
    # 检查本地资源是否存在（脚本运行目录为 bff/）
    assets_root = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
    hero_abs = os.path.join(assets_root, "posters", f"{drink_id}-hero.webp")
    if os.path.exists(hero_abs):
        return hero
    # 普通图（无 -hero 后缀）
    plain = os.path.join(assets_root, f"{drink_id}.webp")
    if os.path.exists(plain):
        return f"/assets/images/{drink_id}.webp"
    plain_jpg = os.path.join(assets_root, f"{drink_id}.jpg")
    if os.path.exists(plain_jpg):
        return f"/assets/images/{drink_id}.jpg"
    return PLACEHOLDER


def fix_card_json(card_json, drink_id):
    """同步修正 card_json 内嵌的 imageUrl。"""
    if not card_json:
        return card_json
    try:
        obj = json.loads(card_json)
        if isinstance(obj, dict) and "imageUrl" in obj:
            obj["imageUrl"] = fix_url(obj["imageUrl"], drink_id)
        return json.dumps(obj, ensure_ascii=False)
    except (json.JSONDecodeError, TypeError):
        return card_json


def esc(s):
    """MySQL 字符串转义"""
    if s is None:
        return "NULL"
    if isinstance(s, (int, float)):
        return str(s)
    return "'" + str(s).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r") + "'"


def main():
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    print("-- 醒醺 BFF 种子数据（由 export_seed.py 从 SQLite 导出）")
    print("-- 导入前请先执行 schema.sql 建表")
    print("-- 注意：本地 127.0.0.1 图片地址已替换为小程序本地资源或占位图")
    print("SET NAMES utf8mb4;")
    print("USE awakeaglow;")
    print()

    # meta
    rows = conn.execute("SELECT `key`, `value` FROM meta").fetchall()
    print(f"-- meta: {len(rows)} rows")
    for r in rows:
        print(f"INSERT INTO meta (`key`, `value`) VALUES ({esc(r['key'])}, {esc(r['value'])}) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);")
    print()

    # drink
    rows = conn.execute("SELECT * FROM drink").fetchall()
    print(f"-- drink: {len(rows)} rows")
    cols = ["id", "mode", "category", "name_zh", "name_en", "name_pinyin", "name_pinyin_initials",
            "intro", "description", "image_url", "poster_url", "recommendation_score", "sort_order",
            "radar_json", "tags_json", "scene_json", "attributes_json", "ingredients_json", "steps_json",
            "aliases_json", "source_level", "updated_at", "reviewed", "card_json"]
    fixed_count = 0
    for r in rows:
        d = dict(r)
        # 修正本地图片 URL
        before_img = d["image_url"]
        before_poster = d["poster_url"]
        d["image_url"] = fix_url(d["image_url"], d["id"])
        d["poster_url"] = fix_url(d["poster_url"], d["id"])
        d["card_json"] = fix_card_json(d["card_json"], d["id"])
        if before_img != d["image_url"] or before_poster != d["poster_url"]:
            fixed_count += 1
        vals = ", ".join(esc(d[c]) for c in cols)
        print(f"INSERT INTO drink ({', '.join(cols)}) VALUES ({vals}) ON DUPLICATE KEY UPDATE card_json=VALUES(card_json);")
    print(f"-- 图片 URL 修正：{fixed_count} 条本地地址已替换为本地资源或占位图")
    print()

    # taxonomy
    rows = conn.execute("SELECT * FROM taxonomy").fetchall()
    print(f"-- taxonomy: {len(rows)} rows")
    for r in rows:
        d = dict(r)
        print(f"INSERT INTO taxonomy (mode, group_key, group_label, option_value, option_label, sort_order) VALUES ({esc(d['mode'])}, {esc(d['group_key'])}, {esc(d['group_label'])}, {esc(d['option_value'])}, {esc(d['option_label'])}, {esc(d['sort_order'])}) ON DUPLICATE KEY UPDATE option_label=VALUES(option_label);")
    print()

    # drink_similar
    rows = conn.execute("SELECT * FROM drink_similar").fetchall()
    print(f"-- drink_similar: {len(rows)} rows")
    for r in rows:
        d = dict(r)
        print(f"INSERT INTO drink_similar (drink_id, similar_id, `rank`, score) VALUES ({esc(d['drink_id'])}, {esc(d['similar_id'])}, {esc(d['rank'])}, {esc(d['score'])}) ON DUPLICATE KEY UPDATE score=VALUES(score);")
    print()

    print("-- 导入完成")
    conn.close()


if __name__ == "__main__":
    main()
