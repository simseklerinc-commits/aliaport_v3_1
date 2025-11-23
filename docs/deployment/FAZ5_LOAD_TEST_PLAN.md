# FAZ 5: Load & Stress Test Strategy

**Tarih:** 2025-01-23  
**Durum:** 📋 Planlama (k6 Scripts Pending)  
**Hedef:** Production readiness validation, performance bottleneck detection, capacity planning

---

## 1. Test Objectives

### 1.1. Load Test Goals
- **Baseline Performance:** Establish current system capacity (requests/sec, response time p95/p99)
- **Cache Effectiveness:** Measure hit rate under realistic traffic patterns
- **Database Performance:** Query count reduction post-optimization
- **Resource Utilization:** CPU, memory, DB connections at various load levels

### 1.2. Stress Test Goals
- **Breaking Point:** Find maximum sustainable throughput
- **Degradation Profile:** How does response time degrade under overload?
- **Error Threshold:** At what point do errors (5xx) exceed acceptable rate (<1%)?
- **Recovery:** System behavior post-spike (connection pool recovery, cache stability)

---

## 2. Test Scenarios

### Scenario 1: **Authentication Burst (Login Storm)**
**Profile:** System startup, shift change, or morning login rush

**Parameters:**
- Virtual Users: Ramp 0→100 over 1 minute
- Duration: 5 minutes
- Target: `/api/auth/login` + `/api/auth/me`

**Success Criteria:**
- p95 response time <200ms
- Error rate <0.1%
- JWT token generation throughput >50/sec
- DB connection pool usage <60%

**k6 Script Outline:**
```javascript
// tests/k6/auth_burst.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Sustain
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.001'],
  },
};

const BASE_URL = 'http://localhost:8000';
const CREDENTIALS = {
  username: 'test_user',
  password: 'test_pass',
};

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(CREDENTIALS), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'token received': (r) => JSON.parse(r.body).data.access_token !== undefined,
  });
  
  const token = JSON.parse(loginRes.body).data.access_token;
  
  // Fetch user profile
  const profileRes = http.get(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  check(profileRes, {
    'profile status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

---

### Scenario 2: **WorkOrder CRUD Mix (Realistic Traffic)**
**Profile:** Typical business day - 70% read, 20% create, 10% update

**Parameters:**
- Virtual Users: 50 concurrent
- Duration: 10 minutes
- Endpoints: 
  - 70%: `GET /api/isemri/work-order` (list)
  - 20%: `POST /api/isemri/work-order` (create)
  - 10%: `PUT /api/isemri/work-order/{id}` (update)

**Success Criteria:**
- List p95 <100ms (with cache hit)
- Create p95 <150ms
- Update p95 <120ms
- Error rate <0.5%
- Cache hit rate >70% (monitored separately)

**k6 Script Outline:**
```javascript
// tests/k6/workorder_crud.js
export let options = {
  vus: 50,
  duration: '10m',
  thresholds: {
    'http_req_duration{endpoint:list}': ['p(95)<100'],
    'http_req_duration{endpoint:create}': ['p(95)<150'],
    'http_req_duration{endpoint:update}': ['p(95)<120'],
    http_req_failed: ['rate<0.005'],
  },
};

export default function () {
  const rand = Math.random();
  
  if (rand < 0.7) {
    // 70%: List WorkOrders
    http.get(`${BASE_URL}/api/isemri/work-order?page=1&page_size=50`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      tags: { endpoint: 'list' },
    });
  } else if (rand < 0.9) {
    // 20%: Create WorkOrder
    const payload = {
      cari_id: 123,
      cari_code: 'TEST001',
      cari_title: 'Test Cari',
      type: 'HIZMET',
      subject: `Load Test WO ${__VU}-${__ITER}`,
      priority: 'MEDIUM',
    };
    http.post(`${BASE_URL}/api/isemri/work-order`, JSON.stringify(payload), {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      tags: { endpoint: 'create' },
    });
  } else {
    // 10%: Update WorkOrder
    const woId = Math.floor(Math.random() * 1000) + 1;
    http.put(`${BASE_URL}/api/isemri/work-order/${woId}`, JSON.stringify({ subject: 'Updated' }), {
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      tags: { endpoint: 'update' },
    });
  }
  
  sleep(randomIntBetween(1, 3));
}
```

---

### Scenario 3: **Parametre Cache Test (Read-Heavy)**
**Profile:** Configuration lookup stress test (validate cache TTL strategy)

**Parameters:**
- Virtual Users: 200 concurrent
- Duration: 5 minutes
- Endpoint: `GET /api/parametre/by-kategori/{kategori}`
- Categories: Rotate through 10 common categories (ULKE, LIMAN, HIZMET_TIPI, etc.)

**Success Criteria:**
- p95 <50ms (post cache warm-up)
- Cache hit rate >90% (after first minute)
- DB query count <500 total (vs 60,000 without cache)
- Zero cache invalidation errors

**k6 Script Outline:**
```javascript
// tests/k6/parametre_cache.js
const CATEGORIES = ['ULKE', 'LIMAN', 'HIZMET_TIPI', 'PARA_BIRIMI'];

