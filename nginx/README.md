# nginx/

Nginx configuration for the CampusPulse reverse proxy. In both local and production Docker stacks, Nginx sits in front of the app and handles rate limiting, compression, security headers, and connection management.

---

## nginx.conf

The single configuration file for the proxy. Key concerns and how to adjust them:

---

### Rate limiting

Two rate limit zones are defined:

```nginx
limit_req_zone $binary_remote_addr zone=global:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=ingestion:10m rate=10r/m;
```

`global` applies to all routes: 60 requests per minute per client IP.
`ingestion` applies to `/api/ingestion/`: 10 requests per minute per client IP. The ingestion route is rate-limited more aggressively because similarity scoring is computationally expensive — each submission scores against all candidates in a 14-day window.

**To adjust a limit:** change the `rate=` value on the relevant `limit_req_zone` line. The `burst` value on the corresponding `limit_req` directive controls how many requests above the rate can queue before being rejected with `429`. For example, `burst=5 nodelay` allows a burst of 5 requests that are served immediately without delay.

---

### Gzip compression

```nginx
gzip on;
gzip_types application/json text/plain text/html;
gzip_comp_level 6;
```

Compression is enabled for `application/json` and text types at level 6 (good balance between CPU and compression ratio). The API returns only JSON, so this is the most relevant type.

**To disable compression** (e.g. for debugging): set `gzip off`.
**To adjust compression level:** values range from 1 (fastest, least compression) to 9 (slowest, most compression). Level 6 is a reasonable default.

---

### Security headers

Four headers are set on every response:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking via iframes |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter (modern browsers ignore it) |
| `Referrer-Policy` | `no-referrer` | Suppresses the Referer header on outgoing requests |

These are set in the `add_header` directives. They apply to all proxied responses.

---

### Upstream keep-alive

```nginx
upstream app {
  server app:3000;
  keepalive 32;
}
```

`keepalive 32` maintains up to 32 persistent connections to the app container. This avoids a TCP handshake on every request, which matters under load. The value can be increased if the app is handling high concurrency, but 32 is appropriate for Phase 1 traffic levels.

---

### Timeouts

Two timeout values differ between routes:

| Route | `proxy_read_timeout` | Reason |
|-------|---------------------|--------|
| `/api/ingestion/` | 30s | Similarity scoring can take longer under load |
| All other routes | 15s | Standard CRUD — should be fast |

`proxy_connect_timeout` is 5s for all routes.

**To adjust:** change the `proxy_read_timeout` value in the relevant `location` block.

---

### Non-API traffic

Any request that does not match `/api/` returns a `404` JSON response:

```nginx
location / {
  return 404 '{"success":false,"error":{"code":"NOT_FOUND","message":"Not found"}}';
}
```

CampusPulse serves no static files. All legitimate traffic arrives under `/api/`. This prevents path traversal probing and makes unexpected requests immediately visible in access logs.

---

### Network topology

In production (`docker-compose.prod.yml`), the app port (`3000`) is not exposed to the host — all external traffic enters through Nginx on port 80. The internal Docker network has `internal: true`, meaning no outbound internet access from the app or database containers.

```
Internet → nginx (port 80) → app (port 3000, internal only)
                                        ↓
                              postgres (port 5432, internal only)
```

In local development (`docker-compose.yml`), the app port is also exposed directly to the host for debugging without going through Nginx.
