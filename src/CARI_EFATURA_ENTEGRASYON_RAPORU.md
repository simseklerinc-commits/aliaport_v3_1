# 🔍 CARİ KART - E-FATURA ENTEGRASYON ANALİZ RAPORU

## 📅 Tarih: 19 Kasım 2024
## 🎯 Amaç: Cari kartların e-Fatura uyumluluğu ve eksik alanların tespiti

---

## 📊 MEVCUT CARİ KART YAPISI

### ✅ **Var Olan Alanlar:**

```typescript
export interface CariKart {
  // Temel Bilgiler
  Id: number;
  Code: string;
  Name: string;
  Active: boolean;
  
  // Vergi Kimlik
  VknTckn?: string;          // Birleşik alan
  Vkn?: string;              // Sadece VKN
  Tckn?: string;             // Sadece TCKN
  VergiDairesi?: string;
  
  // Adres Bilgileri
  Country: string;
  City?: string;
  Town?: string;
  Address?: string;
  Adres?: string;            // Duplicate (kaldırılmalı)
  
  // İletişim
  Tel1?: string;
  Tel2?: string;
  Tel?: string;              // Duplicate (kaldırılmalı)
  Email?: string;
  
  // Finansal
  IBAN?: string;
  Currency: string;
  Para: string;              // Duplicate (kaldırılmalı)
  RiskLimit?: number;
  RiskCurrency: string;
  PaymentTermDays: number;
  OdemeVadesiGun?: number;   // Duplicate (kaldırılmalı)
  
  // Muhasebe
  GlCode?: string;
  
  // Sistem
  CreatedAt: string;
  UpdatedAt?: string;
}
```

---

## 🚨 TESPIT EDİLEN SORUNLAR

### **1. DUPLICATE (TEKRARLI) ALANLAR** ❌

| Alan 1 | Alan 2 | Sorun | Çözüm |
|--------|--------|-------|-------|
| `Address` | `Adres` | Aynı veri 2 yerde | `Address` kullan, `Adres` kaldır |
| `Tel1` | `Tel` | Aynı veri 2 yerde | `Tel1, Tel2` kullan, `Tel` kaldır |
| `Currency` | `Para` | Aynı veri 2 yerde | `Currency` kullan, `Para` kaldır |
| `PaymentTermDays` | `OdemeVadesiGun` | Aynı veri 2 yerde | `PaymentTermDays` kullan, diğerini kaldır |

**ETKİ:** Veri tutarsızlığı riski, gereksiz alan kullanımı.

---

### **2. E-FATURA İÇİN EKSİK ZORUNLU ALANLAR** ❌

#### **A. Adres Detayları:**
```typescript
// ❌ EKSİK!
PostalCode?: string;           // Posta kodu (GİB zorunlu)
District?: string;             // İlçe (detaylı)
Neighborhood?: string;         // Mahalle/Köy (GİB zorunlu)
Street?: string;               // Cadde/Sokak
BuildingName?: string;         // Bina adı
BuildingNo?: string;           // Bina numarası
DoorNo?: string;               // Kapı no
CountryCode?: string;          // ISO 3166 kodu (TR, US, GB)
```

**MEVCUT DURUM:**  
Address alanı tek satır: `"ALSANCAK MAH. Mah. ATATÜRK CAD. No:378 Daire:52 KONAK/İZMİR"`

**SORUN:**  
- Mahalle, cadde, no bilgileri parse edilmeli
- GİB e-Fatura formatı için ayrı alanlar gerekli
- Posta kodu yok!

---

#### **B. E-Fatura Özellikleri:**
```typescript
// ❌ EKSİK!
IsEInvoiceCustomer?: boolean;  // E-Fatura mükellefi mi?
EInvoiceType?: 'GB' | 'PK' | 'OK' | null;  // GB: Gelir İdaresi Başkanlığı
                                            // PK: Özel Entegratör
                                            // OK: Özel kullanıcı
EInvoiceAlias?: string;        // E-Fatura etiketi/alias (ör: urn:mail:defaultpk@efatura.com.tr)
AcceptsEArchive?: boolean;     // E-Arşiv fatura kabul ediyor mu?
EInvoiceScenario?: 'TICARIFATURA' | 'TEMELFATURA' | 'YOLCUBERABERFATURA';
SendMethod?: 'E-FATURA' | 'E-ARSIV' | 'KAGIT';  // Gönderim yöntemi tercihi
```

