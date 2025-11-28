/**
 * DİJİTAL ARŞİV MODULE - Modern Document List Component
 * 
 * React Query hooks kullanarak belge listesini gösterir
 * - Pagination desteği
 * - Search, filter (category, status, expiry)
 * - Upload, approve, reject, download actions
 * - Backend API: GET /api/archive/stats
 * 
 * @see backend/aliaport_api/modules/dijital_arsiv/router.py
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { SimplePagination } from '../../../shared/ui/Pagination';
import { TableSkeleton } from '../../../shared/ui/Skeleton';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

interface ArchiveDocument {
  id: number;
  category: string;
  document_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: 'UPLOADED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  work_order_id?: number;
  cari_id?: number;
  description?: string;
  issue_date?: string;
  expires_at?: string;
  uploaded_by_id?: number;
  uploaded_at: string;
  approved_by_id?: number;
  approved_at?: string;
  approval_note?: string;
  version: number;
  is_latest_version: boolean;
}

interface ArchiveStats {
  uploaded_count: number;
  approved_count: number;
  rejected_count: number;
  expired_count: number;
  total_count: number;
  expiring_soon_count: number;
}

interface PaginatedDocumentResponse {
  items: ArchiveDocument[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface DocumentListModernProps {
  category?: string | null;  // ✅ Kategori filtresi
}

export function DocumentListModern({ category }: DocumentListModernProps = {}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/admin/archive/documents/${documentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approval_note: 'Onaylandı' }),
      });
      if (!response.ok) throw new Error('Onaylama başarısız');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      toast.success('Belge onaylandı');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/admin/archive/documents/${documentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: 'Uygun değil' }),
      });
      if (!response.ok) throw new Error('Reddetme başarısız');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archive'] });
      toast.success('Belge reddedildi');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Fetch document stats
  const { data: stats } = useQuery<ArchiveStats>({
    queryKey: ['archive', 'stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/admin/archive/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('İstatistikler alınamadı');
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch document list
  const { data: paginatedData, isLoading, error } = useQuery<PaginatedDocumentResponse>({
    queryKey: ['archive', 'list', page, search, category, categoryFilter, statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      
      // ✅ Prop'tan gelen category veya manuel filter kullan
      const activeCategory = category || categoryFilter;
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
        ...(search && { search }),
        ...(activeCategory && { category: activeCategory }),
        ...(statusFilter && { status: statusFilter }),
      });
      
      const response = await fetch(`http://localhost:8000/api/v1/admin/archive/documents?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Belgeler alınamadı');
      const result = await response.json();
      
      return {
        items: result.data.items || [],
        total: result.data.total || 0,
        page: result.data.page || page,
        page_size: result.data.page_size || 20,
        total_pages: Math.ceil((result.data.total || 0) / 20),
      };
    },
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Onay Bekliyor
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Onaylandı
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Reddedildi
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-red-600 border-red-600">
            <AlertTriangle className="h-3 w-3" />
            Süresi Doldu
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      WORK_ORDER: 'İş Emri',
      EMPLOYEE: 'Personel',
      VEHICLE: 'Araç',
      MOTORBOT: 'Motorbot',
      CARI: 'Cari',
      GENERAL: 'Genel',
    };
    return labels[category] || category;
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Belge Listesi</h2>
        </div>
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Toplam Belge</p>
              <p className="text-2xl font-bold">{stats.total_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Onay Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.uploaded_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Onaylı</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Reddedildi</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Yakında Doluyor</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiring_soon_count}</p>
            </div>
          </div>
        )}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="h-10 w-full animate-pulse bg-gray-100 rounded mb-3" />
        </div>
        <TableSkeleton columns={8} rows={8} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={(error as Error).message} />;
  }

  if (!paginatedData || paginatedData.items.length === 0) {
    return (
      <div className="space-y-4">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Toplam Belge</p>
              <p className="text-2xl font-bold">{stats.total_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Onay Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.uploaded_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Onaylı</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Reddedildi</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected_count}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Yakında Doluyor</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiring_soon_count}</p>
            </div>
          </div>
        )}
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2">
            {search || categoryFilter || statusFilter
              ? 'Arama sonucu bulunamadı'
              : 'Henüz belge bulunmuyor'}
          </p>
          <p className="text-sm text-gray-400 mb-4">Yeni belge yüklemek için butonu kullanın</p>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Belge Yükle
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Belge Listesi</h2>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Belge Yükle
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Toplam Belge</p>
            <p className="text-2xl font-bold">{stats.total_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Onay Bekleyen</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.uploaded_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Onaylı</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Reddedildi</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected_count}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Yakında Doluyor</p>
            <p className="text-2xl font-bold text-orange-600">{stats.expiring_soon_count}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ara</label>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Dosya adı, açıklama..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              <option value="WORK_ORDER">İş Emri</option>
              <option value="EMPLOYEE">Personel</option>
              <option value="VEHICLE">Araç</option>
              <option value="MOTORBOT">Motorbot</option>
              <option value="CARI">Cari</option>
              <option value="GENERAL">Genel</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              <option value="UPLOADED">Onay Bekliyor</option>
              <option value="APPROVED">Onaylı</option>
              <option value="REJECTED">Reddedildi</option>
              <option value="EXPIRED">Süresi Doldu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dosya Adı</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Belge Tipi</TableHead>
              <TableHead>Boyut</TableHead>
              <TableHead>Yüklenme</TableHead>
              <TableHead>Son Geçerlilik</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.items.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    {doc.file_name}
                  </div>
                </TableCell>
                <TableCell>{getCategoryLabel(doc.category)}</TableCell>
                <TableCell className="text-sm">{doc.document_type}</TableCell>
                <TableCell className="text-sm">{formatFileSize(doc.file_size)}</TableCell>
                <TableCell className="text-sm">
                  {new Date(doc.uploaded_at).toLocaleDateString('tr-TR')}
                </TableCell>
                <TableCell className="text-sm">
                  {doc.expires_at ? (
                    <span
                      className={
                        new Date(doc.expires_at) < new Date()
                          ? 'text-red-600 font-medium'
                          : new Date(doc.expires_at) <
                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          ? 'text-orange-600 font-medium'
                          : ''
                      }
                    >
                      {new Date(doc.expires_at).toLocaleDateString('tr-TR')}
                    </span>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" title="Önizle">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="İndir">
                      <Download className="h-4 w-4" />
                    </Button>
                    {doc.status === 'UPLOADED' && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => approveMutation.mutate(doc.id)}
                          disabled={approveMutation.isPending}
                          title="Onayla"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => rejectMutation.mutate(doc.id)}
                          disabled={rejectMutation.isPending}
                          title="Reddet"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <SimplePagination
        currentPage={paginatedData.page}
        totalPages={paginatedData.total_pages}
        onPageChange={setPage}
      />
    </div>
  );
}
