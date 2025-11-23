# Parametreler — RUNBOOK v2.3 — FINAL MASTER

**Oluşturma:** 2025-11-05 13:30:15 +03:00

**İlke:** Üç kaynak tek parçada, tekrar ve çelişki olmadan birleştirildi. Varsayılan değerler **FINAL** dokümandaki tabloya göre kanonikleştirilip (override edilebilir), REV değişiklikleri **Sürüm Özeti**ne taşındı.


---
## Merge Manifest
- Form_Parametreler_v2_3_FINAL.md | size=587 | sha256=e3503a13f07b541cfe800b7b1be35a296664a3d959f57b125b2afa53f9371151
- Form_Parametreler_v2_3_FINAL_REV_20251105_090147.md | size=6815 | sha256=60d871b05cab81e5f72780e5620ec7ea345c4c01bec898b4e424e966924f5c48
- Form_Parametreler_v2_3_FINAL_REV_20251105_155648.md | size=714 | sha256=a520c340791221752e9dd0a9ec84224c6510ec98413766a0130b15065b535937


---
## Sürüm Özeti (Delta + FIX6)
> **Delta v2.1 → v2.3 (FIX6) Özet)**
> - InvoiceBridge FIX6: Write-Host $(if ...) düzeltmesi, elseif/else tek satır kullanımı, KDVOran sahası toparlandı.
> - Runner & Görev & Log: Transcript log + 60+ gün temizliği, Scheduled Task çalışma dizini düzeltmesi.
> - WebGUI Bootstrap: aliaport_web.py, run_web.ps1, /ui ana sayfa, AJAX sayaç güncelleme.
> - python-multipart zorunlu (form POST).
> - İş Emri Kalem Katmanı: data/is_emri.csv & data/is_emri_kalem.csv; UI ile kalem ekleme.
> - UX Patch: kartlar, canlı sayaç, tarife seçince birim/para auto-fill.


---
## 0) Amaç ve Kapsam
Parametreler modülü; **birimler**, **KDV grupları**, **kur/freeze setleri** ve **iş kuralı anahtarları** dahil olmak üzere
hesap motorlarının davranışını belirleyen sözlükleri merkezi olarak yönetir. MB (motorbot), Barınma, Hizmet Yönetimi ve
e‑Fatura ile doğrudan ilişkilidir.



---
## 1) Veri Modeli & Saklama
### 1.1 CSV Sözleşmesi — `data/parametreler.csv`
```
Key,Value
```
- Her satır bir anahtar/değer çifti tanımlar. Anahtar adları **büyük/küçük** duyarlı değildir.
- Değer tipleri (int/decimal/bool/json) anahtara göre çözülür; geçersiz tipler reddedilir.

### 1.2 SQL & ParamStore
- `Param_Flags(Key, Value, Desc, Status)` — küçük ve atomik anahtarlar.
- `Param_Store(Key, JsonValue)` — JSON saklama (gruplu/karma değerler için).
- Sözlük tabloları: `Param_Unit`, `Param_KDVGroup`, `Rates(*)` (freeze ile).



---
## 2) Kanonik Varsayılanlar (override edilebilir)
Aşağıdaki varsayılanlar **FINAL** tablosundan alınmıştır ve proje genelinde **kanonik** kabul edilir. Dosya/ekran üstünden
değiştirilebilir; değişim geçmişi loglanır.

| Key | Varsayılan | Tanım |
|-----|------------|-------|
| MB_STEP_MIN | 6 | MB süre adımı (dakika) — 6 dk = **0.1 saat** |
| MB_MIN_HOURS | 4.0 | MB minimum saat/Min‑charge için taban |
| KDV_RATE | 0.20 | Varsayılan KDV oranı |
| TARIFE_BIRIMLER | adet;saat;sefer;ay | UI doğrulama için geçerli birimler listesi |



> Not: REV dokümandaki örnek konfigürasyonlarda `MB_STEP_MIN=15`, `MB_MIN_HOURS=1.00` görülmektedir; bunlar **örnek/alternatif**
> yapılandırmalardır. Kanonik varsayılan **6 dk** ve **4.0 saat** olarak sabittir; ihtiyaca göre CSV/ParamStore üzerinden override edilir.



