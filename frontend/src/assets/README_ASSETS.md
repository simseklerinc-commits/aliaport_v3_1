# Assets Yapısı

Bu klasör derlenmiş bundle içinde import edilen statik varlıkları (images, svg sprite, icons, fonts) barındırır. `public/` klasörü ise doğrudan kök altında servis edilen ve build sırasında dokunulmayan dosyalar içindir.

## Klasörler
```
assets/
  images/      # Component içi import edilen görseller
  icons/       # SVG tekil dosyalar (React component'e dönüştürülebilir)
  svg/         # Sprite veya ham svg koleksiyonları
  fonts/       # Özel font dosyaları (CSS @font-face ile)
```

## Kullanım Kararları
- Küçük inline ikonlar → React bileşeni (ör: lucide-react) veya `icons/` içinden import.
- Büyük illüstrasyon/görseller → `images/` altında ve `import img from '@/assets/images/...';` şeklinde.
- CDN'e taşınması gereken ağır dosyalar ileride `infrastructure/` pipeline ile optimize edilecek.

## Public vs Assets
- `public/` içindekiler: favicons, manifest.json, meta için statik kök erişim.
- `assets/` içindekiler: tree-shake edilebilen, webpack/vite tarafından hash'lenen içerik.

## Gelecek Adımlar
- SVG sprite jeneratörü eklenmesi.
- Görsel optimizasyon (sharp veya imagemin) build aşamasına dahil.
- Dark/light tema için farklı görsel varyantları adlandırma: `logo_dark.svg`, `logo_light.svg`.
