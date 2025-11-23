/**
 * WorkOrderForm
 * Basit İş Emri oluşturma formu (FAZ 3 Gelişmiş Formlar - 1/3)
 * Zod + React Hook Form entegrasyonu.
 * Yalnızca çekirdek alanlar (Cari, Subject, Type, Priority, PlannedStart/End, Flags) dahil.
 * Not: Tarih/saat alanları ISO datetime (YYYY-MM-DDTHH:MM) formatında tutulur.
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { workOrderCreateSchema, type WorkOrderCreateFormValues } from '../../../core/validation/schemas/workorderSchema';
import { useCreateWorkOrder } from '../../../core/hooks/queries/useWorkOrderQueries';

interface WorkOrderFormProps {
  defaultCari?: { id: number; code: string; title: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WorkOrderForm({ defaultCari, onSuccess, onCancel }: WorkOrderFormProps) {
  const createMutation = useCreateWorkOrder();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<WorkOrderCreateFormValues>({
    resolver: zodResolver(workOrderCreateSchema),
    defaultValues: {
      CariId: defaultCari?.id ?? 0,
      CariCode: defaultCari?.code ?? '',
      CariTitle: defaultCari?.title ?? '',
      Type: 'HIZMET',
      Subject: '',
      Priority: 'MEDIUM',
      GateRequired: false,
      SahaKayitYetkisi: true,
      ApplyRuleAddons: true,
      Status: 'DRAFT',
      IsActive: true,
    },
  });

  useEffect(() => {
    if (createMutation.isSuccess) {
      onSuccess?.();
      reset();
    }
  }, [createMutation.isSuccess, onSuccess, reset]);

  const onSubmit = (values: WorkOrderCreateFormValues) => {
    // PlannedStart / PlannedEnd inputlar boş ise undefined gönder
    createMutation.mutate(values, {
      onError: (err) => alert(`Oluşturma hatası: ${err.error.message}`),
    });
  };

  const plannedStart = watch('PlannedStart');
  const plannedEnd = watch('PlannedEnd');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Cari Kod</label>
          <input
            type="text"
            {...register('CariCode')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CARI001"
          />
          {errors.CariCode && <p className="text-xs text-red-600">{errors.CariCode.message}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Cari Ünvan</label>
            <input
              type="text"
              {...register('CariTitle')}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Müşteri A.Ş."
            />
            {errors.CariTitle && <p className="text-xs text-red-600">{errors.CariTitle.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Konu</label>
          <input
            type="text"
            {...register('Subject')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Bakım talebi"
          />
          {errors.Subject && <p className="text-xs text-red-600">{errors.Subject.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Tip</label>
          <select
            {...register('Type')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="HIZMET">HIZMET</option>
            <option value="MOTORBOT">MOTORBOT</option>
            <option value="BARINMA">BARINMA</option>
            <option value="DIGER">DIGER</option>
          </select>
          {errors.Type && <p className="text-xs text-red-600">{errors.Type.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Öncelik</label>
          <select
            {...register('Priority')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
          {errors.Priority && <p className="text-xs text-red-600">{errors.Priority.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Planlanan Başlangıç</label>
          <input
            type="datetime-local"
            {...register('PlannedStart')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.PlannedStart && <p className="text-xs text-red-600">{errors.PlannedStart.message}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Planlanan Bitiş</label>
          <input
            type="datetime-local"
            {...register('PlannedEnd')}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.PlannedEnd && <p className="text-xs text-red-600">{errors.PlannedEnd.message}</p>}
          {plannedStart && plannedEnd && new Date(plannedStart) > new Date(plannedEnd) && (
            <p className="text-xs text-orange-600">Başlangıç bitişten büyük olamaz.</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Kapı Gerekli mi?</label>
          <input type="checkbox" {...register('GateRequired')} className="h-4 w-4 text-blue-600" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Saha Kaydı Yetkisi</label>
          <input type="checkbox" {...register('SahaKayitYetkisi')} className="h-4 w-4 text-blue-600" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Açıklama</label>
        <textarea
          rows={3}
          {...register('Description')}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Detaylı açıklama"
        />
        {errors.Description && <p className="text-xs text-red-600">{errors.Description.message}</p>}
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
