# Kurlar — RUNBOOK (v2.3) — FINAL MASTER

**Oluşturma:** 2025-11-05 13:14:48 +03:00

**İlke:** Dört kaynağın tamamı tek sürümde birleştirildi; tekrar eden/çelişen kısımlar tekilleştirilip netleştirildi.


---
## Merge Manifest (4 kaynak)
- Aliaport_RUNBOOK_KURLAR_v2_3_UNIFIED_FINAL_MERGED_20251105.md | size=8795 | sha256=1d4f0a8c1339d7467c2656146ba19e7737279699462bbbde824a69b5ac4dac93
- Form_Kurlar_v2_3_FINAL.md | size=292 | sha256=f6cbb8b723bfc75caa9b7745483d1bcd51773ff4ea04149c5d6884362dd3e6f3
- Form_Kurlar_v2_3_FINAL_REV_20251105_090708.md | size=7511 | sha256=f463b1cb2876e1aa21fc3cffc3c82c5d1f30ee93bc11b6dfe7f4486ab8a1a06e
- Form_Kurlar_v2_3_FINAL_REV_20251105_155648.md | size=750 | sha256=3c5dd9f71a0e6a8c4d96955539df7f4e1fabfee8ed61aa1638dc98627d64df61


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
- TCMB kaynaklı ve manuel yayınlı döviz kurlarını yönetmek.
- Faturalama ve sözleşmelerde **rate‑freeze** (kur sabitleme) uygulayarak geçmiş belgeleri kur dalgalanmasından korumak.
- Barınma (contract freeze) ve MB sefer (invoice freeze) akışlarıyla yeknesak çalışmak.

---
## 1) Veri Modeli
### 1.1 Rates (başlık)
- **RateId** *(PK)*, **Name**, **Status** *(Draft/Published/Archived)*, **CreatedAt/By**, **Notes**.

### 1.2 RateLine (satırlar)
- **(PK)**: `(RateId, BaseCurrency, QuoteCurrency, ValidFrom)`
- **Rate**: `decimal(18,8)` — *Base→Quote* (örn. USD→TRY: 34.5000)
- **ValidTo**: `date` *(NULL=sonsuz)*, **Source**: `TCMB | Manuel | ...`, **Status**: `Draft/Published`

---
## 2) Davranışlar — Freeze Mantığı
### 2.1 Fatura Genel Freeze (INVOICE)
- Fatura kesildiği anda ilgili döviz çifti için **en son Published** ve **valör uygun** kayıt bağlanır (**InvoiceFreezeId**).
- Yeniden oluşturma/tekrar basım freeze'i değiştirmez.

### 2.2 Satır Bazlı Price‑Freeze (ROW_OVERRIDE)
- Döviz bazlı satır TL’ye çevrilirken **InvoiceFreezeId** kullanılır; özel durum gerekirse satır kendi **freeze_id**’sine sahip olur.

### 2.3 Sözleşme Bazlı Freeze (CONTRACT)
- **Barınma** sözleşmeleri için kur, **sözleşme başlangıç tarihinde** sabitlenir (**ContractFreezeId**). Aylık faturalar aynı freeze’i kullanır.

### 2.4 Hafta Sonu/Tatil
- TCMB yoksa **son Published** kur kullanılır; uyarı loglanır.

---
## 3) Hesaplama & Yuvarlama
**Tanım:** `Rate(Base→Quote)` = 1 birim *Base*, kaç birim *Quote* eder?

**Dönüşüm:**
```
Tutar_Quote = Tutar_Base × Rate(Base→Quote)
```

**Çapraz Kur:**
```
USD→EUR = (USD→TRY) / (EUR→TRY)
```

**Yuvarlama:**
- Para tutarları TRY/USD/EUR için 2 ondalık; kur değerleri 4–6 ondalık saklanır.
- Yuvarlama modu Parametreler.`FX_RoundMode` (varsayılan: HalfUp).

---
## 4) Uyumluluk Katmanı — **data/kurlar.csv** → RateLine Haritası
**CSV kolonları (legacy):**
```
Tarih,USDTRY,EURTRY
```
- Satırda **USDTRY** varsa → `(Base=USD, Quote=TRY, Rate=USDTRY)`
- Satırda **EURTRY** varsa → `(Base=EUR, Quote=TRY, Rate=EURTRY)`
- **ValidFrom** = `Tarih 00:00` (Europe/Istanbul)

**Kullanım kuralları:**
- **Motorbot** satırı için kur tarihi: `InvoiceDate` doluysa o gün; **boşsa** CSV `Tarih`.  
- **Barınma** satırı için kur tarihi: `FreezeDate` doluysa o gün; **boşsa** sözleşme `Baslangic`.
- İlgili günde kur yoksa kayıt **errors CSV**’ye düşer (eksik kur uyarısı).
- Aynı gün için yeni Published set yayınlandığında, eskisi **Archived** edilir; freeze referansları geriye dönük değişmez.

---
## 5) Validasyon Kuralları
- Aynı `Döviz Çifti + ValörTarihi` için **en fazla 1 Published** kayıt.
- `Rate > 0`, ondalık hassasiyet (`scale<=6`) sınırı korunur.
- `Kaynak=Manuel` ise **Notes zorunlu**.
- Draft→Published geçişinde `PublishedBy/At` set edilir.

---
## 6) Etkileşimler / Atıflar
- **Barınma**: Contract freeze (başlangıç) → tüm dönem faturalarında aynı freeze.
- **MB Sefer**: Invoice freeze (her fatura günün yayınına bağlanır).
- **e‑Fatura**: UBL/XML’de kur ve döviz kodları; satır ve başlık düzeyinde uyumlu.
- **Parametreler**: `FX_DefaultPrecision`, `FX_RoundMode`, `min_charge_rules`.

---
## 7) Zamanlama ve Kaynak
- **Task Scheduler**: 09:05 ve 17:30 çekim + *Publish preview*.
- Kaynak hiyerarşisi: `TCMB` → (başarısız) `No Publish` + uyarı → **Manuel Publish**.
- (Opsiyonel) Delta eşiği: `%Δ > threshold` ise ikinci onay ister.

---
## 8) Raporlama & Loglama
- Günlük Publish raporu: yeni/archived sayıları, delta yüzdeleri, hatalar.
- **v_rep_rates_freeze_consistency**: belge freeze referansı tutarlılığı.
- **v_rep_fx_coverage_gaps** (öneri): Published set kapsam boşlukları.
- Manuel Publish denetim izi: kullanıcı, açıklama, IP/metin.

---
## 9) Test Senaryoları
1) Yeni RateId oluştur → USD→TRY & EUR→TRY ekle → Published yap → fatura freeze referansı ile kullan.  
2) Çapraz kur (USD→EUR) = USD→TRY / EUR→TRY; satış tutarında 2 ondalık.  
3) Çakışan tarihli ikinci satır → yayımlama engellenmeli.  
4) Hafta sonu fatura → son Published kur + uyarı logu.

---
## 10) Geçiş Planı
- Mevcut kayıtlar **silinmez**; yeni Published geldiğinde ilişki kurulur.
- Barınma için `ContractFreezeId` alanı açılır ve geçmiş sözleşmelere başlangıç tarihine göre set edilir.

---
## 11) Sürüm Notu
- UNIFIED→FINAL dönüşümünde, tekrar eden başlıklar birleştirildi; kısa **Form – Kurlar v2.3 (FINAL)** maddeleri **Uyumluluk Katmanı**na taşındı; **FIX6** özetleri tek bir bölümde toplandı.