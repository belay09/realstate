# habesha-homes.com — fix Cloudflare Error 521

The EC2 stack serves **HTTP on port 80** only. Cloudflare **Full** SSL tries **HTTPS on port 443** to your server, which causes **Error 521**.

## Fix (2 minutes)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select zone **habesha-homes.com**
3. **SSL/TLS** → **Overview**
4. Set encryption mode to **Flexible**
5. **SSL/TLS** → **Edge Certificates** → enable **Always Use HTTPS**

Wait 1–2 minutes, then open:

- https://habesha-homes.com
- https://habesha-homes.com/api/v1/health

## Verify DNS

**DNS** → **Records**:

| Type | Name | Content        | Proxy   |
|------|------|----------------|---------|
| A    | `@`  | `13.51.237.118`| Proxied |
| CNAME| `www`| `habesha-homes.com` | Proxied (optional) |

## How it works

| Mode      | Visitor → Cloudflare | Cloudflare → your server |
|-----------|----------------------|---------------------------|
| Flexible  | HTTPS                | HTTP port **80** ✓        |
| Full      | HTTPS                | HTTPS port **443** ✗ (not configured) |

`http://habesha-homes.com` already works before this change; **Flexible** makes `https://` work for visitors.
