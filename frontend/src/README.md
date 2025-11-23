# 🚢 Aliaport Liman Yönetim Sistemi

Kapsamlı marina ve liman yönetim platformu - 9 ana modül ile geliştirilmiş modern web uygulaması.

## 📋 Özellikler

### Ana Modüller
1. **Cari Hesap Yönetimi** - Müşteri, tedarikçi ve cari kartları
2. **Hizmet Kartları** - Hizmet tanımları ve yönetimi
3. **Tarife Kartları** - Fiyat listeleri ve tarife yönetimi
4. **Motorbot Yönetimi** - Motorbot kayıtları ve takibi
5. **Sefer Yönetimi** - Motorbot sefer planlaması ve izleme
6. **Barınma Kontratları** - Marina barınma sözleşmeleri
7. **İş Emri Sistemi** - İş emri oluşturma ve takip
8. **Fatura Yönetimi** - Faturalama ve e-Fatura entegrasyonu
9. **Raporlama & Dashboard** - Kapsamlı raporlama ve göstergeler

### Teknik Özellikler
- ✅ React 18 + TypeScript
- ✅ Vite build sistemi
- ✅ Tailwind CSS v4.0
- ✅ Shadcn/ui component library
- ✅ Recharts ile grafikler
- ✅ Audit trail sistemi
- ✅ Mock data ile test ortamı
- ✅ SQL schema ile uyumlu
- ✅ Responsive tasarım

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ 
- npm veya yarn

### Adımlar

1. **Bağımlılıkları yükleyin:**
```bash
npm install
# veya
yarn install
```

2. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
# veya
yarn dev
```

Tarayıcınızda `http://localhost:3000` adresini açın.

3. **Production build:**
```bash
npm run build
# veya
yarn build
```

Build dosyaları `dist/` klasöründe oluşturulacak.

4. **Preview:**
```bash
npm run preview
# veya
yarn preview
```

## 📁 Proje Yapısı

```
aliaport-liman-yonetim-sistemi/
├── components/              # React component'leri
│   ├── cards/              # Kart component'leri (Cari, Motorbot, vb.)
│   ├── modules/            # Modül component'leri
│   ├── ui/                 # Shadcn/ui component'leri
│   └── ...                 # Diğer component'ler
├── data/                   # Mock data dosyaları
├── database/               # SQL schema ve dokümantasyon
├── docs/                   # Proje dokümantasyonu
├── lib/                    # Yardımcı kütüphaneler
│   ├── api/               # API katmanları
│   └── types/             # TypeScript tipleri
├── styles/                 # CSS dosyaları
├── utils/                  # Utility fonksiyonları
├── App.tsx                 # Ana uygulama component'i
├── main.tsx               # React entry point
└── package.json           # Proje bağımlılıkları
```

## 🎨 Kullanılan Teknolojiler

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Shadcn/ui** - Component library
- **Recharts** - Charting library
- **Lucide React** - Icon library
- **React Hook Form** - Form yönetimi
- **date-fns** - Tarih işlemleri

### Backend API Pattern
- REST API architecture
- `/lib/api/` klasöründe modüler yapı
- Mock data ile test ortamı
- SQL schema ile uyumlu

## 📊 Modül Detayları

### Cari Hesap Modülü
- Müşteri/tedarikçi kartları
- E-fatura entegrasyonu
- Cari ekstreleri
- Audit trail

### İş Emri Modülü
- Otomatik iş emri no üretimi
- Hizmet kartı entegrasyonu
- Dosya yükleme (Drag & Drop)
- Dashboard ve raporlama
- Durum yönetimi (workflow)

### Motorbot Modülü
- Motorbot kayıtları
- Sefer planlaması
- Sefer raporları
- Faturalandırma

### Fatura Modülü
- Fatura oluşturma
- Kalem yönetimi
- e-Fatura entegrasyonu
- Ödeme takibi

## 🔧 Konfigürasyon

### Ortam Değişkenleri
Projeniz için `.env` dosyası oluşturun:

```env
# API URL (opsiyonel, şu anda mock data kullanılıyor)
# VITE_API_URL=http://localhost:8000/api

# Diğer konfigürasyonlar...
```

### Tailwind Konfigürasyonu
Tailwind CSS v4.0 kullanılıyor. Tüm custom styling `styles/globals.css` dosyasında.

## 📝 Geliştirme Notları

### Yeni Modül Ekleme
1. `/lib/api/{modul}.ts` - API katmanı oluştur
2. `/components/cards/{Modul}Card.tsx` - Kart component'i oluştur
3. `/components/modules/{Modul}Module.tsx` - Modül component'i oluştur
4. `/data/{modul}Data.ts` - Mock data ekle

### Audit Trail
Tüm modüllerde audit trail sistemi kullanılıyor:
```typescript
import { AuditLogViewer } from './components/AuditLogViewer';
import { RecordMetadataCard } from './components/RecordMetadataCard';
```

### SQL Schema
SQL şema dosyası: `/database/schema.sql`
API mapping dokümantasyonu: `/database/API_SQL_MAPPING.md`

## 🐛 Sorun Giderme

### Port zaten kullanımda
Eğer 3000 portu meşgulse, `vite.config.ts` dosyasında portu değiştirin:
```typescript
server: {
  port: 3001, // Farklı bir port
}
```

### TypeScript hataları
```bash
npm run build
```
Build komutu TypeScript hatalarını gösterecektir.

### Module bulunamadı
```bash
# node_modules'ü silin ve tekrar yükleyin
rm -rf node_modules
npm install
```

## 📦 Production Deployment

### Vite Build
```bash
npm run build
```

Build sonrası `dist/` klasörü:
- Static web sunucusuna (Nginx, Apache)
- Vercel, Netlify gibi platformlara
- Docker container'a deploy edilebilir

### Nginx Örnek Konfigürasyon
```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /path/to/dist;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## 🤝 Katkıda Bulunma

1. Bu projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje özel bir proje olup, tüm hakları saklıdır.

## 📞 İletişim

Proje Sahibi - Aliaport Liman Yönetim Sistemi

---

**Not:** Bu proje şu anda mock data ile çalışmaktadır. Backend API entegrasyonu için `/lib/api/` klasöründeki dosyaları gerçek API endpoint'leri ile güncelleyin.
