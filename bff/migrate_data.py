#!/usr/bin/env python3
"""SQLite -> MySQL 数据迁移脚本（微信云托管）。

用法：
  # 本地测试（先启动本地 MySQL）
  MYSQL_ADDRESS=127.0.0.1:3306 MYSQL_USERNAME=root MYSQL_PASSWORD=xxx python3 migrate_data.py

  # 云托管 MySQL（内网地址在云托管控制台查看）
  MYSQL_ADDRESS=10.x.x.x:3306 MYSQL_USERNAME=xxx MYSQL_PASSWORD=xxx python3 migrate_data.py
"""
import sqlite3
import os
import sys
import json
from sqlalchemy import create_engine, text

SQLITE_PATH = os.environ.get("SQLITE_PATH", "../../v6/workspace/db/awakeaglow_v6_simple.db")

_address = os.environ.get("MYSQL_ADDRESS", "127.0.0.1:3306").split(":")
_host = _address[0]
_port = _address[1] if len(_address) > 1 else "3306"
_user = os.environ.get("MYSQL_USERNAME", "root")
_password = os.environ.get("MYSQL_PASSWORD", "")
_db = os.environ.get("MYSQL_DATABASE", "awakeaglow")


def migrate():
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    engine = create_engine(f"mysql+pymysql://{_user}:{_password}@{_host}:{_port}/{_db}?charset=utf8mb4")

    with engine.connect() as conn:
        # 执行 schema
        with open(os.path.join(os.path.dirname(__file__), "schema.sql")) as f:
            schema = f.read()
        for stmt in schema.split(";"):
            stmt = stmt.strip()
            if stmt and not stmt.startswith("--"):
                conn.execute(text(stmt))
        conn.commit()
        print("✅ Schema created")

        # 迁移 meta
        rows = sqlite_conn.execute("SELECT key, value FROM meta").fetchall()
        for r in rows:
            conn.execute(text("INSERT INTO meta (`key`, `value`) VALUES (:k, :v) ON DUPLICATE KEY UPDATE `value`=:v"),
                         {"k": r["key"], "v": r["value"]})
        conn.commit()
        print(f"✅ meta: {len(rows)} rows")

        # 迁移 drink
        rows = sqlite_conn.execute("SELECT * FROM drink").fetchall()
        for r in rows:
            d = dict(r)
            conn.execute(text("""
                INSERT INTO drink (id,mode,category,name_zh,name_en,name_pinyin,name_pinyin_initials,
                    intro,description,image_url,poster_url,recommendation_score,sort_order,
                    radar_json,tags_json,scene_json,attributes_json,ingredients_json,steps_json,
                    aliases_json,source_level,updated_at,reviewed,card_json)
                VALUES (:id,:mode,:category,:name_zh,:name_en,:name_pinyin,:name_pinyin_initials,
                    :intro,:description,:image_url,:poster_url,:recommendation_score,:sort_order,
                    :radar_json,:tags_json,:scene_json,:attributes_json,:ingredients_json,:steps_json,
                    :aliases_json,:source_level,:updated_at,:reviewed,:card_json)
                ON DUPLICATE KEY UPDATE card_json=VALUES(card_json)
            """), {k: d[k] for k in d})
        conn.commit()
        print(f"✅ drink: {len(rows)} rows")

        # 迁移 taxonomy
        rows = sqlite_conn.execute("SELECT * FROM taxonomy").fetchall()
        for r in rows:
            d = dict(r)
            conn.execute(text("""
                INSERT INTO taxonomy (mode,group_key,group_label,option_value,option_label,sort_order)
                VALUES (:mode,:group_key,:group_label,:option_value,:option_label,:sort_order)
                ON DUPLICATE KEY UPDATE option_label=VALUES(option_label)
            """), d)
        conn.commit()
        print(f"✅ taxonomy: {len(rows)} rows")

        # 迁移 drink_similar
        rows = sqlite_conn.execute("SELECT * FROM drink_similar").fetchall()
        for r in rows:
            d = dict(r)
            conn.execute(text("""
                INSERT INTO drink_similar (drink_id,similar_id,rank,score)
                VALUES (:drink_id,:similar_id,:rank,:score)
                ON DUPLICATE KEY UPDATE score=VALUES(score)
            """), d)
        conn.commit()
        print(f"✅ drink_similar: {len(rows)} rows")

        print("\n🎉 迁移完成！")

    sqlite_conn.close()


if __name__ == "__main__":
    migrate()
