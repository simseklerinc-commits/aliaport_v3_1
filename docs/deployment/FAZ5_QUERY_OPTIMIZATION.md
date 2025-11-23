# FAZ 5: Query Optimization Strategy

**Tarih:** 2025-01-23  
**Durum:** 📋 Planlama (Implementation Pending)  
**Hedef:** N+1 query problemlerini tespit ve çöz, lazy vs eager loading optimal dengesi

---

## 1. N+1 Problem Analizi

### Nedir?
**N+1 Query Problem:** ORM relationship'leri lazy load edildiğinde, ana sorgu (1 query) sonrası her ilişkili kayıt için ayrı sorgu (N query) çalışır.

**Örnek Senaryo:**
```python
# N+1 PROBLEM
work_orders = db.query(WorkOrder).limit(50).all()  # 1 query
for wo in work_orders:
    print(wo.items)  # Her WorkOrder için 1 query → 50 query daha!
# Total: 1 + 50 = 51 query
```

**Çözüm (Eager Loading):**
```python
from sqlalchemy.orm import joinedload

# EAGER LOADING
work_orders = db.query(WorkOrder).options(
    joinedload(WorkOrder.items)
).limit(50).all()  # 1 query (LEFT OUTER JOIN)
for wo in work_orders:
    print(wo.items)  # 0 query (cache'den)
# Total: 1 query
```

---

## 2. Aliaport Modül Analizi

### 2.1. İş Emri (WorkOrder) - **YÜKSEK ÖNCELİK**

**Model:**
```python
class WorkOrder(Base):
    __tablename__ = "work_order"
    items = relationship("WorkOrderItem", back_populates="work_order", cascade="all, delete-orphan")
```

**Mevcut Durum:**
- `GET /api/isemri/work-order` endpoint: Sadece WorkOrder listesi döndürür
- İş emri detayı görüntülendiğinde WorkOrderItem'ler **lazy load** edilir
- **Potansiyel N+1:** Frontend'de iş emri listesi + item count gösterimi

**Tespit Edilen N+1 Senaryoları:**
1. **İş Emri Listesi + Item Count:**
   ```python
   # Router: GET /work-order
   work_orders = query.limit(50).all()
   # Frontend her WorkOrder için wo.items.length() çağırsa → N+1
   ```

2. **İş Emri Detayı + Tüm Item'ler:**
   ```python
   # Router: GET /work-order/{id}
   wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
   items = wo.items  # Lazy load → +1 query
   ```

**Çözüm Stratejisi:**

#### Senaryo A: Liste Endpoint'i (Item Count Gerekli)
```python
from sqlalchemy.orm import selectinload

@router.get("/work-order")
def get_work_orders(...):
    query = db.query(WorkOrder).options(
        selectinload(WorkOrder.items)  # Separate SELECT IN query
    ).filter(WorkOrder.is_active == True)
    # ...
```

**Neden `selectinload`?**
- Pagination ile uyumlu (OFFSET/LIMIT bozulmaz)
- 2 query: 1 WorkOrder list + 1 WorkOrderItem batch (WHERE work_order_id IN (...))
- WorkOrder count: 50 → Total 2 query (vs 51 query lazy load)

#### Senaryo B: Detay Endpoint'i (Tüm Item'ler + İlişkiler)
```python
from sqlalchemy.orm import joinedload

@router.get("/work-order/{id}")
def get_work_order_detail(id: int, db: Session = Depends(get_db)):
    wo = db.query(WorkOrder).options(
        joinedload(WorkOrder.items)  # LEFT OUTER JOIN
    ).filter(WorkOrder.id == id).first()
    # Single query with JOIN
```

**Neden `joinedload`?**
- Tek kayıt sorgusu → JOIN overhead düşük
- 1 query (WorkOrder + items birlikte)

---

### 2.2. Barınma Kontratları (BarinmaContract) - **ORTA ÖNCELİK**

**Model:**
```python
class BarinmaContract(Base):
    __tablename__ = "barinma_contract"
    # İlişki YOK (sadece foreign key integer'lar)
    MotorbotId = Column(Integer, nullable=False, index=True)
    CariId = Column(Integer, nullable=False, index=True)
```

**Mevcut Durum:**
- Relationship tanımsız → Manual JOIN gerektiğinde lazy load riski yok
- **Trade-off:** Motorbot/Cari bilgileri için ayrı sorgular (intentional design)

