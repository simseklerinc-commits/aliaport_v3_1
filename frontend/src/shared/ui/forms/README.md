# Form Components Documentation

React Hook Form + Zod validation ile entegre, yeniden kullanılabilir form bileşenleri.

## 📦 Kurulum

Gerekli paketler zaten yüklü:
- `react-hook-form` ^7.55.0
- `zod` ^3.23.8
- `@hookform/resolvers` ^3.9.0

## 🧩 Bileşenler

### FormField
React Hook Form ile entegre temel form field wrapper.

```tsx
<FormField
  name="email"
  control={control}
  label="E-posta"
  required
  description="Geçerli bir e-posta adresi giriniz"
  render={({ field }) => <Input {...field} />}
/>
```

### Input
Temel text input bileşeni.

```tsx
<Input
  placeholder="Örnek metin"
  error={!!errors.fieldName}
  disabled={false}
/>
```

### Textarea
Çok satırlı metin girişi.

```tsx
<Textarea
  rows={4}
  placeholder="Açıklama..."
  error={!!errors.description}
/>
```

### Select
Native dropdown select.

```tsx
<Select
  options={[
    { value: 'option1', label: 'Seçenek 1' },
    { value: 'option2', label: 'Seçenek 2', disabled: true },
  ]}
  placeholder="Seçiniz"
  error={!!errors.select}
/>
```

### Checkbox
Tek checkbox girişi.

```tsx
<Checkbox
  label="Kabul ediyorum"
  checked={value}
  onCheckedChange={onChange}
/>
```

### RadioGroup
Radio button grubu.

```tsx
<RadioGroup
  options={[
    { value: 'option1', label: 'Seçenek 1' },
    { value: 'option2', label: 'Seçenek 2' },
  ]}
  name="radioGroup"
  error={!!errors.radio}
/>
```

### DateInput
Tarih/saat seçici.

```tsx
<DateInput
  showTime={true}
  error={!!errors.date}
/>
```

### NumberInput
Sayı girişi (keyboard kontrolü ile).

```tsx
<NumberInput
  allowDecimal={true}
  allowNegative={false}
  placeholder="0.00"
  error={!!errors.number}
/>
```

## 🔐 Validation Schemas

### Cari Schema
```tsx
import { createCariSchema } from '@/shared/schemas';

const form = useForm({
  resolver: zodResolver(createCariSchema),
});
```

**Özellikler:**
- TCKN validasyonu (11 hane)
- Vergi No validasyonu (10 hane)
- Email format kontrolü
- Telefon format kontrolü (10 hane)
- IBAN validasyonu (TR ile başlayan 26 karakter)
- Conditional validation (Gerçek kişi → TCKN, Tüzel kişi → Vergi No)

### Tarife Schema
```tsx
import { createPriceListSchema, createPriceListItemSchema } from '@/shared/schemas';
```

**Özellikler:**
- Liste kodu format kontrolü (büyük harf, rakam, tire, alt çizgi)
- Para birimi enum (TRY, USD, EUR, GBP)
- Birim enum (ADET, KG, TON, M3, SAAT, GUN)
- Geçerlilik tarih aralığı kontrolü
- Pozitif sayı validasyonları

### Motorbot Schema
```tsx
import { createMotorbotSchema, createSeferSchema } from '@/shared/schemas';
```

**Özellikler:**
- Bot kodu format kontrolü
- Kapasite pozitif sayı kontrolü (max 1000)
- Tip enum (ROMORKÖR, PILOT, DESTEK)
- Sefer durum enum (PLANLANDI, DEVAM_EDIYOR, TAMAMLANDI, IPTAL)
- Tarih aralığı validasyonu (başlangıç < bitiş)

### WorkOrder Schema
```tsx
import { createWorkOrderSchema, createWorkOrderItemSchema } from '@/shared/schemas';
```

**Özellikler:**
- İş emri no format kontrolü
- Durum enum (TASLAK, ONAYLANDI, DEVAM_EDIYOR, TAMAMLANDI, IPTAL)
- Öncelik enum (DUSUK, NORMAL, YUKSEK, ACIL)
- Tarih/saat validasyonları
- WorkOrderItem için tutar hesaplama kontrolü (miktar × birim fiyat)

