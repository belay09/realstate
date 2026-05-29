"""Helpers to build listing_metadata for Temer seeds from scrape fields."""

from __future__ import annotations

AREA_MAP_COORDS: dict[str, tuple[float, float]] = {
    "Sarbet": (8.9905, 38.7625),
    "Aware": (8.9778, 38.7878),
    "Gelan": (8.9772, 38.8056),
    "Piyassa": (9.0307, 38.7528),
    "Ayat": (9.0122, 38.8464),
    "Garment": (9.0030, 38.7480),
}

DEFAULT_APARTMENT_FEATURES = {
    "interior": ["Equipped Kitchen", "Fireplace", "Laundry"],
    "outdoor": ["Back yard", "Garage Attached", "Water"],
    "utilities": ["Central Air", "Electricity"],
    "other": ["Elevator", "WiFi"],
}

DEFAULT_COMMERCIAL_FEATURES = {
    "interior": ["Modern retail layout", "Flexible floor plate"],
    "outdoor": ["Street frontage", "Customer parking"],
    "utilities": ["Electricity", "Water"],
    "other": ["Elevator", "Security"],
}


def build_metadata(
    *,
    property_kind: str,
    area: str,
    title: str,
    details: dict[str, str] | None = None,
    external_property_id: str | None = None,
    features: dict[str, list[str]] | None = None,
    map_point: dict | None = None,
) -> dict:
    lat, lng = AREA_MAP_COORDS.get(area, (9.0100, 38.7800))
    feat = features or (
        DEFAULT_COMMERCIAL_FEATURES if property_kind == "commercial" else DEFAULT_APARTMENT_FEATURES
    )
    specs = {k: v for k, v in (details or {}).items() if v and str(v).strip()}
    if map_point and map_point.get("latitude") is not None:
        map_meta = {
            "latitude": float(map_point["latitude"]),
            "longitude": float(map_point["longitude"]),
            "label": map_point.get("label") or title,
        }
    else:
        map_meta = {"latitude": lat, "longitude": lng, "label": title}
    return {
        "property_kind": property_kind,
        "external_property_id": external_property_id,
        "specs": specs,
        "features": feat,
        "map": map_meta,
    }
