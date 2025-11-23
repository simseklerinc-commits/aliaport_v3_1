# Tema Dokümantasyonu (Dark / Light)

Bu rehber Aliaport v3.1 frontend tema stratejisini, renk rol tanımlarını, contrast (WCAG) matrisi önerisini ve genişletme adımlarını içerir.

## 1. Amaç
- Tutarlı UI renk rolleri tanımlamak (primary, surface, border, focus, danger, warning, success, info, muted).
- Dark ve light mod arasında semantik değişkenler üzerinden geçiş sağlamak.
- Tailwind ile minimal ek konfigürasyon; gerektiğinde CSS değişkenleri (custom properties) ile genişletme.

## 2. Mevcut Durum
- `tailwind.config.mjs` şu an genişletilmemiş (`extend: {}`) ve renk token'ları yok.
- `themeStore.ts` basit `mode` state (light | dark) ve toggle fonksiyonu içeriyor; localStorage persist var.
- Dark/Light toggle sonrası henüz kök seviyede (`<html>` veya `<body>`) class uygulaması yok (öneri: `document.documentElement.classList.toggle('dark', mode === 'dark')`).

## 3. Önerilen Yapı

### 3.1 CSS Değişkenleri
`src/assets/styles/theme.css` (oluşturulacak) içinde:
```css
:root {
  --color-bg: #ffffff;
  --color-bg-subtle: #f8fafc; /* slate-50 */
  --color-fg: #0f172a;        /* slate-900 */
  --color-fg-muted: #475569;   /* slate-600 */
  --color-border: #e2e8f0;     /* slate-200 */
  --color-primary: #0d6efd;    /* blue-600 */
  --color-primary-hover: #1d75ff;
  --color-danger: #dc2626;     /* red-600 */
  --color-warning: #d97706;    /* amber-600 */
  --color-success: #16a34a;    /* green-600 */
  --color-info: #0369a1;       /* sky-700 */
  --color-focus-ring: #2563eb; /* blue-600 */
  --color-accent: #9333ea;     /* purple-600 */
  --color-muted-bg: #f1f5f9;   /* slate-100 */
  --color-muted-border: #cbd5e1; /* slate-300 */
}

:root.dark {
  --color-bg: #0f172a;          /* slate-900 */
  --color-bg-subtle: #1e293b;   /* slate-800 */
  --color-fg: #f1f5f9;          /* slate-100 */
  --color-fg-muted: #94a3b8;    /* slate-400 */
  --color-border: #334155;      /* slate-700 */
  --color-primary: #3b82f6;     /* blue-500 */
  --color-primary-hover: #60a5fa;
  --color-danger: #f87171;      /* red-400 */
  --color-warning: #fbbf24;     /* amber-400 */
  --color-success: #4ade80;     /* green-400 */
  --color-info: #0ea5e9;        /* sky-500 */
  --color-focus-ring: #3b82f6;  /* blue-500 */
  --color-accent: #c084fc;      /* purple-400 */
  --color-muted-bg: #1e293b;    /* slate-800 */
  --color-muted-border: #475569;/* slate-600 */
}
```

### 3.2 Tailwind Entegrasyonu
Tailwind config `extend` içine semantik sınıflar için plugin veya saf kullanım:
- Tasarruf için doğrudan `bg-[var(--color-bg)]` kullanabilirsiniz.
- Sık kullanılan roller için util sınıflar (ör: `.btn-primary`) `@layer components` ile tanımlanabilir.

Örnek `src/assets/styles/components.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium
           text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]
           focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2
           transition-colors;
  }
  .card {
    @apply rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 shadow-sm;
  }
  .input-base {
    @apply w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]
           px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-muted)]
           focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-0;
  }
}
```

### 3.3 JavaScript Tema Toggle
`themeStore.ts` içinde toggle sonrası:
```ts
useEffect(() => {
  const unsub = useThemeStore.subscribe((s) => {
    document.documentElement.classList.toggle('dark', s.mode === 'dark');
  });
  document.documentElement.classList.toggle('dark', useThemeStore.getState().mode === 'dark');
  return () => unsub();
}, []);
```
Bu kod App root (örn `App.tsx`) içine eklenebilir.

