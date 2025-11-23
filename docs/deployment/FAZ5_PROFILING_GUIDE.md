# FAZ 5: Performance Profiling Guide

**Tarih:** 2025-01-23  
**Durum:** 📋 Implementation Guide  
**Hedef:** Bottleneck detection, code-level optimization, production monitoring

---

## 1. Profiling Philosophy

### Why Profile?

**Load tests tell you WHAT is slow. Profiling tells you WHY.**

- Load Test: "`GET /work-order` p95 = 250ms" ❌ (exceeds 100ms target)
- Profiling: "180ms spent in `db.query()`, 50ms in serialization, 20ms other"
- **Actionable:** Optimize query (eager loading) → 180ms → 30ms ✅

**Profiling Pyramid:**
```
System-Level (top-down)   →  What service is bottleneck?
 ↓
Endpoint-Level             →  Which route is slowest?
 ↓
Function-Level             →  What code block takes most time?
 ↓
Line-Level (bottom-up)     →  Which exact line is the culprit?
```

---

## 2. Backend Profiling (Python/FastAPI)

### 2.1. Pyinstrument (Statistical Profiler)

**Why Pyinstrument?**
- ✅ Low overhead (~2-5% slowdown vs cProfile's ~30%)
- ✅ Call stack visualization (flame graph style)
- ✅ Async/await aware (FastAPI compatible)
- ✅ Human-readable output (no manual post-processing)

**Installation:**
```bash
pip install pyinstrument
```

---

#### Setup: Request-Level Profiling Middleware

**File:** `aliaport_api/core/profiling.py`
```python
"""
Performance Profiling Middleware
Enable with X-Profile header (dev/staging only)
"""

import os
from fastapi import Request
from pyinstrument import Profiler
from pyinstrument.renderers import HTMLRenderer, SpeedscopeRenderer

PROFILING_ENABLED = os.getenv("ENABLE_PROFILING", "false").lower() == "true"

async def profile_request(request: Request, call_next):
    """
    Conditional profiling middleware
    Usage: curl -H "X-Profile: true" http://localhost:8000/api/endpoint
    """
    if not PROFILING_ENABLED:
        return await call_next(request)
    
    if request.headers.get("X-Profile") != "true":
        return await call_next(request)
    
    profiler = Profiler(async_mode="enabled")
    profiler.start()
    
    response = await call_next(request)
    
    profiler.stop()
    
    # Output to console (terminal)
    print(profiler.output_text(unicode=True, color=True, show_all=True))
    
    # Optionally save HTML report
    # output_file = f"profiles/{request.url.path.replace('/', '_')}.html"
    # with open(output_file, 'w') as f:
    #     f.write(profiler.output_html())
    
    return response
```

**File:** `aliaport_api/main.py` (enable middleware)
```python
from .core.profiling import profile_request

@app.middleware("http")
async def profiling_middleware(request: Request, call_next):
    return await profile_request(request, call_next)
```

**Environment Configuration:**
```bash
# .env.development
ENABLE_PROFILING=true

# .env.production
ENABLE_PROFILING=false  # Security: disable in production
```

---

#### Usage Example

**Trigger Profiling:**
```bash
curl -H "X-Profile: true" http://localhost:8000/api/isemri/work-order?page=1&page_size=50
```

**Console Output:**
```
  _     ._   __/__   _ _  _  _ _/_   Recorded: 10:45:23  Duration: 0.234s
 /_//_/// /_\ / //_// / //_'/ //     Samples:  234
/   _/                      v4.6.2

0.234s total
├─ 0.180s get_work_orders (router.py:42)
│  ├─ 0.120s <sqlalchemy query execution>
│  │  ├─ 0.080s SELECT work_order
│  │  └─ 0.040s SELECT work_order_item (N+1!)
│  ├─ 0.050s WorkOrderResponse.model_validate (x50)
│  └─ 0.010s paginated_response
└─ 0.054s <other framework overhead>
```

**Key Insights:**
- 🔴 **120ms** in DB queries (51% of time)
- 🔴 **40ms** in N+1 query (work_order_item) → **Fix:** eager load
- 🟡 **50ms** serialization (21%) → acceptable for 50 records
- 🟢 **54ms** framework overhead (23%) → normal

---

### 2.2. cProfile + SnakeViz (Deterministic Profiler)

**When to Use:**
- Deep function-level analysis (call counts, cumulative time)
- Offline profiling (captured sessions)
- CPU-bound code optimization

**Setup:**
```python
# scripts/profile_endpoint.py
import cProfile
import pstats
from io import StringIO

def profile_function(func, *args, **kwargs):
    pr = cProfile.Profile()
    pr.enable()
    result = func(*args, **kwargs)
    pr.disable()
    
    # Print to console
    s = StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
    ps.print_stats(20)  # Top 20 functions
    print(s.getvalue())
    
    # Save for SnakeViz
    pr.dump_stats("profile.prof")
    return result
```

**Usage:**
```bash
python scripts/profile_endpoint.py
snakeviz profile.prof  # Opens browser visualization
```

---

### 2.3. SQL Query Logging & Analysis

**Enable SQLAlchemy Echo:**
```python
# config/database.py
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Log all SQL queries
    echo_pool=True  # Log connection pool events
)
```

**Console Output:**
```sql
INFO:sqlalchemy.engine:SELECT work_order.id, work_order.wo_number, ...
INFO:sqlalchemy.engine:SELECT work_order_item.id, ... WHERE work_order_item.work_order_id = 1
INFO:sqlalchemy.engine:SELECT work_order_item.id, ... WHERE work_order_item.work_order_id = 2
...
```

**Problem Detection:**
- Repeated similar queries → N+1 problem
- Full table scans → missing indexes
- Long query execution → complex JOIN or large dataset

**Production Alternative (pg_stat_statements):**
```sql
-- Enable extension (PostgreSQL)
CREATE EXTENSION pg_stat_statements;

-- Top 10 slowest queries
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

### 2.4. Memory Profiling (memory_profiler)

**When to Use:**
- Suspecting memory leaks
- Large dataset processing (batch imports)
- Long-running background tasks

**Installation:**
```bash
pip install memory-profiler
```

**Usage:**
```python
# Decorate function
from memory_profiler import profile

@profile
def process_large_dataset():
    data = load_all_work_orders()  # Potentially huge
    for item in data:
        process(item)
```

**Run:**
```bash
python -m memory_profiler scripts/batch_process.py
```

**Output:**
```
Line #    Mem usage    Increment  Occurrences   Line Contents
=============================================================
     3     50.2 MiB     50.2 MiB           1   @profile
     4                                         def process_large_dataset():
     5    250.5 MiB    200.3 MiB           1       data = load_all_work_orders()
     6    252.1 MiB      1.6 MiB       10000       for item in data:
     7    252.1 MiB      0.0 MiB       10000           process(item)
```

**Insight:** Line 5 allocates 200MB → optimize with streaming/batching

---

## 3. Database Profiling

### 3.1. EXPLAIN ANALYZE (PostgreSQL)

**Purpose:** Understand query execution plan (index usage, scan type, cost)

**Example:**
```sql
EXPLAIN ANALYZE
SELECT wo.*, woi.*
FROM work_order wo
LEFT JOIN work_order_item woi ON wo.id = woi.work_order_id
WHERE wo.status = 'SAHADA'
LIMIT 50;
```

**Output:**
```
Limit  (cost=0.42..123.45 rows=50 width=500) (actual time=0.123..4.567 rows=50 loops=1)
  ->  Nested Loop Left Join  (cost=0.42..12345.67 rows=5000 width=500) (actual time=0.120..4.550 rows=50 loops=1)
        ->  Index Scan using idx_work_order_status on work_order wo  (cost=0.42..234.56 rows=100 width=250)
              Index Cond: (status = 'SAHADA')
        ->  Index Scan using idx_work_order_item_wo_id on work_order_item woi  (cost=0.28..120.00 rows=50 width=250)
              Index Cond: (work_order_id = wo.id)
Planning Time: 0.234 ms
Execution Time: 4.678 ms
```

**Key Metrics:**
- **Index Scan** ✅ → Using index (fast)
- **Seq Scan** ❌ → Full table scan (slow, needs index)
- **actual time** → Real execution time (vs estimated cost)
- **rows** → Actual vs estimated row count (optimizer accuracy)

---

### 3.2. SQLite EXPLAIN QUERY PLAN

**SQLite Equivalent:**
```sql
EXPLAIN QUERY PLAN
SELECT * FROM work_order WHERE status = 'SAHADA';
```

**Output:**
```
SCAN TABLE work_order USING INDEX idx_work_order_status (status=?)
```

- **SCAN TABLE** with **USING INDEX** ✅ → Index used
- **SCAN TABLE** without index ❌ → Full scan

---

### 3.3. Query Performance Benchmarking

**Benchmark Script:**
```python
# scripts/benchmark_queries.py
import time
from sqlalchemy.orm import joinedload
from aliaport_api.config.database import SessionLocal
from aliaport_api.modules.isemri.models import WorkOrder

def benchmark_query(name, query_func, iterations=10):
    times = []
    for _ in range(iterations):
        start = time.perf_counter()
        query_func()
        elapsed = time.perf_counter() - start
        times.append(elapsed)
    
    avg_time = sum(times) / len(times)
    print(f"{name}: {avg_time*1000:.2f}ms avg")

if __name__ == "__main__":
    db = SessionLocal()
    
    # Test 1: Lazy load (N+1 problem)
    def lazy_load():
        work_orders = db.query(WorkOrder).limit(50).all()
        for wo in work_orders:
            _ = len(wo.items)  # Triggers N queries
    
    # Test 2: Eager load (optimized)
    def eager_load():
        work_orders = db.query(WorkOrder).options(
            joinedload(WorkOrder.items)
        ).limit(50).all()
        for wo in work_orders:
            _ = len(wo.items)  # No extra query
    
    benchmark_query("Lazy Load (N+1)", lazy_load)
    benchmark_query("Eager Load", eager_load)
    
    db.close()
```

**Expected Output:**
```
Lazy Load (N+1): 342.56ms avg
Eager Load: 28.34ms avg
```
**Result:** 12x faster with eager loading ✅

---

## 4. Frontend Profiling (React)

### 4.1. React DevTools Profiler

**Installation:**
- Chrome/Firefox extension: React Developer Tools

**Usage:**
1. Open React DevTools → **Profiler** tab
2. Click **Record** ⏺️
3. Interact with app (navigate to WorkOrder list)
4. Click **Stop** ⏹️
5. Analyze **Flame Graph** and **Ranked Chart**

**Key Metrics:**
- **Render Duration:** Time spent rendering component tree
- **Commit Time:** Time to apply changes to DOM
- **Wasted Renders:** Components re-rendering unnecessarily

**Optimization Targets:**
- Components with >50ms render time
- Components rendering >5 times per interaction
- Large diff commits (>100 DOM nodes updated)

---

### 4.2. React.memo & useMemo

**Problem: Unnecessary Re-Renders**
```typescript
// Before: Re-renders on every parent update
const WorkOrderRow = ({ workOrder }) => {
  return <tr><td>{workOrder.wo_number}</td>...</tr>;
};
```

**Solution: Memoization**
```typescript
// After: Only re-renders if workOrder prop changes
const WorkOrderRow = React.memo(({ workOrder }) => {
  return <tr><td>{workOrder.wo_number}</td>...</tr>;
});

// Expensive computation caching
const WorkOrderList = ({ orders }) => {
  const totalAmount = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.amount, 0);
  }, [orders]);  // Only recalculates when orders change
  
  return <div>Total: {totalAmount}</div>;
};
```

---

### 4.3. Bundle Size Analysis

**Tool: Vite Build Analyzer**

**Build with Stats:**
```bash
cd frontend
npm run build -- --mode production

