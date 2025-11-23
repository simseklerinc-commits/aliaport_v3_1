# İş Emri + Dijital Arşiv — RUNBOOK (UNIFIED v2.3 • Final Merge)
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

## Veri Katmanı

---
## Merge Manifest
- Form_IsEmri_Archive_v2_3_FINAL_REV_20251105_090930.md | size=14438 | sha256=3c63d16c675a4a704006d657bba653af5b84f41cd96fb9f2ee1ebf93de3e3fbf
- Form_IsEmri_Archive_v2_3_FINAL_REV_20251105_155648.md | size=800 | sha256=1f9f9a29829d8c806793ce5806a5ff3d4e3beb71ba10b3b68b628eb45e0d9662
- Form_IsEmri_Archive_v2_3_FINAL.md | size=1018 | sha256=dd33334c9beafaece7ca9ce79d6778052d2d24b85709527a443973f129d55335

---
## Ana Gövde (Birleştirilmiş)
# İş Emri + Arşiv — UNIFIED v2.3 (Revize 20251105_090930)
> Bu revizyon, müşteri portalı (talep), iç onay akışı ve dijital arşivi birleştirir; MB/Barınma/Hizmet bağlantılarını netler.

## Amaç ve Kapsam
# İş Emri + Dijital Arşiv — v2_3 FINAL (KANON • MERGED)
**Oluşturma:** 2025-11-05 00:44:42 +03:00
**İlke:** Tek dosya; veri kaybı yok. Ana gövde v2_3 UNIFIED (İş Emri + Arşiv tek form). v2_3 İş Emri ek gövde, v2_1 arşiv baz ve v2_2 addendum tam metin olarak eklerde yer alır.

---
## Ana Gövde — İş Emri + Arşiv (v2_3 UNIFIED)

# İş Emri + Dijital Arşiv — UNIFIED
**UNIFIED v2_3 — oluşturma:** 2025-11-05 00:32:47 +03:00
**İlke:** Veri kaybı yok. Base dokümanlar ÖNDE, addendum metinleri *ayni dosyada* **[Merged Addendum v2_2]** başlığı altında sonuna eklenmiştir.

# İş Emri + Dijital Arşiv — **Tekil Form Şartnamesi** (v2_1 • UNIFIED)

**Sürüm Damgası:** 2025-11-04 21:40:59 (+03)  
**Kanonik Kapsam:** İş Emri Yönetimi + Dijital Arşiv + Cari Portal/Tek‑Kullanımlık Link + Mobil/Tablet + Çoklu Kullanıcı (Cari Başı) + Gate/WorkLog köprüleri + Tarife/Hesap Motoru kancaları.

## 1) Amaç ve İlke
- **Amaç:** İş emri talep, onay ve saha yürütümünü **tek form** üzerinden başlatmak; zorunlu evrakları **aynı form** içinde toplamak/indekslemek; Gate/WorkLog hareketlerini bağlamak; faturalama için veri üretmek (UBL/İşNet entegrasyonu).
- **Standart akış:** `STOP → PATCH → START → OPEN` (dokümantasyon güncellemesi restart gerektirmez, ancak politika korunur).
- **Güvenlik & KVKK:** Kimlik/veri maskeleme, rol‑tabanlı görünürlük, arşiv değişmezliği (immutable) ve audit zorunludur.

## 2) UI Yol, Anchor ve Rol Görünürlüğü
- **Menü:** İş Emri (Tekil) — *Arşiv paneli aynı ekranda sekme/alt panel olarak yer alır*.
- **Anchor:** `#menu-is-emri-unified`
- **Alt paneller:** Talep | Zorunlu Evrak | GateLog | WorkLog | Fatura | Arşiv
- **Roller (özet):** Operasyon, Güvenlik, Saha, Faturalama, Tarifeci, Cari Portal Kullanıcısı, Arşiv Yöneticisi, Sistem Yöneticisi.
- **Mobil/PWA:** Ekran tek‑sütun akış, büyük dokunmatik hedefler, çevrimdışı tolerans, kamera ile belge yakalama.

## 3) Kimlik Doğrulama (Portal + Tek‑Kullanımlık Link)
- **Portal Hesabı:** Cari başına çoklu kullanıcı (admin/user/viewer). Admin için MFA zorunlu.
- **Sihirli Link (magic link):** 15–60 dk geçerli, tek kullanımlık; talep oluşturma akışını hızlandırır.
- **ABAC:** Kullanıcı yalnızca kendi `cari_id` kapsamındaki verileri görür.
- **Davet Akışı:** Cari admin → e‑posta/telefon girer → davet linki/OTP → etkinleşme.

