# Aliaport — MANIFEST RUNBOOK v2.3 — FINAL MASTER

**Oluşturma:** 2025-11-05 13:36:20 +03:00
**İlke:** Dört kaynaktaki bilgiler tek parçada, *tekrarsız ve çelişkisiz* birleştirildi. Kanonik dosya listesi bu belgeye ankore edildi; FIX6 değişiklikleri 'Sürüm Özeti'nde özetlendi.


---
## Merge Manifest (4 kaynak)
- Aliaport_RUNBOOK_v2_3_FINAL.md | size=3880 | sha256=e89d16bbf0bff1dd40c4968bec0b486fee0d0b434d649cd24df1457be8cb1176
- Aliaport_RUNBOOK_v2_3_FINAL_FIX3(1).md | size=6395 | sha256=8dcbd8af3838d3e7b49440d0c26cca2e7b50b0ac17d199fa35750cd0741b97cf
- Aliaport_RUNBOOK_v2_3_FINAL_REV_FIX6_20251105_155648.md | size=1663 | sha256=e402d6f91c52a15cc2afcc89ed07e276c03491edc4612249b82e57188880640d
- Aliaport_v2_3_Canonical9_Manifest.md | size=1824 | sha256=46e428d1cf4b0e8f90d63319636f274b5b71dbcecc7382e76b73ae264e9fe134


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
## Canonical 9 Dosya Seti
## Seçilen Dosyalar:
- **RUNBOOK** → `Aliaport_RUNBOOK_v2_3_FINAL_FIX3(1).md`
- **PARAMETRELER** → `Form_Parametreler_v2_3_FINAL_REV_20251105_090147.md`
- **HIZMET** → `Form_Hizmet_Yonetimi_v2_3_FINAL_REV_20251105_085926.md`
- **ISEMRI_ARSİV** → `Form_IsEmri_Archive_v2_3_FINAL_REV_20251105_090930.md`
- **CARI** → `Form_Cari_Yonetimi_v2_3_FINAL_REV_20251105_090459.md`
- **BARINMA** → `Form_Barinma_v2_3_FINAL_REV_20251105_085304.md`
- **MB_SERVIS** → `Form_MB_Servis_v2_3_FINAL_REV_20251105_085612.md`
- **KURLAR** → `Form_Kurlar_v2_3_FINAL_REV_20251105_090708.md`
- **REPORTS_MENU** → `Aliaport_Reports_Menu_v2_3_FINAL_REV_20251105_091257.md`


---
## 1) Çapraz Kural Özeti
- **Parametreler** → Canonical birimler, KDV/istisna, rounding/blocks, freeze önceliği: `ROW_OVERRIDE > CONTRACT > INVOICE`.
- **Kurlar** → `INVOICE` (MB/genel) & `CONTRACT` (Barınma) freeze; 09:05/17:30 publish; tatilde **son yayınlanan + uyarı**.
- **Hizmet Yönetimi** → Fiyat **yalnız PriceListItem’da**; kartta **fiyat yok**; `FiyatModeli + ModelParam(JSON)` doğrulaması.
- **Barınma** → `CONTRACT` freeze (`ContractFreezeId`), **GÜNLÜK/AYLIK/YILLIK**, pro-rata ve `invoice.day`.
- **MB Sefer** → Haftalık faturalama + `INVOICE` freeze; tipik model `BASE_PLUS_INCREMENT`.
- **İş Emri + Arşiv** → Portal (çoklu kullanıcı), mobil saha (başlat/durdur), idempotent fatura; arşiv PDF + hash.
- **Cari** → PriceList çözüm sırası: `Cari → Segment → Şirket Vars.`; İşNet entegrasyonu ve e‑Arşiv kriterleri.
- **Raporlar Menüsü** → Tüm modüller için panolar, tutarlılık ve denetim raporları (bkz. `Aliaport_Reports_Menu_v2_3_FINAL.md`).

---