**Optimizasyon İhtiyacı:**
❌ **Şu anki yaklaşım yeterli** → Frontend'de ilişkili veri ihtiyacı düşük (contract listesinde sadece ID'ler)

**Gelecek Planlama (İhtiyaç Halinde):**
```python
# Option 1: Explicit relationship tanımla
class BarinmaContract(Base):
    motorbot = relationship("Motorbot", foreign_keys=[MotorbotId])
    cari = relationship("Cari", foreign_keys=[CariId])

# Option 2: Manuel JOIN (mevcut best practice)
contracts = db.query(BarinmaContract).join(Motorbot).join(Cari).all()
```

**Karar:** Relationship eklemek mi, manuel JOIN mi?
- **Manuel JOIN (mevcut):** Kontrol yüksek, istenmeyen lazy load riski yok
- **Relationship + eager load:** Kod temizliği, ancak her endpoint'te `options()` disiplini gerekir

**Öneri:** Mevcut haliyle devam (relationship eklenirse `lazy="raise"` ile koruma ekle)

---

### 2.3. Motorbot + MbTrip - **ORTA ÖNCELİK**

**Model:**
```python
# motorbot/models.py
class Motorbot(Base):
    __tablename__ = "motorbot"
    # İlişki tanımsız (MbTrip ile 1:N ilişki potansiyeli var)

class MbTrip(Base):
    __tablename__ = "mb_trip"
    MotorbotId = Column(Integer, ForeignKey("motorbot.Id"), index=True)
```

**Potansiyel N+1:**
- Motorbot listesi + son sefer bilgisi (MbTrip.latest)
- Frontend dashboard: Motorbot status + active trip count

**Çözüm (Lazy Load Koruması):**
```python
# Option 1: Relationship + lazy="raise" (accidental access prevention)
class Motorbot(Base):
    trips = relationship("MbTrip", lazy="raise", foreign_keys="[MbTrip.MotorbotId]")

# Option 2: Explicit eager load when needed
motorbot_with_trips = db.query(Motorbot).options(
    selectinload(Motorbot.trips.and_(MbTrip.Durum == "AKTIF"))
).all()
```

**Öneri:** Relationship ekle + `lazy="raise"` (dev-time safety), production'da explicit eager load

---

## 3. Eager Loading Stratejisi Matrisi

| Endpoint Pattern | Use Case | Strategy | Rationale |
|------------------|----------|----------|-----------|
| **Liste + Item Count** | WorkOrder list + items.length | `selectinload` | Pagination uyumlu, 2 query (main + batch) |
| **Detay + İlişkiler** | WorkOrder/{id} + items[] | `joinedload` | Tek kayıt, 1 query (JOIN overhead düşük) |
| **Liste + Nested Filter** | Motorbot + aktif seferler | `selectinload` + filter | Batch query'de WHERE clause |
| **Aggregation Query** | WorkOrder count by status | `func.count()` + GROUP BY | Relationship gereksiz, direkt SQL |
| **Manual Join (Existing)** | BarinmaContract + Motorbot | Query-level `.join()` | Relationship tanımsız, explicit control |

---

## 4. SQLAlchemy Loading Teknikleri

### 4.1. `joinedload` (Eager: LEFT OUTER JOIN)
```python
from sqlalchemy.orm import joinedload

query = db.query(WorkOrder).options(
    joinedload(WorkOrder.items)
)
# SQL: SELECT * FROM work_order LEFT OUTER JOIN work_order_item ON ...
```

**Avantajlar:**
- Tek query (network latency düşük)
- Detay endpoint'leri için ideal

