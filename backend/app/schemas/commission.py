from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CommissionSchemeCreate(BaseModel):
    company_id: UUID
    name: str = Field(min_length=1, max_length=255)
    effective_from: date | None = None
    effective_to: date | None = None


class CommissionSchemeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = Field(default=None, max_length=32)
    effective_from: date | None = None
    effective_to: date | None = None


class CommissionSchemeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    name: str
    status: str
    effective_from: date | None
    effective_to: date | None
    created_at: datetime
    updated_at: datetime


class CommissionRuleCreate(BaseModel):
    sales_channel: str = Field(min_length=1, max_length=64)
    conditions: dict | None = None
    commission_percent: Decimal | None = Field(default=None, ge=0, le=100)
    fixed_amount: Decimal | None = Field(default=None, ge=0)


class CommissionRuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    commission_scheme_id: UUID
    sales_channel: str
    conditions: dict | None
    commission_percent: Decimal | None
    fixed_amount: Decimal | None
    created_at: datetime


class AgentContractCreate(BaseModel):
    company_id: UUID
    title: str = Field(min_length=1, max_length=512)
    user_id: UUID | None = None
    terms_url: str | None = Field(default=None, max_length=2048)
    effective_from: date | None = None
    effective_to: date | None = None


class AgentContractRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    user_id: UUID | None
    title: str
    terms_url: str | None
    effective_from: date | None
    effective_to: date | None
    created_at: datetime
    updated_at: datetime


class CommissionEstimateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    unit_price_quote_id: UUID
    amount: Decimal
    snapshot: dict | None
