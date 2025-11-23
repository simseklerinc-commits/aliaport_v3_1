# Barınma — RUNBOOK (UNIFIED v2.3 • Final Merge)
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

## Girdi — data/barinma_sozlesme.csv

---
## Merge Manifest
- Form_Barinma_v2_3_FINAL_REV_20251105_085304.md | size=6848 | sha256=f9f2676934e8c14f6441bce0d8c688271e3f81a4034c5cdda7c6efe3d14bf113
- Form_Barinma_v2_3_FINAL_REV_20251105_155648.md | size=843 | sha256=c80c237f58e19088aafa22f0a7dcbf91b7cef0918e6be707116e3295ffd4d442
- Form_Barinma_v2_3_FINAL.md | size=392 | sha256=f24fb1b0bdb01f8d108c7f21df63560c89d63ad4d7edca27f7af9664a77a8f86

---
## Ana Gövde (Birleştirilmiş)
# Barınma Formu — UNIFIED v2.3 (Revize 20251105_085304)
> Bu sürüm: yinelenen parçalar ayıklandı, parametre ve rapor bağları netleştirildi; veri kaybını önlemek için metinler korunarak gruplanmıştır.

## Formun Amacı ve Kapsam
## 0) Amaç
- Cariye bağlı **tekne** bazında barınma sözleşmesi oluşturmak.
- Periyoda göre (GÜNLÜK/AYLIK/YILLIK) fiyatlandırma ve **faturalama planı**.
- Kurlar ile **CONTRACT-freeze** bağını kurmak; e-Fatura alanlarını beslemek.

## Ön Koşullar
_(Bu bölüm orijinal metinde boştu / taşıyacak içerik bulunamadı.)_

## Parametre Bağlantıları
# Barınma — Form ve Kural Şartnamesi (v2_3 • FIX-1 DRAFT)
**Oluşturma:** 2025-11-05 01:06:05 +03:00  
**İlke:** Mevcut v2_1 içeriğini korur; sözleşme/kur/faturalama akışlarını netleştirir. Veri kaybı yok.

## 2) Varlıklar ve Alanlar
### 2.1 Sözleşme (BarinmaContract)
- **ContractNo**: otomatik numara (yıl/seri).
- **Cari**: zorunlu (var olan müşteri).
- **Tekne**: zorunlu (tekne kartı; tekne adı/gemi adı alan birliği).
- **Periyot**: `GÜNLÜK | AYLIK | YILLIK` (default: AYLIK).
- **BaslangicTarihi**: `date`, **BitisTarihi**: `date?` (belirsiz süre için boş).
- **LengthBasis**: `TESCIL | TAM` (tarife hangi boya göre? Parametreler.default_barinma_length_basis).
- **BoyDegeri**: `decimal(6,2)` (LengthBasis'a göre otomatik çekilir; elle override edilebilir; auditlenir).
- **PriceList**: çözümlenmiş fiyat listesi (Cari>Varsayılan>Sistem).
- **FreezeScope**: `CONTRACT` (varsayılan) — Kurlar ile sözleşme başlangıcında kur sabitlemesi.
- **ContractFreezeId**: kur kaydına referans (freeze_id).
- **Para**: döviz kodu (USD/EUR/TRY... hizmet kartından).
- **FaturalamaGunu**: `1..28|AYSONU` (AYLIK ise gerekir; default AYSONU).
- **ProRata**: `bool` (default: Parametreler.barinma.pro_rata).
- **MinChargeDays**: `int` (default: 1).
- **Notlar**, **Ekler** (imzalı PDF), **Audit** (Created/Updated/By).

### 2.2 Hizmet Kartı Eşlemesi
- **BARINMA_GUN / BARINMA_AY / BARINMA_YIL** (Hizmet Yönetimi).
- Birim: `GÜN | AY | YIL` (units.canonical ile uyumlu).
- KDV: oran veya istisna (Parametreler/vat, exemptions).

## 3) Fiyatlandırma
- Fiyat, **Hizmet Yönetimi** → **PriceListItem** üzerinden gelir; kart üzerinde tutar yok.
- **Boy kademesi** gerekiyorsa ModelParam(JSON) ile (`LengthBasis`, eşik/kademeler) tanımlanır.
- Para birimi döviz ise; TL dönüşümde **contract_freeze_id** kullanılır.

## 4) Kur Bağı (Kurlar ile etkileşim)
- Sözleşme **onaylandığında**, `FreezeScope=CONTRACT` gereği **Kurlar**dan **Published** bir kayıt seçilir ve `ContractFreezeId` bağlanır.
- Aylık/Yıllık faturalamada **aynı freeze_id** kullanılır (rate-freeze tekrar etmez).
- Günlük barınmada (GÜNLÜK periyot) sözleşme kontratlı olsa dahi varsayılan **CONTRACT** freeze devam eder; satır TRY ise kur bağlanmaz.

## 5) Faturalama
- **AYLIK**: `FaturalamaGunu` veya `AYSONU`. ProRata=TRUE ise başlangıç/bitis kısımları gün bazında bölünür.
- **YILLIK**: yıllık tahakkuk, tercihen **aylık taksit** ile (Opsiyon: tek fatura + tahsilat planı).
- **GÜNLÜK**: günlük tahakkuk; dönemsel toplu fatura desteği.
- e-Fatura: Para/kur alanları başlık ve satırda; KDV veya istisna kuralları uygulanır.
- `fatura.month_end_lock` TRUE ise kapanan ay geriye dönük fatura oluşturmaz (Parametreler).

## 8) Çapraz Etkiler (Atıflar)
- **Kurlar**: CONTRACT freeze — sözleşme başlangıcındaki yayınlanmış kur.
- **Parametreler**: `rounding_mode`, `barinma.pro_rata`, `fatura.month_end_lock`.
- **Hizmet Yönetimi**: BARINMA_* hizmet kartları, PriceListItem, ModelParam(JSON).

## 9) Geçiş & Geriye Dönük
- Mevcut sözleşmeler **değiştirilmeyecek**. Yeni sözleşmeler FIX-1 kurallarıyla oluşturulur.
- Eski sözleşmelerde kur bağsız kayıtlar var ise ilk fatura anında **uyarı** verilerek **manuel freeze** seçtirilir.

### EK) Faturalama Örnekleri
1) **AYLIK, ProRata=TRUE** — Başlangıç 12/03, bitiş 27/06 → Mart (20g), Nisan (30g), Mayıs (31g), Haziran (27g) gün oranlı.
2) **YILLIK** — 12 ay tahakkuk; tek kur freeze; aylık taksitlendirme.
3) **TRY fiyatlı kart** — kur dönüşümü yok, ContractFreezeId opsiyoneldir.

