# Aliaport - Migration Yönetimi Rehberi

## 📋 Kurulum Tamamlandı ✅

**Tarih**: 22 Kasım 2025  
**Durum**: Alembic migration sistemi aktif  
**Mevcut Versiyon**: `a7402674e1d7 (head)` - Initial schema

---

## 🎯 Ne Kuruldu?

### 1. Alembic Framework
```bash
pip install alembic  # v1.17.2
```

### 2. Migration Yapısı
```
backend/
├── alembic/
│   ├── versions/
│   │   └── a7402674e1d7_initial_schema_all_modules.py  # İlk snapshot
│   ├── env.py           # Auto-generate config
│   ├── script.py.mako   # Migration template
│   └── README
├── alembic.ini          # Alembic configuration
└── requirements.txt     # ✅ LOCKED (37 dependencies)
```

### 3. Locked Dependencies
- **Backend**: `requirements.txt` - 37 paket sürümlerle sabitlendi
- **Frontend**: `package-lock.json` - 236 paket sürümlerle sabitlendi

---

## 🚀 Kullanım Kılavuzu

### Yeni Migration Oluşturma

#### Otomatik (Önerilen)
Model değişikliği yaptınız → Alembic otomatik tespit eder:

```bash
cd backend
alembic revision --autogenerate -m "add email field to Cari"
```

**Örnek çıktı:**
```
Generating backend/alembic/versions/xxxx_add_email_field_to_cari.py ... done
```

#### Manuel
Özel SQL yazmak için:

```bash
alembic revision -m "custom index on work_order"
```

Sonra `versions/xxxx_custom_index.py` dosyasını düzenleyin:
```python
def upgrade():
    op.create_index('ix_wo_cari_status', 'work_order', ['cari_code', 'status'])

def downgrade():
    op.drop_index('ix_wo_cari_status')
```

---

### Migration Uygulama

#### En son versiyona upgrade
```bash
alembic upgrade head
```

#### Bir önceki versiyona geri dön
```bash
alembic downgrade -1
```

#### Belirli bir versiyona git
```bash
alembic upgrade a7402674e1d7
```

---

### Durum Kontrolü

#### Şu anki versiyon
```bash
alembic current
```

#### Migration geçmişi
```bash
alembic history
```

#### Uygulanmamış migration'lar
```bash
alembic history --verbose
```

---

## 📝 Gerçek Kullanım Senaryoları

### Senaryo 1: Yeni Field Ekleme

**Problem**: Cari tablosuna `Email` field'ı eklemek istiyorsunuz.

**Çözüm:**

1. **Model'i düzenle** (`backend/aliaport_api/modules/cari/models.py`):
```python
class Cari(Base):
    # ... existing fields ...
    Email = Column(String(100), nullable=True)  # YENİ FIELD
```

2. **Migration oluştur**:
```bash
alembic revision --autogenerate -m "add Email to Cari"
```

3. **Kontrol et** (`alembic/versions/xxxx_add_email_to_cari.py`):
```python
def upgrade():
    op.add_column('Cari', sa.Column('Email', sa.String(length=100), nullable=True))
```

4. **Uygula**:
```bash
alembic upgrade head
```

5. **Test et**:
```bash
# Backend'i restart et
uvicorn aliaport_api.main:app --reload
```

---

### Senaryo 2: Field İsmi Değiştirme

**Problem**: `CariTipi` → `TipKodu` olarak değiştirmek istiyorsunuz.

**Çözüm:**

1. **Model'i düzenle**:
```python
class Cari(Base):
    # CariTipi = Column(String(50))  # ESKİ
    TipKodu = Column(String(50))     # YENİ
```

2. **Migration oluştur**:
```bash
alembic revision --autogenerate -m "rename CariTipi to TipKodu"
```

3. **⚠️ DİKKAT**: Alembic rename yapamaz, manual düzelt:
```python
def upgrade():
    # Alembic bunu görmez:
    # op.add_column('Cari', sa.Column('TipKodu', ...))
    # op.drop_column('Cari', 'CariTipi')
    
    # Doğrusu (SQLite için):
    with op.batch_alter_table('Cari') as batch_op:
        batch_op.alter_column('CariTipi', new_column_name='TipKodu')

def downgrade():
    with op.batch_alter_table('Cari') as batch_op:
        batch_op.alter_column('TipKodu', new_column_name='CariTipi')
```

4. **Uygula ve test et**:
```bash
alembic upgrade head
```

