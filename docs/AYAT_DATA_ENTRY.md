# Ayat Share Company — data entry guide

## Official pricing (Ayat/116/2018)

**Source of truth:** `backend/data/ayat_official_2018.json` (from company strategy scans — not sample data). After edits, sync to the frontend copy used in production builds:

```bash
cp backend/data/ayat_official_2018.json frontend/src/data/ayat_official_2018.json
```

Includes Section 2 sizes, Section 3 locations, Section 6 discounts/commissions, Section 7 group tiers, Section 10 apartment per m² table, Section 11 shop per m² table, and Section 13 milestones. The calculator reads this file on the frontend; the seed script loads pricing and commission from it into PostgreSQL.

Re-seed after any edit:

```bash
docker compose exec api python -m app.scripts.seed_ayat_production
```

---

Production Ayat **inventory** (listings, units, projects) is in `backend/data/ayat_production.json` so you can edit offline, re-run the seed, and keep the database in sync without clicking through dozens of admin forms.

## Quick start (production server)

`scripts/deploy-production.sh` runs the seed automatically after migrations. Manual run:

```bash
cd ~/realstate
docker compose -f docker-compose.prod.yml exec -T api python -m app.scripts.seed_ayat_production
```

You do **not** need to drop or recreate the database — the seed upserts projects, units, and listings in place.

Local dev:

```bash
docker compose run --rm api python -m app.scripts.seed_ayat_production
```

## What gets loaded

| Data | Source |
|------|--------|
| Company | Ayat Share Company (`ayat-real-estate`) |
| Projects | Ayat Hills, CMC Residential (CCE) |
| Unit types | SFCA, SFCR, RFCA, RFCR (Ayat finish/category codes) |
| Units + public listings | 5 available units with images |
| Pricing version | `Ayat official strategy (Ayat/116/2018)` (published) |
| Payment plans | Full payment, 60/40 residential |
| Commission scheme | Default + agent rules |

The seed **removes** the demo `sunshine-developers` company and **archives** older published Ayat pricing versions (sets `effective_to` to the day before the new version).

## Edit prices (recommended workflow)

1. Open **`backend/data/ayat_production.json`** in your editor.
2. Update `pricing.price_rows` with values from the **latest official Ayat price list** (reference number + effective date on the PDF).
3. Adjust `pricing.effective_from` and `pricing.version_name` when Ayat publishes a new table (e.g. `Q2 2026`).
4. Re-run the seed on the server (see above).

### Price row fields

```json
{
  "project_slug": "cmc-residential",
  "unit_type_code": "SFCA",
  "finish_type": "semi-finished",
  "floor_band": "5-8",
  "price_per_sqm": "178000"
}
```

- **Per sqm, VAT included** — matches Ayat document format.
- **Floor bands** — Ayat prices often **decrease on higher floors**; use bands like `1-4`, `5-8`, `9-12`, `13-17`.
- **Unit type codes** — from Ayat tables: `SFCA`, `SFCR`, `RFCA`, `RFCR` (semi-finished vs regular finished).

### Important

Numbers in the JSON are **starting estimates** (CMC benchmark ~173k ETB/sqm from public listings). **Do not treat them as contractual** until you copy exact rows from Ayat’s official document.

## Add inventory via admin UI (alternative)

After the seed runs, use **Admin** at `https://realtor.belay-sirak.com/admin`:

1. **Companies** — confirm Ayat Share Company.
2. **Projects / Blocks / Unit types / Units** — add new stock.
3. **Listings** — attach a unit, set public, add image URLs.
4. **Pricing** — create draft version → add rows → publish.

The JSON seed is faster for bulk price tables; the admin UI is better for one-off units.

## Verify after seeding

```bash
# Public listings (Ayat only)
curl -s "https://realtor.belay-sirak.com/api/v1/public/listings?company_slug=ayat-real-estate&area=Ayat"

# Price preview for a listing
curl -s "https://realtor.belay-sirak.com/api/v1/public/listings/ayat-hills-3br-semi-finished-block-a/price-preview"
```

In the browser:

- `https://realtor.belay-sirak.com/listings?area=Ayat&bedrooms=3`
- Open a detail page → price range + payment plan preview
- Admin → **Pricing** → confirm published version and row count

## When Ayat publishes new prices

1. Duplicate the pricing section in JSON with a new `version_name` and `effective_from`.
2. Set `archive_previous_versions: true` (default in file).
3. Delete or rename the old version name in JSON if re-running would skip (script skips if version name already exists).
4. For a **full replace**, archive old version in admin or delete draft duplicates, then run seed with a new version name.

## Official document checklist

Before going live with real buyers, confirm from Ayat PDF/photos:

- [ ] Document reference number and validity window
- [ ] Every floor band × unit type row matches the PDF
- [ ] VAT included flag matches the document
- [ ] 60/40 plan applies only to residential (not shops)
- [ ] Upfront and group discount tiers match current Ayat tables
