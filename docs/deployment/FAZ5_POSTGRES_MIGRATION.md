# FAZ 5: PostgreSQL Migration Plan

**Tarih:** 2025-01-23  
**Durum:** 📋 Planlama (Implementation Pending)  
**Hedef:** SQLite → PostgreSQL migration stratejisi, schema diffs, connection pool config

---

## 1. Migration Rationale

### Neden PostgreSQL?

**SQLite Sınırlamaları:**
- ❌ **Concurrency:** Write lock tüm DB'yi bloklar → multi-user production ortamında bottleneck
- ❌ **Data Types:** JSON, ARRAY, JSONB gibi advanced types yok
- ❌ **Full-Text Search:** Limited FTS support, Turkish stemming yok
- ❌ **Replication:** Master-slave setup mümkün değil → HA/DR zorluğu
- ❌ **Connection Pooling:** File-based DB → pool overhead minimal benefit
- ❌ **Performance:** Large dataset (>10GB) → table scan performansı düşük

**PostgreSQL Avantajları:**
- ✅ **MVCC (Multi-Version Concurrency Control):** Read/write parallelism
- ✅ **ACID Compliance:** Enterprise-grade transaction safety
- ✅ **Advanced Indexing:** GIN, GiST, BRIN, partial indexes
- ✅ **JSON Support:** JSONB column type, JSON operators (->>, @>, etc.)
- ✅ **Extensions:** pg_trgm (fuzzy search), PostGIS (geo), TimescaleDB (time-series)
- ✅ **Replication:** Streaming replication, logical replication, pgpool-II
- ✅ **Performance:** Query planner optimization, parallel query execution

---

## 2. Schema Compatibility Analysis

### 2.1. Data Type Mapping

| SQLite Type | PostgreSQL Equivalent | Notes |
|-------------|----------------------|-------|
| `INTEGER` | `INTEGER` / `BIGINT` | Auto-increment: `SERIAL` / `BIGSERIAL` |
| `TEXT` | `VARCHAR(n)` / `TEXT` | VARCHAR length limit enforced in PG |
| `REAL` | `REAL` / `DOUBLE PRECISION` | SQLite REAL = 8-byte float |
| `NUMERIC(p,s)` | `NUMERIC(p,s)` | Direct match |
| `BOOLEAN` | `BOOLEAN` | SQLite stores as 0/1, PG native boolean |
| `DATETIME` | `TIMESTAMP` / `TIMESTAMPTZ` | **Critical:** Timezone handling |
| `DATE` | `DATE` | Direct match |
| `BLOB` | `BYTEA` | Binary data |

**Action Items:**
- [ ] Review all `DateTime` columns → decide `TIMESTAMP` vs `TIMESTAMPTZ`
  - **Öneri:** `TIMESTAMPTZ` (UTC storage, client timezone conversion)
- [ ] Verify `NUMERIC` precision/scale values (max: 131072 digits in PG)
- [ ] Check `TEXT` columns → convert to `VARCHAR(n)` where length constraint logical

---

### 2.2. Auto-Increment Sequences

**SQLite:**
```sql
CREATE TABLE work_order (
    id INTEGER PRIMARY KEY AUTOINCREMENT
);
```

**PostgreSQL:**
```sql
CREATE TABLE work_order (
    id SERIAL PRIMARY KEY  -- Shorthand for INT + SEQUENCE
);
-- Or explicitly:
CREATE SEQUENCE work_order_id_seq;
CREATE TABLE work_order (
    id INTEGER PRIMARY KEY DEFAULT nextval('work_order_id_seq')
);
```

**Alembic Handling:**
- SQLAlchemy `autoincrement=True` → Alembic generates `SERIAL` for PostgreSQL
- No manual intervention needed if using Alembic migrations

**Action:**
- [ ] Verify existing migrations generate `SERIAL` for PostgreSQL dialect
- [ ] Test sequence reset after bulk data import (see Migration Strategy)

---

