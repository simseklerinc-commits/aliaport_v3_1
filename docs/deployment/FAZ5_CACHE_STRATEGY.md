# FAZ 5: In-Memory TTL Cache Stratejisi

**Tarih:** 2025-01-23  
**Durum:** ✅ Aktif (Parametre, Kurlar modülleri entegre)  
**Scope:** Read-heavy endpoint optimizasyonu, database yükü azaltma

---

## 1. Mimari Özet

### Cache Teknolojisi
- **Katman:** In-memory TTL (Time-To-Live) cache  
- **İmplementasyon:** `aliaport_api/core/cache.py` → `TTLCache` sınıfı  
- **Veri Yapısı:** Thread-safe dict (`threading.RLock`) + expiry timestamp  
- **Namespace:** Prefix-based key grouping → toplu invalidation desteği  

### Gelecek Planlama
- **Redis Geçişi:** Distributed cache (multi-worker scaling) → FAZ 6  
- **Şu anki sınır:** Tek process, in-memory (restart = cache flush)  
- **Avantaj:** Zero dependency, hızlı local dev/test, basit setup  

---

## 2. TTL Stratejisi & Endpoint Matrisi

| Endpoint Pattern | Module | TTL (saniye) | Rationale | Invalidation Trigger |
|------------------|--------|--------------|-----------|---------------------|
| `/api/parametre/by-kategori/{kategori}` | Parametre | **3600** (1 saat) | Nadiren değişir, kategori bazlı segmentasyon | `create`, `update`, `delete`, `toggle-active` |
| `/api/kurlar/today` | Kurlar | **300** (5 dakika) | Günde 1-2 kez TCMB/EVDS güncelleme | `create`, `update`, `delete`, `bulk`, `fetch-tcmb`, `fetch-evds` |
| `/api/kurlar/date/{date}` | Kurlar | **300** (5 dakika) | Tarihsel veri: stabil, ancak düzeltme olabilir | Aynı |
| `/api/kurlar/latest/{from}/{to}` | Kurlar | **300** (5 dakika) | Yüksek frekanslı sorgular | Aynı |

### TTL Seçim Kriterleri
1. **Veri Değişim Frekansı:**  
   - Parametreler: Haftada <10 değişiklik → 1 saat TTL makul  
   - Kurlar: Günde 1-2 otomatik güncelleme → 5 dakika eski veri tolere edilebilir  

2. **Tutarlılık Gerekliliği:**  
   - **Write-through pattern:** Mutation sonrası `cache.invalidate()` → eventual consistency yerine strong consistency  
   - CRUD işlemleri cache prefix'e göre tüm ilgili anahtarları temizler  

3. **Query Maliyeti:**  
   - Parametre kategori sorguları: 50-200 kayıt scan → cache çarpanı yüksek  
   - Kurlar tarih sorguları: Index'li (RateDate + CurrencyFrom/To) → orta maliyet, ancak hit rate yüksek bekleniyor  

---

## 3. Cache Key Tasarımı

### Key Composition Helper
```python
from ...core.cache import cache_key

# Parametre kategori
cache_key("parametre:kategori", kategori="ULKE", inactive=False)
# → "parametre:kategori:kategori=ULKE:inactive=False"

# Kurlar bugün
cache_key("kurlar:today", date="2025-01-23")
# → "kurlar:today:date=2025-01-23"

# Kurlar pair latest
cache_key("kurlar:latest", cfrom="USD", cto="TRY")
# → "kurlar:latest:cfrom=USD:cto=TRY"
```

### Prefix-Based Invalidation
```python
# Parametre create/update/delete sonrası:
cache.invalidate("parametre:kategori")  # Tüm kategori cache'leri sil

# Kurlar mutation sonrası:
cache.invalidate("kurlar:")  # today, date, latest tüm prefixleri temizle
```

**Avantaj:** Granüler invalidation → sadece ilgili namespace'ler temizlenir (örnekler arası izolasyon).

---

## 4. Cache Hit/Miss Paternleri

### Cache-Aside Pattern (Lazy Loading)
```python
key = cache_key("parametre:kategori", kategori=kategori, inactive=include_inactive)

def fetch():
    # DB query logic
    query = db.query(Parametre).filter(...)
    records = query.all()
    return [ParametreResponse.model_validate(r).model_dump() for r in records]

data, hit = cached_get_or_set(key, ttl_seconds=3600, fetcher=fetch)
# hit=True → cache'den döndü, DB sorgusu yok
# hit=False → cache miss, fetch() çalıştı, sonuç cache'e yazıldı
```