### 4.2 Opsiyonel
- **Kaynaklar** (FORKLIFT, TRANSPALET, ARDİYE, MB …)  
- **EkDosyalar** (foto/pdf) — *Yüklenenler doğrudan Arşiv paneline indeklenir*
- **Not** (≤500)

### 4.3 Arşiv Paneli (Aynı Form)
- **Zorunlu Evrak Tipleri:** Aksiyon ve varlık tipine göre dinamik (ör. Araç: Ruhsat; Personel: Kimlik/Ehliyet/SRC; İş Emri: Gümrük İzin, Dekont).  
- **Durumlar:** `SUBMITTED` → `VERIFIED` → `EXPIRED/MISSING`  
- **Kilit:** Gönderilmiş UBL ve `sent/` altındaki her şey *immutable* (yazma kilidi).

## 7) Dijital Arşiv Kuralları
- **Key Seti:** `IsEmriId, CariKod, Tarih, EvrakTipi(UBL|Foto|PDF), DosyaYolu`.  
- **Kaynaklar:** e‑Fatura outbox/sent/errors, Gate fotoğrafları, kullanıcı yüklemeleri.  
- **ZIP Dışa Aktarım:** Çoklu seçimle tek zip; SHA‑256 liste.  
- **Ömür:** Belge tipine göre saklama politikası (örn. UBL 10 yıl).

## 8) RBAC (Özet)
- **Operasyon:** Talep/Onay, WorkLog aç/kapat.
- **Güvenlik:** Gate IN/OUT, foto, istisna‑PIN.
- **Saha:** WorkLog yaz (rol kısıtlı).
- **Faturalama:** UBL oluştur/gönder, durum takibi.
- **Tarifeci:** Kart/Fiyat düzenle, PUBLISH.
- **Cari Portal Kullanıcısı:** Talep oluştur, evrak/dekont yükle, durum izle.
- **Arşiv Yöneticisi:** Arşiv yönetimi/ZIP, immutable politikası.
- **Sistem Yöneticisi:** Parametre/patch.

## 12) Test/Kabul (Smoke)
1) Portal magic link ile talep aç → WO No + QR oluşuyor.  
2) ARAÇ_GİRİŞ: Ruhsat/ehliyet `VERIFIED` değilse onay yapılamıyor; istisna‑PIN loglanıyor.  
3) Forklift 1s20dk → 1,5 saat → Net 675; Barınma 1g6s → **2 gün**.  
4) UBL gönderiliyor; **ACCEPTED** olunca iş emri **FATURALANDI**.  
5) Arşiv ZIP export + SHA‑256 listesi üretiliyor.

## 13) Gözlemlenebilirlik
- `logs/app_YYYYMMDD.log`, `events/wo_*.jsonl`, `EInvLog`.  
- Import hataları: `logs/import_errors_*.csv`.  
- Alarm: “giriş var/iş emri yok”, istisna oranı, SGK uyum.

<!-- PATCH_U5_ARCHIVE_EXPIRY_WATCHER_VU2 -->
## Arşiv Expiry Watcher
- Günlük 09:00 taraması: süreleri yaklaşan evrak listesi.
- Bildirim: e-posta + UI banner; çıktı `logs/archive_expiry_YYYYMMDD.csv`.
Uç nokta: `GET /admin/archive/expiry/soon`

<!-- PATCH_U6_RBAC_TABLO_VU2 -->
## Sekme Görünürlüğü (RBAC)
| Rol | Talep | Zorunlu Evrak | GateLog | WorkLog | Fatura | Arşiv |
|-----|:----:|:-------------:|:------:|:------:|:------:|:----:|
| Operasyon | ✓ | ✓ | ☐ | ✓ | ☐ | ✓ |
| Güvenlik  | ☐ | ☐ | ✓ | ☐ | ☐ | ☐ |
| Saha      | ☐ | ☐ | ☐ | ✓ | ☐ | ☐ |
| Faturalama| ☐ | ☐ | ☐ | ☐ | ✓ | ✓ |
| Tarifeci  | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Cari      | ✓ | ✓ | ☐ | ☐ | ☐ | ✓ |
| Arşiv Yön.| ☐ | ☐ | ☐ | ☐ | ☐ | ✓ |
| Sistem Yön| ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
_Not: ✓=görünür, ☐=gizli. Projede rol isimleriyle eşleştirilir._