- **Döviz/Kur**: `config.usdtry_rate` (runbookta sabit şablon), barınma sözleşmesi döviz cinsi `TRY/USD/EUR` parametreli.
- **Birim**: `GÜN/AY/YIL`; birimler **Parametreler** formundan yönetilir (kod+ad).
- **KDV**: hizmet kartındaki KDV grubu; istisna durumları (KDVK 13/b, 17/4-o) **Hizmet Yönetimi** + **Parametreler** üzerinden tanımlı.
- **Tarife bağları**: `PriceList/PriceListItem` tablosu; aktif kalem şartı: `Status='Published'`, tarih aralığı `ValidFrom/ValidTo` uyumlu.


## Veri Alanları
## 6) Validasyon
- Cari ve Tekne zorunlu; tekne seçimi **cari ile kayıtlı** olmalı.
- Sözleşme çakışması: Aynı tekne için tarih aralığı çakışan **aktif** sözleşme olamaz.
- PriceList bulunamazsa **taslak** aşamasında uyarı, onay engeli.
- ContractFreezeId zorunlu (Para≠TRY ve FreezeScope=CONTRACT iken).
- Boy değeri doğrulama: 0’dan büyük; LengthBasis ile uyumlu.

## 7) Raporlama & Dijital Arşiv
- Sözleşme PDF (hazır format) + imza; arşive otomatik atılır.
- Sözleşme-lisans bitiş uyarıları (30/7/1 gün önce).
- Fatura özetleri: dönemsel barınma gelir raporu (TRY/döviz).

## İş Kuralları
_(Bu bölüm orijinal metinde boştu / taşıyacak içerik bulunamadı.)_

## Hesaplama Motoru (Barınma)
**Prensip:** Sözleşme dönemi + periyoda göre **prorata**:  
- Günlük = gün sayısı × gündelik fiyat  
- Aylık = ay içindeki kapsama oranı × aylık fiyat (başlangıç/bitiş kırık aylar oransal)  
- Yıllık = yıl içindeki kapsama oranı × yıllık fiyat

**Formül (örnek, Aylık):**
```
Dönem gün sayısı = ayın toplam günü
Kapsanan gün = [max(Başlangıç, AyBaş) .. min(Bitiş, AySon)]
Oran = Kapsanan gün / Dönem gün sayısı
Tutar = Aylık Liste Fiyatı × Oran
```
Yuvarlama: para birimi `TRY` için 2 hane, `USD/EUR` için 2 hane; KDV matrahı sonrası KDV eklenir.


## Sözleşme ve Faturalama Akışı
1. **Sözleşme kayıt**: `BarinmaContract(ContractNo, CustomerCode, StartDate, EndDate, Period(GÜN/AY/YIL), ContractFreezeId)`
2. **Fiyat dondurma**: `ContractFreezeId` yayınlı kur setini referans alır.
3. **Dönem oluşturma**: seçilen periyot için tahakkuk dönemleri açılır (otomatik öneri).
4. **Fatura**: `Invoice/InvoiceLine`'a satırlar düşer; `LineFreezeId = ContractFreezeId` eşitliği zorunlu.
5. **Arşiv**: imzalı sözleşme PDF’i **Dijital Arşiv**e kaydedilir (sözleşme no ile).

## Muhasebe/KDV
_(Bu bölüm orijinal metinde boştu / taşıyacak içerik bulunamadı.)_

## Yetki ve Log
_(Bu bölüm orijinal metinde boştu / taşıyacak içerik bulunamadı.)_

## Raporlar ve İzleme
- `v_rep_barinma_prorata_check`: kapsama ve satır sayısı kontrolü  
- `v_rep_rates_freeze_consistency`: sözleşme/invoice freeze eşleşmesi  
- `v_rep_prices_missing`: yayınlı fiyat eksikleri


## Test Senaryoları
_(Bu bölüm orijinal metinde boştu / taşıyacak içerik bulunamadı.)_

## Sürüm Notu
_(Bu bölüm orijinal metinde boştu / taşıyacak içerik bulunamadı.)_