---
## 3) Parametre Envanteri (gruplu)
### 3.1 MB (Motorbot)
- `MB_STEP_MIN` (int, dk) — süre adımı (**6** kanonik).
- `MB_MIN_HOURS` (decimal, saat) — min‑charge tabanı (**4.0** kanonik).
- `mb.base_hours` (decimal, saat) — model tabanı (varsayılan 4.0).
- `mb.block_minutes` (int) — artış/blok dk (varsayılan 30).
- `calc.rounding_mode` (UP|NEAREST|DOWN) — hesap yuvarlama.
- `min_charge_rules` (json/str) — örn. `"1xBASE"`.
- `wait_threshold_min` (int) — bekleme eşiği (varsayılan 10).
- `wait_block_minutes` (int) — bekleme blok dk (varsayılan 30).

### 3.2 Barınma
- `barinma.periyot_default` (GUN/AY/YIL; varsayılan AY).
- `barinma.pro_rata` (bool; varsayılan false).
- `Barinma_Decimals` (int; **2**).

### 3.3 KDV & Kur
- `KDV_RATE` (decimal; 0.20).
- `KDVGroup` sözlüğü: KDV20, KDV10, KDV0, İstisna13b, İstisna17_4o (kanun referansı ile).
- `Rates`/freeze: Published set → `InvoiceFreezeId`/`ContractFreezeId` referansları.

### 3.4 Birimler
- Kanonik: ADET, SAAT, GÜN, AY, YIL, DK, SEFER, TON, KG, LİTRE, M2, M3, METRE, KONTEYNER, GRT.
- Alias: örn. `"hr"→SAAT`, `"adet"→ADET` (UI import sırasında normalize edilir).

### 3.5 Diğer
- `fatura.month_end_lock` (bool) — kapanan aya yeni MB/Barınma faturası oluşturmayı engeller.
- `rbac.gate.card_requires_monthly_sgk` (bool; varsayılan true).
- `archive.expiry_remind_days` (int; örn. 15).



---
## 4) Davranış ve Entegrasyon
- **MB Servis**: süre hesabı 6 dk = 0.1 saat adımı; Min‑charge `MB_MIN_HOURS`; bekleme eşiği/blokları parametreye bağlı.
- **Barınma**: periyot ve pro‑rata hesaplama `barinma.*` ile; raporlarda 2 ondalık.
- **Kurlar**: fatura anında **INVOICE freeze**, sözleşmede **CONTRACT freeze**; hafta sonu/tatilde son Published set.
- **Hizmet Yönetimi**: ServiceCard.Unit/KDVGroup parametre sözlüklerine bağlı; PriceList yayın akışı `PriceList.IsTarget=1` setine göre.
- **e‑Fatura**: KDV oran ve muafiyetler parametreden; döviz ve kur alanları freeze referansıyla gelir.



---
## 5) Validasyon
- CSV anahtarları tekrar edemez (sonraki değer öncekinin yerine geçer — uyarı loglanır).
- Bilinmeyen anahtar **reddedilir** (opsiyon: allow‑unknown=false).
- `MB_STEP_MIN` > 0 ve 60'ı bölmeli; `MB_MIN_HOURS` ≥ 0.
- KDV oranı [0, 1] aralığında olmalı.
- `PriceList.IsTarget=1` en az bir liste bulunmalı.



---
## 6) Raporlama & İzleme
- `v_rep_prices_missing`: hedef listeye göre yayınlı fiyatı olmayan hizmetler.
- `v_rep_price_orphan`: pasif/silinmiş kartlara bağlı fiyatlar.
- Parametre değişim log’u: kullanıcı, zaman, eski→yeni.



---
## 7) Test Senaryoları
1) `MB_STEP_MIN=6` → 7 dk girişinde hesap **0.2 saat** olmalı.  
2) `MB_MIN_HOURS=4.0` → 3.8 saatlik seferde min‑charge uygulanmalı.  
3) Barınma AY periyot + pro‑rata **false** → tam ay fiyat; **true** → gün bazlı oran.  
4) `KDV_RATE=0` seçili hizmet → e‑Fatura satırında KDV0 ve uygun gerekçe.



---
## 8) Dağıtım
- CSV: `data/parametreler.csv` güncel değerlerle yayınlanır.
- SQL: `Param_Flags` ve/veya `Param_Store` sync job ile eşitlenir.
- UI: Parametreler sayfası role‑guard (Parametre Yöneticisi/Read‑Only).
