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
    # Strategy location rows (calculator) + inventory project rows (listings / quotes).
    rows = expand_section10_price_rows(official) + expand_listing_project_price_rows(official)
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
        "calculator_config": build_calculator_config_snapshot(official),
        "price_rows": rows,
        "discount_rules": discount_rules,
    }


SHOP_LABEL_KEYS: dict[str, str] = {
    "ledeta": "calculator.shopZones.ledeta",
    "kazanchis": "calculator.shopZones.kazanchis",
    "bole-air": "calculator.shopZones.boleAir",
    "zone-2": "calculator.shopZones.zone2",
    "meri-luke-1": "calculator.shopZones.meriLuke1",
    "summit": "calculator.shopZones.summit",
    "zone-3-university": "calculator.shopZones.zone3University",
    "zone-8-linda": "calculator.shopZones.zone8Linda",
}

MILESTONE_LABEL_KEYS: dict[str, str] = {
    "sign": "calculator.milestones.signing",
    "m4": "calculator.milestones.month4",
    "m8": "calculator.milestones.month8",
    "m12": "calculator.milestones.month12",
    "m18": "calculator.milestones.month18",
    "m24": "calculator.milestones.month24",
    "structure": "calculator.milestones.structure",
    "handover": "calculator.milestones.handover",
}

TIER_LABEL_KEYS: dict[str, str] = {
    "100": "calculator.tiers.t100",
    "85": "calculator.tiers.t85",
    "70": "calculator.tiers.t70",
    "55": "calculator.tiers.t55",
    "40": "calculator.tiers.t40",
    "35": "calculator.tiers.t35",
    "60_40": "calculator.tiers.t6040",
}


def build_calculator_config_snapshot(official: dict[str, Any]) -> dict[str, Any]:
    """Static calculator metadata (shops, tiers, milestones) stored on PricingVersion."""
    s2 = official["section2_bedroom_sizes_sqm"]
    s6 = official["section6_payment_tiers"]
    s11 = official["section11_shops"]
    s13 = official["section13_milestones"]

    residential_projects = [
        {
            "id": "lideta-unstarted",
            "area_label_key": "calculator.zones.lideta",
            "name_key": "calculator.projects.lideta",
            "max_floor": 36,
            "supports_completion_choice": False,
            "uses_strategy_floor_table": True,
        },
        {
            "id": "kazanchis-started",
            "area_label_key": "calculator.zones.kazanchis",
            "name_key": "calculator.projects.kazanchis",
            "max_floor": 36,
            "supports_completion_choice": False,
            "uses_strategy_floor_table": True,
        },
        {
            "id": "bole-unstarted",
            "area_label_key": "calculator.zones.bole",
            "name_key": "calculator.projects.bole",
            "max_floor": 36,
            "supports_completion_choice": False,
            "uses_strategy_floor_table": True,
        },
        {
            "id": "cmc-unstarted",
            "area_label_key": "calculator.zones.cmc",
            "name_key": "calculator.projects.cmcUnstarted",
            "max_floor": 36,
            "supports_completion_choice": False,
            "uses_strategy_floor_table": True,
        },
        {
            "id": "cmc-near-completion",
            "area_label_key": "calculator.zones.cmc",
            "name_key": "calculator.projects.cmcNearCompletion",
            "max_floor": 36,
            "supports_completion_choice": False,
            "uses_strategy_floor_table": True,
        },
        {
            "id": "cmc-extension",
            "area_label_key": "calculator.zones.cmc",
            "name_key": "calculator.projects.cmc",
            "max_floor": 17,
            "supports_completion_choice": True,
        },
        {
            "id": "ayat-hills",
            "area_label_key": "calculator.zones.ayatMainVillage",
            "name_key": "calculator.projects.ayatHills",
            "max_floor": 16,
            "supports_completion_choice": False,
            "uses_strategy_floor_table": True,
        },
    ]

    commercial_zones = []
    for zone in s11["zones"]:
        commercial_zones.append(
            {
                "id": zone["id"],
                "label_key": SHOP_LABEL_KEYS.get(zone["id"], f"calculator.shopZones.{zone['id']}"),
                "floors": zone["floors"],
            }
        )

    down_payment_tiers = [
        {
            "id": tier["id"],
            "down_payment_percent": tier["down_payment_percent"],
            "client_discount_percent": tier["client_discount_percent"],
            "label_key": TIER_LABEL_KEYS.get(tier["id"], f"calculator.tiers.t{tier['id']}"),
            "is_6040": tier.get("is_6040", False),
        }
        for tier in s6
    ]

    milestone_schedules: dict[str, list[dict[str, Any]]] = {}
    for schedule_id, steps in s13.items():
        milestone_schedules[schedule_id] = [
            {
                "id": step["id"],
                "label_key": MILESTONE_LABEL_KEYS.get(step["id"], step["id"]),
                "percent": step["percent"],
            }
            for step in steps
        ]

    bedroom_three = list(s2["3"])
    if 107 not in bedroom_three:
        bedroom_three.append(107)

    return {
        "residential_projects": residential_projects,
        "commercial_zones": commercial_zones,
        "down_payment_tiers": down_payment_tiers,
        "milestone_schedules": milestone_schedules,
        "bedroom_area_options": {
            "1": list(s2["1"]),
            "2": list(s2["2"]),
            "3": bedroom_three,
        },
        "commercial_area_min": s11["size_min_sqm"],
        "commercial_area_max": s11["size_max_sqm"],
        "commercial_area_presets": [30, 50, 75, 100, 150, 200, 240],
        "inventory_to_strategy_location": {
            "ayat-hills": "lideta-unstarted",
            "lideta-residential": "lideta-unstarted",
            "kazanchis-residential": "kazanchis-started",
            "bole-belair": "bole-unstarted",
        },
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
