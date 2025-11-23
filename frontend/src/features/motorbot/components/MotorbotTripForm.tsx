/**
 * MotorbotTripForm
 * MbTrip (Motorbot Sefer) oluşturma formu (FAZ 3 Gelişmiş Formlar - 2/3)
 * Zod + React Hook Form entegrasyonu.
 * Validasyon: Tarih (SeferTarihi), zaman ilişkisi (Çıkış < Dönüş), aynı gün kontrolü,
 * en az bir iskele (Kalkış veya Varış) ve enum durum alanları.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  mbTripCreateWithTimeValidationSchema,
  mbTripWithIskeleSchema,
  type MbTripCreateFormValues,
  MbTripDurumEnum,
  MbTripFaturaDurumuEnum,
} from '../../../core/validation/schemas/motorbotSchema';
import { useCreateMbTrip } from '../../../core/hooks/queries/useMotorbotQueries';

interface MotorbotTripFormProps {
  motorbotId: number; // Dışarıdan seçilmiş motorbot
  defaultCari?: { id: number; kod: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Birleştirilmiş şema: zaman + iskele özel validasyonları
const combinedSchema = mbTripCreateWithTimeValidationSchema.and(mbTripWithIskeleSchema);

export function MotorbotTripForm({ motorbotId, defaultCari, onSuccess, onCancel }: MotorbotTripFormProps) {
  const createMutation = useCreateMbTrip();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<MbTripCreateFormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      MotorbotId: motorbotId,
      SeferTarihi: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      CariId: defaultCari?.id,
      CariKod: defaultCari?.kod,
      Durum: 'PLANLANDI',
    },
  });

  useEffect(() => {
    if (createMutation.isSuccess) {
      onSuccess?.();
      reset({
        MotorbotId: motorbotId,
        SeferTarihi: new Date().toISOString().slice(0, 10),
        Durum: 'PLANLANDI',
      });
    }
  }, [createMutation.isSuccess, onSuccess, reset, motorbotId]);

  const onSubmit = (values: MbTripCreateFormValues) => {
    createMutation.mutate(values, {
      onError: (err) => alert(`Sefer oluşturma hatası: ${err.error.message}`),
    });
  };

  const cikis = watch('CikisZamani');
  const donus = watch('DonusZamani');
  const seferTarihi = watch('SeferTarihi');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Sefer Tarihi</label>
          <input
            type="date"
            {...register('SeferTarihi')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.SeferTarihi && <p className="text-xs text-red-600">{errors.SeferTarihi.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Çıkış Zamanı</label>
          <input
            type="datetime-local"
            {...register('CikisZamani')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.CikisZamani && <p className="text-xs text-red-600">{errors.CikisZamani.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Dönüş Zamanı</label>
          <input
            type="datetime-local"
            {...register('DonusZamani')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.DonusZamani && <p className="text-xs text-red-600">{errors.DonusZamani.message}</p>}
          {cikis && donus && new Date(cikis) > new Date(donus) && (
            <p className="text-xs text-orange-600">Çıkış dönüşten sonra olamaz.</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Durum</label>
          <select
            {...register('Durum')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MbTripDurumEnum.options.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.Durum && <p className="text-xs text-red-600">{errors.Durum.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Kalkış İskele</label>
          <input
            type="text"
            {...register('KalkisIskele')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="A-Pier"
          />
          {errors.KalkisIskele && <p className="text-xs text-red-600">{errors.KalkisIskele.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Varış İskele</label>
          <input
            type="text"
            {...register('VarisIskele')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="B-Pier"
          />
          {errors.VarisIskele && <p className="text-xs text-red-600">{errors.VarisIskele.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Fatura Durumu</label>
          <select
            {...register('FaturaDurumu')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seçiniz</option>
            {MbTripFaturaDurumuEnum.options.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {errors.FaturaDurumu && <p className="text-xs text-red-600">{errors.FaturaDurumu.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Cari Kod</label>
          <input
            type="text"
            {...register('CariKod')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CARI001"
          />
          {errors.CariKod && <p className="text-xs text-red-600">{errors.CariKod.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Yük Açıklama</label>
          <input
            type="text"
            {...register('YukAciklama')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Yük detayı"
          />
          {errors.YukAciklama && <p className="text-xs text-red-600">{errors.YukAciklama.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Notlar</label>
        <textarea
          rows={3}
          {...register('Notlar')}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ek notlar"
        />
        {errors.Notlar && <p className="text-xs text-red-600">{errors.Notlar.message}</p>}
      </div>

      <div className="pt-2 text-xs text-gray-500 space-y-1">
        <p>Sefer tarihi ile çıkış zamanı aynı gün olmalıdır.</p>
        <p>Çıkış ve dönüş zamanı girildiğinde dönüş >= çıkış olmalı.</p>
        <p>Kalkış veya varış iskelesinden en az biri doldurulmalı.</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || createMutation.isPending}
          className="px-5 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
