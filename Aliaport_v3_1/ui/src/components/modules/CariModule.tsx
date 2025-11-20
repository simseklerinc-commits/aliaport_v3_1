// CARİ MODULE - Cari Kartları modülü
// ESKİ SİSTEMLE TAM UYUMLU: Modern API entegreli yapı
// SQL: tmm_cari
// ÖZELLİKLER: CRUD, Filtreleme, E-Fatura, Risk Limiti

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { 
  Building2, 
  Plus, 
  Search,
  Loader2,
  AlertCircle,
  Save,
  X,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  DollarSign,
  Send,
  Users,
  TrendingUp
} from "lucide-react";
import { cariApi, cariApiMock } from "../../lib/api/cari";
import type { Cari } from "../../lib/types/database";
import { CariEkstre } from "./CariEkstre";
import { CariKartiDetay } from "../CariKartiDetay";

interface CariModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  initialPage?: 'list' | 'create' | 'edit' | 'ekstre';
}

// ESKİ SİSTEMLE UYUMLU Cari interface (genişletilmiş)
interface CariFull extends Cari {
  // Vergi Kimlik
  tax_id_type: 'VKN' | 'TCKN';
  tax_id: string;
  tax_office: string;
  mersis_no?: string;
  kep_address?: string;
  
  // Adres Detayları
  neighborhood?: string;
  street?: string;
  building_no?: string;
  door_no?: string;
  district?: string;
  city: string;
  postal_code?: string;
  country_code: string;
  
  // İletişim
  phone?: string;
  mobile?: string;
  email?: string;
  
  // IBAN
  iban?: string;
  
  // Finansal Parametreler
  currency: string;
  payment_term_days: number;
  risk_limit: number;
  current_balance?: number;
  
  // E-Fatura
  is_einvoice_customer: boolean;
  send_method: 'E-FATURA' | 'E-ARSIV' | 'KAGIT';
  accepts_earchive: boolean;
  
  // Notlar
  notes?: string;
}

