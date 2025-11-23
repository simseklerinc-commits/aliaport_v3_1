# Toast Bildirim Standardizasyonu

Bu doküman Aliaport v3.1 frontendinde toast (geçici bildirim) kullanımını standartlaştırır.

## Amaç
- Tutarlı başarı / hata / uyarı / bilgi mesajları
- Minimum tekrar (wrapper hook ile otomasyon)
- Hata kodu → kullanıcı dostu mesaja dönüşüm temeli
- Erişilebilirlik: odak engellenmez, ekran okuyucu spam olmaz

## Altyapı
- State: `frontend/src/core/state/toastStore.ts` (Zustand)
  - `add`, `remove`, `clear` metodları
  - Otomatik süre sonunda silme (`autoDismissMs`)
- Renderer: `frontend/src/shared/ui/ToastRenderer.tsx` (sabit üst konum)
- Yeni Hook: `frontend/src/core/hooks/useToastMutation.ts`
  - React Query mutation'larına success/error toast ekler
  - Mesajlar string veya fonksiyon (dinamik içerik) olabilir

## Hızlı Kullanım
```typescript
const createCari = useCreateCari();
createCari.mutate({ CariKod: 'C001', Unvan: 'Test', CariTip: 'GERCEK', Rol: 'MUSTERI' });
// Başarılı -> "Cari oluşturuldu: C001" success toast
// Hata -> Backend error.message veya override
```

## Generic Hook Örneği
```typescript
const mutation = useToastMutation({
  mutationFn: async (payload: Payload) => apiCall(payload),
  onSuccess: () => refetchList(),
  messages: {
    success: (data) => `Kayıt güncellendi: ${data.code}`,
    error: (err) => err.error?.message || 'Güncelleme başarısız'
  },
  autoDismissMs: 4000,
});
```

## Shortcut Mesaj Yardımcıları
`toastMessages` nesnesi:
```typescript
toastMessages.create('Cari');   // { success: 'Cari oluşturuldu.', error: 'Cari oluşturulamadı.' }
toastMessages.update('Cari');   // { success: 'Cari güncellendi.', error: 'Cari güncellenemedi.' }
toastMessages.delete('Cari');   // { success: 'Cari silindi.', error: 'Cari silinemedi.' }
```
Üzerine yazılabilir:
```typescript
messages: { ...toastMessages.create('Cari'), success: (d) => `Cari oluşturuldu: ${d.CariKod}` }
```

## Hata Kodu Dönüşümü (Gelecek)
`error.error.code` alanı mevcut. Planlanan ek: `errorCodeMap.ts` ile örneğin:
```typescript
const ERROR_CODE_MAP: Record<string,string> = {
  CARI_NOT_FOUND: 'Cari bulunamadı.',
  WO_INVALID_STATE: 'İş emri bu durumda değiştirilemez.'
};
```
Wrapper içinde:
```typescript
const userMsg = ERROR_CODE_MAP[error.error.code] || error.error.message;
```

## Erişilebilirlik
- Toast container pointer-events: none (içindeki card'lar pointer-events: auto)
- Ekran okuyucu: Çok hızlı ardışık toast üretiminden kaçınılmalı
- Kritik hatalar (örn: kayıp veri) için `aria-live="assertive"` özel kanal ileride eklenebilir

## Tasarım İlkeleri
- 4 seviyesi: success (yeşil), error (kırmızı), warning (sarı), info (nötr)
- Maksimum yaşam süresi: 6s (varsayılan 4s)
- Çok uzun mesajlar (200+ karakter) için `description` alanını kullan
- Aynı tip ve mesaj peş peşe gelirse ileride birleştirme (dedup) düşünülebilir

## Refaktör Planı (Kademeli)
1. Cari CRUD ✅
2. Tarife & Hizmet CRUD ⏳
3. Motorbot & MbTrip ⏳
4. WorkOrder & WorkOrderItem state değişimleri ⏳
5. Parametre & Kurlar özel aksiyonlar (fetch TCMB) ⏳

## Örnek Dinamik Mesaj
```typescript
messages: {
  success: (_, vars) => `Cari güncellendi: ${vars.data.Unvan}`,
  error: (err) => err.error?.details?.field ? `Alan hatası: ${err.error.details.field}` : 'İşlem başarısız'
}
```

## En İyi Uygulamalar
- Mutasyon başlar başlamaz toast gösterme: Önerilmez (yalancı pozitif). Yüksek gecikme senaryosu varsa "loading" tip eklenebilir.
- Error toast içinde ham teknik detay (stack trace) vermekten kaçın.
- Optimistic update + error rollback durumunda hata mesajı daha açıklayıcı olmalı ("Değişiklik geri alındı").

---
Bu rehber Toast kullanımının standardizasyonunu başlatır. Genişletme ve hata kodu eşleme ilerleyen sprintlerde eklenecektir.
