#!/usr/bin/env bash
# Production deploy on EC2: pull latest main, rebuild, migrate.
# Used by GitHub Actions (SSH) and manual: ./scripts/deploy-production.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${DEPLOY_BRANCH:-main}"

echo "==> Deploying ${BRANCH} at $(pwd)"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Not a git repository. Clone the repo on the server first." >&2
  exit 1
fi

echo "==> Fetching origin/${BRANCH}..."
git fetch origin "$BRANCH"
git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" "origin/${BRANCH}"
if ! git pull --ff-only origin "$BRANCH"; then
  echo "==> Pull not fast-forward; resetting to origin/${BRANCH}"
  git reset --hard "origin/${BRANCH}"
fi

if [[ ! -f .env ]]; then
  echo "ERROR: Missing .env in repo root (copy from .env.production.example)." >&2
  exit 1
fi

if [[ ! -f backend/.env.production ]]; then
  echo "ERROR: Missing backend/.env.production" >&2
  exit 1
fi

COMPOSE=(docker compose -f docker-compose.prod.yml)

_free_docker_disk() {
  echo "==> Disk usage before Docker cleanup:"
  df -h / || true
  docker system df 2>/dev/null || true

  echo "==> Pruning Docker build cache and dangling images..."
  docker builder prune -f 2>/dev/null || true
  docker image prune -f 2>/dev/null || true
  docker container prune -f 2>/dev/null || true

  local avail_kb
  avail_kb="$(df --output=avail / | tail -1 | tr -d ' ')"
  if [ "${avail_kb:-0}" -lt 2097152 ]; then
    echo "==> Low disk (${avail_kb} KB free); pruning unused Docker images..."
    docker image prune -a -f 2>/dev/null || true
    docker builder prune -a -f 2>/dev/null || true
  fi

  echo "==> Disk usage after Docker cleanup:"
  df -h / || true
  docker system df 2>/dev/null || true

  avail_kb="$(df --output=avail / | tail -1 | tr -d ' ')"
  if [ "${avail_kb:-0}" -lt 524288 ]; then
    echo "ERROR: Less than 512 MB free on /. Free space on the EC2 volume before redeploying." >&2
    echo "  On the server: df -h && docker system df && sudo du -xh /var/lib/docker | sort -h | tail -20" >&2
    exit 1
  fi
}

_free_docker_disk

echo "==> Building api and web (uses VITE_API_BASE_URL from .env)..."
"${COMPOSE[@]}" build api web

echo "==> Starting stack..."
"${COMPOSE[@]}" up -d

echo "==> Running database migrations..."
./scripts/deploy-migrate.sh

echo "==> Seeding Ayat inventory and official pricing (idempotent)..."
"${COMPOSE[@]}" exec -T api python -m app.scripts.seed_ayat_production

echo "==> Removing unused Docker artifacts..."
docker image prune -f 2>/dev/null || true
docker builder prune -f 2>/dev/null || true

echo "==> Container status:"
"${COMPOSE[@]}" ps

echo "Deploy finished successfully."
