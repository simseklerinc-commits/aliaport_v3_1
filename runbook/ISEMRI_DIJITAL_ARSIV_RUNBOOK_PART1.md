# Aliaport İş Emri ve Dijital Arşiv Modülü - RUNBOOK (Bölüm 1/5)

**Versiyon:** 2.0  
**Tarih:** 25 Kasım 2025  
**Kapsam:** İş Emri Talep Yönetimi + Dijital Arşiv Entegrasyonu  
**Hazırlayan:** GitHub Copilot + Aliaport Ekibi  
**İlham Kaynağı:** VisitPro Nemport Liman İşletmeleri Sistemi

---

## 📋 İçindekiler

### Bölüm 1: Genel Bakış ve Mimari (Bu Doküman)
- Proje Özeti
- Sistem Mimarisi
- Roller ve Yetkiler
- Temel Kavramlar

### Bölüm 2: Portal Kullanıcı Rehberi
- Giriş ve İlk Kurulum
- İş Emri Talebi Oluşturma
- Belge Yükleme
- Talep Takibi

### Bölüm 3: Aliaport Personel Rehberi
- Dashboard ve Bildirimler
- Talep İnceleme ve Onaylama
- Belge Yönetimi
- İş Emri İşlemleri

### Bölüm 4: Teknik Spesifikasyonlar
- Database Schema
- API Endpoints
- İş Akışı Diyagramları
- Entegrasyon Noktaları

### Bölüm 5: İleri Seviye Özellikler
- Versiyon Kontrolü
- Süre Sınırlı Belgeler
- Otomatik Bildirimler
- Raporlama ve Analitik

---

## 🎯 BÖLÜM 1: GENEL BAKIŞ VE MİMARİ

### 1.1. Proje Özeti

#### Hedef
Aliaport liman operasyonları için **tam dijital iş emri talep ve yönetim sistemi** oluşturmak. Müşterilerin (cari firmalar) web/mobil üzerinden hizmet talebinde bulunabilmesi, gerekli belgeleri yükleyebilmesi ve talep sürecini takip edebilmesi sağlanacak.

#### Problem
**Mevcut Durum:**
- İş emri talepleri telefon, email, WhatsApp gibi kanallardan geliyor
- Belgeler fiziksel veya e-posta ekleri olarak iletiliyor
- Takip manuel yapılıyor, kayıt tutma zorluğu var
- Belge onay süreci belirsiz
- Müşteri talep durumunu bilemiyor

**Hedeflenen Durum:**
- Tek bir dijital platform üzerinden tüm süreç yönetimi
- Otomatik belge yönetimi ve arşivleme
- Şeffaf onay süreci
- Anlık bildirimler ve takip
- Dijital iz bırakma (audit trail)

#### Kapsamdaki Modüller

**1. İş Emri Modülü (Mevcut + Geliştirme)**
- ✅ Mevcut: Temel CRUD, durum yönetimi, WorkOrderItem
- 🔄 Yeni: Portal entegrasyonu, belge yönetimi, onay süreci

**2. Dijital Arşiv Modülü (Yeni - Merkez Sistem)**
- 📦 Tüm belgelerin merkezi deposu
- 🔄 Versiyon kontrolü
- 🔍 Arama ve kategorizasyon
- ⏰ Süre sınırlı belge takibi

**3. Portal Modülü (Yeni)**
- 👥 Müşteri (cari) kullanıcı yönetimi
- 🔐 Email + Şifre authentication
- 📱 Responsive web (PWA)
- 🔔 Bildirim sistemi

**4. Kullanıcı Yönetimi (Güncelleme)**
- ✅ Mevcut: Internal kullanıcılar
- 🆕 Portal kullanıcıları (cari bazlı)
- 🔑 Rol bazlı erişim (RBAC)

---

### 1.2. Sistem Mimarisi

