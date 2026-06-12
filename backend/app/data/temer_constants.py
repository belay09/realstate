"""Temer-only location ids — never overlap Ayat Share Company slugs."""

TEMER_COMPANY_SLUG = "temer-properties"
AYAT_COMPANY_SLUG = "ayat-real-estate"

TEMER_AREA_LOCATION_IDS = frozenset(
    {
        "sarbet",
        "aware-area",
        "ayat-area",
        "gelan-area",
        "garment-area",
        "piyassa-area",
    }
)
