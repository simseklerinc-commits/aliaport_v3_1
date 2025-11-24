# RBAC (Role-Based Access Control) Kılavuzu

## İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Veri Modeli](#veri-modeli)
3. [Dependency Kullanımı](#dependency-kullanımı)
4. [Seed Script](#seed-script)
5. [Örnek Senaryolar](#örnek-senaryolar)
6. [Wildcard İzinler](#wildcard-izinler)
7. [OpenAPI Entegrasyonu](#openapi-entegrasyonu)

---

## Genel Bakış

Aliaport v3.1 RBAC sistemi, **User → Role → Permission** hiyerarşisi kullanarak ince taneli erişim kontrolü sağlar.

### Temel Kavramlar
- **User**: Sisteme giriş yapan kullanıcı (email, password, roles)
- **Role**: Görev tanımı (SISTEM_YONETICISI, OPERASYON, FINANS, GUVENLIK, READONLY)
- **Permission**: Kaynak üzerinde eylem (örn: `cari:write`, `workorder:approve`, `admin:*`)

### İlişkiler
```
User (N) ←→ (M) Role (N) ←→ (M) Permission
```

---

## Veri Modeli

### Permission Yapısı
```python
Permission(
    name="cari:write",        # Benzersiz tanımlayıcı (resource:action)
    resource="cari",          # Kaynak adı
    action="write",           # Eylem (read, write, delete, approve, *, vb.)
    description="Cari oluşturma ve güncelleme"
)
```

### Örnek Permission Setleri

#### Cari Modülü
- `cari:read` - Cari kayıtlarını görüntüleme
- `cari:write` - Cari oluşturma ve güncelleme
- `cari:delete` - Cari silme

#### İş Emri Modülü
- `workorder:read`
- `workorder:write`
- `workorder:delete`
- `workorder:approve` - İş emri onaylama (özel)

#### Admin Wildcard
- `admin:*` - Tüm admin işlemleri (role assignment, config changes)

---

## Dependency Kullanımı

### 1. Role-Based Access (`require_role`)

**Kullanıcının belirli bir role sahip olmasını** kontrol eder.

#### Basit Kullanım
```python
from aliaport_api.modules.auth.dependencies import require_role

@router.get(
    "/admin/users",
    dependencies=[Depends(require_role(["SISTEM_YONETICISI"]))]
)
async def list_users():
    ...
```

#### Çoklu Rol (OR mantığı)
```python
@router.post(
    "/workorders/approve",
    dependencies=[Depends(require_role(["SISTEM_YONETICISI", "OPERASYON"]))]
)
async def approve_workorder():
    # SISTEM_YONETICISI VEYA OPERASYON rolü yeterli
    ...
```

#### Hata Yanıtı (403)
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "Gerekli rol yok",
    "details": {
      "required_roles": ["SISTEM_YONETICISI"],
      "user_roles": ["OPERASYON", "FINANS"]
    }
  }
}
```

---

### 2. Permission-Based Access (`require_permission`)

**İnce taneli izin kontrolü** - kaynak ve eylem bazında.

#### Tek İzin
```python
from aliaport_api.modules.auth.dependencies import require_permission

@router.post(
    "/cari",
    dependencies=[Depends(require_permission("cari", "write"))]
)
async def create_cari():
    # cari:write iznine sahip herkes erişebilir
    ...
```

#### Çoklu İzin (ANY mantığı)
```python
@router.get(
    "/dashboard/admin",
    dependencies=[Depends(require_permission("admin", "read,write", allow_any=True))]
)
async def admin_dashboard():
    # admin:read VEYA admin:write yeterli
    ...
```

#### Çoklu İzin (ALL mantığı)
```python
@router.delete(
    "/critical-data",
    dependencies=[Depends(require_permission("admin", "write,delete", allow_any=False))]
)
async def delete_critical():
    # admin:write VE admin:delete gerekli
    ...
```

#### Wildcard Desteği
```python
# Admin rolüne admin:* permission atanmışsa, tüm admin:* permission'lar eşleşir
@router.post(
    "/admin/config",
    dependencies=[Depends(require_permission("admin", "write"))]
)
async def update_config():
    # admin:* sahibi kullanıcılar erişebilir
    ...
```

#### Hata Yanıtı (403)
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "İzin eksik",
    "details": {
      "required_permissions": ["cari:write"],
      "user_permissions": ["cari:read", "workorder:read"],
      "mode": "all"
    }
  }
}
```

---

## Seed Script

### Çalıştırma
```bash
cd backend
python -m aliaport_api.modules.auth.seed_permissions
```

### Varsayılan Roller ve İzinleri

#### SISTEM_YONETICISI
- İzinler: `admin:*` (wildcard - her şey)
- Kullanım: Tam yetkili yönetici

#### OPERASYON
- İzinler: 
  - `cari:read`, `cari:write`
  - `workorder:read`, `workorder:write`, `workorder:approve`
  - `sefer:read`, `sefer:write`
  - `barinma:read`, `barinma:write`, `barinma:approve`
  - `motorbot:read`, `motorbot:write`
  - `reports:read`, `reports:export`
- Kullanım: İş emri, sefer, barınma yönetimi

#### FINANS
- İzinler:
  - `cari:read`, `cari:write`
  - `tarife:read`, `tarife:write`
  - `workorder:read`
  - `reports:read`, `reports:export`
- Kullanım: Cari, tarife, fatura işlemleri

#### GUVENLIK
- İzinler:
  - `security:read`, `security:write`, `security:gate`
  - `barinma:read`
  - `sefer:read`
- Kullanım: Gate giriş/çıkış, güvenlik logları

#### READONLY
- İzinler: Tüm modüllerde `*:read`
- Kullanım: Salt okuma yetkisi

---

## Örnek Senaryolar

### Senaryo 1: Yeni Kullanıcı + Rol Atama
```python
# 1. Kullanıcı oluştur (POST /auth/users)
{
  "email": "ali.veli@aliaport.com",
  "password": "SecurePass123!",
  "full_name": "Ali Veli",
  "is_active": true
}

# 2. Role ata (POST /auth/admin/roles/assign)
POST /auth/admin/roles/assign?user_id=5&role_id=2
# -> OPERASYON rolü atanır
```

### Senaryo 2: Özel Permission Kontrolü
```python
@router.post(
    "/workorders/{wo_id}/invoice",
    dependencies=[Depends(require_permission("workorder", "approve"))]
)
async def create_invoice_from_workorder(wo_id: int):
    # Sadece workorder:approve iznine sahip kullanıcılar faturalaştırabilir
    ...
```

### Senaryo 3: Dinamik Permission Ekleme
```python
from aliaport_api.modules.auth.models import Permission, Role

# Yeni permission tanımla
new_perm = Permission(
    name="barinma:cancel",
    resource="barinma",
    action="cancel",
    description="Barınma kontratı iptal etme"
)
db.add(new_perm)
db.commit()

# OPERASYON rolüne ekle
operasyon_role = db.query(Role).filter(Role.name == "OPERASYON").first()
operasyon_role.permissions.append(new_perm)
db.commit()
```

---

## Wildcard İzinler

### Wildcard Tanımı
`action="*"` ile tüm eylemleri kapsayan izin:
```python
Permission(
    name="admin:*",
    resource="admin",
    action="*",
    description="Tüm admin işlemleri"
)
```

### Wildcard Eşleştirme Mantığı
```python
# Kullanıcının admin:* izni var
user_permissions = {"admin:*", "cari:read"}

# Aşağıdaki tüm kontroller BAŞARILI:
require_permission("admin", "read")    # admin:* matches admin:read
require_permission("admin", "write")   # admin:* matches admin:write
require_permission("admin", "delete")  # admin:* matches admin:delete
require_permission("cari", "read")     # Direct match
```

### Kullanım Önerisi
- **Superuser bypass**: `is_superuser=True` her kontrolü atlar
- **Wildcard**: Genelde sadece admin rolü için (`admin:*`)
- **Özel izinler**: Kritik işlemler için ayrı permission (`workorder:approve`, `barinma:cancel`)

---

## OpenAPI Entegrasyonu

### Endpoint Dokümantasyonu
```python
@router.post(
    "/cari",
    dependencies=[Depends(require_permission("cari", "write"))],
    responses={
        201: {"description": "Cari başarıyla oluşturuldu"},
        403: {
            "description": "İzin eksik",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": {
                            "code": "AUTH_INSUFFICIENT_PERMISSIONS",
                            "message": "İzin eksik",
                            "details": {
                                "required_permissions": ["cari:write"],
                                "user_permissions": ["cari:read"],
                                "mode": "all"
                            }
                        }
                    }
                }
            }
        }
    },
    summary="Yeni cari oluştur",
    description="cari:write iznine sahip kullanıcılar yeni cari kaydı oluşturabilir."
)
```

### Swagger UI Görünümü
- **Security**: Bearer token (JWT) ile otomatik gönderilir
- **403 Response**: Örnek hata payloadları gösterilir
- **Description**: Gerekli rol/permission belirtilir

---

## En İyi Pratikler

1. **Superuser için bypass**: `is_superuser=True` kullanıcılar tüm kontrolleri atlar
2. **Role vs Permission**:
   - **Role**: Genel kategorilendirme (OPERASYON, FINANS)
   - **Permission**: İnce taneli kontrol (cari:write, workorder:approve)
3. **Wildcard dikkatli kullan**: Sadece admin rolü için `admin:*`
4. **Seed script düzenli çalıştır**: Yeni permission eklendiğinde seed'i güncelle
5. **OpenAPI examples ekle**: Her permission-based endpoint için 403 response example

---

## Debugging

### Kullanıcının İzinlerini Kontrol Et
```python
GET /auth/admin/permissions/check
Authorization: Bearer <access_token>

# Response:
{
  "success": true,
  "data": {
    "user_id": 5,
    "email": "ali.veli@aliaport.com",
    "roles": ["OPERASYON"],
    "permissions": [
      "cari:read", "cari:write",
      "workorder:read", "workorder:write", "workorder:approve",
      "sefer:read", "sefer:write"
    ],
    "is_superuser": false
  }
}
```

### Permission Eşleşmeme Durumu
```python
# Kullanıcı sadece cari:read iznine sahip
# Endpoint: require_permission("cari", "write")

# 403 Response:
{
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "details": {
      "required_permissions": ["cari:write"],
      "user_permissions": ["cari:read", "workorder:read"],
      "mode": "all"
    }
  }
}
```

---

## Sonraki Adımlar

1. **Frontend RoleBoundary**: Component seviyesinde rol/permission kontrolü
2. **Permission caching**: Redis ile kullanıcı izin setlerini cache'le
3. **Audit logging**: İzin reddedilme olaylarını logla
4. **Dynamic permissions**: Kullanıcı bazlı özel permission override

---

**Hazırlayan**: Aliaport Dev Team  
**Tarih**: 2025-01-20  
**Versiyon**: 1.0.0