#### Genel Akış Şeması

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALIAPORT EKOSİSTEMİ                          │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐            ┌──────────────────┐
    │  PORTAL KULLANICI│            │ ALIAPORT PERSONEL│
    │  (Dış Müşteri)   │            │ (Internal)       │
    └────────┬─────────┘            └────────┬─────────┘
             │                               │
             │ 1. Talep Oluştur             │ 4. İncele/Onayla
             │ 2. Belge Yükle               │ 5. İşlemi Başlat
             │ 3. Takip Et                  │ 6. Tamamla
             │                               │
             └───────────────┬───────────────┘
                             ▼
                ┌────────────────────────────┐
                │   İŞ EMRİ MODÜLÜ           │
                │  - Talep Yönetimi          │
                │  - Durum Kontrolü          │
                │  - WorkFlow Engine         │
                └────────┬───────────────────┘
                         │
                         ▼
                ┌────────────────────────────┐
                │  DİJİTAL ARŞİV MODÜLÜ      │
                │  (MERKEZ DEPO)             │
                │                            │
                │  - Belge Saklama           │
                │  - Versiyon Kontrolü       │
                │  - Onay Yönetimi           │
                │  - Süre Takibi             │
                └────────┬───────────────────┘
                         │
                         ▼
                ┌────────────────────────────┐
                │  VERITABANI (PostgreSQL)   │
                │  - ArchiveDocument         │
                │  - WorkOrder               │
                │  - User                    │
                │  - Cari                    │
                └────────────────────────────┘
```

#### Modüller Arası İlişki

**VisitPro'dan Öğrendiklerimiz:**
- ✅ Evraklar merkezi bir yapıda toplanmalı
- ✅ Durum kartları (Eksik/Onay Bekleyen/Reddedilmiş/Onaylanmış)
- ✅ Çalışan/Araç/Firma bazlı evrak takibi
- ✅ Kullanıcı detay sayfalarında bilgi + yetkinlikler + toggle switches

**Aliaport'a Uyarlama:**
```
DİJİTAL ARŞİV (Merkez)
    │
    ├─► İŞ EMRİ BELGELERİ
    │   └─ Gümrük İzin Belgesi (Zorunlu)
    │   └─ Manifesto
    │   └─ Bill of Lading
    │   └─ Diğer...
    │
    ├─► ÇALIŞAN BELGELERİ (Gelecek)
    │   └─ SRC-5 (Süreli - 1 yıl)
    │   └─ Sigorta Listesi (Süreli - 1 yıl)
    │   └─ Nüfus Cüzdanı
    │
    ├─► ARAÇ BELGELERİ (Gelecek)
    │   └─ Ruhsat
    │   └─ Muayene (Süreli - 2 yıl)
    │   └─ Sigorta (Süreli - 1 yıl)
    │
    └─► CARİ BELGELERİ (Gelecek)
        └─ Vergi Levhası
        └─ İmza Sirküleri
```

---

### 1.3. Roller ve Yetkiler

#### 1.3.1. Portal Kullanıcısı (Dış Müşteri)

**Kim?**
- Aliaport'tan hizmet alan cari firmaların çalışanları
- Örnek: MSC Denizcilik operasyon sorumlusu, Maersk lojistik müdürü

**Nasıl Oluşturulur?**
- ⚠️ **SADECE Aliaport personeli tarafından tanımlanır** (self-registration YOK)
- Email + geçici şifre ile oluşturulur
- İlk girişte şifre değiştirme zorunlu

**Bir Carinin Birden Fazla Kullanıcısı Olabilir:**
- **Admin Kullanıcı (Cari Admin):**
  - Kendi şirketinin TÜM taleplerini görebilir
  - Diğer kullanıcıları yönetemez (bu Aliaport yetkisi)
  - Toplu talep oluşturabilir
  
- **Normal Kullanıcı:**
  - SADECE kendi oluşturduğu talepleri görebilir
  - Standart işlemler

**Yetkiler:**
- ✅ Yeni iş emri talebi oluşturabilir (SADECE HİZMET tipi)
- ✅ Gümrük İzin Belgesi yükleyebilir
- ✅ Kendi taleplerini görüntüleyebilir
- ✅ Talep durumunu takip edebilir (status değişiklikleri)
- ✅ Tamamlanan talepleri 30 gün boyunca görebilir
- ✅ Arşivlenen talepleri "Arşiv" sekmesinde görebilir (opsiyonel)
- ✅ Profil ayarlarını düzenleyebilir (şifre değiştirme)
- ❌ Belgeler onaylayamaz
- ❌ İş emrini başlatamaz/tamamlayamaz
- ❌ Başka kullanıcıların taleplerini göremez (normal kullanıcı ise)

**Gördüğü Ekranlar:**
```
app.aliaport.com (Portal)
│
├─ 🏠 Ana Sayfa
│  └─ "Yeni Talep Oluştur" butonu
│  └─ Talep özeti (Bekleyen: 2, Tamamlanan: 15)
│
├─ 📋 Taleplerim
│  ├─ Aktif Talepler (DRAFT, PENDING, APPROVED, IN_PROGRESS)
│  ├─ Tamamlanan (COMPLETED - son 30 gün)
│  └─ Arşiv (30 günden eski)
│
├─ ➕ Yeni Talep
│  ├─ Hizmet Seçimi
│  ├─ Gemi Bilgileri
│  ├─ Açıklama
│  └─ Belge Yükleme
│
└─ 👤 Profil
   ├─ Bilgilerim
   ├─ Şifre Değiştir
   └─ Çıkış Yap
