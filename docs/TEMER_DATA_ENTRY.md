# Temer Properties — data entry (simple)

## Seed pilot inventory

```bash
docker compose run --rm api python -m app.scripts.seed_temer_production
```

Production:

```bash
docker compose -f docker-compose.prod.yml exec -T api python -m app.scripts.seed_temer_production
```

**Source file:** `backend/data/temer_production.json` (6 listings: Sarbet City Plus, Blue Point, Aware).

Re-run after edits — upserts in place.

## Verify

```bash
curl -s "http://localhost:8000/api/v1/public/listings?company_slug=temer-properties" | head
```

Public URLs examples:

- `/apartments?company_slug=temer-properties`
- `/listings/temer-sarbet-city-plus-1br`

## Add more homes

1. Copy a block from `temer_scraped.json` or Temer’s site.
2. Add `project` (if new), `unit`, and `listing` to `temer_production.json`.
3. Re-run the seed script.

No pricing seed — listings show “price on request” on Belay.
