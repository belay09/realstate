"""One editable live price list per company (versions kept internal for quotes/history)."""

from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.data.ayat_official_loader import build_calculator_config_snapshot, load_official
from app.models.pricing import PriceTableRow, PricingVersion
from app.services.pricing_engine import get_active_published_version


class LivePricingError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def get_live_pricing_version(db: Session, *, company_id: UUID) -> PricingVersion | None:
    """Return the pricing record used for calculator and listings today."""
    today = date.today()
    active = get_active_published_version(db, company_id=company_id, as_of=today)
    if active is not None:
        return active
    return (
        db.query(PricingVersion)
        .filter(
            PricingVersion.company_id == company_id,
            PricingVersion.status == "published",
        )
        .order_by(PricingVersion.effective_from.desc())
        .first()
    )


def get_or_create_live_pricing_version(db: Session, *, company_id: UUID) -> PricingVersion:
    existing = get_live_pricing_version(db, company_id=company_id)
    if existing is not None:
        return existing

    official = load_official()
    version = PricingVersion(
        company_id=company_id,
        name="Current pricing",
        status="published",
        effective_from=date.today(),
        effective_to=None,
        currency="ETB",
        includes_vat=True,
        published_at=datetime.now(UTC),
        calculator_config=build_calculator_config_snapshot(official),
    )
    db.add(version)
    db.flush()
    return version


def touch_live_pricing(db: Session, version: PricingVersion, *, user_id: UUID | None = None) -> None:
    """Mark pricing as updated (keeps published; bumps updated_at via ORM)."""
    version.updated_at = datetime.now(UTC)
    if user_id is not None:
        from app.models.pricing import PriceHistoryEvent

        db.add(
            PriceHistoryEvent(
                pricing_version_id=version.id,
                user_id=user_id,
                event_type="updated",
                payload={"name": version.name},
            )
        )
