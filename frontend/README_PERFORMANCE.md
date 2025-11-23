# Performans Temel Ölçüm & Kod Bölme Stratejisi

Tarih: 23 Kasım 2025
Durum: İlk baz dokümantasyon oluşturuldu (bundle split henüz uygulanmadı – helper ve rehber eklendi).

## 1. Hedef Metrikler (İlk Faz)
| Metrik | Hedef | Not |
|--------|-------|-----|
| FCP (First Contentful Paint) | < 1.5s | Lokal/dev proxy hariç prod ölçülmeli |
| LCP (Largest Contentful Paint) | < 2.5s | Ana dashboard/ilk liste ekranı odak |
| TTI (Time to Interactive) | < 3.5s | React hydration + ilk sorgular |
| CLS (Cumulative Layout Shift) | < 0.1 | Skeleton + boyut rezervasyonu gerekli |
| TBT (Total Blocking Time) | < 200ms | Büyük non-split modül riskini azalt |

İlerleyen fazlarda: Prefetch optimizasyonları + streaming API (gerekirse) + izleme.

## 2. Ölçüm Araçları
- Lighthouse (Chrome DevTools) – Performance panel, Mobile emulation.
- Web Vitals (npm `web-vitals`) – üretim build’e entegre edilebilir.
- React Profiler – interaction ve render commit süreleri.
- Coverage Tab (DevTools) – kullanılmayan JS/CSS yüzdesi.

### 2.1 Basit Web Vitals Entegrasyonu (Opsiyonel İleride)
```tsx
// src/core/monitoring/webVitals.ts
import { onCLS, onFID, onLCP, onTTFB } from 'web-vitals';
export function initWebVitals(report: (metric) => void) {
  onCLS(report); onFID(report); onLCP(report); onTTFB(report);
}
```

## 3. Kod Bölme (Code Splitting) İlkeleri
1. Route-based lazy loading (her büyük feature modülü).
2. Second-tier split: Büyük grafik/analiz kütüphaneleri (`recharts`, `embla-carousel`, `vaul`).
3. Kritik yol dışındaki form editörleri / yönetim modülleri ilk ekranda yüklenmez.
4. Preload / prefetch: Kullanıcı menüyü açtığında ilgili modül `preload()` ile hazırlanır.
5. Avoid eager re-export loops – tek giriş noktası.

## 4. `lazyWithPreload` Helper
`React.lazy` üzerine preload kabiliyeti ekler. Bir sonraki etkileşimde daha hızlı mount.

```ts
// src/core/utils/lazy.ts
import React from 'react';
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const Component = React.lazy(factory);
  (Component as any).preload = factory;
  return Component as T & { preload: () => Promise<{ default: T }> };
}
```

## 5. Örnek Kullanım
```tsx
// src/features/cari/index.tsx (varsayım: ana list component)
export default function CariModule() { /* ... */ }

// src/AppRoutes.tsx
import { Suspense } from 'react';
import { lazyWithPreload } from '@/core/utils/lazy';
const CariModule = lazyWithPreload(() => import('@/features/cari'));

export function AppRoutes() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <CariModule />
    </Suspense>
  );
}

// Menü hover prefetch
function SidebarMenu() {
  return <button onMouseEnter={() => (CariModule as any).preload()}>Cari</button>;
}
```

## 6. Bundle Analizi (Plan)
Vite default’ta analiz yok; eklemek için `rollup-plugin-visualizer` ileride:
```bash
npm install --save-dev rollup-plugin-visualizer
```
```ts
// vite.config.ts (ileride)
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [react(), visualizer({ filename: 'stats.html', gzipSize: true })]
```
Üretim build sonrası `stats.html` incelenir.

## 7. Prefetch Stratejisi
| Durum | Eylem |
|-------|------|
| Menü hover | İlgili modül `.preload()` |
| Route geçişi tahmini (soon) | `IntersectionObserver` ile ekran altındaki linkler prefetch |
| Kullanıcı idle | `requestIdleCallback` → sıradaki 1–2 modül preload |

## 8. React Query İlk Yük Optimizasyonu
- `staleTime` kritik listelerde kısa tutuldu (WORKORDER 30s) – ilk render sonrası hızlı.
- Prefetch hook (ileride): `queryClient.prefetchQuery()` route preload içinde.

## 9. Skeleton / Layout Shift Önleme
- Liste / tablo bileşenleri için yüksekliği tahmin edilebilen skeleton (örn 10 satır × 48px) – CLS düşürür.
- Resim / grafik placeholder boyutu sabitlenmeli.

## 10. Performans Checklist
- [ ] Route’lar lazy yüklendi
- [ ] Büyük third-party (recharts) sadece ihtiyaçta
- [ ] Preload kritik menü ögeleri
- [ ] Skeleton eklendi (tablo/kart)
- [ ] Lighthouse mobile puanı ≥ 85
- [ ] LCP elemana skeleton değil gerçek içerik hızlı sağlandı

## 11. Hedef İyileştirme Sırası
1. Route lazy
2. Preload menü
3. Skeleton ekleme
4. Bundle analiz → parçalara ayırma (grafik vs.)
5. Prefetch / idle preload
6. Web Vitals raporlama

## 12. Örnek Idle Preload (Taslak)
```ts
// src/core/perf/idlePreload.ts
export function idlePreload(tasks: Array<() => void>) {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => tasks.forEach(t => t()));
  } else {
    setTimeout(() => tasks.forEach(t => t()), 150);
  }
}
// Kullanım: idlePreload([() => (CariModule as any).preload()])
```

## 13. İzleme ve Raporlama
İleride: İlk yükte ölçülen web vitals metriklerini backend’e (opsiyonel) POST edip dashboard’da trend analizi.

## 14. Riskler
| Risk | Etki | Mitigasyon |
|------|------|------------|
| Aşırı parçalama | Çok fazla network isteği | Gruplama: feature düzeyinde | 
| Preload fazla | Boşuna bant genişliği | Menü / tahmin bazlı koşullu preload |
| Üçüncü parti güncellemeleri | Boyut artışı | Periyodik bundle analiz (haftalık) |

---
**Son Güncelleme:** 23 Kasım 2025