```

---

#### 1.3.2. Aliaport Personeli (Internal)

**Kim?**
- Aliaport çalışanları (ofis personeli, operasyon müdürü, vs.)
- 5-10 kişi

**Yetkiler:**
- ✅ Portal kullanıcılarını oluşturabilir (email + geçici şifre)
- ✅ Tüm iş emri taleplerini görebilir
- ✅ Belgeleri inceleyebilir (PDF preview)
- ✅ Belgeleri onaylayabilir/reddedebilir
- ✅ İş emirlerini başlatabilir
- ✅ İş emirlerini tamamlayabilir
- ✅ WorkOrderItem ekleyebilir (hizmetler, kaynaklar)
- ✅ Fatura oluşturabilir (Mikro Jump entegrasyonu)
- ✅ Raporları görebilir
- ✅ Dijital Arşiv'e tam erişim

**Gördüğü Ekranlar:**
```
app.aliaport.com (Internal Panel)
│
├─ 🏠 Dashboard
│  ├─ 🔴 Bekleyen Onaylar: 3
│  ├─ 🟡 Eksik Belgeler: 5
│  ├─ 🟢 Aktif İş Emirleri: 12
│  └─ 📊 Günlük İstatistikler
│
├─ 📋 İş Emirleri
│  ├─ Tüm Talepler (filtreleme: durum, cari, tarih)
│  ├─ Onay Bekleyenler (PENDING_APPROVAL)
│  ├─ Devam Edenler (IN_PROGRESS)
│  └─ Tamamlananlar
│
├─ 📁 Dijital Arşiv
│  ├─ Eksik Evraklar (49)
│  ├─ Onay Bekleyen (0)
│  ├─ Reddedilmiş (1)
│  ├─ Onaylanmış (126)
│  └─ Arama ve Filtreleme
│
├─ 👥 Portal Kullanıcıları
│  ├─ Kullanıcı Listesi
│  ├─ Yeni Kullanıcı Ekle
│  └─ Toplu Email Gönder
│
├─ 📊 Raporlar
│  ├─ İş Emri İstatistikleri
│  ├─ Belge Durumları
│  └─ Cari Bazlı Analiz
│
└─ ⚙️ Ayarlar
   ├─ Belge Tipleri Tanımlama
   ├─ Email Şablonları
   └─ Sistem Ayarları
```

---

### 1.4. Temel Kavramlar

#### 1.4.1. İş Emri (Work Order)

**Tanım:** Bir carinin Aliaport'tan talep ettiği hizmet kaydı.

**Tipler (WorkOrderType):**
- **HIZMET:** Römorkaj, pilotaj, vinç vs. (Portal kullanıcısı SADECE bunu seçebilir)
- **MOTORBOT:** Internal kullanım
- **BARINMA:** Internal kullanım
- **DIGER:** Internal kullanım

**Durum Akışı (WorkOrderStatus):**
```
DRAFT (Taslak)
  ↓ Portal kullanıcı "Gönder"
