from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class PaymentPlan(Base, TimestampMixin):
    __tablename__ = "payment_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)
    effective_from: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)

    steps: Mapped[list[PaymentPlanStep]] = relationship(
        "PaymentPlanStep",
        back_populates="payment_plan",
        cascade="all, delete-orphan",
        order_by="PaymentPlanStep.step_order",
    )
    quotes: Mapped[list["UnitPriceQuote"]] = relationship(
        "UnitPriceQuote",
        back_populates="payment_plan",
    )


class PaymentPlanStep(Base):
    __tablename__ = "payment_plan_steps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payment_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payment_plans.id", ondelete="CASCADE"), index=True
    )
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    trigger_type: Mapped[str] = mapped_column(String(64), nullable=False)
    milestone_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    due_after_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    due_after_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    percentage: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)

    payment_plan: Mapped[PaymentPlan] = relationship("PaymentPlan", back_populates="steps")


class InstallmentSchedule(Base):
    __tablename__ = "installment_schedules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    unit_price_quote_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("unit_price_quotes.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    quote: Mapped["UnitPriceQuote"] = relationship(
        "UnitPriceQuote",
        back_populates="installment_schedules",
    )
    items: Mapped[list[InstallmentScheduleItem]] = relationship(
        "InstallmentScheduleItem",
        back_populates="schedule",
        cascade="all, delete-orphan",
        order_by="InstallmentScheduleItem.step_order",
    )


class InstallmentScheduleItem(Base):
    __tablename__ = "installment_schedule_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    installment_schedule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("installment_schedules.id", ondelete="CASCADE"), index=True
    )
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    due_type: Mapped[str] = mapped_column(String(64), nullable=False)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    schedule: Mapped[InstallmentSchedule] = relationship(
        "InstallmentSchedule",
        back_populates="items",
    )
