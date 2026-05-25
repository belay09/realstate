"""ORM models package: import side effects register metadata on Base."""

from app.models import (
    analytics,  # noqa: F401
    commission,  # noqa: F401
    company,  # noqa: F401
    identity,  # noqa: F401
    inventory,  # noqa: F401
    leads_contracts,  # noqa: F401
    payment,  # noqa: F401
    pricing,  # noqa: F401
)

__all__ = [
    "analytics",
    "commission",
    "company",
    "identity",
    "inventory",
    "leads_contracts",
    "payment",
    "pricing",
]
