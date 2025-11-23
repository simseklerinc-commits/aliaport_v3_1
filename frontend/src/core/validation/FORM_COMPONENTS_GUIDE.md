# Form Validation Eklentileri ve Kullanım Özeti

## Tamamlanan Bileşenler

### 1. Field Bileşenleri (`shared/ui/FormField.tsx`)
- **`FormField`**: Label, error, required marker, description ile wrapper.
- **`TextInput`**: Error state rengine göre stil değişimi.
- **`SelectInput`**: Placeholder + options array.
- **`TextAreaInput`**: Çok satırlı metin input.

**Örnek Kullanım:**
```tsx
<FormField label="Cari Kod" name="CariKod" error={errors.CariKod} required>
  <TextInput type="text" {...register('CariKod')} error={errors.CariKod} />
</FormField>
```

### 2. Backend Error → Field Map (`core/validation/backendErrorMap.ts`)
- `ERROR_FIELD_MAP`: ErrorCode → form field eşlemesi.
- `mapBackendErrorToField()`: Backend hatasını alana ve mesaja dönüştürür.
- `injectBackendError()`: Backend hatasını RHF `errors` nesnesine enjekte eder.

**Örnek Kullanım:**
```tsx
const merged = injectBackendError(formState.errors, backendErrorResponse);
// merged artık backend'den gelen alan hatasını içerir
```

### 3. Güncellenmiş `CariCreateForm`
Artık ortak `FormField` / `TextInput` / `SelectInput` kullanıyor; kod tekrarı azaldı, tutarlılık arttı.

## Sonraki Adımlar (İsteğe Bağlı)
- [ ] Async field validation (unique Kod kontrolü için remote check).
- [ ] Date/number formatter entegrasyonu (input'ta format, submit'te parse).
- [ ] Hizmet ve Tarife form şemaları + bileşenleri.
- [ ] Global form error handler (API yanıtını otomatik form'a map eden hook).

## Kullanım Kılavuzu
Backend hata döndüğünde:
```tsx
const handleSubmit = async (values) => {
  const resp = await apiClient.request('/api/cari', { method: 'POST', body: values });
  if (isErrorResponse(resp)) {
    const mappedErrors = injectBackendError(form.formState.errors, resp);
    // mappedErrors kullanarak form alanlarına backend hatasını yansıt
    // veya setError() ile manuel inject
  }
};
```

Alternatif (otomatik):
Hook içinde `onError` callback'ini kullanarak backend yanıtını parse edip `setError` çağır.
