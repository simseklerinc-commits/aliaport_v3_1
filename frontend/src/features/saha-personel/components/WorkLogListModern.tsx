/**
 * SAHA PERSONEL MODULE - Modern WorkLog List Component
 * 
 * React Query hooks kullanarak geçmiş WorkLog kayıtlarını listeler
 * - Pagination desteği
 * - Search, filter (personnel_name, work_order_id, is_approved)
 * - Backend API: GET /api/worklog/, GET /api/worklog/stats
 * 
 * @see backend/aliaport_api/modules/saha/router.py
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SimplePagination } from '../../../shared/ui/Pagination';
import { TableSkeleton } from '../../../shared/ui/Skeleton';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import { Badge } from '../../../components/ui/badge';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

interface WorkLog {
  id: number;
  work_order_id?: number;
  sefer_id?: number;
  personnel_name: string;
  service_type: string;
  quantity?: number;
  time_start: string;
  time_end?: string;
  duration_minutes?: number;
  notes?: string;
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

interface WorkLogStats {
  total_logs: number;
  pending_approval: number;
  approved: number;
  total_hours: number;
  by_personnel: Record<string, number>;
  by_service_type: Record<string, number>;
}

interface PaginatedWorkLogResponse {
  items: WorkLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export function WorkLogListModern() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<string>('');

  // Fetch WorkLog list
  const { data: paginatedData, isLoading, error } = useQuery<PaginatedWorkLogResponse>({
    queryKey: ['worklog', 'list', page, search, approvalFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', '20');
      if (search) params.append('personnel_name', search);
      if (approvalFilter) params.append('is_approved', approvalFilter);

      const response = await fetch(`/api/worklog/?${params}`);
      if (!response.ok) throw new Error('WorkLog listesi alınamadı');
      return response.json();
    },
  });

  // Fetch WorkLog stats
  const { data: stats } = useQuery<WorkLogStats>({
    queryKey: ['worklog', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/worklog/stats');
      if (!response.ok) throw new Error('İstatistikler alınamadı');
      return response.json();
    },
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (value: string) => {
    setApprovalFilter(value);
    setPage(1);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}s ${mins}dk` : `${mins}dk`;
  };

  const getApprovalBadge = (isApproved?: boolean) => {
    if (isApproved === undefined || isApproved === null) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Bekliyor
        </Badge>
      );
    }
    if (isApproved) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Onaylandı
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Reddedildi
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Çalışma Kayıtları</h2>
        </div>
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Toplam Kayıt</p>
              <p className="text-2xl font-bold">{stats.total_logs}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Onay Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending_approval}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Onaylandı</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-600">Toplam Süre</p>
              <p className="text-2xl font-bold">{stats.total_hours.toFixed(1)}s</p>
            </div>
          </div>
        )}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="h-10 w-full animate-pulse bg-gray-100 rounded mb-3" />
        </div>
        <TableSkeleton columns={7} rows={8} />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={(error as Error).message} />;
  }

  if (!paginatedData || paginatedData.items.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-2">
          {search || approvalFilter ? 'Arama sonucu bulunamadı' : 'Henüz çalışma kaydı bulunmuyor'}
        </p>
        <p className="text-sm text-gray-400">
          Saha personeli görevlerini tamamladığında burada görünecek
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Çalışma Kayıtları</h2>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Toplam Kayıt</p>
            <p className="text-2xl font-bold">{stats.total_logs}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Onay Bekleyen</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending_approval}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Onaylandı</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Toplam Süre</p>
            <p className="text-2xl font-bold">{stats.total_hours.toFixed(1)}s</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personel Ara</label>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Personel adı..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Approval Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Onay Durumu</label>
            <select
              value={approvalFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              <option value="true">Onaylı</option>
              <option value="false">Reddedildi</option>
              <option value="null">Onay Bekliyor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Personel</TableHead>
              <TableHead>Hizmet</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead>Başlangıç</TableHead>
              <TableHead>Bitiş</TableHead>
              <TableHead>Süre</TableHead>
              <TableHead>Onay</TableHead>
              <TableHead>Not</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.items.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.personnel_name}</TableCell>
                <TableCell>{log.service_type}</TableCell>
                <TableCell>{log.quantity || '-'}</TableCell>
                <TableCell className="text-sm">
                  {new Date(log.time_start).toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell className="text-sm">
                  {log.time_end
                    ? new Date(log.time_end).toLocaleString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    {formatDuration(log.duration_minutes)}
                  </div>
                </TableCell>
                <TableCell>{getApprovalBadge(log.is_approved)}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-gray-600">
                  {log.notes || '-'}
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