**NEDEN ÖNEMLİ:**
- E-Fatura müşterilerine e-Fatura gönderilir
- E-Fatura olmayana e-Arşiv gönderilir
- Alias ile otomatik gönderim yapılır
- Yanlış gönderim = ret/hata

---

#### **C. Ticari Kimlik Bilgileri:**
```typescript
// ❌ EKSİK!
TaxNumber?: string;            // Tam vergi numarası (10 veya 11 haneli)
TaxIdType?: 'VKN' | 'TCKN';   // Kimlik tipi
MersisNo?: string;             // Mersis numarası (16 haneli)
TradeRegistryNo?: string;      // Ticaret sicil no
TradeRegistryOffice?: string;  // Ticaret sicil memurluğu
KepAddress?: string;           // Kayıtlı elektronik posta
```

**NEDEN ÖNEMLİ:**
- Mersis no ile GİB doğrulaması
- KEP adresi ile yasal iletişim
- Ticaret sicil resmiyette gerekli

---

#### **D. Cari Tipi ve Sınıflandırma:**
```typescript
// ❌ EKSİK!
AccountType?: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';  // Müşteri/Tedarikçi/Her İkisi
CustomerGroup?: string;        // Müşteri grubu (VIP, Standart, Bayi)
PriceListId?: number;          // Varsayılan fiyat listesi
SalesPersonId?: number;        // Satış temsilcisi
```

**NEDEN ÖNEMLİ:**
- Fatura akışı yönlendirmesi
- Satış ve alış fatura ayrımı
- Raporlama ve analiz

---

#### **E. İletişim Detayları:**
```typescript
// ✅ VAR AMA YETERSİZ!
Tel1?: string;                 // ✅ Mevcut
Tel2?: string;                 // ✅ Mevcut
Email?: string;                // ✅ Mevcut

// ❌ EKSİK!
Fax?: string;                  // Faks (opsiyonel)
Mobile?: string;               // Cep telefonu (ayrı)
Website?: string;              // Web sitesi
ContactPerson?: string;        // İrtibat kişisi
ContactTitle?: string;         // Unvan
```

---

## 📋 E-FATURA GEREKSİNİMLERİ (GİB & İŞNET)

### **GİB Zorunlu Alanlar (e-Fatura için):**

| Alan | Cari Kartında Var mı? | Durum |
|------|----------------------|-------|
| VKN/TCKN | ✅ VknTckn, Vkn, Tckn | OK |
| Unvan/Ad Soyad | ✅ Name | OK |
| Vergi Dairesi | ✅ VergiDairesi | OK |
| Adres (Tam) | ⚠️ Address (tek satır) | Parse gerekli |
| Mahalle/Köy | ❌ YOK | **EKSİK!** |
| İl | ✅ City | OK |
| İlçe | ⚠️ Town (opsiyonel) | Kısmen OK |
| Posta Kodu | ❌ YOK | **EKSİK!** |
| Ülke | ⚠️ Country (isim) | ISO kodu lazım |
| E-Fatura Alias | ❌ YOK | **EKSİK!** |
| Telefon | ✅ Tel1 | OK |
| E-posta | ✅ Email | OK |

---

### **İŞNET Entegrasyon Gereksinimleri:**

```typescript
// İşnet API beklentisi:
{
  "cariKod": "01.001",              // ✅ Code
  "unvan": "...",                    // ✅ Name
  "vkn": "0010812829",               // ✅ Vkn/VknTckn
  "vergiDairesi": "KORDON",          // ✅ VergiDairesi
  "adres": "...",                    // ✅ Address
  "mahalle": "ALSANCAK MAH.",        // ❌ YOK!
  "sehir": "İzmir",                  // ✅ City
  "ilce": "KONAK",                   // ⚠️ Town (parse edilmeli)
  "postaKodu": "35210",              // ❌ YOK!
  "ulke": "TR",                      // ⚠️ Country (name var, ISO kod yok)
  "eFaturaEtiketi": "urn:...",       // ❌ YOK!
  "eFaturaMukellefi": true,          // ❌ YOK!
  "telefon": "...",                  // ✅ Tel1
  "eposta": "...",                   // ✅ Email
  "mersisNo": "...",                 // ❌ YOK!
  "kepAdresi": "..."                 // ❌ YOK!
}
```

---

