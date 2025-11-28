# AUTH MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Auth (Authentication & Authorization)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready (JWT + RBAC)  
**Sorumlu Ekip:** Security & Backend Team  
**İlgili Modüller:** Tüm modüller (sistem geneli kimlik doğrulama)  

---

## 🎯 Ne İşe Yarar?

Auth modülü, **kullanıcı kimlik doğrulama ve yetkilendirme** sistemini yönetir. JWT token bazlı authentication ve RBAC (Role-Based Access Control) ile izin yönetimi sağlar.

**Kullanım Senaryoları:**
- **Login:** Email + password ile giriş, JWT token üretimi
- **RBAC:** Rol bazlı yetkilendirme (SISTEM_YONETICISI, PERSONEL, PORTAL_KULLANICI)
- **Permission Check:** resource:action formatında izin kontrolü
- **Password Reset:** Güvenli şifre sıfırlama (token bazlı)
- **Portal Auth:** Admin-created kullanıcılar (self-registration yok)

**İş Akışı:**
```
Kullanıcı → Email + Password
      ↓
Login Endpoint → JWT token üretimi
      ↓
Frontend → Token ile API istekleri (Authorization header)
      ↓
Backend → Token doğrulama + izin kontrolü
      ↓
İzin var → İşlem yapılır / İzin yok → 403 Forbidden
```

---

## 🗂️ Veritabanı Yapısı

### Tablo 1: `User` (Kullanıcılar)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `email` | String(255) | **Email (unique)** | "ahmet@aliaport.com" |
| `hashed_password` | String(255) | **Şifre (bcrypt hash)** | "$2b$12$..." |
| `full_name` | String(200) | Tam adı | "Ahmet Yılmaz" |
| `is_active` | Boolean | **Aktif mi?** | True |
| `is_superuser` | Boolean | **Süper kullanıcı mı?** | False |
| `cari_id` | Integer | FK → Cari.Id (portal kullanıcı) | 45 |
| `created_at` | DateTime | Kayıt zamanı | 2025-01-01 10:00:00 |
| `updated_at` | DateTime | Son güncelleme | 2025-02-01 14:30:00 |
| `last_login_at` | DateTime | Son giriş | 2025-11-25 08:00:00 |

**Kullanıcı Tipleri:**
```
is_superuser=True  → Sistem yöneticisi (tüm izinler)
cari_id=NULL       → İç personel (Aliaport çalışanı)
cari_id=45         → Portal kullanıcı (müşteri firması)
```

---

### Tablo 2: `Role` (Roller)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `name` | String(100) | **Rol adı (unique)** | "SISTEM_YONETICISI" |
| `description` | Text | Açıklama | "Tüm sistem yetkilerine sahip" |
| `is_active` | Boolean | Aktif mi? | True |
| `created_at` | DateTime | Kayıt zamanı | 2025-01-01 10:00:00 |

**Standart Roller:**
```
SISTEM_YONETICISI    → Tüm yetkiler
MUHASEBE             → Fatura, ödeme, kurlar
OPERASYON_MUDURU     → İş emri, sefer, motorbot
PERSONEL             → Kısıtlı yetkiler (sadece okuma)
PORTAL_KULLANICI     → Sadece kendi iş emri talepleri
SAHA_PERSONELI       → WorkLog oluşturma
GUVENLIK_PERSONELI   → GateLog oluşturma
```

---

### Tablo 3: `Permission` (İzinler)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `resource` | String(50) | **Kaynak** | "cari", "isemri", "motorbot" |
| `action` | String(50) | **Aksiyon** | "read", "create", "update", "delete" |
| `description` | Text | Açıklama | "Cari kayıtlarını okuma yetkisi" |
| `created_at` | DateTime | Kayıt zamanı | 2025-01-01 10:00:00 |

**İzin Formatı:** `resource:action`
```
cari:read          → Cari kayıtlarını okuma
cari:create        → Yeni cari oluşturma
isemri:approve     → İş emri onaylama
kurlar:update      → Kur güncelleme
worklog:approve    → WorkLog onaylama
```

**Permission Örnekleri:**
```
SISTEM_YONETICISI rolü:
  - cari:*        (tüm cari işlemleri)
  - isemri:*      (tüm iş emri işlemleri)
  - kurlar:*      (tüm kur işlemleri)
  - ...

PORTAL_KULLANICI rolü:
  - isemri:read   (sadece kendi iş emirlerini okuma)
  - isemri:create (iş emri talebi oluşturma)
```

---

### Tablo 4: `user_roles` (Many-to-Many: User ↔ Role)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `user_id` | Integer | FK → User.Id |
| `role_id` | Integer | FK → Role.Id |

---

### Tablo 5: `role_permissions` (Many-to-Many: Role ↔ Permission)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `role_id` | Integer | FK → Role.Id |
| `permission_id` | Integer | FK → Permission.Id |

---

### Tablo 6: `PasswordResetToken` (Şifre Sıfırlama)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `user_id` | Integer | FK → User.Id | 45 |
| `token` | String(255) | **Reset token (unique)** | "abc123def456..." |
| `expires_at` | DateTime | **Token geçerlilik süresi** | 2025-11-25 10:00:00 |
| `is_used` | Boolean | Kullanıldı mı? | False |
| `created_at` | DateTime | Kayıt zamanı | 2025-11-25 08:00:00 |