## Satır Hesabı
1. Kart/Fiyat çözümle
2. FiyatModeli + ModelParam uygula
3. `ApplyRuleAddons`=true ise süre/ek blok vb. ek kalemleri ekle
4. `IsCabatogeTRFlag`=true ise **%10 indirim** uygula (kapsam: 6, 2.3, 2.4 grupları)
5. KDVOran **veya** KDVİstisna uygula; KdvDurumu HARİÇ/DAHİL'e göre net/brüt

## Satır Hesabı Sırası
1) Kart/Fiyat çözümle
2) FiyatModeli + ModelParam uygula
3) ApplyRuleAddons=TRUE ise süre/blok ek kalemlerini dahil et
4) IsCabatogeTRFlag=TRUE ise %10 indirim (kapsam: 6, 2.3, 2.4)
5) KDVOran ya da İstisna, KdvDurumu(HARİÇ/DAHİL)

## UNIFIED Bağı
- Aynı formda Zorunlu Evrak, GateLog, WorkLog, Fatura, Arşiv sekmeleri.
- Durum makinesi ve portal/magic-link akışı geçerli.

## EK-A: İş Emri + Arşiv (v2_1 UNIFIED — Tam Metin)

İş Emri + Arşiv modülü; müşterilerin (cari) **talep** oluşturmasını, iç onay akışı ile işin planlanmasını ve
tamamlanan işlerin **dijital arşiv**e tekil ve izlenebilir şekilde kaydını sağlar.


## Erişim ve Kullanıcı Modeli (Cari Girişi)
## 4) Alan Seti (Tek Form)
### 4.1 Zorunlu
- **IsEmriNo** (GUID/seri; *Gönder* ile rezerve edilir)  
- **CariKod / Yetkili** (typeahead + F10 gelişmiş arama; portalda otomatik)
- **Aksiyon** (ör. ARAÇ_GİRİŞ, FORKLIFT, MOTORBOT, PERSONEL_TRANSFER, vb.) → *Form dinamikleşir*
- **Başlık** (3–120), **Açıklama** (≤500)
- **PlanlananBaşlangıç** (tarih‑saat)
- **GateRequired** (E/H) — güvenlik tableti tetikler
- **SahadaKayitYetkisi** (E/H) — saha WorkLog yazabilir

### 6.2 WorkLog
- Kaynak (FORKLIFT/TRANSPALET/ARDİYE/MB), Başlangıç/Bitiş, süre (dakika).  
- **Tarife/Fiyat Çözümü:** `CariAtaması > Cari.DefaultPriceList > Sistem.DefaultPriceList`.  
- **Hesap Kuralları:** Blok (dakika), Yuvarlama (`UP|NEAREST|DOWN`), **MinCharge**, **4‑Saat Eşiği** (paket + ek saat).  
- **Kur:** Satırda *price‑freeze*, fatura genelinde *rate‑freeze*.

## 9) API Yüzeyi (örnek)
- `POST /portal/auth/otp` (OTP/magic link), `GET /portal/link/{token}`  
- `GET/POST /portal/wo/new` (sihirbaz)  
- `POST /portal/upload` (chunk)  
- `GET /portal/wo/{no}` (durum + QR)  
- `POST /ops/wo/{id}/approve` (pre‑check + onay)  
- `POST /security/wo/{no}/checkin|checkout`  
- `GET /admin/archive/expiry/soon` (yaklaşan süre sonları)  
- `POST /admin/exception` (PIN)

## 10) SQL Notları (özet)
- `workorder`, `workorder_item`, `security_gate_log` (IN/OUT), `archive_doc` (owner_type=cari/vehicle/personnel/workorder).  
- Portal için: `cari_user (role, mfa_pref)`, `magic_token (expires_at, used)`.

## 11) CSV / Toplu Yükleme
**İş Emri Taslak Yükleme**  
```
CariKod,Baslik,Aciklama,GateRequired,Oncelik,PlanlananBaslangic,Kaynaklar(Semicolon),Aksiyon
```
**Zorunlu Evrak Şablonu**  
```
OwnerType(cari|vehicle|personnel|workorder),OwnerRef,DocType,ExpiryYYYY-MM-DD,Note
```

<!-- PATCH_U2_CALC_PRECEDENCE_VU2 -->
### Hesap Önceliği (sabit)
1) Satır Override (WorkLog/Manual)
2) PriceListItem (Cari özel fiyat varsa önce bu)
3) Hizmet Kartı Şablonu (kart üzerindeki varsayılanlar)
4) Parametre.calc (sistem/genel)

- Müşteri portal girişinde **CustomerUser** eşlemesi kullanılır; bir cari için **çok kullanıcı** tanımlanabilir.
- Mobil uyum: saha kullanıcıları talep/ek/medya yükleyebilir; minimum alanlarla hızlı kayıt.
- Yetki rolleri: **Requester** (cari), **Reviewer/Approver** (iç), **Operator** (saha).