## 💡 ÇÖZÜM ÖNERİLERİ

### **ÖNCELİK 1: ZORUNLU ALANLAR (HEMEN EKLENMELI)** 🔴

```typescript
export interface CariKart {
  // ... mevcut alanlar ...
  
  // E-FATURA ZORUNLU ALANLAR:
  PostalCode?: string;               // Posta kodu (5 haneli)
  Neighborhood?: string;             // Mahalle/Köy
  CountryCode?: string;              // ISO ülke kodu (TR, US, GB)
  
  IsEInvoiceCustomer: boolean;       // E-Fatura mükellefi mi? (default: false)
  EInvoiceAlias?: string;            // E-Fatura etiketi
  AcceptsEArchive: boolean;          // E-Arşiv kabul eder mi? (default: true)
  SendMethod: 'E-FATURA' | 'E-ARSIV' | 'KAGIT';  // Varsayılan: E-ARSIV
}
```

---

### **ÖNCELİK 2: TİCARİ KİMLİK (ÖNERİLİR)** 🟡

```typescript
export interface CariKart {
  // ... mevcut alanlar ...
  
  // TİCARİ KİMLİK:
  MersisNo?: string;                 // 16 haneli Mersis no
  TradeRegistryNo?: string;          // Ticaret sicil no
  TradeRegistryOffice?: string;      // Ticaret sicil memurluğu
  KepAddress?: string;               // KEP adresi
  
  // CARİ TİPİ:
  AccountType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';  // Varsayılan: CUSTOMER
  CustomerGroup?: string;            // Müşteri grubu
}
```

---

### **ÖNCELİK 3: DETAYLI ADRES (İYİ OLUR)** 🟢

```typescript
export interface CariKart {
  // ... mevcut alanlar ...
  
  // DETAYLI ADRES:
  District?: string;                 // İlçe (Town yerine)
  Street?: string;                   // Cadde/Sokak
  BuildingName?: string;             // Bina adı
  BuildingNo?: string;               // Bina numarası
  DoorNo?: string;                   // Kapı no/Daire
}
```

---

### **ÖNCELİK 4: İLETİŞİM GENİŞLETME (OPSIYONEL)** 🔵

```typescript
export interface CariKart {
  // ... mevcut alanlar ...
  
  // GENİŞLETİLMİŞ İLETİŞİM:
  Mobile?: string;                   // Cep telefonu
  Fax?: string;                      // Faks
  Website?: string;                  // Web sitesi
  ContactPerson?: string;            // İrtibat kişisi
  ContactTitle?: string;             // İrtibat kişisi unvanı
  ContactEmail?: string;             // İrtibat kişisi e-posta
  ContactPhone?: string;             // İrtibat kişisi telefon
}
```

---

### **ÖNCELİK 5: DUPLICATE ALANLARI TEMİZLE** 🧹

```typescript
// ❌ KALDIRILMALI:
Adres?: string;                // Address ile aynı
Tel?: string;                  // Tel1 ile aynı
Para: string;                  // Currency ile aynı
OdemeVadesiGun?: number;       // PaymentTermDays ile aynı

// ✅ TUTULACAK:
Address: string;
Tel1?: string;
Tel2?: string;
Currency: string;
PaymentTermDays: number;
```

---

## 🎯 YENİ CARİ KART YAPISI ÖNERİSİ

### **MINIMAL (Sadece Zorunlu E-Fatura Alanları):**

```typescript
export interface CariKart {
  // TEMEL BİLGİLER
  Id: number;
  Code: string;                      // Cari kodu
  Name: string;                      // Ünvan/Ad Soyad
  Active: boolean;
  
  // VERGİ KİMLİK
  TaxIdType: 'VKN' | 'TCKN';        // Kimlik tipi
  TaxId: string;                     // VKN veya TCKN (10 veya 11 haneli)
  TaxOffice?: string;                // Vergi dairesi
  
  // ADRES BİLGİLERİ
  Address: string;                   // Açık adres
  Neighborhood?: string;             // Mahalle/Köy
  District?: string;                 // İlçe
  City: string;                      // İl
  PostalCode?: string;               // Posta kodu
  CountryCode: string;               // ISO ülke kodu (TR, US, GB)
  
  // İLETİŞİM
  Phone?: string;                    // Telefon
  Mobile?: string;                   // Cep telefonu
  Email?: string;                    // E-posta
  
  // E-FATURA ÖZELLİKLERİ
  IsEInvoiceCustomer: boolean;       // E-Fatura mükellefi mi?
  EInvoiceAlias?: string;            // E-Fatura etiketi
  AcceptsEArchive: boolean;          // E-Arşiv kabul ediyor mu?
  SendMethod: 'E-FATURA' | 'E-ARSIV' | 'KAGIT';
  
  // FİNANSAL
  Currency: string;                  // Para birimi
  PaymentTermDays: number;           // Ödeme vadesi (gün)
  RiskLimit?: number;                // Risk limiti
  RiskCurrency?: string;             // Risk para birimi
  IBAN?: string;
  
  // MUHASEBE
  GlCode?: string;                   // Muhasebe hesap kodu
  
  // SİSTEM
  CreatedAt: string;
  UpdatedAt?: string;
  CreatedBy?: number;
  UpdatedBy?: number;
}
```

