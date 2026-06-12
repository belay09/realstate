# Temer Properties — data entry (Ayat-style)

Temer inventory uses the same dashboard pattern as Ayat:

- **Apartment location pages** — one per area (`/apartments/sarbet`, `/apartments/aware-area`, …)
- **Shop location pages** — one per area with commercial units (`/shops/sarbet`, …)
- **Building blocks** — City Plus, Blue Point, etc. are blocks inside the area project
- **Listings** — public units linked to a location page via `location_kind` + `location_id`

**Source file:** `backend/data/temer_production.json`  
**Build from scrape:** `scripts/build_temer_production_from_scrape.py`  
**Seed script:** `backend/app/scripts/seed_temer_production.py`

## Pipeline

```bash
# 1. Scrape temerproperties.com (optional refresh)
python3 scripts/scrape_temer_properties.py

# 2. Build Ayat-style JSON (areas, location_content, listings)
python3 scripts/build_temer_production_from_scrape.py

# 3. Seed local database (NOT production until you confirm)
docker compose run --rm api python -m app.scripts.seed_temer_production
```

Production (when ready):

```bash
docker compose -f docker-compose.prod.yml exec -T api python -m app.scripts.seed_temer_production
```

Re-run after edits — upserts in place. Stale `temer-*` listings are hidden automatically.

## JSON structure

| Section | Purpose |
|---------|---------|
| `company` | Temer developer record |
| `location_content.apartments` | CMS for `/apartments/{location_id}` |
| `location_content.shops` | CMS for `/shops/{location_id}` |
| `projects` | Area projects with `blocks` (buildings) |
| `unit_types` | T1BR, T2BR, TSHOP, … |
| `units` | Inventory rows |
| `listings` | Public listings with images, specs, `location_kind`, `location_id` |

Apartment `location_id` = area slug (e.g. `sarbet`). Shop `location_id` = same area slug; inventory project slug = `shop-{area}`.

No pricing seed — listings show **price on request** on Belay.

## Verify locally

```bash
curl -s "http://localhost:8000/api/v1/public/listings?company_slug=temer-properties" | head
curl -s "http://localhost:8000/api/v1/public/location-content/apartment/summaries" | head
```

Public URLs:

- `/apartments?company_slug=temer-properties` — area cards (Sarbet, Aware, …)
- `/apartments/sarbet` — Sarbet location page + listings
- `/listings/temer-sarbet-city-plus-1br` — unit detail

## Manual edits

1. Edit `backend/data/temer_production.json` (or re-run build from updated scrape).
2. Adjust `location_content` cards, titles, cover images.
3. Re-run `seed_temer_production`.

To add a new area, add entries under `location_content`, `projects`, and listing rows with matching `location_id`.
