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

echo "==> Building api and web (uses VITE_API_BASE_URL from .env)..."
"${COMPOSE[@]}" build api web

echo "==> Starting stack..."
"${COMPOSE[@]}" up -d

echo "==> Running database migrations..."
./scripts/deploy-migrate.sh

echo "==> Removing dangling images..."
docker image prune -f

echo "==> Container status:"
"${COMPOSE[@]}" ps

echo "Deploy finished successfully."