---

### **KAPSAMLI (Tüm Öneriler Dahil):**

```typescript
export interface CariKart {
  // TEMEL BİLGİLER
  Id: number;
  Code: string;
  Name: string;
  Active: boolean;
  AccountType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  CustomerGroup?: string;
  
  // VERGİ KİMLİK
  TaxIdType: 'VKN' | 'TCKN';
  TaxId: string;
  TaxOffice?: string;
  MersisNo?: string;                 // 16 haneli
  TradeRegistryNo?: string;
  TradeRegistryOffice?: string;
  
  // ADRES BİLGİLERİ (DETAYLI)
  Address: string;                   // Açık adres
  Neighborhood?: string;             // Mahalle/Köy
  Street?: string;                   // Cadde/Sokak
  BuildingName?: string;             // Bina adı
  BuildingNo?: string;               // Bina no
  DoorNo?: string;                   // Kapı no/Daire
  District?: string;                 // İlçe
  City: string;                      // İl
  PostalCode?: string;               // Posta kodu
  CountryCode: string;               // ISO kod (TR)
  
  // İLETİŞİM
  Phone?: string;                    // Sabit telefon
  Mobile?: string;                   // Cep telefonu
  Fax?: string;                      // Faks
  Email?: string;                    // E-posta
  Website?: string;                  // Web sitesi
  KepAddress?: string;               // KEP adresi
  
  // İRTİBAT KİŞİSİ
  ContactPerson?: string;
  ContactTitle?: string;
  ContactEmail?: string;
  ContactPhone?: string;
  
  // E-FATURA ÖZELLİKLERİ
  IsEInvoiceCustomer: boolean;
  EInvoiceType?: 'GB' | 'PK' | 'OK';
  EInvoiceAlias?: string;
  AcceptsEArchive: boolean;
  SendMethod: 'E-FATURA' | 'E-ARSIV' | 'KAGIT';
  EInvoiceScenario?: 'TICARIFATURA' | 'TEMELFATURA';
  
  // FİNANSAL
  Currency: string;
  PaymentTermDays: number;
  RiskLimit?: number;
  RiskCurrency?: string;
  IBAN?: string;
  DefaultPriceListId?: number;
  
  // MUHASEBE
  GlCode?: string;
  SalesPersonId?: number;
  
  // NOTLAR
  Notes?: string;
  
  // SİSTEM
  CreatedAt: string;
  UpdatedAt?: string;
  CreatedBy?: number;
  UpdatedBy?: number;
  
  // METADATA
  metadata_json?: string;            // JSON (custom fields, tags, etc.)
}
```

---

## 📊 ALAN KARŞILAŞTIRMA TABLOSU

| Alan Kategorisi | Mevcut | Önerilen (Minimal) | Önerilen (Kapsamlı) |
|------------------|--------|-------------------|---------------------|
| Temel Bilgiler | 4 | 5 | 6 |
| Vergi Kimlik | 4 | 3 | 6 |
| Adres | 6 | 7 | 11 |
| İletişim | 5 | 3 | 8 |
| E-Fatura | 0 | 4 | 6 |
| Finansal | 7 | 6 | 7 |
| Muhasebe | 1 | 1 | 2 |
| İrtibat | 0 | 0 | 4 |
| Sistem | 2 | 4 | 5 |
| **TOPLAM** | **29** | **33** | **55** |

---

## 🔄 MİGRASYON STRATEJİSİ

