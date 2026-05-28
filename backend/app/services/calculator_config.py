"""Build public Ayat calculator config from published pricing versions."""

from __future__ import annotations

from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from app.data.ayat_official_loader import (
    FINISH_BY_CODE,
    build_calculator_config_snapshot,
    load_official,
)
from app.models.company import Company
from app.models.inventory import Project
from app.models.pricing import PriceTableRow, PricingVersion
from app.services.pricing_engine import get_active_published_version


class CalculatorConfigError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def _parse_floor_band(band: str) -> dict[str, Any]:
    band = band.strip()
    if "-" in band:
        lo, hi = band.split("-", 1)
        return {"label": band, "floorMin": int(lo), "floorMax": int(hi)}
    if band.endswith("+"):
        lo = int(band[:-1])
        return {"label": band, "floorMin": lo, "floorMax": 999}
    n = int(band)
    return {"label": band, "floorMin": n, "floorMax": n}


def _project_id_for_row(row: PriceTableRow, slug_by_id: dict[UUID, str]) -> str | None:
    if row.project_id is not None:
        return slug_by_id.get(row.project_id)
    conditions = row.conditions or {}
    if conditions.get("calculator_project_id"):
        return str(conditions["calculator_project_id"])
    if conditions.get("project_slug"):
        return str(conditions["project_slug"])
    return None


def _rows_to_residential_price_rows(
    rows: list[PriceTableRow],
    slug_by_id: dict[UUID, str],
) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for row in rows:
        if row.price_per_sqm is None or not row.unit_type_code or not row.floor_band:
            continue
        project_id = _project_id_for_row(row, slug_by_id)
        if not project_id:
            continue
        finish = row.finish_type or FINISH_BY_CODE.get(row.unit_type_code, "semi-finished")
        out.append(
            {
                "projectId": project_id,
                "unitTypeCode": row.unit_type_code,
                "finishType": finish,
                "floorBand": _parse_floor_band(row.floor_band),
                "pricePerSqm": float(row.price_per_sqm),
            }
        )
    return out


def _normalize_stored_config(stored: dict[str, Any]) -> dict[str, Any]:
    """Normalize calculator_config from DB to snake_case API fields."""

    def zones(raw: list[dict]) -> list[dict]:
        return [
            {
                "id": z["id"],
                "label_key": z.get("label_key") or z.get("labelKey", z["id"]),
                "floors": z["floors"],
            }
            for z in raw
        ]

    def tiers(raw: list[dict]) -> list[dict]:
        return [
            {
                "id": t["id"],
                "down_payment_percent": t.get("down_payment_percent", t.get("downPaymentPercent")),
                "client_discount_percent": t.get(
                    "client_discount_percent", t.get("clientDiscountPercent")
                ),
                "label_key": t.get("label_key", t.get("labelKey", t["id"])),
                "is_6040": t.get("is_6040", t.get("is6040", False)),
            }
            for t in raw
        ]

    def projects(raw: list[dict]) -> list[dict]:
        return [
            {
                "id": p["id"],
                "area_label_key": p.get("area_label_key", p.get("areaLabelKey", "")),
                "name_key": p.get("name_key", p.get("nameKey", "")),
                "max_floor": p.get("max_floor", p.get("maxFloor", 1)),
                "supports_completion_choice": p.get(
                    "supports_completion_choice", p.get("supportsCompletionChoice", False)
                ),
                "uses_strategy_floor_table": p.get(
                    "uses_strategy_floor_table", p.get("usesStrategyFloorTable", False)
                ),
            }
            for p in raw
        ]

    def milestones(raw: dict[str, list]) -> dict[str, list[dict]]:
        result: dict[str, list[dict]] = {}
        for schedule_id, steps in raw.items():
            result[schedule_id] = [
                {
                    "id": s["id"],
                    "label_key": s.get("label_key", s.get("labelKey", s["id"])),
                    "percent": s["percent"],
                }
                for s in steps
            ]
        return result

    bedroom = stored.get("bedroom_area_options") or stored.get("bedroomAreaOptions") or {}
    bedroom_out: dict[str, list[int]] = {str(k): [int(x) for x in v] for k, v in bedroom.items()}

    inv_map = stored.get("inventory_to_strategy_location") or stored.get(
        "inventoryToStrategyLocation"
    ) or {}

    return {
        "residential_projects": projects(stored.get("residential_projects", [])),
        "commercial_zones": zones(stored.get("commercial_zones", [])),
        "down_payment_tiers": tiers(stored.get("down_payment_tiers", [])),
        "milestone_schedules": milestones(stored.get("milestone_schedules", {})),
        "bedroom_area_options": bedroom_out,
        "commercial_area_min": stored.get("commercial_area_min", stored.get("commercialAreaMin")),
        "commercial_area_max": stored.get("commercial_area_max", stored.get("commercialAreaMax")),
        "commercial_area_presets": stored.get(
            "commercial_area_presets", stored.get("commercialAreaPresets", [])
        ),
        "inventory_to_strategy_location": inv_map,
    }


def get_company_by_slug(db: Session, company_slug: str) -> Company | None:
    return db.query(Company).filter(Company.slug == company_slug).first()


def build_public_calculator_config(
    db: Session,
    *,
    company_id: UUID,
    as_of: date | None = None,
) -> dict[str, Any]:
    as_of = as_of or date.today()
    version = get_active_published_version(db, company_id=company_id, as_of=as_of)
    if version is None:
        raise CalculatorConfigError(
            "NO_PUBLISHED_PRICING",
            "No published pricing version is active for this company",
        )

    stored = version.calculator_config
    if not stored:
        stored = build_calculator_config_snapshot(load_official())

    base = _normalize_stored_config(stored)
    base["currency"] = version.currency
    base["pricing_version_id"] = str(version.id)
    base["pricing_version_name"] = version.name
    base["includes_vat"] = version.includes_vat

    version_with_rows = (
        db.query(PricingVersion)
        .options(selectinload(PricingVersion.price_rows))
        .filter(PricingVersion.id == version.id)
        .first()
    )
    rows = version_with_rows.price_rows if version_with_rows else []

    project_ids = {r.project_id for r in rows if r.project_id is not None}
    slug_by_id: dict[UUID, str] = {}
    if project_ids:
        for proj in db.query(Project).filter(Project.id.in_(project_ids)).all():
            slug_by_id[proj.id] = proj.slug

    residential_rows = _rows_to_residential_price_rows(rows, slug_by_id)
    if not residential_rows:
        raise CalculatorConfigError(
            "NO_RESIDENTIAL_RATES",
            "Published pricing has no apartment rate rows for the calculator",
        )

    base["residential_price_rows"] = []
    for r in residential_rows:
        fb = r["floorBand"]
        base["residential_price_rows"].append(
            {
                "project_id": r["projectId"],
                "unit_type_code": r["unitTypeCode"],
                "finish_type": r["finishType"],
                "floor_band": {
                    "label": fb["label"],
                    "floor_min": fb["floorMin"],
                    "floor_max": fb["floorMax"],
                },
                "price_per_sqm": r["pricePerSqm"],
            }
        )
    return base


def merge_calculator_config_update(
    current: dict[str, Any] | None,
    patch: dict[str, Any],
) -> dict[str, Any]:
    merged = dict(current or {})
    for key, value in patch.items():
        if value is not None:
            merged[key] = value
    return merged
