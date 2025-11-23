/**
 * PriceListItemInlineForm
 * Bir Tarife içindeki PriceListItem kalemini satır içinde (inline) oluşturma / düzenleme formu.
 * Kullanım Senaryosu: `PriceListModern` içindeki kalem tablosunda "Yeni Kalem" veya "Düzenle" aksiyonu ile açılır.
 * Özellikler:
 *  - Zod + React Hook Form validasyon (priceListItemCreateSchema / priceListItemUpdateSchema)
 *  - Create & Update modları (existingItem varsa update)
 *  - Optimistic olmadan standart mutate + invalidation (hook'lar zaten invalidate ediyor)
 *  - Hızlı iptal, dış container tarafından kapatılabilir.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  priceListItemCreateSchema,
  priceListItemUpdateSchema,
  type PriceListItemCreateFormValues,
  type PriceListItemUpdateFormValues,
} from '../../../core/validation/schemas/tarifeSchema';
import { useCreatePriceListItem, useUpdatePriceListItem } from '../../../core/hooks/queries/useTarifeQueries';
import type { PriceListItem } from '../../../shared/types/tarife';

interface PriceListItemInlineFormProps {
  priceListId: number;
  existingItem?: PriceListItem; // varsa update modu
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PriceListItemInlineForm({ priceListId, existingItem, onSuccess, onCancel }: PriceListItemInlineFormProps) {
  const isEdit = !!existingItem;
  const createMutation = useCreatePriceListItem();
  const updateMutation = useUpdatePriceListItem();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<PriceListItemCreateFormValues | PriceListItemUpdateFormValues>({
    resolver: zodResolver(isEdit ? priceListItemUpdateSchema : priceListItemCreateSchema),
    defaultValues: isEdit
      ? {
          Id: existingItem!.Id,
          PriceListId: existingItem!.PriceListId,
          HizmetKodu: existingItem!.HizmetKodu,
          HizmetAdi: existingItem!.HizmetAdi,
          Birim: existingItem!.Birim,
          BirimFiyat: existingItem!.BirimFiyat,
          KdvOrani: existingItem!.KdvOrani,
          Aciklama: existingItem!.Aciklama,
          SiraNo: existingItem!.SiraNo,
          AktifMi: existingItem!.AktifMi,
        }
      : {
          PriceListId: priceListId,
          HizmetKodu: '',
          HizmetAdi: '',
          Birim: 'ADET',
          BirimFiyat: 0,
          KdvOrani: 20,
          Aciklama: '',
          SiraNo: 0,
        },
  });

  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      onSuccess?.();
      if (!isEdit) {
        reset({
          PriceListId: priceListId,
          HizmetKodu: '',
          HizmetAdi: '',
          Birim: 'ADET',
          BirimFiyat: 0,
          KdvOrani: 20,
          Aciklama: '',
          SiraNo: 0,
        });
      }
    }
  }, [createMutation.isSuccess, updateMutation.isSuccess, onSuccess, reset, isEdit, priceListId]);

  const onSubmit = (values: any) => {
    if (isEdit) {
      const { Id, ...data } = values as PriceListItemUpdateFormValues;
      updateMutation.mutate(
        { id: Id!, data },
        { onError: (err) => alert(`Güncelleme hatası: ${err.error.message}`) }
      );
    } else {
      createMutation.mutate(values as PriceListItemCreateFormValues, {
        onError: (err) => alert(`Oluşturma hatası: ${err.error.message}`),
      });
    }
  };

  const birimFiyat = watch('BirimFiyat');
  const kdvOrani = watch('KdvOrani');
  const kdvTutari = birimFiyat && kdvOrani ? (birimFiyat * kdvOrani) / 100 : 0;
  const toplamFiyat = birimFiyat + kdvTutari;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-2 items-start p-2 bg-white border rounded-md">
      <div className="col-span-2 space-y-1">
        <input
          type="text"
          placeholder="Hizmet Kodu"
          {...register('HizmetKodu')}
          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.HizmetKodu && <p className="text-[10px] text-red-600">{errors.HizmetKodu.message}</p>}
      </div>
      <div className="col-span-3 space-y-1">
        <input
          type="text"
          placeholder="Hizmet Adı"
          {...register('HizmetAdi')}
          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.HizmetAdi && <p className="text-[10px] text-red-600">{errors.HizmetAdi.message}</p>}
      </div>
      <div className="col-span-1 space-y-1">
        <input
          type="text"
          placeholder="Birim"
          {...register('Birim')}
          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.Birim && <p className="text-[10px] text-red-600">{errors.Birim.message}</p>}
      </div>
      <div className="col-span-1 space-y-1">
        <input
          type="number"
          step="0.01"
          placeholder="Fiyat"
          {...register('BirimFiyat', { valueAsNumber: true })}
          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
        />
        {errors.BirimFiyat && <p className="text-[10px] text-red-600">{errors.BirimFiyat.message}</p>}
      </div>
      <div className="col-span-1 space-y-1">
        <input
          type="number"
          step="0.01"
          placeholder="KDV %"
          {...register('KdvOrani', { valueAsNumber: true })}
          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
        />
        {errors.KdvOrani && <p className="text-[10px] text-red-600">{errors.KdvOrani.message}</p>}
      </div>
      <div className="col-span-2 space-y-1">
        <input
          type="text"
          placeholder="Açıklama"
          {...register('Aciklama')}
          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.Aciklama && <p className="text-[10px] text-red-600">{errors.Aciklama.message}</p>}
      </div>
      <div className="col-span-1 space-y-1 text-right">
        <input
          type="number"
          placeholder="Sıra"
          {...register('SiraNo', { valueAsNumber: true })}
          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
        />
        {errors.SiraNo && <p className="text-[10px] text-red-600">{errors.SiraNo.message}</p>}
      </div>
      <div className="col-span-1 text-[10px] leading-tight text-gray-600 space-y-0.5">
        <div>KDV: {kdvTutari.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
        <div>Toplam: {toplamFiyat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
      </div>
      <div className="col-span-1 flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending || updateMutation.isPending ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Ekle'}
        </button>
      </div>
    </form>
  );
}
