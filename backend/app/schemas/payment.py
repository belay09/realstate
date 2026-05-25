from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PaymentPlanStepCreate(BaseModel):
    step_order: int = Field(ge=1)
    trigger_type: str = Field(min_length=1, max_length=64)
    milestone_name: str | None = Field(default=None, max_length=255)
    due_after_days: int | None = Field(default=None, ge=0)
    due_after_months: int | None = Field(default=None, ge=0)
    percentage: Decimal = Field(ge=0, le=100)


class PaymentPlanStepRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    payment_plan_id: UUID
    step_order: int
    trigger_type: str
    milestone_name: str | None
    due_after_days: int | None
    due_after_months: int | None
    percentage: Decimal


class PaymentPlanCreate(BaseModel):
    company_id: UUID
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    effective_from: date | None = None
    effective_to: date | None = None
    steps: list[PaymentPlanStepCreate] = Field(default_factory=list)


class PaymentPlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = Field(default=None, max_length=32)
    effective_from: date | None = None
    effective_to: date | None = None


class PaymentPlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    code: str
    name: str
    status: str
    effective_from: date | None
    effective_to: date | None
    created_at: datetime
    updated_at: datetime
    steps: list[PaymentPlanStepRead] = []


class InstallmentItemRead(BaseModel):
    step_order: int
    label: str
    amount: Decimal
    due_type: str
    due_date: datetime | None = None


class InstallmentScheduleRead(BaseModel):
    id: UUID
    unit_price_quote_id: UUID
    items: list[InstallmentItemRead]
    total_amount: Decimal
    down_payment_amount: Decimal


class PublicPaymentPlanOption(BaseModel):
    code: str
    name: str


class PublicPaymentPreview(BaseModel):
    plan_code: str
    plan_name: str
    final_price: Decimal
    currency: str
    down_payment_amount: Decimal
    items: list[InstallmentItemRead]
    disclaimer: str = "Indicative schedule only. Official quote required for purchase."
