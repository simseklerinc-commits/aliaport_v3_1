# 📥 ALIAPORT PROJE KURULUM REHBERİ

## Adım 1: Figma Make'den Projeyi İndirin

### Yöntem A: Zip Dosyası İndirme (Önerilen)
1. **Figma Make arayüzünde** sağ üst köşede **"Export"** veya **"Download"** butonuna tıklayın
2. Zip dosyasını bilgisayarınıza indirin
3. Zip dosyasını çıkarın (extract)

### Yöntem B: Manuel İndirme (Figma Make'de yoksa)
Eğer export özelliği yoksa, bu adımları izleyin:

1. **Tüm dosyaları kopyalayın:**
   - Figma Make arayüzünde tüm dosyaları görüntüleyin
   - Her dosyanın içeriğini kopyalayıp yerel bilgisayarınızda oluşturun

## Adım 2: Node.js Kurulumu

### Windows:
1. [Node.js resmi sitesine](https://nodejs.org/) gidin
2. **LTS sürümünü** (18.x veya üzeri) indirin
3. İndirilen .exe dosyasını çalıştırın
4. Kurulum sihirbazını takip edin (varsayılan ayarlar yeterli)

### macOS:
```bash
# Homebrew ile:
brew install node

# Veya nodejs.org'dan pkg dosyasını indirin
```

### Linux (Ubuntu/Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Kurulumu Kontrol Edin:
```bash
node --version
# v18.x.x veya üzeri olmalı

npm --version
# 9.x.x veya üzeri olmalı
```

## Adım 3: Projeyi Açın

### Windows (Command Prompt veya PowerShell):
```bash
# Proje klasörüne gidin
cd C:\Users\KullaniciAdiniz\Downloads\aliaport-liman-yonetim-sistemi

# veya
cd Desktop\aliaport-liman-yonetim-sistemi
```

### macOS/Linux (Terminal):
```bash
# Proje klasörüne gidin
cd ~/Downloads/aliaport-liman-yonetim-sistemi

# veya
cd ~/Desktop/aliaport-liman-yonetim-sistemi
```

## Adım 4: Bağımlılıkları Yükleyin

```bash
npm install
```

**Bu işlem 2-5 dakika sürebilir.** İnternet bağlantınız olmalı.

### Olası Hatalar:

#### Hata: "npm: command not found"
**Çözüm:** Node.js düzgün kurulmamış. Adım 2'yi tekrar edin.

#### Hata: "Permission denied"
**Çözüm (macOS/Linux):**
```bash
sudo npm install
```

**Çözüm (Windows):**
Command Prompt'u "Yönetici olarak çalıştır" seçeneği ile açın.

#### Hata: Network timeout
**Çözüm:** İnternet bağlantınızı kontrol edin veya:
```bash
npm install --registry https://registry.npmmirror.com
```

## Adım 5: Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

### Başarılı Çalıştırma:
Terminal'de şu mesajı göreceksiniz:
```
  VITE v6.0.1  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Tarayıcıda Açın:
Otomatik olarak açılmazsa, tarayıcınızda şu adresi açın:
```
http://localhost:3000
```

**Tebrikler! 🎉** Proje çalışıyor!

## Adım 6: Geliştirme Araçları (Opsiyonel)

### Visual Studio Code (Önerilen)
1. [VS Code'u indirin](https://code.visualstudio.com/)
2. Projeyi VS Code'da açın:
   ```bash
   code .
   ```

### Önerilen VS Code Eklentileri:
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **TypeScript Vue Plugin (Volar)**
- **ESLint**
- **Prettier**

VS Code'da eklenti yüklemek için:
1. Sol taraftaki Extensions ikonuna tıklayın (Ctrl+Shift+X)
2. Eklenti adını arayın
3. "Install" butonuna tıklayın

## Adım 7: Projeyi Test Edin

### Ana Menüde Gezinin:
1. **Cari Hesaplar** - Müşteri kartlarını görüntüleyin
2. **Hizmet Kartları** - Hizmet listesini kontrol edin
3. **İş Emri** - Dashboard'u inceleyin
4. **Motorbot Yönetimi** - Motorbot kartlarını görün

### Yeni Kayıt Ekleyin:
1. Herhangi bir modülde **"+ Yeni Ekle"** butonuna tıklayın
2. Formu doldurun
3. **"Kaydet"** butonuna tıklayın

## Adım 8: Production Build (Canlıya Almak İçin)

### Build Oluşturma:
```bash
npm run build
```

Build dosyaları `dist/` klasöründe oluşturulacak.

### Build'i Test Etme:
```bash
npm run preview
```

## 🎯 Hızlı Başlangıç Özeti

```bash
# 1. Node.js'in yüklü olduğunu kontrol edin
node --version

# 2. Proje klasörüne gidin
cd aliaport-liman-yonetim-sistemi

# 3. Bağımlılıkları yükleyin
npm install

# 4. Geliştirme sunucusunu başlatın
npm run dev

# 5. Tarayıcıda açın
# http://localhost:3000
```

## 🐛 Sık Karşılaşılan Sorunlar

### 1. Port 3000 Zaten Kullanımda
**Hata:** `Port 3000 is already in use`

**Çözüm:** `vite.config.ts` dosyasını açın ve portu değiştirin:
```typescript
server: {
  port: 3001, // veya başka bir port
}
```

### 2. Module Not Found Hataları
**Hata:** `Cannot find module 'react'`

**Çözüm:**
```bash
# node_modules'ü temizleyin
rm -rf node_modules package-lock.json

# Tekrar yükleyin
npm install
```

### 3. TypeScript Hataları
**Çözüm:**
```bash
# TypeScript'i yeniden derleyin
npm run build
```

### 4. Beyaz Sayfa Görünüyor
**Olası Nedenler:**
- JavaScript hataları (Console'u kontrol edin: F12)
- Build hatası
- Cache sorunu

**Çözüm:**
```bash
# Cache'i temizle ve yeniden başlat
rm -rf node_modules/.vite
npm run dev
```

### 5. Tailwind Stilleri Çalışmıyor
**Çözüm:** 
- `styles/globals.css` dosyasının yüklendiğinden emin olun
- `main.tsx` dosyasında import'u kontrol edin:
  ```typescript
  import './styles/globals.css';
  ```

## 📚 Ek Kaynaklar

### Dokümantasyon:
- `/README.md` - Genel proje bilgileri
- `/docs/` - Modül dokümantasyonları
- `/database/README.md` - Veritabanı şeması
- `/database/API_SQL_MAPPING.md` - API mapping

### Mock Data:
Proje şu anda mock data ile çalışıyor:
- `/data/cariData.ts` - Cari hesaplar
- `/data/motorbotData.ts` - Motorbot kayıtları
- `/data/serviceCardData.ts` - Hizmet kartları
- `/data/invoiceData.ts` - Faturalar

### API Entegrasyonu:
Backend API'yi bağlamak için:
1. `.env` dosyası oluşturun:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
2. `/lib/api/` klasöründeki dosyaları güncelleyin
3. Mock data yerine gerçek API çağrıları yapın

## 🚀 Sonraki Adımlar

1. **Backend API Geliştirin:** PostgreSQL + Express/FastAPI
2. **Database Setup:** `/database/schema.sql` dosyasını kullanın
3. **Authentication:** Kullanıcı girişi ekleyin
4. **Deployment:** Vercel, Netlify veya kendi sunucunuza deploy edin

## 💡 İpuçları

1. **Hot Reload:** Kod değişikliklerinde sayfa otomatik yenilenir
2. **Console Log:** F12 tuşu ile geliştirici konsolunu açın
3. **Network Tab:** API çağrılarını izlemek için
4. **React DevTools:** Chrome eklentisini yükleyin

## 📞 Yardım

Sorun yaşarsanız:
1. Terminal'deki hata mesajını okuyun
2. Google'da hata mesajını arayın
3. `package.json` dosyasındaki versiyonları kontrol edin
4. Node.js versiyonunu güncelleyin

---

**Başarılar! 🎉** Proje artık bilgisayarınızda çalışıyor!
