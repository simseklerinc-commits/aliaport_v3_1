# Raporlar Menüsü — RUNBOOK (UNIFIED v2.3 • Final Merge)
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

## Hızlı Kontrol

---
## Merge Manifest
- Aliaport_Reports_Menu_v2_3_FINAL_REV_20251105_091257.md | size=13863 | sha256=d32f31aba402efa2bf5a9f0c1ae6e78d8846f77212de24617362b8a2a6d050a7
- Aliaport_Reports_Menu_v2_3_FINAL_REV_20251105_155648.md | size=826 | sha256=030a8e26c3c617911f462d176361b8afb8677fbec0df3626a18b9bbab6d73371
- Aliaport_Reports_Menu_v2_3_FINAL.md | size=465 | sha256=a17d1a813a4a44f2cce63550031fa89b0e2702e5608375d104b4d910d7ae08fa

---
## Ana Gövde (Birleştirilmiş)
# Aliaport — Reports Menu (UNIFIED v2.3, Final Rev 20251105_091257)

Bu runbook, Aliaport v2.1 veri şemasına göre tanımlanan *rapor view*'larının menü ve kullanım kılavuzudur.
Tüm view adları **dbo.** şemasındadır. SQL örnekleri `sqlcmd` / SSMS / Invoke-Sqlcmd ile çalıştırılabilir.

---

## 0) Ön Koşullar
- **Zorunlu tablolar:** ServiceCard, PriceList, PriceListItem, Rates, Invoice, InvoiceLine, BarinmaContract, MBTrip, WorkLog, GateLog.
- **Doğrulama:**  
```sql
SELECT name FROM sys.tables ORDER BY name;
SELECT name FROM sys.views  WHERE name LIKE 'v_rep_%' ORDER BY name;
```
- **Yetkiler:** Rapor okuma için `SELECT` yeterli; view’ların oluşturulması için `ALTER/CREATE VIEW` izni gerekir.

---

## 1) Rapor Listesi (Kısa)
| Kodu | View Adı                              | Amaç / Özet |
|------|---------------------------------------|-------------|
| R1   | v_rep_prices_missing                  | Aktif hizmetler için **hedef fiyat listesinde** yayınlı fiyatı olmayan kalemler |
| R2   | v_rep_price_orphan                    | Pasif/silinmiş hizmet kartına bağlı **yayında** kalmış fiyat kalemleri |
| R3   | v_rep_rates_freeze_consistency        | MB satırlarında **InvoiceFreezeId**, Barınma satırlarında **LineFreezeId = ContractFreezeId** tutarlılığı |
| R4   | v_rep_mb_weekly_candidates            | Müşteri bazında **haftalık kapama** adayı (toplam dakika, faturalanan/faturalanmayan) |
| R5   | v_rep_barinma_prorata_check           | Barınma sözleşme satırlarının **dönem kapsamı** ve satır sayısı kontrolü |
| R6   | v_rep_fx_coverage_gaps *(öneri)*      | Yayınlı set içinde **eksik parite/tarih boşluğu** tespiti |
| R7   | v_rep_workorder_pending *(öneri)*     | Durum bazında bekleyen **iş emirleri** |
| R8   | v_rep_workorder_archive_by_customer *(öneri)* | Müşteri bazında **arşiv dokümanı dağılımı** |
| R9   | v_rep_wo_sla_breach *(öneri)*         | **SLA** ihlali olan iş emirleri |

> *R1–R5* kurulumda sağlanmış ve test edilmiştir; *R6–R9* opsiyoneldir (isteğe bağlı oluşturulur).

---

## R1) v_rep_prices_missing — Hedef listede yayımlı fiyat yok
**Amaç**: Aktif hizmetler (`ServiceCard.Status='Aktif'`) için `PriceList.IsTarget=1` olan listelerde **yayınlı** ve tarih aralığı uygun fiyat kalemi yoksa satırı raporlar.

**Ana Sütunlar**: ServiceCode, ServiceName, Unit, PriceListCode, PriceListName, AsOfDate, Reason='NO_PUBLISHED_PRICE'.