## 4. Renk Rollerinin WCAG Kontrast Analizi
| Rol              | Light FG vs BG                      | Kontrast (Approx) | Dark FG vs BG                       | Kontrast (Approx) | WCAG AA Large | WCAG AA Normal |
|------------------|-------------------------------------|-------------------|--------------------------------------|-------------------|---------------|----------------|
| Primary Text     | #0d6efd vs #ffffff                  | ~4.5:1            | #3b82f6 vs #0f172a                   | ~5.2:1            | Geçer         | Geçer          |
| Danger Text      | #dc2626 vs #ffffff                  | ~4.2:1            | #f87171 vs #0f172a                   | ~5.3:1            | Geçer         | Sınır/Geçer    |
| Warning Text     | #d97706 vs #ffffff                  | ~4.4:1            | #fbbf24 vs #0f172a                   | ~6.0:1            | Geçer         | Geçer          |
| Success Text     | #16a34a vs #ffffff                  | ~4.9:1            | #4ade80 vs #0f172a                   | ~5.5:1            | Geçer         | Geçer          |
| Info Text        | #0369a1 vs #ffffff                  | ~5.5:1            | #0ea5e9 vs #0f172a                   | ~4.4:1            | Geçer         | Sınır/Geçer    |
| Muted FG         | #475569 vs #f8fafc                  | ~6.8:1            | #94a3b8 vs #1e293b                   | ~4.5:1            | Geçer         | Geçer          |

Not: Değerler yaklaşık; kesin hesap için Lighthouse veya `axe-core` ile test önerilir.

### İyileştirme Önerileri
- Dark mod info rengi (#0ea5e9) kontrastı arttırmak için #0284c7 kullanılabilir (~6.1:1).
- Danger light mod (#dc2626) white üstünde sınır değerlere yakın; metin yerine buton zemin rengi olarak kullanılıyorsa metni beyaz bırakmak yerine #fff yerine #f1f5f9 kullanmak kontrastı iyileştirebilir.

## 5. Komponent Tema Matrisi
| Komponent    | Arka Plan              | Kenar       | Metin        | Hover / Aktif                | Focus Ring                |
|-------------|------------------------|-------------|--------------|-----------------------------|---------------------------|
| Button Prim | var(--color-primary)   | none        | #ffffff      | var(--color-primary-hover)  | var(--color-focus-ring)   |
| Button Sec  | var(--color-bg-subtle) | var(--color-border) | var(--color-fg) | var(--color-muted-bg)       | var(--color-focus-ring)   |
| Card        | var(--color-bg-subtle) | var(--color-border) | var(--color-fg) | shadow-md                  | var(--color-focus-ring)   |
| Input Base  | var(--color-bg)        | var(--color-border) | var(--color-fg) | border-[var(--color-focus-ring)] | var(--color-focus-ring) |
| Alert Info  | #f0f9ff                | #bae6fd     | var(--color-info) | #e0f2fe                    | var(--color-info)         |
| Alert Error | #fef2f2                | #fecaca     | var(--color-danger) | #fee2e2                | var(--color-danger)       |

## 6. Performans ve Ölçeklenebilirlik
- Sprite pipeline tamamlandığı için ikonlar tema bağımsız; renkler `currentColor` ile akıyor.
- CSS değişkenleri ile runtime temalar eklemek kolay (örn: High Contrast, Sepia).
- Next aşama: `prefers-color-scheme` otomatik sync + kullanıcı override.

## 7. Uygulama Adımları
1. `theme.css` ve `components.css` dosyalarını ekle.
2. `App.tsx` içerisinde themeStore subscription ile `dark` class toggling.
3. Kritik komponentleri semantik sınıflara geçir (`btn-primary`, `card`, `input-base`).
4. Lighthouse / axe ile contrast taraması (raporu README'ye ekle).
5. Opsiyonel: Theme switching animasyonu (CSS transition on background, color).

## 8. Gelecek Genişletmeler
- Role-based accent renkleri (Operasyon: mavi, Güvenlik: amber, Saha: green).
- Kullanıcı tercihi saklama (persist edilmiş mode + system fallback differencing).
- CSS Var fallback ile theming (örn: `color: var(--color-fg, #0f172a)`).

## 9. Örnek Kullanım
```tsx
import { useThemeStore } from '@/core/state/themeStore';
import { Icon } from '@/shared/ui/Icon';

function ThemeToggleButton() {
  const mode = useThemeStore(s => s.mode);
  const toggle = useThemeStore(s => s.toggle);
  return (
    <button onClick={toggle} className="btn-primary flex items-center gap-2">
      <Icon name={mode === 'dark' ? 'edit' : 'add'} decorative />
      {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
```

## 10. İzleme
- Ölçüm: CLS ve LCP her tema değişiminden sonra sabit olmalı.
- Olası risk: Ani renk geçişlerinde flash (FOUC) – çözüm: İlk render öncesi localStorage mode okuma ve class ekleme.

---
**Son Güncelleme:** 23 Kasım 2025