### 2.3. Index Differences

**Case Sensitivity:**
- SQLite: Case-insensitive by default for ASCII (COLLATE NOCASE)
- PostgreSQL: Case-sensitive → `ILIKE` for case-insensitive search, or `LOWER()` index

**Example Fix:**
```python
# Before (SQLite implicit)
query.filter(Parametre.Kod == kod)

# After (PostgreSQL explicit case-insensitive)
from sqlalchemy import func
query.filter(func.lower(Parametre.Kod) == kod.lower())

# Index for performance:
CREATE INDEX idx_parametre_kod_lower ON parametre (LOWER(Kod));
```

**Action Items:**
- [ ] Audit all `LIKE`/`ILIKE` queries → ensure `ILIKE` for case-insensitive
- [ ] Add `LOWER()` functional indexes where needed
- [ ] Review `UNIQUE` constraints → case sensitivity impact

---

### 2.4. Foreign Key Constraints

**SQLite:**
- Foreign keys disabled by default (pragma required)
- Weak enforcement → orphan records possible

**PostgreSQL:**
- Foreign keys enforced by default
- `ON DELETE CASCADE/RESTRICT/SET NULL` required decision

**Migration Risk:**
- Existing SQLite data may have orphan records → FK constraint violation on import

**Mitigation Strategy:**
```sql
-- Step 1: Find orphans
SELECT wo.id FROM work_order wo
LEFT JOIN work_order_item woi ON wo.id = woi.work_order_id
WHERE woi.work_order_id IS NULL;

-- Step 2: Clean or fix
DELETE FROM work_order WHERE id IN (orphan_ids);
-- OR assign default/placeholder FK value
```

**Action:**
- [ ] Pre-migration orphan record audit script
- [ ] Define FK cascade behavior per relationship:
  - WorkOrder → WorkOrderItem: `ON DELETE CASCADE`
  - BarinmaContract → Motorbot: `ON DELETE RESTRICT`
  - User → AuditEvent: `ON DELETE SET NULL` (preserve audit trail)

---

### 2.5. Boolean Handling

**SQLite:**
```python
# Model
is_active = Column(Boolean, default=True)
# SQL: INTEGER (0/1)
```

**PostgreSQL:**
```sql
-- Native BOOLEAN type
is_active BOOLEAN DEFAULT TRUE
```

**Query Compatibility:**
```python
# Works in both
query.filter(WorkOrder.is_active == True)  # OK

# SQLite specific (avoid)
query.filter(WorkOrder.is_active == 1)  # Breaks in PostgreSQL
```

**Action:**
- [ ] Grep codebase for `== 1` / `== 0` boolean comparisons → replace with `True`/`False`

---

## 3. Connection Configuration

### 3.1. Database URL Format

**SQLite:**
```python
# .env
DATABASE_URL=sqlite:///./aliaport.db
```

**PostgreSQL:**
```python
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/aliaport_db
# Or with asyncpg (async driver - optional)
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/aliaport_db
```

**Environment-Based Switching:**
```python
# config/database.py
import os
from sqlalchemy import create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./aliaport.db")

if DATABASE_URL.startswith("postgresql"):
    engine = create_engine(
        DATABASE_URL,
        pool_size=20,          # Connection pool
        max_overflow=10,       # Burst capacity
        pool_pre_ping=True,    # Health check before use
        pool_recycle=3600,     # Recycle connections hourly
        echo=False             # SQL logging (dev: True)
    )
else:
    # SQLite (no pooling benefit)
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
```

**Action:**
- [ ] Update `config/database.py` with conditional pool config
- [ ] Add `.env.production` template with PostgreSQL URL
- [ ] Document connection string format in deployment docs

---

### 3.2. Connection Pool Tuning

**Recommended Settings (Production):**
```python
# For 4-core server, 1GB RAM for DB
pool_size = 20           # Persistent connections
max_overflow = 10        # Burst capacity (total max: 30)
pool_timeout = 30        # Wait 30s for available connection
pool_recycle = 3600      # Recycle every hour (prevent stale connections)
pool_pre_ping = True     # Validate connection before checkout
```