**Örnekler**
```sql
-- Tüm eksikler
SELECT * FROM dbo.v_rep_prices_missing ORDER BY ServiceCode;

-- Grup bazında sayım
SELECT LEFT(ServiceCode,2) AS Grup, COUNT(*) AS EksikAdet
FROM dbo.v_rep_prices_missing
GROUP BY LEFT(ServiceCode,2)
ORDER BY Grup;
```

**Aksiyon**: İlgili ServiceCode için `PriceListItem`a **Published** kalem ekleyin (tarih örtüşmesi çakışmasın).

---

## R2) v_rep_price_orphan — Orphan fiyat kalemi
**Amaç**: `PriceListItem.Status='Published'` olan, fakat hizmet kartı **pasif** ya da **yok** ise raporlar.

**Ana Sütunlar**: ServiceCode, ServiceName, ServiceStatus, PriceListCode, Currency, UnitPrice, ValidFrom, ValidTo, ItemStatus, ConsistencyFlag.

**Örnekler**
```sql
-- Orphan kalemler
SELECT * FROM dbo.v_rep_price_orphan ORDER BY PriceListCode, ServiceCode;

-- Hızlı temizlik adayı
SELECT PriceListCode, COUNT(*) AS Kalem
FROM dbo.v_rep_price_orphan
GROUP BY PriceListCode ORDER BY Kalem DESC;
```

**Aksiyon**: Pasif karta bağlı Published kalemleri **Arşiv**e alın veya hizmet kartını yeniden **Aktif** yapın.

---

## R3) v_rep_rates_freeze_consistency — Freeze tutarlılığı
**Amaç**: MB satırlarında `InvoiceFreezeId`ın publish edilmiş seti referanslaması; Barınma satırlarında `LineFreezeId = ContractFreezeId` olması.

**Ana Sütunlar**: Scope(MB/BARINMA), InvoiceNo, LineNo, ServiceCode, CheckFreezeId, RefFreezeId, Verdict (OK / MISSING_INVOICE_FREEZE / FREEZE_NOT_PUBLISHED / MISSING_CONTRACT_REF / CONTRACT_FREEZE_MISSING / MISMATCH_CONTRACT_FREEZE).

**Örnekler**
```sql
-- Tüm tutarsızlıklar
SELECT * FROM dbo.v_rep_rates_freeze_consistency WHERE Verdict <> 'OK' ORDER BY InvoiceNo, LineNo;

-- Tür bazında özet
SELECT Scope, Verdict, COUNT(*) AS Adet
FROM dbo.v_rep_rates_freeze_consistency
GROUP BY Scope, Verdict
ORDER BY Scope, Adet DESC;
```

**Aksiyon**: MB satırlarında freeze setini doldurun; Barınma satırında sözleşme freeze eşleşmesini sağlayın.

---

## R4) v_rep_mb_weekly_candidates — Haftalık kapama adayı
**Amaç**: Haftalık toplam dakika, faturalanan/faturalanmayan durumuyla müşteri bazında kapama önerisi.

**Örnek**
```sql
-- Son 4 haftanın adayları
SELECT TOP (100) *
FROM dbo.v_rep_mb_weekly_candidates
ORDER BY WeekStart DESC, CustomerCode;
```

**Aksiyon**: Haftalık faturalama dönemini kapatırken referans alın.

---

## R5) v_rep_barinma_prorata_check — Prorata kapsama
**Amaç**: Barınma sözleşmelerinde dönem kapsaması ve satır sayısı kontrolü (**VERY_PARTIAL**, **OK** vb.).

**Örnek**
```sql
SELECT TOP (100) *
FROM dbo.v_rep_barinma_prorata_check
ORDER BY MonthStart DESC, ContractNo;
```

**Aksiyon**: Eksik/çok satır veya kapsam dışı günler için sözleşme/periyot ayarını düzeltin.

---

## R6) v_rep_fx_coverage_gaps *(öneri)*
**Amaç**: Published bir `RateId` içinde eksik parite veya tarih boşluğu var mı?

**Örnek iskelet**
```sql
-- Ör: USD→TRY ve EUR→TRY var mı? Boş tarih aralığı var mı?
-- (İsteğe bağlı CREATE VIEW taslağı runbook ekinde sağlanır.)
```

---

## R7) v_rep_workorder_pending *(öneri)*
**Amaç**: Durum bazında bekleyen iş emirleri (New/InReview/InProgress).

