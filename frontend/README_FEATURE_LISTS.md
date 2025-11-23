# Modern Liste Patterni (Feature Bazlı Modüller)

Bu doküman Cari, Hizmet, Tarife vb. modül listelerinde kullanılan standart "Modern Liste" yaklaşımını özetler.

## Amaç
Tekrarlayan liste mantığını sadeleştirmek, tutarlı UX sağlamak, pagination / loading / hata / aksiyon / toast davranışını modüller genelinde hizalamak.

## Bileşen Seti
- usePaginatedQuery: Generic hook (items + pagination meta)
- SimplePagination / FullPagination: Sayfa geçiş bileşenleri
- Skeleton bileşenleri: Tablo yükleme aşamasında iskelet görünüm (TableSkeleton)
- useToastMutation: CRUD mutation'larda otomatik success/error bildirimi
- ErrorMessage: Hatalı durum render
- Shared badge (yakında): Durum/Rol/Aktiflik için standart görsel etiket

## Standart Props (Modern List)
```ts
interface ModernListProps<T> {
  onEdit?: (item: T) => void;
  onView?: (item: T) => void;
  onCreate?: () => void;
}
```

## Durum Akışı
1. isLoading => Skeleton bileşenleri + aria-live
2. error => <ErrorMessage message={error.error.message} />
3. empty (filtre uygulanmış veya hiç kayıt yok) => Boş durum mesajı + "İlk kaydı oluştur" CTA
4. data => Tablo satırları + aksiyon butonları + pagination

## Pagination Kullanımı
```tsx
const queryResult = useXListPaginated({ page, page_size: 20, search });
const paginated = queryResult.data; // { items, pagination }
<SimplePagination pagination={paginated.pagination} onPageChange={setPage} />
```
Meta alanları: page, page_size, total, total_pages, has_next, has_prev.

## Skeleton Kriterleri
- İlk yüklemede (fresh mount) isLoading true ise placeholder göster.
- Page değişiminde kısa shimmer efekti kabul edilebilir.
- Skeleton bileşenleri: TableSkeleton(columns=X, rows=Y)

## Toast Patterni (Mutations)
```ts
const createMutation = useToastMutation({
  mutationFn: async (payload) => {...},
  messages: {
    success: (data) => `Kayıt oluşturuldu: ${data.Kod}`,
    error: (err) => `Oluşturma hatası: ${err.error.message}`,
  }
});
```
- Success: İşlem özeti + ayırt edici alan (Kod, Ad, HizmetKodu v.b.)
- Error: Backend error.message veya override edilmiş mesaj

## Erişilebilirlik (A11y)
- Liste konteyneri yükleme sırasında `aria-busy="true"` + `aria-live="polite"`
- Aksiyon ikon butonlarında `title` veya `aria-label` zorunlu
- Renk kontrastları WCAG 2.1 AA (badge arka plan + metin)

## Performans Notları
- Filtre/searh state değişiminde page reset (setPage(1))
- Client-side heavy filter yok: backend'e delegasyon (search, durum, grup_kod, vb.)
- React Query cache süresi modül bazlı (QueryClient getQueryOptions(module))

## Örnek Dosyalar
- Cari: `features/cari/components/CariListModern.tsx`
- Hizmet: `features/hizmet/components/HizmetListModern.tsx` (pagination meta geçişi bekliyor)
- Tarife: `features/tarife/components/TarifeListModern.tsx`

## Genişleme Planı
- StatusBadge: Aktif/Pasif + Durum (AKTIF/TASLAK/PASIF) tek bileşende
- Column visibility kontrolü (responsive kırılımlar)
- FullPagination varyantı (ilk/son sayfa, hızlı sıçrama)
- Inline quick filter chips (aktif filtreleri gösterip silinebilir hale getirme)

## Checklist (Yeni Liste Eklerken)
- [ ] useXListPaginated hook mevcut mu? Yoksa ekle.
- [ ] CRUD mutate hook'ları toast pattern'e geçirildi mi?
- [ ] Skeleton loader entegre edildi mi?
- [ ] Empty state mesajı özgün ve bilgilendirici mi?
- [ ] Aksiyon butonlarında title/aria-label var mı?
- [ ] Pagination meta doğru kullanılıyor mu?
- [ ] error.error.message güvenli biçimde gösteriliyor mu? (hassas bilgi yok)

## Sürüm
v1.0 - 23 Kasım 2025 (Cari, Hizmet, Tarife standartlaştırma)