### Response Annotation (Debugging)
```python
return success_response(
    data=data,
    message=f"{len(data)} parametre bulundu" + (" (cache)" if hit else "")
)
```
**Amaç:** Production log analizinde cache etkinliği ölçümü (hit rate manual inspection).

---

## 5. Invalidation Stratejisi

### Mutation Endpoints → Invalidate Pattern

#### Parametre Module
| Endpoint | Method | Action | Invalidation |
|----------|--------|--------|--------------|
| `/` | POST | Yeni parametre | `cache.invalidate("parametre:kategori")` |
| `/{id}` | PUT | Güncelleme | Aynı |
| `/{id}` | DELETE | Soft delete (AktifMi=False) | Aynı |
| `/{id}/toggle-active` | PATCH | Aktif/pasif toggle | Aynı |

**Trade-off:** Kategori bazlı segmentasyon olduğu için, tek kayıt update'i bile tüm kategoriler cache'ini yeniler (overinvalidation). **Kabul edilebilir** → mutation frekansı düşük.

#### Kurlar Module
| Endpoint | Method | Action | Invalidation |
|----------|--------|--------|--------------|
| `/` | POST | Tek kur create | `cache.invalidate("kurlar:")` |
| `/{id}` | PUT | Kur güncelleme | Aynı |
| `/{id}` | DELETE | Hard delete | Aynı |
| `/bulk` | POST | Toplu ekleme | Aynı |
| `/fetch-tcmb` | POST | TCMB XML parse + upsert | Aynı |
| `/fetch-evds` | POST | EVDS API fetch + upsert | Aynı |

**Geniş Invalidation:** Tüm `kurlar:*` prefix temizlenir → 5 dakika TTL + düşük mutation rate nedeniyle performans etkisi minimal.

---

## 6. Cache Metrik & Monitoring (İleride)

### Şu Anki Durum
- **Manual logging:** Response message'da `(cache)` suffix → manuel inceleme  
- **Stats API:** `cache.stats()` mevcut (hit/miss counters, size, expire queue uzunluğu)  

### FAZ 6 Planlanan İyileştirmeler
1. **Prometheus Metrics:**  
   - `cache_hit_total{endpoint, namespace}`  
   - `cache_miss_total{endpoint, namespace}`  
   - `cache_size_bytes`  
   - `cache_eviction_total`  

2. **Alerting:**  
   - Hit rate < %50 → cache stratejisi review  
   - Size > 100MB → Redis geçiş tetikleyicisi  

3. **Grafana Dashboard:**  
   - Per-endpoint hit rate graph  
   - TTL distribution histogram  
   - Invalidation event timeline  

---

## 7. Cache vs Query Trade-offs

### Kullanılmaması Gereken Senaryolar
❌ **Pagination Endpoint'leri:**  
- Örnek: `/api/parametre/?page=1&page_size=50`  
- **Neden:** Page/page_size kombinasyonu çok fazla unique key → cache hit rate düşük, memory waste yüksek  
- **Alternatif:** Sadece tam liste endpoint'leri (kategori gibi bounded set'ler) cache'lensin  

❌ **User-Specific Data:**  
- Örnek: `/api/auth/me` (current user)  
- **Neden:** Her user unique → cache multiplier = user count  
- **Alternatif:** Frontend state management (Zustand/React Query client cache)  

❌ **High Cardinality Filters:**  
- Örnek: WorkOrder search (10+ filter field combination)  
- **Neden:** Key explosion → memory overhead > DB query savings  

### İdeal Cache Hedefleri
✅ **Static/Semi-Static Lists:**  
- Parametre kategorileri (<50 unique key)  
- Kurlar günlük setleri (<365 tarih * 12 para birimi = 4380 key, TTL 5dk ile yönetilebilir)  

✅ **Expensive Join Queries (Gelecek):**  
- WorkOrder + WorkOrderItem eager load (N+1 çözümü cache ile desteklenirse)  
- Raporlama aggregation'ları (monthly stats, tarih aralığı bazlı)  

---

## 8. Redis Geçiş Hazırlığı (FAZ 6)

### Mimari Değişiklikler
1. **Cache Backend Abstraction:**  
   ```python
   class CacheBackend(ABC):
       @abstractmethod
       def get(self, key: str) -> Optional[Any]: ...
       @abstractmethod
       def set(self, key: str, value: Any, ttl: int): ...
       @abstractmethod
       def delete_prefix(self, prefix: str): ...
   
   # Implementations:
   class InMemoryCache(CacheBackend): ...  # Mevcut
   class RedisCache(CacheBackend): ...     # Yeni
   ```