---

### Senaryo 3: Yeni Tablo Ekleme

**Problem**: `CariAdres` tablosu oluşturmak istiyorsunuz.

**Çözüm:**

1. **Model oluştur** (`cari/models.py`):
```python
class CariAdres(Base):
    __tablename__ = "CariAdres"
    __table_args__ = {"extend_existing": True}
    
    Id = Column(Integer, primary_key=True)
    CariId = Column(Integer, ForeignKey("Cari.Id"), nullable=False)
    Adres = Column(Text, nullable=False)
    Sehir = Column(String(50))
    Ulke = Column(String(50))
    
    # Relation
    cari = relationship("Cari", back_populates="adresler")

# Cari model'e de ekle:
class Cari(Base):
    # ...
    adresler = relationship("CariAdres", back_populates="cari")
```

2. **env.py'ye ekle** (Alembic görebilmesi için):
```python
# alembic/env.py
from aliaport_api.modules.cari.models import Cari, CariAdres  # YENİ
```

3. **Migration oluştur**:
```bash
alembic revision --autogenerate -m "add CariAdres table"
```

4. **Uygula**:
```bash
alembic upgrade head
```

---

### Senaryo 4: Migration Geri Alma

**Problem**: Son migration'da hata yaptınız, geri almak istiyorsunuz.

**Çözüm:**

```bash
# 1. Geri al
alembic downgrade -1

# 2. Migration dosyasını sil
rm alembic/versions/xxxx_hatali_migration.py

# 3. Model'i düzelt
# ... kod düzeltmesi ...

# 4. Yeniden oluştur
alembic revision --autogenerate -m "correct migration"

# 5. Uygula
alembic upgrade head
```

---

## 🔧 Alembic Komutları - Hızlı Referans

| Komut | Açıklama | Örnek |
|-------|----------|-------|
| `alembic revision -m "msg"` | Manuel migration oluştur | `alembic revision -m "add index"` |
| `alembic revision --autogenerate -m "msg"` | Otomatik migration (model farkına göre) | `alembic revision --autogenerate -m "add Email"` |
| `alembic upgrade head` | En son versiyona upgrade | `alembic upgrade head` |
| `alembic upgrade +1` | Bir sonraki versiyona | `alembic upgrade +1` |
| `alembic downgrade -1` | Bir önceki versiyona | `alembic downgrade -1` |
| `alembic downgrade base` | İlk haline dön (tüm tablolar silinir!) | ⚠️ `alembic downgrade base` |
| `alembic current` | Şu anki versiyon | `alembic current` |
| `alembic history` | Migration geçmişi | `alembic history --verbose` |
| `alembic stamp head` | DB'yi manuel olarak "head" olarak işaretle | `alembic stamp head` |

---

## ⚠️ Önemli Notlar

### 1. SQLite Kısıtlamaları
SQLite bazı ALTER işlemlerini desteklemez:
- Column rename → `batch_alter_table` kullan
- Foreign key değişikliği → Tabloyu yeniden oluştur
- Column type değişikliği → Yeni column + veri kopyala + eski sil

### 2. Migration Önce, Deploy Sonra
```bash
# ❌ YANLIŞ: Önce deploy, sonra migration
# → Uygulama yeni field'ı kullanır ama DB'de yok → HATA

# ✅ DOĞRU: Önce migration, sonra deploy
alembic upgrade head  # Önce
# Sonra backend restart
```

### 3. Production'da Dikkat
```bash
# Migration uygulamadan önce BACKUP AL!
sqlite3 database/aliaport.db ".backup database/aliaport_backup_$(date +%Y%m%d).db"

# Sonra uygula
alembic upgrade head
```

### 4. Migration Dosyalarını Commit Et
```bash
git add backend/alembic/versions/xxxx_new_migration.py
git commit -m "feat: add Email field to Cari"
```

Takım arkadaşlarınız aynı migration'ı uygulayabilsin.

---

## 🎓 İleri Seviye

### Data Migration (Veri Dönüşümü)

Model değişikliği + veri güncellemesi aynı anda:

```python
# versions/xxxx_add_status_field.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    # 1. Yeni field ekle
    op.add_column('Cari', sa.Column('Status', sa.String(20), nullable=True))
    
    # 2. Mevcut verileri güncelle
    connection = op.get_bind()
    connection.execute(sa.text(
        "UPDATE Cari SET Status = 'ACTIVE' WHERE IsActive = 1"
    ))
    
    # 3. NOT NULL yap
    with op.batch_alter_table('Cari') as batch_op:
        batch_op.alter_column('Status', nullable=False)

def downgrade():
    op.drop_column('Cari', 'Status')
```

