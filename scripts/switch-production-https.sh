#!/usr/bin/env bash
# Run on EC2 in ~/realstate after Cloudflare DNS A records point to this server.
# Usage: ./scripts/switch-production-https.sh realtor.belay-sirak.com api.realtor.belay-sirak.com
set -euo pipefail

SITE_DOMAIN="${1:?Usage: $0 SITE_DOMAIN API_DOMAIN (e.g. realtor.belay-sirak.com api.realtor.belay-sirak.com)}"
API_DOMAIN="${2:?Missing API_DOMAIN}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export SITE_DOMAIN API_DOMAIN
export VITE_API_BASE_URL="https://${SITE_DOMAIN}/api/v1"
export CADDYFILE="${CADDYFILE:-Caddyfile.cloudflare}"

POSTGRES_DB=belay_properties
POSTGRES_USER=belay
POSTGRES_PASSWORD=""
if [ -f .env ]; then
  POSTGRES_DB=$(grep -E '^POSTGRES_DB=' .env | cut -d= -f2- || echo belay_properties)
  POSTGRES_USER=$(grep -E '^POSTGRES_USER=' .env | cut -d= -f2- || echo belay)
  POSTGRES_PASSWORD=$(grep -E '^POSTGRES_PASSWORD=' .env | cut -d= -f2- || true)
fi
if [ -z "$POSTGRES_PASSWORD" ]; then
  echo "Error: POSTGRES_PASSWORD missing in .env" >&2
  exit 1
fi

JWT_SECRET_KEY=""
if [ -f backend/.env.production ]; then
  JWT_SECRET_KEY=$(grep -E '^JWT_SECRET_KEY=' backend/.env.production | cut -d= -f2- || true)
fi
if [ -z "$JWT_SECRET_KEY" ]; then
  JWT_SECRET_KEY="CHANGE_ME"
fi

cat > .env <<ENV
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
SITE_DOMAIN=${SITE_DOMAIN}
API_DOMAIN=${API_DOMAIN}
VITE_API_BASE_URL=${VITE_API_BASE_URL}
CADDYFILE=${CADDYFILE}
ENV

cat > backend/.env.production <<BENV
APP_NAME=Belay Properties API
APP_ENV=production
DEBUG=false
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=https://${SITE_DOMAIN}
DATABASE_URL=postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
DEFAULT_CURRENCY=ETB
QUOTE_EXPIRY_DAYS=7
MAX_UPLOAD_SIZE_MB=5
ENABLE_OCR_IMPORT=false
BENV

echo "==> Stopping IP-test stack (ports 8000/8080)..."
sudo docker compose -f docker-compose.prod.yml -f docker-compose.prod.ip.yml down 2>/dev/null || true

echo "==> Building and starting HTTPS stack..."
echo "    Site + API: https://${SITE_DOMAIN}  (API at /api/v1)"
echo "    Note: api.realtor.* needs Cloudflare Total TLS; using same-domain API instead."
sudo -E docker compose -f docker-compose.prod.yml build --no-cache web
sudo -E docker compose -f docker-compose.prod.yml up -d --force-recreate caddy api web

echo "==> Waiting for services..."
sleep 8
curl -sf -H "Host: ${API_DOMAIN}" http://127.0.0.1/api/v1/health || true

echo ""
echo "Done. In Cloudflare:"
echo "  1. A record: realtor -> EC2 IP (proxied)"
echo "  2. SSL/TLS -> Full (or Flexible)"
echo "  3. Always Use HTTPS -> On"
echo ""
echo "Then open:"
echo "  https://${SITE_DOMAIN}"
echo "  https://${SITE_DOMAIN}/admin/login"
echo "  https://${SITE_DOMAIN}/api/v1/health"
