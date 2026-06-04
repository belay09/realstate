"""Which Ayat apartment/shop locations are visible on the public site."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.inventory import LocationContent


def load_location_visibility_maps(db: Session) -> dict[str, dict[str, bool]]:
    """Map kind -> location_id -> is_active (from LocationContent.is_public)."""
    rows = db.query(
        LocationContent.kind,
        LocationContent.location_id,
        LocationContent.is_public,
    ).all()
    out: dict[str, dict[str, bool]] = {"apartment": {}, "shop": {}}
    for kind, location_id, is_public in rows:
        if kind in out:
            out[kind][location_id] = is_public
    return out


def is_location_active(
    visibility: dict[str, dict[str, bool]],
    kind: str,
    location_id: str,
) -> bool:
    """Locations without CMS rows stay visible until admin configures them."""
    kind_map = visibility.get(kind, {})
    if location_id not in kind_map:
        return True
    return kind_map[location_id]


def filter_calculator_config_by_visibility(
    config: dict[str, Any],
    visibility: dict[str, dict[str, bool]],
) -> dict[str, Any]:
    apartment_map = visibility.get("apartment", {})
    shop_map = visibility.get("shop", {})

    projects = [
        p
        for p in config.get("residential_projects", [])
        if is_location_active({"apartment": apartment_map}, "apartment", p["id"])
    ]
    zones = [
        z
        for z in config.get("commercial_zones", [])
        if is_location_active({"shop": shop_map}, "shop", z["id"])
    ]
    active_project_ids = {p["id"] for p in projects}
    price_project_ids = set(active_project_ids)
    inv_map = config.get("inventory_to_strategy_location") or {}
    for inv_slug, strategy_id in inv_map.items():
        if is_location_active({"apartment": apartment_map}, "apartment", inv_slug):
            price_project_ids.add(inv_slug)
            if strategy_id:
                price_project_ids.add(strategy_id)
    if is_location_active({"apartment": apartment_map}, "apartment", "cmc-extension"):
        price_project_ids.update(
            {"cmc-extension", "cmc-unstarted", "cmc-near-completion"},
        )

    filtered = dict(config)
    filtered["residential_projects"] = projects
    filtered["commercial_zones"] = zones
    if "residential_price_rows" in filtered:
        filtered["residential_price_rows"] = [
            row
            for row in filtered["residential_price_rows"]
            if (row.get("projectId") or row.get("project_id")) in price_project_ids
        ]
    return filtered
