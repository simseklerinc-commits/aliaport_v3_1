# Cari Yönetimi — RUNBOOK (UNIFIED v2.3 • Final Merge)
**Oluşturma:** 2025-11-05 13:04:42 +03:00
**İlke:** Tekilleştirilmiş (merge) — veri kaybı yok. Kaynaklar ve hash bilgileri aşağıda yer alır.

---
## Sürüm Özeti (Delta)
> **Delta v2.1 → v2.3 (FIX6) Özet)**
> - InvoiceBridge FIX6: Write-Host $(if ...) düzeltmesi, elseif/else tek satır kullanımı, KDVOran sahası toparlandı.
> - Runner & Görev & Log: Transcript log + 60+ gün temizliği, Scheduled Task çalışma dizini düzeltmesi.
> - WebGUI Bootstrap: aliaport_web.py, run_web.ps1, /ui ana sayfa, AJAX sayaç güncelleme.
> - python-multipart zorunlu (form POST).
> - İş Emri Kalem Katmanı: data/is_emri.csv & data/is_emri_kalem.csv; UI ile kalem ekleme.
> - UX Patch: kartlar, canlı sayaç, tarife seçince birim/para auto-fill.

Cari kodu & tekne adı standardı; Luca ile kod uyumu.

---
## Merge Manifest
- Form_Cari_Yonetimi_v2_3_FINAL_REV_20251105_090459.md | size=8903 | sha256=85e5684ff6ef3595b17582e611bd8ad79539c21e53dc6fef0c10370308fdc15c
- Form_Cari_Yonetimi_v2_3_FINAL_REV_20251105_155648.md | size=647 | sha256=e60d00c76c79d8bcf773d50695ba661a12e2951d06b71e23de813e3971797ae6
- Form_Cari_Yonetimi_v2_3_FINAL.md | size=242 | sha256=bdcaa1d30c37af8896bfb93a702a2c0244c0d54760ebba5d88c6b4043eaa9a96

---
## Ana Gövde (Birleştirilmiş)
# Cari Yönetimi — UNIFIED v2.3 (Revize 20251105_090459)
> Bu revizyon, cari veri modelini (kart/iletişim/adres/banka) ve İş Emri/Barınma/MB bağlarını netleştirir; e‑Fatura (İşNet) kurallarını açıklar.

## Amaç ve Kapsam
# Cari Yönetimi — Form ve Kural Şartnamesi (v2_3 • FIX-1 DRAFT)
**Oluşturma:** 2025-11-05 01:26:25 +03:00  
**İlke:** Mevcut metni korur; portal çoklu kullanıcı, fiyat listesi çözüm sırası, e‑Fatura/e‑Arşiv alanları, risk/limit ve entegrasyon bağları genişletilir. Veri kaybı yok.

## 0) Amaç
- Müşteri (Cari) ana verisini tek yerde yönetmek; **fiyatlandırma, faturalama, e‑Fatura** ve **portal** akışlarına kaynak olmak.

## 1) Çapraz Etkiler (Atıflar)
- **Parametreler**: `units.canonical`, `vat.*`, `invoice.month_end_lock`, `service_rules`, `rates.*`.
- **Hizmet Yönetimi**: Fiyat **PriceListItem**’dan; Cari ataması **fiyat çözüm sırası** ile yapılır.
- **Kurlar**: Döviz tercihleri ve fatura kur **freeze** ilkeleri (INVOICE/CONTRACT) buradan etkilenir.
- **MB/Barınma**: Varsayılan **PriceListCode**, **Para** ve indirim/kapsam işaretleri (örn. `IsCabatogeTRFlag default`) cari seviyesinde tanımlanabilir.
- **İş Emri**: Portal kullanıcıları (çoklu), talep/faturalama yetkileri cari-scope içinde sınırlandırılır.
- **e-Fatura**: Entegratör (İşNet), profil, istisna kodları ve e‑Arşiv kriterleri buradan beslenir.

## 6) Raporlama
- Aktif EFatura/EArşiv müşterileri listesi.
- Eksik e‑posta/IBAN/adres ve hatalı VKN/TCKN raporu.
- PriceList kapsam raporu (cariye atanmamış olanlar).
- Risk ve gecikme raporu (tahsilat yaşı).

## 7) Güvenlik & Denetim
- PortalUsers değişiklikleri **audit** (user, ts, ip).  
- Erişim kapsamı **cari-scope** ile sınırlı.  
- Kişisel veriler için **KVKK** notu (şifrelenmiş depolama/maskeleme).

Cari Yönetimi; müşteri/tedarikçi kartlarının tekil ve doğrulanabilir şekilde tutulmasını sağlar. 
Barınma sözleşmeleri ve MB servis kayıtları bu kartlar üzerinden bağlanır; faturalama/e‑Fatura süreçleri için zorunlu alanlar güvence altına alınır.


