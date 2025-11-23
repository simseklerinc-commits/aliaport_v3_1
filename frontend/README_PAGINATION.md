# Pagination Hızlı Rehber

Bu doküman, projede standartlaştırılan React Query + backend pagination entegrasyonunun hızlı kullanım özetidir. Detaylı anlatım için `PAGINATION_GUIDE.md` dosyasına bakın.

## 1. Backend Response Formatı (Özet)
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

## 2. Generic Hook Altyapısı
`usePaginatedQuery` tek seferde data + pagination meta döndürür.
```typescript
const { data, isLoading } = usePaginatedQuery<EntityType, { page?: number }>({
  module: 'MODUL',        // Cache & policy anahtarı
  path: '/modul',         // API endpoint yolu
  filters: { page: 1 },   // page, page_size, search, vb.
});
// data: { items: EntityType[]; pagination: PaginationMeta }
```

## 3. Örnek Specialization
```typescript
export function useCariListPaginated(filters: { page?: number; page_size?: number; search?: string; cari_tip?: string } = {}) {
  return usePaginatedQuery<Cari, { page?: number; page_size?: number; search?: string; cari_tip?: string }>({
    module: 'CARI',
    path: '/cari',
    filters,
  });
}
```

## 4. Component Entegrasyonu
```tsx
function CariListModern() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCariListPaginated({ page, page_size: 20 });

  if (isLoading) return <Loader />;
  if (!data || data.items.length === 0) return <Empty />;

  return (
    <>
      {data.items.map(item => <CariRow key={item.Id} cari={item} />)}
      <SimplePagination
        pagination={data.pagination}
        onPageChange={setPage}
      />
    </>
  );
}
```

## 5. Pagination UI Seçenekleri
- `SimplePagination`: Minimal ("Önceki", "Sonraki", `page / total_pages`, toplam kayıt)
- `Pagination`: Akıllı sayfa numaraları (ellipsis), erişilebilirlik geliştirmeleri, kapsamlı durum

## 6. Migration Checklist
1. Eski `useXList` import'unu `useXListPaginated` ile değiştir.
2. `page` state ekle: `const [page,setPage] = useState(1)`.
3. Query çağrısı: `useXListPaginated({ page, page_size: 20 })`.
4. Data erişimi: `data.items` (eski `data`).
5. Boş veri kontrolü: `!data || data.items.length === 0`.
6. Pagination bileşeni ekle.
7. Search / filter değişimlerinde `setPage(1)` çalıştır.
8. Mutation sonrası invalidation mekanizmasını koru.
9. Devtools ile sayfa değişiminde yeni istek gittiğini doğrula.
10. `aria-disabled`, `aria-current` kontrollerini UI'da test et.

## 7. İpuçları
- Backend yeni pagination meta eklediğinde generic hook otomatik uyumludur.
- Farklı modüller için sadece specialization fonksiyonu oluşturmak yeterli.
- Büyük listelerde `page_size` ayarını modül bazlı standartlaştır (örn: 20 / 50 / 100).

## 8. Son Durum
- Cari modülü migrate edildi.
- Diğer modüller kademeli olarak geçirilecek.
- Eski basit hook'lar deprecate planı tamamlandığında kaldırılacak.

---
Kapsamlı detaylar ve edge-case senaryoları için `frontend/PAGINATION_GUIDE.md` dokümanına başvurun.
