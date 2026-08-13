"""MySQL 连接（SQLAlchemy + PyMySQL，微信云托管环境变量注入）。"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 云托管注入：MYSQL_ADDRESS=host:port, MYSQL_USERNAME, MYSQL_PASSWORD
_address = os.environ.get("MYSQL_ADDRESS", "127.0.0.1:3306")
_host_port = _address.split(":")
_host = _host_port[0]
_port = _host_port[1] if len(_host_port) > 1 else "3306"
_user = os.environ.get("MYSQL_USERNAME", "root")
_password = os.environ.get("MYSQL_PASSWORD", "")
_db = os.environ.get("MYSQL_DATABASE", "awakeaglow")

DATABASE_URL = f"mysql+pymysql://{_user}:{_password}@{_host}:{_port}/{_db}?charset=utf8mb4"

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=5, echo=False)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
