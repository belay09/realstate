"""Payment plan validation and installment schedule generation."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from app.models.inventory import PropertyUnit, UnitType
from app.models.payment import (
    InstallmentSchedule,
    InstallmentScheduleItem,
    PaymentPlan,
    PaymentPlanStep,
)
from app.models.pricing import UnitPriceQuote

# Plans whose code blocks certain unit categories (extend via admin `code` naming).
PLAN_CATEGORY_DENY: dict[str, set[str]] = {
    "60_40": {"commercial", "shop"},
    "sixty_forty": {"commercial", "shop"},
}


class PaymentError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def validate_step_percentages(steps: list, *, get_pct) -> None:
    if not steps:
        raise PaymentError("NO_STEPS", "Payment plan must have at least one step")
    total = sum((get_pct(s) for s in steps), Decimal("0"))
    if abs(total - Decimal("100")) > Decimal("0.01"):
        raise PaymentError(
            "INVALID_STEP_TOTAL",
            f"Step percentages must total 100 (got {total})",
        )


def validate_plan_steps(steps: list[PaymentPlanStep]) -> None:
    validate_step_percentages(steps, get_pct=lambda s: s.percentage)


def check_plan_eligibility(
    plan: PaymentPlan,
    unit_type: UnitType,
) -> None:
    denied = PLAN_CATEGORY_DENY.get(plan.code.lower())
    if denied and unit_type.category.lower() in denied:
        raise PaymentError(
            "PLAN_NOT_ELIGIBLE",
            f"Payment plan '{plan.code}' is not available for unit category '{unit_type.category}'",
        )


def get_payment_plan(db: Session, plan_id: UUID, *, company_id: UUID | None = None) -> PaymentPlan:
    q = (
        db.query(PaymentPlan)
        .options(selectinload(PaymentPlan.steps))
        .filter(PaymentPlan.id == plan_id)
    )
    if company_id is not None:
        q = q.filter(PaymentPlan.company_id == company_id)
    plan = q.first()
    if plan is None:
        raise PaymentError("PLAN_NOT_FOUND", "Payment plan not found")
    return plan


def generate_installment_schedule(
    db: Session,
    *,
    quote: UnitPriceQuote,
    plan: PaymentPlan,
    as_of: date | None = None,
) -> InstallmentSchedule:
    as_of = as_of or date.today()
    validate_plan_steps(list(plan.steps))
    steps = sorted(plan.steps, key=lambda s: s.step_order)
    final_price = quote.final_price

    schedule = InstallmentSchedule(unit_price_quote_id=quote.id)
    db.add(schedule)
    db.flush()

    down_payment = Decimal("0")
    items: list[InstallmentScheduleItem] = []
    running_date = datetime.combine(as_of, datetime.min.time(), tzinfo=UTC)

    for step in steps:
        amount = (final_price * step.percentage / Decimal("100")).quantize(Decimal("0.01"))
        if step.step_order == 1 and step.trigger_type in ("down_payment", "upfront", "on_signing"):
            down_payment = amount

        due_date = None
        if step.due_after_days is not None:
            running_date = running_date + timedelta(days=step.due_after_days)
            due_date = running_date
        elif step.due_after_months is not None:
            running_date = running_date + timedelta(days=step.due_after_months * 30)
            due_date = running_date

        label = step.milestone_name or f"Step {step.step_order} ({step.trigger_type})"
        item = InstallmentScheduleItem(
            installment_schedule_id=schedule.id,
            step_order=step.step_order,
            label=label,
            amount=amount,
            due_type=step.trigger_type,
            due_date=due_date,
        )
        items.append(item)
        db.add(item)

    # Fix rounding: adjust last item so sum equals final_price
    total_scheduled = sum(i.amount for i in items)
    if items and total_scheduled != final_price:
        diff = final_price - total_scheduled
        items[-1].amount = (items[-1].amount + diff).quantize(Decimal("0.01"))

    quote.payment_plan_id = plan.id
    quote.down_payment_amount = down_payment
    if quote.calculation_snapshot is None:
        quote.calculation_snapshot = {}
    quote.calculation_snapshot["payment_plan_id"] = str(plan.id)
    quote.calculation_snapshot["payment_plan_code"] = plan.code
    quote.calculation_snapshot["installment_schedule_id"] = str(schedule.id)

    db.flush()
    return schedule


def preview_installment_items(
    *,
    final_price: Decimal,
    plan: PaymentPlan,
    as_of: date | None = None,
) -> tuple[list[dict], Decimal]:
    """Build installment line items without persisting (public preview)."""
    as_of = as_of or date.today()
    validate_plan_steps(list(plan.steps))
    steps = sorted(plan.steps, key=lambda s: s.step_order)
    down_payment = Decimal("0")
    items: list[dict] = []
    running_date = datetime.combine(as_of, datetime.min.time(), tzinfo=UTC)

    for step in steps:
        amount = (final_price * step.percentage / Decimal("100")).quantize(Decimal("0.01"))
        if step.step_order == 1 and step.trigger_type in ("down_payment", "upfront", "on_signing"):
            down_payment = amount
        due_date = None
        if step.due_after_days is not None:
            running_date = running_date + timedelta(days=step.due_after_days)
            due_date = running_date
        elif step.due_after_months is not None:
            running_date = running_date + timedelta(days=step.due_after_months * 30)
            due_date = running_date
        label = step.milestone_name or f"Step {step.step_order} ({step.trigger_type})"
        items.append(
            {
                "step_order": step.step_order,
                "label": label,
                "amount": amount,
                "due_type": step.trigger_type,
                "due_date": due_date,
            }
        )

    total_scheduled = sum(i["amount"] for i in items)
    if items and total_scheduled != final_price:
        diff = final_price - total_scheduled
        items[-1]["amount"] = (items[-1]["amount"] + diff).quantize(Decimal("0.01"))

    return items, down_payment


def attach_plan_to_quote(
    db: Session,
    *,
    quote_id: UUID,
    payment_plan_id: UUID,
) -> InstallmentSchedule:
    quote = db.query(UnitPriceQuote).filter(UnitPriceQuote.id == quote_id).first()
    if quote is None:
        raise PaymentError("QUOTE_NOT_FOUND", "Quote not found")

    unit = (
        db.query(PropertyUnit)
        .options(selectinload(PropertyUnit.unit_type))
        .filter(PropertyUnit.id == quote.unit_id)
        .first()
    )
    if unit is None:
        raise PaymentError("UNIT_NOT_FOUND", "Unit not found")

    plan = get_payment_plan(db, payment_plan_id, company_id=unit.unit_type.company_id)
    if plan.status != "published":
        raise PaymentError("PLAN_NOT_PUBLISHED", "Payment plan must be published")

    check_plan_eligibility(plan, unit.unit_type)

    existing = (
        db.query(InstallmentSchedule)
        .filter(InstallmentSchedule.unit_price_quote_id == quote_id)
        .first()
    )
    if existing:
        db.query(InstallmentScheduleItem).filter(
            InstallmentScheduleItem.installment_schedule_id == existing.id
        ).delete()
        db.delete(existing)
        db.flush()

    return generate_installment_schedule(db, quote=quote, plan=plan)
