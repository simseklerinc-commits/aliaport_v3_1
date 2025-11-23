# Hizmet Yönetimi (Tarife) — RUNBOOK (UNIFIED v2.3 • Final Merge)
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

## Şema — data/hizmet_tarife.csv

---
## Merge Manifest
- Form_Hizmet_Yonetimi_v2_3_FINAL_REV_20251105_085926.md | size=8324 | sha256=c636724ae457c4b4e0ba0ff4699d323b28ae202c2c7082390e1e9a204d27f1db
- Form_Hizmet_Yonetimi_v2_3_FINAL_REV_20251105_155648.md | size=904 | sha256=2c04a8c60a1e0a56d47869cf1b24e4c6cd9d3f3b0da7a5ce166fb3df121d5b88
- Form_Hizmet_Yonetimi_v2_3_FINAL.md | size=541 | sha256=913d4d63900b6cf57fad9ba224f7cbd8015d4d7ec94219ac756a307c158f93bc

---
## Ana Gövde (Birleştirilmiş)
# Hizmet Yönetimi — UNIFIED v2.3 (Revize 20251105_085926)
> Bu sürüm, başlıkları normalize eder, tekrarları ayıklar ve ServiceCard/PriceList modelini net şema ile tanımlar.

## Amaç ve Kapsam
# Hizmet Yönetimi — Form Şartnamesi (v2_3 FINAL • KANON)
**Oluşturma:** 2025-11-05 00:42:47 +03:00  
**İlke:** Tek dosya, veri kaybı yok. Ana gövde v2_3 UNIFIED; v2_1 base ve v2_2 addendum tam metin olarak eklerde yer alır.

# Hizmet Yönetimi — Form Şartnamesi
**UNIFIED v2_3 — oluşturma:** 2025-11-05 00:32:47 +03:00
**İlke:** Veri kaybı yok. Base dokümanlar ÖNDE, addendum metinleri *ayni dosyada* **[Merged Addendum v2_2]** başlığı altında sonuna eklenmiştir.

# Hizmet Yönetimi (Tarife) — Form Şartnamesi (v2_1)
Amaç: Hizmet kartlarını tanımlamak, fiyatları PriceList içinde sürümlemek, hesap motoru kurallarıyla tutar üretmek.

## UI Yol & Anchor
- Menü: Hizmet Yönetimi (alias: /tarife)
- Anchor: #menu-hizmet-kartlar-yonetim

## Hizmet Kartı — Alan Seti ve Doğrulamalar
- **Kod** (unique; regex `^[A-Z0-9_.-]{2,32}$`)
- **Ad** (3–120)
- **Birim** (ADET|SAAT|GÜN|SEFER|TON|M2|M3|METRE|KONTEYNER)
- **KDV** (0|1|10|20; vars. 20)
- **İstisna** (13/b, 17/4‑o, 11/1‑a, 13/a, …)
- **Para** (TRY|USD|EUR)
- **GrupKod** (`NN-…`) / **AltKod** (`NN.MM-…`) — opsiyonel hiyerarşi
- **Açıklama** (≤500)
- **Türev Alanlar (opsiyonel, şablon)**: BaseHours, BasePrice, ExtraHourPrice, BlockMin, Rounding(NEAREST|UP|DOWN), MinCharge

> Not: Fiyatlar hizmet kartında kalıcı tutulmaz; **PriceListItem** üzerinde sürümlenir.

## PriceList — Fiyat Yönetimi
- **PriceList**: Kod/Ad, BaseCurrency(TRY), EffectiveFrom/To?, Status(DRAFT|PUBLISHED|ARCHIVED), IsDefault?
- **PriceListItem**: TarifeKod, Price≥0, Currency, Rounding?, MinCharge?, Note
- Yayın akışı: DRAFT → PUBLISH (diff kaydı), ARCHIVE

## Eksik Fiyatlar Raporu
- Kartı olup listede **fiyatı olmayan** kalemler filtrelenebilir ve `logs\eksik_fiyatlar_*.csv` olarak dışa verilir.

## İçe/Dışa Aktarım
- **Hizmet Kartı CSV**
```
Kod,Ad,Birim,KDV,İstisna,GrupKod,AltKod,Aciklama,Para,BaseHours,BasePrice,ExtraHourPrice,BlockMin,Rounding,MinCharge
```
- **Fiyat Listesi CSV**
```
TarifeKod,Price,Currency,Rounding,MinCharge,Note
```

