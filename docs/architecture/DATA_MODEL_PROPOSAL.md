# Aliaport Veri Modeli Mimarisi - Öneri Dokümanı

## 🎯 Hedef: Büyümeye Hazır Veri Mimarisi

### Mevcut Durum
- ❌ Her modül izole şema (Cari, Motorbot, Hizmet ayrı dünyalar)
- ❌ Cross-module ilişkiler zayıf
- ❌ Veri tutarlılığı garanti edilmiyor
- ❌ Audit trail yok

### Önerilen Yapı

#### 1. Domain-Driven Design (DDD) Yaklaşımı

```
aliaport_api/
├── domain/                    # İş mantığı katmanı
│   ├── entities/             # Core business entities
│   │   ├── base.py          # BaseEntity (id, created_at, updated_at, is_active)
│   │   ├── cari.py          # Cari domain entity
│   │   ├── vessel.py        # Motorbot/Vessel (daha profesyonel isim)
│   │   └── service.py       # Hizmet domain entity
│   │
│   ├── value_objects/        # Immutable değerler
│   │   ├── money.py         # Para birimi + tutar (EUR, USD, TRY)
│   │   ├── address.py       # Adres yapısı
│   │   └── contact.py       # İletişim bilgileri
│   │
│   ├── aggregates/           # İlişkili entity grupları
│   │   ├── work_order.py    # İş emri + kalemler aggregate
│   │   └── contract.py      # Kontrat + maddeler aggregate
│   │
│   └── services/             # Domain servisleri
│       ├── pricing.py       # Fiyatlama mantığı
│       └── invoicing.py     # Faturalama mantığı
│
├── application/              # Use case katmanı
│   ├── commands/            # Yazma operasyonları (CQRS)
│   │   ├── create_work_order.py
│   │   └── update_vessel.py
│   │
│   ├── queries/             # Okuma operasyonları (CQRS)
│   │   ├── get_active_contracts.py
│   │   └── list_vessels.py
│   │
│   └── events/              # Domain event'leri
│       ├── work_order_created.py
│       └── vessel_docked.py
│
├── infrastructure/           # Teknik detaylar
│   ├── persistence/
│   │   ├── repositories/   # Generic repository pattern
│   │   └── unit_of_work.py # Transaction yönetimi
│   │
│   ├── external/
│   │   ├── mikro_jump/     # ERP entegrasyonu
│   │   └── tcmb/           # Kur servisi
│   │
│   └── messaging/          # Event bus (gelecek)
│
└── presentation/            # API layer (mevcut modules/)
    └── api/
        └── v1/             # Versiyonlama
```

#### 2. Ortak Veri Standartları

**BaseEntity** - Tüm tablolar için:
```python
class BaseEntity:
    id: int (PK)
    uuid: UUID (External ID)
    created_at: datetime
    created_by: int (User FK)
    updated_at: datetime | None
    updated_by: int | None
    is_active: bool (Soft delete)
    is_deleted: bool
    deleted_at: datetime | None
    version: int (Optimistic locking)
```

**Money Value Object**:
```python
@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: Currency  # Enum: TRY, USD, EUR, GBP
    
    def convert_to(self, target_currency, rate):
        # Kur dönüşümü
```

**AuditLog Pattern**:
```python
# Her işlem kaydedilir
class AuditLog:
    entity_type: str
    entity_id: int
    action: str  # CREATE, UPDATE, DELETE
    old_value: JSON
    new_value: JSON
    user_id: int
    timestamp: datetime
```

#### 3. Mikro Jump Entegrasyonu İçin Adaptör Pattern

```python
# infrastructure/external/mikro_jump/adapter.py
class MikroJumpAdapter:
    """
    Aliaport → Mikro Jump veri dönüşümü
    """
    
    def map_cari(self, aliaport_cari: Cari) -> MikroCari:
        """Aliaport cari → Mikro cari"""
        
    def map_invoice(self, work_order: WorkOrder) -> MikroFatura:
        """İş emri → Mikro fatura"""
        
    def sync_exchange_rates(self) -> List[ExchangeRate]:
        """Mikro'dan kur çek"""
```

#### 4. Event-Driven Architecture (Gelecek Genişleme)