**Calculation:**
```
Optimal pool_size = (CPU cores * 2) + disk spindles
Example: 4 cores * 2 + 1 SSD = 9 (round up to 20 for buffer)
```

**Monitoring:**
```python
# main.py startup event
@app.on_event("startup")
async def startup_event():
    pool_status = engine.pool.status()
    logger.info(f"DB Pool: {pool_status}")
```

**Action:**
- [ ] Load test to determine optimal `pool_size` (start 20, monitor)
- [ ] Add pool metrics to Prometheus (connections in use, overflow, timeouts)

---

### 3.3. Session Management Best Practices

**Current (SQLite):**
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**PostgreSQL Enhancement (Connection Pool Efficiency):**
```python
from contextlib import contextmanager

@contextmanager
def get_db_context():
    """Context manager for explicit session lifecycle"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# Usage in background tasks
with get_db_context() as db:
    # Operations auto-commit or rollback
    process_batch(db)
```

**Action:**
- [ ] Keep existing `get_db()` for FastAPI dependencies
- [ ] Add `get_db_context()` for scheduler/background jobs
- [ ] Document session lifecycle in coding guidelines

---

## 4. Data Migration Strategy

### 4.1. Migration Tools Comparison

| Tool | Pros | Cons | Recommendation |
|------|------|------|----------------|
| **pg_dump + psql** | Simple, native | SQLite incompatible | ❌ Not applicable |
| **Python Script (SQLAlchemy)** | Portable, ORM-based | Slow for large data | ✅ Best for Aliaport |
| **pgloader** | Fast, automatic | Complex setup, SQLite → PG only | ⚠️ Backup option |
| **CSV Export/Import** | Universal | Manual schema creation | ⚠️ Fallback |

**Chosen Approach:** Python + SQLAlchemy ORM (preserves model integrity)

---

### 4.2. Migration Script Template

```python
# scripts/migrate_sqlite_to_postgres.py
"""
SQLite → PostgreSQL Data Migration Script
Usage: python migrate_sqlite_to_postgres.py
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from tqdm import tqdm

# Import all models
from aliaport_api.modules.parametre.models import Parametre
from aliaport_api.modules.kurlar.models import ExchangeRate
from aliaport_api.modules.isemri.models import WorkOrder, WorkOrderItem
# ... (import all models)

# Source (SQLite)
SQLITE_URL = "sqlite:///./aliaport.db"
sqlite_engine = create_engine(SQLITE_URL)
SqliteSession = sessionmaker(bind=sqlite_engine)

# Target (PostgreSQL)
POSTGRES_URL = os.getenv("POSTGRES_URL")  # From .env
pg_engine = create_engine(POSTGRES_URL)
PgSession = sessionmaker(bind=pg_engine)

def migrate_table(model_class, batch_size=1000):
    """Migrate single table with batching"""
    sqlite_session = SqliteSession()
    pg_session = PgSession()
    
    try:
        # Count records
        total = sqlite_session.query(model_class).count()
        print(f"Migrating {model_class.__tablename__}: {total} records")
        
        # Batch processing
        for offset in tqdm(range(0, total, batch_size)):
            records = sqlite_session.query(model_class).offset(offset).limit(batch_size).all()
            
            for record in records:
                # Detach from SQLite session
                sqlite_session.expunge(record)
                # Reset primary key (let PostgreSQL sequence handle it)
                record.id = None  # If auto-increment
                # Add to PostgreSQL
                pg_session.add(record)
            
            pg_session.commit()
        
        print(f"✅ {model_class.__tablename__} migration complete")
    
    except Exception as e:
        print(f"❌ Error migrating {model_class.__tablename__}: {e}")
        pg_session.rollback()
    finally:
        sqlite_session.close()
        pg_session.close()

def reset_sequences(pg_session):
    """Reset PostgreSQL auto-increment sequences after bulk insert"""
    sequences = [
        ("work_order_id_seq", "work_order"),
        ("parametre_id_seq", "parametre"),
        # ... (all sequences)
    ]
    
    for seq_name, table_name in sequences:
        pg_session.execute(f"""
            SELECT setval('{seq_name}', COALESCE((SELECT MAX(id) FROM {table_name}), 1), false);
        """)
    pg_session.commit()

if __name__ == "__main__":
    # Migration order (respect FK dependencies)
    migration_order = [
        Parametre,
        ExchangeRate,
        # ... (parent tables first, then children)
        WorkOrder,
        WorkOrderItem,
    ]
    
    for model in migration_order:
        migrate_table(model)
    
    # Reset sequences
    pg_session = PgSession()
    reset_sequences(pg_session)
    pg_session.close()
    
    print("🎉 Migration complete!")
```

