import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { portalTokenStorage } from '../utils/portalTokenStorage';
import axios from 'axios';
import { PORTAL_API_BASE } from '../config';

interface VehicleDocumentsPanelProps {
  vehicleId: number | null;
  open: boolean;
  onClose: () => void;
}

interface DocumentType {
  code: string;
  name: string;
  is_required: boolean;
  validity_days: number | null;
}

interface VehicleDocument {
  id: number;
  doc_type_code: string;
  doc_type_name: string;
  status: 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  file_storage_key: string | null;
  uploaded_at: string | null;
  expiry_date: string | null;
  reject_reason: string | null;
  has_file: boolean;
  is_required: boolean;
}

interface DocumentsSummary {
  total_required: number;
  missing_count: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  expired_count: number;
  vehicle_status: string;
}

interface DocumentsResponse {
  summary: DocumentsSummary;
  documents: VehicleDocument[];
}

export function VehicleDocumentsPanel({ vehicleId, open, onClose }: VehicleDocumentsPanelProps) {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [summary, setSummary] = useState<DocumentsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [expiryDates, setExpiryDates] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open && vehicleId) {
      fetchDocuments();
    }
  }, [open, vehicleId]);

  const fetchDocuments = async () => {
    if (!vehicleId) return;

    setIsLoading(true);
    try {
      const token = portalTokenStorage.getToken();
      const response = await axios.get<DocumentsResponse>(
        `${PORTAL_API_BASE}/vehicles/${vehicleId}/documents`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setDocuments(response.data.documents);
      setSummary(response.data.summary);
    } catch (error: any) {
      console.error('Evrak listesi yüklenemedi:', error);
      toast.error('Evrak bilgileri yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (docTypeCode: string, docTypeName: string) => {
    const fileInput = fileInputRefs.current[docTypeCode];
    if (!fileInput) return;

    const file = fileInput.files?.[0];
    if (!file) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    // PDF veya resim kontrolü
    if (!file.type.match(/^(application\/pdf|image\/.*)/)) {
      toast.error('Sadece PDF veya resim dosyası yükleyebilirsiniz');
      return;
    }

    setUploadingDoc(docTypeCode);

    try {
      const token = portalTokenStorage.getToken();
      const formData = new FormData();
      formData.append('file', file);

      // Eğer expiry_date varsa ekle
      const expiryDate = expiryDates[docTypeCode];
      if (expiryDate) {
        formData.append('expiry_date', expiryDate);
      }

      await axios.post(
        `${PORTAL_API_BASE}/vehicles/${vehicleId}/documents/${docTypeCode}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success(`${docTypeName} yükleme işlemi alındı. Onay bekliyor.`);
      
      // Listeyi yenile
      await fetchDocuments();
      
      // Input'u temizle
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Tarih inputunu temizle
      setExpiryDates(prev => {
        const newDates = { ...prev };
        delete newDates[docTypeCode];
        return newDates;
      });
    } catch (error: any) {
      console.error('Dosya yükleme hatası:', error);
      toast.error(error.response?.data?.detail || 'Dosya yüklenemedi');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleViewDocument = (doc: VehicleDocument) => {
    if (!doc.has_file || !doc.file_storage_key) {
      toast.info('Dosya henüz yüklenmemiş');
      return;
    }

    // Şimdilik placeholder - ileride dosya indirme endpoint'i eklenecek
    console.log('Dosya görüntüleme:', doc.file_storage_key);
    toast.info('Dosya görüntüleme özelliği yakında eklenecek');
  };

  // Evrakları gruplara ayır - HER belge için yükleme butonu gösterilecek
  const missingDocs = documents.filter(
    d => ['MISSING', 'EXPIRED', 'REJECTED'].includes(d.status)
  );
  const approvedDocs = documents.filter(d => d.status === 'APPROVED');
  const pendingDocs = documents.filter(d => d.status === 'PENDING');
  const docOrder = ['RUHSAT', 'MUAYENE', 'TRAFIK', 'KASKO'];
  const allDocs = [...documents].sort((a, b) => {
    const aIndex = docOrder.indexOf(a.doc_type_code);
    const bIndex = docOrder.indexOf(b.doc_type_code);
    if (aIndex === -1 && bIndex === -1) return a.doc_type_name.localeCompare(b.doc_type_name);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-6 w-6" />
            Araç Evrakları
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {summary && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <p className="text-sm text-emerald-200 font-medium">Onaylı Evrak</p>
                  <p className="text-4xl font-bold text-white mt-1">{summary.approved_count}</p>
                </div>
                <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4">
                  <p className="text-sm text-orange-200 font-medium">Onay Bekliyor</p>
                  <p className="text-4xl font-bold text-white mt-1">{summary.pending_count}</p>
                </div>
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
                  <p className="text-sm text-red-200 font-medium">Eksik Evrak</p>
                  <p className="text-4xl font-bold text-white mt-1">{summary.missing_count}</p>
                </div>
              </div>
            )}

            <Card className="bg-slate-900/60 border border-slate-800">
              <CardContent>
                <div className="space-y-3">
                  {allDocs.map((doc) => {
                    const displayName = doc.doc_type_code === 'KASKO' ? 'Araç Kasko Poliçesi' : doc.doc_type_name;
                    const statusLabel = (
                      {
                        APPROVED: 'Onaylı',
                        PENDING: 'Onay Bekliyor',
                        MISSING: 'Yüklenmedi',
                        REJECTED: 'Reddedildi',
                        EXPIRED: 'Süresi Doldu'
                      } as Record<string, string>
                    )[doc.status] || doc.status;

                    const statusStyles = (
                      {
                        APPROVED: 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/40',
                        PENDING: 'bg-orange-500/10 text-orange-200 border border-orange-500/40',
                        MISSING: 'bg-gray-500/10 text-gray-200 border border-gray-500/40',
                        REJECTED: 'bg-red-500/10 text-red-200 border border-red-500/40',
                        EXPIRED: 'bg-red-500/10 text-red-200 border border-red-500/40'
                      } as Record<string, string>
                    )[doc.status] || 'bg-gray-500/10 text-gray-200 border border-gray-500/40';

                    const requiresExpiry = ['MUAYENE', 'TRAFIK', 'KASKO'].includes(doc.doc_type_code);

                    return (
                      <div key={doc.id} className="rounded-xl bg-slate-900/40 border border-slate-800 p-4 flex flex-wrap gap-4 items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-white">{displayName}</p>
                          <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                            {doc.has_file ? 'Yüklendi' : 'Yüklenmedi'}
                            <Badge className={statusStyles}>{statusLabel}</Badge>
                          </p>
                          {doc.uploaded_at && (
                            <p className="text-xs text-gray-500 mt-1">Yükleme tarihi: {new Date(doc.uploaded_at).toLocaleDateString('tr-TR')}</p>
                          )}
                          {doc.reject_reason && (
                            <p className="text-xs text-red-300 mt-1">Red nedeni: {doc.reject_reason}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {requiresExpiry && (
                            <div className="flex flex-col text-xs text-gray-400">
                              <span>Bitiş Tarihi</span>
                              <Input
                                type="date"
                                value={expiryDates[doc.doc_type_code] || ''}
                                onChange={(e) => setExpiryDates((prev) => ({ ...prev, [doc.doc_type_code]: e.target.value }))}
                                className="bg-slate-800 border-slate-700 text-white h-9"
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              ref={(el) => (fileInputRefs.current[doc.doc_type_code] = el)}
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={() => handleFileUpload(doc.doc_type_code, doc.doc_type_name)}
                            />
                            {doc.has_file && (
                              <Button
                                variant="ghost"
                                onClick={() => handleViewDocument(doc)}
                                className="text-gray-300 hover:text-white"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => fileInputRefs.current[doc.doc_type_code]?.click()}
                              disabled={uploadingDoc === doc.doc_type_code}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white"
                            >
                              {uploadingDoc === doc.doc_type_code ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                              <span className="ml-2">Yükle</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {pendingDocs.length > 0 && (
              <div className="text-sm text-orange-200 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {pendingDocs.length} evrak onay bekliyor
              </div>
            )}

            {documents.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Bu araç için evrak bilgisi bulunmuyor
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