---
## 1) Ortam ve Yol Varsayımları
- PowerShell 7+: `pwsh.exe`
- Proje kökü: `C:\Aliaport\Aliaport_v2_1`
- Veri klasörü: `data\`
- Rapor/çıktı klasörü: `invoices\` (MB haftalık, Barınma aylık), `invoices\errors\` (hata CSV), `invoices\logs\` (çalışma logları)


---
## 2) Parametreler (kritik)
`data\parametreler.csv` anahtarları (örn. Key,Value):
- `MB_STEP_MIN` = `6`  → Motorbot saat hesaplamasında 6 dk adım yuvarlama  
- `MB_MIN_HOURS` = `4.0`  → Motorbotta minimum fatura saati
- `KDV_RATE` = `0.20`  → Varsayılan KDV (kartta KdvOran boşsa bu alınır)
- `TARIFE_BIRIMLER` = `adet;saat;sefer;ay`  → Birim evreni


---
## 3) Hizmet Kartları
`data\hizmet_tarife.csv` alanları:  
`Kod,Ad,Birim,Fiyat,Para,KdvOran,Etkin,GrupKodu`  
- **Birim**: `saat|sefer|adet|ay`  
- **Para**: `TRY|USD|EUR`  
- **Etkin**: `1|0`  
- **GrupKodu**: rapor gruplamaları için (opsiyonel)

**Freeze Politikası:**  
- Motorbot (MB): **INVOICE freeze** (satırın `InvoiceDate` günü kuru dondurur; boşsa `Tarih`)  
- Barınma: **CONTRACT freeze** (`FreezeDate` varsa o gün; yoksa `Baslangic` günü)


---
## 4) MB Günlük Servis Girişi
`data\MB\mb_hizmet_gunluk.csv` alanları:
```
Tarih,Baslangic,Bitis,CariKodu,TekneAdi,ServiceCode,Miktar,InvoiceDate,Not
```
- `Birim == 'saat'` → **Saat** hesabı:  
  - `dakika = ceil((Bitis-Baslangic).TotalMinutes)`  
  - `yuvarla = Ceiling(dakika / MB_STEP_MIN) * MB_STEP_MIN`  
  - `saat = max(MB_MIN_HOURS, yuvarla/60)`  
  - Örnek: **10:05–13:50** → 225 dk → 6 dk adım: 228 dk → 3.8 h → **min 4.0** → `Qty=4.0`
- `Birim == 'sefer'` → `Miktar` boşsa `1` kabul edilir.


---
## 5) Barınma Sözleşmeleri
`data\barinma_sozlesme.csv` alanları:
```
SozlesmeNo,CariKodu,TekneAdi,Baslangic,Bitis,AylikBedel,Para,FreezeDate,Not
```
- **Prorata (Aylık)**: Ay başı–ay sonu penceresine göre gün oranı:  
  `oran = kapsanan_gun / ay_toplam_gun` → `NetTRY = (AylikBedel*kur) * oran`
- Freeze: **CONTRACT** (yukarıda).


---
## 6) İş Emri Arşivi ve Kalem Katmanı
**Yeni** veri katmanı (CSV):
- `data\is_emri.csv`  
  `IsEmriNo,TalepNo,CariKodu,TekneAdi,Durum,Baslangic,Bitis,Sorumlu,Not`
- `data\is_emri_kalem.csv`  
  `IsEmriNo,Sira,HizmetKodu,Birim,Qty,UnitPrice,Para,KDVOran,Source,FreezePolicy,FreezeDate,Not`

**Akış:** Talep → Onay → **Kalemler** (hizmet seç; saat/sefer/ay mantığı) → Ön muhasebe/InvoiceBridge → Faturalandırma → Kapandı.


---
## 7) InvoiceBridge (MB Haftalık + Barınma Aylık)
Çıktılar:
- MB → `invoices\YYYY-WW\mb_weekly.csv`
- Barınma → `invoices\YYYY-MM\barinma_monthly.csv`
- Hata listesi: `invoices\errors\invoice_bridge_errors_YYYYMMDD_HHMMSS.csv`
- Çalışma logu: `invoices\logs\invoice_bridge_YYYYMMDD_HHMMSS.log`

Çalıştırıcı:
- `Aliaport_v2_1_InvoiceBridge_Export_v2_3_FIX6.ps1` (INVOICE/CONTRACT freeze implementasyonu)  
- Runner: `Aliaport_InvoiceBridge_Run.ps1` (transcript + log temizleme, **param** en üstte)

Zamanlanmış Görev:
- `Aliaport_InvoiceBridge_Weekly` (Pzt 07:30), çalışma dizini proje kökü.


---
## 2) Runner + Görev + Log
- Transcript log + 60+ gün temizliği.
- Görev adı: Aliaport_InvoiceBridge_Weekly (Pazartesi 07:30)


---
## 3) WebGUI
- /ui kartlı sayaçlar; /api/run-invoicebridge AJAX tetikleme.
- /ui/is-emri: liste + Kalem Ekle formu (tarife → birim/para auto-fill).
- Başlatma: pwsh -NoProfile -ExecutionPolicy Bypass -File C:\Aliaport\Aliaport_v2_1\run_web.ps1


---
## 4) İş Emri Kalem Katmanı
- data\is_emri.csv ve data\is_emri_kalem.csv mevcut olmalı; Sira aynı İşEmriNo’da otomatik artar.


---
## 5) Doğrulama
- invoices\YYYY-WW\mb_weekly.csv ve invoices\YYYY-MM\barinma_monthly.csv oluşur.
- Hata CSV başlıklı boş şablon olur.
- http://127.0.0.1:8010/ui açılır.


---
## 8) Raporlar Menüsü (UI)
- “**Invoice Bridge Çalıştır**”
- “**MB Haftalık CSV**” (son hafta klasörü aç)
- “**Barınma Aylık CSV**” (son ay klasörü aç)
- “**Hata Günlüğü**”, “**Çalışma Logları**” kısayolları


---
## 3) Raporlar — Bağlantı ve Kodlar
- **Menü dosyası**: `Aliaport_Reports_Menu_v2_3_FINAL.md`  
- **Rapor kodları** (seçme örnekler):
  - `R2.1` Eksik Fiyat, `R2.2` Orphan Price, `R2.4` ModelParam Uyum
  - `R3.3` Freeze Tutarlılığı, `R3.4` Manuel Publish Audit
  - `R4.3` Barınma Pro‑Rata Doğrulama, `R4.4` Gelir Özeti
  - `R5.1` MB Haftalık Adaylar, `R5.2` Süre/Model Uyum, `R5.4` Anomali
  - `R6.1` SLA, `R6.4` Arşiv Bütünlüğü, `R6.5` Idempotent Koruma
  - `R7.1` e‑Fatura Kapsamı, `R7.4` UBL Red Sebepleri
  - `R8.1` Parametre Diff, `R8.3` Portal Kullanımı

> SQL View şablonları için bir sonraki adımda `FIX-3` hazırlanacaktır (örn. `v_rep_prices_missing`, `v_rep_rates_freeze_consistency` vb.).

---


---
## Raporlar Menüsü — v2.3 Final (Entegre)
Bu bölüm, **R1–R5** çekirdek view’ları ve **R6–R9** öneri raporlarını tek ekranda toplar.
Kısa özet:
- **R1 — v_rep_prices_missing:** hedef listede yayınlı fiyatı olmayan aktif hizmetler.
- **R2 — v_rep_price_orphan:** pasif/silinmiş kartlara bağlı yayın kalemleri.
- **R3 — v_rep_rates_freeze_consistency:** MB (InvoiceFreezeId) ve Barınma (LineFreezeId = ContractFreezeId) tutarlılığı.
- **R4 — v_rep_mb_weekly_candidates:** haftalık kapama adayları.
- **R5 — v_rep_barinma_prorata_check:** barınma dönem kapsam kontrolü.
- **R6–R9 (öneri):** FX coverage, pending WO, archive dağılımı, SLA ihlali.

Ayrıntılı kullanım ve örnek sorgular için: **Raporlar Menüsü (v2.3 Final Rev)** dosyasına bakınız.


---
## 2) Dağıtım (STOP → PATCH → START → OPEN)
### 2.1 Backup-first
```powershell
$ErrorActionPreference='Stop'
$P  = 'C:\Aliaport\Aliaport_v2_1\runbook'
$BK = Join-Path 'C:\Aliaport\Aliaport_v2_1' ("backup\runbook_FIX2_" + (Get-Date -Format 'yyyyMMdd_HHmmss'))
New-Item -ItemType Directory -Force -Path $BK | Out-Null
Copy-Item -LiteralPath $P -Destination $BK -Recurse -Force
"Yedek → $BK"
```

### 2.2 FIX-2 kopyalama
```powershell
$src1 = "$env:USERPROFILE\Downloads\Aliaport_RUNBOOK_v2_3_FINAL_FIX2.md"
$dst1 = 'C:\Aliaport\Aliaport_v2_1\runbook\Aliaport_RUNBOOK_v2_3_FINAL_FIX2.md'
Copy-Item $src1 $dst1 -Force

