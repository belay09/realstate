"""Resolve active location promotions for the public calculator."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.promotions import LocationPromotion


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def promotion_applies_to_location(
    promotion: LocationPromotion,
    *,
    kind: str,
    location_id: str,
    as_of: datetime | None = None,
) -> bool:
    if not promotion.is_active or promotion.kind != kind:
        return False
    now = _as_utc(as_of or datetime.now(timezone.utc))
    if now < _as_utc(promotion.starts_at) or now > _as_utc(promotion.ends_at):
        return False
    ids = {str(x).strip().lower() for x in (promotion.location_ids or [])}
    return location_id.strip().lower() in ids


def best_promotion_for_location(
    promotions: list[LocationPromotion],
    *,
    kind: str,
    location_id: str,
    as_of: datetime | None = None,
) -> LocationPromotion | None:
    matches = [
        p
        for p in promotions
        if promotion_applies_to_location(p, kind=kind, location_id=location_id, as_of=as_of)
    ]
    if not matches:
        return None
    return max(matches, key=lambda p: float(p.discount_percent))


def load_company_promotions(db: Session, company_id: UUID) -> list[LocationPromotion]:
    return (
        db.query(LocationPromotion)
        .filter(LocationPromotion.company_id == company_id)
        .order_by(LocationPromotion.starts_at.desc())
        .all()
    )


def load_active_public_promotions(
    db: Session,
    company_id: UUID,
    *,
    as_of: datetime | None = None,
) -> list[LocationPromotion]:
    now = _as_utc(as_of or datetime.now(timezone.utc))
    return (
        db.query(LocationPromotion)
        .filter(
            LocationPromotion.company_id == company_id,
            LocationPromotion.is_active.is_(True),
            LocationPromotion.starts_at <= now,
            LocationPromotion.ends_at >= now,
        )
        .order_by(LocationPromotion.discount_percent.desc())
        .all()
    )


def promotion_to_public_dict(promotion: LocationPromotion) -> dict:
    return {
        "id": str(promotion.id),
        "name": promotion.name,
        "kind": promotion.kind,
        "location_ids": list(promotion.location_ids or []),
        "discount_percent": float(promotion.discount_percent),
    }
