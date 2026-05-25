#!/usr/bin/env bash
# Run Alembic migrations on the production API container.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker compose -f docker-compose.prod.yml exec api alembic upgrade head
echo "Migrations applied."
