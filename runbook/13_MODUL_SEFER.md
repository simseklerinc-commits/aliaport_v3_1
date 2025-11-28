# SEFER (MbTrip) MODÜLÜ - Teknik Dokümantasyon

## 📋 Modül Özeti

**Modül Adı:** Sefer (MbTrip - Voyage Management)  
**Versiyon:** 3.1.0  
**Durum:** ✅ Production Ready  
**Sorumlu Ekip:** Operations Team  
**İlgili Modüller:** Motorbot, Cari  
**Not:** `/api/mb-trip` (legacy endpoint, `02_MODUL_MOTORBOT.md`'de detaylı dokümante edildi)

---

## 🎯 Ne İşe Yarar?

Sefer modülü, **motorbot seferlerini (voyage)** yönetir. Her sefer bir motorbotun belirli bir tarih/saat aralığında yaptığı operasyonel işi temsil eder. Cari (müşteri) ile ilişkilendirilir.

**Kullanım Senaryoları:**
- **Sefer Planlama:** Motorbot M-123, 25.11.2025 08:00-10:00 arası gemi çekme
- **Müşteri İlişkisi:** ABC Denizcilik için sefer
- **Durum Takibi:** PLANLANDI → DEVAM_EDIYOR → TAMAMLANDI → FATURALANDI
- **Çakışma Kontrolü:** Aynı motorbot aynı saatte 2 sefer yapamaz

**İş Akışı:**
```
Motorbot Seçimi + Müşteri Seçimi
      ↓
Sefer Oluştur (Tarih, Saat, Durum=PLANLANDI)
      ↓
Sefer Başladı (DEVAM_EDIYOR)
      ↓
Sefer Bitti (TAMAMLANDI)
      ↓
Fatura Kesildi (FATURALANDI)
```

---

## 🗂️ Veritabanı Yapısı

### Tablo: `mb_trip` (Motorbot Sefer)

| Alan | Tip | Açıklama | Örnek |
|------|-----|----------|-------|
| `Id` | Integer | Primary Key | 1, 2, 3... |
| `MotorbotId` | Integer | FK → Motorbot.Id | 5 |
| `CariId` | Integer | FK → Cari.Id (müşteri) | 45 |
| `TripStartDate` | DateTime | **Sefer başlangıç** | 2025-11-25 08:00:00 |
| `TripEndDate` | DateTime | **Sefer bitiş** | 2025-11-25 10:00:00 |
| `Status` | String(20) | **Durum** | "PLANLANDI", "DEVAM_EDIYOR", "TAMAMLANDI", "FATURALANDI" |
| `Notes` | Text | Notlar | "M/V NEPTUNE çekme işlemi" |
| `CreatedAt` | DateTime | Kayıt zamanı | 2025-11-24 14:00:00 |
| `UpdatedAt` | DateTime | Son güncelleme | 2025-11-25 10:05:00 |
| `CreatedBy` | Integer | FK → User.Id | 3 |
| `UpdatedBy` | Integer | FK → User.Id | 5 |

**Status Enum:**
```
PLANLANDI      → Sefer planlandı
DEVAM_EDIYOR   → Sefer devam ediyor
TAMAMLANDI     → Sefer tamamlandı
FATURALANDI    → Fatura kesildi
IPTAL          → İptal edildi
```

**N+1 Query Önleme:**
```python
# Motorbot.trips ilişkisi lazy="raise" ile tanımlı
# Explicit eager loading zorunlu:
motorbot = db.query(Motorbot).options(selectinload(Motorbot.trips)).first()
```

---

## 🔌 API Endpoints

### Base URL: `/api/mb-trip` (Legacy)

**Not:** Bu endpoint `02_MODUL_MOTORBOT.md`'de detaylı dokümante edildi. Özet:

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/mb-trip/` | Sefer listesi |
| GET | `/api/mb-trip/by-motorbot/{motorbot_id}` | Motorbot bazlı seferler |
| GET | `/api/mb-trip/by-cari/{cari_id}` | Müşteri bazlı seferler |
| GET | `/api/mb-trip/{trip_id}` | Sefer detayı |
| POST | `/api/mb-trip/` | Yeni sefer oluştur |
| PUT | `/api/mb-trip/{trip_id}` | Sefer güncelle |
| PUT | `/api/mb-trip/{trip_id}/start` | Sefer başlat (DEVAM_EDIYOR) |
| PUT | `/api/mb-trip/{trip_id}/complete` | Sefer tamamla (TAMAMLANDI) |
| DELETE | `/api/mb-trip/{trip_id}` | Sefer sil |
| POST | `/api/mb-trip/check-conflict` | **Çakışma kontrolü** |

---

## 💻 Kod Yapısı

**models.py:**
```python
# Motorbot model içinde tanımlı (02_MODUL_MOTORBOT.md'ye bakınız)

class Motorbot(Base):
    # ...
    trips = relationship(
        "MbTrip",
        back_populates="motorbot",
        lazy="raise"  # N+1 önleme
    )

class MbTrip(Base):
    __tablename__ = "mb_trip"
    
    Id = Column(Integer, primary_key=True)
    MotorbotId = Column(Integer, ForeignKey("motorbot.Id"), nullable=False)
    CariId = Column(Integer, ForeignKey("Cari.Id"), nullable=False)
    TripStartDate = Column(DateTime, nullable=False)
    TripEndDate = Column(DateTime, nullable=False)
    Status = Column(String(20), default="PLANLANDI")
    Notes = Column(Text, nullable=True)
    
    CreatedAt = Column(DateTime, default=func.now())
    UpdatedAt = Column(DateTime, onupdate=func.now())
    CreatedBy = Column(Integer, ForeignKey("User.Id"))
    UpdatedBy = Column(Integer, ForeignKey("User.Id"))
    
    # İlişkiler
    motorbot = relationship("Motorbot", back_populates="trips")
    cari = relationship("Cari", back_populates="trips")
```

**Çakışma Kontrolü:**
```python
def check_trip_conflict(motorbot_id: int, start_date: datetime, end_date: datetime, exclude_trip_id: int = None):
    """Aynı motorbot aynı saatte 2 sefer yapamaz"""
    query = db.query(MbTrip).filter(
        MbTrip.MotorbotId == motorbot_id,
        MbTrip.Status.in_(["PLANLANDI", "DEVAM_EDIYOR"]),
        or_(
            # Yeni sefer mevcut seferin içine düşüyor
            and_(MbTrip.TripStartDate <= start_date, MbTrip.TripEndDate >= start_date),
            # Yeni sefer mevcut seferi kapsıyor
            and_(MbTrip.TripStartDate >= start_date, MbTrip.TripEndDate <= end_date),
            # Yeni sefer mevcut seferin başlangıcına denk geliyor
            and_(MbTrip.TripStartDate <= end_date, MbTrip.TripEndDate >= end_date)
        )
    )
    
    if exclude_trip_id:
        query = query.filter(MbTrip.Id != exclude_trip_id)
    
    conflict = query.first()
    
    if conflict:
        raise HTTPException(400, f"Çakışma: {conflict.motorbot.Adi} zaten {conflict.TripStartDate} - {conflict.TripEndDate} arası seferde")
    
    return True
```

---

## 🔧 Geliştirme Geçmişi

### Faz 1: Temel Sefer Yönetimi (Tamamlandı)
- ✅ MbTrip CRUD
- ✅ Motorbot, Cari ilişkileri
- ✅ Status state machine

### Faz 2: Çakışma Kontrolü (Tamamlandı)
- ✅ Tarih/saat çakışma kontrolü
- ✅ `/check-conflict` endpoint

### Faz 3: N+1 Query Önleme (Tamamlandı)
- ✅ lazy="raise" ile explicit eager loading
- ✅ selectinload/joinedload stratejileri

### Faz 4: Frontend Timeline (Planlanan)
- ⏳ Sefer timeline görünümü (Gantt chart)
- ⏳ Drag & drop sefer planlama

---

## 🔗 Diğer Modüllerle İlişkiler

### Motorbot Modülü
```sql
MbTrip.MotorbotId → Motorbot.Id
```

### Cari Modülü
```sql
MbTrip.CariId → Cari.Id
```

### İş Emri Modülü
```sql
WorkOrder.wo_type = 'MOTORBOT' → MbTrip referansı
```

---

## 📚 Kaynaklar

**İlgili Dosyalar:**
- `backend/aliaport_api/modules/motorbot/models.py`
- `backend/aliaport_api/modules/sefer/router.py`

**İlgili Runbook'lar:**
- `02_MODUL_MOTORBOT.md`: **Ana dokümantasyon** (MbTrip detaylı anlatım)

---

**Son Güncelleme:** 25 Kasım 2025  
**Güncelleyen:** AI Documentation Agent  
**Versiyon:** 1.0  
**Not:** Sefer modülü Motorbot modülüne entegre edilmiştir. Detaylar için `02_MODUL_MOTORBOT.md`'ye bakınız.
