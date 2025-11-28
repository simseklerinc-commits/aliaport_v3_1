/**
 * İŞ EMRİ FORMU - İş Emri Oluşturma/Düzenleme Formu
 * 
 * Basit İş Emri oluşturma formu
 * Çekirdek alanlar (Cari, Subject, Type, Priority, PlannedStart/End, Flags) dahil.
 * Not: Tarih/saat alanları ISO datetime (YYYY-MM-DDTHH:MM) formatında tutulur.
 */
import { useState } from 'react';
import { useIsemriMutations } from '../hooks/useIsemri';
import type { WorkOrderCreate, WorkOrderType, WorkOrderPriority } from '../types/isemri.types';

interface IsemriFormProps {
  defaultCari?: { id: number; code: string; title: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function IsemriForm({ defaultCari, onSuccess, onCancel }: IsemriFormProps) {
  const { createIsemri, isCreating } = useIsemriMutations();
  
  const [formData, setFormData] = useState<WorkOrderCreate>({
    CariId: defaultCari?.id ?? 0,
    CariCode: defaultCari?.code ?? '',
    CariTitle: defaultCari?.title ?? '',
    Type: 'HIZMET',
    Subject: '',
    Priority: 'MEDIUM',
    GateRequired: false,
    SahaKayitYetkisi: true,
    Status: 'DRAFT',
    IsActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof WorkOrderCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.CariCode) {
      newErrors.CariCode = 'Cari kod zorunludur';
    }
    
    if (!formData.CariTitle) {
      newErrors.CariTitle = 'Cari ünvan zorunludur';
    }
    
    if (!formData.Subject || formData.Subject.length < 3) {
      newErrors.Subject = 'Konu en az 3 karakter olmalıdır';
    }
    
    if (formData.PlannedStart && formData.PlannedEnd) {
      if (new Date(formData.PlannedStart) > new Date(formData.PlannedEnd)) {
        newErrors.PlannedEnd = 'Başlangıç bitişten büyük olamaz';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    const success = await createIsemri(formData);
    if (success) {
      onSuccess?.();
      // Reset form
      setFormData({
        CariId: 0,
        CariCode: '',
        CariTitle: '',
        Type: 'HIZMET',
        Subject: '',
        Priority: 'MEDIUM',
        GateRequired: false,
        SahaKayitYetkisi: true,
        Status: 'DRAFT',
        IsActive: true,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Cari Kod *</label>
          <input
            type="text"
            value={formData.CariCode}
            onChange={(e) => handleChange('CariCode', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CARI001"
          />
          {errors.CariCode && <p className="text-xs text-red-600">{errors.CariCode}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Cari Ünvan *</label>
          <input
            type="text"
            value={formData.CariTitle}
            onChange={(e) => handleChange('CariTitle', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Müşteri A.Ş."
          />
          {errors.CariTitle && <p className="text-xs text-red-600">{errors.CariTitle}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Konu *</label>
          <input
            type="text"
            value={formData.Subject}
            onChange={(e) => handleChange('Subject', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Bakım talebi"
          />
          {errors.Subject && <p className="text-xs text-red-600">{errors.Subject}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Tip</label>
          <select
            value={formData.Type}
            onChange={(e) => handleChange('Type', e.target.value as WorkOrderType)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="HIZMET">HIZMET</option>
            <option value="MOTORBOT">MOTORBOT</option>
            <option value="BARINMA">BARINMA</option>
            <option value="DIGER">DIGER</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Öncelik</label>
          <select
            value={formData.Priority}
            onChange={(e) => handleChange('Priority', e.target.value as WorkOrderPriority)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Planlanan Başlangıç</label>
          <input
            type="datetime-local"
            value={formData.PlannedStart || ''}
            onChange={(e) => handleChange('PlannedStart', e.target.value || undefined)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Planlanan Bitiş</label>
          <input
            type="datetime-local"
            value={formData.PlannedEnd || ''}
            onChange={(e) => handleChange('PlannedEnd', e.target.value || undefined)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.PlannedEnd && <p className="text-xs text-red-600">{errors.PlannedEnd}</p>}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Kapı Gerekli mi?</label>
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              checked={formData.GateRequired}
              onChange={(e) => handleChange('GateRequired', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Saha Kaydı Yetkisi</label>
          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              checked={formData.SahaKayitYetkisi}
              onChange={(e) => handleChange('SahaKayitYetkisi', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Açıklama</label>
        <textarea
          rows={3}
          value={formData.Description || ''}
          onChange={(e) => handleChange('Description', e.target.value || undefined)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Detaylı açıklama"
        />
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
          disabled={isCreating}
          className="px-5 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isCreating ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
}