**Örnek**
```sql
SELECT Status, COUNT(*) AS Adet
FROM WorkOrder
WHERE Status IN ('New','InReview','InProgress')
GROUP BY Status;
```

---

## R8) v_rep_workorder_archive_by_customer *(öneri)*
**Amaç**: Müşteri bazında arşivlenmiş doküman dağılımı.

**Örnek**
```sql
SELECT a.CustomerCode, a.DocType, COUNT(*) AS Adet
FROM Archive a
GROUP BY a.CustomerCode, a.DocType
ORDER BY Adet DESC;
```

---

## R9) v_rep_wo_sla_breach *(öneri)*
**Amaç**: SLA hedef süresini aşan iş emirleri.

**Örnek iskelet**
```sql
-- SLA hedefleri Param_Flags içinde tanımlıdır (ör: WO_SLA_ResponseHrs=4, WO_SLA_ResolveHrs=24).
-- Aşım > 0 saat olanlar raporlanır.
```

---

## 2) Hızlı Sağlık Kontrolleri
```sql
-- View var mı?
SELECT name FROM sys.views WHERE name IN (
 'v_rep_prices_missing','v_rep_price_orphan',
 'v_rep_rates_freeze_consistency','v_rep_mb_weekly_candidates',
 'v_rep_barinma_prorata_check'
);

-- Boş dönen kritik raporlar (duruma göre OK olabilir):
SELECT COUNT(*) FROM dbo.v_rep_prices_missing;
SELECT COUNT(*) FROM dbo.v_rep_price_orphan;
```

---

## 3) Menü Yerleşimi (UI notu)
- Raporlar ana menü: **Fiyat / Hesap / Freeze / İş Emri / Arşiv** alt grupları.  
- Her raporda kısa açıklama + “Örnek Sorgu” butonu (SQL kopyala) önerilir.

---

## 4) Değişiklik Geçmişi
- v2.3 (Final): R1–R5 konsolide, örnek sorgular eklendi; R6–R9 öneri maddeleri menüye bağlandı.

---

## Ek A — Orijinal içerik (korundu)
# Raporlar Menüsü — v2_3 FINAL
**Oluşturma:** 2025-11-05 01:33:54 +03:00  
**İlke:** Tüm modüller (Parametreler, Kurlar, Barınma, MB Sefer, Hizmet Yönetimi, İş Emri + Arşiv, Cari, e‑Fatura) için **tek çatı** rapor seti.  
**Varsayılan tarih filtresi:** Son 30 gün (değiştirilebilir). **Yetkiler:** Viewer/Approver/Billing/Admin.

---

## 0) Menü Yerleşimi
- UI: **/ui/raporlar**  
- Anchor: `#menu-raporlar`  
- Alt sekmeler: **Panolar**, **Fiyat & Tarifeler**, **Kurlar**, **Barınma**, **MB Sefer**, **İş Emri & Arşiv**, **Cari & e‑Fatura**, **Denetim**

> Tüm raporlar **CSV/Excel** dışa aktarma, **PDF** yazdırma, **Planlı gönderim** (e‑posta) destekler.

---

## 1) Panolar (Özet KPI)
**R1.1 Operasyon Panosu**
- KPI: Toplam WO, Süren WO, Günlük kapanış, SLA isabet %, Ortalama tamamlama süresi (dk).
- Drilldown: WONo → WO detay.
- Kaynak: WorkOrder, WOLog, Checklist.

**R1.2 Gelir Panosu (TRY/Döviz)**
- KPI: Son 30g Barınma/MB/Hizmet gelirleri; KDV dağılımı; İstisna satış oranı.
- Drilldown: Fatura → satır.
- Kaynak: Invoice, InvoiceLine, Rates.

---

## 2) Fiyat & Tarifeler
**R2.1 Eksik Fiyat Raporu**  
- Amaç: Aktif hizmet kartları × hedef PriceList — Published **eksik** olanlar.  
- Kolon: ServiceCode, Ad, Birim, PriceList, ValidFrom/To (beklenen), Durum.  
- Aksiyon: “Fiyat Ekle” kısayolu.  
- Kaynak: ServiceCard, PriceListItem.

**R2.2 Orphan Price Raporu**  
- Amaç: Kart **Pasif** ama PriceListItem **Published** kalanlar.  
- Aksiyon: “Arşivle” kısayolu.

