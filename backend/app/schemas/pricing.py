from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PricingDocumentCreate(BaseModel):
    company_id: UUID
    title: str = Field(min_length=1, max_length=512)
    document_type: str = Field(min_length=1, max_length=64)
    storage_url: str = Field(min_length=1, max_length=2048)
    extracted_text: str | None = None
    ocr_status: str = Field(default="pending", max_length=32)


class PricingDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    title: str
    document_type: str
    storage_url: str
    ocr_status: str
    extracted_text: str | None
    uploaded_at: datetime


class PricingVersionCreate(BaseModel):
    company_id: UUID
    name: str = Field(min_length=1, max_length=255)
    effective_from: date
    effective_to: date | None = None
    currency: str = Field(default="ETB", max_length=8)
    includes_vat: bool = True
    pricing_document_id: UUID | None = None


class PricingVersionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    effective_from: date | None = None
    effective_to: date | None = None
    currency: str | None = Field(default=None, max_length=8)
    includes_vat: bool | None = None
    pricing_document_id: UUID | None = None


class PricingVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    pricing_document_id: UUID | None
    name: str
    status: str
    effective_from: date
    effective_to: date | None
    currency: str
    includes_vat: bool
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PriceTableRowCreate(BaseModel):
    project_id: UUID | None = None
    block_id: UUID | None = None
    floor_band: str | None = Field(default=None, max_length=64)
    unit_type_code: str | None = Field(default=None, max_length=64)
    finish_type: str | None = Field(default=None, max_length=64)
    construction_state: str | None = Field(default=None, max_length=64)
    price_per_sqm: Decimal | None = None
    fixed_price: Decimal | None = None
    conditions: dict | None = None


class PriceTableRowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pricing_version_id: UUID
    project_id: UUID | None
    block_id: UUID | None
    floor_band: str | None
    unit_type_code: str | None
    finish_type: str | None
    construction_state: str | None
    price_per_sqm: Decimal | None
    fixed_price: Decimal | None
    conditions: dict | None
    created_at: datetime


class DiscountRuleCreate(BaseModel):
    rule_type: str = Field(min_length=1, max_length=64)
    priority: int = 0
    conditions: dict | None = None
    discount_percent: Decimal = Field(ge=0, le=100)


class DiscountRuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    pricing_version_id: UUID
    rule_type: str
    priority: int
    conditions: dict | None
    discount_percent: Decimal
    created_at: datetime


class PriceCalculateRequest(BaseModel):
    unit_id: UUID
    as_of_date: date | None = None
    apply_discount_rule_ids: list[UUID] | None = None
    persist_quote: bool = False


class PriceCalculationBreakdown(BaseModel):
    pricing_version_id: UUID
    pricing_version_name: str
    matched_row_id: UUID | None
    area_sqm: Decimal | None
    base_price: Decimal
    discount_amount: Decimal
    final_price: Decimal
    currency: str
    includes_vat: bool
    applied_discounts: list[dict]
    snapshot: dict


class PublicPricePreview(BaseModel):
    final_price: Decimal
    currency: str
    includes_vat: bool
    pricing_version_name: str
    disclaimer: str = "Indicative price only. Official quote required for purchase."


class UnitPriceQuoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    unit_id: UUID
    pricing_version_id: UUID | None
    base_price: Decimal
    discount_amount: Decimal
    final_price: Decimal
    currency: str
    calculation_snapshot: dict | None
    expires_at: datetime | None
    created_at: datetime