## Veri Modeli (WorkOrder / Archive)
## Merge Manifest
- Form_IsEmri_Archive_UNIFIED_v2_3.md | size=9707 bytes | sha256=ecd1a2209d51510c65e864654fc2106da7b49f7e5c93cbabf9823a934588aeb5
- Form_IsEmri_UNIFIED_v2_3.md | size=881 bytes | sha256=97d5daa78ffa4d4fe7bdec0882b1d6506ba34a0933f3d20414676836ff047c1c
- Form_IsEmri_v2_2_Addendum.md | size=978 bytes | sha256=4985090b40aa2fe2b5fca4383381477deeb388f3b19abca7f9c4f10f6fd8f76f
- Form_WorkOrder_Archive_UNIFIED_v2_1.md | size=8395 bytes | sha256=5628d4e8b49390ad4780cac92f81bd97519f190a4bceecaf4d2b36ba60d13da7

> Bu belge, `Form_Is_Emri_Yonetimi.md` ve `Form_Dijital_Arsiv.md` ile `Aliaport_RUNBOOK_WO_Archive_v2_1.md` içeriğini **tekilleştirerek** birleştirir; `Aliaport_RUNBOOK_v2_1.md` ile uyumludur. İlke: **Append‑Only / No‑Clobber** (eski dosyalar silinmez; bu belge “tek form” gerçeğidir).

## 5) Durum Makinesi
`DRAFT → SUBMITTED → APPROVED → SAHADA → TAMAMLANDI → FATURALANDI → KAPANDI`  
- **SAHADA**: İlk WorkLog veya Gate **IN** ile başlar.  
- **TAMAMLANDI**: WorkLog kapanış + Gate **OUT** doğrulaması.  
- **FATURALANDI**: UBL gönderildi ve **ACCEPTED**.

## 14) Ekler
- **Parametreler:** `units, vat, exemptions, calc(base_hours=4), efatura, archive`.  
- **Birime dair sözlük:** `ADET, SAAT, GÜN, SEFER, DİNGİL, TON, M2, M3, METRE, KONTEYNER` + alias’lar.

## Yeni Alanlar
- **IsCabatogeTRFlag** (bool): UI'da 'Türk bayraklı & kabotaj/dahili sefer' tiki. Varsayılan kapalı. Açık ise **%10 indirim** uygular.
- **ApplyRuleAddons** (bool): Kural kaynaklı ek ücretleri uygula/uygulama (varsayılan açık).
- **SecurityExitTime** (datetime): Güvenlik çıkış anı; araç 4 saat kuralını tetikler.
- **AttachedLetterApproved** (bool): Dışarıdan vinç dilekçe onayı.

## Validasyon
- `IsCabatogeTRFlag` işaretliyse gemi **bayrak=TR** ve **kabotaj=true** olmalı; değilse alan uyarı verir.
- Dilekçe olmadan vinç talebi → uyarı/engelle.

# İş Emri — UNIFIED v2_3 (Alan Ekleri ile)
## Yeni Alanlar
- IsCabatogeTRFlag (Türk bayraklı & kabotaj/dahili sefer → %10 indirim)
- ApplyRuleAddons (kural kaynaklı ek ücretleri uygula/uygulama; varsayılan açık)
- SecurityExitTime (araç 4s eşiği tetikleyicisi)
- AttachedLetterApproved (dış vinç dilekçe onayı)

**WorkOrder**
- `WOId` *(PK)*, `CustomerCode`, `RequesterUserId`, `Type` *(Hizmet/MB/Barınma/Diğer)*, `ServiceCode` *(opsiyonel)*
- `Subject`, `Description`, `Priority`, `PlannedStart`, `PlannedEnd`
- `Status` *(New, InReview, Approved, Rejected, InProgress, Done, Billed, Archived)*
- `CreatedAt/By`, `UpdatedAt/By`
- `AttachmentsCount`, `HasSignature` *(bool)*

**Archive**
- `ArchiveId` *(PK)*, `WOId` *(FK)*, `CustomerCode`, `DocType` *(WO_FORM, SOZLESME, FOTOGRAF, RAPOR, FATURA, IMZALI_FORM)*
- `FileName`, `FileExt`, `Size`, `HashMD5/SHA256`, `UploadUser`, `UploadAt`
- `Tags` *(JSON)*: `{"ContractNo":"CNT001","InvoiceNo":"INV001","TripNo":"TRP001"}`