PENDING_APPROVAL (Onay Bekliyor - Belgeler inceleniyor)
  ↓ Belgeler onaylandı
ONAYLANDI (Approved)
  ↓ Aliaport personel "Başlat"
ISLEME_BASLANDI (In Progress)
  ↓ İşlem devam ediyor
TAMAMLANDI (Completed)
  ↓ Fatura kesildi
KAPANDI (Closed)

# Yan durumlar:
REDDEDILDI (Rejected) - Belgeler uygun değil
IPTAL_EDILDI (Cancelled)
```

**Approval Status (Onay Durumu):**
```
PENDING → Onay bekliyor
APPROVED → Onaylandı (tüm belgeler tamam)
REJECTED → Reddedildi (belge sorunlu)
```

---

#### 1.4.2. Dijital Arşiv Belgesi (ArchiveDocument)

**Tanım:** Sistemdeki her türlü belgenin merkezi kaydı.

**Kategoriler (DocumentCategory):**
- `WORK_ORDER`: İş emri belgeleri
- `EMPLOYEE`: Çalışan belgeleri (ileride)
- `VEHICLE`: Araç belgeleri (ileride)
- `CARI`: Cari firma belgeleri (ileride)
- `GENERAL`: Genel belgeler

**Belge Tipleri (DocumentType):**

**İş Emri Belgeleri:**
- `GUMRUK_IZIN_BELGESI`: ⚠️ **ZORUNLU** - Gümrük izin belgesi
- `MANIFESTO`: Manifesto
- `BILL_OF_LADING`: Konşimento
- `ARRIVAL_NOTICE`: Arrival notice
- `PROFORMA_INVOICE`: Proforma fatura

**Çalışan Belgeleri (Gelecek):**
- `SRC5`: ⏰ Süreli (1 yıl) - Liman güvenlik kartı
- `SIGORTA_LISTESI`: ⏰ Süreli (1 yıl) - SGK sigorta belgesi
- `NUFUS_CUZDANI`: Nüfus cüzdanı fotokopisi

**Araç Belgeleri (Gelecek):**
- `ARAC_RUHSAT`: Araç ruhsat belgesi
- `ARAC_MUAYENE`: ⏰ Süreli (2 yıl) - Araç muayene belgesi
- `ARAC_SIGORTA`: ⏰ Süreli (1 yıl) - Araç trafik sigortası

**Durum (DocumentStatus):**
```
UPLOADED → Yüklendi (onay bekliyor)
APPROVED → Onaylandı
REJECTED → Reddedildi
EXPIRED → Süresi doldu
ARCHIVED → Arşivlendi (eski versiyon)
```

---

#### 1.4.3. Versiyon Kontrolü

**Neden Gerekli?**
- Aynı belge türünden birden fazla yüklenebilir
- Eski versiyonlar kaybolmaz (audit trail)
- Son versiyon her zaman aktif olur

**Örnek Senaryo:**
```
1. Portal kullanıcı Gümrük İzin Belgesi yükler
   → version: 1, is_latest_version: True, status: UPLOADED

2. Aliaport personel reddeder (tarih yanlış)
   → version: 1, status: REJECTED

3. Portal kullanıcı düzeltilmiş belgeyi yükler
   → version: 2, is_latest_version: True, status: UPLOADED
   → version: 1, is_latest_version: False, status: ARCHIVED

4. Aliaport personel onaylar
   → version: 2, status: APPROVED
```

**Database İlişkisi:**
```sql
ArchiveDocument
  id: 1, version: 1, previous_version_id: NULL, is_latest: False (arşiv)
  id: 2, version: 2, previous_version_id: 1, is_latest: True (aktif)