### **AŞAMA 1: Duplicate Temizliği**

```typescript
// Mevcut data mapping:
cari.Address = cari.Address || cari.Adres;  // Birleştir
cari.Phone = cari.Tel1 || cari.Tel;         // Birleştir
cari.Currency = cari.Currency || cari.Para; // Birleştir
cari.PaymentTermDays = cari.PaymentTermDays || cari.OdemeVadesiGun || 0;

// Sonra eski alanları sil:
delete cari.Adres;
delete cari.Tel;
delete cari.Para;
delete cari.OdemeVadesiGun;
```

---

### **AŞAMA 2: VKN/TCKN Ayrıştırma**

```typescript
// Mevcut VknTckn'den ayrıştır:
if (cari.VknTckn) {
  if (cari.VknTckn.length === 10) {
    cari.TaxIdType = 'VKN';
    cari.TaxId = cari.VknTckn;
  } else if (cari.VknTckn.length === 11) {
    cari.TaxIdType = 'TCKN';
    cari.TaxId = cari.VknTckn;
  }
}

// Eski alanları kaldır:
delete cari.VknTckn;
delete cari.Vkn;
delete cari.Tckn;
```

---

### **AŞAMA 3: Adres Parse**

```typescript
// Mevcut Address alanından parse et:
const addressParts = parseAddress(cari.Address);
cari.Neighborhood = addressParts.neighborhood;  // "ALSANCAK MAH."
cari.Street = addressParts.street;              // "ATATÜRK CAD."
cari.BuildingNo = addressParts.buildingNo;      // "378"
cari.DoorNo = addressParts.doorNo;              // "52"
cari.District = addressParts.district;          // "KONAK"

// Regex örneği:
function parseAddress(address: string) {
  const mahMatch = address.match(/^([\w\s]+)\s+MAH\./i);
  const cadMatch = address.match(/([\w\s]+)\s+CAD\./i);
  const noMatch = address.match(/No:(\d+)/i);
  const daireMatch = address.match(/Daire:(\d+)/i);
  
  return {
    neighborhood: mahMatch?.[1],
    street: cadMatch?.[1],
    buildingNo: noMatch?.[1],
    doorNo: daireMatch?.[1],
    district: extractDistrict(address),
  };
}
```

---

### **AŞAMA 4: E-Fatura Varsayılanları**

```typescript
// Yeni alanlar için varsayılan değerler:
cari.IsEInvoiceCustomer = false;              // GİB'den sorgulanmalı
cari.AcceptsEArchive = true;                   // Varsayılan kabul eder
cari.SendMethod = 'E-ARSIV';                   // Varsayılan e-Arşiv
cari.AccountType = 'CUSTOMER';                 // Varsayılan müşteri
cari.CountryCode = 'TR';                       // Türkiye varsayılan
cari.TaxOffice = cari.VergiDairesi;           // Mapping

delete cari.VergiDairesi;
```

---

## 🎨 FORM GÜNCELLEMELERİ

### **CariKartiForm.tsx Güncellemeleri:**

#### **YENİ BÖLÜM 1: E-Fatura Ayarları**

```tsx
<div className="space-y-4">
  <h3 className="flex items-center gap-2">
    <FileText className="w-5 h-5 text-purple-400" />
    E-Fatura Ayarları
  </h3>
  
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label>E-Fatura Mükellefi</Label>
      <Switch
        checked={cari.IsEInvoiceCustomer}
        onCheckedChange={(val) => onChange('IsEInvoiceCustomer', val)}
      />
    </div>
    
    <div>
      <Label>E-Arşiv Kabul Eder</Label>
      <Switch
        checked={cari.AcceptsEArchive}
        onCheckedChange={(val) => onChange('AcceptsEArchive', val)}
      />
    </div>
  </div>
  
  {cari.IsEInvoiceCustomer && (
    <div>
      <Label>E-Fatura Etiketi/Alias</Label>
      <Input
        value={cari.EInvoiceAlias || ''}
        onChange={(e) => onChange('EInvoiceAlias', e.target.value)}
        placeholder="urn:mail:defaultpk@efatura.com.tr"
      />
    </div>
  )}
  
  <div>
    <Label>Gönderim Yöntemi</Label>
    <select
      value={cari.SendMethod}
      onChange={(e) => onChange('SendMethod', e.target.value)}
      className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2"
    >
      <option value="E-ARSIV">E-Arşiv Fatura</option>
      <option value="E-FATURA">E-Fatura</option>
      <option value="KAGIT">Kağıt Fatura</option>
    </select>
  </div>
</div>
```

