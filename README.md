# Belay Properties

Belay Properties is a modern Ethiopian real estate platform for aggregating verified properties from real estate companies, starting with Ayat Real Estate and expanding to other companies over time.

The system is designed for:

- Public property discovery.
- Admin-managed listings and unit inventory.
- Multi-company real estate data.
- Dynamic pricing versions, payment plans, commissions, quotes, and contracts.
- AWS EC2 deployment with Docker.
- GitHub-based source control.
- Cloudflare DNS using a dedicated real estate subdomain.

## Project Structure

```text
realstate/
  backend/
  frontend/
  docs/
```

## Documentation

Start with:

- `docs/BELAY_PROPERTIES_IMPLEMENTATION_PLAN.md`

## Current phase

- **Phases 1–11:** Backend APIs + React public/admin UI (listings, pricing, payments, quotes, leads, contracts).
- **Phases 12–15 (in repo):** GitHub Actions CI, production Docker Compose + Caddy, deploy/backup scripts, `docs/GITHUB_SETUP.md`, `docs/DEPLOYMENT.md`.
- **Your next actions:** push to GitHub (Phase 12), provision EC2 + Cloudflare (Phases 13–14), run production checklists in the plan.

## Quick start (local)

```bash
docker compose up --build
docker compose run --rm api alembic upgrade head
docker compose run --rm api python -m app.scripts.seed_demo_data
docker compose run --rm api python -m app.scripts.create_admin
cd frontend && cp .env.example .env && npm install && npm run dev
```

- API: http://localhost:8000/docs
- Frontend: http://localhost:5173 (or 5174)
- Admin: `/admin/login` — see `backend/README.md` for demo credentials after `create_admin`

## Deploy (production)

1. **[docs/AWS_FIRST_DEPLOY.md](docs/AWS_FIRST_DEPLOY.md)** — new AWS account, EC2, SSH, first run on public IP
2. **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — compose, Cloudflare, backups
3. `docker-compose.prod.yml` + `docker-compose.prod.ip.yml` (IP test before DNS)

## GitHub

See `docs/GITHUB_SETUP.md` and `.github/workflows/ci.yml`.
ssh -i ~/realstate/realstateKey.pem ec2-user@13.51.237.118 \
  'cd ~/realstate && ./scripts/deploy-production.sh'