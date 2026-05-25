"""Commission scheme resolution and quote estimates."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from app.models.commission import CommissionEstimate, CommissionRule, CommissionScheme
from app.models.inventory import PropertyUnit
from app.models.pricing import UnitPriceQuote


class CommissionError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def get_active_scheme(
    db: Session,
    *,
    company_id: UUID,
    as_of: date | None = None,
) -> CommissionScheme | None:
    as_of = as_of or date.today()
    return (
        db.query(CommissionScheme)
        .options(selectinload(CommissionScheme.rules))
        .filter(
            CommissionScheme.company_id == company_id,
            CommissionScheme.status == "published",
        )
        .filter(
            (CommissionScheme.effective_from.is_(None))
            | (CommissionScheme.effective_from <= as_of),
        )
        .filter(
            (CommissionScheme.effective_to.is_(None))
            | (CommissionScheme.effective_to >= as_of),
        )
        .order_by(CommissionScheme.effective_from.desc().nullslast())
        .first()
    )


def pick_rule(
    scheme: CommissionScheme,
    *,
    sales_channel: str,
    payment_plan_code: str | None = None,
) -> CommissionRule | None:
    channel = sales_channel.lower()
    candidates = [r for r in scheme.rules if r.sales_channel.lower() == channel]
    if not candidates:
        candidates = [r for r in scheme.rules if r.sales_channel.lower() == "default"]
    if not candidates:
        return None

    if payment_plan_code:
        for rule in candidates:
            cond = rule.conditions or {}
            allowed = cond.get("payment_plan_codes")
            if allowed and payment_plan_code not in allowed:
                continue
            return rule
    return candidates[0]


def calculate_commission_amount(
    final_price: Decimal,
    rule: CommissionRule,
) -> Decimal:
    if rule.fixed_amount is not None:
        return rule.fixed_amount.quantize(Decimal("0.01"))
    if rule.commission_percent is not None:
        return (final_price * rule.commission_percent / Decimal("100")).quantize(Decimal("0.01"))
    return Decimal("0")


def apply_commission_to_quote(
    db: Session,
    *,
    quote_id: UUID,
    sales_channel: str = "default",
    as_of: date | None = None,
) -> CommissionEstimate | None:
    quote = db.query(UnitPriceQuote).filter(UnitPriceQuote.id == quote_id).first()
    if quote is None:
        raise CommissionError("QUOTE_NOT_FOUND", "Quote not found")

    unit = (
        db.query(PropertyUnit)
        .options(selectinload(PropertyUnit.unit_type))
        .filter(PropertyUnit.id == quote.unit_id)
        .first()
    )
    if unit is None:
        raise CommissionError("UNIT_NOT_FOUND", "Unit not found")

    scheme = get_active_scheme(db, company_id=unit.unit_type.company_id, as_of=as_of)
    if scheme is None:
        return None

    plan_code = None
    if quote.calculation_snapshot:
        plan_code = quote.calculation_snapshot.get("payment_plan_code")

    rule = pick_rule(scheme, sales_channel=sales_channel, payment_plan_code=plan_code)
    if rule is None:
        return None

    amount = calculate_commission_amount(quote.final_price, rule)
    snapshot = {
        "scheme_id": str(scheme.id),
        "scheme_name": scheme.name,
        "rule_id": str(rule.id),
        "sales_channel": sales_channel,
        "commission_percent": str(rule.commission_percent) if rule.commission_percent else None,
        "fixed_amount": str(rule.fixed_amount) if rule.fixed_amount else None,
    }

    estimate = CommissionEstimate(
        unit_price_quote_id=quote.id,
        commission_scheme_id=scheme.id,
        commission_rule_id=rule.id,
        amount=amount,
        snapshot=snapshot,
    )
    db.add(estimate)
    quote.commission_amount = amount
    if quote.calculation_snapshot is None:
        quote.calculation_snapshot = {}
    quote.calculation_snapshot["commission"] = snapshot
    db.flush()
    return estimate
