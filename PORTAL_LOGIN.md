# 🔐 ALIAPORT PORTAL GİRİŞ BİLGİLERİ

## Portal Test Kullanıcısı (SABİT - DEĞİŞTİRME!)

**URL:** http://localhost:3000/portal.html

**Giriş Bilgileri:**
- **Email:** `test@aliaport.com`
- **Şifre:** `Test1234!`

---

## Admin Panel Giriş Bilgileri

**URL:** http://localhost:3000/

**Giriş Bilgileri:**
- **Email:** `admin@aliaport.com`
- **Şifre:** `Admin123!`

---

## Portal Kullanıcısını Sıfırlama

Eğer portal kullanıcısı silinirse veya şifre unutulursa:

```powershell
cd C:\Aliaport\Aliaport_v3_1\backend
python create_test_portal_user.py
```

Bu script:
- `test@aliaport.com` kullanıcısını kontrol eder
- Yoksa oluşturur
- Varsa şifresini `Test1234!` olarak sıfırlar

---

## Sunucuları Başlatma

### Backend (Port 8000)
```powershell
cd C:\Aliaport\Aliaport_v3_1\backend
python -m uvicorn aliaport_api.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Port 3000)
```powershell
cd C:\Aliaport\Aliaport_v3_1\frontend
npx vite --host localhost --port 3000
```

---

## Portal Özellikleri

✅ **Ana Sayfa** - Dashboard ve genel bilgiler
✅ **Taleplerim** - İş emri talep listesi
✅ **Yeni Talep** - İş emri oluşturma
✅ **Firma Çalışanları** - Şirket personel yönetimi
✅ **Araçlarım** - Şirket araç yönetimi
✅ **Belgelerim** - Belge yükleme
✅ **Profilim** - Kullanıcı profili ve şifre değiştirme

---

**NOT:** Portal kullanıcı bilgilerini asla değiştirme! Her zaman:
- Email: `test@aliaport.com`
- Şifre: `Test1234!`
