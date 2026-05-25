# Belay Properties Backend

Backend workspace for the FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT authentication, pricing engine, payment plan, commission, contract, lead, and admin APIs.

## Local Development

Copy the environment template before running locally:

```bash
cp .env.example .env
```

From the repository root, start PostgreSQL and the API with Docker Compose:

```bash
docker compose up --build
```

Health endpoints:

- `GET /health`
- `GET /api/v1/health`
- `GET /api/v1/health/db`

Swagger docs:

- `GET /docs`

Alembic is configured in `alembic.ini` and reads the database URL from environment settings.

## First admin user

There is no default login. After migrations have run (so the `admin` role exists), create an admin:

**With Docker Compose** (from repo root, database up). Either form works; `python -m` is handy before you next rebuild the API image:

```bash
docker compose run --rm api python -m app.scripts.create_admin \
  --email admin@example.com \
  --password 'choose-a-strong-password' \
  --full-name 'Local Admin'
```

After `docker compose build api`, the console entry point is also available:

```bash
docker compose run --rm api belay-create-admin \
  --email admin@example.com \
  --password 'choose-a-strong-password'
```

**On the host** (from `backend/` with `.env` pointing at Postgres and venv active):

```bash
cd backend
.venv/bin/belay-create-admin --email admin@example.com --password 'choose-a-strong-password'
```

If the email already exists, the password is reset and the `admin` role is ensured. Use the same email and password in the React admin login page.

## Demo data (UI route testing)

Loads **Ayat Real Estate** and **Sunshine Developers** with projects, blocks, unit types, units, and public listings (plus one sold + one draft case for filter/visibility checks).

```bash
# From repo root (re-seed from scratch)
docker compose run --rm api python -m app.scripts.seed_demo_data --reset

# Or without deleting first (upsert by slug)
docker compose run --rm api python -m app.scripts.seed_demo_data
```

### API surface (Phases 5–9)

See `http://localhost:8000/docs`. Highlights:

- **Inventory:** `/admin/companies`, `projects`, `blocks`, `unit-types`, `units`, `listings`
- **Public:** `/public/listings`, `/public/listings/{slug}/price-preview`, `POST /public/leads`
- **Pricing:** `/admin/pricing-*`, `POST /admin/quotes/generate`
- **Payments:** `/admin/payment-plans`
- **Commission:** `/admin/commission-schemes`, `sales-channels`, `agent-contracts`
- **Leads/contracts:** `/admin/leads`, `reservations`, `contracts`

After seeding, open the UI:

- Public: `http://localhost:5173/listings` — try filters `area=Ayat`, `bedrooms=3`, `company_slug=sunshine-developers`
- Detail examples: `/listings/ayat-hills-3br-floor-5`, `/listings/cmc-extension-2br-floor-2`
- Admin: create inventory or use printed `company_id` / `project_id` query links in the seed output