# Analyze bundle
npx vite-bundle-visualizer
```

**Output:** Opens browser with treemap visualization

**Action Items:**
- Large libraries (>500KB) → consider alternatives or code splitting
- Duplicate dependencies → ensure single version
- Unused code → tree-shaking verification

**Example Findings:**
- `moment.js` (500KB) → replace with `date-fns` (70KB)
- Entire icon library imported → use icon sprite (as implemented in FAZ 3)

---

### 4.4. Lighthouse Performance Audit

**Run Lighthouse:**
```bash
# Chrome DevTools → Lighthouse tab → Generate Report
# Or CLI:
npm install -g lighthouse
lighthouse http://localhost:5173 --view
```

**Key Metrics (Core Web Vitals):**
- **LCP (Largest Contentful Paint):** <2.5s ✅
- **FID (First Input Delay):** <100ms ✅
- **CLS (Cumulative Layout Shift):** <0.1 ✅

**Common Issues:**
- Unoptimized images → use WebP, lazy loading
- Render-blocking CSS/JS → code splitting, async loading
- Slow server response → backend optimization (this guide!)

---

## 5. APM (Application Performance Monitoring)

### 5.1. Sentry (Error + Performance Tracking)

**Installation:**
```bash
pip install sentry-sdk[fastapi]
```

**Backend Setup:**
```python
# main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,  # 10% of requests profiled
    profiles_sample_rate=0.1,
    environment="production",
)
```

**Features:**
- Automatic error tracking (exceptions, stack traces)
- Performance monitoring (slow transactions)
- Release tracking (deployment correlation)
- User feedback (error dialogs)

---

### 5.2. Prometheus + Grafana (Metrics)

**Custom Metrics:**
```python
# core/metrics.py
from prometheus_client import Counter, Histogram