export let options = {
  vus: 200,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<50'],
  },
};

export default function () {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const res = http.get(`${BASE_URL}/api/parametre/by-kategori/${category}`);
  
  check(res, {
    'status 200': (r) => r.status === 200,
    'cache hit': (r) => r.body.includes('(cache)'),
  });
  
  sleep(0.5);
}
```

---

### Scenario 4: **Kurlar API Stress (External Integration)**
**Profile:** Currency fetch + lookup burst (morning rate update)

**Parameters:**
- Phase 1: TCMB fetch (single VU, sequential)
- Phase 2: Rate lookup burst (100 VUs for 2 minutes)
- Endpoints: 
  - `/api/kurlar/fetch-tcmb`
  - `/api/kurlar/today`
  - `/api/kurlar/latest/USD/TRY`

**Success Criteria:**
- TCMB fetch completes <5 seconds
- Lookup p95 <30ms (cache hit)
- Error rate <0.1% (handle TCMB API failures gracefully)

---

### Scenario 5: **Soak Test (Endurance)**
**Profile:** Sustained moderate load over 1 hour (memory leak detection)

**Parameters:**
- Virtual Users: 20 concurrent
- Duration: 1 hour
- Mixed traffic: WorkOrder CRUD + Parametre lookups + Auth renewals

**Success Criteria:**
- Response times stable (no gradual degradation)
- Memory usage stable (no leak → RSS growth)
- Connection pool size stable (no pool exhaustion)
- Zero DB deadlocks or transaction rollbacks

---

## 3. Test Environment

### 3.1. Infrastructure Setup

**Staging Server Specs (Minimum):**
- CPU: 4 cores (match production)
- RAM: 8GB
- Database: PostgreSQL 16 (or SQLite for pre-migration baseline)
- Network: 1Gbps local (eliminate network variable)

**Load Generator:**
- Separate VM/container (avoid resource contention)
- k6 installed: `docker run --rm -v $(pwd):/scripts grafana/k6 run /scripts/auth_burst.js`

---

### 3.2. Monitoring Stack

**Required Metrics During Tests:**

1. **Application Metrics (Prometheus + Grafana):**
   - `http_request_duration_seconds{endpoint, method}`
   - `http_requests_total{endpoint, status}`
   - `db_connection_pool_size{state="in_use"}`
   - `cache_hit_total` / `cache_miss_total`

2. **System Metrics (node_exporter):**
   - CPU utilization
   - Memory (RSS, heap)
   - Disk I/O
   - Network throughput

3. **Database Metrics (pg_stat_statements / SQLite EXPLAIN):**
   - Query count per endpoint
   - Slow queries (>100ms)
   - Connection count
   - Lock wait time

4. **k6 Built-In Metrics:**
   - `http_req_duration` (p50, p95, p99)
   - `http_req_failed` (error rate)
   - `iterations` (throughput)
   - `vus` (active virtual users)

**Grafana Dashboard Template:**
```json
{
  "panels": [
    {
      "title": "Request Duration (p95)",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))"
        }
      ]
    },
    {
      "title": "Cache Hit Rate",
      "targets": [
        {
          "expr": "rate(cache_hit_total[1m]) / (rate(cache_hit_total[1m]) + rate(cache_miss_total[1m]))"
        }
      ]
    }
  ]
}
```

---

## 4. Performance Baselines & Targets

### 4.1. Pre-Optimization (Current State)

| Endpoint | p95 Latency | Throughput | Cache Hit | Notes |
|----------|-------------|------------|-----------|-------|
| `GET /work-order` (list) | ~200ms | 30 req/s | N/A | No cache, N+1 query |
| `POST /work-order` | ~80ms | 50 req/s | N/A | Single insert |
| `GET /parametre/by-kategori` | ~150ms | 40 req/s | N/A | No cache |
| `GET /kurlar/today` | ~100ms | 60 req/s | N/A | No cache |
| `POST /auth/login` | ~120ms | 40 req/s | N/A | Bcrypt hashing |

---

### 4.2. Post-Optimization Targets (FAZ 5 Complete)

| Endpoint | Target p95 | Target Throughput | Cache Hit | Improvement |
|----------|------------|-------------------|-----------|-------------|
| `GET /work-order` (list) | <100ms | >100 req/s | N/A | 2x faster (eager load) |
| `POST /work-order` | <80ms | >50 req/s | N/A | Stable |
| `GET /parametre/by-kategori` | <50ms | >200 req/s | >90% | 3x faster (cache) |
| `GET /kurlar/today` | <30ms | >300 req/s | >85% | 3.3x faster (cache) |
| `POST /auth/login` | <120ms | >40 req/s | N/A | Stable (bcrypt bottleneck) |

**Overall System Target:**
- Concurrent users: 100+ (vs ~30 current estimate)
- Error rate: <0.1% under normal load
- Database connections: <60% pool utilization at peak

---

## 5. Test Execution Plan

### 5.1. Pre-Test Checklist

- [ ] **Environment Provisioned:**
  - [ ] Staging server up (same specs as production)
  - [ ] Database seeded (realistic data volume: 10k WorkOrders, 50k Items)
  - [ ] Monitoring stack running (Prometheus, Grafana, logs)

- [ ] **Code Deployed:**
  - [ ] Latest main branch (post FAZ 5 optimizations)
  - [ ] Cache enabled (verify `cache.stats()` endpoint)
  - [ ] Indexes applied (migration `586fe8452ca2`)

- [ ] **Test Scripts Ready:**
  - [ ] k6 scripts validated (`k6 run --vus 1 --duration 10s script.js`)
  - [ ] Authentication tokens generated (test user credentials)

- [ ] **Baselines Recorded:**
  - [ ] Pre-optimization metrics captured (screenshot Grafana)

---

### 5.2. Test Sequence

**Day 1: Baseline & Functional Tests**
1. Run **Scenario 1 (Auth Burst)** → 10 VUs (light load)
2. Run **Scenario 2 (WorkOrder CRUD)** → 10 VUs
3. Capture baseline metrics
4. Fix any immediate failures (5xx errors, crashes)

**Day 2: Load Tests**
1. **Scenario 1** → Full load (100 VUs)
2. **Scenario 2** → Full load (50 VUs)
3. **Scenario 3** → Cache stress (200 VUs)
4. **Scenario 4** → Kurlar stress (100 VUs)

**Day 3: Stress & Soak Tests**
1. **Scenario 2** → Ramp to failure (find breaking point)
2. **Scenario 5** → 1-hour soak test
3. Analyze results, identify bottlenecks

---

### 5.3. Post-Test Analysis

**Key Questions:**
1. Did we meet performance targets?
2. What is the current bottleneck? (CPU, DB, cache misses, network)
3. At what VU count do errors exceed 1%?
4. Are there memory leaks or resource exhaustion over time?
5. How effective is the cache? (hit rate, invalidation behavior)

**Deliverables:**
- [ ] Test report (PDF/Markdown with charts)
- [ ] Bottleneck identification + remediation plan
- [ ] Updated capacity planning (max users, scaling thresholds)
- [ ] Tuning recommendations (pool size, cache TTL, query optimization)

---

## 6. k6 Installation & Usage

### 6.1. Installation

**Docker (Recommended):**
```bash
docker pull grafana/k6
```

**Local Install (Windows):**
```powershell
choco install k6
```

**Local Install (Linux/Mac):**
```bash
curl -L https://github.com/grafana/k6/releases/download/v0.48.0/k6-v0.48.0-linux-amd64.tar.gz | tar -xz
sudo mv k6 /usr/local/bin/
```

---

### 6.2. Running Tests

**Local Execution:**
```bash
# Single test
k6 run tests/k6/auth_burst.js

