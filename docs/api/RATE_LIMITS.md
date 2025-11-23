# Aliaport v3.1 - Rate Limits

## Overview

Aliaport API implements rate limiting to ensure fair usage and protect against abuse. Rate limits are enforced per user (authenticated) or per IP address (anonymous).

---

## Rate Limit Tiers

### Authenticated Users (JWT Token)
```
100 requests / minute
1,000 requests / hour
10,000 requests / day
```

### Anonymous Users (No Token)
```
20 requests / minute
100 requests / hour
500 requests / day
```

### Admin Users (ADMIN role)
```
200 requests / minute
2,000 requests / hour
20,000 requests / day
```

---

## Rate Limit Headers

Every API response includes rate limit information in HTTP headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700745600
X-RateLimit-Window: 60
```

**Header Descriptions:**
- `X-RateLimit-Limit` - Maximum requests allowed in the current window
- `X-RateLimit-Remaining` - Requests remaining in the current window
- `X-RateLimit-Reset` - Unix timestamp when the limit resets
- `X-RateLimit-Window` - Window duration in seconds (60 = 1 minute)

---

## Rate Limit Exceeded Response

When you exceed the rate limit, the API returns a `429 Too Many Requests` response:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700745600
Retry-After: 45

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "İstek limiti aşıldı. 45 saniye sonra tekrar deneyin.",
    "details": {
      "retry_after": 45,
      "limit": 100,
      "window": "1 minute"
    }
  },
  "timestamp": "2025-11-23T11:25:00Z"
}
```

**Headers:**
- `Retry-After` - Seconds to wait before retrying

---

## Endpoint-Specific Limits

Some endpoints have stricter limits due to resource intensity:

### External API Calls (TCMB/EVDS)
```
GET /api/exchange-rate/fetch-tcmb
Limit: 10 requests / minute (shared for all users)
```

### File Uploads (Archive)
```
POST /api/archive/upload
Limit: 20 requests / hour per user
```

### Bulk Operations
```
POST /api/work-order/bulk
Limit: 5 requests / minute per user
```

### Report Generation
```
POST /api/reports/generate
Limit: 10 requests / hour per user
```

---

## Best Practices

### 1. Check Rate Limit Headers
```javascript
const response = await fetch('https://api.aliaport.com/api/cari');
const remaining = response.headers.get('X-RateLimit-Remaining');

if (remaining < 10) {
  console.warn('Rate limit nearing, slow down requests');
}
```

### 2. Implement Exponential Backoff
```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, i) * 1000;
      
      console.log(`Rate limited, waiting ${delay}ms before retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}
```

### 3. Batch Requests
Instead of making 100 individual requests, use list endpoints with pagination:

❌ **Bad:**
```javascript
for (let i = 1; i <= 100; i++) {
  await fetch(`/api/cari/${i}`);  // 100 requests!
}
```

✅ **Good:**
```javascript
const response = await fetch('/api/cari?page=1&page_size=100');
const data = response.json();  // 1 request
```

### 4. Use Caching
Cache responses to reduce API calls:

```javascript
const cache = new Map();

async function getCari(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  
  const response = await fetch(`/api/cari/${id}`);
  const data = await response.json();
  
  cache.set(id, data);
  setTimeout(() => cache.delete(id), 5 * 60 * 1000);  // 5 min TTL
  
  return data;
}
```

### 5. Monitor Your Usage
Track rate limit headers in production:

```javascript
const rateLimitMetrics = {
  total: 0,
  throttled: 0,
  avgRemaining: []
};

async function monitoredFetch(url) {
  rateLimitMetrics.total++;
  
  const response = await fetch(url);
  
  if (response.status === 429) {
    rateLimitMetrics.throttled++;
  }
  
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
  rateLimitMetrics.avgRemaining.push(remaining);
  
  return response;
}

// Log metrics every minute
setInterval(() => {
  console.log('Rate Limit Metrics:', rateLimitMetrics);
}, 60000);
```

---

## Exemptions

Certain endpoints are **NOT** rate limited:

- `GET /health` - Health check
- `GET /ready` - Readiness probe
- `GET /metrics` - Prometheus metrics
- `GET /docs` - API documentation
- `GET /openapi.json` - OpenAPI spec

---

## Rate Limit Bypass (Emergency)

In case of emergency (e.g., critical data sync), contact your system administrator to temporarily increase limits.

**Contact:**
- Email: admin@aliaport.com
- Slack: #aliaport-support

**Required Information:**
- User ID / IP address
- Reason for bypass
- Duration needed
- Estimated request count

---

## Implementation Details

Rate limiting is implemented using [SlowAPI](https://github.com/laurentS/slowapi):

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/cari")
@limiter.limit("100/minute")
async def list_cari():
    ...
```

**Storage:** Redis (production) or in-memory (development)

---

## Testing Rate Limits

### Test Script (Python)
```python
import requests
import time

url = "http://localhost:8000/api/cari"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

for i in range(150):  # Exceed 100/min limit
    response = requests.get(url, headers=headers)
    print(f"{i+1}: {response.status_code} - Remaining: {response.headers.get('X-RateLimit-Remaining')}")
    
    if response.status_code == 429:
        retry_after = int(response.headers.get('Retry-After', 60))
        print(f"Rate limited! Waiting {retry_after} seconds...")
        time.sleep(retry_after)
```

### Test Script (cURL)
```bash
#!/bin/bash

for i in {1..150}; do
  echo "Request $i"
  curl -i http://localhost:8000/api/cari \
    -H "Authorization: Bearer YOUR_TOKEN" \
    | grep "X-RateLimit"
  sleep 0.3
done
```

---

## Troubleshooting

### Issue: "Rate limit exceeded" but I didn't make that many requests

**Possible Causes:**
1. **Shared IP:** Multiple users behind same NAT/proxy
2. **Frontend polling:** Aggressive auto-refresh
3. **Cached token:** Using old token after limit reset

**Solutions:**
- Use authentication (higher limits)
- Reduce polling frequency
- Implement proper token refresh

### Issue: Rate limit headers missing

**Possible Causes:**
1. Endpoint is exempt (e.g., `/health`)
2. Rate limiting middleware not enabled
3. Development environment (rate limiting disabled)

**Solutions:**
- Check endpoint in exempt list
- Verify `ENVIRONMENT=production` in `.env`
- Check `main.py` middleware registration

---

## Production Configuration

### Environment Variables
```bash
# .env.production
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORAGE=redis://redis:6379/1
RATE_LIMIT_AUTHENTICATED=100/minute
RATE_LIMIT_ANONYMOUS=20/minute
```

### Redis Setup
```bash
docker run -d \
  --name aliaport-redis \
  -p 6379:6379 \
  redis:7-alpine
```

---

## See Also

- [API Reference](API_REFERENCE.md)
- [Error Codes](ERROR_CODES.md)
- [Authentication Guide](../AUTH_GUIDE.md)

---

**Last Updated:** 23 Kasım 2025
