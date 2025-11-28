# AUDIT MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Audit (Audit Trail / Event Logging)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** Security & Compliance Team  
**İlgili Modüller:** Tüm modüller (sistem geneli kayıt)  

---

## 🎯 Ne İşe Yarar?

Audit modülü, **sistem genelinde yapılan tüm işlemleri kayıt altına alır**. Her HTTP isteği, kullanıcı eylemi, veri değişikliği loglanır. KVKK uyumluluğu, güvenlik analizi ve hata ayıklama için kullanılır.

**Kullanım Senaryoları:**
- **HTTP İstek Kaydı:** Tüm API istekleri (method, path, status_code, duration)
- **Kullanıcı Eylemleri:** Login, logout, veri değişiklikleri
- **Veri Değişikliği:** Cari güncelleme, iş emri onay/red
- **Güvenlik:** Başarısız login denemeleri, yetki ihlalleri
- **Compliance:** KVKK için veri erişim kayıtları

**İş Akışı:**
```
HTTP İstek → FastAPI Middleware
      ↓
AuditEvent oluştur (user, method, path, IP, duration)
      ↓
Non-blocking kayıt (async)
      ↓
Database → audit_events tablosu
      ↓
Admin Panel → Audit log görüntüleme
```

---

## 🗂️ Veritabanı Yapısı

### Tablo: `audit_events`

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `id` | Integer | Primary Key | 1, 2, 3... |
| `user_id` | Integer | FK → User.Id (NULL=anonim) | 45 |
| `method` | String(10) | **HTTP method** | "GET", "POST", "PUT", "DELETE" |
| `path` | String(300) | **Request path** | "/api/cari/123" |
| `action` | String(50) | **İnferred action** | "cari:update", "isemri:approve" |
| `resource` | String(50) | **Resource** | "cari", "isemri", "motorbot" |
| `entity_id` | Integer | **Entity ID** (cari_id, wo_id vs.) | 123 |
| `status_code` | Integer | **HTTP status code** | 200, 201, 403, 500 |
| `duration_ms` | Integer | **İstek süresi (ms)** | 125 |
| `roles` | String(200) | Kullanıcı rolleri (virgülle ayrılmış) | "SISTEM_YONETICISI,MUHASEBE" |
| `ip` | String(64) | **IP adresi** | "192.168.1.100" |
| `user_agent` | String(300) | User-Agent header | "Mozilla/5.0..." |
| `extra` | JSON | **Ekstra bilgiler** (JSON) | `{"old_value": "A", "new_value": "B"}` |
| `created_at` | DateTime | **Kayıt zamanı** | 2025-11-25 08:00:00 |

**action Formatı:** `resource:action`
```
cari:read          → Cari okuma
cari:create        → Cari oluşturma
cari:update        → Cari güncelleme
isemri:approve     → İş emri onaylama
login:success      → Başarılı login
login:failed       → Başarısız login
```

**İndeksler:**
- `ix_audit_user_id`: (user_id) → Kullanıcı bazlı sorgular
- `ix_audit_path`: (path) → Path bazlı sorgular
- `ix_audit_action`: (action) → Action bazlı sorgular
- `ix_audit_resource`: (resource) → Resource bazlı sorgular
- `ix_audit_created_at`: (created_at) → Tarih bazlı sorgular

---

## 🔌 API Endpoints

### Base URL: `/api/audit`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/audit/events` | Audit log listesi (sayfalı, filtreleme) |
| GET | `/api/audit/events/by-user/{user_id}` | Kullanıcı bazlı kayıtlar |
| GET | `/api/audit/events/by-resource/{resource}` | Resource bazlı kayıtlar |
| GET | `/api/audit/events/{event_id}` | Audit event detayı |
| GET | `/api/audit/stats` | **İstatistikler (son 24 saat)** |
| GET | `/api/audit/failed-logins` | **Başarısız login denemeleri** |

---

## 💻 Kod Yapısı

**models.py:**
```python
class AuditEvent(Base):
    __tablename__ = "audit_events"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    method = Column(String(10), nullable=False)
    path = Column(String(300), index=True, nullable=False)
    action = Column(String(50), index=True, nullable=True)
    resource = Column(String(50), index=True, nullable=True)
    entity_id = Column(Integer, nullable=True)
    status_code = Column(Integer, nullable=False)
    duration_ms = Column(Integer, nullable=True)
    roles = Column(String(200), nullable=True)
    ip = Column(String(64), nullable=True)
    user_agent = Column(String(300), nullable=True)
    extra = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
```