**Token Geçerlilik:** 1 saat (expires_at)

---

## 🔌 API Endpoints

### Base URL: `/api/auth`

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/login` | **Login (JWT token üretimi)** |
| POST | `/api/auth/refresh` | Token yenileme |
| POST | `/api/auth/logout` | Logout (token iptal) |
| GET | `/api/auth/me` | **Mevcut kullanıcı bilgisi** |
| POST | `/api/auth/register` | **Admin-only user creation** |
| POST | `/api/auth/forgot-password` | Şifre sıfırlama talebi |
| POST | `/api/auth/reset-password` | Şifre sıfırlama (token ile) |
| PUT | `/api/auth/change-password` | Şifre değiştirme |
| GET | `/api/auth/users` | Kullanıcı listesi (Admin) |
| PUT | `/api/auth/users/{user_id}/activate` | Kullanıcı aktif/pasif |

---

## 💻 Kod Yapısı

**models.py - User Model:**
```python
class User(Base):
    __tablename__ = "users"
    
    Id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    cari_id = Column(Integer, ForeignKey("Cari.Id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)
    
    # İlişkiler
    roles = relationship("Role", secondary="user_roles", back_populates="users")
    cari = relationship("Cari", back_populates="users")
    
    def has_permission(self, permission_str: str) -> bool:
        """İzin kontrolü: 'cari:read' formatında"""
        if self.is_superuser:
            return True
        
        resource, action = permission_str.split(":")
        
        for role in self.roles:
            for perm in role.permissions:
                if perm.resource == resource and (perm.action == action or perm.action == "*"):
                    return True
        
        return False
```

**router.py - Login:**
```python
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

@router.post("/login")
def login(email: str, password: str):
    """Login endpoint"""
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    
    if not user or not pwd_context.verify(password, user.hashed_password):
        raise HTTPException(401, "Email veya şifre hatalı")
    
    # JWT token üret
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.Id},
        expires_delta=access_token_expires
    )
    
    # Son giriş zamanını güncelle
    user.last_login_at = datetime.now()
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "Id": user.Id,
            "email": user.email,
            "full_name": user.full_name,
            "is_superuser": user.is_superuser,
            "roles": [role.name for role in user.roles]
        }
    }

def create_access_token(data: dict, expires_delta: timedelta = None):
    """JWT token oluştur"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    """JWT token'dan kullanıcı getir"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(401, "Token geçersiz")
    except JWTError:
        raise HTTPException(401, "Token geçersiz")
    
    user = db.query(User).filter(User.Id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(401, "Kullanıcı bulunamadı veya aktif değil")
    
    return user
```

**Permission Decorator:**
```python
def require_permission(permission: str):
    """İzin kontrolü decorator"""
    def decorator(func):
        def wrapper(*args, user: User = Depends(get_current_user), **kwargs):
            if not user.has_permission(permission):
                raise HTTPException(403, f"Bu işlem için '{permission}' yetkisine sahip değilsiniz")
            return func(*args, user=user, **kwargs)
        return wrapper
    return decorator

# Kullanım
@router.post("/api/cari/")
@require_permission("cari:create")
def create_cari(data: CariCreate, user: User = Depends(get_current_user)):
    # ...
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: JWT Authentication (Tamamlandı)
- ✅ Login endpoint
- ✅ JWT token üretimi (python-jose)
- ✅ Password hashing (bcrypt)
- ✅ get_current_user dependency

### Faz 2: RBAC (Tamamlandı)
- ✅ User, Role, Permission modelleri
- ✅ Many-to-many ilişkiler (user_roles, role_permissions)
- ✅ has_permission() metodu
- ✅ require_permission() decorator

### Faz 3: Password Reset (Tamamlandı)
- ✅ PasswordResetToken modeli
- ✅ forgot-password endpoint
- ✅ Email gönderimi (SMTP2GO)
- ✅ reset-password endpoint (token ile)

### Faz 4: Portal Kullanıcı (Planlanan)
- ⏳ Admin-created users (self-registration yok)
- ⏳ cari_id bağlantısı
- ⏳ Portal özel izinler

---

## 🔗 Diğer Modüllerle İlişkiler

**Tüm Modüller:**
- Her endpoint → get_current_user() ile kimlik doğrulama
- İzin kontrolü → require_permission("resource:action")
- Portal kullanıcı → cari_id ile Cari modülü bağlantısı

---

## 📚 Kaynaklar

**İlgili Dosyalar:**
- `backend/aliaport_api/modules/auth/models.py`
- `backend/aliaport_api/modules/auth/router.py`
- `backend/aliaport_api/core/security.py`

**İlgili Runbook'lar:**
- `04_MODUL_ISEMRI.md`: Portal kullanıcı izinleri

---

## 🐛 Bilinen Sorunlar ve Geliştirmeler

### Açık Sorunlar
1. **Password Reset Email:** SMTP konfigürasyonu yapılmadı
2. **2FA:** İki faktörlü kimlik doğrulama yok

### Gelecek Geliştirmeler
1. **2FA:** TOTP bazlı 2FA (Google Authenticator)
2. **Session Management:** Aktif session listesi, remote logout
3. **OAuth:** Google/Microsoft OAuth entegrasyonu (gelecek)

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 1.0  
**Auth Durum:** JWT + RBAC aktif ✅
