# MB Servis (Motorbot Sefer) — RUNBOOK v2.3 — FINAL MASTER
**Oluşturma:** 2025-11-05 13:23:13 +03:00
**İlke:** FINAL ve FINAL‑REV içerikleri tek parçada, tekrarsız ve çelişkisiz birleştirildi. Kısa form notları genişletildi; hesap motoru ve haftalık faturalama kuralları netleştirildi.

---
## Merge Manifest
- Form_MB_Servis_v2_3_FINAL.md | (görselden aktarıldı / mevcut değil)
- Form_MB_Servis_v2_3_FINAL_REV_20251105_085612.md | size=8259 | sha256=7b083696b47f47922536e735ab792dc339a6c8f5e2c712ca7fa9740ff2ccc40f


---
## 1) Form & CSV Şartnamesi (Günlük Kayıt)
**CSV:** `data/MB/mb_hizmet_gunluk.csv`

**Kolonlar**
```
Tarih,Baslangic,Bitis,CariKodu,TekneAdi,ServiceCode,Miktar,InvoiceDate,Not
```
- `ServiceCode` hizmet kartındaki **Kod** ile eşleşir (örn. `MB.SAAT`, `MB.SEFER`, `MB.BEKLEME`).
- Birim **saat** ise süre hesabı:
  - dakika = ceil((`Bitis` - `Baslangic`).TotalMinutes)
  - adım yuvarlama = `MB_STEP_MIN` (varsayılan: **6 dk = 0.1 saat**)
  - saat = max(`MB_MIN_HOURS`, ceil(dakika / 60, adım=0.1h))
  - **Örnek:** 10:05–13:50 ⇒ 225 dk ⇒ 228 dk ⇒ 3.8 h ⇒ **4.0 h** (0.1h yukarı)
- Birim **sefer** ise `Miktar` boşsa **1** kabul edilir.
- Kur freeze: **INVOICE** (`InvoiceDate`; boşsa `Tarih`).

**Haftalık çıktı**  
Girdi: `data/MB/mb_hizmet_gunluk.csv`  
Çıktı: `invoices\YYYY-WW\mb_weekly.csv`


---
## 2) Hesap Motoru
### 2.1 Fiyat Modeli
- `PER_TRIP` — sefer başına sabit fiyat (MB.SEFER).
- `BASE_PLUS_INCREMENT` — taban + blok artış (MB.SAAT).
- `PER_BLOCK` — yalnızca blok üzerinden ücret (bekleme vb.).

### 2.2 Parametreler (ModelParam)
```json
{
  "base_hours": 4,
  "block_minutes": 30,
  "rounding": "UP",
  "min_charge": "1xBASE",
  "wait_threshold_min": 10,
  "wait_block_minutes": 30
}
```
Parametre kaynağı: **Parametreler.mb** → Hizmet Kartı → PriceList hiyerarşisi.

### 2.3 Süre & Ücret
```
dk = ceil((Bitis - Baslangic).TotalMinutes)
saat = ceil(dk / 6) * 0.1                   # 6 dk = 0.1h
Tutar_sefer = saat × Tarife(MB.SAAT)        # PER_TRIP ise Miktar × Tarife(MB.SEFER)
```
**Bekleme:** `Bekleme_dk` > `wait_threshold_min` ⇒ `ceil(Bekleme_dk / wait_block_minutes)` blok → `MB.BEKLEME` satırı.
**MinCharge:** “1xBASE” gibi taban uygulaması indirimlerden **sonra** devreye girer.
**Yuvarlama modu:** `calc.rounding_mode` (varsayılan **UP**).

### 2.4 Örnek
- Sefer: 10:05–13:50 (225 dk)  
- Model: `BASE_PLUS_INCREMENT` (base=4h, block=30, rounding=UP)  
- 225 dk < 240 dk ⇒ **MinCharge** (1×BASE) uygulanır.  
- Bekleme: 12 dk ⇒ eşik 10 dk ⇒ 1 blok bekleme (MB.BEKLEME).


---
## 3) Faturalama (Haftalık)
- Dönem: **Pazartesi–Pazar**. Aday satırlar `v_rep_mb_weekly_candidates` ile toplanır.
- Kur: **INVOICE freeze** (fatura kesim anındaki Published kur).
- e‑Fatura: Satır açıklamasında sefer no ve süre; başlıkta kur/döviz kodu.
- `fatura.month_end_lock=TRUE` ise kapanan aya yeni MB faturası **oluşturulmaz**.


---
## 4) Bağlantılar
- **Kurlar:** Freeze ID bağlanması (InvoiceFreezeId). Hafta sonu/tatil ⇒ son Published kur + uyarı.
- **Hizmet Yönetimi:** `MB.SEFER`, `MB.SAAT`, `MB.BEKLEME` kartları; PriceListItem seçim kuralları.
- **Parametreler:** `mb.base_hours`, `mb.block_minutes`, `calc.rounding_mode`, `month_end_lock`.
- **İş Emri:** Sefer kaydı İş Emri içinden açılabilir; mobil sahadan giriş desteklenir.


---
## 5) Validasyon
- `Bitis` < `Baslangic` olamaz.
- PriceList bulunamazsa sefer **Taslak** kalır, faturaya alınmaz.
- Aynı TripNo iki kez faturalanamaz (idempotent).
- SüreDakika aşırı (≥24h) ise uyarı logu.


---
## 6) Raporlama & Log
- Haftalık özet: Toplam dakika/saat, bekleme blokları, indirimler, net tutar.
- Tutarlılık: `v_rep_rates_freeze_consistency` (kur bağları), eksik fiyat/kur uyarıları.


---
## 7) Sürüm Özeti (Delta + FIX6)
- InvoiceBridge FIX6: `Write-Host $(if...)` düzeltmesi, koşullu tek satır kullanım, KDV oran sahası toparlandı.
- Runner & Görev & Log: transcript log + 60+ gün temizliği; Scheduled Task çalışma dizini düzeltmesi.
- WebGUI Bootstrap: `aliaport_web.py`, `run_web.ps1`, hızlı sayfa; AJAX sayaç güncelleme.
- python-multipart zorunlu (form POST).
- İş Emri Kalem Katmanı: `data/is_emri.csv` & `data/is_emri_kalem.csv`; UI ile kalem ekleme.
- UX Patch: kartlar, canlı sayaç; tarife seçince birim/para auto‑fill.