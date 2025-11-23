## React Query Pagination Entegrasyonu - Kullanım Kılavuzu

### Backend Pagination Yapısı

Backend `PaginatedResponse` formatı:
```json
{
  "success": true,
  "data": [...],
  "message": "Liste başarıyla getirildi",
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2025-11-23T10:30:00.000Z"
}
```

### Frontend Type Definitions

`common.types.ts`:
```typescript
export interface PaginatedApiResponse<T = unknown> {
  success: true;
  data: T[];
  message?: string;
  pagination: PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
```

### Query Hook Pattern (WITH Pagination)

### Generic Hook Altyapısı (Önerilen Standart)

Tekil modül bazlı paginated hook'ları tekrar tekrar yazmak yerine `core/hooks/queries/usePaginatedQuery.ts` içinde generik bir altyapı oluşturuldu.

```typescript
// core/hooks/queries/usePaginatedQuery.ts
export function usePaginatedQuery<TItem, TFilters extends Record<string, unknown>>({
  module,   // Örn: 'CARI' (cache & policy anahtarı)
  path,     // Örn: '/cari'
  filters,  // Örn: { page, page_size, search }
}: UsePaginatedQueryParams<TFilters, TItem>) {
  return useQuery<PaginatedQueryResult<TItem>, ErrorResponse>({
    queryKey: createQueryKey(module, 'list', filters),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedApiResponse<TItem>>(path, filters);
      if (!response.success) throw response;
      return { items: response.data, pagination: response.pagination };
    },
    ...getQueryOptions(module),
  });
}

// Modül özel kolaylaştırıcı (specialization)
export function useCariListPaginated(filters: { page?: number; page_size?: number; search?: string; cari_tip?: string } = {}) {
  return usePaginatedQuery<Cari, { page?: number; page_size?: number; search?: string; cari_tip?: string }>({
    module: 'CARI',
    path: '/cari',
    filters,
  });
}
```

Avantajlar:
- Tekrarlayan kod azalır (queryFn + response mapping tek yerde)
- Cache policy modül bazlı kolay yönetilir (`getQueryOptions(module)`)
- Yeni modül eklemek için yalnızca specialization fonksiyonu yeterlidir
- Test edilebilirlik artar (tek generic hook + hafif wrapper)

Kullanım Önerisi: Mevcut tüm `useXList` hook'ları için kademeli olarak `useXListPaginated` specialization oluşturulacak; eski basit hook'lar geçiş bitene kadar korunur.

```typescript
import type { PaginatedApiResponse, PaginationMeta } from '../../../shared/types/common.types';

/**
 * Query result with pagination
 */
export interface PaginatedQueryResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Cari listesi - paginated version
 */
export function useCariListPaginated(params: {
  page?: number;
  page_size?: number;
  search?: string;
} = {}) {
  return useQuery<PaginatedQueryResult<Cari>, ErrorResponse>({
    queryKey: cariKeys.list(params),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedApiResponse<Cari>>('/cari', params);
      
      if (!response.success) {
        throw response;
      }
      
      // Backend PaginatedApiResponse → Frontend PaginatedQueryResult
      return {
        items: response.data,
        pagination: response.pagination,
      };
    },
    ...getQueryOptions('CARI'),
  });
}
```

### Kullanım Örneği

```typescript
function CariList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useCariListPaginated({ page, page_size: 20 });

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage message={error.error.message} />;
  if (!data) return null;

  return (
    <div>
      {/* Liste */}
      {data.items.map(cari => (
        <div key={cari.Id}>{cari.Ad}</div>
      ))}

      {/* Pagination Controls */}
      <div className="pagination">
        <button 
          disabled={!data.pagination.has_prev}
          onClick={() => setPage(p => p - 1)}
        >
          Önceki
        </button>
        
        <span>
          Sayfa {data.pagination.page} / {data.pagination.total_pages}
          ({data.pagination.total} kayıt)
        </span>
        
        <button 
          disabled={!data.pagination.has_next}
          onClick={() => setPage(p => p + 1)}
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
```

### Migration Stratejisi

**Mevcut Hook'lar (Simple):**
```typescript
// Sadece data array döndürür (pagination metadata yok)
export function useCariList(params) {
  return useQuery<Cari[], ErrorResponse>({
    queryFn: async () => {
      const response = await apiClient.get<Cari[]>('/cari', params);
      if (!response.success) throw response;
      return response.data;
    },
  });
}
```

