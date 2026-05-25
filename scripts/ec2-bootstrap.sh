#!/usr/bin/env bash
# Run ONCE on a fresh Ubuntu EC2 instance (as ubuntu user, after SSH).
# Installs Docker, clones the repo, copies env templates.
set -euo pipefail

REPO_URL="${REPO_URL:-git@github.com:belay09/realstate.git}"
INSTALL_DIR="${INSTALL_DIR:-$HOME/realstate}"

echo "==> Installing Docker..."
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y docker.io git curl
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y docker git curl
  sudo mkdir -p /usr/local/lib/docker/cli-plugins
  if ! sudo test -x /usr/local/lib/docker/cli-plugins/docker-compose; then
    sudo curl -fsSL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
  fi
else
  echo "Unsupported OS — install Docker manually." >&2
  exit 1
fi
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

echo "==> Cloning repository..."
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "Already cloned at $INSTALL_DIR — git pull"
  git -C "$INSTALL_DIR" pull
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"
chmod +x scripts/*.sh 2>/dev/null || true

if [ ! -f .env ]; then
  cp .env.production.example .env
  echo "Created .env — EDIT before starting production stack."
fi
if [ ! -f backend/.env.production ]; then
  cp backend/.env.production.example backend/.env.production
  echo "Created backend/.env.production — EDIT JWT and CORS."
fi

echo ""
echo "Done. Next on this server:"
echo "  1. nano .env                    # POSTGRES_PASSWORD, SITE_DOMAIN, API_DOMAIN, VITE_API_BASE_URL"
echo "  2. nano backend/.env.production # JWT_SECRET_KEY, BACKEND_CORS_ORIGINS"
echo "  3. newgrp docker                # or log out/in so docker group applies"
echo "  4. docker compose -f docker-compose.prod.yml up -d --build"
echo "  5. ./scripts/deploy-migrate.sh"
echo "  6. docker compose -f docker-compose.prod.yml exec api python -m app.scripts.create_admin"
echo ""
echo "IP-only test (before DNS): docker compose -f docker-compose.prod.yml -f docker-compose.prod.ip.yml up -d --build"
