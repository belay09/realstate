from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel


class LocationPromotionCreate(BaseModel):
    company_id: UUID
    name: str = Field(min_length=1, max_length=255)
    kind: str = Field(pattern="^(apartment|shop)$")
    location_ids: list[str] = Field(min_length=1)
    discount_percent: Decimal = Field(ge=0, le=100)
    starts_at: datetime
    ends_at: datetime
    is_active: bool = True

    @field_validator("location_ids")
    @classmethod
    def normalize_location_ids(cls, value: list[str]) -> list[str]:
        out = []
        seen: set[str] = set()
        for raw in value:
            lid = raw.strip().lower().replace(" ", "-")
            if not lid or lid in seen:
                continue
            seen.add(lid)
            out.append(lid)
        if not out:
            raise ValueError("Select at least one location")
        return out

    @field_validator("ends_at")
    @classmethod
    def ends_after_start(cls, ends_at: datetime, info) -> datetime:
        starts = info.data.get("starts_at")
        if starts is not None and ends_at <= starts:
            raise ValueError("End must be after start")
        return ends_at


class LocationPromotionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    kind: str | None = Field(default=None, pattern="^(apartment|shop)$")
    location_ids: list[str] | None = None
    discount_percent: Decimal | None = Field(default=None, ge=0, le=100)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    is_active: bool | None = None

    @field_validator("location_ids")
    @classmethod
    def normalize_location_ids(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return LocationPromotionCreate.normalize_location_ids(value)


class LocationPromotionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)

    id: UUID
    company_id: UUID
    name: str
    kind: str
    location_ids: list[str]
    discount_percent: Decimal
    starts_at: datetime
    ends_at: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PublicLocationPromotion(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: str
    name: str
    kind: str
    location_ids: list[str]
    discount_percent: float