**Yeni Hook'lar (With Pagination):**
```typescript
// Data + pagination metadata döndürür
export function useCariListPaginated(params) {
  return useQuery<PaginatedQueryResult<Cari>, ErrorResponse>({
    queryFn: async () => {
      const response = await apiClient.get<PaginatedApiResponse<Cari>>('/cari', params);
      if (!response.success) throw response;
      return {
        items: response.data,
        pagination: response.pagination,
      };
    },
  });
}
```

### İki Yaklaşım

#### Yaklaşım 1: Separate Hooks (Öneri)
- Mevcut hook'ları olduğu gibi bırak (geriye uyumluluk)
- Yeni `*Paginated` hook'lar ekle
- Component'ler ihtiyaç duyduğunda migrate olur

```typescript
// core/hooks/queries/useCariQueries.ts
export const useCariList = ...;         // Basit versiyon (data: T[])
export const useCariListPaginated = ...; // Paginated versiyon (data: { items, pagination })
```

#### Yaklaşım 2: Replace All (Agresif)
- Tüm `useList` hook'ları `PaginatedQueryResult` döndürecek şekilde güncelle
- Tüm component'leri güncelle (`data` → `data.items`)
- Pagination UI'ları ekle

### Backend Type Guard Check

API client'ta backend response type'ını kontrol edebiliriz:

```typescript
// core/api/client.ts
function isPaginatedResponse<T>(response: any): response is PaginatedApiResponse<T> {
  return response.success && 'pagination' in response;
}

// Hook içinde kullanım
queryFn: async () => {
  const response = await apiClient.get('/cari', params);
  
  if (!response.success) throw response;
  
  if (isPaginatedResponse(response)) {
    return {
      items: response.data,
      pagination: response.pagination,
    };
  } else {
    // Simple response - backward compatibility
    return {
      items: response.data,
      pagination: {
        page: 1,
        page_size: response.data.length,
        total: response.data.length,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      },
    };
  }
}
```

### Öneri

**Kademeli Geçiş (Yaklaşım 1):**
1. `PaginatedApiResponse` ve `PaginationMeta` type'larını ekle ✅
2. Generic `usePaginatedQuery` altyapısını ekle ✅
3. Modül bazlı specialization: `useCariListPaginated` ✅
4. İlk hedef listeyi migrate et: `CariListModern` ✅
5. Pagination UI bileşeni entegre et (SimplePagination / Pagination) ✅
6. Diğer liste component'lerinde kullanım için checklist uygula ⏳
7. Eski basit hook'ları süreli olarak koru (geri uyumluluk) ⏳
8. Son faz: Tüm tüketen component'lerde `data`→`data.items` dönüşümü yapıldıktan sonra basit hook'ları kaldır ⏳

Bu yaklaşım breaking change yaratmadan pagination desteği ekler ve mevcut kodu bozmaz.

### Örnek: Pagination Component

```typescript
// shared/ui/Pagination.tsx
interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, total_pages, has_next, has_prev, total } = pagination;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-sm text-gray-700">
        <span className="font-medium">{total}</span> kayıt bulundu
      </div>
      
      <div className="flex gap-2">
        <button
          disabled={!has_prev}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Önceki
        </button>
        
        <span className="px-3 py-1">
          {page} / {total_pages}
        </span>
        
        <button
          disabled={!has_next}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
```

### Status: READY

✅ Type definitions eklendi (`PaginatedApiResponse`, `PaginationMeta`)  
✅ Generic hook altyapısı (`usePaginatedQuery.ts`)  
✅ İlk specialization (`useCariListPaginated`)  
✅ CariListModern migrate edildi (items + pagination meta)  
✅ Pagination UI component (Simple + Full)  
⏳ Diğer modül listelerinin kademeli migration'ı  
⏳ Basit hook'ların deprecate planı

### Migration Checklist (Component Bazlı)
1. Eski hook import'u kaldır: `useXList` → `useXListPaginated`
2. State: `const [page,setPage] = useState(1)` ekle (yoksa)
3. Query çağrısı: `const { data } = useXListPaginated({ page, page_size: 20, ...filters })`
4. Data erişimi: `data.items` (Eski `data` array idi)
5. Boş durum kontrolü: `if (!data || data.items.length === 0)`
6. Pagination UI ekle: `<SimplePagination pagination={data.pagination} onPageChange={setPage} />`
7. Search / Filter değişimlerinde `setPage(1)` ile sıfırla
8. Mutation sonrası: invalidate key (queryKey değişmez – filters aynı kalır)
9. Test: Page değişiminde network çağrısı tetikleniyor mu? (`React Query Devtools`)
10. Erişilebilirlik: Pagination butonlarında `aria-disabled` ve `aria-current` doğrula