export function CariModule({ 
  onNavigateHome, 
  onNavigateBack, 
  theme,
  initialPage = 'list'
}: CariModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'ekstre'>(initialPage);
  const [cariler, setCariler] = useState<CariFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCari, setSelectedCari] = useState<CariFull | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER' | 'BOTH'>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Form state - ESKİ SİSTEMLE TAM UYUMLU
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    type: 'CUSTOMER' as 'CUSTOMER' | 'SUPPLIER' | 'BOTH',
    is_active: true,
    
    // Vergi Kimlik
    tax_id_type: 'VKN' as 'VKN' | 'TCKN',
    tax_id: '',
    tax_office: '',
    mersis_no: '',
    kep_address: '',
    
    // Adres
    address: '',
    neighborhood: '',
    street: '',
    building_no: '',
    door_no: '',
    district: '',
    city: 'İzmir',
    postal_code: '',
    country_code: 'TR',
    
    // İletişim
    phone: '',
    mobile: '',
    email: '',
    
    // IBAN
    iban: '',
    
    // Finansal
    currency: 'TRY' as 'TRY' | 'USD' | 'EUR',
    payment_term_days: 0,
    risk_limit: 0,
    
    // E-Fatura
    is_einvoice_customer: false,
    send_method: 'E-FATURA' as 'E-FATURA' | 'E-ARSIV' | 'KAGIT',
    accepts_earchive: false,
    
    // Notlar
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock mode
  const MOCK_MODE = true;

  // Carileri yükle
  const loadCariler = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (MOCK_MODE) {
        const { cariMasterData } = await import('../../data/cariData');
        // Mock data'yı CariFull formatına dönüştür (PascalCase -> camelCase)
        const fullData: CariFull[] = cariMasterData.map(c => ({
          id: c.Id,
          code: c.Code,
          title: c.Name,
          type: c.AccountType,
          is_active: c.Active,
          address: c.Address || '',
          
          tax_id_type: c.TaxIdType,
          tax_id: c.TaxId,
          tax_office: c.TaxOffice || '',
          mersis_no: c.MersisNo,
          kep_address: c.KepAddress,
          
          neighborhood: c.Neighborhood,
          street: c.Street,
          building_no: c.BuildingNo,
          door_no: c.DoorNo,
          district: c.District,
          city: c.City,
          postal_code: c.PostalCode,
          country_code: c.CountryCode,
          
          phone: c.Phone,
          mobile: c.Mobile,
          email: c.Email,
          
          iban: c.IBAN,
          
          currency: c.Currency,
          payment_term_days: c.PaymentTermDays,
          risk_limit: c.RiskLimit || 0,
          
          is_einvoice_customer: c.IsEInvoiceCustomer,
          send_method: c.SendMethod,
          accepts_earchive: c.AcceptsEArchive,
          
          notes: c.Notes,
          
          created_at: c.CreatedAt,
          updated_at: c.UpdatedAt,
        }));
        setCariler(fullData);
      } else {
        const response = await cariApi.getAll({
          page: 1,
          page_size: 100,
          type: filterType === 'ALL' ? undefined : filterType,
          is_active: filterActive === 'ALL' ? undefined : filterActive === 'ACTIVE',
        });
        setCariler(response.items as any);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
      console.error('Cari yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (currentView === 'list' && cariler.length === 0) {
      // Sadece cariler boşsa yükle, yoksa mevcut state'i koru
      loadCariler();
    }
  }, []); // Dependency array boş - sadece ilk mount'ta çalışır

  // Filter değişikliklerinde state'i güncelle (yeni carileri koru)
  useEffect(() => {
    if (currentView === 'list' && cariler.length > 0) {
      // Filtreleme için state'i kullan, yeniden yükleme
    }
  }, [filterType, filterActive]);

  // Cari sil
  const handleDelete = async (id: number) => {
    if (!confirm('Bu cariyi silmek istediğinizden emin misiniz?')) return;
    
    try {
      if (!MOCK_MODE) {
        await cariApi.delete(id);
      }
      setCariler(cariler.filter(c => c.id !== id));
      alert('✅ Cari silindi!');
    } catch (err) {
      alert('Silme işlemi başarısız: ' + (err instanceof Error ? err.message : 'Hata'));
    }
  };

  // Cari aktif/pasif
  const handleToggleActive = async (id: number) => {
    try {
      if (!MOCK_MODE) {
        await cariApi.toggleActive(id);
      }
      setCariler(cariler.map(c => 
        c.id === id ? { ...c, is_active: !c.is_active } : c
      ));
    } catch (err) {
      alert('Güncelleme başarısız: ' + (err instanceof Error ? err.message : 'Hata'));
    }
  };

  // Cari düzenle
  const handleEdit = (cari: CariFull) => {
    setSelectedCari(cari);
    setFormData({
      code: cari.code,
      title: cari.title,
      type: cari.type,
      is_active: cari.is_active,
      
      tax_id_type: cari.tax_id_type,
      tax_id: cari.tax_id,
      tax_office: cari.tax_office,
      mersis_no: cari.mersis_no || '',
      kep_address: cari.kep_address || '',
      
      address: cari.address || '',
      neighborhood: cari.neighborhood || '',
      street: cari.street || '',
      building_no: cari.building_no || '',
      door_no: cari.door_no || '',
      district: cari.district || '',
      city: cari.city,
      postal_code: cari.postal_code || '',
      country_code: cari.country_code,
      
      phone: cari.phone || '',
      mobile: cari.mobile || '',
      email: cari.email || '',
      
      iban: cari.iban || '',
      
      currency: cari.currency as any,
      payment_term_days: cari.payment_term_days,
      risk_limit: cari.risk_limit,
      
      is_einvoice_customer: cari.is_einvoice_customer,
      send_method: cari.send_method,
      accepts_earchive: cari.accepts_earchive,
      
      notes: cari.notes || '',
    });
    setCurrentView('edit');
  };

  // Ekstre görüntüle
  const handleViewEkstre = (cari: CariFull) => {
    setSelectedCari(cari);
    setCurrentView('ekstre');
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.code.trim()) {
      errors.code = 'Cari kodu zorunludur';
    }

    if (!formData.title.trim()) {
      errors.title = 'Cari unvanı zorunludur';
    }

    if (!formData.tax_id.trim()) {
      errors.tax_id = 'Vergi kimlik numarası zorunludur';
    } else if (formData.tax_id_type === 'VKN' && formData.tax_id.length !== 10) {
      errors.tax_id = 'VKN 10 haneli olmalıdır';
    } else if (formData.tax_id_type === 'TCKN' && formData.tax_id.length !== 11) {
      errors.tax_id = 'TCKN 11 haneli olmalıdır';
    }

    if (!formData.tax_office.trim()) {
      errors.tax_office = 'Vergi dairesi zorunludur';
    }

    if (formData.email && !formData.email.includes('@')) {
      errors.email = 'Geçerli bir e-posta adresi girin';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      if (currentView === 'create') {
        const newCari: CariFull = {
          id: Math.max(0, ...cariler.map(c => c.id)) + 1,
          code: formData.code.toUpperCase(),
          title: formData.title,
          type: formData.type,
          is_active: formData.is_active,
          address: formData.address,
          
          tax_id_type: formData.tax_id_type,
          tax_id: formData.tax_id,
          tax_office: formData.tax_office,
          mersis_no: formData.mersis_no,
          kep_address: formData.kep_address,
          
          neighborhood: formData.neighborhood,
          street: formData.street,
          building_no: formData.building_no,
          door_no: formData.door_no,
          district: formData.district,
          city: formData.city,
          postal_code: formData.postal_code,
          country_code: formData.country_code,
          
          phone: formData.phone,
          mobile: formData.mobile,
          email: formData.email,
          
          iban: formData.iban,
          
          currency: formData.currency,
          payment_term_days: formData.payment_term_days,
          risk_limit: formData.risk_limit,
          
          is_einvoice_customer: formData.is_einvoice_customer,
          send_method: formData.send_method,
          accepts_earchive: formData.accepts_earchive,
          
          notes: formData.notes,
          
          created_at: new Date().toISOString(),
          updated_at: null,
        };

        if (!MOCK_MODE) {
          await cariApi.create(newCari as any);
        }
        
        // Yeni cariyi state'e ekle - ÖNCE ekle, SONRA view değiştir
        setCariler([newCari, ...cariler]);
        
        // Form'u temizle ve listeye dön
        resetForm();
        setCurrentView('list');
        
        // Başarı mesajı
        alert('✅ Cari başarıyla oluşturuldu!');
        
      } else if (currentView === 'edit' && selectedCari) {
        const updatedCari: CariFull = {
          ...selectedCari,
          code: formData.code.toUpperCase(),
          title: formData.title,
          type: formData.type,
          is_active: formData.is_active,
          address: formData.address,
          
          tax_id_type: formData.tax_id_type,
          tax_id: formData.tax_id,
          tax_office: formData.tax_office,
          mersis_no: formData.mersis_no,
          kep_address: formData.kep_address,
          
          neighborhood: formData.neighborhood,
          street: formData.street,
          building_no: formData.building_no,
          door_no: formData.door_no,
          district: formData.district,
          city: formData.city,
          postal_code: formData.postal_code,
          country_code: formData.country_code,
          
          phone: formData.phone,
          mobile: formData.mobile,
          email: formData.email,
          
          iban: formData.iban,
          
          currency: formData.currency,
          payment_term_days: formData.payment_term_days,
          risk_limit: formData.risk_limit,
          
          is_einvoice_customer: formData.is_einvoice_customer,
          send_method: formData.send_method,
          accepts_earchive: formData.accepts_earchive,
          
          notes: formData.notes,
          
          updated_at: new Date().toISOString(),
        };

        if (!MOCK_MODE) {
          await cariApi.update(selectedCari.id, updatedCari as any);
        }
        
        setCariler(cariler.map(c => c.id === selectedCari.id ? updatedCari : c));
        
        resetForm();
        setCurrentView('list');
        
        alert('✅ Cari başarıyla güncellendi!');
      }
      
    } catch (err) {
      alert('Kaydetme başarısız: ' + (err instanceof Error ? err.message : 'Hata'));
    } finally {
      setLoading(false);
    }
  };

  // Form reset
  const resetForm = () => {
    setFormData({
      code: '',
      title: '',
      type: 'CUSTOMER',
      is_active: true,
      
      tax_id_type: 'VKN',
      tax_id: '',
      tax_office: '',
      mersis_no: '',
      kep_address: '',
      
      address: '',
      neighborhood: '',
      street: '',
      building_no: '',
      door_no: '',
      district: '',
      city: 'İzmir',
      postal_code: '',
      country_code: 'TR',
      
      phone: '',
      mobile: '',
      email: '',
      
      iban: '',
      
      currency: 'TRY',
      payment_term_days: 0,
      risk_limit: 0,
      
      is_einvoice_customer: false,
      send_method: 'E-FATURA',
      accepts_earchive: false,
      
      notes: '',
    });
    setFormErrors({});
    setSelectedCari(null);
  };

  // Form iptal
  const handleCancel = () => {
    resetForm();
    setCurrentView('list');
  };

  // Filtrelenmiş cariler
  const filteredCariler = cariler.filter(cari => {
    const matchesSearch = !searchTerm || 
      (cari.title && cari.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cari.code && cari.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cari.tax_id && cari.tax_id.includes(searchTerm));
    
    const matchesType = filterType === 'ALL' || cari.type === filterType;
    const matchesActive = filterActive === 'ALL' || 
      (filterActive === 'ACTIVE' ? cari.is_active : !cari.is_active);
    
    return matchesSearch && matchesType && matchesActive;
  });

  // Tip istatistikleri
  const typeStats = {
    CUSTOMER: cariler.filter(c => c.type === 'CUSTOMER').length,
    SUPPLIER: cariler.filter(c => c.type === 'SUPPLIER').length,
    BOTH: cariler.filter(c => c.type === 'BOTH').length,
  };

  // Tip badge rengi
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CUSTOMER':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Müşteri</Badge>;
      case 'SUPPLIER':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">Tedarikçi</Badge>;
      case 'BOTH':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">Her İkisi</Badge>;
      default:
        return null;
    }
  };

  // CARİ LİSTESİ GÖRÜNÜMÜ
  const renderList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cari Kartları</h1>
              <p className="text-sm text-gray-400">
                Cari hesap kartlarını görüntüle, düzenle ve yönet
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setCurrentView('create')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Cari
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari ara (unvan, kod veya vergi no)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none min-w-[200px]"
          >
            <option value="ALL">Tüm Tipler</option>
            <option value="CUSTOMER">Müşteri ({typeStats.CUSTOMER})</option>
            <option value="SUPPLIER">Tedarikçi ({typeStats.SUPPLIER})</option>
            <option value="BOTH">Her İkisi ({typeStats.BOTH})</option>
          </select>
          
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as any)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">Tümü</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Pasif</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {/* Cari Table */}
      {!loading && !error && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Durum</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Kod</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Unvan</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Tip</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Vergi No</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Şehir</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">E-Fatura</th>
                <th className="text-right px-4 py-3 text-sm text-gray-400">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredCariler.map(cari => (
                <tr 
                  key={cari.id} 
                  onClick={() => {
                    setSelectedCari(cari);
                    setShowDetailDialog(true);
                  }}
                  className="border-b border-gray-800 hover:bg-gray-900/30 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    {cari.is_active ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-300">{cari.code}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{cari.title}</div>
                    {cari.address && (
                      <div className="text-xs text-gray-500 mt-1">{cari.address.substring(0, 40)}...</div>
                    )}
                  </td>
                  <td className="px-4 py-3">{getTypeBadge(cari.type)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-400">{cari.tax_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{cari.city}</td>
                  <td className="px-4 py-3">
                    {cari.is_einvoice_customer ? (
                      <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                        E-Fatura
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-600 text-gray-500 text-xs">
                        Kağıt
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleEdit(cari); }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(cari.id); }}
                        className={cari.is_active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                      >
                        {cari.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleDelete(cari.id); }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleViewEkstre(cari); }}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCariler.length === 0 && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400 mb-4">Cari kaydı bulunamadı</p>
          <Button
            onClick={() => setCurrentView('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            İlk Cariyi Oluştur
          </Button>
        </div>
      )}
    </div>
  );

  // CARİ OLUŞTUR/DÜZENLE FORM GÖRÜNÜMÜ
  const renderForm = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/80">
          <div>
            <h2 className="text-2xl text-white mb-1">
              {currentView === 'create' ? 'Yeni Cari Kartı' : 'Cari Kartı Düzenle'}
            </h2>
            <p className="text-sm text-gray-400">
              {currentView === 'create' 
                ? 'Yeni cari kartı oluştur' 
                : `ID: ${selectedCari?.id} · Kod: ${selectedCari?.code}`
              }
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sol Blok - Genel Bilgiler */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 mb-3 text-white">
                <FileText className="w-5 h-5 text-blue-400" />
                Genel Bilgiler
              </h3>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Cari Kodu <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="01.001"
                  className={`bg-gray-800/50 border ${formErrors.code ? 'border-red-500' : 'border-gray-700'} text-white font-mono`}
                  required
                />
                {formErrors.code && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.code}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  Cari Unvanı <span className="text-red-400">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ABC Yat İşletmeleri Ltd. Şti."
                  className={`bg-gray-800/50 border ${formErrors.title ? 'border-red-500' : 'border-gray-700'} text-white`}
                  required
                />
                {formErrors.title && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Cari Tipi</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  >
                    <option value="CUSTOMER">Müşteri</option>
                    <option value="SUPPLIER">Tedarikçi</option>
                    <option value="BOTH">Her İkisi</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Durum</label>
                  <select
                    value={formData.is_active ? 'ACTIVE' : 'PASSIVE'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'ACTIVE' })}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  >
                    <option value="ACTIVE">AKTİF</option>
                    <option value="PASSIVE">PASİF</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm text-gray-300 mb-3">Vergi Kimlik</h4>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Tip</label>
                    <select
                      value={formData.tax_id_type}
                      onChange={(e) => setFormData({ ...formData, tax_id_type: e.target.value as any })}
                      className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                    >
                      <option value="VKN">VKN</option>
                      <option value="TCKN">TCKN</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">
                      {formData.tax_id_type} <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      placeholder={formData.tax_id_type === 'VKN' ? '1234567890' : '12345678901'}
                      maxLength={formData.tax_id_type === 'VKN' ? 10 : 11}
                      className={`bg-gray-800/50 border ${formErrors.tax_id ? 'border-red-500' : 'border-gray-700'} text-white font-mono`}
                      required
                    />
                  </div>
                </div>
                {formErrors.tax_id && (
                  <p className="text-xs text-red-400 mb-3">{formErrors.tax_id}</p>
                )}

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">
                    Vergi Dairesi <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={formData.tax_office}
                    onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                    placeholder="Konak Vergi Dairesi"
                    className={`bg-gray-800/50 border ${formErrors.tax_office ? 'border-red-500' : 'border-gray-700'} text-white`}
                    required
                  />
                  {formErrors.tax_office && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.tax_office}</p>
                  )}
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-400 mb-2 block">Mersis No</label>
                  <Input
                    value={formData.mersis_no}
                    onChange={(e) => setFormData({ ...formData, mersis_no: e.target.value })}
                    placeholder="0123456789012345"
                    maxLength={16}
                    className="bg-gray-800/50 border-gray-700 text-white font-mono"
                  />
                </div>

                <div className="mt-3">
                  <label className="text-xs text-gray-400 mb-2 block">KEP Adresi</label>
                  <Input
                    value={formData.kep_address}
                    onChange={(e) => setFormData({ ...formData, kep_address: e.target.value })}
                    placeholder="firma@hs01.kep.tr"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Orta Blok - Adres & İletişim */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 mb-3 text-white">
                <MapPin className="w-5 h-5 text-green-400" />
                Adres & İletişim
              </h3>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Adres</label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Tam adres..."
                  className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Mahalle</label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Alsancak Mah."
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Sokak</label>
                  <Input
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Kıbrıs Şehitleri Cad."
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Bina No</label>
                  <Input
                    value={formData.building_no}
                    onChange={(e) => setFormData({ ...formData, building_no: e.target.value })}
                    placeholder="123"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Daire No</label>
                  <Input
                    value={formData.door_no}
                    onChange={(e) => setFormData({ ...formData, door_no: e.target.value })}
                    placeholder="4"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">İlçe</label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Konak"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Şehir</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="İzmir"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Posta Kodu</label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="35000"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Ülke</label>
                  <select
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  >
                    <option value="TR">Türkiye</option>
                    <option value="US">ABD</option>
                    <option value="GB">İngiltere</option>
                    <option value="DE">Almanya</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                  <Phone className="w-4 h-4" />
                  İletişim Bilgileri
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Telefon</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+90 232 123 45 67"
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Mobil</label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+90 532 123 45 67"
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">E-posta</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@firma.com"
                      className={`bg-gray-800/50 border ${formErrors.email ? 'border-red-500' : 'border-gray-700'} text-white`}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ Blok - Finansal & E-Fatura */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 mb-3 text-white">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                Finansal Parametreler
              </h3>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">IBAN</label>
                <Input
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  maxLength={32}
                  className="bg-gray-800/50 border-gray-700 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Para Birimi</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Vade (Gün)</label>
                  <Input
                    type="number"
                    value={formData.payment_term_days}
                    onChange={(e) => setFormData({ ...formData, payment_term_days: Number(e.target.value) })}
                    placeholder="30"
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-2 block">Risk Limiti</label>
                <Input
                  type="number"
                  value={formData.risk_limit}
                  onChange={(e) => setFormData({ ...formData, risk_limit: Number(e.target.value) })}
                  placeholder="100000"
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                  <Send className="w-4 h-4" />
                  E-Fatura Ayarları
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <label className="text-sm text-gray-300">E-Fatura Müşterisi</label>
                    <input
                      type="checkbox"
                      checked={formData.is_einvoice_customer}
                      onChange={(e) => setFormData({ ...formData, is_einvoice_customer: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Gönderim Yöntemi</label>
                    <select
                      value={formData.send_method}
                      onChange={(e) => setFormData({ ...formData, send_method: e.target.value as any })}
                      className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                    >
                      <option value="E-FATURA">E-Fatura</option>
                      <option value="E-ARSIV">E-Arşiv</option>
                      <option value="KAGIT">Kağıt Fatura</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <label className="text-sm text-gray-300">E-Arşiv Kabul Eder</label>
                    <input
                      type="checkbox"
                      checked={formData.accepts_earchive}
                      onChange={(e) => setFormData({ ...formData, accepts_earchive: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <label className="text-xs text-gray-400 mb-2 block">Notlar</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Cari hakkında notlar..."
                  className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <span className="text-red-400">*</span> ile işaretli alanlar zorunludur
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              İptal
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // VIEW ROUTER
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {currentView === 'list' && renderList()}
        {(currentView === 'create' || currentView === 'edit') && renderForm()}
        {currentView === 'ekstre' && selectedCari && (
          <CariEkstre 
            cari={selectedCari} 
            onBack={() => setCurrentView('list')}
          />
        )}
        
        {/* Cari Detay Dialog */}
        {showDetailDialog && selectedCari && (
          <CariKartiDetay
            cari={selectedCari}
            onClose={() => { setShowDetailDialog(false); setSelectedCari(null); }}
            onEdit={() => { setShowDetailDialog(false); handleEdit(selectedCari); }}
            onDelete={(c) => { handleDelete(c.id); setShowDetailDialog(false); }}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}