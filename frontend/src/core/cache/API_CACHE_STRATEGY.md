# API Cache Stratejisi - Karar Dokümanı

## Durum: Değerlendirme Aşaması
**Tarih:** 23 Kasım 2025  
**Amaç:** Frontend API istekleri için optimal cache stratejisini belirlemek.

---

## Seçenekler

### 1. React Query (TanStack Query)
**Avantajlar:**
- ✅ Güçlü cache yönetimi (stale-while-revalidate)
- ✅ Automatic refetch (focus/reconnect/interval)
- ✅ Background updates + optimistic UI
- ✅ Devtools entegrasyonu
- ✅ Infinite scroll + pagination desteği
- ✅ Request deduplication
- ✅ Mutation helpers (invalidateQueries)

**Dezavantajlar:**
- ⚠️ Ekstra bağımlılık (~40kb gzipped)
- ⚠️ Öğrenme eğrisi (query keys, stale time, cache time)
- ⚠️ Mevcut `useApi` / `usePaginated` hook'ları ile entegrasyon gerekir

**Kullanım Örneği:**
```tsx
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['cari', cariId],
  queryFn: () => apiClient.request(`/cari/${cariId}`),
  staleTime: 5 * 60 * 1000, // 5 dakika
  cacheTime: 10 * 60 * 1000 // 10 dakika
});
```

**Uygun Olduğu Durumlar:**
- Real-time güncelleme gereken listeler (iş emirleri, gate log)
- Sık refetch gerektiren veriler
- Optimistic update ihtiyacı (create/update sonrası otomatik liste yenileme)
- Büyük ölçekli, karmaşık veri akışı

---

### 2. SWR (stale-while-revalidate)
**Avantajlar:**
- ✅ Minimal API (~5kb)
- ✅ Otomatik revalidation (focus/reconnect)
- ✅ Request deduplication
- ✅ Mutation helpers
- ✅ Hızlı öğrenme eğrisi
- ✅ TypeScript friendly

**Dezavantajlar:**
- ⚠️ React Query kadar zengin değil
- ⚠️ Infinite scroll destek sınırlı
- ⚠️ Devtools yok

**Kullanım Örneği:**
```tsx
const { data, error, isLoading, mutate } = useSWR(
  `/api/cari/${cariId}`,
  (url) => apiClient.request(url),
  { revalidateOnFocus: true }
);
```

**Uygun Olduğu Durumlar:**
- Basit cache ihtiyaçları
- Bundle size kritik
- Minimal konfigürasyon tercihi

---

### 3. Manuel Cache (Zustand + Custom Logic)
**Avantajlar:**
- ✅ Tam kontrol
- ✅ Sıfır ekstra bağımlılık
- ✅ Mevcut Zustand altyapısı ile entegre
- ✅ Özel cache invalidation stratejisi

**Dezavantajlar:**
- ⚠️ Tekrar yazma (wheel reinvention)
- ⚠️ Bakım yükü
- ⚠️ Edge case'ler manuel handle
- ⚠️ Refetch/revalidation logic kendimiz

**Örnek Yapı:**
```tsx
interface CacheState {
  data: Record<string, { value: any; timestamp: number }>;
  set: (key: string, value: any) => void;
  get: (key: string, maxAge: number) => any | null;
  invalidate: (pattern: string) => void;
}
```

**Uygun Olduğu Durumlar:**
- Çok basit cache ihtiyacı (sadece parametre tablosu gibi statik veri)
- Ekstra kütüphane eklemeden prototip

---

## Öneri: React Query (TanStack Query)

### Gerekçe:
1. **Karmaşıklık Uyumu:** Aliaport'ta iş emri, gate log, worklog gibi real-time güncelleme gereken modüller var.
2. **Optimistic UI:** Create/update sonrası otomatik liste yenileme kritik UX iyileşirmesi.
3. **Pagination:** Mevcut `usePaginated` hook'u React Query ile güçlendirilebilir.
4. **Devtools:** Debug ve troubleshooting kolaylaşır.
5. **Ekosistem:** Geniş topluluk + sürekli güncellemeler.

### Migrasyon Planı:
1. `@tanstack/react-query` kurulumu
2. `QueryClientProvider` app root'a eklenmesi
3. Mevcut `useApi` wrapper'ını React Query ile entegre etme
4. `usePaginated` → `useInfiniteQuery` veya `useQuery` ile pagination
5. Mutation'lar için `useMutation` + `invalidateQueries`

### Cache Politikası (Önerilen):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 dakika (genel)
      cacheTime: 5 * 60 * 1000, // 5 dakika
      refetchOnWindowFocus: true,
      retry: 1
    }
  }
});

// Modül bazlı override:
// Parametreler: staleTime 1 saat
// Kurlar: staleTime 4 saat
// Cari listesi: staleTime 5 dakika
// İş emri listesi: staleTime 30 saniye (real-time)
// Stats: staleTime 1 dakika
```

---

## Alternatif: SWR (Hafif Proje İçin)
Eğer bundle size kritik ve real-time ihtiyaç az ise SWR yeterli. Ancak Aliaport'un karmaşıklığı React Query'yi haklı çıkarıyor.

---

## Sonuç
**Karar:** React Query tercih edilmeli.  
**İlk Adım:** Paket kurulumu + QueryClientProvider setup + ilk `useQuery` hook örneği (Cari listesi).  
**Gelecek:** Tüm API hook'larını React Query ile standardize et.

---

**Onay Durumu:** ⏳ Ekip onayı bekleniyor  
**Uygulama:** FAZ 3.2 tamamlanması sonrası
