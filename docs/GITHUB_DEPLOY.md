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
| `EC2_SSH_KEY` | **AWS EC2 `.pem` private key** (see below) | Yes |
| `EC2_SSH_PASSPHRASE` | Only if your `.pem` file is passphrase-protected | No |
| `EC2_APP_PATH` | `/home/ec2-user/realstate` | No (defaults to `/home/<EC2_USER>/realstate`) |

### `EC2_SSH_KEY` (this fixes most deploy failures)

Use the **same private key you use to SSH into the server from your laptop**, not the GitHub **deploy key** used for `git pull`.

That is usually the **`.pem` file you downloaded when you created the EC2 instance** (key pair in AWS).

1. On your laptop, confirm SSH works:

```bash
ssh -i /path/to/your-key.pem ec2-user@YOUR_EC2_IP
# or: ubuntu@YOUR_EC2_IP  on Ubuntu AMIs
```

2. Copy the **entire** `.pem` file into the `EC2_SSH_KEY` secret, including the first and last lines:

```
-----BEGIN RSA PRIVATE KEY-----
...all lines...
-----END RSA PRIVATE KEY-----
```

Or for newer keys:

```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

3. Common mistakes:
   - Pasting the **public** key (`.pub`) instead of the private `.pem`
   - Pasting the **GitHub deploy key** (`github_deploy`) instead of the **EC2 key pair**
   - Missing newlines (must be a multi-line secret, not one long line)
   - Wrong `EC2_USER` (`ec2-user` for Amazon Linux, `ubuntu` for Ubuntu)

4. If your `.pem` has a passphrase, add secret `EC2_SSH_PASSPHRASE` with that passphrase.

5. Re-run **Actions → Deploy → Run workflow** after fixing secrets.

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
| `unable to authenticate` / `publickey` | Use AWS `.pem` in `EC2_SSH_KEY`, correct `EC2_USER`, test `ssh -i key.pem user@host` locally first |
| `script_stop` warning | Fixed in workflow (removed invalid option) |
| Deploy skipped | CI failed, or push was not to `main` |
| `git pull` / permission denied | Fix **deploy key** on EC2 for GitHub (separate from EC2 `.pem`) |
| `Missing .env` | Create `.env` and `backend/.env.production` on server |
| Old UI after deploy | Check Deploy workflow logs; hard-refresh browser (Ctrl+Shift+R) |
| Build slow / timeout | First build can take 15–20 min on `t3.small`; workflow allows 45 min |

---

## Security notes

- Do not commit `.env`, `backend/.env.production`, or SSH private keys.
- Restrict EC2 security group SSH (port 22) to your IP when possible.
- GitHub Actions only needs SSH access to the server; it does not need your database password in secrets if `.env` already exists on EC2.
