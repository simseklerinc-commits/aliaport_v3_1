// frontend/src/features/portal/components/WorkOrderRequestForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePortalAuth } from '../context/PortalAuthContext';
import { portalWorkOrderService, type Hizmet, type PortalApiError } from '../services/portalWorkOrderService';
import { portalTokenStorage } from '../utils/portalTokenStorage';
import { toast } from 'sonner';
import { 
  FileText, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Upload,
  X,
  ChevronDown
} from 'lucide-react';

const schema = z.object({
  subject: z.string().min(3, 'Konu en az 3 karakter olmalıdır').max(120, 'Konu en fazla 120 karakter olabilir'),
  description: z.string().optional(),
  planned_start: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  gate_required: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export const WorkOrderRequestForm: React.FC = () => {
  const { user } = usePortalAuth();
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [isLoadingHizmetler, setIsLoadingHizmetler] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<{
    message: string;
    invalidEmployeeIds?: number[];
    period?: string;
  } | null>(null);
  
  // Çoklu seçim
  const [selectedServiceCodes, setSelectedServiceCodes] = useState<string[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  
  // Employee & Vehicle state
  const [employees, setEmployees] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const [isHizmetAccordionOpen, setIsHizmetAccordionOpen] = useState(false);
  const [isEmployeeAccordionOpen, setIsEmployeeAccordionOpen] = useState(false);
  const [isVehicleAccordionOpen, setIsVehicleAccordionOpen] = useState(false);

  const [hizmetSearchTerm, setHizmetSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');

  const hizmetAccordionRef = useRef<HTMLDivElement | null>(null);
  const employeeAccordionRef = useRef<HTMLDivElement | null>(null);
  const vehicleAccordionRef = useRef<HTMLDivElement | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'MEDIUM',
      gate_required: false,
    },
  });

  useEffect(() => {
    loadHizmetler();
    loadEmployees();
    loadVehicles();
  }, []);

  const loadHizmetler = async () => {
    try {
      console.log('🔄 Hizmetler yükleniyor...');
      const data = await portalWorkOrderService.getHizmetler();
      console.log('✅ Hizmetler yüklendi:', data);
      setHizmetler(data);
    } catch (error: any) {
      console.error('❌ Hizmet yükleme hatası:', error);
      toast.error('Hizmet listesi yüklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setIsLoadingHizmetler(false);
    }
  };
  
  const loadEmployees = async () => {
    try {
      const token = portalTokenStorage.getToken();
      const response = await fetch('http://localhost:8000/api/v1/portal/employees', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Çalışan listesi yüklenemedi');
      const data = await response.json();
      setEmployees(data);
    } catch (error: any) {
      toast.error('Çalışan listesi yüklenemedi');
      console.error(error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };
  
  const loadVehicles = async () => {
    try {
      const token = portalTokenStorage.getToken();
      const response = await fetch('http://localhost:8000/api/v1/portal/vehicles', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Araç listesi yüklenemedi');
      const data = await response.json();
      setVehicles(data);
    } catch (error: any) {
      toast.error('Araç listesi yüklenemedi');
      console.error(error);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isHizmetAccordionOpen &&
        hizmetAccordionRef.current &&
        !hizmetAccordionRef.current.contains(target)
      ) {
        setIsHizmetAccordionOpen(false);
      }
      if (
        isEmployeeAccordionOpen &&
        employeeAccordionRef.current &&
        !employeeAccordionRef.current.contains(target)
      ) {
        setIsEmployeeAccordionOpen(false);
      }
      if (
        isVehicleAccordionOpen &&
        vehicleAccordionRef.current &&
        !vehicleAccordionRef.current.contains(target)
      ) {
        setIsVehicleAccordionOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [
    isHizmetAccordionOpen,
    isEmployeeAccordionOpen,
    isVehicleAccordionOpen
  ]);

  const handleServiceToggle = (code: string) => {
    setSelectedServiceCodes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  };

  const isEmployeeSgkCompliant = (emp: any) => {
    if (emp.sgk_status) {
      return emp.sgk_status === 'TAM';
    }
    return Boolean(emp.sgk_is_active_last_period);
  };

  const isDriverPosition = (position?: string | null) => {
    if (!position) return false;
    const p = position.toLowerCase();
    return p.includes('şoför') || p.includes('sofor') || p.includes('driver');
  };

  const checkEmployeeDocumentValid = (
    emp: any,
    documentType: string,
    options?: { label?: string }
  ): { ok: boolean; reason?: string } => {
    const docs = emp.documents || [];
    const doc = docs.find((d: any) => d.document_type === documentType);

    const label = options?.label || documentType;

    if (!doc) {
      return { ok: false, reason: `${label} belgesi yüklenme miş.` };
    }

    if (doc.expires_at) {
      const expiry = new Date(doc.expires_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiry < today) {
        return { ok: false, reason: `${label} belgesinin geçerlilik süresi dolmuş.` };
      }
    }

    return { ok: true };
  };

  const handleEmployeeToggle = (id: number) => {
    const isAlreadySelected = selectedEmployeeIds.includes(id);

    // Seçili olanı kaldırmaya izin ver (her zaman serbest)
    if (isAlreadySelected) {
      setSelectedEmployeeIds((prev) => prev.filter((item) => item !== id));
      return;
    }

    const emp = employees.find((e) => e.id === id);
    if (!emp) {
      return;
    }

    // 1) SGK uygun değilse seçim yasak
    if (!isEmployeeSgkCompliant(emp)) {
      toast.error('SGK durumu uygun olmayan çalışan iş emrine atanamaz.');
      return;
    }

    // 2) Pozisyon boş ise seçim yasak
    if (!emp.position || !String(emp.position).trim()) {
      toast.error('Pozisyon tanımlanmamış çalışan iş emrine atanamaz.');
      return;
    }

    // 3) Şoför ise ehliyet + SRC5 kontrolü
    if (isDriverPosition(emp.position)) {
      const licenseCheck = checkEmployeeDocumentValid(emp, 'EHLIYET', { label: 'Ehliyet' });
      if (!licenseCheck.ok) {
        toast.error(licenseCheck.reason || 'Şoför için geçerli ehliyet belgesi bulunmuyor.');
        return;
      }

      const srcCheck = checkEmployeeDocumentValid(emp, 'SRC5', { label: 'SRC belgesi' });
      if (!srcCheck.ok) {
        toast.error(srcCheck.reason || 'Şoför için geçerli SRC belgesi bulunmuyor.');
        return;
      }
    }

    // Tüm kontrollerden geçtiyse seçime izin ver
    setSelectedEmployeeIds((prev) => [...prev, id]);
  };

  const handleVehicleToggle = (id: number) => {
    const isAlreadySelected = selectedVehicleIds.includes(id);

    // Seçili olanı kaldırmaya izin ver (her zaman serbest)
    if (isAlreadySelected) {
      setSelectedVehicleIds((prev) => prev.filter((item) => item !== id));
      return;
    }

    const veh = vehicles.find((v) => v.id === id);
    if (!veh) {
      return;
    }

    // Sadece EKSİK_EVRAK durumunda engelle
    if (veh.vehicle_status === 'EKSİK_EVRAK') {
      toast.error('Eksik veya süresi dolmuş evrakı olan araç iş emrine atanamaz. Lütfen araç evraklarını güncelleyin.');
      return;
    }

    setSelectedVehicleIds((prev) => [...prev, id]);
  };

  const filteredHizmetler = hizmetler.filter((hizmet) => {
    const search = hizmetSearchTerm.trim().toLowerCase();
    if (!search) return true;
    return (
      hizmet.kod?.toLowerCase().includes(search) ||
      hizmet.ad?.toLowerCase().includes(search) ||
      hizmet.aciklama?.toLowerCase().includes(search)
    );
  });

  const filteredEmployees = employees.filter((emp) => {
    const search = employeeSearchTerm.trim().toLowerCase();
    if (!search) return true;
    return (
      emp.full_name?.toLowerCase().includes(search) ||
      emp.tc_kimlik?.toLowerCase().includes(search) ||
      emp.pasaport?.toLowerCase().includes(search)
    );
  });

  const filteredVehicles = vehicles.filter((veh) => {
    const search = vehicleSearchTerm.trim().toLowerCase();
    if (!search) return true;
    return (
      veh.plaka?.toLowerCase().includes(search) ||
      veh.marka?.toLowerCase().includes(search) ||
      veh.model?.toLowerCase().includes(search) ||
      veh.tip?.toLowerCase().includes(search)
    );
  });

  const formatSgkPeriod = (value?: string) => {
    if (!value || value.length !== 6) return value;
    return `${value.slice(0, 4)}-${value.slice(4, 6)}`;
  };

  const invalidEmployeeIds = formError?.invalidEmployeeIds ?? [];
  const invalidEmployees = invalidEmployeeIds.length
    ? employees.filter((emp) => invalidEmployeeIds.includes(emp.id))
    : [];

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('Oturum bulunamadı');
      return;
    }

    if (selectedServiceCodes.length === 0) {
      toast.error('En az bir aktivite seçmelisiniz');
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);
    setFormError(null);

    try {
      const workOrderData = {
        CariId: user.cari_id,
        CariCode: user.cari_code || '',
        CariTitle: user.cari_unvan || '',
        Type: 'HIZMET',
        ServiceCode: selectedServiceCodes[0] || '', // İlk aktivite ana kod olarak
        Subject: values.subject,
        Description: values.description,
        Priority: values.priority,
        PlannedStart: values.planned_start,
        GateRequired: values.gate_required,
        SahaKayitYetkisi: true,
        EmployeeIds: selectedEmployeeIds,
        VehicleIds: selectedVehicleIds,
        ServiceCodes: selectedServiceCodes, // Tüm seçilen hizmetler (backend'de item oluşturması için)
      };

      await portalWorkOrderService.createWorkOrder(workOrderData);

      toast.success('İş emri talebi başarıyla oluşturuldu');
      setSubmitSuccess(true);
      reset();
      setSelectedServiceCodes([]);
      setSelectedEmployeeIds([]);
      setSelectedVehicleIds([]);
      setFormError(null);
      
      // 3 saniye sonra talep takip ekranına yönlendir
      setTimeout(() => {
        window.location.hash = 'work-orders';
      }, 2000);
    } catch (error: any) {
      const apiError = error as PortalApiError;
      const details = (apiError?.details && typeof apiError.details === 'object') ? apiError.details as Record<string, any> : undefined;
      setFormError({
        message: apiError?.message || 'Talep oluşturulamadı',
        invalidEmployeeIds: Array.isArray(details?.invalid_employee_ids) ? details?.invalid_employee_ids : undefined,
        period: typeof details?.period === 'string' ? details.period : undefined,
      });
      toast.error(apiError?.message || 'Talep oluşturulamadı');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Talep Oluşturuldu!</h2>
            <p className="text-gray-600 mb-6">
              İş emri talebiniz başarıyla kaydedildi. Kısa süre içinde değerlendirilecektir.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.hash = 'work-orders'}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Taleplerime Git
              </button>
              <button
                onClick={() => setSubmitSuccess(false)}
                className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Yeni Talep Oluştur
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Yeni İş Emri Talebi</h1>
          <p className="text-gray-600">
            Lütfen talep etmek istediğiniz hizmeti seçin ve detayları doldurun.
          </p>
        </div>

        {/* Cari Bilgisi (Read-only) */}
        {user && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 mb-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100 mb-1">Talep Eden Firma</p>
                <p className="text-xl font-semibold text-white">{user.cari_unvan || 'Firma Bilgisi Yok'}</p>
                {user.cari_code && (
                  <p className="text-sm text-blue-100">Cari Kodu: {user.cari_code}</p>
                )}
                <p className="text-sm text-blue-100 mt-1">Talep Eden: {user.full_name}</p>
              </div>
            </div>
          </div>
        )}

        {formError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Talep gönderilemedi</p>
                <p>{formError.message}</p>
                {formError.period && (
                  <p className="mt-2 text-xs text-red-700">
                    Eksik dönem: {formatSgkPeriod(formError.period)}
                  </p>
                )}
                {invalidEmployees.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold">SGK listesinde bulunamayan çalışanlar:</p>
                    <ul className="mt-1 list-disc pl-5 text-xs">
                      {invalidEmployees.map((emp) => (
                        <li key={emp.id}>{emp.full_name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
          {/* Hizmet Kartları - Accordion */}
          <div ref={hizmetAccordionRef} className="border-2 border-blue-200 rounded-xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setIsHizmetAccordionOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-5 py-4 text-left bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all"
            >
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Hizmet Kartları <span className="text-red-500">★</span>
                </p>
                <p className="text-xs text-blue-700">Seçilen: {selectedServiceCodes.length} hizmet</p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-blue-600 transition-transform ${isHizmetAccordionOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isHizmetAccordionOpen && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                {isLoadingHizmetler ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Hizmetler yükleniyor...</span>
                  </div>
                ) : hizmetler.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4">
                    Henüz tanımlı hizmet kartı bulunmamaktadır.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          autoFocus={isHizmetAccordionOpen}
                          placeholder="Kod veya ad ile ara"
                          value={hizmetSearchTerm}
                          onChange={(e) => setHizmetSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-9"
                        />
                        {hizmetSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setHizmetSearchTerm('')}
                            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Kod veya hizmet adıyla hızlıca filtreleyin.</p>
                    </div>
                    {filteredHizmetler.length === 0 ? (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4">
                        Arama kriterlerinize uygun hizmet bulunamadı.
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
                        {filteredHizmetler.map((hizmet) => {
                          const selected = selectedServiceCodes.includes(hizmet.kod);
                          return (
                            <label
                              key={hizmet.kod}
                              className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                                selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                checked={selected}
                                onChange={() => handleServiceToggle(hizmet.kod)}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  [{hizmet.kod}] {hizmet.ad}
                                </p>
                                {hizmet.aciklama && (
                                  <p className="text-xs text-gray-500 mt-1">{hizmet.aciklama}</p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Birden fazla aktivite seçmek için kutucukları işaretleyebilirsiniz.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Firma Çalışanı Seçimi - Accordion */}
          <div ref={employeeAccordionRef} className="border-2 border-green-200 rounded-xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setIsEmployeeAccordionOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-5 py-4 text-left bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all"
            >
              <div>
                <p className="text-sm font-semibold text-green-900">Firma Çalışanı Seçimi</p>
                <p className="text-xs text-green-700">Seçilen: {selectedEmployeeIds.length} çalışan (Sadece SGK aktif personeller gösterilir)</p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-green-600 transition-transform ${isEmployeeAccordionOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isEmployeeAccordionOpen && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                {isLoadingEmployees ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Çalışanlar yükleniyor...</span>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4">
                    Henüz kayıtlı çalışan bulunmamaktadır. "Firma Çalışanları" menüsünden ekleyebilirsiniz.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          autoFocus={isEmployeeAccordionOpen}
                          placeholder="İsim, TC/Pasaport ile ara"
                          value={employeeSearchTerm}
                          onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 pr-9"
                        />
                        {employeeSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setEmployeeSearchTerm('')}
                            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Personeli hızlıca bulmak için aramayı kullanın.</p>
                    </div>
                    {filteredEmployees.length === 0 ? (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4">
                        Aramanıza uyan çalışan bulunamadı.
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto pr-1 space-y-2">
                        {filteredEmployees.map((emp) => {
                          const selected = selectedEmployeeIds.includes(emp.id);
                          const isInvalid = invalidEmployeeIds.includes(emp.id);
                          const stateClass = isInvalid
                            ? 'border-red-400 bg-red-50'
                            : selected
                              ? 'border-green-400 bg-green-50'
                              : 'border-gray-200 hover:border-green-300';
                          return (
                            <label
                              key={emp.id}
                              className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${stateClass}`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded"
                                checked={selected}
                                onChange={() => handleEmployeeToggle(emp.id)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-900">{emp.full_name}</p>
                                  {isEmployeeSgkCompliant(emp) && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">SGK Uyumlu</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {emp.tc_kimlik || emp.pasaport || 'Kimlik bilgisi yok'}
                                </p>
                                {emp.phone && (
                                  <p className="text-xs text-gray-500">Tel: {emp.phone}</p>
                                )}
                                {emp.position && (
                                  <p className="text-xs text-gray-500">Pozisyon: {emp.position}</p>
                                )}
                                {isInvalid && (
                                  <p className="text-xs font-semibold text-red-600 mt-1">
                                    SGK listesinde bulunamadı
                                  </p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Görev alacak tüm personeli işaretleyin.</p>
                    {invalidEmployeeIds.length > 0 && (
                      <p className="text-xs font-semibold text-red-600">
                        SGK listesinde bulunmayan {invalidEmployeeIds.length} çalışan seçili. Güncel SGK hizmet listesini yükleyin.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Araç Seçimi - Accordion */}
          <div ref={vehicleAccordionRef} className="border-2 border-purple-200 rounded-xl overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setIsVehicleAccordionOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-5 py-4 text-left bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all"
            >
              <div>
                <p className="text-sm font-semibold text-purple-900">Araç Seçimi</p>
                <p className="text-xs text-purple-700">Seçilen: {selectedVehicleIds.length} araç</p>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-purple-600 transition-transform ${isVehicleAccordionOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isVehicleAccordionOpen && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                {isLoadingVehicles ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Araçlar yükleniyor...</span>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4">
                    Henüz kayıtlı araç bulunmamaktadır. "Araç Tanımlamaları" menüsünden ekleyebilirsiniz.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          autoFocus={isVehicleAccordionOpen}
                          placeholder="Plaka, marka veya model ara"
                          value={vehicleSearchTerm}
                          onChange={(e) => setVehicleSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-9"
                        />
                        {vehicleSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setVehicleSearchTerm('')}
                            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Plaka, marka veya modele göre filtreleyin.</p>
                    </div>
                    {filteredVehicles.length === 0 ? (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4">
                        Aradığınız kritere uygun araç bulunamadı.
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto pr-1 space-y-2">
                        {filteredVehicles.map((veh) => {
                          const selected = selectedVehicleIds.includes(veh.id);
                          return (
                            <label
                              key={veh.id}
                              className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                                selected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded"
                                checked={selected}
                                onChange={() => handleVehicleToggle(veh.id)}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {veh.plaka} - {veh.marka} {veh.model}
                                </p>
                                {veh.tip && (
                                  <p className="text-xs text-gray-500 mt-1">Tip: {veh.tip}</p>
                                )}
                                {veh.surucu && (
                                  <p className="text-xs text-gray-500">Sürücü: {veh.surucu}</p>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Gerekli araçları işaretleyin, boş bırakabilirsiniz.</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Konu */}
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Konu <span className="text-red-500">*</span>
            </label>
            <input
              id="subject"
              type="text"
              placeholder="Örn: MSC MARIA gemisi yanaşma talebi"
              className={`block w-full px-3 py-2.5 border ${
                errors.subject ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              {...register('subject')}
            />
            {errors.subject && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.subject.message}
              </p>
            )}
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Açıklama
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Talebiniz hakkında detaylı açıklama yazınız..."
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('description')}
            />
            <p className="text-xs text-gray-500">Maksimum 500 karakter</p>
          </div>

          {/* Tahmini Başlangıç Tarihi */}
          <div className="space-y-2">
            <label htmlFor="planned_start" className="block text-sm font-medium text-gray-700">
              Tahmini Başlangıç Tarihi
            </label>
            <div className="relative">
              <input
                id="planned_start"
                type="datetime-local"
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('planned_start')}
              />
              <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-xs text-gray-500">İş emrinin ne zaman başlamasını talep ettiğinizi belirtin</p>
          </div>

          {/* Öncelik */}
          <div className="space-y-2">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
              Öncelik
            </label>
            <select
              id="priority"
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('priority')}
            >
              <option value="LOW">Düşük</option>
              <option value="MEDIUM">Orta</option>
              <option value="HIGH">Yüksek</option>
              <option value="URGENT">Acil</option>
            </select>
          </div>

          {/* Belgeler */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-800">
              Belgeler
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                className="flex items-center gap-3 border-2 border-orange-200 rounded-xl px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 transition-all shadow-sm text-left"
              >
                <FileText className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="text-sm font-semibold text-orange-900">Gümrük Yazısı Yükle</p>
                  <p className="text-xs text-orange-700">PDF, maksimum 10 MB</p>
                </div>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 border-2 border-teal-200 rounded-xl px-5 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 transition-all shadow-sm text-left"
              >
                <FileText className="w-6 h-6 text-teal-600" />
                <div>
                  <p className="text-sm font-semibold text-teal-900">Sevk İrsaliyesi Yükle</p>
                  <p className="text-xs text-teal-700">PDF, maksimum 10 MB</p>
                </div>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Not: Dosya yükleme akışı ileride Dijital Arşiv ile entegre edilecektir. Şimdilik bu alan bilgilendirme amaçlıdır.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-3 text-sm font-semibold transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Talep Oluştur</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => window.location.hash = 'dashboard'}
              className="px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