### Multi-Head Branches

Farklı feature'lar için ayrı migration branch'leri:

```bash
# Feature A
alembic revision -m "feature A changes" --head=head --branch-label=feature_a

# Feature B
alembic revision -m "feature B changes" --head=head --branch-label=feature_b

# Merge
alembic merge -m "merge A and B" feature_a feature_b
```

---

## 📚 Kaynaklar

- **Alembic Docs**: https://alembic.sqlalchemy.org/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **Migration Best Practices**: https://alembic.sqlalchemy.org/en/latest/cookbook.html

---

## 🎯 Sonraki Adımlar

1. ✅ **Alembic kuruldu**
2. ✅ **İlk snapshot alındı**
3. ✅ **Dependencies locked**
4. ⏳ **Yeni field ekle** (bu rehberi kullanarak test edin)
5. ⏳ **Production backup stratejisi** belirle
6. ⏳ **CI/CD pipeline'a migration ekleme**

---

## ♻️ Downgrade & Rollback Stratejisi (FAZ1 Eksikliği Tamamlandı ✅)

Production ortamında şema geriye alma işlemleri veri kaybı risklidir. Aşağıdaki adımlar standart rollback sürecidir.

### 1. Ön Hazırlık (Dry-Run)
```bash
# Mevcut versiyon kaydı
alembic current

# Uygulanmamış migration var mı?
alembic history --verbose | findstr "(head)"
```

### 2. Backup Alma (Zorunlu)
SQLite:
```bash
sqlite3 database/aliaport.db ".backup backups/database/manual/aliaport_before_downgrade_$(date +%Y%m%d_%H%M%S).db"
```
PostgreSQL (geçiş sonrası plan):
```bash
pg_dump --format=custom --file=aliaport_before_downgrade_$(date +%Y%m%d_%H%M%S).dump $DATABASE_URL
```

### 3. Hedef Versiyonu Belirleme
```bash
# Son 5 migration'ı listele
alembic history -n 5

# Belirli revision'a geri dönmek için not al (örn: a7402674e1d7)
```

### 4. Downgrade Uygulama
```bash
# Tek adım geri:
alembic downgrade -1

# Belirli rev'e geri:
alembic downgrade a7402674e1d7
```

### 5. Sağlık Kontrolü
```bash
# Uygulama start
uvicorn aliaport_api.main:app --reload

# Basit sorgu
sqlite3 database/aliaport.db "SELECT COUNT(*) FROM sqlite_master;"
```

### 6. Geri Alma (Rollback) / İleri Düzeltme
Eğer downgrade sonrası uygulama hata verirse:
```bash
# Backup'tan geri yükle (SQLite)
cp backups/database/manual/aliaport_before_downgrade_YYYYMMDD_HHMMSS.db database/aliaport.db

# Ardından tekrar upgrade
alembic upgrade head
```

### 7. Veri Dönüşümü İçeren Rollback
Schema ile birlikte riskli veri transformasyonu varsa:
1. Migration dosyasına tersine çevirme (downgrade) SQL'leri eklenmiş olmalı.
2. Büyük silme işlemleri yerine mantıksal (is_active flag) kullan.
3. Geri alma sonrası tutarlılık kontrol script'i çalıştır.
```bash
python scripts/consistency_check.py  # (ileride eklenecek)
```

### 8. CI/CD Entegrasyonu (Plan)
Pipeline adımları (öneri):
```yaml
- name: Record current revision
    run: alembic current
- name: Run migrations (upgrade)
    run: alembic upgrade head
- name: Smoke test
    run: pytest -q tests/smoke
```

### Risk Azaltma İlkeleri
- Downgrade işlemini yoğun kullanım dışı saatlerde yap.
- Her migration dosyasında downgrade tanımlı değilse production'a almadan ekle.
- Veri kaybı potansiyeli olan ALTER / DROP işlemlerinde önce soft strategy uygula.
- Tek seferde >2 adım downgrade yapmaktan kaçın.

Bu bölüm eklenerek FAZ1 "Downgrade stratejisi belirsiz" eksikliği kapatıldı.

---

**Hazırlayan**: GitHub Copilot  
**Tarih**: 22 Kasım 2025  
**Versiyon**: 1.0