## Veri Modeli (Cari Kartı)
## 2) Varlıklar ve Alanlar
### 2.1 Cari (Customer)
- **CariKod** (unique), **Unvan** (zorunlu)
- **VKN/TCKN** (zorunlu, unique), **VergiDairesi**
- **EInvoiceStatus**: `EFATURA | EARŞİV | KARMA`
- **EInvoiceProfile**: `TEMEL | TİCARİ` (varsayılan: `TİCARİ`)
- **EIntegrator**: `ISNET` (varsayılan), **Alias/GB**: alıcı posta kutusu (varsa)
- **Adres (Fatura)**: Ülke/İl/İlçe/PK/TamAdres
- **Adres (Operasyon)**: İskele/Rıhtım/Koordinat (ops.)
- **İletişim**: `Email[]`, `Telefon[]`; **e-posta zorunlu** (portal için)
- **IBAN[]** (format doğrulamalı)
- **PriceListCode (Default)**, **ParaTercihi** (`TRY|USD|EUR|...`), **PaymentTerms** (ör. `Net30`), **PaymentMethod** (ör. `EFT/Havale`)
- **VatDefault**: `Oran` veya `İstisnaKodu` (örn. `13/b`) — satırda override edilebilir
- **RiskLimit** (TRY), **RiskSeviye** (`Yeşil|Sarı|Kırmızı`), **BlockOnOverdue** (bool)
- **Blacklist** (bool) — faturaya ve operasyon atamalarına engel olabilir (parametre ile davranış)
- **IsCabatogeTRFlagDefault** (bool) — MB için varsayılan işaret
- **MuhasebeKod**: Harici ERP/LUCA cari kodu
- **Notlar**, **Etiketler[]**, **Audit**

## 3) Fiyat Listesi Çözüm Sırası
1) **Cari.PriceListCode** atanmışsa **doğrudan** bu kullanılır.  
2) Aksi halde **Cari.Segment/Grup** (varsa) üzerinden eşleşen PriceList.  
3) Aksi halde **Şirket Varsayılanı** (Parametreler.service.price_source) ve ilgili varsayılan PriceList.  
4) Hiçbiri yoksa → **Uyarı** (WO ve sefer/sözleşme taslak kalır; yayın/fatura engellenir).

## 4) e‑Fatura / e‑Arşiv Alanları
- **EIntegrator=ISNET**: Senaryo `TEMEL/TİCARİ`, alıcı statüsü EFatura değilse **e‑Arşiv**.  
- **UBL alanları**: `AccountingCustomerParty`, `TaxScheme`, `PartyIdentification` (VKN/TCKN), `PostalAddress`.  
- **KDV istisna**: satır/başlıkta **`<TaxExemptionReasonCode>`** (`13/b`, `17/4-o` vb.).  
- **e‑Arşiv zorunlulukları**: e‑posta/adres alanlarının doluluğu ve **TC kimlik/VKN** zorunlulukları.  
- **EArchiveConditions**: Tüzel/gerçek ayrımı ve limitler parametrelerden kontrol edilir.

## 5) Validasyon Kuralları
- **VKN/TCKN**: zorunlu, format ve **tekillik** kontrolü.
- **E‑posta**: en az bir geçerli e‑posta (portal için zorunlu).
- **Fatura Adresi**: zorunlu alan kontrolü.
- **IBAN**: TR IBAN formatı denetimi (TR\d{24} vb.).
- **Blacklist**: TRUE ise **faturalama/operasyon engeli** (uyarı ile) — davranış Parametreler’de.
- **RiskLimit/RiskSeviye**: limit aşımında onay gereksinimi veya otomatik blok (Parametreler.invoice.rules).

## 8) JSON Şeması (özet)
```json
{
  "customer": {
    "code": "CARI001",
    "title": "Örnek Denizcilik AŞ",
    "vkn": "1234567890",
    "einvoice_status": "EFATURA",
    "einvoice_profile": "TİCARİ",
    "eintegrator": "ISNET",
    "invoice_address": {
      "country": "TR", "city": "İzmir", "district": "Aliağa", "zip": "35800",
      "line": "Liman Cad. No:1"
    },
    "contacts": [{"email":"op@ornek.com","phone":"+90-232-000-0000"}],
    "ibans": ["TR000000000000000000000000"],
    "price_list_code": "PL_DEFAULT",
    "currency": "TRY",
    "vat_default": {"rate":20},
    "risk_limit": 1500000,
    "block_on_overdue": false,
    "blacklist": false,
    "tags": ["acente","motorbot"]
  },
  "portal_users": [
    {"email":"user1@ornek.com","role":"Requester","active":true},
    {"email":"muhasebe@ornek.com","role":"Billing","active":true}
  ]
}
```

