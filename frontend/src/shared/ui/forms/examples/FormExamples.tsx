/**
 * FORM COMPONENTS USAGE EXAMPLES
 * 
 * React Hook Form + Zod ile entegre form bileşenlerinin kullanım örnekleri
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormField,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  DateInput,
  NumberInput,
} from '@/shared/ui/forms';
import {
  createMotorbotSchema,
  createSeferSchema,
  CreateMotorbotFormData,
  CreateSeferFormData,
} from '@/shared/schemas';

// =====================================================
// EXAMPLE 1: Simple Motorbot Form
// =====================================================

export function MotorbotFormExample({ onSuccess }: { onSuccess?: () => void }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateMotorbotFormData>({
    resolver: zodResolver(createMotorbotSchema),
    defaultValues: {
      Tip: 'ROMORKÖR',
      Kapasite: 50,
    },
  });

  const onSubmit = async (data: CreateMotorbotFormData) => {
    console.log('Form data:', data);
    // API call here
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">Yeni Motorbot</h2>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="BotKodu"
          control={control}
          label="Bot Kodu"
          required
          description="Örn: MB-001, PILOT-01"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="MB-001"
              error={!!errors.BotKodu}
            />
          )}
        />

        <FormField
          name="BotAdi"
          control={control}
          label="Bot Adı"
          required
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Denizci 1"
              error={!!errors.BotAdi}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="Tip"
          control={control}
          label="Bot Tipi"
          required
          render={({ field }) => (
            <Select
              {...field}
              options={[
                { value: 'ROMORKÖR', label: 'Römorkör' },
                { value: 'PILOT', label: 'Pilot Botu' },
                { value: 'DESTEK', label: 'Destek Botu' },
              ]}
              error={!!errors.Tip}
            />
          )}
        />

        <FormField
          name="Kapasite"
          control={control}
          label="Kapasite (ton)"
          required
          render={({ field }) => (
            <NumberInput
              {...field}
              value={field.value?.toString() || ''}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) : 0;
                field.onChange(val);
              }}
              placeholder="50"
              allowDecimal={true}
              error={!!errors.Kapasite}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          name="IMO"
          control={control}
          label="IMO Numarası"
          render={({ field }) => (
            <Input {...field} placeholder="1234567" />
          )}
        />

        <FormField
          name="MMSI"
          control={control}
          label="MMSI"
          render={({ field }) => (
            <Input {...field} placeholder="987654321" />
          )}
        />

        <FormField
          name="Bayrak"
          control={control}
          label="Bayrak"
          render={({ field }) => (
            <Input {...field} placeholder="Türkiye" />
          )}
        />
      </div>

      <FormField
        name="IletisimBilgisi"
        control={control}
        label="İletişim Bilgisi"
        render={({ field }) => (
          <Input {...field} placeholder="VHF Kanal 16, Tel: ..." />
        )}
      />

      <FormField
        name="Notlar"
        control={control}
        label="Notlar"
        render={({ field }) => (
          <Textarea
            {...field}
            placeholder="Ek bilgiler ve notlar..."
            rows={4}
          />
        )}
      />

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}

// =====================================================
// EXAMPLE 2: Sefer Form with Date/Time Inputs
// =====================================================

export function SeferFormExample() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateSeferFormData>({
    resolver: zodResolver(createSeferSchema),
    defaultValues: {
      Durum: 'PLANLANDI',
      BaslangicZamani: new Date().toISOString().slice(0, 16),
    },
  });

  const durum = watch('Durum');

  const onSubmit = async (data: CreateSeferFormData) => {
    console.log('Sefer data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <h2 className="text-2xl font-bold">Yeni Sefer</h2>

      <FormField
        name="MotorbotId"
        control={control}
        label="Motorbot"
        required
        render={({ field }) => (
          <Select
            {...field}
            value={field.value?.toString() || ''}
            onChange={(e) => field.onChange(parseInt(e.target.value))}
            options={[
              { value: '', label: 'Seçiniz' },
              { value: '1', label: 'MB-001 - Denizci 1' },
              { value: '2', label: 'PILOT-01 - Kılavuz 1' },
            ]}
            error={!!errors.MotorbotId}
          />
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="BaslangicZamani"
          control={control}
          label="Başlangıç Zamanı"
          required
          render={({ field }) => (
            <DateInput
              {...field}
              showTime
              error={!!errors.BaslangicZamani}
            />
          )}
        />

        <FormField
          name="BitisZamani"
          control={control}
          label="Bitiş Zamanı"
          render={({ field }) => (
            <DateInput
              {...field}
              value={field.value || ''}
              showTime
              error={!!errors.BitisZamani}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          name="BaslangicLokasyonu"
          control={control}
          label="Başlangıç Lokasyonu"
          render={({ field }) => (
            <Input {...field} placeholder="Liman Rıhtımı" />
          )}
        />

        <FormField
          name="BitisLokasyonu"
          control={control}
          label="Bitiş Lokasyonu"
          render={({ field }) => (
            <Input {...field} placeholder="Demirleme Sahası" />
          )}
        />
      </div>

      <FormField
        name="Durum"
        control={control}
        label="Durum"
        required
        render={({ field }) => (
          <RadioGroup
            {...field}
            options={[
              { value: 'PLANLANDI', label: 'Planlandı' },
              { value: 'DEVAM_EDIYOR', label: 'Devam Ediyor' },
              { value: 'TAMAMLANDI', label: 'Tamamlandı' },
              { value: 'IPTAL', label: 'İptal' },
            ]}
            error={!!errors.Durum}
          />
        )}
      />

      <FormField
        name="GemiAdi"
        control={control}
        label="Gemi Adı"
        render={({ field }) => (
          <Input {...field} placeholder="M/V EXAMPLE" />
        )}
      />

      <FormField
        name="Notlar"
        control={control}
        label="Notlar"
        render={({ field }) => (
          <Textarea
            {...field}
            placeholder="Sefer detayları ve özel notlar..."
            rows={3}
          />
        )}
      />

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sefer Oluştur
        </button>
      </div>
    </form>
  );
}

// =====================================================
// EXAMPLE 3: Checkbox and Multiple Fields
// =====================================================

export function PreferencesFormExample() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      autoApprove: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(console.log)} className="space-y-4 max-w-md">
      <h2 className="text-xl font-bold">Bildirim Tercihleri</h2>

      <FormField
        name="emailNotifications"
        control={control}
        render={({ field }) => (
          <Checkbox
            {...field}
            value=""
            checked={field.value}
            onCheckedChange={field.onChange}
            label="E-posta bildirimleri"
          />
        )}
      />

      <FormField
        name="smsNotifications"
        control={control}
        render={({ field }) => (
          <Checkbox
            {...field}
            value=""
            checked={field.value}
            onCheckedChange={field.onChange}
            label="SMS bildirimleri"
          />
        )}
      />

      <FormField
        name="pushNotifications"
        control={control}
        render={({ field }) => (
          <Checkbox
            {...field}
            value=""
            checked={field.value}
            onCheckedChange={field.onChange}
            label="Push bildirimleri"
          />
        )}
      />

      <div className="pt-4 border-t">
        <FormField
          name="autoApprove"
          control={control}
          render={({ field }) => (
            <Checkbox
              {...field}
              value=""
              checked={field.value}
              onCheckedChange={field.onChange}
              label="İş emirlerini otomatik onayla"
            />
          )}
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Kaydet
      </button>
    </form>
  );
}
