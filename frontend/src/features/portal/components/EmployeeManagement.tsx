// frontend/src/features/portal/components/EmployeeManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { usePortalAuth } from '../context/PortalAuthContext';
import { portalTokenStorage } from '../utils/portalTokenStorage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, Plus, Edit, Trash2, Upload, User, FileText, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { SgkUploadDialog } from './SgkUploadDialog';
import { checkSgkPeriodStatus, formatPeriod, getMonthNameTR } from '../utils/sgkPeriodCheck';
import type { SgkPeriodStatus } from '../utils/sgkPeriodCheck';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE_URL = 'http://localhost:8000';

// Pozisyon seçenekleri
const POSITION_OPTIONS = [
  'Liman İşçisi',
  'Forklift Operatörü',
  'Vinç Operatörü',
  'Şoför',
  'Güvenlik',
  'Yönetici',
  'Diğer'
];

interface Employee {
  id: number;
  full_name: string;
  tc_kimlik?: string;
  pasaport?: string;
  nationality?: string;
  phone?: string;
  position?: string;
  is_active: boolean;
  sgk_last_check_period?: string | null;
  sgk_is_active_last_period?: boolean | null;
  documents?: EmployeeDocument[];
}

interface EmployeeDocument {
  id: number;
  employee_id: number;
  document_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  issue_date?: string | null;
  expires_at?: string | null;
  uploaded_at: string;
}

interface EmployeeFormState {
  full_name: string;
  tc_kimlik: string;
  pasaport: string;
  nationality: string;
  phone: string;
  position: string;
}

const createEmptyEmployeeForm = (): EmployeeFormState => ({
  full_name: '',
  tc_kimlik: '',
  pasaport: '',
  nationality: 'TUR',
  phone: '',
  position: '',
});

