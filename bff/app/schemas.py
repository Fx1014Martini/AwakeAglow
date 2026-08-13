"""Pydantic 请求模型。"""
from pydantic import BaseModel
from typing import Literal


class RecommendationRequest(BaseModel):
    mode: Literal["coffee", "cocktail"]
    scene: str | None = None
    preferences: list[str] | None = None
    excludedDrinkIds: list[str] | None = None


class ComparisonRequest(BaseModel):
    drinkIds: list[str]


class UpdatePreferencesRequest(BaseModel):
    mode: Literal["coffee", "cocktail"]
    values: list[str]
