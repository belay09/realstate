# First deploy on a new AWS account (walkthrough)

You already pushed the code to **GitHub** (`belay09/realstate`). This guide launches **one EC2 server** and runs Belay Properties there. Do DNS (Cloudflare) after the app works on the server IP.

**Time:** about 30–45 minutes the first time.

---

## Part A — AWS Console (new account)

### 1. Sign in and region

1. Open [AWS Console](https://console.aws.amazon.com/) and sign in.
2. Top-right: pick a region close to you (e.g. **Europe (Stockholm) `eu-north-1`** or **Africa Cape Town** if available). Stay in one region for everything below.

### 2. Create a key pair (for SSH)

1. **EC2** → left menu **Key pairs** → **Create key pair**.
2. Name: `belay-realtor-key`
3. Type: **RSA**, format: **`.pem`**
4. **Create** → download the `.pem` file → store it safely (e.g. `~/Downloads/belay-realtor-key.pem`).
5. On your laptop:

```bash
chmod 400 ~/Downloads/belay-realtor-key.pem
```

### 3. Security group (firewall)

1. **EC2** → **Security groups** → **Create security group**.
2. Name: `belay-realtor-sg`
3. **Inbound rules** (add these):

| Type | Port | Source | Notes |
|------|------|--------|--------|
| SSH | 22 | **My IP** | Console has “My IP” button |
| HTTP | 80 | 0.0.0.0/0 | For Caddy / public site later |
| HTTPS | 443 | 0.0.0.0/0 | For Caddy TLS later |
| Custom TCP | 8000 | 0.0.0.0/0 | Optional: API test before DNS |
| Custom TCP | 8080 | 0.0.0.0/0 | Optional: frontend test before DNS |

4. **Outbound:** leave default (all traffic).
5. **Create security group**.

> Do **not** open port **5432** (Postgres stays inside Docker only).

### 4. Launch EC2 instance

1. **EC2** → **Instances** → **Launch instances**.
2. **Name:** `belay-realtor-prod`
3. **AMI:** **Ubuntu Server 24.04 LTS** (free tier eligible).
4. **Instance type:** `t3.small` (recommended) or `t3.micro` (tighter, OK for demo).
5. **Key pair:** `belay-realtor-key`.
6. **Network:** default VPC is fine.
7. **Security group:** select existing → `belay-realtor-sg`.
8. **Storage:** 30 GB gp3.
9. **Launch instance**.
10. Wait until **Instance state** = **Running**.
11. Copy **Public IPv4 address** (e.g. `3.120.45.67`) — you need it everywhere below.

### 5. Elastic IP (optional but recommended)

IPs change if you stop/start the instance without Elastic IP.

1. **EC2** → **Elastic IPs** → **Allocate** → **Allocate**.
2. **Actions** → **Associate** → choose `belay-realtor-prod` → **Associate**.

Use this IP as your server address from now on.

---

## Part B — SSH into the server

From your laptop (replace IP and key path):

```bash
# Ubuntu AMI:
ssh -i ~/realstate/realstateKey.pem ubuntu@YOUR_EC2_PUBLIC_IP

# Amazon Linux 2023 (common on new AWS accounts):
ssh -i ~/realstate/realstateKey.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

First time: type `yes` for host key fingerprint.

You should see a prompt like `ubuntu@...` or `ec2-user@...`.

---

## Part C — Install app on the server

### Option 1 — HTTPS clone (if GitHub SSH keys are set on EC2)

```bash
curl -fsSL https://raw.githubusercontent.com/belay09/realstate/main/scripts/ec2-bootstrap.sh -o bootstrap.sh
# Or after clone:
bash scripts/ec2-bootstrap.sh
```

### Option 2 — HTTPS clone (easiest on new EC2)

```bash
git clone https://github.com/belay09/realstate.git
cd realstate
chmod +x scripts/*.sh
bash scripts/ec2-bootstrap.sh
```

If bootstrap says “log out for docker group”:

```bash
newgrp docker
cd ~/realstate
```

---

## Part D — Configure secrets

### 1. Root `.env` (compose)

```bash
cd ~/realstate
nano .env
```

Set at minimum:

```env
POSTGRES_PASSWORD=paste-a-long-random-password-here
POSTGRES_DB=belay_properties
POSTGRES_USER=belay

# Until Cloudflare DNS exists, use your EC2 IP for a first test:
SITE_DOMAIN=realtor.example.com
API_DOMAIN=api.realtor.example.com
VITE_API_BASE_URL=http://YOUR_EC2_PUBLIC_IP:8000/api/v1
```

Save (`Ctrl+O`, Enter, `Ctrl+X`).

### 2. Backend `.env.production`

```bash
nano backend/.env.production
```

```env
APP_ENV=production
DEBUG=false
JWT_SECRET_KEY=paste-output-of-python3-secrets-below
BACKEND_CORS_ORIGINS=http://YOUR_EC2_PUBLIC_IP:8080
```

Generate JWT secret on the server:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Paste into `JWT_SECRET_KEY`.

> When you add a real domain, change `BACKEND_CORS_ORIGINS` to `https://realtor.yourdomain.com` and rebuild the frontend with the correct `VITE_API_BASE_URL`.

---

## Part E — Start (IP test first, no domain)

```bash
cd ~/realstate
export VITE_API_BASE_URL=http://YOUR_EC2_PUBLIC_IP:8000/api/v1
docker compose -f docker-compose.prod.yml -f docker-compose.prod.ip.yml up -d --build
```

First build takes **10–20 minutes** on a small instance.

Then:

```bash
./scripts/deploy-migrate.sh
docker compose -f docker-compose.prod.yml -f docker-compose.prod.ip.yml exec api python -m app.scripts.create_admin
```

Follow prompts for admin email/password (use a strong password).

### Check from your laptop browser

| URL | Expect |
|-----|--------|
| `http://YOUR_EC2_IP:8000/api/v1/health` | JSON `"status":"ok"` or similar |
| `http://YOUR_EC2_IP:8000/docs` | Swagger UI |
| `http://YOUR_EC2_IP:8080` | Belay Properties homepage |
| `http://YOUR_EC2_IP:8080/listings` | Listings (after seed) |

Optional demo data (dev only):

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.ip.yml exec api python -m app.scripts.seed_demo_data
```

---

## Part F — Production with domain (Cloudflare)

When `realtor.yourdomain.com` is ready:

1. Cloudflare **DNS** → A records → EC2 public IP (proxied orange cloud).
2. Update `.env`:

```env
SITE_DOMAIN=realtor.yourdomain.com
API_DOMAIN=api.realtor.yourdomain.com
VITE_API_BASE_URL=https://api.realtor.yourdomain.com/api/v1
```

3. Update `backend/.env.production`:

```env
BACKEND_CORS_ORIGINS=https://realtor.yourdomain.com
```

4. Rebuild and switch to full stack (with Caddy):

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.ip.yml down
docker compose -f docker-compose.prod.yml up -d --build
./scripts/deploy-migrate.sh
```

5. Browser: `https://realtor.yourdomain.com` and `https://api.realtor.yourdomain.com/api/v1/health`.

Cloudflare SSL: try **Flexible** first (HTTP to origin on port 80), then **Full** when Caddy certificates work.

---

## Part G — Daily commands

```bash
cd ~/realstate
git pull
docker compose -f docker-compose.prod.yml up -d --build
./scripts/deploy-migrate.sh
```

Backup:

```bash
./scripts/backup-db.sh
```

Logs:

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

---

## Checklist (tick when done)

- [ ] EC2 running, security group has 22 / 80 / 443 (and 8000+8080 for IP test)
- [ ] SSH works
- [ ] `docker compose` build finished without errors
- [ ] Migrations OK
- [ ] Admin user created
- [ ] Health URL works in browser
- [ ] Public site loads on `:8080` or HTTPS domain
- [ ] Cloudflare DNS (when ready)
- [ ] Strong passwords, no demo seed in real production

---

## If something fails

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.ip.yml ps
docker compose -f docker-compose.prod.yml -f docker-compose.prod.ip.yml logs api --tail 80
```

Common fixes:

- **Build OOM on t3.micro:** use `t3.small` or add 2 GB swap.
- **Cannot connect in browser:** security group missing 8000/8080.
- **CORS on site:** `BACKEND_CORS_ORIGINS` must match exact browser URL (including `http` vs `https` and port).
- **502 after DNS:** check `logs caddy` and that `SITE_DOMAIN` / `API_DOMAIN` match DNS names.

More detail: `docs/DEPLOYMENT.md`.