```python
# Örnek: İş emri oluşturulunca ne olsun?
@event_handler(WorkOrderCreated)
def on_work_order_created(event: WorkOrderCreated):
    # 1. Mikro Jump'a fatura gönder
    mikro_adapter.send_invoice(event.work_order_id)
    
    # 2. Müşteriye mail at
    email_service.send_confirmation(event.customer_email)
    
    # 3. Stok güncelle
    inventory_service.reserve_items(event.items)
```

## 📋 Öncelikli Adımlar

### Faz 1: Temeller (2-3 hafta)
- [ ] BaseEntity oluştur, tüm modeller extend etsin
- [ ] Money value object ekle
- [ ] AuditLog tablosu + middleware
- [ ] Repository pattern implementasyonu
- [ ] Unit of Work pattern

### Faz 2: Domain Modeli (3-4 hafta)
- [ ] Domain entities refactor
- [ ] Value objects tanımla
- [ ] Aggregate'leri belirle
- [ ] Domain servisleri yaz

### Faz 3: CQRS (2-3 hafta)
- [ ] Command handlers
- [ ] Query handlers
- [ ] Event system kurulumu

### Faz 4: Entegrasyonlar (3-4 hafta)
- [ ] Mikro Jump adapter
- [ ] TCMB kur servisi
- [ ] E-mail/SMS servisleri

## 🎨 Veri Akışı Örneği

**Senaryo**: Yeni iş emri oluştur

### Mevcut Hal (Sorunlu):
```
Frontend → POST /api/work-order 
         → router.py 
         → db.add(WorkOrder) 
         → commit()
```
**Sorunlar**:
- İş kuralları yok
- Fiyat hesaplama elle
- Mikro Jump senkronizasyonu manuel
- Hata durumunda rollback zor

### Önerilen Hal:
```
Frontend → POST /api/v1/work-orders
         ↓
API Layer → CreateWorkOrderCommand
         ↓
Application Layer → CreateWorkOrderHandler
         ├─ Domain validation
         ├─ Pricing calculation (domain service)
         ├─ Stock check
         ↓
Domain Layer → WorkOrder aggregate
         ↓
Infrastructure → Repository.save()
         ├─ DB transaction
         ├─ Audit log
         ├─ Event publish (WorkOrderCreated)
         ↓
Event Handlers → Mikro Jump sync
              → Email notification
              → Stock reservation
```

## 🔐 Güvenlik & Yetkilendirme

```python
# Role-Based Access Control (RBAC)
class Role(Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    ACCOUNTANT = "accountant"
    OPERATOR = "operator"
    VIEWER = "viewer"

class Permission:
    CARI_CREATE = "cari:create"
    WORK_ORDER_APPROVE = "work_order:approve"
    INVOICE_VIEW = "invoice:view"
    # ...

# Decorator ile endpoint koruma
@require_permission(Permission.WORK_ORDER_APPROVE)
async def approve_work_order(order_id: int):
    ...
```

## 📊 Database Migration Stratejisi

**SQLite → PostgreSQL**:
- [ ] Alembic migration setup
- [ ] Tüm modeller için migration'lar
- [ ] Test data migration scripti
- [ ] Rollback planı

**Index'ler**:
```sql
-- Performance için kritik index'ler
CREATE INDEX idx_work_order_status ON work_order(status, created_at);
CREATE INDEX idx_cari_kod ON cari(kod) WHERE is_active = true;
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id, created_at);
```

## 📈 Monitoring & Observability

```python
# Prometheus metrics
from prometheus_client import Counter, Histogram

work_order_created = Counter(
    'work_order_created_total',
    'Total work orders created'
)

api_latency = Histogram(
    'api_request_duration_seconds',
    'API request latency'
)
```

## 🧪 Testing Stratejisi

```
tests/
├── unit/              # Domain logic tests
├── integration/       # Database + API tests
├── e2e/              # Full flow tests
└── performance/      # Load tests
```

## 💡 Sonuç

Bu yapı:
✅ Ölçeklenebilir (10 kullanıcı → 1000 kullanıcı)
✅ Test edilebilir (Her katman izole test)
✅ Genişletilebilir (Yeni modül eklemek kolay)
✅ Bakımı kolay (İş kuralları tek yerde)
✅ Entegrasyon dostu (Adaptör pattern)

**Kritik Not**: Bu dönüşüm **kademeli** yapılmalı. Mevcut sistemi bozmadan, yeni modüller bu yapıda yazılır, eskiler zamanla refactor edilir.

---

**Soru**: Hangi faza başlamak istersiniz?
