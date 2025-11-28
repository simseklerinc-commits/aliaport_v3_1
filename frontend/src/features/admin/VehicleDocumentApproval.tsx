import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  AlertCircle, 
  Loader2, 
  Bell,
  Filter,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { FilePreviewModal } from './FilePreviewModal';

const API_BASE_URL = 'http://localhost:8000';

interface PendingDocument {
  id: number;
  vehicle_id: number;
  vehicle_plaka: string;
  cari_id: number;
  cari_name: string;
  doc_type_code: string;
  doc_type_name: string;
  uploaded_at: string;
  file_storage_key: string | null;
  expiry_date: string | null;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  missing: number;
  total: number;
}

export function VehicleDocumentApprovalPanel() {
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PendingDocument | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // File preview state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFileKey, setPreviewFileKey] = useState<string>('');
  const [previewFileName, setPreviewFileName] = useState<string>('');

  // Filtreler
  const [filterCari, setFilterCari] = useState<string>('');
  const [filterDocType, setFilterDocType] = useState<string>('ALL');

  useEffect(() => {
    fetchPendingDocuments();
    fetchStats();
    
    // Her 30 saniyede bir yenile
    const interval = setInterval(() => {
      fetchPendingDocuments();
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPendingDocuments = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token'); // TODO: Admin token storage
      const params = new URLSearchParams();
      if (filterCari) params.append('cari_id', filterCari);
      if (filterDocType && filterDocType !== 'ALL') {
        params.append('doc_type_code', filterDocType);
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/vehicles/documents/pending?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setDocuments(response.data.items);
    } catch (error: any) {
      console.error('Pending documents fetch error:', error);
      toast.error('Evraklar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/vehicles/documents/stats`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedDoc) return;

    setProcessingId(selectedDoc.id);
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `${API_BASE_URL}/api/v1/admin/vehicles/documents/${selectedDoc.id}/approve`,
        { expiry_date: expiryDate || null },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(`${selectedDoc.doc_type_name} onaylandı`);
      setApproveDialogOpen(false);
      setExpiryDate('');
      setSelectedDoc(null);
      fetchPendingDocuments();
      fetchStats();
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(error.response?.data?.detail || 'Onaylama başarısız');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedDoc || !rejectReason.trim()) {
      toast.error('Red nedeni yazmalısınız (en az 5 karakter)');
      return;
    }

    setProcessingId(selectedDoc.id);
    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `${API_BASE_URL}/api/v1/admin/vehicles/documents/${selectedDoc.id}/reject`,
        { reject_reason: rejectReason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(`${selectedDoc.doc_type_name} reddedildi`);
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedDoc(null);
      fetchPendingDocuments();
      fetchStats();
    } catch (error: any) {
      console.error('Reject error:', error);
      toast.error(error.response?.data?.detail || 'Reddetme başarısız');
    } finally {
      setProcessingId(null);
    }
  };

  const openApproveDialog = (doc: PendingDocument) => {
    setSelectedDoc(doc);
    setApproveDialogOpen(true);
  };

  const openRejectDialog = (doc: PendingDocument) => {
    setSelectedDoc(doc);
    setRejectDialogOpen(true);
  };

  const openPreviewModal = (doc: PendingDocument) => {
    if (!doc.file_storage_key) {
      toast.error('Dosya bulunamadı');
      return;
    }
    setPreviewFileKey(doc.file_storage_key);
    setPreviewFileName(`${doc.doc_type_name} - ${doc.vehicle_plaka}`);
    setPreviewModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Araç Evrakları Onay Merkezi</h1>
          <p className="text-gray-600 mt-1">Firmaların yüklediği evrakları inceleyin ve onaylayın</p>
        </div>
        <div className="flex items-center gap-3">
          {stats && stats.pending > 0 && (
            <Badge className="bg-orange-500 text-white px-4 py-2 text-base">
              <Bell className="h-4 w-4 mr-2" />
              {stats.pending} Onay Bekliyor
            </Badge>
          )}
          <Button onClick={() => { fetchPendingDocuments(); fetchStats(); }} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      {stats && (
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-sm text-gray-600 mt-1">Onay Bekliyor</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-sm text-gray-600 mt-1">Onaylı</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-sm text-gray-600 mt-1">Reddedildi</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">{stats.expired}</div>
                <div className="text-sm text-gray-600 mt-1">Süresi Doldu</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">{stats.missing}</div>
                <div className="text-sm text-gray-600 mt-1">Eksik</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Firma Adı</Label>
              <Input
                placeholder="Firma adı ara..."
                value={filterCari}
                onChange={(e) => setFilterCari(e.target.value)}
              />
            </div>
            <div>
              <Label>Evrak Tipi</Label>
              <Select value={filterDocType} onValueChange={setFilterDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tümü</SelectItem>
                  <SelectItem value="RUHSAT">Ruhsat</SelectItem>
                  <SelectItem value="MUAYENE">Muayene</SelectItem>
                  <SelectItem value="TRAFIK">Trafik Sigortası</SelectItem>
                  <SelectItem value="KASKO">Kasko</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchPendingDocuments} className="w-full">
                Filtrele
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onay Bekleyen Evraklar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Onay Bekleyen Evraklar ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="text-lg font-medium">Harika! Onay bekleyen evrak yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <FileText className="h-6 w-6 text-orange-600 mt-1" />
                    <div className="flex-1">
                      <div className="font-semibold text-lg text-gray-900">
                        {doc.doc_type_name}
                      </div>
                      <div className="text-sm text-gray-700 mt-1 space-y-0.5">
                        <div><span className="font-medium">Firma:</span> {doc.cari_name}</div>
                        <div><span className="font-medium">Plaka:</span> {doc.vehicle_plaka}</div>
                        <div><span className="font-medium">Yüklenme:</span> {new Date(doc.uploaded_at).toLocaleString('tr-TR')}</div>
                        {doc.expiry_date && (
                          <div><span className="font-medium">Geçerlilik:</span> {new Date(doc.expiry_date).toLocaleDateString('tr-TR')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreviewModal(doc)}
                      disabled={!doc.file_storage_key}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Görüntüle
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openRejectDialog(doc)}
                      disabled={processingId === doc.id}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reddet
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => openApproveDialog(doc)}
                      disabled={processingId === doc.id}
                    >
                      {processingId === doc.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Onayla
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onaylama Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Evrakı Onayla
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900">{selectedDoc.doc_type_name}</p>
                <p className="text-sm text-gray-600 mt-1">Firma: {selectedDoc.cari_name}</p>
                <p className="text-sm text-gray-600">Plaka: {selectedDoc.vehicle_plaka}</p>
              </div>
              
              {['MUAYENE', 'TRAFIK'].includes(selectedDoc.doc_type_code) && (
                <div>
                  <Label htmlFor="approve-expiry">Geçerlilik Bitiş Tarihi (Opsiyonel)</Label>
                  <Input
                    id="approve-expiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Boş bırakılırsa belgede yazılı tarih kullanılır
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
              disabled={processingId !== null}
            >
              {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reddetme Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Evrakı Reddet
            </DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900">{selectedDoc.doc_type_name}</p>
                <p className="text-sm text-gray-600 mt-1">Firma: {selectedDoc.cari_name}</p>
                <p className="text-sm text-gray-600">Plaka: {selectedDoc.vehicle_plaka}</p>
              </div>
              
              <div>
                <Label htmlFor="reject-reason">Red Nedeni *</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Evrakın neden reddedildiğini açıklayın (en az 5 karakter)..."
                  className="mt-1 min-h-24"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={processingId !== null || rejectReason.trim().length < 5}
            >
              {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      {previewModalOpen && (
        <FilePreviewModal
          fileStorageKey={previewFileKey}
          fileName={previewFileName}
          onClose={() => setPreviewModalOpen(false)}
        />
      )}
    </div>
  );
}
