# FAZ 5 - Performans & Ölçeklenebilirlik Planı (Taslak)

## Amaç
Uygulamanın artan yük altında tutarlı yanıt süreleri, kaynak verimliliği ve gelecekte PostgreSQL + Redis geçişine hazır olması.

## Hedefler (Ölçülebilir)
- Ortalama API yanıt süresi (p95) < 300ms (kritik CRUD)
- Login endpoint p95 < 200ms
- WorkOrder listesi p95 < 400ms (pagination 50 kayıt)
- Rate limit ihlali hariç hata oranı < %1
- İlk üretim PostgreSQL geçişinde veri kaybı/inkonsistans olmaması
- Audit tablosu 90 gün sonrası arşivlenebilir yapıda (partition veya offline dump)

## 1. Database Index Stratejisi
Önerilen indexler (Alembic migration set olarak eklenecek):
| Tablo | Sütun | Tip | Not |
|-------|-------|-----|-----|
| work_orders | wo_number | UNIQUE | Sorgu hızlandırma + benzersizlik |
| work_orders | status | INDEX | Durum filtreleri |
| work_orders | cari_code | INDEX | Cari bazlı liste |
| work_order_items | work_order_id | INDEX | JOIN performansı |
| cari | cari_code | UNIQUE | Tekil kimlik |
| motorbot | mb_code | UNIQUE | Tekil kimlik |
| audit_events | path | INDEX | Yönetim sorguları |
| audit_events | user_id | INDEX | Kullanıcı geçmişi |
| audit_events | created_at | INDEX | Tarih aralığı filtreleri |

Risk: Index sayısı artınca INSERT/UPDATE maliyeti; kritik olmayan path/resource kombinasyonlarında gereksiz index eklenmemeli.

## 2. Caching Katmanı
Aşamalar:
1. Uygulama içi in-memory TTL cache (Python dict + expiry) – Parametreler, Kurlar, Tarife listeleri.
2. Hazırlık: Redis adapter interface (`CacheBackend` sınıfı) – ileride drop-in replacement.
3. Politika Örnekleri:
   - Parametre kategori listesi: TTL 3600s
   - Kurlar latest rates: TTL 300s
   - Tarife aktif price list: TTL 900s
   - Audit son 50 satır admin paneli: TTL 30s (isteğe bağlı)
4. Invalidasyon: CRUD sonrası ilgili key silinsin.

## 3. Query Optimizasyonu
Adımlar:
- SQLAlchemy echo profil açma (geçici): `engine = create_engine(url, echo=False)` → profil modunda `True`
- N+1 taraması: relationship erişim patternleri (WorkOrder → Items → Hizmet)
- Eager load önerisi: `joinedload(WorkOrder.items)` sık erişilen composite endpointlerde.
- Sorgu Planı İnceleme: SQLite `EXPLAIN QUERY PLAN` / PostgreSQL geçiş sonrası `EXPLAIN ANALYZE`.

Checklist:
- [ ] WorkOrder list + items tek endpointte isteniyorsa eager load
- [ ] Motorbot + aktif sefer sayısı hesaplamasında COUNT alt sorgu mı aggregate mı?
- [ ] Audit tablosu raporlarında tarih aralığı + user_id filtre aynı index setini kullanıyor mu?

## 4. PostgreSQL Geçiş Planı
Aşamalar:
1. Şema farkları: `DateTime` timezone, `Numeric` yerine `Decimal`, `JSON` → `JSONB`.
2. Migration: Yeni connection string + Alembic revision (dialect uyarlaması yoksa direkt kullanılabilir).
3. Veri Taşıma:
   - Full export: `sqlite3 db .dump > dump.sql`
   - Temizlik: Transaction-specific meta tablolar çıkarılır.
   - Import: `psql -f dump.sql` (önce target şema temiz).
4. Doğrulama: Satır sayısı karşılaştırması + birkaç kritik sorguda sonuç eşleşmesi.
5. Connection Pooling: `pool_size=10`, `max_overflow=20`, `pool_recycle=1800`.

Riskler: TEXT vs VARCHAR limitleri, foreign key gecikmeleri, transaction isolation farkları.

## 5. Load & Stress Test Planı
Araç: k6
Senaryolar:
- Scenario A: WorkOrder CRUD 50 eş zamanlı kullanıcı (create + list + update + status change)
- Scenario B: GateLog giriş/çıkış 100 rps 5 dakika
- Scenario C: Login burst 30 rps 60 saniye (rate limit tetiklenmeli)
- Scenario D: Audit endpoint admin sorgusu sürekli (pagination farklı sayfalar)
Metrikler: p50, p95, hata oranı, throughput (req/s), CPU & bellek (dış izleme).

## 6. Background Jobs Genişletme
Mevcut: Günlük backup job 03:00.
Eklenmesi planlananlar:
- Kur güncelleme (TCMB) – 09:05 günlük
- Audit arşiv dökümü – Aylık (ay başı) → eski kayıtlar JSONL export
- Log cleanup – Haftalık (error/app log rotation sonrası ek temizlik)
- Rapor scheduler – İş emri aylık performans özetleri
- Notification queue (opsiyonel): Sefer gecikme alarmı.

## 7. Performance Profiling Rehberi
Backend:
- Pyinstrument kısa süreli profil (`pyinstrument -r html -m aliaport_api.main`)
- Uvicorn access log örnekleri + request id korelasyonu
- İşlev bazlı mikro optimizasyon: sık çağrılan string parse, tarih dönüşümleri.
Frontend:
- React Profiler: Interaction trace, commit süreleri
- Bundle analiz: `vite build --analysis` (plugin) → büyük bağımlılıklar tespiti
- Lazy load: Rota bazlı code-splitting, ikon sprite zaten optimize.

## 8. Riskler & Mitigasyon
| Risk | Etki | Mitigasyon |
|------|------|------------|
| PostgreSQL geçiş gecikmesi | Index & concurrency kazanımlarının ertelenmesi | Geçişi parçalı planla (yalnızca kritik tablolar önce) |
| Aşırı index ekleme | Yavaş write performansı | Ölçüm sonrası gereksiz index silme |
| Cache stale veri | Yanlış raporlama | CRUD sonrası invalidasyon + kısa TTL kritiklerde |
| Audit tablo büyümesi | Disk şişmesi ve sorgu yavaşlaması | Aylık arşiv + tarih index + partition (PostgreSQL) |

## 9. İlk Sprint (FAZ 5) Önerilen Sıra
1. Index migration taslağı
2. In-memory cache helper + parametreler entegrasyonu
3. Audit tablo sorgu profil + ek index doğrulaması
4. k6 temel senaryo script oluşturma (login + workorder list)
5. PostgreSQL geçiş iskelet dokümanı + örnek connection

## 10. Sonraki Dokümantasyon
- `FAZ5_INDEXES.md` (uygulanan indexler + sorgu örnekleri)
- `FAZ5_CACHE_STRATEGY.md` (TTL tablosu + invalidasyon akışı)
- `FAZ5_POSTGRES_MIGRATION.md` (adım adım geçiş)
- `FAZ5_K6_SCRIPTS/` (load test scriptleri)

---
Bu plan taslaktır; ilerleme ile revize edilecektir. Başlangıç onayı sonrası index ve cache uygulaması yapılacaktır.
