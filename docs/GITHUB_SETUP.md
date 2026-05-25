# Phase 12 — GitHub workflow

Remote (from the implementation plan): `git@github.com:belay09/realstate.git`

## One-time setup

```bash
cd /path/to/realstate
git init   # skip if already initialized
git add .
git status   # confirm no .env or node_modules appear
git commit -m "Initial Belay Properties MVP: API, admin UI, public site, deploy assets"
git branch -M main
git remote add origin git@github.com:belay09/realstate.git
git push -u origin main
```

Create the empty repository on GitHub first if it does not exist (`belay09/realstate`).

## What must never be committed

- `backend/.env`, `backend/.env.production`
- `frontend/.env`, `frontend/.env.production`
- Root `.env` with `POSTGRES_PASSWORD` / secrets
- `postgres_data/`, `.venv/`, `node_modules/`, `frontend/dist/`

Example files (`*.env.example`, `*.env.production.example`) are safe to commit.

## CI

GitHub Actions runs on push/PR to `main` and `develop`:

- Backend: Ruff, Alembic migrate, pytest (with Postgres service)
- Frontend: `npm ci` + production build

See `.github/workflows/ci.yml`.

## Branching (optional)

- `main` — deployable
- `develop` — integration
- `feature/*` — larger changes
