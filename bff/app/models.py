"""SQLAlchemy ORM 模型（对齐 schema.sql 7 表）。"""
from sqlalchemy import Column, String, Integer, Float, Text, MediumText, SmallInteger, Index
from app.db import Base


class Drink(Base):
    __tablename__ = "drink"
    id = Column(String(64), primary_key=True)
    mode = Column(String(16), nullable=False)
    category = Column(String(16), nullable=False)
    name_zh = Column(String(128), nullable=False)
    name_en = Column(String(128), nullable=False)
    name_pinyin = Column(String(256), nullable=False, default="")
    name_pinyin_initials = Column(String(64), nullable=False, default="")
    intro = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String(512), nullable=False)
    poster_url = Column(String(512), nullable=False)
    recommendation_score = Column(Integer, nullable=False, default=0)
    sort_order = Column(Integer, nullable=False, default=0)
    radar_json = Column(Text, nullable=False)
    tags_json = Column(Text, nullable=False)
    scene_json = Column(Text, nullable=False)
    attributes_json = Column(Text, nullable=False)
    ingredients_json = Column(Text, nullable=False)
    steps_json = Column(Text, nullable=False)
    aliases_json = Column(Text, nullable=False, default="[]")
    source_level = Column(String(4), nullable=False, default="B")
    updated_at = Column(String(16), nullable=False)
    reviewed = Column(SmallInteger, nullable=False, default=1)
    card_json = Column(MediumText, nullable=False)


class Taxonomy(Base):
    __tablename__ = "taxonomy"
    mode = Column(String(16), primary_key=True)
    group_key = Column(String(32), primary_key=True)
    group_label = Column(String(32), nullable=False)
    option_value = Column(String(64), primary_key=True)
    option_label = Column(String(64), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)


class DrinkSimilar(Base):
    __tablename__ = "drink_similar"
    drink_id = Column(String(64), primary_key=True)
    similar_id = Column(String(64), nullable=False)
    rank = Column(Integer, primary_key=True)
    score = Column(Float, nullable=False)


class Meta(Base):
    __tablename__ = "meta"
    key = Column(String(32), primary_key=True)
    value = Column(String(256), nullable=False)


class UserProfile(Base):
    __tablename__ = "user_profile"
    install_identity = Column(String(64), primary_key=True)
    display_name = Column(String(64), nullable=False, default="")
    avatar_url = Column(String(512))
    avatar_text = Column(String(8))
    coffee_preferences_json = Column(Text, nullable=False)
    cocktail_preferences_json = Column(Text, nullable=False)
    updated_at = Column(String(16))


class UserFavorite(Base):
    __tablename__ = "user_favorite"
    install_identity = Column(String(64), primary_key=True)
    drink_id = Column(String(64), primary_key=True)
    created_at = Column(String(16), nullable=False)


class UserHistory(Base):
    __tablename__ = "user_history"
    install_identity = Column(String(64), primary_key=True)
    drink_id = Column(String(64), primary_key=True)
    viewed_at = Column(String(16), nullable=False)
