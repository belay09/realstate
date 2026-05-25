"""Full quote: pricing + payment schedule + commission."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from app.models.payment import InstallmentSchedule
from app.schemas.commission import CommissionEstimateRead
from app.schemas.payment import InstallmentItemRead, InstallmentScheduleRead
from app.schemas.pricing import UnitPriceQuoteRead
from app.schemas.quote import FullQuoteRequest, FullQuoteResponse
from app.services.commission_service import CommissionError, apply_commission_to_quote
from app.services.payment_service import PaymentError, attach_plan_to_quote
from app.services.pricing_engine import PricingError, calculate_unit_price, persist_quote


def build_installment_read(db: Session, schedule_id: UUID) -> InstallmentScheduleRead:
    schedule = (
        db.query(InstallmentSchedule)
        .options(
            selectinload(InstallmentSchedule.items),
            selectinload(InstallmentSchedule.quote),
        )
        .filter(InstallmentSchedule.id == schedule_id)
        .first()
    )
    assert schedule is not None
    items = sorted(schedule.items, key=lambda i: i.step_order)
    total = sum((i.amount for i in items), Decimal("0"))
    quote = schedule.quote
    down = quote.down_payment_amount if quote else Decimal("0")
    return InstallmentScheduleRead(
        id=schedule.id,
        unit_price_quote_id=schedule.unit_price_quote_id,
        items=[
            InstallmentItemRead(
                step_order=i.step_order,
                label=i.label,
                amount=i.amount,
                due_type=i.due_type,
                due_date=i.due_date,
            )
            for i in items
        ],
        total_amount=total,
        down_payment_amount=down,
    )


def generate_full_quote(
    db: Session,
    body: FullQuoteRequest,
    *,
    created_by_id: UUID | None,
) -> FullQuoteResponse:
    try:
        pricing = calculate_unit_price(
            db,
            unit_id=body.unit_id,
            as_of=body.as_of_date,
            apply_discount_rule_ids=body.apply_discount_rule_ids,
        )
    except PricingError as exc:
        raise exc

    quote_row = None
    schedule_read = None
    commission_read = None

    if body.persist_quote:
        quote_row = persist_quote(
            db,
            unit_id=body.unit_id,
            breakdown=pricing,
            created_by_id=created_by_id,
        )
        pricing.snapshot["quote_id"] = str(quote_row.id)

        if body.payment_plan_id:
            try:
                schedule = attach_plan_to_quote(
                    db,
                    quote_id=quote_row.id,
                    payment_plan_id=body.payment_plan_id,
                )
                schedule_read = build_installment_read(db, schedule.id)
            except PaymentError:
                raise

        try:
            estimate = apply_commission_to_quote(
                db,
                quote_id=quote_row.id,
                sales_channel=body.sales_channel,
                as_of=body.as_of_date,
            )
            if estimate:
                commission_read = CommissionEstimateRead.model_validate(estimate)
        except CommissionError as exc:
            raise exc

        db.commit()
        db.refresh(quote_row)

    return FullQuoteResponse(
        pricing=pricing,
        quote=UnitPriceQuoteRead.model_validate(quote_row) if quote_row else None,
        installment_schedule=schedule_read,
        commission=commission_read,
    )