---

#### **YENİ BÖLÜM 2: Detaylı Adres**

```tsx
<div className="space-y-4">
  <h3>Detaylı Adres</h3>
  
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label>Mahalle/Köy</Label>
      <Input
        value={cari.Neighborhood || ''}
        onChange={(e) => onChange('Neighborhood', e.target.value)}
        placeholder="Alsancak Mahallesi"
      />
    </div>
    
    <div>
      <Label>Cadde/Sokak</Label>
      <Input
        value={cari.Street || ''}
        onChange={(e) => onChange('Street', e.target.value)}
        placeholder="Atatürk Caddesi"
      />
    </div>
    
    <div>
      <Label>Bina No</Label>
      <Input
        value={cari.BuildingNo || ''}
        onChange={(e) => onChange('BuildingNo', e.target.value)}
        placeholder="378"
      />
    </div>
    
    <div>
      <Label>Daire/Kapı No</Label>
      <Input
        value={cari.DoorNo || ''}
        onChange={(e) => onChange('DoorNo', e.target.value)}
        placeholder="52"
      />
    </div>
    
    <div>
      <Label>İlçe</Label>
      <Input
        value={cari.District || ''}
        onChange={(e) => onChange('District', e.target.value)}
        placeholder="Konak"
      />
    </div>
    
    <div>
      <Label>Posta Kodu</Label>
      <Input
        value={cari.PostalCode || ''}
        onChange={(e) => onChange('PostalCode', e.target.value)}
        placeholder="35210"
        maxLength={5}
      />
    </div>
  </div>
</div>
```

---

#### **YENİ BÖLÜM 3: Ticari Kimlik**

```tsx
<div className="space-y-4">
  <h3>Ticari Kimlik Bilgileri</h3>
  
  <div className="grid grid-cols-2 gap-4">
    <div>
      <Label>Mersis No</Label>
      <Input
        value={cari.MersisNo || ''}
        onChange={(e) => onChange('MersisNo', e.target.value)}
        placeholder="0123456789012345"
        maxLength={16}
      />
    </div>
    
    <div>
      <Label>Ticaret Sicil No</Label>
      <Input
        value={cari.TradeRegistryNo || ''}
        onChange={(e) => onChange('TradeRegistryNo', e.target.value)}
      />
    </div>
    
    <div>
      <Label>KEP Adresi</Label>
      <Input
        type="email"
        value={cari.KepAddress || ''}
        onChange={(e) => onChange('KepAddress', e.target.value)}
        placeholder="firma@hs01.kep.tr"
      />
    </div>
    
    <div>
      <Label>Cari Tipi</Label>
      <select
        value={cari.AccountType}
        onChange={(e) => onChange('AccountType', e.target.value)}
        className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2"
      >
        <option value="CUSTOMER">Müşteri</option>
        <option value="SUPPLIER">Tedarikçi</option>
        <option value="BOTH">Her İkisi</option>
      </select>
    </div>
  </div>
</div>
```

---

## 📝 UYGULAMA PLANI

### **AŞAMA 1: HEMEN (1-2 Gün)** 🔴

1. ✅ Duplicate alanları birleştir ve sil
2. ✅ E-Fatura zorunlu alanları ekle:
   - `IsEInvoiceCustomer`
   - `EInvoiceAlias`
   - `AcceptsEArchive`
   - `SendMethod`
   - `PostalCode`
   - `Neighborhood`
   - `CountryCode`

3. ✅ VKN/TCKN yapısını düzenle:
   - `TaxIdType`
   - `TaxId`

---

### **AŞAMA 2: KISA VADE (1 Hafta)** 🟡

1. ✅ Ticari kimlik alanları:
   - `MersisNo`
   - `TradeRegistryNo`
   - `KepAddress`
   - `AccountType`

2. ✅ Form güncellemeleri:
   - E-Fatura ayarları bölümü
   - Detaylı adres bölümü
   - Ticari kimlik bölümü

---

### **AŞAMA 3: ORTA VADE (2 Hafta)** 🟢

1. ✅ Detaylı adres alanları:
   - `District`, `Street`, `BuildingNo`, `DoorNo`