# With custom VUs and duration
k6 run --vus 50 --duration 5m tests/k6/workorder_crud.js

# Output results to JSON
k6 run --out json=results.json tests/k6/parametre_cache.js
```

**Docker Execution:**
```bash
docker run --rm \
  --network host \
  -v $(pwd)/tests/k6:/scripts \
  grafana/k6 run /scripts/auth_burst.js
```

**Cloud Execution (k6 Cloud - Optional):**
```bash
# Requires k6 Cloud account
k6 cloud tests/k6/auth_burst.js
```

---

### 6.3. Interpreting Results

**k6 Output Example:**
```
     ✓ login status 200
     ✓ token received

     checks.........................: 100.00% ✓ 12000 ✗ 0
     data_received..................: 14 MB   23 kB/s
     data_sent......................: 7.2 MB  12 kB/s
     http_req_blocked...............: avg=1.2ms    min=0s     med=0s     max=120ms  p(90)=0s     p(95)=2ms
     http_req_duration..............: avg=85ms     min=20ms   med=75ms   max=450ms  p(90)=140ms  p(95)=180ms
       { expected_response:true }...: avg=85ms     min=20ms   med=75ms   max=450ms  p(90)=140ms  p(95)=180ms
     http_req_failed................: 0.00%   ✓ 0    ✗ 12000
     http_reqs......................: 12000   20/s
     iterations.....................: 6000    10/s
     vus............................: 100     min=0   max=100