2. **Deployment Config:**  
   - `.env` → `CACHE_BACKEND=redis` (production) / `in-memory` (local)  
   - Redis connection pool: `redis-py` + `hiredis` parser  
   - Sentinel setup (HA) veya ElastiCache managed service  

3. **Data Serialization:**  
   - In-memory: Python native dict (pickle implicit)  
   - Redis: JSON serialization (performance) veya msgpack (compact)  

### Migration Checklist
- [ ] `CacheBackend` interface tanımı  
- [ ] `RedisCache` implementasyonu (async/await desteği?)  
- [ ] Connection pool management (max connections, timeout)  
- [ ] Key eviction policy: `allkeys-lru` (Redis config)  
- [ ] Monitoring: Redis `INFO` metrics → Prometheus  
- [ ] Load test: Cache backend switch altında performans regression check  

---

## 9. Test & Validation

### Unit Test Gereksinimi
```python
# tests/test_cache.py
def test_ttl_expiration():
    cache.set("test:key", {"value": 123}, ttl_seconds=1)
    assert cache.get("test:key") is not None
    time.sleep(2)
    assert cache.get("test:key") is None  # Expired

def test_prefix_invalidation():
    cache.set("parametre:kategori:1", {...}, ttl_seconds=3600)
    cache.set("parametre:kategori:2", {...}, ttl_seconds=3600)
    cache.invalidate("parametre:kategori")
    assert cache.get("parametre:kategori:1") is None
```

### Integration Test (Manual)
1. **Parametre Cache Validation:**
   ```bash
   # 1. Kategori listesi al (ilk çağrı → DB query)
   curl http://localhost:8000/api/parametre/by-kategori/ULKE
   # Response: "... parametre bulundu"
   
   # 2. Aynı çağrıyı tekrarla (cache hit)
   curl http://localhost:8000/api/parametre/by-kategori/ULKE
   # Response: "... parametre bulundu (cache)"
   
   # 3. Yeni parametre ekle
   curl -X POST http://localhost:8000/api/parametre \
     -H "Content-Type: application/json" \
     -d '{"Kod": "TEST", "Kategori": "ULKE", ...}'
   
   # 4. Kategori listesi tekrar (cache invalidated → DB query)
   curl http://localhost:8000/api/parametre/by-kategori/ULKE
   # Response: "... parametre bulundu" (cache yok, yeni kayıt dahil)
   ```

2. **Kurlar Cache Validation:**
   ```bash
   # 1. Bugünün kurları
   curl http://localhost:8000/api/kurlar/today
   # İlk: DB query, İkinci: "(cache)"
   
   # 2. TCMB fetch (invalidation trigger)
   curl -X POST http://localhost:8000/api/kurlar/fetch-tcmb \
     -H "Content-Type: application/json" -d '{}'
   
   # 3. Bugünün kurları tekrar (cache boş → yeni veriler)
   curl http://localhost:8000/api/kurlar/today
   # Response: güncel TCMB verileri, cache yok
   ```

---

## 10. Sonuç & Özet

### Mevcut Durum
- ✅ Parametre `by-kategori` endpoint: 1 saat TTL, mutation invalidation  
- ✅ Kurlar `today`, `date/{date}`, `latest/{from}/{to}`: 5 dakika TTL  
- ✅ Tüm create/update/delete işlemlerinde cache temizleme  

### Beklenen Kazanımlar
- **DB Yükü Azaltma:** Read-heavy workload'larda ~60-80% query reduction (production hit rate beklentisi)  
- **Response Time İyileştirmesi:** Cached endpoint'ler <5ms (vs ~20-50ms DB query)  
- **Scalability Headroom:** Worker process artırıldığında DB connection pool baskısı azalır  

### Sonraki Adımlar (FAZ 5 Devamı)
1. [ ] Cache metrics loglama (hit/miss rate tracking)  
2. [ ] WorkOrder list endpoint cache evaluation (high cardinality → cache bypass kararı)  
3. [ ] Load test ile cache etkinliği doğrulama (k6 scenarios)  
4. [ ] Redis migration design doc (FAZ 6)  

---

**Versiyon:** 1.0  
**Owner:** Backend Team  
**Review Cycle:** FAZ 5 completion milestone
