# Aliaport - Hızlı Kazançlar (Quick Wins)

## 🎯 Hemen Yapılabilecekler (Bu Hafta)

### 1. BaseEntity Pattern ✅

Tüm modellere ortak bir base ekleyelim:

```python
# backend/aliaport_api/domain/base.py
from sqlalchemy import Column, Integer, DateTime, Boolean, String
from sqlalchemy.sql import func
from datetime import datetime
from typing import Optional

class BaseEntity:
    """Tüm entity'lerin ortak özellikleri"""
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Audit fields
    created_at = Column(DateTime, nullable=False, default=func.now())
    created_by = Column(Integer, nullable=True)  # User FK gelecek
    updated_at = Column(DateTime, onupdate=func.now())
    updated_by = Column(Integer, nullable=True)
    
    # Soft delete
    is_active = Column(Boolean, nullable=False, default=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # Notlar
    notes = Column(String, nullable=True)
    
    @property
    def is_valid(self) -> bool:
        """Entity hala geçerli mi?"""
        return self.is_active and not self.is_deleted
```

**Kullanım**:
```python
# Cari modeli bunu extend etsin
class Cari(Base, BaseEntity):
    __tablename__ = "Cari"
    
    # Sadece Cari'ye özel alanlar
    Kod = Column(String(50), unique=True, nullable=False)
    Unvan = Column(String(200), nullable=False)
    # ...
```

### 2. Money Value Object 💰

Para tutarları için standart:

```python
# backend/aliaport_api/domain/value_objects.py
from decimal import Decimal
from enum import Enum
from dataclasses import dataclass

class Currency(str, Enum):
    TRY = "TRY"
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"

@dataclass(frozen=True)
class Money:
    amount: Decimal
    currency: Currency
    
    def __str__(self):
        return f"{self.amount:,.2f} {self.currency.value}"
    
    def to_dict(self):
        return {
            "amount": float(self.amount),
            "currency": self.currency.value,
            "formatted": str(self)
        }
```

**API Response'larda kullanım**:
```python
# Eski
{"total": 1500.50, "currency": "TRY"}

# Yeni
{"total": Money(Decimal("1500.50"), Currency.TRY).to_dict()}
# → {"amount": 1500.5, "currency": "TRY", "formatted": "1,500.50 TRY"}
```

### 3. Repository Pattern 📦

Database erişimi tek yerden:

```python
# backend/aliaport_api/infrastructure/repositories/base.py
from typing import Generic, TypeVar, List, Optional
from sqlalchemy.orm import Session

T = TypeVar('T')

class BaseRepository(Generic[T]):
    def __init__(self, db: Session, model: type[T]):
        self.db = db
        self.model = model
    
    def get_by_id(self, id: int) -> Optional[T]:
        return self.db.query(self.model).filter(
            self.model.id == id,
            self.model.is_deleted == False
        ).first()
    
    def get_all_active(self) -> List[T]:
        return self.db.query(self.model).filter(
            self.model.is_active == True,
            self.model.is_deleted == False
        ).all()
    
    def create(self, entity: T) -> T:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def soft_delete(self, id: int) -> bool:
        entity = self.get_by_id(id)
        if entity:
            entity.is_deleted = True
            entity.deleted_at = func.now()
            self.db.commit()
            return True
        return False
```

**Kullanım**:
```python
# Router'da
cari_repo = BaseRepository(db, Cari)
cari = cari_repo.get_by_id(123)
all_active = cari_repo.get_all_active()
```

### 4. API Versioning 🔢

```python
# backend/aliaport_api/main.py
from fastapi import APIRouter

# API v1
api_v1 = APIRouter(prefix="/api/v1")

api_v1.include_router(router_cari, prefix="/cari", tags=["Cari"])
api_v1.include_router(router_motorbot, prefix="/vessels", tags=["Vessels"])
# ...

app.include_router(api_v1)

# Gelecekte v2 eklenebilir
# api_v2 = APIRouter(prefix="/api/v2")
```

### 5. Error Handling Standardı ⚠️

```python
# backend/aliaport_api/infrastructure/exceptions.py
from fastapi import HTTPException, status

class AliaportException(Exception):
    """Base exception"""
    pass

class EntityNotFoundException(AliaportException):
    def __init__(self, entity_type: str, entity_id: int):
        self.message = f"{entity_type} with ID {entity_id} not found"
        super().__init__(self.message)

class ValidationException(AliaportException):
    def __init__(self, errors: dict):
        self.errors = errors
        super().__init__(str(errors))

# Exception handler
@app.exception_handler(EntityNotFoundException)
async def entity_not_found_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "NOT_FOUND",
            "message": exc.message,
            "timestamp": datetime.now().isoformat()
        }
    )
```

### 6. Logging Standardı 📝

```python
# backend/aliaport_api/config/logging_config.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    # Console handler
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    
    # File handler (rotates at 10MB)
    file_handler = RotatingFileHandler(
        'logs/aliaport.log',
        maxBytes=10*1024*1024,
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    
    # Format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Root logger
    root = logging.getLogger()
    root.setLevel(logging.DEBUG)
    root.addHandler(console)
    root.addHandler(file_handler)

# main.py'de
setup_logging()
logger = logging.getLogger(__name__)
```

### 7. Environment Variables 🔐

```python
# backend/aliaport_api/config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///../../database/aliaport.db"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Aliaport API"
    VERSION: str = "3.1.0"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Mikro Jump
    MIKRO_API_URL: str
    MIKRO_API_KEY: str
    
    # TCMB
    TCMB_API_KEY: str
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
```

**.env dosyası**:
```env
DATABASE_URL=postgresql://user:pass@localhost/aliaport
SECRET_KEY=your-secret-key-here
MIKRO_API_URL=https://api.mikrojump.com
MIKRO_API_KEY=xxx
TCMB_API_KEY=yyy
```

## 📊 Uygulama Planı

### Bugün (2 saat)
1. ✅ BaseEntity oluştur
2. ✅ Money value object ekle
3. ✅ .env file + Settings class

### Bu Hafta (1-2 gün)
1. BaseRepository implement et
2. Cari modülünü BaseEntity'ye geçir
3. API versioning ekle

### Gelecek Hafta
1. Tüm modülleri BaseEntity'ye geçir
2. Repository pattern her yerde kullan
3. Error handling standardize et

## 🎁 Bonus: Database Migration

**Alembic kurulumu**:
```bash
cd backend
pip install alembic
alembic init alembic
```

**İlk migration**:
```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

## 💡 Sonraki Seviye

Bu temeller atıldıktan sonra:
- CQRS pattern
- Event sourcing
- Domain-Driven Design
- Microservices (ileride)

---

**Önemli**: Bunları **kademeli** uygulayın. Her adımda test edin, sorun çıkarsa geri dönün.

Hangisinden başlayalım? 🚀