## İş Emri Talep Formu (Müşteri Portal)
### 6.3 Örnekler
- **Forklift:** 1s20dk, `Block=30dk, UP` → 1,5 saat; 450 TRY/saat ⇒ Net 675,00.  
- **4‑Saat:** 5s10dk → blok 5,5 ⇒ `Base(4s)=2000 + ceil(1,5)*350 = 2700`.  
- **Barınma:** 1g6s ⇒ **2 gün** (güne yuvarlama, UP).

<!-- PATCH_U1_ANCHOR_ALIAS_VU2 -->
### Teknik Anchor'lar
<a id="menu-is-emri-unified"></a>
<a id="menu-is-emri"></a>

## Ek Gövde — İş Emri (v2_3 UNIFIED)

## Validasyon
- Kabotaj indirimi için Bayrak=TR ve kabotaj=TRUE şart
- Dış vinçte dilekçe olmadan talep → uyarı/engelle

## EK-B: İş Emri v2_2 Addendum (Tam Metin)

**Minimum Alanlar**
- Müşteri → `CustomerCode` otomatik, `RequesterUser` portal kimliğinden
- `Type` seçimi (Hizmet/MB/Barınma/Diğer)
- `Subject`, `Description`, ek dosya(lar)

**Opsiyonel Alanlar**
- `Tekne/Plaka` (uygunsa), `Konum`, `Talep Tarihi`, `İstenilen Zaman Aralığı`

**Validasyon**
- Zorunlu: `Type`, `Subject`, `Description`
- Boyut/uzantı limitleri (ör. PDF/JPG/PNG, ≤25MB/ek)


## İç Onay Akışı ve Durum Kodları
Akış: **New → InReview → Approved/Rejected → InProgress → Done → Billed → Archived**  
- `InReview`: Operasyon veya süpervizör kontrolü
- `Approved`: planlandı; iş ataması yapılır
- `Rejected`: gerekçeli ret (archivable)
- `Billed`: faturası kesildi (fatura no arşiv etiketine eklenir)
- SLA izlemesi: hedef yanıt/çözüm süreleri (ör. 4s/24s), `v_rep_wo_sla_breach` ile


## Dijital Arşiv (Belge Tipleri & İmza)
- **Adlandırma**: `{DocType}_{WOId}_{YYYYMMDD}_{seq}.{ext}`; klasör: `/Archive/{YYYY}/{MM}/{CustomerCode}/`
- **İmza**: PDF formdaki onay imzası (mavi ıslak/elektronik); `HasSignature=1`
- **Bütünlük**: MD5/SHA256 checksum; kritik belgelere hash saklanır
- **Erişim**: rol tabanlı; müşteri kendi belgelerini görür, iç kullanıcılar yetkisine göre geniş erişir


## Entegrasyon Bağlantıları (Hizmet / MB / Barınma)
**MinCharge Uygulama Sırası:** Hesaplanan net hizmet bedeline _sonda_ uygulanır → ardından kur (rate-freeze) → vergi.

- **Hizmet**: WorkOrder.ServiceCode dolu ise ilgili Hizmet Kartı kuralları devreye girer.
- **MB**: `Type=MB` seçili ise sefer/bekleme kaydı açmaya yönlendirir (MB formu ile entegre).
- **Barınma**: sözleşme talebi/uzatma → `BarinmaContract` akışını tetikler, imzalı sözleşme PDF arşive düşer.


## Raporlar ve İzleme
- (Öneri) `v_rep_workorder_pending` — durum bazında bekleyen iş emirleri
- (Öneri) `v_rep_workorder_archive_by_customer` — müşteri bazında arşiv dağılımı
- (Öneri) `v_rep_wo_sla_breach` — SLA aşımı olan kayıtlar
- Mevcut raporlar ile köprü: MB **weekly candidates**, Barınma **prorata check**


## Test Senaryoları
1) Cari kullanıcı portalından “MB” tipinde talep + ek dosya yükle → iç onaya düşmeli.  
2) Onaylandıktan sonra MB sefer kaydına yönlendir → fatura→arşivde fatura PDF etiketi görünmeli.  
3) Ret akışı gerekçeli ve arşivlenebilir olmalı.  
4) Sözleşme talebi → sözleşme PDF **imzalı** olarak arşivde yer almalı.


## Sürüm Notu
### [UNIFY-MERGE NOTE] Merged Addendum v2_2

# Form — İş Emri v2_2 (Addendum)
Tarih: 2025-11-05 00:08:10

UNIFIED v2.3 revizyonu: müşteri portalı, çok-kullanıcılı erişim, arşiv adlandırma ve SLA izleme önerileri tek metinde toplandı.