```

**Key Metrics:**
- **`http_req_duration` p(95):** 95% of requests completed in 180ms → meets <200ms target ✅
- **`http_req_failed`:** 0% errors → excellent ✅
- **`http_reqs`:** 20 req/s → throughput (total, not per-VU)
- **`checks`:** 100% → all assertions passed ✅

**Red Flags:**
- p(95) >target threshold → optimization needed
- `http_req_failed` >1% → application errors (check logs)
- High `http_req_blocked` → connection pool exhaustion or DNS issues

---

## 7. Continuous Load Testing

### 7.1. Integration with CI/CD

**GitHub Actions Workflow (Post-Merge to Main):**
```yaml
# .github/workflows/load-test.yml
name: Load Test

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * 0'  # Weekly Sunday 2am

jobs:
  k6-load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start staging environment
        run: docker-compose -f docker-compose.staging.yml up -d
      
      - name: Wait for API
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:8000/health; do sleep 2; done'
      
      - name: Run k6 tests
        run: |
          docker run --rm --network host \
            -v $(pwd)/tests/k6:/scripts \
            grafana/k6 run /scripts/auth_burst.js
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json
      
      - name: Check performance thresholds
        run: |
          # Parse results.json, fail if p95 > threshold
          python scripts/check_performance.py results.json
```

---

### 7.2. Regression Detection

**Automated Checks:**
```python
# scripts/check_performance.py
import json
import sys

THRESHOLDS = {
    'http_req_duration': {'p95': 200},  # ms
    'http_req_failed': {'rate': 0.01},  # 1%
}

with open(sys.argv[1]) as f:
    results = json.load(f)

p95_duration = results['metrics']['http_req_duration']['p(95)']
error_rate = results['metrics']['http_req_failed']['rate']

if p95_duration > THRESHOLDS['http_req_duration']['p95']:
    print(f"❌ FAIL: p95 duration {p95_duration}ms > {THRESHOLDS['http_req_duration']['p95']}ms")
    sys.exit(1)

if error_rate > THRESHOLDS['http_req_failed']['rate']:
    print(f"❌ FAIL: Error rate {error_rate*100}% > {THRESHOLDS['http_req_failed']['rate']*100}%")
    sys.exit(1)

print("✅ PASS: Performance within thresholds")
```

---

## 8. Conclusion

### Test Coverage
- ✅ Authentication burst (login storm)
- ✅ CRUD mixed workload (realistic traffic)
- ✅ Cache effectiveness validation
- ✅ External API integration (TCMB)
- ✅ Endurance/soak test (memory leaks)

### Next Steps
1. [ ] Create k6 test scripts (`tests/k6/`)
2. [ ] Setup staging environment (Docker Compose)
3. [ ] Run baseline tests (pre-optimization)
4. [ ] Execute full test suite post-FAZ 5
5. [ ] Document bottlenecks + remediation plan
6. [ ] Integrate into CI/CD pipeline

---

**Versiyon:** 1.0  
**Owner:** QA + Backend Team  
**Review Cycle:** After each major performance optimization