**Dezavantajlar:**
- Pagination ile kullanımda dikkat (OFFSET/LIMIT WorkOrder+Item cartesian product'a uygulanır)
- 1:N ilişkide N büyükse result set şişer (memory overhead)

**Ne Zaman Kullan:**
- Detay endpoint'i (ID ile tek kayıt)
- 1:1 veya 1:few ilişkiler

---

### 4.2. `selectinload` (Eager: Separate SELECT IN)
```python
from sqlalchemy.orm import selectinload

query = db.query(WorkOrder).options(
    selectinload(WorkOrder.items)
)
# SQL 1: SELECT * FROM work_order WHERE ... LIMIT 50
# SQL 2: SELECT * FROM work_order_item WHERE work_order_id IN (id1, id2, ...)
```

**Avantajlar:**
- Pagination uyumlu (main query LIMIT bozulmaz)
- 1:N ilişkide N büyükse bile main query performansı etkilenmez

**Dezavantajlar:**
- 2 query (joinedload'a göre +1 network round-trip)

**Ne Zaman Kullan:**
- Liste endpoint'leri (pagination var)
- 1:N ilişkide N > 10 beklentisi

---

### 4.3. `subqueryload` (Eager: Subquery)
```python
from sqlalchemy.orm import subqueryload

query = db.query(WorkOrder).options(
    subqueryload(WorkOrder.items)
)
# SQL 1: SELECT * FROM work_order WHERE ...
# SQL 2: SELECT * FROM work_order_item WHERE work_order_id IN (
#          SELECT work_order.id FROM work_order WHERE ...
#        )
```

**Avantajlar:**
- Pagination uyumlu
- Karmaşık WHERE clause'ları subquery'de tekrar edilir (consistency)

**Dezavantajlar:**
- Subquery overhead (selectinload'dan yavaş olabilir)
- PostgreSQL'de optimization iyi, SQLite'ta sınırlı

**Ne Zaman Kullan:**
- Nadir (selectinload genelde daha iyi performans)
- Complex filter'lar relationship'te de geçerli olmalıysa

---

### 4.4. `lazy="raise"` (Accidental Load Prevention)
```python
class WorkOrder(Base):
    items = relationship("WorkOrderItem", lazy="raise", back_populates="work_order")
```

**Davranış:**
```python
wo = db.query(WorkOrder).first()
print(wo.items)  # ❌ HATA: "Lazy load not allowed"
```

**Amaç:**
- Dev-time safety: Unutulan eager load'ları yakalar
- Production'da tüm relationship access'lerin explicit olmasını zorlar

**Trade-off:**
- Development friction (her yerde `options()` yazma disiplini)
- Ancak N+1 bug riski sıfırlanır

**Öneri:**
- Kritik production API'lerde kullan
- Local dev'de `lazy="select"` (default), CI/CD'de `lazy="raise"` test env

---

## 5. Implementation Checklist

### Faz 1: İş Emri Modülü (High Impact)
- [ ] **WorkOrder modeline relationship tanımı:**
  ```python
  items = relationship("WorkOrderItem", lazy="raise", back_populates="work_order")
  ```
- [ ] **Liste endpoint'i eager load:**
  ```python
  query.options(selectinload(WorkOrder.items))
  ```
- [ ] **Detay endpoint'i eager load:**
  ```python
  query.options(joinedload(WorkOrder.items))
  ```
- [ ] **Test:** 50 WorkOrder listesi → 2 query (1 main + 1 items batch)
- [ ] **Performance benchmark:** Pre vs post eager load response time

---

### Faz 2: Motorbot/MbTrip İlişkisi (Medium Impact)
- [ ] **Motorbot modeline relationship:**
  ```python
  trips = relationship("MbTrip", lazy="raise")
  ```
- [ ] **Aktif sefer listesi endpoint:**
  ```python
  query.options(selectinload(Motorbot.trips.and_(MbTrip.Durum == "AKTIF")))
  ```
- [ ] **Dashboard endpoint optimization:**
  - Motorbot count + active trip count → `func.count()` aggregate (relationship gereksiz)

---

### Faz 3: Barınma/Cari İlişkileri (Low Priority - As Needed)
- [ ] **Karar:** Relationship ekle mi, manuel JOIN devam mı?
- [ ] **Eğer relationship eklersek:**
  ```python
  class BarinmaContract(Base):
      motorbot = relationship("Motorbot", lazy="raise", foreign_keys=[MotorbotId])
  ```
- [ ] **Eager load örneği:**
  ```python
  query.options(joinedload(BarinmaContract.motorbot))
  ```

---

## 6. Testing & Validation

### SQL Query Logging (Development)
```python
# alembic.ini veya main.py
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

**Kullanımı:**
```bash
# Terminal'de tüm SQL query'leri görünür
uvicorn aliaport_api.main:app --reload
# Endpoint çağır → console'da query count kontrol et
```

**Beklenen Çıktı (Pre-Optimization):**
```
INFO:sqlalchemy.engine:SELECT * FROM work_order LIMIT 50
INFO:sqlalchemy.engine:SELECT * FROM work_order_item WHERE work_order_id = 1
INFO:sqlalchemy.engine:SELECT * FROM work_order_item WHERE work_order_id = 2
...
INFO:sqlalchemy.engine:SELECT * FROM work_order_item WHERE work_order_id = 50
# Total: 51 query
```

**Beklenen Çıktı (Post-Optimization - selectinload):**
```
INFO:sqlalchemy.engine:SELECT * FROM work_order LIMIT 50
INFO:sqlalchemy.engine:SELECT * FROM work_order_item WHERE work_order_id IN (1,2,...,50)
# Total: 2 query
```

---

### Unit Test Örneği
```python
# tests/test_query_optimization.py
from sqlalchemy import event
from sqlalchemy.engine import Engine

query_count = 0

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, params, context, executemany):
    global query_count
    query_count += 1

def test_work_order_list_no_n_plus_one(client, db_session):
    global query_count
    query_count = 0
    
    # Create 50 WorkOrder with 5 items each
    for i in range(50):
        wo = WorkOrder(wo_number=f"WO{i}", ...)
        for j in range(5):
            wo.items.append(WorkOrderItem(...))
        db_session.add(wo)
    db_session.commit()
    
    # Reset counter
    query_count = 0
    
    # Request list endpoint
    response = client.get("/api/isemri/work-order?page=1&page_size=50")
    assert response.status_code == 200
    
    # Verify query count
    assert query_count <= 3  # 1 count + 1 WorkOrder + 1 WorkOrderItem batch
    # (Strict: assert query_count == 2 if count query cached)
```

---

## 7. Performance Profiling

### Pyinstrument ile Endpoint Profiling
```python
# main.py middleware
from pyinstrument import Profiler
from fastapi import Request

@app.middleware("http")
async def profile_request(request: Request, call_next):
    if request.headers.get("X-Profile") == "true":
        profiler = Profiler()
        profiler.start()
        response = await call_next(request)
        profiler.stop()
        print(profiler.output_text(unicode=True, color=True))
        return response
    return await call_next(request)
```

**Kullanımı:**
```bash
curl -H "X-Profile: true" http://localhost:8000/api/isemri/work-order
# Terminal'de function-level timing breakdown
```

**Örnek Çıktı:**
```
  _     ._   __/__   _ _  _  _ _/_   Recorded: 10:23:45  Duration: 0.234s
 /_//_/// /_\ / //_// / //_'/ //     Samples:  234
/   _/                      v4.6.2

0.234s total
├─ 0.180s query execution (76.9%)
│  ├─ 0.120s work_order SELECT (51.3%)
│  └─ 0.060s work_order_item SELECT IN (25.6%)
└─ 0.054s serialization (23.1%)
```

**Hedef:** Query execution time < %50 (pre-optimization %90+ olabilir)

---

## 8. Sonuç & Roadmap

### Mevcut Durum
- ❌ Relationship'ler çoğunlukla tanımsız → manuel JOIN + lazy load riski düşük ama N+1 potansiyeli var
- ❌ Liste endpoint'lerinde eager load yok → production'da frontend item access N+1 tetikleyebilir

### Hedef Durum
- ✅ Tüm 1:N relationship'ler `lazy="raise"` ile korunur
- ✅ Liste endpoint'leri `selectinload` (2 query pattern)
- ✅ Detay endpoint'leri `joinedload` (1 query pattern)
- ✅ SQL query logging + profiling ile regression prevention

### Implementation Priority
1. **İş Emri (WorkOrder):** Yüksek frekans, item count display → immediate impact
2. **Motorbot/MbTrip:** Dashboard aggregation optimization
3. **Barınma:** Düşük öncelik (mevcut manual JOIN yeterli)

### Success Metrics
- **Query Count Reduction:** Liste endpoint'leri N+1 → 2 query (>95% reduction)
- **Response Time:** WorkOrder list endpoint <100ms (pre: ~300ms beklentisi)
- **Memory Overhead:** Eager load sonrası heap size <+20% (monitoring gerekli)

---

**Versiyon:** 1.0  
**Owner:** Backend Team  
**Next Review:** Post-implementation load test (k6 scenarios)