<!-- PATCH_U2_CALC_PRECEDENCE_VU2 -->
### Hesap Önceliği (sabit)
1) Satır Override (WorkLog/Manual)
2) PriceListItem (Cari özel fiyat varsa önce bu)
3) Hizmet Kartı Şablonu (kart üzerindeki varsayılanlar)
4) Parametre.calc (sistem/genel)

<!-- PATCH_U7_EKSIK_FIYATLAR_TRIGGER_VU2 -->
## Publish Öncesi Eksik Fiyat Kontrolü
- Yayın öncesi `TarifeKod` bazında boş/0 fiyatlar taranır.
- Çıktı: `logs/eksik_fiyatlar_YYYYMMDD.csv` ve UI uyarı banner'ı.

<!-- PATCH_VU4_HIZMET_TARIFELER -->
## Barınma & MB Tarifeleri (ek)
- Barınma: `BARINMA_GUN`, `BARINMA_AY`, `BARINMA_YIL`
- Motorbot Sefer: `MB_SEFER` (4 saat taban + ek saat blokları)
**Hesap Önceliği:** SatırOverride > PriceListItem > KartŞablon > Parametre.calc
**MinCharge Sırası:** Net tutara sonda uygulanır → Kur (rate-freeze) → Vergi.

# Form — Hizmet Yönetimi v2_2 (Addendum)
Tarih: 2025-11-05 00:08:10

Hizmet Yönetimi modülü, tüm hizmetlerin tekil bir **Hizmet Kartı** ile tanımlanmasını ve tarife/fiyat listeleri üzerinden
yayınlı fiyatların yönetilmesini sağlar. Grup-kod şeması ile katalog düzeni korunur (örn. `10- ...` ana grup, `10.10- ...` alt kalem).


## Veri Modeli (Hizmet Kartı)
## Atama — Cari Bazlı
- **PriceListAssignment**: CariKod, PriceListId, EffectiveFrom/To?, Priority(int; küçük = yüksek)

## Alanlar
- **Kod** (unique, immutable after first use)
- **Ad** (3–120)
- **GrupKodu** (zorunlu; `1..7`, `2.2`, `3.3`, `6.1` gibi)
- **Birim** (atomik)
- **Para**
- **KDVOran** *veya* **KDVİstisna**; **KdvDurumu** (HARİÇ/DAHİL)
- **FiyatModeli** (`PER_UNIT`, `PER_UNIT_X_SECONDARY`, `BASE_PLUS_INCREMENT`, `PER_BLOCK`, `TIERED`)
- **ModelParam** (JSON; modele göre ikincil ölçü, blok süresi, base+increment, volumetric 333 vb.)
- **Açıklama** (metin)
- **Audit**: CreatedBy/At, UpdatedBy/At
- **Durum**: Aktif (soft-delete yerine)

## Kurallar
- Hareket gören hizmet **silinemez**; **Kod** değiştirilemez.
- “**Kopyala → Yeni**”: tüm alanlar taşınır; **Kod** boş gelir.
- Quick‑Add: Birim/KDVOran/KDVİstisna — yetkiliye açık.

**ServiceCard** (önerilen alanlar)
- `ServiceCode` *(PK, nvarchar(50))* — örn: `MB_SEFER`, `BARINMA_GUNLUK`, `FORKLIFT_SAAT`
- `Name` *(nvarchar(200))*
- `GroupCode` *(nvarchar(50))* — **10-**, **10.10-** biçimi; grup kartları tanımıyla uyumlu
- `Unit` *(nvarchar(10))* — örn: GÜN, AY, YIL, SAAT, DK, ADET (birimler Parametreler’den gelir)
- `KDVGroup` *(nvarchar(20))* — örn: KDV20, KDV0, İstisna13b, İstisna17_4o
- `AccountCode` *(nvarchar(20), opsiyonel)* — tek düzen hesap planı eşleşmesi
- `Status` *(nvarchar(20))* — Taslak / Aktif / Pasif / Arşiv


## Veri Modeli (Tarife / Fiyat Listesi)
**PriceList**
- `PriceListCode` *(PK)*, `Name`, `IsTarget` (raporlar hedef liste)

**PriceListItem**
- (PK) `(PriceListCode, ServiceCode, ValidFrom)`
- `Currency (TRY/USD/EUR)`, `UnitPrice (decimal(18,4))`, `ValidTo (date, NULL=sonsuz)`
- `Status` — Taslak / **Published** / Arşiv
- Geçerlilik kuralı: **Published** ve tarih kesişimi **bugün** ile uyumlu olan kalem seçilir.


