/**
 * SECURITY TABLET UI
 * Güvenlik Tablet Arayüzü - Giriş/Çıkış Kontrol Paneli
 * 
 * Özellikler:
 *  - Araç giriş/çıkış kaydı (4 saat kuralı otomatik hesaplama)
 *  - Kişi listesi güvenlik onayı (TC Kimlik/Pasaport kontrol)
 *  - Kimlik belgesi fotoğraf yükleme (kamera entegrasyonu)
 *  - Toplu kişi onayı (bulk approval)
 *  - Aktif araçlar listesi (henüz çıkış yapmamış)
 *  - Onay bekleyen kişiler listesi
 *  - Tablet-optimized büyük dokunmatik butonlar
 * 
 * Backend endpoints:
 *  - POST /api/gatelog/vehicle/entry
 *  - POST /api/gatelog/vehicle/exit
 *  - GET /api/gatelog/vehicle/active
 *  - GET /api/gatelog/pending-persons
 *  - POST /api/gatelog/person/identity-upload
 *  - POST /api/gatelog/person/bulk-approval
 */

import { useState, useMemo, useRef } from 'react';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import type { VehicleEntryRequest, VehicleExitRequest, ActiveVehicle, PendingPerson } from '../types/security.types';
import { useActiveVehicles, usePendingPersons, useSecurityMutations } from '../hooks/useSecurity';
import {
  TruckIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type TabType = 'vehicle-entry' | 'vehicle-exit' | 'person-approval' | 'active-vehicles';

export function SecurityTabletUI() {
  const [activeTab, setActiveTab] = useState<TabType>('vehicle-entry');
  const [selectedPersons, setSelectedPersons] = useState<number[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedPersonForPhoto, setSelectedPersonForPhoto] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { vehicles, isLoading: isLoadingVehicles, error: errorVehicles, refetch: refetchVehicles } = useActiveVehicles();
  const { persons, isLoading: isLoadingPersons, error: errorPersons, refetch: refetchPersons } = usePendingPersons();
  const {
    recordVehicleEntry,
    recordVehicleExit,
    uploadIdentity,
    bulkApprove,
    isRecordingEntry,
    isRecordingExit,
    isUploadingIdentity,
    isApprovingBulk,
  } = useSecurityMutations();

  // Vehicle Entry Form
  const [entryForm, setEntryForm] = useState<VehicleEntryRequest>({
    work_order_id: 0,
    vehicle_plate: '',
    vehicle_type: '',
    driver_name: '',
    notes: '',
  });

  // Vehicle Exit Form
  const [exitForm, setExitForm] = useState<VehicleExitRequest>({
    work_order_id: 0,
    vehicle_plate: '',
  });

  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({});
  const [exitErrors, setExitErrors] = useState<Record<string, string>>({});

  // Validate Vehicle Entry
  const validateEntry = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!entryForm.work_order_id || entryForm.work_order_id <= 0) {
      errors.work_order_id = 'İş emri ID zorunludur';
    }
    
    if (!entryForm.vehicle_plate || entryForm.vehicle_plate.length < 3) {
      errors.vehicle_plate = 'Plaka en az 3 karakter olmalıdır';
    }
    
    setEntryErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Vehicle Exit
  const validateExit = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!exitForm.work_order_id || exitForm.work_order_id <= 0) {
      errors.work_order_id = 'İş emri ID zorunludur';
    }
    
    if (!exitForm.vehicle_plate || exitForm.vehicle_plate.length < 3) {
      errors.vehicle_plate = 'Plaka zorunludur';
    }
    
    setExitErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Vehicle Entry Submit
  const handleVehicleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEntry()) return;
    
    const success = await recordVehicleEntry(entryForm);
    if (success) {
      // Reset form
      setEntryForm({
        work_order_id: 0,
        vehicle_plate: '',
        vehicle_type: '',
        driver_name: '',
        notes: '',
      });
      setEntryErrors({});
      refetchVehicles();
    }
  };

  // Handle Vehicle Exit Submit
  const handleVehicleExit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateExit()) return;
    
    const result = await recordVehicleExit(exitForm);
    if (result) {
      // Show exit details
      alert(
        `Araç Çıkış Kaydı:\n\n` +
        `Plaka: ${exitForm.vehicle_plate}\n` +
        `Süre: ${result.duration_minutes} dakika\n` +
        `Baz Ücret: ${result.base_charge_hours} saat\n` +
        `Ek Dakika: ${result.extra_minutes || 0} dakika\n` +
        `Ek Ücret: ${result.extra_charge_calculated ? '$' + result.extra_charge_calculated.toFixed(2) : 'Yok'}\n` +
        `${result.is_over_base_hours ? '\n⚠️ 4 Saat Kuralı Uygulandı' : ''}`
      );
      
      // Reset form
      setExitForm({
        work_order_id: 0,
        vehicle_plate: '',
      });
      setExitErrors({});
      refetchVehicles();
    }
  };

  // Handle Person Selection
  const togglePersonSelection = (personId: number) => {
    setSelectedPersons(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  // Handle Bulk Approval
  const handleBulkApproval = async (approved: boolean) => {
    if (selectedPersons.length === 0) {
      alert('Lütfen en az bir kişi seçin');
      return;
    }
    
    const confirmMsg = approved
      ? `${selectedPersons.length} kişiyi ONAYLAMAK istediğinizden emin misiniz?`
      : `${selectedPersons.length} kişiyi REDDETMEKistediğinizden emin misiniz?`;
    
    if (!confirm(confirmMsg)) return;
    
    const success = await bulkApprove({
      person_ids: selectedPersons,
      approved,
      notes: approved ? 'Güvenlik onayı verildi' : 'Güvenlik onayı reddedildi',
    });
    
    if (success) {
      setSelectedPersons([]);
      refetchPersons();
    }
  };

  // Handle Photo Upload
  const handlePhotoUpload = async (personId: number, file: File) => {
    // Simulate photo upload (in production, upload to S3 or backend storage)
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      
      const success = await uploadIdentity({
        work_order_person_id: personId,
        identity_document_url: base64, // In production, this would be S3 URL
        notes: `Kimlik belgesi yüklendi - ${new Date().toISOString()}`,
      });
      
      if (success) {
        setSelectedPersonForPhoto(null);
        setShowCamera(false);
        refetchPersons();
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Camera Trigger
  const handleCameraClick = (personId: number) => {
    setSelectedPersonForPhoto(personId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPersonForPhoto) {
      handlePhotoUpload(selectedPersonForPhoto, file);
    }
  };

  // Auto-fill exit form from active vehicles
  const handleSelectActiveVehicle = (vehicle: ActiveVehicle) => {
    setExitForm({
      work_order_id: vehicle.WorkOrderId,
      vehicle_plate: vehicle.VehiclePlate,
    });
    setActiveTab('vehicle-exit');
  };

  // Statistics
  const stats = useMemo(() => {
    const activeVehicleCount = vehicles.length;
    const pendingPersonCount = persons.length;
    const selectedCount = selectedPersons.length;
    
    return { activeVehicleCount, pendingPersonCount, selectedCount };
  }, [vehicles, persons, selectedPersons]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white p-4 rounded-full">
              <DocumentCheckIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Güvenlik Kontrol Paneli</h1>
              <p className="text-gray-600">Araç ve Kişi Giriş/Çıkış Yönetimi</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{stats.activeVehicleCount}</div>
              <div className="text-sm text-gray-500">Aktif Araç</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingPersonCount}</div>
              <div className="text-sm text-gray-500">Bekleyen Kişi</div>
            </div>
            {selectedPersons.length > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.selectedCount}</div>
                <div className="text-sm text-gray-500">Seçili</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('vehicle-entry')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-lg font-semibold transition-colors ${
              activeTab === 'vehicle-entry'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowRightOnRectangleIcon className="w-8 h-8" />
            Araç Giriş
          </button>
          
          <button
            onClick={() => setActiveTab('vehicle-exit')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-lg font-semibold transition-colors ${
              activeTab === 'vehicle-exit'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowLeftOnRectangleIcon className="w-8 h-8" />
            Araç Çıkış
          </button>
          
          <button
            onClick={() => setActiveTab('person-approval')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-lg font-semibold transition-colors ${
              activeTab === 'person-approval'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <UserCircleIcon className="w-8 h-8" />
            Kişi Onayı ({stats.pendingPersonCount})
          </button>
          
          <button
            onClick={() => setActiveTab('active-vehicles')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-lg font-semibold transition-colors ${
              activeTab === 'active-vehicles'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TruckIcon className="w-8 h-8" />
            Aktif Araçlar ({stats.activeVehicleCount})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Vehicle Entry Tab */}
        {activeTab === 'vehicle-entry' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ArrowRightOnRectangleIcon className="w-8 h-8 text-green-600" />
              Araç Giriş Kaydı
            </h2>
            
            <form onSubmit={handleVehicleEntry} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">İş Emri ID *</label>
                  <input
                    type="number"
                    value={entryForm.work_order_id || ''}
                    onChange={(e) => {
                      setEntryForm(prev => ({ ...prev, work_order_id: parseInt(e.target.value) || 0 }));
                      setEntryErrors(prev => ({ ...prev, work_order_id: '' }));
                    }}
                    className={`w-full px-4 py-4 text-xl border-2 rounded-lg ${
                      entryErrors.work_order_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Örn: 123"
                  />
                  {entryErrors.work_order_id && (
                    <p className="text-red-500 text-sm mt-1">{entryErrors.work_order_id}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">Araç Plakası *</label>
                  <input
                    type="text"
                    value={entryForm.vehicle_plate}
                    onChange={(e) => {
                      setEntryForm(prev => ({ ...prev, vehicle_plate: e.target.value.toUpperCase() }));
                      setEntryErrors(prev => ({ ...prev, vehicle_plate: '' }));
                    }}
                    className={`w-full px-4 py-4 text-xl border-2 rounded-lg ${
                      entryErrors.vehicle_plate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Örn: 34ABC123"
                  />
                  {entryErrors.vehicle_plate && (
                    <p className="text-red-500 text-sm mt-1">{entryErrors.vehicle_plate}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">Araç Tipi</label>
                  <select
                    value={entryForm.vehicle_type}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, vehicle_type: e.target.value }))}
                    className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-lg"
                  >
                    <option value="">Seçiniz</option>
                    <option value="KAMYON">Kamyon</option>
                    <option value="KAMYONET">Kamyonet</option>
                    <option value="OTOBUS">Otobüs</option>
                    <option value="MINIBUS">Minibüs</option>
                    <option value="ARAZI">Arazi Aracı</option>
                    <option value="BINEK">Binek Araç</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">Sürücü Adı</label>
                  <input
                    type="text"
                    value={entryForm.driver_name}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, driver_name: e.target.value }))}
                    className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-lg"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Notlar</label>
                <textarea
                  value={entryForm.notes}
                  onChange={(e) => setEntryForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-4 text-xl border-2 border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Giriş ile ilgili notlar..."
                />
              </div>
              
              <button
                type="submit"
                disabled={isRecordingEntry}
                className="w-full bg-green-600 text-white px-8 py-6 text-2xl font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
              >
                {isRecordingEntry ? (
                  <>
                    <Loader message="" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <ArrowRightOnRectangleIcon className="w-10 h-10" />
                    Giriş Kaydı Oluştur
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Vehicle Exit Tab */}
        {activeTab === 'vehicle-exit' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ArrowLeftOnRectangleIcon className="w-8 h-8 text-red-600" />
              Araç Çıkış Kaydı (4 Saat Kuralı)
            </h2>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-lg font-semibold text-yellow-800">4 Saat Kuralı Bilgisi</p>
                <p className="text-yellow-700">
                  İlk 4 saat baz ücret, sonraki her dakika için ek ücret hesaplanır. 
                  Çıkış kaydı oluşturulduğunda süre ve ücret otomatik hesaplanacaktır.
                </p>
              </div>
            </div>
            
            <form onSubmit={handleVehicleExit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">İş Emri ID *</label>
                  <input
                    type="number"
                    value={exitForm.work_order_id || ''}
                    onChange={(e) => {
                      setExitForm(prev => ({ ...prev, work_order_id: parseInt(e.target.value) || 0 }));
                      setExitErrors(prev => ({ ...prev, work_order_id: '' }));
                    }}
                    className={`w-full px-4 py-4 text-xl border-2 rounded-lg ${
                      exitErrors.work_order_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Örn: 123"
                  />
                  {exitErrors.work_order_id && (
                    <p className="text-red-500 text-sm mt-1">{exitErrors.work_order_id}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">Araç Plakası *</label>
                  <input
                    type="text"
                    value={exitForm.vehicle_plate}
                    onChange={(e) => {
                      setExitForm(prev => ({ ...prev, vehicle_plate: e.target.value.toUpperCase() }));
                      setExitErrors(prev => ({ ...prev, vehicle_plate: '' }));
                    }}
                    className={`w-full px-4 py-4 text-xl border-2 rounded-lg ${
                      exitErrors.vehicle_plate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Örn: 34ABC123"
                  />
                  {exitErrors.vehicle_plate && (
                    <p className="text-red-500 text-sm mt-1">{exitErrors.vehicle_plate}</p>
                  )}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isRecordingExit}
                className="w-full bg-red-600 text-white px-8 py-6 text-2xl font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
              >
                {isRecordingExit ? (
                  <>
                    <Loader message="" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <ArrowLeftOnRectangleIcon className="w-10 h-10" />
                    Çıkış Kaydı Oluştur ve Hesapla
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Person Approval Tab */}
        {activeTab === 'person-approval' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <UserCircleIcon className="w-8 h-8 text-blue-600" />
                Kişi Güvenlik Onayı ({persons.length})
              </h2>
              
              {selectedPersons.length > 0 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBulkApproval(true)}
                    disabled={isApprovingBulk}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-semibold flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-6 h-6" />
                    Toplu Onayla ({selectedPersons.length})
                  </button>
                  <button
                    onClick={() => handleBulkApproval(false)}
                    disabled={isApprovingBulk}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-lg font-semibold flex items-center gap-2"
                  >
                    <XCircleIcon className="w-6 h-6" />
                    Toplu Reddet ({selectedPersons.length})
                  </button>
                </div>
              )}
            </div>
            
            {isLoadingPersons ? (
              <Loader message="Kişi listesi yükleniyor..." />
            ) : errorPersons ? (
              <ErrorMessage message={errorPersons} />
            ) : persons.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
                <CheckCircleIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">Onay bekleyen kişi bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-4">
                {persons.map((person) => (
                  <div
                    key={person.Id}
                    className={`border-2 rounded-lg p-6 transition-colors ${
                      selectedPersons.includes(person.Id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <input
                        type="checkbox"
                        checked={selectedPersons.includes(person.Id)}
                        onChange={() => togglePersonSelection(person.Id)}
                        className="w-8 h-8 text-blue-600 rounded cursor-pointer"
                      />
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Ad Soyad</p>
                          <p className="text-xl font-semibold text-gray-900">{person.FullName}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Kimlik</p>
                          <p className="text-lg text-gray-700 font-mono">
                            {person.TcKimlikNo || person.PassportNo || '-'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">İş Emri</p>
                          <p className="text-lg text-gray-700 font-semibold">{person.WONumber}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Uyruk</p>
                          <p className="text-lg text-gray-700">{person.Nationality || '-'}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleCameraClick(person.Id)}
                        disabled={isUploadingIdentity}
                        className="p-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        title="Kimlik fotoğrafı yükle"
                      >
                        <CameraIcon className="w-8 h-8" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Hidden file input for camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Active Vehicles Tab */}
        {activeTab === 'active-vehicles' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <TruckIcon className="w-8 h-8 text-purple-600" />
              Aktif Araçlar ({vehicles.length})
            </h2>
            
            {isLoadingVehicles ? (
              <Loader message="Aktif araçlar yükleniyor..." />
            ) : errorVehicles ? (
              <ErrorMessage message={errorVehicles} />
            ) : vehicles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
                <TruckIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500">Aktif araç bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.Id}
                    className="border-2 border-gray-200 rounded-lg p-6 bg-white hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Plaka</p>
                          <p className="text-2xl font-bold text-gray-900">{vehicle.VehiclePlate}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Araç Tipi</p>
                          <p className="text-lg text-gray-700">{vehicle.VehicleType || '-'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Sürücü</p>
                          <p className="text-lg text-gray-700">{vehicle.DriverName || '-'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Giriş Zamanı</p>
                          <p className="text-lg text-gray-700 font-mono">
                            {new Date(vehicle.EntryTime).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Geçen Süre</p>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-6 h-6 text-indigo-600" />
                            <p className="text-lg font-semibold text-indigo-600">
                              {vehicle.DurationMinutes ? `${vehicle.DurationMinutes} dk` : 'Hesaplanıyor...'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleSelectActiveVehicle(vehicle)}
                        className="ml-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-lg font-semibold flex items-center gap-2"
                      >
                        <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
