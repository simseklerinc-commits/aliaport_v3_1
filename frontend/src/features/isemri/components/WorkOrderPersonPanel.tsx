/**
 * WORK ORDER PERSON PANEL
 * İş Emri Kişi Listesi Yönetim Paneli
 * 
 * Özellikler:
 *  - İş emrine bağlı kişi listesi görüntüleme
 *  - Yeni kişi ekleme (TC Kimlik / Pasaport)
 *  - Kimlik bilgileri düzenleme
 *  - Güvenlik onay durumu görüntüleme
 *  - Giriş/çıkış zamanları takibi
 *  - TC Kimlik doğrulama (11 haneli sayısal)
 *  - Pasaport numarası doğrulama
 *  - Kişi silme (sadece güvenlik onayı verilmemişse)
 * 
 * Backend endpoints:
 *  - GET /api/work-order-person/wo/{work_order_id}
 *  - POST /api/work-order-person
 *  - PUT /api/work-order-person/{person_id}
 *  - DELETE /api/work-order-person/{person_id}
 */

import { useState, useMemo } from 'react';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import type { WorkOrderPerson, WorkOrderPersonCreate } from '../types/workOrderPerson.types';
import { useWorkOrderPersonsByWO, useWorkOrderPersonMutations } from '../hooks/useWorkOrderPerson';
import { UserCircleIcon, CheckCircleIcon, XCircleIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface WorkOrderPersonPanelProps {
  workOrderId: number;
  woNumber?: string;
  readOnly?: boolean;
  onPersonClick?: (person: WorkOrderPerson) => void;
}

export function WorkOrderPersonPanel({ 
  workOrderId, 
  woNumber,
  readOnly = false,
  onPersonClick,
}: WorkOrderPersonPanelProps) {
  const { persons, isLoading, error, refetch } = useWorkOrderPersonsByWO(workOrderId);
  const { createPerson, updatePerson, deletePerson, isCreating, isDeleting } = useWorkOrderPersonMutations();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<WorkOrderPersonCreate>({
    WorkOrderId: workOrderId,
    FullName: '',
    TcKimlikNo: '',
    PassportNo: '',
    Nationality: '',
    Phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate TC Kimlik (11 digit numeric)
  const validateTcKimlik = (tc: string): boolean => {
    if (!tc) return true; // Optional
    if (!/^\d{11}$/.test(tc)) return false;
    
    const digits = tc.split('').map(Number);
    const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7;
    const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
    const check10 = (sum1 - sum2) % 10;
    if (check10 !== digits[9]) return false;
    
    const sum11 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    return sum11 % 10 === digits[10];
  };

  // Validate Passport (alphanumeric, 6-15 chars)
  const validatePassport = (passport: string): boolean => {
    if (!passport) return true; // Optional
    return /^[A-Z0-9]{6,15}$/i.test(passport);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.FullName || formData.FullName.length < 3) {
      newErrors.FullName = 'Ad Soyad en az 3 karakter olmalıdır';
    }
    
    if (!formData.TcKimlikNo && !formData.PassportNo) {
      newErrors.TcKimlikNo = 'TC Kimlik veya Pasaport numarası zorunludur';
      newErrors.PassportNo = 'TC Kimlik veya Pasaport numarası zorunludur';
    }
    
    if (formData.TcKimlikNo && !validateTcKimlik(formData.TcKimlikNo)) {
      newErrors.TcKimlikNo = 'Geçersiz TC Kimlik numarası (11 haneli sayısal)';
    }
    
    if (formData.PassportNo && !validatePassport(formData.PassportNo)) {
      newErrors.PassportNo = 'Geçersiz pasaport numarası (6-15 karakter, alfanumerik)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof WorkOrderPersonCreate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    if (editingId) {
      // Update existing person
      const success = await updatePerson(editingId, {
        FullName: formData.FullName,
        TcKimlikNo: formData.TcKimlikNo || undefined,
        PassportNo: formData.PassportNo || undefined,
        Nationality: formData.Nationality || undefined,
        Phone: formData.Phone || undefined,
      });
      
      if (success) {
        setEditingId(null);
        setShowAddForm(false);
        resetForm();
        refetch();
      }
    } else {
      // Create new person
      const success = await createPerson(formData);
      if (success) {
        setShowAddForm(false);
        resetForm();
        refetch();
      }
    }
  };

  const handleEdit = (person: WorkOrderPerson) => {
    setEditingId(person.Id);
    setFormData({
      WorkOrderId: workOrderId,
      FullName: person.FullName,
      TcKimlikNo: person.TcKimlikNo || '',
      PassportNo: person.PassportNo || '',
      Nationality: person.Nationality || '',
      Phone: person.Phone || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (personId: number) => {
    if (!confirm('Bu kişiyi silmek istediğinizden emin misiniz?')) return;
    
    const success = await deletePerson(personId);
    if (success) {
      refetch();
    }
  };

  const resetForm = () => {
    setFormData({
      WorkOrderId: workOrderId,
      FullName: '',
      TcKimlikNo: '',
      PassportNo: '',
      Nationality: '',
      Phone: '',
    });
    setErrors({});
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    resetForm();
  };

  // Statistics
  const stats = useMemo(() => {
    const total = persons.length;
    const approved = persons.filter(p => p.ApprovedBySecurity).length;
    const pending = total - approved;
    const withEntry = persons.filter(p => p.GateEntryTime).length;
    const withExit = persons.filter(p => p.GateExitTime).length;
    
    return { total, approved, pending, withEntry, withExit };
  }, [persons]);

  if (isLoading) return <Loader message="Kişi listesi yükleniyor..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      {/* Header + Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            İş Emri Kişi Listesi {woNumber && `(${woNumber})`}
          </h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">Toplam: <strong>{stats.total}</strong></span>
            <span className="text-green-600">Onaylı: <strong>{stats.approved}</strong></span>
            <span className="text-yellow-600">Bekliyor: <strong>{stats.pending}</strong></span>
            <span className="text-blue-600">Giriş: <strong>{stats.withEntry}</strong></span>
            <span className="text-purple-600">Çıkış: <strong>{stats.withExit}</strong></span>
          </div>
        </div>
        
        {!readOnly && (
          <button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            + Kişi Ekle
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-gray-900">
            {editingId ? 'Kişi Düzenle' : 'Yeni Kişi Ekle'}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
              <input
                type="text"
                value={formData.FullName}
                onChange={(e) => handleChange('FullName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.FullName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Örn: Ahmet Yılmaz"
              />
              {errors.FullName && <p className="text-red-500 text-xs mt-1">{errors.FullName}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
              <input
                type="text"
                value={formData.TcKimlikNo}
                onChange={(e) => handleChange('TcKimlikNo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg ${errors.TcKimlikNo ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="11 haneli TC Kimlik"
                maxLength={11}
              />
              {errors.TcKimlikNo && <p className="text-red-500 text-xs mt-1">{errors.TcKimlikNo}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pasaport No</label>
              <input
                type="text"
                value={formData.PassportNo}
                onChange={(e) => handleChange('PassportNo', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg ${errors.PassportNo ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Pasaport numarası"
                maxLength={15}
              />
              {errors.PassportNo && <p className="text-red-500 text-xs mt-1">{errors.PassportNo}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Uyruk</label>
              <input
                type="text"
                value={formData.Nationality}
                onChange={(e) => handleChange('Nationality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Örn: TC, USA, GBR"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input
                type="text"
                value={formData.Phone}
                onChange={(e) => handleChange('Phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="+90 555 123 4567"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      )}

      {/* Person List Table */}
      {persons.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Henüz kişi eklenmemiş</p>
          {!readOnly && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              İlk kişiyi ekleyin
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TC Kimlik</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pasaport</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uyruk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Güvenlik Onayı</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giriş</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çıkış</th>
                {!readOnly && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlem</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {persons.map((person) => (
                <tr
                  key={person.Id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onPersonClick?.(person)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{person.FullName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {person.TcKimlikNo ? (
                      <span className="font-mono">{person.TcKimlikNo}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {person.PassportNo ? (
                      <span className="font-mono">{person.PassportNo}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{person.Nationality || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{person.Phone || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {person.ApprovedBySecurity ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span className="text-xs">{person.ApprovedBySecurityName || 'Onaylı'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <XCircleIcon className="w-5 h-5" />
                        <span className="text-xs">Bekliyor</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {person.GateEntryTime ? (
                      <span className="text-xs font-mono">
                        {new Date(person.GateEntryTime).toLocaleString('tr-TR')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {person.GateExitTime ? (
                      <span className="text-xs font-mono">
                        {new Date(person.GateExitTime).toLocaleString('tr-TR')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  {!readOnly && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(person)}
                          disabled={person.ApprovedBySecurity}
                          className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={person.ApprovedBySecurity ? 'Onaylı kişiler düzenlenemez' : 'Düzenle'}
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(person.Id)}
                          disabled={person.ApprovedBySecurity || isDeleting}
                          className="p-1 text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={person.ApprovedBySecurity ? 'Onaylı kişiler silinemez' : 'Sil'}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