**Action:**
- [ ] Create `scripts/migrate_sqlite_to_postgres.py`
- [ ] Test on staging environment (sample data)
- [ ] Document rollback procedure (PostgreSQL backup → restore SQLite)

---

### 4.3. Pre-Migration Checklist

- [ ] **Backup SQLite DB:**
  ```bash
  cp aliaport.db aliaport_backup_$(date +%Y%m%d).db
  ```

- [ ] **PostgreSQL Setup:**
  ```sql
  CREATE DATABASE aliaport_db OWNER aliaport_user;
  GRANT ALL PRIVILEGES ON DATABASE aliaport_db TO aliaport_user;
  ```

- [ ] **Run Alembic Migrations (PostgreSQL):**
  ```bash
  # Point to PostgreSQL DB
  export DATABASE_URL=postgresql://user:pass@localhost/aliaport_db
  alembic upgrade head
  ```

- [ ] **Data Integrity Checks (Pre-Migration):**
  ```sql
  -- Orphan records
  SELECT COUNT(*) FROM work_order_item woi
  LEFT JOIN work_order wo ON woi.work_order_id = wo.id
  WHERE wo.id IS NULL;
  
  -- Duplicate unique constraints
  SELECT wo_number, COUNT(*) FROM work_order GROUP BY wo_number HAVING COUNT(*) > 1;
  ```

- [ ] **Test Migration Script (Dry Run):**
  ```bash
  python scripts/migrate_sqlite_to_postgres.py --dry-run
  ```

---

### 4.4. Post-Migration Validation

```python
# scripts/validate_migration.py
def validate_record_counts():
    """Compare record counts SQLite vs PostgreSQL"""
    tables = ["work_order", "parametre", "exchange_rate"]
    
    for table in tables:
        sqlite_count = sqlite_session.execute(f"SELECT COUNT(*) FROM {table}").scalar()
        pg_count = pg_session.execute(f"SELECT COUNT(*) FROM {table}").scalar()
        
        assert sqlite_count == pg_count, f"{table} count mismatch: {sqlite_count} vs {pg_count}"
        print(f"✅ {table}: {pg_count} records")

def validate_foreign_keys():
    """Verify FK integrity in PostgreSQL"""
    # Example: WorkOrder → WorkOrderItem
    orphans = pg_session.execute("""
        SELECT COUNT(*) FROM work_order_item woi
        LEFT JOIN work_order wo ON woi.work_order_id = wo.id
        WHERE wo.id IS NULL
    """).scalar()
    
    assert orphans == 0, f"Found {orphans} orphan WorkOrderItem records"
    print("✅ Foreign key integrity validated")

if __name__ == "__main__":
    validate_record_counts()
    validate_foreign_keys()
    print("🎉 Validation passed!")
```

**Action:**
- [ ] Run validation script post-migration
- [ ] Compare sample queries (SELECT, JOIN) results between SQLite and PostgreSQL
- [ ] Smoke test critical endpoints (login, WorkOrder CRUD, reports)

---

