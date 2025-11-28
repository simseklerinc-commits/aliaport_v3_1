/**
 * BELGE İNCELEME UI - Admin
 * PDF preview, onay/red workflow, not ekleme
 * 
 * RUNBOOK REF: ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART3B
 * API: PUT /api/archive/{id}/approve, PUT /api/archive/{id}/reject
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Calendar,
  User,
  Building2,
  Filter,
  Search,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { toast } from 'sonner';

// Interfaces
interface Document {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  document_type: string;
  status: 'UPLOADED' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  work_order_id?: number;
  wo_number?: string;
  cari_title?: string;
  uploaded_at: string;
  uploaded_by_name?: string;
  approved_at?: string;
  approved_by_name?: string;
  rejected_at?: string;
  rejected_by_name?: string;
  rejection_reason?: string;
  description?: string;
  issue_date?: string;
  expires_at?: string;
}

export function DocumentReview() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('UPLOADED');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [documents, statusFilter, categoryFilter, searchQuery]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // API call - gerçek endpoint'e göre ayarlanacak
      const response = await fetch('/api/portal/documents?limit=100', {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Belgeler yüklenemedi');

      const data = await response.json();
      
      // Mock data for development
      const mockDocs: Document[] = [
        {
          id: 1,
          file_name: 'src5_certificate.pdf',
          file_path: '/uploads/ship/src5_certificate.pdf',
          file_size: 245678,
          file_type: 'application/pdf',
          category: 'SHIP',
          document_type: 'SRC5',
          status: 'UPLOADED',
          work_order_id: 123,
          wo_number: 'WO202511-001',
          cari_title: 'ABC Denizcilik',
          uploaded_at: '2025-11-25T10:30:00',
          uploaded_by_name: 'Mehmet Yılmaz',
          description: 'Gemi SRC-5 sertifikası',
          issue_date: '2025-01-15',
          expires_at: '2026-01-15',
        },
        {
          id: 2,
          file_name: 'invoice_november.pdf',
          file_path: '/uploads/invoice/invoice_november.pdf',
          file_size: 123456,
          file_type: 'application/pdf',
          category: 'INVOICE',
          document_type: 'PROFORMA',
          status: 'APPROVED',
          work_order_id: 124,
          wo_number: 'WO202511-002',
          cari_title: 'XYZ Shipping',
          uploaded_at: '2025-11-24T14:20:00',
          approved_at: '2025-11-24T15:30:00',
          approved_by_name: 'Admin User',
          uploaded_by_name: 'Ali Demir',
        },
        {
          id: 3,
          file_name: 'vehicle_insurance.pdf',
          file_path: '/uploads/vehicle/vehicle_insurance.pdf',
          file_size: 98765,
          file_type: 'application/pdf',
          category: 'VEHICLE',
          document_type: 'ARAC_SIGORTA',
          status: 'REJECTED',
          uploaded_at: '2025-11-23T09:15:00',
          rejected_at: '2025-11-23T11:00:00',
          rejected_by_name: 'Admin User',
          rejection_reason: 'Belge süresi dolmuş, güncel sigorta belgesi gerekli',
          uploaded_by_name: 'Ayşe Kaya',
        },
      ];

      setDocuments(data.documents || mockDocs);
      toast.success(`${mockDocs.length} belge yüklendi`);
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = documents;

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.file_name.toLowerCase().includes(query) ||
          doc.wo_number?.toLowerCase().includes(query) ||
          doc.cari_title?.toLowerCase().includes(query)
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleApprove = async () => {
    if (!selectedDocument) return;

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('approved_by_id', '1'); // Mock user ID
      if (approvalNote) {
        formData.append('approval_note', approvalNote);
      }

      const response = await fetch(`/api/archive/${selectedDocument.id}/approve`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Onaylama başarısız');

      toast.success(`${selectedDocument.file_name} onaylandı`);
      
      // Update local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === selectedDocument.id
            ? { ...doc, status: 'APPROVED' as const, approved_at: new Date().toISOString() }
            : doc
        )
      );

      setShowApproveDialog(false);
      setApprovalNote('');
      setSelectedDocument(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDocument) return;

    if (!rejectionReason || rejectionReason.length < 10) {
      toast.error('Red sebebi en az 10 karakter olmalıdır');
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('rejected_by_id', '1'); // Mock user ID
      formData.append('rejection_reason', rejectionReason);

      const response = await fetch(`/api/archive/${selectedDocument.id}/reject`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Reddetme başarısız');

      toast.success(`${selectedDocument.file_name} reddedildi`);
      
      // Update local state
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === selectedDocument.id
            ? {
                ...doc,
                status: 'REJECTED' as const,
                rejected_at: new Date().toISOString(),
                rejection_reason: rejectionReason,
              }
            : doc
        )
      );

      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedDocument(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADED':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Onay Bekliyor
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Onaylandı
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Reddedildi
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge className="bg-gray-100 text-gray-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Süresi Doldu
          </Badge>
        );
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      SHIP: 'Gemi Belgeleri',
      PERSONNEL: 'Personel',
      VEHICLE: 'Araç',
      INVOICE: 'Fatura',
      CONTRACT: 'Sözleşme',
      OTHER: 'Diğer',
    };
    return labels[category] || category;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Belge İnceleme</h1>
        <p className="text-gray-600 mt-2">Yüklenen belgeleri inceleyin, onaylayın veya reddedin</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">Durum</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tümü</SelectItem>
                  <SelectItem value="UPLOADED">Onay Bekliyor</SelectItem>
                  <SelectItem value="APPROVED">Onaylandı</SelectItem>
                  <SelectItem value="REJECTED">Reddedildi</SelectItem>
                  <SelectItem value="EXPIRED">Süresi Doldu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tümü</SelectItem>
                  <SelectItem value="SHIP">Gemi</SelectItem>
                  <SelectItem value="PERSONNEL">Personel</SelectItem>
                  <SelectItem value="VEHICLE">Araç</SelectItem>
                  <SelectItem value="INVOICE">Fatura</SelectItem>
                  <SelectItem value="CONTRACT">Sözleşme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="search">Arama</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Dosya adı, WO numarası, müşteri..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Belgeler yükleniyor...</p>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">Belge bulunamadı</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{doc.file_name}</h3>
                        {getStatusBadge(doc.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span className="truncate">{doc.cari_title || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{doc.wo_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          <span>{getCategoryLabel(doc.category)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(doc.uploaded_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>

                      {doc.description && (
                        <p className="text-sm text-muted-foreground mb-2">{doc.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Yükleyen: {doc.uploaded_by_name}</span>
                        <span>Boyut: {(doc.file_size / 1024).toFixed(1)} KB</span>
                        {doc.expires_at && (
                          <span className="text-orange-600 font-medium">
                            Son Geçerlilik: {new Date(doc.expires_at).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </div>

                      {doc.status === 'APPROVED' && doc.approved_at && (
                        <div className="mt-2 text-xs text-green-600">
                          ✓ Onaylayan: {doc.approved_by_name} - {new Date(doc.approved_at).toLocaleString('tr-TR')}
                        </div>
                      )}

                      {doc.status === 'REJECTED' && doc.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <strong>Red Sebebi:</strong> {doc.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedDocument(doc);
                        setShowPreview(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      İncele
                    </Button>

                    {doc.status === 'UPLOADED' && (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowApproveDialog(true);
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Onayla
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowRejectDialog(true);
                          }}
                          size="sm"
                          variant="destructive"
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Reddet
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.file_name}</DialogTitle>
            <DialogDescription>
              {selectedDocument?.cari_title} - {selectedDocument?.wo_number}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {selectedDocument?.file_type === 'application/pdf' ? (
              <div className="bg-gray-100 rounded-lg p-4 h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg mb-4">PDF Preview</p>
                  <p className="text-sm text-muted-foreground mb-4">{selectedDocument.file_name}</p>
                  <Button asChild>
                    <a href={selectedDocument.file_path} download>
                      <Download className="h-4 w-4 mr-2" />
                      İndir
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 h-[600px] flex items-center justify-center">
                <img
                  src={selectedDocument?.file_path}
                  alt={selectedDocument?.file_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Belgeyi Onayla
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.file_name} dosyasını onaylamak üzeresiniz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approvalNote">Onay Notu (Opsiyonel)</Label>
              <Textarea
                id="approvalNote"
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Onay ile ilgili not ekleyebilirsiniz..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              İptal
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Onaylanıyor...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Onayla
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Belgeyi Reddet
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.file_name} dosyasını reddetmek üzeresiniz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">
                Red Sebebi <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Red sebebini açıklayın (en az 10 karakter)..."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {rejectionReason.length}/10 minimum karakter
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              İptal
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing || rejectionReason.length < 10}
              variant="destructive"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reddediliyor...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reddet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