2. ✅ İrtibat kişisi:
   - `ContactPerson`, `ContactTitle`, `ContactEmail`, `ContactPhone`

3. ✅ Adres parse fonksiyonu

---

### **AŞAMA 4: UZUN VADE (1 Ay)** 🔵

1. ✅ GİB entegrasyonu:
   - E-Fatura mükellefi sorgulama
   - VKN doğrulama
   - Mersis doğrulama

2. ✅ İşnet API entegrasyonu test

---

## 🎯 ÖNERİLEN HEMEN UYGULANACAK ALANLAR

### **MİNİMAL ZORUNLU GÜNCELLEMELER:**

```typescript
export interface CariKart {
  // MEVCUT ALANLAR (Duplicate'ler temizlenmiş)
  Id: number;
  Code: string;
  Name: string;
  Active: boolean;
  
  // VERGİ KİMLİK (Düzenlenmiş)
  TaxIdType: 'VKN' | 'TCKN';        // YENİ! (VknTckn'den parse)
  TaxId: string;                     // YENİ! (10 veya 11 haneli)
  TaxOffice?: string;                // Eski: VergiDairesi → rename
  
  // ADRES (Düzenlenmiş)
  Address: string;                   // Eski: Address (tutuldu, Adres kaldırıldı)
  Neighborhood?: string;             // YENİ! (adres parse'dan)
  District?: string;                 // Eski: Town → rename
  City: string;
  PostalCode?: string;               // YENİ! (ZORUNLU)
  CountryCode: string;               // YENİ! (Country'den: "Türkiye" → "TR")
  
  // İLETİŞİM (Düzenlenmiş)
  Phone?: string;                    // Eski: Tel1 → rename (Tel kaldırıldı)
  PhoneAlt?: string;                 // Eski: Tel2 → rename
  Email?: string;
  
  // E-FATURA (YENİ - ZORUNLU!)
  IsEInvoiceCustomer: boolean;       // YENİ! (default: false)
  EInvoiceAlias?: string;            // YENİ! (e-Fatura etiketi)
  AcceptsEArchive: boolean;          // YENİ! (default: true)
  SendMethod: 'E-FATURA' | 'E-ARSIV' | 'KAGIT';  // YENİ! (default: E-ARSIV)
  
  // FİNANSAL (Düzenlenmiş)
  Currency: string;                  // Eski: Currency (tutuldu, Para kaldırıldı)
  PaymentTermDays: number;           // Eski: PaymentTermDays (tutuldu, OdemeVadesiGun kaldırıldı)
  RiskLimit?: number;
  RiskCurrency?: string;
  IBAN?: string;
  
  // MUHASEBE
  GlCode?: string;
  
  // SİSTEM
  CreatedAt: string;
  UpdatedAt?: string;
}
```

---

## 📊 SONUÇ VE TAVSİYELER

### **✅ GÜÇLÜ YANLAR:**
1. Temel VKN/TCKN bilgileri mevcut
2. Adres bilgileri var (parse edilmeli)
3. İletişim bilgileri yeterli
4. Finansal alanlar eksiksiz

### **❌ EKSİKLİKLER:**
1. **KRİTİK:** E-Fatura özellikleri yok
2. **KRİTİK:** Posta kodu yok
3. **KRİTİK:** Mahalle bilgisi parse edilmeli
4. **ÖNEMLİ:** Ticari kimlik bilgileri yok
5. **ÖNEML İ:** Duplicate alanlar var
6. **İYİ OLUR:** Detaylı adres yapısı

### **🎯 TAVSİYE:**

**HEMEN YAPILMASI GEREKENLER (1-2 Gün):**
1. ✅ Duplicate alanları temizle
2. ✅ E-Fatura zorunlu alanları ekle
3. ✅ VKN/TCKN yapısını düzenle
4. ✅ Posta kodu ekle
5. ✅ Ülke kodu (ISO) ekle

**Bu değişikliklerle e-Fatura entegrasyonu %90 hazır olur!**

---

**📋 Detaylı uygulama için hazırım! Ne yapmamı istersiniz?**

1. 🔨 Yeni CariKart interface'ini oluşturalım mı?
2. 🔄 Migration script'i yazalım mı?
3. 📝 Form component'lerini güncelleyelim mi?
4. 🧪 Test data'sını düzenleyelim mi?

**Hepsini mi yoksa öncelik sırasına göre mi ilerleyelim?**