```

---

#### 1.4.4. Süre Sınırlı Belgeler

**Hangi Belgeler Süreli?**
- SRC-5: 1 yıl
- Sigorta Listesi: 1 yıl
- Araç Muayene: 2 yıl
- Araç Sigorta: 1 yıl

**Süre Takibi:**
```python
expires_at: datetime  # Geçerlilik bitiş tarihi
is_expired: computed  # expires_at < now()
days_until_expiry: computed  # Kalan gün sayısı
expiry_notification_sent: bool  # Bildirim gönderildi mi?
```

**Otomatik Bildirimler:**
- 30 gün önce: Email "SRC-5 belgeniz 30 gün içinde sona erecek"
- 7 gün önce: Email "⚠️ SRC-5 belgeniz 7 gün içinde sona erecek"
- Süre dolduğunda: status = EXPIRED, email "❌ SRC-5 belgeniz sona erdi"

---

### 1.5. VisitPro'dan İlham Alınan Özellikler

#### ✅ Taşınan Konseptler

**1. Evrak Durum Kartları**
```
VisitPro:
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Eksik: 49   │  │ Onay: 0     │  │ Red: 1      │  │ Onay: 126   │
│ [LİSTELE]   │  │ [LİSTELE]   │  │ [LİSTELE]   │  │ [LİSTELE]   │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘

Aliaport:
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Eksik Belgeler  │  │ Onay Bekleyen   │  │ Reddedilmiş     │  │ Onaylanmış      │
│ 5 adet          │  │ 3 adet          │  │ 1 adet          │  │ 42 adet         │
│ [GÖRÜNTÜLE]     │  │ [İNCELE]        │  │ [DETAY]         │  │ [LİSTE]         │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

**2. Detay Sayfalarında Toggle Switches**
```
VisitPro - Çalışan Detayı:
[Bilgiler] [Yetkinlikler]
Toggle: Araç kullanabilir [●─]
Toggle: Gümrük alanına girecek mi? [─●]
Toggle: Ticari araç kullanabilir [●─]

Aliaport - İş Emri Detayı:
[Genel Bilgiler] [Belgeler] [İşlemler]
Toggle: Gate gerekli [●─]
Toggle: İndirim uygula (is_cabotage) [─●]
Toggle: Ek kurallar (apply_rule_addons) [●─]
```

**3. Belge Onay Butonları**
```
VisitPro:
[EVRAK YÜKLE - Mor]  [GÖRÜNTÜLE - Mavi]

Aliaport:
[BELGE YÜKLE - Purple]  [ÖNİZLE - Cyan]  [ONAYLA - Green]  [REDDET - Red]
```

**4. Araç/Çalışan Listesi Konsepti**
```
VisitPro:
Araçlar → Araç Listesi → Araç Detay (Evrak Onayı: Eksik Evrak/Aktif)

Aliaport (Gelecek):
İş Emirleri → İş Emri Listesi → İş Emri Detay (Belge Durumu: Eksik/Onaylı)
```

---

#### ❌ Taşınmayan / Değiştirilen Özellikler

**1. Giriş Yöntemi**
```
VisitPro: "Yüklenici Girişi" ve "Firma Girişi" sekmeleri

Aliaport: 
- Tek giriş ekranı (email + şifre)
- Rol bazlı yönlendirme (portal user → portal UI, internal → admin UI)
```

**2. Self-Registration**
```
VisitPro: Firma kendisi kayıt olabiliyor olabilir (detay bilinmiyor)

Aliaport:
- ❌ Self-registration YOK
- ✅ Sadece Aliaport personeli kullanıcı oluşturabilir
- Güvenlik öncelikli yaklaşım
```

**3. İş Çağrıları Modülü**
```
VisitPro: Açık İş Çağrıları, Geçmiş İş Çağrıları (tarih, ekipman, araç sayısı)

Aliaport:
- İş Emri kavramı daha geniş
- WorkOrderItem ile kaynaklar/hizmetler detaylı takip
- İş çağrısı konsepti yerine "İş Emri İşlemleri"
```

---

## 🔗 Sonraki Bölüm

**BÖLÜM 2: PORTAL KULLANICI REHBERİ**
- İlk giriş ve şifre değiştirme
- Adım adım talep oluşturma
- Belge yükleme detayları
- Talep takibi ve arşiv

---

**Devam edecek...**