export function EmployeeManagement() {
  const { user } = usePortalAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showSgkDialog, setShowSgkDialog] = useState(false);
  const [sgkStatus, setSgkStatus] = useState<SgkPeriodStatus | null>(null);
  
  // Belge tarihleri
  const [ehliyetIssueDate, setEhliyetIssueDate] = useState('');
  const [ehliyetExpiresAt, setEhliyetExpiresAt] = useState('');
  const [src5IssueDate, setSrc5IssueDate] = useState('');
  const [src5ExpiresAt, setSrc5ExpiresAt] = useState('');
  
  const [formData, setFormData] = useState<EmployeeFormState>(() => createEmptyEmployeeForm());

  const resetFormData = () => setFormData(createEmptyEmployeeForm());

  const openEmployeeForm = (employee?: Employee | null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        full_name: employee.full_name || '',
        tc_kimlik: employee.tc_kimlik || '',
        pasaport: employee.pasaport || '',
        nationality: employee.nationality || 'TUR',
        phone: employee.phone || '',
        position: employee.position || '',
      });
    } else {
      setEditingEmployee(null);
      resetFormData();
    }
    setIsEmployeeFormOpen(true);
  };

  const closeEmployeeForm = () => {
    setIsEmployeeFormOpen(false);
    setEditingEmployee(null);
    resetFormData();
  };

  const formatSgkPeriod = (value?: string | null) => {
    if (!value || value.length !== 6) return 'Kontrol Yok';
    return `${value.slice(0, 4)}-${value.slice(4, 6)}`;
  };

  const getDocumentStatusBadge = (expiresAt?: string | null) => {
    if (!expiresAt) return { label: 'Tarih Yok', className: 'bg-gray-100 text-gray-800' };
    
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: 'Süresi Dolmuş', className: 'bg-red-100 text-red-800' };
    } else if (daysUntilExpiry <= 30) {
      return { label: `${daysUntilExpiry} gün kaldı`, className: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'Geçerli', className: 'bg-green-100 text-green-800' };
    }
  };

  // Güncel dönem hesaplama (bugün için yüklenmesi gereken son dönem)
  const getCurrentRequiredPeriod = (): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    // Eğer ayın 26'sı geçtiyse, bu ay için yükleme yapılmalı
    // Değilse geçen ay için yükleme yapılmalı
    if (currentDay >= 26) {
      return `${currentYear}${String(currentMonth).padStart(2, '0')}`;
    } else {
      // Geçen ay
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      return `${lastYear}${String(lastMonth).padStart(2, '0')}`;
    }
  };

  const getSgkStatusMeta = (employee: Employee) => {
    const hasPeriod = Boolean(employee.sgk_last_check_period);
    const isActive = Boolean(employee.sgk_is_active_last_period);
    const currentRequired = getCurrentRequiredPeriod();
    const hasHireDeclaration = employee.documents?.some((doc) => doc.document_type === 'SGK_ISE_GIRIS');

    // Eğer yüklenen dönem güncel gerekli dönemden eskiyse = EKSİK
    const isOutdated = hasPeriod && employee.sgk_last_check_period! < currentRequired;

    if (hasHireDeclaration && (!isActive || isOutdated || !hasPeriod)) {
      return {
        label: 'İşe Giriş Bildirildi',
        className: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600',
        tooltip: 'İşe giriş bildirgesi yüklendi ve SGK sistemine iletildi. SGK hizmet dökümü bir ay geriden geldiği için yeşil durum gösteriliyor; bir sonraki dönemde otomatik doğrulama yapılacak.',
      };
    }

    if (hasPeriod && isActive && !isOutdated) {
      // Güncel dönem yüklenmiş VE aktif
      return {
        label: 'Uyumlu',
        className: 'border-green-500/40 bg-green-500/10 text-green-700',
        tooltip: `${formatSgkPeriod(employee.sgk_last_check_period)} döneminde SGK listesinde doğrulandı.`,
      };
    }

    if (hasPeriod && !isActive) {
      // SGK listesinde yok
      return {
        label: 'Listede Yok',
        className: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
        tooltip: `${formatSgkPeriod(employee.sgk_last_check_period)} döneminde SGK listesinden eşleşme bulunamadı.`,
      };
    }

    if (isOutdated) {
      // Eski dönem yüklenmiş, güncelleme gerekli
      return {
        label: 'Bekleniyor',
        className: 'border-red-500/40 bg-red-500/10 text-red-700',
        tooltip: `Son kontrol: ${formatSgkPeriod(employee.sgk_last_check_period)}. Güncel dönem (${formatSgkPeriod(currentRequired)}) yüklenmedi.`,
      };
    }

    // Hiç yükleme yapılmamış
    return {
      label: 'Bekleniyor',
      className: 'border-red-500/40 bg-red-500/10 text-red-700',
      tooltip: 'Bu çalışan için henüz SGK hizmet listesi yüklenmedi.',
    };
  };

  const fetchEmployees = useCallback(async () => {
    const token = portalTokenStorage.getToken();
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/portal/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(response.data);
    } catch (error) {
      toast.error('Çalışanlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const handlePortalRefresh = () => fetchEmployees();
    window.addEventListener('portal:employees:refresh', handlePortalRefresh);
    return () => window.removeEventListener('portal:employees:refresh', handlePortalRefresh);
  }, [fetchEmployees]);

  // SGK dönem durumunu kontrol et
  useEffect(() => {
    const checkStatus = async () => {
      // Son yüklenen dönemi bul
      const lastPeriod = employees.reduce((latest, emp) => {
        if (!emp.sgk_last_check_period) return latest;
        if (!latest) return emp.sgk_last_check_period;
        return emp.sgk_last_check_period > latest ? emp.sgk_last_check_period : latest;
      }, null as string | null);

      // Firma kayıt tarihini al
      const companyStartDate = user?.created_at ? new Date(user.created_at) : undefined;
      
      const status = await checkSgkPeriodStatus(new Date(), lastPeriod, companyStartDate);
      setSgkStatus(status);
    };

    // Her durumda kontrol yap (çalışan yoksa da uyarı gösterilmeli)
    checkStatus();
  }, [employees, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tc_kimlik && !formData.pasaport) {
      toast.error('TC Kimlik No veya Pasaport No zorunludur');
      return;
    }

    if (!formData.position) {
      toast.error('Pozisyon seçimi zorunludur');
      return;
    }

    const token = portalTokenStorage.getToken();
    try {
      if (editingEmployee) {
        await axios.put(
          `${API_BASE_URL}/api/v1/portal/employees/${editingEmployee.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Çalışan güncellendi');
      } else {
        await axios.post(
          `${API_BASE_URL}/api/v1/portal/employees`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Çalışan eklendi');
      }
      
      closeEmployeeForm();
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Çalışanı silmek istediğinize emin misiniz?')) return;
    
    const token = portalTokenStorage.getToken();
    try {
      await axios.delete(`${API_BASE_URL}/api/v1/portal/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Çalışan silindi');
      fetchEmployees();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  const handleUploadDocument = async (employeeId: number, documentType: string, file: File, issueDate?: string, expiresAt?: string) => {
    const token = portalTokenStorage.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (issueDate) formData.append('issue_date', issueDate);
    if (expiresAt) formData.append('expires_at', expiresAt);

    try {
      await axios.post(
        `${API_BASE_URL}/api/v1/portal/employees/${employeeId}/documents`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (documentType === 'SGK_ISE_GIRIS') {
        toast.success('SGK işe giriş belgesi yüklendi - Personel artık SGK aktif olarak işaretlendi');
      } else {
        toast.success('Belge yüklendi');
      }
      fetchEmployees();
      setShowDocumentUpload(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Belge yüklenemedi');
    }
  };

  const handleDeleteDocument = async (employeeId: number, documentId: number) => {
    if (!confirm('Belgeyi silmek istediğinize emin misiniz?')) return;
    
    const token = portalTokenStorage.getToken();
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/portal/employees/${employeeId}/documents/${documentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Belge silindi');
      fetchEmployees();
    } catch (error: any) {
      toast.error('Belge silinemedi');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* SGK Uyarı Banner */}
        {sgkStatus && sgkStatus.alertLevel !== 'none' && (
          <Alert 
            variant={sgkStatus.alertLevel === 'critical' ? 'destructive' : 'default'}
            className={`mb-6 ${
              sgkStatus.alertLevel === 'critical' 
                ? 'border-red-500 bg-red-50' 
                : 'border-amber-500 bg-amber-50'
            }`}
          >
            <AlertTriangle className={`h-5 w-5 ${
              sgkStatus.alertLevel === 'critical' ? 'text-red-600' : 'text-amber-600'
            }`} />
            <AlertTitle className={
              sgkStatus.alertLevel === 'critical' ? 'text-red-900' : 'text-amber-900'
            }>
              {sgkStatus.alertLevel === 'critical' ? 'Kritik: ' : 'Dikkat: '}
              SGK Hizmet Listesi Eksik
            </AlertTitle>
            <AlertDescription className={
              sgkStatus.alertLevel === 'critical' ? 'text-red-800' : 'text-amber-800'
            }>
              <p className="mb-2">{sgkStatus.message}</p>
              <p className="text-sm">
                Eksik dönem(ler): {sgkStatus.missingPeriods.map(formatPeriod).join(', ')}
              </p>
              <p className="text-sm mt-1">
                Bir sonraki yükleme: {formatPeriod(sgkStatus.nextPeriodToUpload)} 
                {' '}(Son tarih: {sgkStatus.nextUploadDeadline.toLocaleDateString('tr-TR')})
              </p>
              <Button
                size="sm"
                variant={sgkStatus.alertLevel === 'critical' ? 'destructive' : 'default'}
                className="mt-3"
                onClick={() => setShowSgkDialog(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Hemen SGK Listesi Yükle
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Başlık ve Butonlar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Firma Çalışanları</h1>
            <p className="text-gray-600">Limana/sahaya gelecek çalışanları yönetin</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowSgkDialog(true)}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              SGK Listesi Yükle
            </Button>
            <Button onClick={() => openEmployeeForm(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Çalışan
            </Button>
          </div>
        </div>

        {/* SGK Upload Dialog */}
        <SgkUploadDialog
          open={showSgkDialog}
          onOpenChange={setShowSgkDialog}
          suggestedPeriod={sgkStatus ? formatPeriod(sgkStatus.nextPeriodToUpload) : undefined}
          onUploadSuccess={() => {
            fetchEmployees();
          }}
        />
        <Dialog open={isEmployeeFormOpen} onOpenChange={(open) => { if (!open) closeEmployeeForm(); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                {editingEmployee ? 'Çalışan Bilgilerini Düzenle' : 'Yeni Çalışan Ekle'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Zorunlu alanları doldurarak çalışan kaydını tamamlayın. Tüm bilgiler tek ekranda, daha okunaklı bir şekilde düzenlendi.
              </DialogDescription>
            </DialogHeader>
            {editingEmployee && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3 text-sm text-slate-600">
                <div className="h-10 w-10 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{editingEmployee.full_name}</p>
                  <p className="text-xs text-slate-500">{editingEmployee.position || 'Pozisyon belirtilmemiş'}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Kimlik Bilgileri</p>
                  <div>
                    <Label className="text-xs text-slate-600">Ad Soyad *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">TC Kimlik No</Label>
                    <Input
                      value={formData.tc_kimlik}
                      onChange={(e) => setFormData({ ...formData, tc_kimlik: e.target.value })}
                      maxLength={11}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Pasaport No</Label>
                    <Input
                      value={formData.pasaport}
                      onChange={(e) => setFormData({ ...formData, pasaport: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Uyruk</Label>
                    <Input
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value.toUpperCase() })}
                      maxLength={3}
                      className="mt-1 uppercase tracking-widest"
                    />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">İletişim & Pozisyon</p>
                  <div>
                    <Label className="text-xs text-slate-600">Telefon</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600">Pozisyon *</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => setFormData({ ...formData, position: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pozisyon seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {POSITION_OPTIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                    Şoför rolü seçerseniz belgelere hızlı erişim için "Yükle" butonu aktif olur.
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={closeEmployeeForm}>
                  İptal
                </Button>
                <Button type="submit" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Kaydet
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Card className="bg-slate-950/60 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-0 overflow-x-auto">
            <TooltipProvider delayDuration={150}>
              <table className="w-full text-sm text-slate-100">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-300">
                  <tr>
                    <th className="text-left p-4">Ad Soyad</th>
                    <th className="text-left p-4">TC/Pasaport</th>
                    <th className="text-left p-4">Telefon</th>
                    <th className="text-left p-4">Pozisyon</th>
                    <th className="text-left p-4">Belgeler</th>
                    <th className="text-left p-4">SGK Durumu</th>
                    <th className="text-right p-4">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {employees.map((emp) => {
                    const sgkMeta = getSgkStatusMeta(emp);
                    return (
                      <tr key={emp.id} className="border-b border-transparent hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-semibold text-base text-white">{emp.full_name}</td>
                        <td className="p-4 text-slate-200">{emp.tc_kimlik || emp.pasaport}</td>
                        <td className="p-4 text-slate-200">{emp.phone}</td>
                        <td className="p-4 text-slate-200">{emp.position}</td>
                        <td className="p-4">
                          {emp.position === 'Şoför' ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Ehliyet:</span>
                                {emp.documents?.find(d => d.document_type === 'EHLIYET') ? (
                                  (() => {
                                    const doc = emp.documents.find(d => d.document_type === 'EHLIYET');
                                    const badge = getDocumentStatusBadge(doc?.expires_at);
                                    return (
                                      <span className={`px-2 py-0.5 rounded text-xs ${badge.className}`}>
                                        {badge.label}
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="text-xs text-red-600">✗ Eksik</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">SRC-5:</span>
                                {emp.documents?.find(d => d.document_type === 'SRC5') ? (
                                  (() => {
                                    const doc = emp.documents.find(d => d.document_type === 'SRC5');
                                    const badge = getDocumentStatusBadge(doc?.expires_at);
                                    return (
                                      <span className={`px-2 py-0.5 rounded text-xs ${badge.className}`}>
                                        {badge.label}
                                      </span>
                                    );
                                  })()
                                ) : (
                                  <span className="text-xs text-red-600">✗ Eksik</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className={sgkMeta.className}>
                                {sgkMeta.label}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-sm">
                              {sgkMeta.tooltip}
                            </TooltipContent>
                          </Tooltip>
                          <p className="mt-1 text-xs text-gray-500">
                            {emp.sgk_last_check_period ? `${formatSgkPeriod(emp.sgk_last_check_period)} dönemi` : 'Kontrol bekleniyor'}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                          {!emp.sgk_is_active_last_period && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedEmployee(emp); setShowDocumentUpload(true); }}
                              className="gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              İşe Giriş
                            </Button>
                          )}
                          {emp.position === 'Şoför' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => { setSelectedEmployee(emp); setShowDocumentUpload(true); }}
                              title="Belgeler"
                            >
                              <Upload className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEmployeeForm(emp)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(emp.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Dialog
          open={showDocumentUpload && Boolean(selectedEmployee)}
          onOpenChange={(open) => {
            setShowDocumentUpload(open);
            if (!open) {
              setSelectedEmployee(null);
              setEhliyetIssueDate('');
              setEhliyetExpiresAt('');
              setSrc5IssueDate('');
              setSrc5ExpiresAt('');
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEmployee?.full_name} - Belge Yönetimi</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-4">
                {/* SGK İşe Giriş Belgesi - Sadece SGK'da olmayan personeller için */}
                {!selectedEmployee.sgk_is_active_last_period && (
                  <Alert className="border-amber-500 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900">SGK İşe Giriş Belgesi Gerekli</AlertTitle>
                    <AlertDescription className="text-amber-800">
                      <p className="mb-3">Bu personel SGK sisteminde görünmüyor. İş emirlerinde görev alabilmesi için SGK işe giriş belgesini yükleyin.</p>
                      <p className="mb-3 text-sm text-amber-900/80">
                        ⏱️ SGK hizmet dökümleri bir ay geriden geldiğinden yeni işe başlayan personellerin son dönem kontrolü hemen yeşile dönmüyor. Bu alana yüklediğiniz <strong>İşe Giriş Bildirgesi</strong>, sistemde anında yeşil durum gösterecek ve bir sonraki ay resmi dökümle otomatik eşleşecek.
                      </p>
                      {selectedEmployee.documents?.find(d => d.document_type === 'SGK_ISE_GIRIS') ? (
                        <div className="flex items-center justify-between bg-white rounded p-3 border border-amber-200">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {selectedEmployee.documents.find(d => d.document_type === 'SGK_ISE_GIRIS')?.file_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Yüklendi: {new Date(selectedEmployee.documents.find(d => d.document_type === 'SGK_ISE_GIRIS')!.uploaded_at).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteDocument(
                              selectedEmployee.id, 
                              selectedEmployee.documents!.find(d => d.document_type === 'SGK_ISE_GIRIS')!.id
                            )}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadDocument(selectedEmployee.id, 'SGK_ISE_GIRIS', file);
                                e.target.value = '';
                              }
                            }}
                            className="hidden"
                            id="sgk-ise-giris-upload"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => document.getElementById('sgk-ise-giris-upload')?.click()}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <Upload className="h-3 w-3 mr-2" />
                            SGK İşe Giriş Belgesi Yükle
                          </Button>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Ehliyet - Sadece şoför pozisyonu için */}
                {selectedEmployee.position === 'Şoför' && (
                <div className="border rounded p-4">
                  <h3 className="font-medium mb-2">Sürücü Belgesi (Ehliyet)</h3>
                  {selectedEmployee.documents?.find(d => d.document_type === 'EHLIYET') ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">
                            {selectedEmployee.documents.find(d => d.document_type === 'EHLIYET')?.file_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Yüklendi: {new Date(selectedEmployee.documents.find(d => d.document_type === 'EHLIYET')!.uploaded_at).toLocaleDateString('tr-TR')}
                          </p>
                          {selectedEmployee.documents.find(d => d.document_type === 'EHLIYET')?.expires_at && (
                            <p className="text-xs text-gray-500">
                              Son Geçerlilik: {new Date(selectedEmployee.documents.find(d => d.document_type === 'EHLIYET')!.expires_at!).toLocaleDateString('tr-TR')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const badge = getDocumentStatusBadge(selectedEmployee.documents.find(d => d.document_type === 'EHLIYET')?.expires_at);
                            return (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${badge.className}`}>
                                {badge.label}
                              </span>
                            );
                          })()}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteDocument(
                              selectedEmployee.id, 
                              selectedEmployee.documents!.find(d => d.document_type === 'EHLIYET')!.id
                            )}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium mb-1">Düzenleme Tarihi</label>
                          <Input
                            type="date"
                            value={ehliyetIssueDate}
                            onChange={(e) => setEhliyetIssueDate(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Son Geçerlilik Tarihi *</label>
                          <Input
                            type="date"
                            value={ehliyetExpiresAt}
                            onChange={(e) => setEhliyetExpiresAt(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!ehliyetExpiresAt) {
                              toast.error('Lütfen son geçerlilik tarihini girin');
                              return;
                            }
                            handleUploadDocument(selectedEmployee.id, 'EHLIYET', file, ehliyetIssueDate, ehliyetExpiresAt);
                            setEhliyetIssueDate('');
                            setEhliyetExpiresAt('');
                            e.target.value = ''; // Reset input
                          }
                        }}
                        className="hidden"
                        id="ehliyet-upload"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => document.getElementById('ehliyet-upload')?.click()}
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        Yükle
                      </Button>
                    </div>
                  )}
                </div>
                )}

                {/* SRC-5 - Sadece şoför pozisyonu için */}
                {selectedEmployee.position === 'Şoför' && (
                <div className="border rounded p-4">
                  <h3 className="font-medium mb-2">SRC-5 Belgesi</h3>
                  {selectedEmployee.documents?.find(d => d.document_type === 'SRC5') ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">
                            {selectedEmployee.documents.find(d => d.document_type === 'SRC5')?.file_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Yüklendi: {new Date(selectedEmployee.documents.find(d => d.document_type === 'SRC5')!.uploaded_at).toLocaleDateString('tr-TR')}
                          </p>
                          {selectedEmployee.documents.find(d => d.document_type === 'SRC5')?.expires_at && (
                            <p className="text-xs text-gray-500">
                              Son Geçerlilik: {new Date(selectedEmployee.documents.find(d => d.document_type === 'SRC5')!.expires_at!).toLocaleDateString('tr-TR')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const badge = getDocumentStatusBadge(selectedEmployee.documents.find(d => d.document_type === 'SRC5')?.expires_at);
                            return (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${badge.className}`}>
                                {badge.label}
                              </span>
                            );
                          })()}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteDocument(
                              selectedEmployee.id, 
                              selectedEmployee.documents!.find(d => d.document_type === 'SRC5')!.id
                            )}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium mb-1">Düzenleme Tarihi</label>
                          <Input
                            type="date"
                            value={src5IssueDate}
                            onChange={(e) => setSrc5IssueDate(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Son Geçerlilik Tarihi *</label>
                          <Input
                            type="date"
                            value={src5ExpiresAt}
                            onChange={(e) => setSrc5ExpiresAt(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!src5ExpiresAt) {
                              toast.error('Lütfen son geçerlilik tarihini girin');
                              return;
                            }
                            handleUploadDocument(selectedEmployee.id, 'SRC5', file, src5IssueDate, src5ExpiresAt);
                            setSrc5IssueDate('');
                            setSrc5ExpiresAt('');
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                        id="src5-upload"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => document.getElementById('src5-upload')?.click()}
                      >
                        <Upload className="h-3 w-3 mr-2" />
                        Yükle
                      </Button>
                    </div>
                  )}
                </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