## 5. Application Code Changes

### 5.1. Required Code Modifications

**Minimal Changes (SQLAlchemy Abstracts Most Differences):**

1. **Database URL Update:**
   ```python
   # .env.production
   DATABASE_URL=postgresql://aliaport_user:secure_pass@db.example.com:5432/aliaport_db
   ```

2. **Connection Pool Config (Already Covered in 3.1):**
   ```python
   # config/database.py - conditional pool settings
   ```

3. **Case-Insensitive Queries:**
   ```python
   # Before (SQLite implicit)
   query.filter(Cari.Code.like(f"%{search}%"))
   
   # After (PostgreSQL explicit)
   query.filter(Cari.Code.ilike(f"%{search}%"))  # Case-insensitive
   ```

4. **Boolean Filters (Already Safe):**
   ```python
   # Good (works both)
   query.filter(WorkOrder.is_active == True)
   
   # Bad (SQLite only)
   query.filter(WorkOrder.is_active == 1)  # ❌ Fix if found
   ```

**Action:**
- [ ] Grep codebase: `\.like\(` → replace with `.ilike(` where case-insensitive needed
- [ ] Search: `== 1` / `== 0` in boolean contexts → replace with `True`/`False`

---

### 5.2. Optional Optimizations (PostgreSQL-Specific)

**1. JSONB Columns (Future Enhancement):**
```python
from sqlalchemy.dialects.postgresql import JSONB

class AuditEvent(Base):
    extra_data = Column(JSONB, nullable=True)  # SQLite: TEXT (JSON string)

# Query with JSONB operators
query.filter(AuditEvent.extra_data["user_id"].astext == "123")
```

**2. Full-Text Search (Turkish Support):**
```python
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import TSVECTOR

class Parametre(Base):
    search_vector = Column(TSVECTOR)  # Auto-updated trigger

# Query
query.filter(
    func.to_tsvector('turkish', Parametre.Aciklama).op('@@')(
        func.plainto_tsquery('turkish', search_term)
    )
)
```

**3. Array Columns (Role Lists):**
```python
from sqlalchemy.dialects.postgresql import ARRAY

class User(Base):
    role_ids = Column(ARRAY(Integer))  # vs separate role_user table

# Query
query.filter(User.role_ids.contains([1, 2]))  # User has role 1 OR 2
```

**Action:**
- [ ] Post-migration: evaluate JSONB for `AuditEvent.extra_data`
- [ ] Post-migration: benchmark FTS vs `ILIKE` for Turkish text search
- [ ] Keep current normalized schema (no ARRAY columns in v1)

---

## 6. Deployment Strategy

### 6.1. Staging Environment

**Setup:**
```bash
# Docker Compose for local PostgreSQL
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: aliaport_user
      POSTGRES_PASSWORD: dev_pass
      POSTGRES_DB: aliaport_staging
    ports:
      - "5432:5432"
    volumes:
      - ./pg_data:/var/lib/postgresql/data
```

**Testing Checklist:**
- [ ] Run all Alembic migrations from scratch
- [ ] Execute migration script (SQLite → PostgreSQL)
- [ ] Run unit test suite (pytest)
- [ ] Manual smoke test (Postman collection)
- [ ] Load test (k6 scripts - see FAZ 5 Load Test Plan)

---

### 6.2. Production Migration Timeline

**Downtime Estimate:** 2-4 hours (depends on data volume)

**Migration Steps:**

1. **T-7 days: Pre-Migration Prep**
   - [ ] Announce maintenance window
   - [ ] Backup SQLite DB
   - [ ] Provision PostgreSQL server (RDS, DigitalOcean Managed, etc.)
   - [ ] Test migration script on staging

2. **T-1 day: Final Staging Test**
   - [ ] Mirror production data to staging
   - [ ] Full migration dry run
   - [ ] Performance benchmark (before/after)

