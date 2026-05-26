"""Load Ayat official 2018 strategy data for seed and calculator."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

# Sync with frontend/src/data/ayat_official_2018.json (production web image uses that copy).
OFFICIAL_PATH = Path(__file__).resolve().parents[2] / "data" / "ayat_official_2018.json"

# 3BR semi-finished uses SFCR; Section 10 has no SFCR semi column — fall back to SFCA band.
SEMI_FINISHED_TYPES = ("SFCA", "SFCR")
REGULAR_FINISHED_TYPES = ("RFCA", "RFCR")

FINISH_BY_CODE = {
    "SFCA": "semi-finished",
    "SFCR": "semi-finished",
    "RFCA": "regular-finished",
    "RFCR": "regular-finished",
}


def load_official(path: Path | None = None) -> dict[str, Any]:
    p = path or OFFICIAL_PATH
    with p.open(encoding="utf-8") as fh:
        return json.load(fh)


def _band_price(location_prices: dict, unit_code: str, band_label: str) -> int | None:
    unit_prices = location_prices.get(unit_code) or {}
    price = unit_prices.get(band_label)
    if price is None and unit_code == "SFCR":
        price = (location_prices.get("SFCA") or {}).get(band_label)
    return price


def expand_section10_price_rows(official: dict[str, Any]) -> list[dict[str, Any]]:
    """All strategy location rows (for calculator projects)."""
    s10 = official["section10_apartments"]
    bands = s10["floor_bands"]
    rows: list[dict[str, Any]] = []

    for location_id, location in s10["locations"].items():
        for unit_code in (*SEMI_FINISHED_TYPES, *REGULAR_FINISHED_TYPES):
            finish = FINISH_BY_CODE[unit_code]
            for band in bands:
                price = _band_price(location, unit_code, band["label"])
                if price is None:
                    continue
                rows.append(
                    {
                        "project_slug": location_id,
                        "unit_type_code": unit_code,
                        "finish_type": finish,
                        "floor_band": band["label"],
                        "price_per_sqm": str(price),
                    }
                )
    return rows


def _append_price_rows(
    rows: list[dict[str, Any]],
    *,
    project_slug: str,
    location_prices: dict,
    bands: list[dict[str, Any]],
    max_floor: int,
    construction_state: str | None = None,
) -> None:
    for unit_code in (*SEMI_FINISHED_TYPES, *REGULAR_FINISHED_TYPES):
        finish = FINISH_BY_CODE[unit_code]
        for band in bands:
            if band["floor_min"] > max_floor:
                continue
            price = _band_price(location_prices, unit_code, band["label"])
            if price is None:
                continue
            row: dict[str, Any] = {
                "project_slug": project_slug,
                "unit_type_code": unit_code,
                "finish_type": finish,
                "floor_band": band["label"],
                "price_per_sqm": str(price),
            }
            if construction_state:
                row["construction_state"] = construction_state
            rows.append(row)


def expand_listing_project_price_rows(official: dict[str, Any]) -> list[dict[str, Any]]:
    """Rows for each inventory project slug in listing_project_map."""
    s10 = official["section10_apartments"]
    bands = s10["floor_bands"]
    locations = s10["locations"]
    listing_map = s10["listing_project_map"]
    rows: list[dict[str, Any]] = []

    for project_slug, config in listing_map.items():
        if "source" in config:
            source = locations[config["source"]]
            _append_price_rows(
                rows,
                project_slug=project_slug,
                location_prices=source,
                bands=bands,
                max_floor=config["max_floor"],
            )
            continue
        max_floor = config["max_floor"]
        for state_key, source_id in (
            ("near_completion", config["near_completion"]),
            ("unstarted", config["unstarted"]),
        ):
            _append_price_rows(
                rows,
                project_slug=project_slug,
                location_prices=locations[source_id],
                bands=bands,
                max_floor=max_floor,
                construction_state=state_key,
            )
    return rows


def build_pricing_block(official: dict[str, Any]) -> dict[str, Any]:
    meta = official["_meta"]
    # DB rows for inventory projects only; calculator reads full Section 10 from JSON.
    rows = expand_listing_project_price_rows(official)
    tiers = official["section6_payment_tiers"]
    discount_rules: list[dict[str, Any]] = []
    for i, tier in enumerate(tiers):
        discount_rules.append(
            {
                "rule_type": "upfront_payment",
                "priority": 10 + i,
                "discount_percent": str(tier["client_discount_percent"]),
                "conditions": {
                    "tier_id": tier["id"],
                    "down_payment_percent": tier["down_payment_percent"],
                    "is_6040": tier.get("is_6040", False),
                },
            }
        )
    for j, group in enumerate(official.get("section7_group_discounts") or []):
        discount_rules.append(
            {
                "rule_type": "group_buyer",
                "priority": 30 + j,
                "discount_percent": str(group["additional_discount_percent"]),
                "conditions": {
                    "min_buyers": group["min_buyers"],
                    "max_buyers": group.get("max_buyers"),
                    "note": "Section 7 — additional discount on top of base client discount",
                },
            }
        )

    return {
        "document_title": meta["title"],
        "version_name": f"Ayat official strategy ({meta['reference']})",
        "effective_from": "2018-05-15",
        "includes_vat": meta.get("includes_vat", True),
        "archive_previous_versions": True,
        "price_rows": rows,
        "discount_rules": discount_rules,
    }


def build_commission_block(official: dict[str, Any]) -> dict[str, Any]:
    tiers = official["section6_payment_tiers"]
    rules = []
    for tier in tiers:
        rules.append(
            {
                "sales_channel": "default",
                "commission_percent": str(tier["employee_commission_percent"]),
                "conditions": {
                    "tier_id": tier["id"],
                    "down_payment_percent": tier["down_payment_percent"],
                },
            }
        )
    return {
        "scheme_name": "Ayat employee commission (Section 6)",
        "effective_from": "2018-05-15",
        "rules": rules,
        "sales_channels": [
            {"code": "default", "name": "Default sales"},
            {"code": "agent", "name": "Sales agent"},
        ],
    }