## Parametre Bağları
## Hesap Motoru (özet)
- Blok (dakika) ve Yuvarlama (UP|NEAREST|DOWN)
- MinCharge (asgari)
- 4‑Saat Eşiği: `t<=4 → base_price` ; `t>4 → base_price + ceil(t-4)*extra_hour_price`
- Kur çevriminde **rate‑freeze** (fatura tarihi)

**MinCharge Uygulama Sırası:** Hesaplanan net hizmet bedeline _sonda_ uygulanır → ardından kur (rate-freeze) → vergi.

- **Birimler**: `Parametreler` formunda kod-ad tanımı; ServiceCard.Unit bu setten seçilir.
- **Kur**: `config.usdtry_rate` (şablonda) ya da **Rates Freeze** tabloları üzerinden dönemsel set.
- **Alias/URL**: UI tarafında `/hizmet-yonetimi` → `/tarife` alias bilgisi (ileride web arayüz açıldığında).


## İş Kuralları
- **Benzersizlik**: `ServiceCode` tekil; grup kodu + ad kombinasyonu benzersiz önerilir.
- **Durum akışı**: Taslak → Review → **Published** → Arşiv. Published kalemler düzenlenmez, **yeni versiyon** eklenir.
- **Tutarlılık**: Bir hizmet **Pasif** ise o hizmete ait `PriceListItem` yeni yayın alamaz.
- **Fiyat Yok** uyarısı: hedef liste(ler) için yayınlı fiyatı olmayan aktif hizmetler raporda görünür.


## Hesaplama Motorları ile İlişki
- **MB Servis**: `MB_SEFER` ve `MB_BEKLEME` saatlik baz alınır; iç veri dakika, rapor 0.1 saat yuvarlamalı (**gece tarifesi yok**).
- **Barınma**: `BARINMA_GUNLUK/AYLIK/YILLIK` ile periyot temelli **prorata**.
- **Forklift/4-saat** gibi kurallar: Hizmet kartında **kural etiketi** ve zorunlu alanlar ile iş motoruna sinyal verilir.


## Yayın / Onay Süreci
- Fiyat kalemi **Taslak** iken çoklu gözden geçirme yapılabilir; yayımlama anında kural: tarih örtüşmesi çakışmayacak.
- Yayımlama log’u: kullanıcı, zaman, gerekçe; geri alma için eski versiyon **Arşiv** statüsünde tutulur.


## Muhasebe & KDV Bağlantıları
- Hizmet kartındaki `KDVGroup` fatura satırına doğrudan yansır; 13/b ve 17/4-o istisnaları parametre bazlıdır.
- `AccountCode` dolu ise muhasebe entegrasyonunda öneri hesap olarak kullanılır.


## Raporlama ve İzleme
- **v_rep_prices_missing** — yayınlı fiyatı olmayan aktif hizmetler
- **v_rep_price_orphan** — hizmet kartı pasif/silinmiş iken yayında kalan fiyat kalemleri
- Değişiklik günlüğü: kullanıcı, alan, eski→yeni, zaman (opsiyonel `WorkLog` ile ilişki)


## Test Senaryoları
1) Yeni hizmet kartı → Published fiyat ekle → raporlarda **hiçbir eksik** görünmeyecek.  
2) Kartı Pasif yap → orphan raporunda ilgili kalemler görünecek.  
3) Fiyat tarih çakışması dene → yayımlama **engellenmeli**.


## Sürüm Notu
## Merge Manifest
- Form_Hizmet_Yonetimi_UNIFIED_v2_3.md | size=4075 bytes | sha256=5231d3254a2d5daf6fb3cf99022734b5fc87ec46e8fc2084507ce8ef0e29426d
- Form_Hizmet_Yonetimi.md | size=2909 bytes | sha256=d3575d3eb67dff2f4ecfde9dfb67ce81e638ade60fb983092bab5b0e34821ebb
- Form_Hizmet_Yonetimi_v2_2_Addendum.md | size=833 bytes | sha256=9269f5ef98bf1011161b2fbecdcf0c0bf0138e4d1f185794f76ad06a3cd673c2

---
## Ana Gövde — v2_3 UNIFIED

### [UNIFY-MERGE NOTE] Merged Addendum v2_2

## EK‑A: v2_1 Base (Tam Metin)

## EK‑B: v2_2 Addendum (Tam Metin)

UNIFIED v2.3 revizyonu: grup kod şeması netleştirildi, ServiceCard/PriceList veri modeli alanları tamlandı,
rapor ilişkileri eklendi, MB/Barınma hesap motoru bağları belirtildi.

