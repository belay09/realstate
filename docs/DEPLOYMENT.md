# Phases 13–14 — AWS EC2 + Cloudflare DNS

> **New AWS account?** Start with the step-by-step walkthrough: **[AWS_FIRST_DEPLOY.md](./AWS_FIRST_DEPLOY.md)** (EC2 launch, SSH, IP test, then Cloudflare).

## Overview

| Service | Role |
|---------|------|
| **EC2** | Ubuntu host running Docker Compose |
| **db** | PostgreSQL (not exposed publicly) |
| **api** | FastAPI (`Dockerfile.prod`) |
| **web** | Nginx serving Vite build |
| **caddy** | Reverse proxy + HTTPS for site + API subdomains |

Replace `realtor.belay-sirak.com` and `api.realtor.belay-sirak.com` with your real Cloudflare zone names.

## 1. EC2 instance

- Ubuntu 24.04 LTS (or 22.04)
- Type: `t3.small` or larger for MVP
- Disk: ≥ 30 GB
- Security group:
  - **22** — SSH, your IP only if possible
  - **80**, **443** — public (Caddy)
  - Do **not** open **5432**

## 2. Server bootstrap

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER
# log out and back in

git clone git@github.com:belay09/realstate.git
cd realstate
```

## 3. Configure secrets on the server

```bash
cp .env.production.example .env
cp backend/.env.production.example backend/.env.production
# Edit .env: POSTGRES_PASSWORD, SITE_DOMAIN, API_DOMAIN, VITE_API_BASE_URL
# Edit backend/.env.production: JWT_SECRET_KEY, BACKEND_CORS_ORIGINS (production URLs only)
```

Generate a strong JWT secret:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

## 4. Start the stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
./scripts/deploy-migrate.sh
docker compose -f docker-compose.prod.yml exec api python -m app.scripts.create_admin
# optional demo data (not for production): seed_demo_data
```

Check locally on the server:

```bash
curl -s http://localhost/api/v1/health
curl -sI http://localhost/
```

## 5. Cloudflare DNS

In your zone (e.g. `belay-sirak.com`):

| Name | Type | Content | Proxy |
|------|------|---------|-------|
| `realtor` | A | EC2 public IPv4 | Proxied (orange cloud) |
| `api.realtor` | A | EC2 public IPv4 | Proxied |

**SSL/TLS:** start with **Full** (Cloudflare → origin HTTPS via Caddy) or **Flexible** (HTTP to origin on port 80 only) for a quick test.

**CORS:** `BACKEND_CORS_ORIGINS` must list the exact public site origin, e.g. `https://realtor.belay-sirak.com`.

## 6. Backups

```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

Schedule with cron (daily example):

```cron
0 3 * * * cd /home/ubuntu/realstate && ./scripts/backup-db.sh /var/backups/belay
```

## 7. Updates

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
./scripts/deploy-migrate.sh
```

## Frontend on Vercel (alternative)

Build with `VITE_API_BASE_URL=https://api.realtor.<domain>/api/v1` and host static files on Vercel. Point only `api.realtor` to EC2 and drop the `web` + site block from Caddy, or proxy `realtor` to Vercel via Cloudflare CNAME.

## Troubleshooting

- **CORS errors:** production `DEBUG=false` disables localhost regex; set `BACKEND_CORS_ORIGINS` correctly.
- **502 on API:** `docker compose -f docker-compose.prod.yml logs api`
- **Migrations:** run `./scripts/deploy-migrate.sh` after every deploy with schema changes.
