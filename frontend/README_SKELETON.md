# Skeleton Bileşenleri Rehberi

Bu doküman yükleme (loading) durumlarında içeriğin yer tutucular ile kullanıcıya daha az "sıçrama" (layout shift) yaşatacak şekilde gösterilmesini standartlaştırır.

## Amaç
- İlk boyama sırasında boş ekran yerine içerik iskeleti göstermek.
- Kullanıcıya beklenen veri yapısının ipuçlarını vermek (tablo satırları, kart blokları).
- CLS (Cumulative Layout Shift) ve algılanan gecikmeyi azaltmak.

## Bileşenler
| Bileşen | Kullanım | Açıklama |
|--------|----------|----------|
| `Skeleton` | Küçük bloklar | Tek satır veya görsel yer tutucu |
| `LineSkeleton` | Paragraf / çok satırlı metin | Çoklu kısa satırlar üretir |
| `CardSkeleton` | Kart layout | Başlık + metin satırları + buton yer tutucu |
| `TableSkeleton` | Tablo yükleme | Kolon + satır ızgarası, responsive overflow |

## Örnek Kullanım
```tsx
import { TableSkeleton } from 'shared/ui/Skeleton';

function CariListModernLoading() {
  return <TableSkeleton columns={7} rows={8} />;
}
```

## Entegrasyon Örneği (CariListModern)
`isLoading` durumunda eski `Loader` yerine:
```tsx
if (isLoading) {
  return (
    <div aria-busy="true" aria-live="polite">
      <TableSkeleton columns={7} rows={8} />
    </div>
  );
}
```

## Erişilebilirlik (A11y)
- Skeleton bileşenleri `aria-hidden="true"` veya `role="presentation"` ile işaretlenmiştir.
- Gerçek veri yüklendiğinde, screen reader sadece gerçek DOM içeriğini okur.
- `aria-busy="true"` + `aria-live="polite"` kapsayıcıda kullanıldığında kullanıcıya arka planda güncelleme olduğu belirtilir.

## Performans Notları
- Tailwind `animate-pulse` hafif bir CSS animasyonudur (GPU gerektirmez).
- Çok fazla skeleton aynı anda gösterilecekse (100+ satır) animasyon azaltılabilir (örn: `prefers-reduced-motion` media query).

## Best Practices
1. Yükleme süresi çok kısa (<300ms) ise skeleton yerine doğrudan içerik döndürmeyi düşünebilirsin (flaş etkisi önlenir).
2. Mutasyon (create/update/delete) sonrası kısa yeniden yüklemelerde minimal skeleton kullan (tek satırlı shimmer) veya optimistic UI uygula.
3. Liste boyutu tahmin edilemiyorsa, 6–10 satır skeleton yeterlidir; gerçek veri geldiğinde yüksek sayıda satır eklenmesi kullanıcıyı rahatsız etmez.
4. Kart skeleton'unda sabit yükseklikler kullanarak layout sıçramasını engelle.

## Gelecek Geliştirmeler
- `SkeletonThemeProvider` (açık/koyu mod geçişinde özel renk tonları)
- `ProgressiveSkeleton` (ilk küçük iskelet → sonra detaylı iskelet, uzun yüklemelerde)
- `Prefetch` ile eşleştirme (route hover → skeleton preload)

---
Bu dosya hızlı referans içindir; derinlemesine açıklamalar ve migration checklist için `PAGINATION_GUIDE.md` gibi ilgili dokümanlara bakılabilir.