**middleware.py - Audit Middleware:**
```python
from fastapi import Request
from time import time

async def audit_middleware(request: Request, call_next):
    """Her HTTP isteği için audit event oluştur"""
    start_time = time()
    
    # İsteği işle
    response = await call_next(request)
    
    # Süreyi hesapla
    duration_ms = int((time() - start_time) * 1000)
    
    # Kullanıcıyı al (varsa)
    user = getattr(request.state, "user", None)
    
    # Action ve resource çıkarımı
    action, resource, entity_id = infer_action_from_path(request.method, request.url.path)
    
    # AuditEvent oluştur (non-blocking)
    event = AuditEvent(
        user_id=user.Id if user else None,
        method=request.method,
        path=str(request.url.path),
        action=action,
        resource=resource,
        entity_id=entity_id,
        status_code=response.status_code,
        duration_ms=duration_ms,
        roles=",".join([r.name for r in user.roles]) if user else None,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    # Non-blocking kayıt (async)
    await persist_audit_event(event)
    
    return response

def infer_action_from_path(method: str, path: str):
    """Path'den action çıkarımı"""
    # Örnek: PUT /api/cari/123 → action="cari:update", resource="cari", entity_id=123
    parts = path.strip("/").split("/")
    
    if len(parts) >= 3 and parts[0] == "api":
        resource = parts[1]  # "cari"
        
        # Entity ID
        entity_id = None
        if len(parts) >= 3 and parts[2].isdigit():
            entity_id = int(parts[2])
        
        # Action mapping
        action_map = {
            "GET": "read",
            "POST": "create",
            "PUT": "update",
            "DELETE": "delete"
        }
        
        # Özel action'lar
        if len(parts) >= 4:
            if parts[3] == "approve":
                action = f"{resource}:approve"
            elif parts[3] == "reject":
                action = f"{resource}:reject"
            else:
                action = f"{resource}:{action_map.get(method, 'unknown')}"
        else:
            action = f"{resource}:{action_map.get(method, 'unknown')}"
        
        return action, resource, entity_id
    
    return None, None, None

async def persist_audit_event(event: AuditEvent):
    """Audit event'i asenkron kaydet"""
    try:
        db = SessionLocal()
        db.add(event)
        db.commit()
        db.close()
    except Exception as e:
        logger.error(f"Audit event kaydedilemedi: {e}")
```

**main.py - Middleware Ekleme:**
```python
from fastapi import FastAPI
from modules.audit.middleware import audit_middleware

app = FastAPI()

# Audit middleware ekle
app.middleware("http")(audit_middleware)
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel Audit Logging (Tamamlandı)
- ✅ AuditEvent modeli
- ✅ HTTP request logging
- ✅ Non-blocking kayıt (async)

### Faz 2: Action İnference (Tamamlandı)
- ✅ Path'den action çıkarımı
- ✅ Resource detection
- ✅ Entity ID extraction

### Faz 3: Veri Değişikliği Kaydı (Tamamlandı)
- ✅ extra field (JSON)
- ✅ old_value, new_value tracking

### Faz 4: Admin Panel (Planlanan)
- ⏳ Audit log görüntüleme ekranı
- ⏳ Filtreleme (user, resource, date range)
- ⏳ Export (CSV, Excel)

---

## 🔗 Diğer Modüllerle İlişkiler

**Tüm Modüller:**
- Her HTTP isteği → AuditEvent kaydı
- Veri değişikliği → extra field ile old/new value

**Auth Modülü:**
- Login başarı/başarısız → audit_events tablosu
- user_id → User.Id

---

## 📚 Kaynaklar

**İlgili Dosyalar:**
- `backend/aliaport_api/modules/audit/models.py`
- `backend/aliaport_api/modules/audit/middleware.py`
- `backend/aliaport_api/main.py` (middleware registration)

---

## 🐛 Bilinen Sorunlar ve Geliştirmeler

### Açık Sorunlar
1. **Performance:** Yüksek trafikte audit kayıtları DB yükü yaratabilir
2. **Retention:** Eski kayıtların otomatik silinmesi yok

### Gelecek Geliştirmeler
1. **Log Rotation:** 90 gün+ kayıtları arşivle/sil
2. **ElasticSearch:** Audit log'ları Elasticsearch'e aktar (arama performansı)
3. **Alerting:** Şüpheli aktivite uyarıları (çok sayıda başarısız login)

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 1.0  
**Audit Durum:** Middleware aktif ✅
