# Monitoring Guide - Voice Dashboard

## 🔍 Sentry Configuration

Sentry is configured for error tracking and performance monitoring.

### Setup

1. Get DSN from [sentry.io](https://sentry.io)
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

### Files

- `sentry.client.config.ts` - Browser monitoring
- `sentry.server.config.ts` - Server monitoring  
- `sentry.edge.config.ts` - Edge runtime monitoring

### Health Check

```bash
curl /api/health
```

Returns:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "latency": 45 },
    "uptime": { "status": "up", "seconds": 3600 }
  }
}
```

## 🛡️ Security

Middleware provides:
- Rate limiting (100 req/min)
- Security headers (CSP, HSTS, XSS)
- Auth protection