**R2.3 Fiyat Yayın Geçmişi**  
- Filtre: ServiceCode/PriceList/Tarih.  
- KPI: Günlük fiyat değişim sayısı, ortalama delta %.  
- Kaynak: PriceListItemHistory.

**R2.4 ModelParam Uyum Kontrolü**  
- Amaç: Kartın FiyatModeli ile PriceListItem.ModelParam şema uyumu.  
- Sonuç: “Geçti/Failed + Hata alanı”.

---

## 3) Kurlar
**R3.1 Kur Yayın Geçmişi**  
- Kolon: Çift, RateType, Kaynak, Kur, Status (Draft/Published/Archived), PublishedBy/At.  
- KPI: Publish adedi, manuel publish oranı.

**R3.2 Tatil/Hafta Sonu Fallback Kullanımı**  
- Amaç: “USE_LAST_PUBLISHED+WARN” tetiklenen faturalar.  
- Kolon: FaturaNo, Tarih, KullanılanKurZamanı, Uyarı.  

**R3.3 Freeze Tutarlılığı**  
- MB: `INVOICE` freeze ile kesilenler, Barınma: `CONTRACT` freeze kontrolleri.  
- Sonuç: “Uyumlu/Uyumsuz”; Uyumsuzda: FaturaNo, Sebep.

**R3.4 Manuel Publish Denetim İzi**  
- Kolon: User, Tarih, Not, Çift, Kur, Delta% (>threshold işaretle).

---

## 4) Barınma
**R4.1 Sözleşme Portföyü**  
- Kolon: ContractNo, Cari, Tekne, Periyot, Baslangıç/Bitis, FreezeId, Para, PriceList, Durum.  
- Filtre: Aktif/Pasif, Tarih aralığı.  

**R4.2 Sözleşme Çakışma Kontrolü**  
- Amaç: Aynı tekne + tarih aralığında **aktif** sözleşme çakışması.  
- Çıktı: ContractNo1/2, Tarih Aralığı, Tekne.

**R4.3 Pro‑Rata & Faturalama Doğrulama**  
- Amaç: Ay kırılımı, `invoice.day`, pro‑rata dağılımı — hatalı gün sayıları.  
- Kolon: ContractNo, Dönem, Gün, Hesaplanan, Beklenen, Fark.

**R4.4 Gelir Özeti (Barınma)**  
- KPI: Aylık gelir (TRY/döviz), doluluk ve sözleşme sayıları.  
- Drilldown: Sözleşme → faturalar.

---

## 5) MB Sefer
**R5.1 Haftalık Faturalama Adayları**  
- Amaç: Hafta (Pzt‑Paz) sefer toplama; fatura öncesi kontrol listesi.  
- Kolon: Cari, TripNo, Süre, Model, Bekleme Blokları, PriceList, KurFreeze.

**R5.2 Süre/Model Uyum**  
- Amaç: `BASE_PLUS_INCREMENT`/`PER_BLOCK` hesaplarına göre süre → ücret uyumu.  
- Çıktı: TripNo, SüreDakika, BeklenenTutar, HesaplananTutar, Fark.

**R5.3 Bekleme Blokları Özeti**  
- KPI: Toplam bekleme blok adedi/dakika, Carilere dağılım.  
- Kaynak: MBTrip + MB_BEKLEME satırları.

**R5.4 Anomali Avcısı**  
- >24h süre, dönüş<kalkış, eksik PriceList, kur bağlanamadı.  
- Severity: Yüksek/Orta/Düşük + çözüm önerisi.

**R5.5 Kabotaj İndirimi İzleme**  
- `IsCabatogeTRFlag` uygulanan satırlar; kapsam dışı uygulamalar uyarı.

---

## 6) İş Emri & Arşiv
**R6.1 SLA Takip**  
- KPI: SLA hedefi, sapma (dk), başarı %.  
- Drilldown: WONo.

**R6.2 Statü Yaşı & Tıkanıklık**  
- Amaç: `Sürmekte/Beklemede` yaşları.  
- Eşik: Parametreler.sla.*

**R6.3 Fiyat Kaynağı Kapsamı**  
- PriceListItem’dan gelen vs Manual girilen satırlar oranı; Manual not zorunluluğu kontrolü.

