#!/usr/bin/env python3
"""Build backend/data/temer_production.json from temer_scraped.json."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRAPED = ROOT / "backend" / "data" / "temer_scraped.json"
OUT = ROOT / "backend" / "data" / "temer_production.json"

AREA_LABELS = {
    "sarbet": "Sarbet",
    "aware-area": "Aware",
    "ayat-area": "Ayat",
    "gelan-area": "Gelan",
    "garment-area": "Garment",
    "piyassa-area": "Piyassa",
}

PROJECT_RULES: list[tuple[str, str, str, str]] = [
    (r"city\s*plus", "sarbet-city-plus", "Sarbet City Plus", "Sarbet"),
    (r"blue\s*point", "sarbet-blue-point", "Sarbet Blue Point", "Sarbet"),
    (r"gelan\s*shopping", "gelan-shopping-center", "Gelan Shopping Center", "Gelan"),
    (r"aware-4|aware\s*–|aware\s*-", "aware-site", "Aware Site", "Aware"),
    (r"ayat\s*to\s*center", "ayat-to-center", "Ayat To Center", "Ayat"),
    (r"ayat\s*lomiyad", "ayat-lomiyad", "Ayat Lomiyad", "Ayat"),
    (r"ayat\s*feres", "ayat-feres-bet", "Ayat Feres Bet", "Ayat"),
    (r"achantan", "achantan", "Achantan", "Ayat"),
    (r"haile\s*garment", "haile-garment", "Haile Garment", "Garment"),
    (r"lycee\s*burat", "lycee-burat", "Lycee Burat", "Piyassa"),
    (r"lycee\s*new\s*road|lycee\s*newroad", "lycee-new-road", "Lycee New Road", "Piyassa"),
    (r"lycee\s*seken|seken", "lycee-seken", "Lycee Seken", "Piyassa"),
    (r"sumaletera|sumale\s*tera", "sumaletera", "Sumaletera", "Piyassa"),
    (r"sarbet\s*-au|sarbet\s*-seken", "sarbet-au-seken", "Sarbet Au / Seken", "Sarbet"),
    (r"arada\s*site", "arada-site", "Arada Site", "Piyassa"),
    (r"adwa-empire|adwa\s*empire", "adwa-empire", "Adwa Empire", "Piyassa"),
    (r"adwa\s*-ewket|adwa-ewket", "adwa-ewket", "Adwa Ewket", "Piyassa"),
    (r"aware", "aware-site", "Aware Site", "Aware"),
    (r"sarbet", "sarbet-general", "Sarbet", "Sarbet"),
]

FEATURED_PROPERTY_IDS = {"28908", "28893", "28802", "25947", "25918", "25920"}


def infer_project(title: str, area_slug: str | None, location: str | None) -> tuple[str, str, str]:
    t = title.lower()
    for pattern, slug, name, area in PROJECT_RULES:
        if re.search(pattern, t, re.I):
            return slug, name, area
    if area_slug:
        label = AREA_LABELS.get(area_slug, (location or area_slug).replace("-", " ").title())
        slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-") + "-listings"
        return slug, label, label
    loc = location or "Addis Ababa"
    slug = re.sub(r"[^a-z0-9]+", "-", loc.lower()).strip("-")
    return f"temer-{slug}", loc, loc


def bedroom_count(prop: dict) -> int | None:
    if prop.get("is_commercial"):
        return None
    raw = prop.get("bedrooms")
    if raw is None:
        return None
    m = re.search(r"(\d+)", str(raw))
    return int(m.group(1)) if m else None


def unit_type_code(prop: dict) -> str:
    if prop.get("is_commercial"):
        return "TSHOP"
    n = bedroom_count(prop)
    if n is None:
        return "TAPT"
    if n >= 4:
        return "T4BR"
    if n == 3:
        return "T3BR"
    if n == 2:
        return "T2BR"
    return "T1BR"


def unit_type_name(code: str) -> str:
    return {
        "TSHOP": "Commercial shop / unit",
        "T4BR": "Four-bedroom apartment",
        "T3BR": "Three-bedroom apartment",
        "T2BR": "Two-bedroom apartment",
        "T1BR": "One-bedroom apartment",
        "TAPT": "Apartment",
    }[code]


def parse_area_sqm(prop: dict) -> str:
    raw = prop.get("property_size_sqm")
    if raw:
        n = re.sub(r"[^\d.]", "", str(raw).split("–")[0].split("-")[0])
        if n:
            return f"{float(n):.1f}" if "." in n else f"{float(n):.1f}"
    details = prop.get("details") or {}
    lot = details.get("Property Lot Size") or ""
    m = re.search(r"([\d,]+)", lot)
    if m and prop.get("is_commercial"):
        return f"{float(m.group(1).replace(',', '')):.1f}"
    defaults = {"T1BR": "80.0", "T2BR": "100.0", "T3BR": "145.0", "T4BR": "165.0", "TSHOP": "500.0"}
    return defaults.get(unit_type_code(prop), "100.0")


def build_description(prop: dict, area: str) -> str:
    parts: list[str] = []
    raw_desc = str(prop.get("description") or "")
    junk_markers = ("Schedule a showing", "Book A tour", "Sales Office", "Time 07:00")
    if raw_desc and len(raw_desc) < 500 and not any(m in raw_desc for m in junk_markers):
        parts.append(raw_desc)
    else:
        parts.append(f"{prop['title']} — Temer Properties, {area}, Addis Ababa.")
    details = prop.get("details") or {}
    if details.get("Delivery Time"):
        parts.append(f"Delivery: {details['Delivery Time']}.")
    if details.get("Building Type"):
        parts.append(f"Building type: {details['Building Type']}.")
    pid = prop.get("property_id")
    if pid:
        parts.append(f"Temer listing ref. {pid}. Price on request — contact Belay Properties.")
    return " ".join(parts)[:2000]


def main() -> None:
    data = json.loads(SCRAPED.read_text(encoding="utf-8"))
    company_src = data.get("company", {})
    properties = [p for p in data.get("properties", []) if "error" not in p and p.get("property_id")]

    projects_map: dict[str, dict] = {}
    unit_types_map: dict[str, dict] = {}
    units: list[dict] = []
    listings: list[dict] = []

    for prop in properties:
        title = prop["title"]
        area_slug = prop.get("area_slug")
        location = prop.get("location_label")
        proj_slug, proj_name, area_label = infer_project(title, area_slug, location)

        if proj_slug not in projects_map:
            floors = 23 if "sarbet" in proj_slug else 7 if "gelan" in proj_slug else 18
            block_code = "C1" if prop.get("is_commercial") else "T1"
            projects_map[proj_slug] = {
                "slug": proj_slug,
                "name": proj_name,
                "city": "Addis Ababa",
                "area": area_label,
                "blocks": [
                    {
                        "code": block_code,
                        "name": "Commercial block" if block_code == "C1" else "Tower 1",
                        "total_floors": floors,
                    }
                ],
            }

        code = unit_type_code(prop)
        beds = bedroom_count(prop)
        if code not in unit_types_map:
            unit_types_map[code] = {
                "code": code,
                "name": unit_type_name(code),
                "category": "commercial" if code == "TSHOP" else "residential",
                "bedrooms": beds,
                "default_area_sqm": parse_area_sqm(prop),
            }

        block_code = "C1" if prop.get("is_commercial") else "T1"
        unit_number = f"T{prop['property_id']}"
        area_sqm = parse_area_sqm(prop)

        units.append(
            {
                "project_slug": proj_slug,
                "block_code": block_code,
                "unit_number": unit_number,
                "unit_type_code": code,
                "floor_number": 1,
                "area_sqm": area_sqm,
                "status": "available",
            }
        )

        specs = {k: v for k, v in (prop.get("details") or {}).items() if v and str(v).strip()}
        listing_slug = f"temer-{prop['slug']}"
        feature_groups = prop.get("feature_groups") or {}
        if not any(feature_groups.values()):
            feature_groups = None

        listings.append(
            {
                "unit_ref": {
                    "project_slug": proj_slug,
                    "block_code": block_code,
                    "unit_number": unit_number,
                },
                "slug": listing_slug,
                "title": title,
                "description": build_description(prop, area_label),
                "city": "Addis Ababa",
                "area": area_label,
                "is_public": True,
                "is_featured": prop.get("property_id") in FEATURED_PROPERTY_IDS,
                "images": prop.get("images") or [],
                "property_kind": "commercial" if prop.get("is_commercial") else "residential",
                "external_property_id": prop.get("property_id"),
                "specs": specs,
                "feature_groups": feature_groups,
                "map": (
                    {
                        "latitude": prop["map"]["latitude"],
                        "longitude": prop["map"]["longitude"],
                        "label": title,
                    }
                    if prop.get("map")
                    else None
                ),
            }
        )

    out = {
        "_meta": {
            "description": "Full Temer inventory generated from temer_scraped.json",
            "source": data.get("source", "https://temerproperties.com/"),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scraped_at": data.get("scraped_at"),
            "listings_count": len(listings),
            "currency": "ETB",
        },
        "company": {
            "slug": company_src.get("suggested_slug", "temer-properties"),
            "name": company_src.get("brand_name", "Temer Properties"),
            "phone": company_src.get("phones", ["+251975666699"])[0],
            "website": company_src.get("website", "https://temerproperties.com/"),
            "description": (
                "Addis Ababa real estate developer. Belay Properties lists Temer apartments and "
                "commercial units; purchase and contracts are with Temer Properties."
            ),
        },
        "projects": list(projects_map.values()),
        "unit_types": list(unit_types_map.values()),
        "units": units,
        "listings": listings,
    }

    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"  projects: {len(out['projects'])}")
    print(f"  listings: {len(out['listings'])}")
    print(f"  unit types: {len(out['unit_types'])}")


if __name__ == "__main__":
    main()
