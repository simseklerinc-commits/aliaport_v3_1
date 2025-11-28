import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { toast } from 'sonner';
import { Users, FileText, Filter, Download } from 'lucide-react';
import { portalTokenStorage } from '../utils/portalTokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const POSITION_OPTIONS = [
  'Liman İşçisi',
  'Forklift Operatörü',
  'Vinç Operatörü',
  'Şoför',
  'Güvenlik',
  'Yönetici',
  'Diğer'
];

const DOCUMENT_TYPES = [
  { value: 'EHLIYET', label: 'Sürücü Belgesi' },
  { value: 'SRC5', label: 'SRC-5 Belgesi' }
];

interface EmployeeDocument {
  id: number;
  employee_id: number;
  document_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  issue_date?: string;
  expires_at?: string;
  uploaded_at: string;
}

interface EmployeeReport {
  id: number;
  full_name: string;
  tc_kimlik?: string;
  pasaport?: string;
  nationality?: string;
  phone?: string;
  position?: string;
  is_active: boolean;
  sgk_last_check_period?: string;
  sgk_is_active_last_period: boolean;
  cari_id: number;
  cari_code?: string;
  cari_title?: string;
  documents: EmployeeDocument[];
}

interface Stats {
  total_employees: number;
  active_employees: number;
  inactive_employees: number;
  total_documents: number;
  position_distribution: Record<string, number>;
  companies_with_employees: number;
}

export function AdminEmployeeReport() {
  const [employees, setEmployees] = useState<EmployeeReport[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtreler
  const [filters, setFilters] = useState({
    cari_id: '',
    position: '',
    document_type: '',
    is_active: 'true'
  });

  const fetchStats = async () => {
    const token = portalTokenStorage.getToken();
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/employees/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error: any) {
      console.error('İstatistikler yüklenemedi:', error);
    }
  };

  const fetchEmployees = async () => {
    const token = portalTokenStorage.getToken();
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (filters.cari_id) params.append('cari_id', filters.cari_id);
      if (filters.position) params.append('position', filters.position);
      if (filters.document_type) params.append('document_type', filters.document_type);
      if (filters.is_active) params.append('is_active', filters.is_active);

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/employees?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmployees(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Çalışanlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchEmployees();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchEmployees();
  };

  const resetFilters = () => {
    setFilters({
      cari_id: '',
      position: '',
      document_type: '',
      is_active: 'true'
    });
    setTimeout(() => fetchEmployees(), 100);
  };

  const exportToCSV = () => {
    const headers = ['Firma', 'Ad Soyad', 'TC/Pasaport', 'Telefon', 'Pozisyon', 'SGK Dönemi', 'Belgeler', 'Durum'];
    const rows = employees.map(emp => [
      emp.cari_title || '',
      emp.full_name,
      emp.tc_kimlik || emp.pasaport || '',
      emp.phone || '',
      emp.position || '',
      emp.sgk_last_check_period || '',
      emp.documents.map(d => d.document_type).join(', '),
      emp.is_active ? 'Aktif' : 'Pasif'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calisanlar_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const downloadDocumentsZip = async () => {
    const token = portalTokenStorage.getToken();
    try {
      const params = new URLSearchParams();
      if (filters.cari_id) params.append('cari_id', filters.cari_id);

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/employees/documents/download-zip?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/zip' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `calisanlar_belgeleri_${filters.cari_id || 'tum'}_${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      
      toast.success('Belgeler indirildi');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Belgeler indirilemedi');
    }
  };

  if (isLoading && !employees.length) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Çalışan Raporu (Admin)</h1>
          <p className="text-gray-600 mt-1">Tüm firmaların çalışan bilgileri ve belgeleri</p>
        </div>

        {/* İstatistikler */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Toplam Çalışan</p>
                    <p className="text-2xl font-bold">{stats.total_employees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Aktif Çalışan</p>
                    <p className="text-2xl font-bold">{stats.active_employees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Toplam Belge</p>
                    <p className="text-2xl font-bold">{stats.total_documents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Firma Sayısı</p>
                    <p className="text-2xl font-bold">{stats.companies_with_employees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtreler */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Firma ID</label>
                <Input
                  type="number"
                  placeholder="Firma ID"
                  value={filters.cari_id}
                  onChange={(e) => handleFilterChange('cari_id', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pozisyon</label>
                <Select value={filters.position} onValueChange={(val) => handleFilterChange('position', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    {POSITION_OPTIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Belge Tipi</label>
                <Select value={filters.document_type} onValueChange={(val) => handleFilterChange('document_type', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    {DOCUMENT_TYPES.map((doc) => (
                      <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Durum</label>
                <Select value={filters.is_active} onValueChange={(val) => handleFilterChange('is_active', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    <SelectItem value="true">Aktif</SelectItem>
                    <SelectItem value="false">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={applyFilters} className="flex-1">
                  Uygula
                </Button>
                <Button onClick={resetFilters} variant="outline">
                  Sıfırla
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sonuçlar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{employees.length} Çalışan Bulundu</CardTitle>
              <div className="flex gap-2">
                <Button onClick={downloadDocumentsZip} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Belgeleri ZIP İndir
                </Button>
                <Button onClick={exportToCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  CSV İndir
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4">Firma</th>
                    <th className="text-left p-4">Ad Soyad</th>
                    <th className="text-left p-4">TC/Pasaport</th>
                    <th className="text-left p-4">Telefon</th>
                    <th className="text-left p-4">Pozisyon</th>
                    <th className="text-left p-4">SGK Dönemi</th>
                    <th className="text-left p-4">Belgeler</th>
                    <th className="text-left p-4">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{emp.cari_title}</p>
                          <p className="text-xs text-gray-500">{emp.cari_code}</p>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{emp.full_name}</td>
                      <td className="p-4">{emp.tc_kimlik || emp.pasaport}</td>
                      <td className="p-4">{emp.phone}</td>
                      <td className="p-4">{emp.position}</td>
                      <td className="p-4">
                        {emp.sgk_last_check_period ? (
                          <span className={emp.sgk_is_active_last_period ? 'text-green-600' : 'text-red-600'}>
                            {emp.sgk_last_check_period}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {emp.documents.length > 0 ? (
                          <div className="space-y-1">
                            {emp.documents.map((doc) => (
                              <div key={doc.id} className="text-xs">
                                <span className="font-medium">{doc.document_type}</span>
                                {doc.expires_at && (
                                  <span className="text-gray-500 ml-2">
                                    ({new Date(doc.expires_at).toLocaleDateString('tr-TR')})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Belge yok</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {emp.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
