from __future__ import annotations

from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.commission import CommissionEstimateRead
from app.schemas.payment import InstallmentScheduleRead
from app.schemas.pricing import PriceCalculationBreakdown, UnitPriceQuoteRead


class FullQuoteRequest(BaseModel):
    unit_id: UUID
    as_of_date: date | None = None
    payment_plan_id: UUID | None = None
    sales_channel: str = Field(default="default", max_length=64)
    apply_discount_rule_ids: list[UUID] | None = None
    persist_quote: bool = True


class FullQuoteResponse(BaseModel):
    pricing: PriceCalculationBreakdown
    quote: UnitPriceQuoteRead | None = None
    installment_schedule: InstallmentScheduleRead | None = None
    commission: CommissionEstimateRead | None = None
