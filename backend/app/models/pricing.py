from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class PricingDocument(Base):
    __tablename__ = "pricing_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    document_type: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    ocr_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    versions: Mapped[list[PricingVersion]] = relationship(
        "PricingVersion",
        back_populates="document",
    )


class PricingVersion(Base, TimestampMixin):
    __tablename__ = "pricing_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True
    )
    pricing_document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pricing_documents.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False, index=True)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    currency: Mapped[str] = mapped_column(String(8), default="ETB", nullable=False)
    includes_vat: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    document: Mapped[PricingDocument | None] = relationship(
        "PricingDocument",
        back_populates="versions",
    )
    price_rows: Mapped[list[PriceTableRow]] = relationship(
        "PriceTableRow",
        back_populates="pricing_version",
        cascade="all, delete-orphan",
    )
    discount_rules: Mapped[list[DiscountRule]] = relationship(
        "DiscountRule",
        back_populates="pricing_version",
        cascade="all, delete-orphan",
    )
    quotes: Mapped[list[UnitPriceQuote]] = relationship(
        "UnitPriceQuote",
        back_populates="pricing_version",
    )
    history_events: Mapped[list[PriceHistoryEvent]] = relationship(
        "PriceHistoryEvent",
        back_populates="pricing_version",
    )


class PriceTableRow(Base):
    __tablename__ = "price_table_rows"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    pricing_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pricing_versions.id", ondelete="CASCADE"), index=True
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True
    )
    block_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("blocks.id", ondelete="CASCADE"), nullable=True, index=True
    )
    floor_band: Mapped[str | None] = mapped_column(String(64), nullable=True)
    unit_type_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    finish_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    construction_state: Mapped[str | None] = mapped_column(String(64), nullable=True)
    price_per_sqm: Mapped[Decimal | None] = mapped_column(Numeric(18, 4), nullable=True)
    fixed_price: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    conditions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    pricing_version: Mapped[PricingVersion] = relationship(
        "PricingVersion",
        back_populates="price_rows",
    )


class DiscountRule(Base):
    __tablename__ = "discount_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    pricing_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pricing_versions.id", ondelete="CASCADE"), index=True
    )
    rule_type: Mapped[str] = mapped_column(String(64), nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    conditions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    discount_percent: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    pricing_version: Mapped[PricingVersion] = relationship(
        "PricingVersion",
        back_populates="discount_rules",
    )


class UnitPriceQuote(Base):
    __tablename__ = "unit_price_quotes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    unit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("property_units.id", ondelete="CASCADE"), index=True
    )
    pricing_version_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pricing_versions.id", ondelete="SET NULL"), nullable=True
    )
    payment_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("payment_plans.id", ondelete="SET NULL"), nullable=True
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    base_price: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default=Decimal("0"),
        nullable=False,
    )
    final_price: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    down_payment_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0"), nullable=False
    )
    commission_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), default=Decimal("0"), nullable=False
    )
    currency: Mapped[str] = mapped_column(String(8), default="ETB", nullable=False)
    calculation_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    pricing_version: Mapped[PricingVersion | None] = relationship(
        "PricingVersion",
        back_populates="quotes",
    )
    payment_plan: Mapped["PaymentPlan | None"] = relationship(
        "PaymentPlan",
        back_populates="quotes",
    )
    installment_schedules: Mapped[list["InstallmentSchedule"]] = relationship(
        "InstallmentSchedule",
        back_populates="quote",
        cascade="all, delete-orphan",
    )
    commission_estimates: Mapped[list["CommissionEstimate"]] = relationship(
        "CommissionEstimate",
        back_populates="quote",
        cascade="all, delete-orphan",
    )
    lead_links: Mapped[list["LeadQuote"]] = relationship("LeadQuote", back_populates="quote")
    reservations: Mapped[list["Reservation"]] = relationship("Reservation", back_populates="quote")
    contracts: Mapped[list["SalesContract"]] = relationship("SalesContract", back_populates="quote")


class PriceHistoryEvent(Base):
    __tablename__ = "price_history_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    pricing_version_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pricing_versions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    pricing_version: Mapped[PricingVersion | None] = relationship(
        "PricingVersion",
        back_populates="history_events",
    )