## 📚 Kullanım Örnekleri

### 1. Basit Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, Input } from '@/shared/ui/forms';
import { createMotorbotSchema } from '@/shared/schemas';

function MotorbotForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(createMotorbotSchema),
    defaultValues: {
      Tip: 'ROMORKÖR',
    },
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        name="BotKodu"
        control={control}
        label="Bot Kodu"
        required
        render={({ field }) => <Input {...field} />}
      />
      <button type="submit">Kaydet</button>
    </form>
  );
}
```

### 2. React Query Mutation Entegrasyonu

```tsx
import { useMotorbotQueries } from '@/core/hooks/queries';

function MotorbotForm() {
  const { createMotorbot } = useMotorbotQueries();
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(createMotorbotSchema),
  });

  const onSubmit = async (data) => {
    await createMotorbot.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

### 3. Conditional Fields

```tsx
const cariTip = watch('CariTip');

return (
  <form>
    <FormField name="CariTip" control={control} ... />
    
    {cariTip === 'TUZEL' && (
      <FormField name="VergiNo" control={control} required ... />
    )}
    
    {cariTip === 'GERCEK' && (
      <FormField name="Tckn" control={control} required ... />
    )}
  </form>
);
```

### 4. Number Input with Transformation

```tsx
<FormField
  name="VadeGun"
  control={control}
  render={({ field }) => (
    <NumberInput
      {...field}
      value={field.value?.toString() || ''}
      onChange={(e) => {
        const val = e.target.value ? parseInt(e.target.value) : undefined;
        field.onChange(val);
      }}
      allowDecimal={false}
    />
  )}
/>
```

## 🎨 Styling

Tüm bileşenler Tailwind CSS ile stillendirilmiştir:
- Focus ring: `focus:ring-2 focus:ring-blue-500`
- Error state: `border-red-500 focus:ring-red-500`
- Disabled state: `disabled:opacity-50 disabled:cursor-not-allowed`

## ✅ Validation Özellikleri

### Built-in Validators
- `min/max` - String uzunluğu
- `positive/nonnegative` - Sayı kontrolü
- `regex` - Pattern matching
- `refine` - Custom validation logic
- `enum` - Predefined values

### Custom Error Messages
```tsx
const schema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz'),
  age: z.number().min(18, 'En az 18 yaşında olmalısınız'),
});
```

### Cross-field Validation
```tsx
.refine(
  (data) => data.BitisZamani >= data.BaslangicZamani,
  {
    message: 'Bitiş başlangıçtan önce olamaz',
    path: ['BitisZamani'],
  }
)
```

## 🚀 Best Practices

1. **Her zaman resolver kullanın**: Zod schema ile form validation'ı otomatik
2. **Default values belirleyin**: Form UX için önemli
3. **Error state'leri gösterin**: `error={!!errors.fieldName}`
4. **Loading state yönetin**: `isSubmitting` ile button'ları disable edin
5. **Type safety**: Zod inference ile tam TypeScript desteği
6. **Reusable schemas**: Schema'ları `shared/schemas` klasöründe tutun

## 📂 Dosya Yapısı

```
frontend/src/
├── shared/
│   ├── ui/
│   │   └── forms/
│   │       ├── FormField.tsx
│   │       ├── Input.tsx
│   │       ├── Textarea.tsx
│   │       ├── Select.tsx
│   │       ├── Checkbox.tsx
│   │       ├── RadioGroup.tsx
│   │       ├── DateInput.tsx
│   │       ├── NumberInput.tsx
│   │       ├── index.ts
│   │       └── examples/
│   │           └── FormExamples.tsx
│   └── schemas/
│       ├── cariSchema.ts
│       ├── tarifeSchema.ts
│       ├── motorbotSchema.ts
│       ├── workOrderSchema.ts
│       └── index.ts
└── features/
    └── cari/
        └── components/
            └── CariForm.tsx (existing)
```

## 🔗 İlgili Dosyalar

- Query Hooks: `frontend/src/core/hooks/queries/`
- API Layer: `frontend/src/lib/api/`
- Type Definitions: `frontend/src/shared/types/`