$src2 = "$env:USERPROFILE\Downloads\Aliaport_Reports_Menu_v2_3_FINAL.md"
$dst2 = 'C:\Aliaport\Aliaport_v2_1\runbook\Aliaport_Reports_Menu_v2_3_FINAL.md'
Copy-Item $src2 $dst2 -Force
"RUNBOOK ve Raporlar Menüsü güncellendi → $dst1 ; $dst2"
```

### 2.3 FINAL dosya varlık kontrolü
```powershell
$must = @(
'Form_Parametreler_v2_3_FINAL.md',
'Form_Kurlar_v2_3_FINAL.md',
'Form_Barinma_v2_3_FINAL.md',
'Form_MB_Servis_v2_3_FINAL.md',
'Form_Hizmet_Yonetimi_v2_3_FINAL.md',
'Form_IsEmri_Archive_v2_3_FINAL.md',
'Form_Cari_Yonetimi_v2_3_FINAL.md',
'Aliaport_Reports_Menu_v2_3_FINAL.md'
)
$missing = @()
foreach($m in $must){ if(!(Test-Path (Join-Path $P $m))){ $missing += $m } }
if($missing.Count){ throw "Eksik FINAL dosyalar: $($missing -join ', ')" } else { "FINAL dosyalar tamam." }
```
---


---
## 4) Yol Yazımı ve Notlar
- Tüm yol örnekleri **Windows** biçiminde `C:\\Aliaport\\...` olarak yazılmıştır.
- UI ve servis başlatma adımları proje özelidir; port varsayılanı **8010**.

---


---
## 5) Versiyonlama
- Bu belge `Aliaport_RUNBOOK_v2_3_FINAL_FIX1.md` üzerine **FIX-2** güncellemesidir.
- Modül dosyaları `_v2_3_FINAL.md` adlarıyla kilitlidir. Sonraki değişiklikler **FIX-3** kapsamında ele alınacaktır.


---
## Ekler / Referans Dosyaları (v2.3 Final Rev Set)
Aşağıdaki dosyalar bu runbook sürümüne **bağlı ve tutarlı** olacak şekilde güncellenmiştir:

- [Form — Barınma (v2.3 Final Rev)](sandbox:/mnt/data/Form_Barinma_v2_3_FINAL_REV_20251105_085304.md)
- [Form — MB Servis (v2.3 Final Rev)](sandbox:/mnt/data/Form_MB_Servis_v2_3_FINAL_REV_20251105_085612.md)
- [Form — Hizmet Yönetimi (v2.3 Final Rev)](sandbox:/mnt/data/Form_Hizmet_Yonetimi_v2_3_FINAL_REV_20251105_085926.md)
- [Form — Parametreler (v2.3 Final Rev)](sandbox:/mnt/data/Form_Parametreler_v2_3_FINAL_REV_20251105_090147.md)
- [Form — Cari Yönetimi (v2.3 Final Rev)](sandbox:/mnt/data/Form_Cari_Yonetimi_v2_3_FINAL_REV_20251105_090459.md)
- [Form — Kurlar (v2.3 Final Rev)](sandbox:/mnt/data/Form_Kurlar_v2_3_FINAL_REV_20251105_090708.md)
- [Form — İş Emri + Arşiv (v2.3 Final Rev)](sandbox:/mnt/data/Form_IsEmri_Archive_v2_3_FINAL_REV_20251105_090930.md)
- [Raporlar Menüsü (v2.3 Final Rev)](sandbox:/mnt/data/Aliaport_Reports_Menu_v2_3_FINAL_REV_20251105_091257.md)

---
**FIX-3** — 20251105_091522: Raporlar Menüsü bölümü eklendi; tüm form/runbook dosyaları revizyon linkleri ile zincirlendi.