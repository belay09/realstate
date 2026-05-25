# Cloudflare DNS + HTTPS (Belay Properties)

Server IP (EC2): use your current **Public IPv4** (e.g. `13.51.237.118`).

Default hostname:

| Hostname | Service |
|----------|---------|
| `realtor.belay-sirak.com` | Public site, `/admin`, and API at `/api/v1` |

**Do not use `api.realtor.belay-sirak.com` on Cloudflare Free** — Universal SSL only covers `*.belay-sirak.com`, not two-level names like `api.realtor.*` (causes `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`).

---

## 1. Cloudflare DNS records

**DNS** → **Records**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `realtor` | `YOUR_EC2_IP` | Proxied (orange) |

You may remove the `api.realtor` record if you added one earlier.

Wait 2–10 minutes for DNS to propagate.

Test:

```bash
dig +short realtor.belay-sirak.com
```

Should return Cloudflare IPs (if proxied) or your EC2 IP.

---

## 2. Cloudflare SSL/TLS

**SSL/TLS** → **Overview**:

1. Start with **Full** (recommended with Caddy on the server).
2. After the site loads on HTTPS, you can try **Full (strict)** if Caddy obtained a Let's Encrypt certificate.

**Edge Certificates** → enable **Always Use HTTPS**.

---

## 3. EC2 security group

Inbound rules:

| Port | Purpose |
|------|---------|
| 22 | SSH (My IP) |
| 80 | HTTP (Let's Encrypt + redirect) |
| 443 | HTTPS (Caddy) |

You can **remove** rules for **8000** and **8080** after HTTPS works (optional, tighter security).

---

## 4. Switch the server to HTTPS stack

SSH:

```bash
ssh -i ~/realstate/realstateKey.pem ec2-user@YOUR_EC2_IP
cd ~/realstate
git pull
chmod +x scripts/switch-production-https.sh
./scripts/switch-production-https.sh realtor.belay-sirak.com api.realtor.belay-sirak.com
```

Use **your** site and API hostnames if different.

---

## 5. Verify

- https://realtor.belay-sirak.com  
- https://realtor.belay-sirak.com/listings  
- https://realtor.belay-sirak.com/admin/login  
- https://api.realtor.belay-sirak.com/api/v1/health  

If the site loads but API calls fail: check browser console for CORS — `BACKEND_CORS_ORIGINS` must be exactly `https://realtor.belay-sirak.com` (no trailing slash).

---

## 6. Troubleshooting

```bash
sudo docker compose -f docker-compose.prod.yml logs caddy --tail 50
sudo docker compose -f docker-compose.prod.yml logs api --tail 30
```

| Symptom | Fix |
|---------|-----|
| 522 / timeout | Security group missing 80/443; instance stopped |
| Certificate error | Set Cloudflare SSL to **Full** temporarily |
| CORS error | Re-run switch script; rebuild ensures `VITE_API_BASE_URL` matches API hostname |
| 502 on API | `docker compose logs api`; check DB healthy |

---

## Different domain?

Replace every `belay-sirak.com` with your zone, e.g. `realtor.mydomain.et` and `api.realtor.mydomain.et`.