http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)
```

**Middleware:**
```python
# main.py
import time
from .core.metrics import http_requests_total, http_request_duration_seconds

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    
    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response
```

**Grafana Dashboard Queries:**
```promql
# p95 latency per endpoint
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Requests per second
rate(http_requests_total[1m])
```

---

## 6. Profiling Workflow

### Step-by-Step Optimization Process

**1. Identify Slow Endpoint (Load Test)**
```
k6 test shows: GET /api/isemri/work-order p95 = 320ms (target: <100ms)
```

**2. Enable SQL Logging**
```python
# Temporarily set echo=True
engine = create_engine(DATABASE_URL, echo=True)
```

**3. Trigger Request with Profiling**
```bash
curl -H "X-Profile: true" http://localhost:8000/api/isemri/work-order?page=1&page_size=50
```

**4. Analyze Pyinstrument Output**
```
0.320s total
├─ 0.250s DB queries (78%)
│  ├─ 0.080s SELECT work_order
│  └─ 0.170s SELECT work_order_item (x50 queries) ← N+1!
├─ 0.050s Serialization (16%)
└─ 0.020s Framework (6%)
```

**5. Fix N+1 Problem**
```python
# Add eager loading
from sqlalchemy.orm import selectinload

query = query.options(selectinload(WorkOrder.items))
```

**6. Re-Test**
```bash
curl -H "X-Profile: true" http://localhost:8000/api/isemri/work-order?page=1&page_size=50
```

**7. Verify Improvement**
```
0.085s total (73% faster!)
├─ 0.030s DB queries (35%) ← Fixed!
│  ├─ 0.020s SELECT work_order
│  └─ 0.010s SELECT work_order_item (1 batch query)
├─ 0.045s Serialization (53%)
└─ 0.010s Framework (12%)
```

**8. Load Test Validation**
```
k6 test shows: GET /api/isemri/work-order p95 = 95ms ✅ (meets target!)
```

---

## 7. Best Practices

### Do's ✅
- ✅ Profile in **staging** environment (production-like data volume)
- ✅ **Baseline first:** Measure before optimization
- ✅ **One change at a time:** Isolate impact of each optimization
- ✅ **Focus on p95/p99:** Average is misleading (hides worst case)
- ✅ **Profile under load:** Concurrency exposes hidden bottlenecks
- ✅ **Document findings:** Share profile reports with team

### Don'ts ❌
- ❌ Don't profile with tiny datasets (100 records vs production 100k)
- ❌ Don't optimize without measuring (premature optimization)
- ❌ Don't leave profiling enabled in production (performance overhead + security risk)
- ❌ Don't ignore frontend (backend <50ms but UI sluggish = bad UX)
- ❌ Don't micro-optimize (10ms → 8ms) before fixing macro issues (300ms → 50ms)

---

## 8. Profiling Checklist

### Pre-Optimization
- [ ] Load test baseline captured (k6 results saved)
- [ ] Slowest endpoints identified (p95 >target threshold)
- [ ] Profiling environment setup (staging with production data volume)
- [ ] SQL query logging enabled

### During Optimization
- [ ] Pyinstrument profile captured (before/after)
- [ ] SQL EXPLAIN ANALYZE run (index usage verified)
- [ ] Code changes documented (PR description includes profile screenshots)
- [ ] Unit tests pass (no regression)

### Post-Optimization
- [ ] Load test re-run (verify improvement)
- [ ] Metrics updated (Grafana dashboard shows reduction in p95)
- [ ] Team review (share findings in standup/retrospective)
- [ ] Documentation updated (CHANGELOG, performance notes)

---

## 9. Tools Summary

| Tool | Purpose | When to Use | Output |
|------|---------|-------------|--------|
| **Pyinstrument** | Call stack profiling | Endpoint-level bottleneck | Flame graph (console/HTML) |
| **cProfile** | Function-level analysis | Deep dive, call count | Stats table, SnakeViz |
| **SQL Echo** | Query logging | N+1 detection | Console SQL statements |
| **EXPLAIN ANALYZE** | Query plan | Index verification | PostgreSQL execution plan |
| **memory_profiler** | Memory usage | Leak detection, large data | Line-by-line mem allocation |
| **React Profiler** | Component rendering | Frontend performance | Flame graph, commit timeline |
| **Lighthouse** | Web vitals | Production readiness | Core Web Vitals report |
| **Sentry** | APM + errors | Production monitoring | Dashboards, alerts |
| **Prometheus** | Metrics | Continuous monitoring | Time-series data (Grafana) |

---

## 10. Conclusion

### Profiling Flow
```
Load Test (what's slow?) 
  → Pyinstrument (where in code?) 
    → SQL Logging (database issue?) 
      → Optimize (eager load, index, cache) 
        → Re-test (validation) 
          → Deploy ✅
```

### Next Steps
1. [ ] Enable profiling middleware in staging
2. [ ] Run initial profiling session on top 10 endpoints
3. [ ] Document bottlenecks in GitHub issues
4. [ ] Prioritize fixes (high impact first)
5. [ ] Integrate profiling into PR review process

---

**Versiyon:** 1.0  
**Owner:** Backend + Frontend Teams  
**Review Cycle:** Monthly profiling sprint (pre-release)
