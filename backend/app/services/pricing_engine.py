"""Resolve published pricing versions, match rows, apply discounts, and build quotes."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.inventory import Block, Project, PropertyUnit, UnitType
from app.models.pricing import (
    DiscountRule,
    PriceTableRow,
    PricingVersion,
    UnitPriceQuote,
)
from app.schemas.pricing import PriceCalculationBreakdown


class PricingError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def floor_in_band(floor_number: int | None, floor_band: str | None) -> bool:
    if floor_band is None or floor_band.strip() == "":
        return True
    if floor_number is None:
        return False
    band = floor_band.strip()
    if "-" in band:
        parts = band.split("-", 1)
        try:
            low, high = int(parts[0]), int(parts[1])
            return low <= floor_number <= high
        except ValueError:
            return False
    if band.endswith("+"):
        try:
            return floor_number >= int(band[:-1])
        except ValueError:
            return False
    try:
        return floor_number == int(band)
    except ValueError:
        return band.lower() == str(floor_number)


def _row_specificity(row: PriceTableRow) -> int:
    score = 0
    if row.block_id is not None:
        score += 8
    if row.project_id is not None:
        score += 4
    if row.floor_band:
        score += 2
    if row.unit_type_code:
        score += 2
    if row.finish_type:
        score += 1
    if row.construction_state:
        score += 1
    return score


def row_matches_unit(
    row: PriceTableRow,
    *,
    unit: PropertyUnit,
    unit_type: UnitType,
    project: Project,
    block: Block,
) -> bool:
    if row.project_id is not None and row.project_id != project.id:
        return False
    if row.block_id is not None and row.block_id != block.id:
        return False
    if row.unit_type_code is not None and row.unit_type_code != unit_type.code:
        return False
    if row.finish_type is not None and row.finish_type != (unit_type.finish_type or ""):
        return False
    if not floor_in_band(unit.floor_number, row.floor_band):
        return False
    return True


def get_active_published_version(
    db: Session,
    *,
    company_id: UUID,
    as_of: date,
) -> PricingVersion | None:
    return (
        db.query(PricingVersion)
        .filter(
            PricingVersion.company_id == company_id,
            PricingVersion.status == "published",
            PricingVersion.effective_from <= as_of,
        )
        .filter(
            (PricingVersion.effective_to.is_(None)) | (PricingVersion.effective_to >= as_of),
        )
        .order_by(PricingVersion.effective_from.desc())
        .first()
    )


def find_best_price_row(
    version: PricingVersion,
    *,
    unit: PropertyUnit,
    unit_type: UnitType,
    project: Project,
    block: Block,
) -> PriceTableRow | None:
    candidates = [
        row
        for row in version.price_rows
        if row_matches_unit(
            row,
            unit=unit,
            unit_type=unit_type,
            project=project,
            block=block,
        )
    ]
    if not candidates:
        return None
    return max(candidates, key=_row_specificity)


def compute_base_price(
    row: PriceTableRow,
    area_sqm: Decimal | None,
) -> Decimal:
    if row.fixed_price is not None:
        return row.fixed_price.quantize(Decimal("0.01"))
    if row.price_per_sqm is not None and area_sqm is not None:
        return (row.price_per_sqm * area_sqm).quantize(Decimal("0.01"))
    raise PricingError(
        "INVALID_PRICE_ROW",
        "Matched row has no fixed_price and no price_per_sqm with unit area",
    )


def apply_discounts(
    base_price: Decimal,
    rules: list[DiscountRule],
    *,
    selected_ids: set[UUID] | None,
) -> tuple[Decimal, list[dict]]:
    applicable = sorted(rules, key=lambda r: r.priority, reverse=True)
    if selected_ids is not None:
        applicable = [r for r in applicable if r.id in selected_ids]

    total_discount = Decimal("0")
    applied: list[dict] = []
    remaining = base_price

    for rule in applicable:
        pct = rule.discount_percent
        if pct <= 0:
            continue
        amount = (remaining * pct / Decimal("100")).quantize(Decimal("0.01"))
        if amount <= 0:
            continue
        total_discount += amount
        remaining -= amount
        applied.append(
            {
                "rule_id": str(rule.id),
                "rule_type": rule.rule_type,
                "discount_percent": str(pct),
                "amount": str(amount),
            }
        )

    final_price = (base_price - total_discount).quantize(Decimal("0.01"))
    if final_price < 0:
        final_price = Decimal("0")
    return final_price, applied


def load_unit_context(db: Session, unit_id: UUID) -> tuple[PropertyUnit, UnitType, Block, Project]:
    unit = (
        db.query(PropertyUnit)
        .options(
            selectinload(PropertyUnit.unit_type),
            selectinload(PropertyUnit.block).selectinload(Block.project),
        )
        .filter(PropertyUnit.id == unit_id)
        .first()
    )
    if unit is None:
        raise PricingError("UNIT_NOT_FOUND", "Property unit not found")
    unit_type = unit.unit_type
    block = unit.block
    project = block.project
    return unit, unit_type, block, project


def _load_version(
    db: Session,
    version_id: UUID,
    *,
    company_id: UUID,
) -> PricingVersion:
    version = (
        db.query(PricingVersion)
        .options(
            selectinload(PricingVersion.price_rows),
            selectinload(PricingVersion.discount_rules),
        )
        .filter(PricingVersion.id == version_id, PricingVersion.company_id == company_id)
        .first()
    )
    if version is None:
        raise PricingError("VERSION_NOT_FOUND", "Pricing version not found for this company")
    return version


def calculate_unit_price(
    db: Session,
    *,
    unit_id: UUID,
    as_of: date | None = None,
    apply_discount_rule_ids: list[UUID] | None = None,
    pricing_version_id: UUID | None = None,
) -> PriceCalculationBreakdown:
    as_of = as_of or date.today()
    unit, unit_type, block, project = load_unit_context(db, unit_id)
    company_id = unit_type.company_id

    if pricing_version_id:
        version = _load_version(db, pricing_version_id, company_id=company_id)
    else:
        active = get_active_published_version(db, company_id=company_id, as_of=as_of)
        if active is None:
            raise PricingError(
                "NO_ACTIVE_PRICING",
                "No published pricing version is effective on the given date",
            )
        version = _load_version(db, active.id, company_id=company_id)
    row = find_best_price_row(
        version,
        unit=unit,
        unit_type=unit_type,
        project=project,
        block=block,
    )
    if row is None:
        raise PricingError("NO_MATCHING_ROW", "No price table row matches this unit")

    area = unit.area_sqm or unit_type.default_area_sqm
    base_price = compute_base_price(row, area)
    selected = set(apply_discount_rule_ids) if apply_discount_rule_ids else None
    final_price, applied = apply_discounts(
        base_price,
        list(version.discount_rules),
        selected_ids=selected,
    )
    discount_amount = (base_price - final_price).quantize(Decimal("0.01"))

    snapshot = {
        "as_of_date": as_of.isoformat(),
        "unit_id": str(unit.id),
        "unit_number": unit.unit_number,
        "floor_number": unit.floor_number,
        "unit_type_code": unit_type.code,
        "project_id": str(project.id),
        "block_id": str(block.id),
        "matched_row_id": str(row.id),
        "area_sqm": str(area) if area is not None else None,
        "base_price": str(base_price),
        "discount_amount": str(discount_amount),
        "final_price": str(final_price),
        "applied_discounts": applied,
    }

    return PriceCalculationBreakdown(
        pricing_version_id=version.id,
        pricing_version_name=version.name,
        matched_row_id=row.id,
        area_sqm=area,
        base_price=base_price,
        discount_amount=discount_amount,
        final_price=final_price,
        currency=version.currency,
        includes_vat=version.includes_vat,
        applied_discounts=applied,
        snapshot=snapshot,
    )


def persist_quote(
    db: Session,
    *,
    unit_id: UUID,
    breakdown: PriceCalculationBreakdown,
    created_by_id: UUID | None,
) -> UnitPriceQuote:
    expires = datetime.now(UTC) + timedelta(days=settings.quote_expiry_days)
    quote = UnitPriceQuote(
        unit_id=unit_id,
        pricing_version_id=breakdown.pricing_version_id,
        created_by_id=created_by_id,
        base_price=breakdown.base_price,
        discount_amount=breakdown.discount_amount,
        final_price=breakdown.final_price,
        currency=breakdown.currency,
        calculation_snapshot=breakdown.snapshot,
        expires_at=expires,
    )
    db.add(quote)
    db.flush()
    return quote
