# GitHub Actions: CI + automatic deploy

## What runs automatically

| Workflow | When | What it does |
|----------|------|----------------|
| **CI** (`.github/workflows/ci.yml`) | Push/PR to `main` or `develop` | Ruff, migrations, pytest, frontend build |
| **Deploy** (`.github/workflows/deploy.yml`) | After **CI succeeds** on a **push to `main`**, or manual **Run workflow** | SSH to EC2 → `git pull` → rebuild `api` + `web` → migrations |

A green CI badge does **not** update the site by itself until **Deploy** also succeeds.

---

## One-time server setup (EC2)

1. Clone the repo (if not already):

```bash
cd ~
git clone git@github.com:belay09/realstate.git
cd realstate
```

2. **Deploy key** so the server can `git pull` from GitHub:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

In GitHub: **Repository → Settings → Deploy keys → Add deploy key**  
Paste the public key, read-only is enough.

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config ~/.ssh/github_deploy
ssh -T git@github.com
```

3. Production env files (once):

```bash
cp .env.production.example .env
cp backend/.env.production.example backend/.env.production
# Edit both with real passwords, domains, JWT, CORS
```

For same-domain API (recommended with Cloudflare Free):

```env
VITE_API_BASE_URL=https://realtor.belay-sirak.com/api/v1
```

4. First manual start:

```bash
docker compose -f docker-compose.prod.yml up -d --build
./scripts/deploy-migrate.sh
```

5. Ensure your EC2 user can run Docker **without sudo** (typical after `usermod -aG docker $USER` and re-login).

---

## GitHub repository secrets

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Example | Required |
|--------|---------|----------|
| `EC2_HOST` | `13.51.237.118` or your Elastic IP | Yes |
| `EC2_USER` | `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu) | Yes |
| `EC2_SSH_KEY` | Full private key PEM (contents of `.pem` file) | Yes |
| `EC2_PORT` | `22` | No (defaults to 22 if empty) |
| `EC2_APP_PATH` | `/home/ec2-user/realstate` | No (defaults to `/home/<EC2_USER>/realstate`) |

### `EC2_SSH_KEY`

Paste the entire file, including:

```
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

### Optional: `production` environment

The deploy job uses `environment: production`. You can add approval rules under **Settings → Environments → production** if you want a manual approve step before each deploy.

---

## Manual deploy

On the server:

```bash
cd ~/realstate
./scripts/deploy-production.sh
```

Or in GitHub: **Actions → Deploy → Run workflow**.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Deploy skipped | CI failed, or push was not to `main` |
| `git pull` / permission denied | Fix deploy key on EC2 (see above) |
| `Missing .env` | Create `.env` and `backend/.env.production` on server |
| Old UI after deploy | Check Deploy workflow logs; hard-refresh browser (Ctrl+Shift+R) |
| Build slow / timeout | First build can take 15–20 min on `t3.small`; workflow allows 45 min |

---

## Security notes

- Do not commit `.env`, `backend/.env.production`, or SSH private keys.
- Restrict EC2 security group SSH (port 22) to your IP when possible.
- GitHub Actions only needs SSH access to the server; it does not need your database password in secrets if `.env` already exists on EC2.
