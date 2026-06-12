"""Build Temer production JSON sections (Ayat-style: area location pages + building blocks)."""

from __future__ import annotations

import re
from typing import Any

AREA_LABELS: dict[str, str] = {
    "sarbet": "Sarbet",
    "aware-area": "Aware",
    "ayat-area": "Ayat",
    "gelan-area": "Gelan",
    "garment-area": "Garment",
    "piyassa-area": "Piyassa",
}

PROJECT_RULES: list[tuple[str, str, str]] = [
    (r"city\s*plus", "city-plus", "Sarbet City Plus"),
    (r"blue\s*point", "blue-point", "Sarbet Blue Point"),
    (r"gelan\s*shopping", "gelan-shopping", "Gelan Shopping Center"),
    (r"aware-4|aware\s*–|aware\s*-", "aware-site", "Aware Site"),
    (r"ayat\s*to\s*center", "ayat-to-center", "Ayat To Center"),
    (r"ayat\s*lomiyad", "ayat-lomiyad", "Ayat Lomiyad"),
    (r"ayat\s*feres", "ayat-feres-bet", "Ayat Feres Bet"),
    (r"achantan", "achantan", "Achantan"),
    (r"haile\s*garment", "haile-garment", "Haile Garment"),
    (r"lycee\s*burat", "lycee-burat", "Lycee Burat"),
    (r"lycee\s*new\s*road|lycee\s*newroad", "lycee-new-road", "Lycee New Road"),
    (r"lycee\s*seken|seken", "lycee-seken", "Lycee Seken"),
    (r"sumaletera|sumale\s*tera", "sumaletera", "Sumaletera"),
    (r"sarbet\s*-au|sarbet\s*-seken", "sarbet-au-seken", "Sarbet Au / Seken"),
    (r"arada\s*site", "arada-site", "Arada Site"),
    (r"adwa-empire|adwa\s*empire", "adwa-empire", "Adwa Empire"),
    (r"adwa\s*-ewket|adwa-ewket", "adwa-ewket", "Adwa Ewket"),
    (r"aware", "aware-site", "Aware Site"),
    (r"sarbet", "sarbet-general", "Sarbet"),
]

FEATURED_PROPERTY_IDS = {"28908", "28893", "28802", "25947", "25918", "25920"}


def infer_building(title: str, area_slug: str | None) -> tuple[str, str]:
    """Return (block_code, building_display_name) within an area project."""
    t = title.lower()
    for pattern, code, name in PROJECT_RULES:
        if re.search(pattern, t, re.I):
            return code, name
    if area_slug:
        label = AREA_LABELS.get(area_slug, area_slug.replace("-", " ").title())
        code = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")[:32] or "main"
        return f"{code}-general", label
    return "main", "Main building"


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
            return f"{float(n):.1f}"
    details = prop.get("details") or {}
    lot = details.get("Property Lot Size") or ""
    m = re.search(r"([\d,]+)", lot)
    if m and prop.get("is_commercial"):
        return f"{float(m.group(1).replace(',', '')):.1f}"
    defaults = {"T1BR": "80.0", "T2BR": "100.0", "T3BR": "145.0", "T4BR": "165.0", "TSHOP": "500.0"}
    return defaults.get(unit_type_code(prop), "100.0")


def clean_description(prop: dict, area: str) -> str:
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


def _area_description(scraped_area: dict | None, label: str) -> str:
    if scraped_area:
        meta = (scraped_area.get("meta_description") or "").strip()
        if meta and len(meta) > 40:
            return meta[:1200]
    return (
        f"Browse Temer Properties apartments and commercial units in {label}, Addis Ababa. "
        "Prices are on request — Belay Properties helps you compare layouts and "
        "contact Temer sales."
    )


def build_location_cards(
    area_slug: str,
    props_in_area: list[dict],
    *,
    kind: str,
) -> list[dict[str, str | None]]:
    cards: list[dict[str, str | None]] = []
    if kind == "shop":
        for prop in props_in_area[:4]:
            size = parse_area_sqm(prop)
            ref = prop.get("property_id", "—")
            cards.append(
                {
                    "title": prop.get("title", "Commercial unit"),
                    "body": f"Approx. {size} m² — price on request. Temer ref. {ref}.",
                    "image_url": (prop.get("images") or [None])[0],
                }
            )
    else:
        by_beds: dict[int, list[dict]] = {}
        for prop in props_in_area:
            if prop.get("is_commercial"):
                continue
            beds = bedroom_count(prop) or 0
            by_beds.setdefault(beds, []).append(prop)
        for beds in sorted(by_beds.keys()):
            if beds <= 0:
                continue
            sample = by_beds[beds][0]
            size = parse_area_sqm(sample)
            label = f"{beds} bedroom" if beds == 1 else f"{beds} bedrooms"
            cards.append(
                {
                    "title": label,
                    "body": (
                        f"From {size} m² in {AREA_LABELS.get(area_slug, area_slug)}. "
                        f"{len(by_beds[beds])} layout(s) listed — price on request."
                    ),
                    "image_url": (sample.get("images") or [None])[0],
                }
            )
        buildings = {
            infer_building(p["title"], area_slug)[1]
            for p in props_in_area
            if not p.get("is_commercial")
        }
        if buildings:
            cards.append(
                {
                    "title": "Developments in this area",
                    "body": ", ".join(sorted(buildings)[:8]),
                    "image_url": None,
                }
            )
    cards.append(
        {
            "title": "Source",
            "body": "Data from temerproperties.com — verify details with Temer before purchase.",
            "image_url": None,
        }
    )
    return cards


def build_location_content(
    scraped: dict[str, Any],
    properties: list[dict],
) -> dict[str, list[dict[str, Any]]]:
    areas_by_slug = {a["slug"]: a for a in scraped.get("areas", []) if a.get("slug")}
    by_area: dict[str, list[dict]] = {}
    shop_by_area: dict[str, list[dict]] = {}

    for prop in properties:
        area_slug = prop.get("area_slug") or "sarbet"
        if prop.get("is_commercial"):
            shop_by_area.setdefault(area_slug, []).append(prop)
        else:
            by_area.setdefault(area_slug, []).append(prop)

    apartments: list[dict[str, Any]] = []
    for area_slug, label in AREA_LABELS.items():
        props_in_area = by_area.get(area_slug, [])
        if not props_in_area and area_slug not in areas_by_slug:
            continue
        scraped_area = areas_by_slug.get(area_slug)
        apartments.append(
            {
                "location_id": area_slug,
                "title": label,
                "subtitle": f"Temer Properties — {label}",
                "description": _area_description(scraped_area, label),
                "video_url": None,
                "cards": build_location_cards(area_slug, props_in_area, kind="apartment"),
                "is_public": True,
                "cover_image_url": (scraped_area or {}).get("images", [None])[0],
            }
        )

    shops: list[dict[str, Any]] = []
    for area_slug, props_in_area in shop_by_area.items():
        label = AREA_LABELS.get(area_slug, area_slug.replace("-", " ").title())
        shops.append(
            {
                "location_id": area_slug,
                "title": f"{label} — Shops",
                "subtitle": "Temer commercial units",
                "description": _area_description(areas_by_slug.get(area_slug), label),
                "video_url": None,
                "cards": build_location_cards(area_slug, props_in_area, kind="shop"),
                "is_public": True,
                "cover_image_url": (props_in_area[0].get("images") or [None])[0],
            }
        )

    return {"apartments": apartments, "shops": shops}