**R6.4 Arşiv Bütünlüğü**  
- PDF var/yok, imza var/yok, SHA‑256 hash var/yok.  
- Dosya boyutu/uzantı ihlalleri (Parametreler.archive.limits).

**R6.5 Idempotent Fatura Koruması**  
- Aynı WONo/TripNo ikinci kez faturaya girmek isteyen girişimler (bloklananlar).

---

## 7) Cari & e‑Fatura
**R7.1 e‑Fatura/e‑Arşiv Kapsam Raporu**  
- Cari bazında statü (EFatura/EArşiv/Karma), zorunlu alan kontrolleri (VKN/TCKN, e‑posta, fatura adresi).

**R7.2 Eksik Alan Denetimi**  
- E‑posta/IBAN/adres/VKN/TCKN hataları.  
- Aksiyon: “Hızlı Düzeltme” linkleri.

**R7.3 Risk & Gecikme**  
- RiskLimit aşımı, geciken tahsilat yaşı, BlockOnOverdue etkisi.

**R7.4 UBL Uyum & Red Sebepleri**  
- Gönderim logları (İşNet), red/iptal oranları, istisna kod eşleşmeleri (`<TaxExemptionReasonCode>`).

---

## 8) Denetim & Parametre Değişiklikleri
**R8.1 Parametre Diff**  
- Önce/sonra karşılaştırma, değişikliği yapan kullanıcı/zaman.

**R8.2 Kur Publish Audit**  
- Manuel publish kayıtları ve delta>% eşiği.

**R8.3 Yetki & Portal Kullanımı**  
- Aktif müşteri kullanıcıları, son giriş zamanları, rol dağılımı.

---

## 9) Güvenlik / Yetki Matrisi
- **Viewer**: Tüm raporları görüntüleme, dışa aktarma (okuma).  
- **Approver**: Viewer + onay gerektiren aksiyonlar (örn. manuel publish ikinci onay).  
- **Billing**: Faturalama öncesi kontrol raporlarında aksiyon.  
- **Admin**: Tüm aksiyonlar + planlı gönderim tanımlama.

---

## 10) Planlı Gönderim (Scheduler)
- Saatlik/Günlük/Haftalık e‑posta: alıcı grupları (`Billing`, `Operasyon`, `Yönetim`).  
- Dosya: CSV + PDF.  
- Varsayılanlar:  
  - **Pzt 08:30** — R5.1 Haftalık Faturalama Adayları (MB).  
  - **Her gün 18:10** — R6.2 Statü Yaşı & Tıkanıklık.  
  - **Ay sonu 20:00** — R4.3 Barınma Pro‑Rata Doğrulama, R3.3 Freeze Tutarlılığı.

**PowerShell örneği**
```powershell
$ROOT='C:\Aliaport\Aliaport_v2_1'
# Export-Report komutu proje içi yardımcı modüldür (varsayım).
$dt = (Get-Date -Format 'yyyyMMdd')
pwsh -NoProfile -Command "Export-Report -Name 'R5.1_MB_WeeklyCandidates' -Out 'C:\Aliaport
eports\MB_weekly_$dt.csv'"
```

---

## 11) Teknik Notlar
- Tüm raporlar **idempotent** üretim (aynı tarih aralığı + filtre → aynı çıktı).  
- Büyük veri için sayfalama ve “yalın kolon” modları.  
- Tarih/saat: Europe/Istanbul, DST dikkate alınır.

---

## 12) Dosya Adlandırma Standartları
- `REP_<Kod>_<YYYYMMDD>[_<HHmm>].csv`  
- Örn: `REP_R5_1_MB_WEEKLY_20251105.csv`

---

## 13) Entegrasyon Hazırlığı
- SQL View adları (öneri): `v_rep_prices_missing`, `v_rep_price_orphan`, `v_rep_rates_freeze_consistency`, `v_rep_barinma_prorata_check`, `v_rep_mb_weekly_candidates`, `v_rep_wip_age`, `v_rep_archive_integrity`, `v_rep_einvoice_rejections`.
- Genişletmeye açık: `More3/MikroSync` kaynaklarından ek alanlar.

---

## 14) Bakım & Versiyon
- Bu menü **v2_3 FINAL**’dır. Değişiklikler **FIX‑2** ile kayda alınır.

