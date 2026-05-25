#!/usr/bin/env bash
# Backup PostgreSQL from the production compose stack.
# Usage: ./scripts/backup-db.sh [output_dir]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$ROOT/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT_DIR"

cd "$ROOT"
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "${POSTGRES_USER:-belay}" -d "${POSTGRES_DB:-belay_properties}" -Fc \
  >"$OUT_DIR/belay_properties_${STAMP}.dump"

echo "Wrote $OUT_DIR/belay_properties_${STAMP}.dump"
