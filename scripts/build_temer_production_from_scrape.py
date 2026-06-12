#!/usr/bin/env python3
"""Build backend/data/temer_production.json from temer_scraped.json (Ayat-style layout)."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.data.temer_seed_builder import (  # noqa: E402
    AREA_LABELS,
    FEATURED_PROPERTY_IDS,
    build_location_content,
    clean_description,
    infer_building,
    parse_area_sqm,
    unit_type_code,
    unit_type_name,
)

SCRAPED = ROOT / "backend" / "data" / "temer_scraped.json"
OUT = ROOT / "backend" / "data" / "temer_production.json"


def main() -> None:
    data = json.loads(SCRAPED.read_text(encoding="utf-8"))
    company_src = data.get("company", {})
    properties = [p for p in data.get("properties", []) if "error" not in p and p.get("property_id")]

    projects_map: dict[str, dict] = {}
    unit_types_map: dict[str, dict] = {}
    units: list[dict] = []
    listings: list[dict] = []

    for prop in properties:
        area_slug = prop.get("area_slug") or "sarbet"
        area_label = AREA_LABELS.get(area_slug, area_slug.replace("-", " ").title())
        is_shop = bool(prop.get("is_commercial"))
        block_code, building_name = infer_building(prop["title"], area_slug)

        if is_shop:
            project_slug = f"shop-{area_slug}"
            location_kind = "shop"
            location_id = area_slug
            project_name = f"{area_label} — Shops"
        else:
            project_slug = area_slug
            location_kind = "apartment"
            location_id = area_slug
            project_name = f"{area_label} (Temer)"

        if project_slug not in projects_map:
            floors = 23 if area_slug == "sarbet" else 7 if area_slug == "gelan-area" else 18
            projects_map[project_slug] = {
                "slug": project_slug,
                "name": project_name,
                "city": "Addis Ababa",
                "area": area_label,
                "location_kind": location_kind,
                "location_id": location_id,
                "blocks": [],
            }
            projects_map[project_slug]["_block_codes"] = set()

        proj = projects_map[project_slug]
        block_codes: set[str] = proj["_block_codes"]
        if block_code not in block_codes:
            block_codes.add(block_code)
            proj["blocks"].append(
                {
                    "code": block_code,
                    "name": building_name,
                    "total_floors": floors,
                }
            )

        code = unit_type_code(prop)
        if code not in unit_types_map:
            unit_types_map[code] = {
                "code": code,
                "name": unit_type_name(code),
                "category": "commercial" if code == "TSHOP" else "residential",
                "bedrooms": bedroom_count(prop),
                "default_area_sqm": parse_area_sqm(prop),
            }

        unit_number = f"T{prop['property_id']}"
        area_sqm = parse_area_sqm(prop)
        units.append(
            {
                "project_slug": project_slug,
                "block_code": block_code,
                "unit_number": unit_number,
                "unit_type_code": code,
                "floor_number": 1,
                "area_sqm": area_sqm,
                "status": "available",
            }
        )

        specs = {k: v for k, v in (prop.get("details") or {}).items() if v and str(v).strip()}
        feature_groups = prop.get("feature_groups") or {}
        if not any(feature_groups.values()):
            feature_groups = None

        listings.append(
            {
                "unit_ref": {
                    "project_slug": project_slug,
                    "block_code": block_code,
                    "unit_number": unit_number,
                },
                "slug": f"temer-{prop['slug']}",
                "title": prop["title"],
                "description": clean_description(prop, area_label),
                "city": "Addis Ababa",
                "area": area_label,
                "is_public": True,
                "is_featured": prop.get("property_id") in FEATURED_PROPERTY_IDS,
                "images": prop.get("images") or [],
                "property_kind": "commercial" if is_shop else "residential",
                "location_kind": location_kind,
                "location_id": location_id,
                "building_name": building_name,
                "external_property_id": prop.get("property_id"),
                "specs": specs,
                "feature_groups": feature_groups,
                "map": (
                    {
                        "latitude": prop["map"]["latitude"],
                        "longitude": prop["map"]["longitude"],
                        "label": prop["title"],
                    }
                    if prop.get("map")
                    else None
                ),
            }
        )

    for proj in projects_map.values():
        proj.pop("_block_codes", None)

    location_content = build_location_content(data, properties)

    out = {
        "_meta": {
            "description": (
                "Temer inventory for Belay Properties — Ayat-style layout: area location pages "
                "(apartment + shop), building blocks within each area project, rich listing metadata."
            ),
            "source": data.get("source", "https://temerproperties.com/"),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scraped_at": data.get("scraped_at"),
            "listings_count": len(listings),
            "location_pages": {
                "apartments": len(location_content["apartments"]),
                "shops": len(location_content["shops"]),
            },
            "currency": "ETB",
            "pricing_note": "No calculator pricing — Temer listings show price on request.",
        },
        "company": {
            "slug": company_src.get("suggested_slug", "temer-properties"),
            "name": company_src.get("brand_name", "Temer Properties"),
            "phone": company_src.get("phones", ["+251975666699"])[0],
            "website": company_src.get("website", "https://temerproperties.com/"),
            "description": (
                "Addis Ababa real estate developer. Belay Properties lists Temer apartments and "
                "commercial units by area (Sarbet, Aware, Ayat, Gelan, Garment, Piyassa); "
                "purchase and contracts are with Temer Properties."
            ),
        },
        "location_content": location_content,
        "projects": list(projects_map.values()),
        "unit_types": list(unit_types_map.values()),
        "units": units,
        "listings": listings,
    }

    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"  area projects: {len(out['projects'])}")
    print(f"  apartment location pages: {len(location_content['apartments'])}")
    print(f"  shop location pages: {len(location_content['shops'])}")
    print(f"  listings: {len(out['listings'])}")


def bedroom_count(prop: dict) -> int | None:
    if prop.get("is_commercial"):
        return None
    raw = prop.get("bedrooms")
    if raw is None:
        return None
    import re

    m = re.search(r"(\d+)", str(raw))
    return int(m.group(1)) if m else None


if __name__ == "__main__":
    main()