3. **T-0 (Migration Day):**
   - [ ] **00:00 - Put app in maintenance mode**
     ```python
     # main.py
     MAINTENANCE_MODE = True
     @app.middleware("http")
     async def maintenance_check(request, call_next):
         if MAINTENANCE_MODE and request.url.path != "/health":
             return JSONResponse({"error": "Maintenance in progress"}, status_code=503)
         return await call_next(request)
     ```
   
   - [ ] **00:15 - Final SQLite backup**
     ```bash
     sqlite3 aliaport.db ".backup aliaport_prod_final.db"
     ```
   
   - [ ] **00:30 - Run migration script**
     ```bash
     python scripts/migrate_sqlite_to_postgres.py
     ```
   
   - [ ] **02:00 - Validation script**
     ```bash
     python scripts/validate_migration.py
     ```
   
   - [ ] **02:30 - Update .env (DATABASE_URL → PostgreSQL)**
   
   - [ ] **02:45 - Restart application**
     ```bash
     systemctl restart aliaport-api
     ```
   
   - [ ] **03:00 - Smoke tests**
     - Login
     - WorkOrder CRUD
     - Report generation
   
   - [ ] **03:30 - Disable maintenance mode**
   
   - [ ] **04:00 - Monitor logs & metrics**

4. **T+1 day: Post-Migration**
   - [ ] User acceptance testing
   - [ ] Performance monitoring (response times, query counts)
   - [ ] Keep SQLite backup for 30 days (rollback option)

---

### 6.3. Rollback Procedure

**If Critical Issue Found:**

1. **Enable maintenance mode**
2. **Revert DATABASE_URL to SQLite**
   ```bash
   export DATABASE_URL=sqlite:///./aliaport_prod_final.db
   ```
3. **Restart application**
4. **Verify functionality**
5. **Communicate issue + re-plan migration**

**Rollback Window:** <30 minutes (assuming SQLite backup intact)

---

## 7. Performance Expectations

### 7.1. Benchmark Targets

| Metric | SQLite (Current) | PostgreSQL (Target) | Improvement |
|--------|------------------|---------------------|-------------|
| WorkOrder list (50 records) | ~150ms | <50ms | 3x faster |
| WorkOrder create | ~20ms | ~15ms | 1.3x faster |
| Concurrent writes (10/sec) | ❌ Lock contention | ✅ No blocking | N/A |
| Full-text search (Turkish) | ~500ms (LIKE) | ~50ms (FTS) | 10x faster |
| Database size (1M records) | ~2GB | ~1.5GB | Better compression |

**Note:** Actual results depend on hardware, network latency, indexing strategy

---

### 7.2. Monitoring Post-Migration

**Metrics to Track:**
```python
# Prometheus metrics
db_query_duration_seconds{query="work_order_list"}
db_connection_pool_size{state="in_use"}
db_connection_pool_size{state="idle"}
db_transaction_rollback_total
```

**Alerting Rules:**
- Query duration >200ms (p95) → investigate slow query
- Connection pool exhaustion >80% → increase `pool_size`
- Transaction rollback rate >5% → application bug or deadlock

---

## 8. Conclusion

### Key Decisions
- ✅ **Migration Tool:** Python + SQLAlchemy (ORM-based, portable)
- ✅ **Connection Pool:** `pool_size=20`, `max_overflow=10` (tune based on load)
- ✅ **Timezone:** `TIMESTAMPTZ` for all datetime columns
- ✅ **Downtime:** 2-4 hour maintenance window (night/weekend)

### Next Steps
1. [ ] Create migration script (`scripts/migrate_sqlite_to_postgres.py`)
2. [ ] Setup staging PostgreSQL (Docker Compose)
3. [ ] Run end-to-end test migration
4. [ ] Document environment-specific configs (`.env.production`)
5. [ ] Schedule production migration date
6. [ ] Communicate timeline to stakeholders

---

**Versiyon:** 1.0  
**Owner:** DevOps + Backend Team  
**Review Date:** Pre-production migration (T-7 days)