## 9) Geçiş Planı
- Mevcut cariler korunur; eksik alanlar için **quick‑fix** sihirbazı (VKN/TCKN, e‑posta, IBAN, adres).
- PriceList ataması olmayan cariler raporlanır; manuel atama yapılana kadar hareketler **taslak** kalır.

**Customer (önerilen alanlar)**  
- `CustomerCode` *(PK)*, `Title` *(Unvan)*, `TaxId` *(VKN/TCKN)*, `TaxOffice`  
- `EInvoiceFlag` (E‑Fatura mükellefi mi), `EIntegrator='Isnet'` (kurala göre sabit), `Postbox`  
- `CurrencyPref` (ops.), `GLCode` (muhasebe öneri hesabı), `Status` *(Aktif/Pasif/Arşiv)*  
- `CreatedAt`, `UpdatedAt`, `CreatedBy`, `UpdatedBy`


## Veri Modeli (İletişim & Adres & Banka)
### 2.2 Cari Kullanıcıları (PortalUsers)
- **Email** (unique), **AdSoyad**, **Telefon**
- **Role**: `Requester | Viewer | Approver | Billing`
- **Active** (bool), **LastLoginAt**
- **Scope**: tek bir cari ile sınırlıdır (zorunlu).

### 2.3 Adresler/İletişim (çoklu)
- Çoklu adres ve iletişim kaydı desteklenir; faturalama sırasında **Fatura Adresi** zorunlu seçilir.

**CustomerAddress**(CustomerCode FK, Type: Fatura/Sevk, City, District, AddressLine, Country, PostalCode, Status)  
**CustomerContact**(CustomerCode FK, Name, Email, Phone, Role, Status)  
**CustomerBank**(CustomerCode FK, BankName, IBAN, Currency, IsDefault, Status)


## Kullanıcı Erişimi (Bir Cari → Çok Kullanıcı)
- **CustomerUser**(CustomerCode FK, UserId, Role: Owner/Editor/Viewer, Status).  
- Bir cari için birden fazla kullanıcı yetkilendirilebilir; mobil sahadan iş emri/MB girişini bu map belirler.


## Parametre ve Entegrasyon Bağları
- **e‑Fatura**: entegratör **İşNet**; `EIntegrator='Isnet'` ve e‑Fatura senaryosu için `Postbox` zorunludur.  
- **Birim/KDV/Kur**: Hizmet ve Fiyat listesi tarafındaki parametre sözlüklerine bağlanır (Customer bazlı özel kur: opsiyonel).


## İş Kuralları ve Validasyon
- `TaxId` benzersiz; TCKN=11 hane / VKN=10 hane kontrolü.  
- E‑Fatura mükellefi ise `Postbox` zorunlu.  
- Mükerrer unvan + vergi dairesi/vkn kombinasyonu engellenir.  
- Pasif müşteri yeni sözleşme/iş emri alamaz.


## Operasyon Bağlantıları (İş Emri / Barınma / MB)
- **Barınma**: `BarinmaContract.CustomerCode` üzerinden bağlanır; sözleşme PDF’i arşivde müşteri ile ilişkilendirilir.  
- **MB Servis**: sefer/bekleme kayıtlarında `CustomerCode` zorunlu; haftalık kapama raporları müşteri bazında toplanır.  
- **İş Emri**: müşteri girişli talep ekranında cari/doğrulama ve yetkilendirme bu karttan alınır.


## Faturalama & e‑Fatura/e‑Arşiv
- Fatura başlığı/adres/VD/VKN müşteri kartından otomatik gelir; E‑Fatura mükellefi ise E‑Fatura senaryosu kullanılır.  
- Entegratör **İşNet** ile uyum: belge yönlendirme için `Postbox`; iptal/İade akışlarında neden kodları saklanır.


## Dijital Arşiv & Sözleşmeler
- Müşteri bazında klasörleme: Sözleşme PDF, kimlik/vergi levhası, iletişim onayları. Metadata: `CustomerCode`, `DocType`, `ContractNo`.


## Raporlama ve İzleme
- `v_rep_mb_weekly_candidates` → müşteri bazında haftalık kapama.
- Barınma: aktif sözleşmeler, bitişe yaklaşanlar, kapsam oranı; faturalanan/faturalanmayan dönemler.
- Müşteri aktivite özeti: son iş emri/son fatura tarihi, bakiye (entegrasyon varsa).


## Test Senaryoları
1) E‑Fatura müşterisi oluştur → Postbox zorunluluğu çalışmalı.  
2) Aynı VKN ile yeni kart aç → mükerrer engellenmeli.  
3) Pasif müşteriye iş emri dene → işlem engellenmeli.  
4) MB haftalık kapama raporunda yeni müşterinin görünmesi.


## Sürüm Notu
UNIFIED v2.3 revizyonu: cari→çok kullanıcı yetkilendirme, e‑Fatura (İşNet) bağları ve Barınma/MB entegrasyonu netleştirildi.

