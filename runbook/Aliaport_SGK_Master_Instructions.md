# Aliaport – SGK Entegrasyonu MASTER Copilot Talimatı

## 0. Proje Bağlamı
Backend: FastAPI + SQLAlchemy  
Frontend: React + TypeScript  
Veritabanı: aliaport.db (dev) / PostgreSQL (prod)

Amaç: SGK Hizmet Listesi PDF yükleme, dönem kontrolü, çalışan doğrulaması, iş emri kısıtlama ve dosya saklama yapısının tam entegrasyonu.

---

## 1. Dosya Saklama Modeli
SGK PDF'leri veritabanında değil, dosya sisteminde saklanır.

**Temel klasör:**  
`D:/AliaportData/sgk/`

**Alt yapı:**  
```
D:/AliaportData/sgk/
    2025/
        FIRMA_001/
            202503/
                sgk_FIRMA001_202503_2025-04-30_101500.pdf
```

**DB’de saklanan tek bilgi:**  
```
storage_key = "2025/FIRMA_001/202503/sgk_FIRMA001_202503_2025-04-30_101500.pdf"
```

---

## 2. Veri Modeli ve Migration’lar

### 2.1 Çalışan modeli güncellemeleri
- sgk_last_check_period: String(6)
- sgk_is_active_last_period: Boolean

### 2.2 Yeni tablo: SgkPeriodCheck
Alanlar:
- id  
- firma_id  
- period (YYYYMM)  
- storage_key  
- file_size  
- checksum  
- uploaded_at  
- uploaded_by_user_id  
- status ("OK" / "FAILED_PARSE")  
- matched_employee_count  
- missing_employee_count  
- extra_in_sgk_count

---

## 3. Backend – SGK PDF Yükleme

Yeni endpoint:  
POST /portal/documents/sgk-hizmet-yukle

Parametreler:
- file (PDF, zorunlu)  
- period ("YYYY-MM", zorunlu → backend "YYYYMM"e çevirir)

### PDF Okuma Kuralları
- PDF değilse → 400 + hata  
- PDF okunamazsa → 400 + hata  
- TCKN bulunamazsa → 400 + hata  
- Bu durumda çalışanlara hiçbir şey yazılmaz.

### Başarılı akış
- PDF'ten TCKN listesi çıkar  
- Aynı firmanın çalışanları ile eşleşme yapılır  
- Çalışan kayıtlarına:
  - sgk_last_check_period
  - sgk_is_active_last_period
  işlenir  
- SgkPeriodCheck kaydı oluşturulur  
- success_response döner

---

## 4. Backend – İş Emri Guard (SGK Zorunluluğu)

Yeni kontrol fonksiyonu:  
ensure_sgk_compliance_for_firma_and_period

Mantık:
- Her yeni iş emri için:  
  → Bir önceki aya ait SGK listesi yüklenmiş olmalı  
- Eğer yoksa:
  → İş emri reddedilir  
- Eğer seçilen personelin SGK kaydı yoksa:  
  → İş emri reddedilir

---

## 5. Backend – Aylık Hatırlatma

Scheduler job:
- Her gün 10:00  
- Ay sonu kontrolü  
- Bir önceki ayın SGK kaydı yoksa:  
  → Firma sorumlusuna mail gönder

---

## 6. Backend – Çalışan Listesi JSON Güncellemesi
Employees API artık şu alanları döndürmeli:
- sgk_is_active_last_period  
- sgk_last_check_period  

---

## 7. Frontend – “Belge Yükle” SGK Entegrasyonu

Yeni seçenek:
“Aylık SGK Hizmet Listesi Yükle”

Arayüz:
- PDF seçimi (sadece pdf kabul)  
- Dönem ("YYYY-MM") seçimi  
- Yükle → POST /portal/documents/sgk-hizmet-yukle

Başarılıysa:
- Toast bildirimi  
- Personel listesi yenilenir

Başarısızsa:
- Backend hata mesajı gösterilir

---

## 8. Frontend – Firma Çalışanları Tablosu

Yeni sütun: SGK

Mantık:
- ✔ → sgk_is_active_last_period = true  
- Yok/boş → sgk_is_active_last_period = false  
- Tooltip: “Son kontrol: 2025-03”

---

## 9. Frontend – İş Emri Ekranı Uyarıları

Backend “SGK eksik” hatası dönerse:
- Form üzerinde kırmızı uyarı:
  “Bu firma için ilgili dönemde SGK hizmet listesi yüklenmeden iş emri açamazsınız.”

Çalışan bazlı SGK hatası varsa:
- Hata detayları kullanıcıya gösterilir.
