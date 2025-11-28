import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { portalTokenStorage } from '../utils/portalTokenStorage';

const PORTAL_API_BASE = 'http://localhost:8000/api/v1/portal';

interface SgkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedPeriod?: string; // YYYY-MM formatında önerilen dönem
  onUploadSuccess?: () => void;
}

interface UploadResult {
  period: string;
  matched_employee_count: number;
  missing_employee_count: number;
  extra_in_sgk_count: number;
  status: string;
}

export function SgkUploadDialog({ 
  open, 
  onOpenChange, 
  suggestedPeriod,
  onUploadSuccess 
}: SgkUploadDialogProps) {
  const [sgkPeriod, setSgkPeriod] = useState(suggestedPeriod || '');
  const [sgkFile, setSgkFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog açıldığında önerilen dönemi set et
  React.useEffect(() => {
    if (open && suggestedPeriod) {
      setSgkPeriod(suggestedPeriod);
    }
  }, [open, suggestedPeriod]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Sadece PDF dosyaları yüklenebilir');
      event.target.value = '';
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      toast.error('Dosya boyutu 10MB\'dan büyük olamaz');
      event.target.value = '';
      return;
    }

    setSgkFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Sadece PDF dosyaları yüklenebilir');
      return;
    }

    setSgkFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const resetForm = () => {
    setSgkPeriod(suggestedPeriod || '');
    setSgkFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!sgkPeriod) {
      toast.error('Lütfen SGK dönemini seçin');
      return;
    }

    if (!sgkFile) {
      toast.error('Lütfen SGK hizmet PDF dosyasını seçin');
      return;
    }

    const token = portalTokenStorage.getToken();
    if (!token) {
      toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    // Format kontrolü
    if (!/^\d{4}-\d{2}$/.test(sgkPeriod)) {
      toast.error('Geçerli bir dönem seçin (YYYY-MM formatında)');
      return;
    }

    const formData = new FormData();
    formData.append('period', sgkPeriod);
    formData.append('file', sgkFile);

    setIsUploading(true);
    try {
      const response = await fetch(`${PORTAL_API_BASE}/documents/sgk-hizmet-yukle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMessage = 'SGK hizmet listesi yüklenemedi';
        
        if (payload?.detail?.error?.message) {
          errorMessage = payload.detail.error.message;
        } else if (payload?.detail?.message) {
          errorMessage = payload.detail.message;
        } else if (payload?.detail && typeof payload.detail === 'string') {
          errorMessage = payload.detail;
        } else if (payload?.message) {
          errorMessage = payload.message;
        }
        
        toast.error(errorMessage, {
          duration: 6000,
          description: payload?.detail?.error?.details ? 
            `PDF dönemi: ${payload.detail.error.details.pdf_period || '-'}, Seçilen: ${payload.detail.error.details.selected_period || '-'}` 
            : undefined
        });
        throw new Error(errorMessage);
      }

      toast.success(payload?.message || 'SGK hizmet listesi başarıyla yüklendi', {
        duration: 5000,
      });
      
      setUploadResult(payload?.data || null);
      
      // Çalışan listesini yenile
      window.dispatchEvent(new CustomEvent('portal:employees:refresh'));
      
      // Callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // 3 saniye sonra dialog'u kapat
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 3000);

    } catch (error: any) {
      console.error('SGK upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            SGK Hizmet Listesi Yükle
          </DialogTitle>
          <DialogDescription>
            SGK hizmet PDF'inizi yükleyerek çalışan kartlarınızın son dönem durumunu otomatik güncelleyin.
          </DialogDescription>
        </DialogHeader>

        {!uploadResult ? (
          <div className="space-y-4">
            {/* Dönem Seçici */}
            <div>
              <Label htmlFor="sgk-period">SGK Dönemi *</Label>
              <Input
                id="sgk-period"
                type="month"
                value={sgkPeriod}
                onChange={(e) => setSgkPeriod(e.target.value)}
                placeholder="YYYY-MM"
                disabled={isUploading}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Örn: 2024-11 formatında
                {suggestedPeriod && (
                  <span className="text-blue-600 font-medium"> (Önerilen: {suggestedPeriod})</span>
                )}
              </p>
            </div>

            {/* PDF Upload Alanı */}
            <div>
              <Label>PDF Dosyası *</Label>
              <div
                className={`
                  mt-2 border-2 border-dashed rounded-lg p-8 text-center
                  transition-colors cursor-pointer
                  ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                  ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                
                {sgkFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{sgkFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(sgkFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">
                      PDF dosyasını buraya sürükleyin veya tıklayın
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Maksimum 10 MB, sadece PDF
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Yükleme Butonu */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleUpload}
                disabled={!sgkPeriod || !sgkFile || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    SGK Listesini Yükle
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                İptal
              </Button>
            </div>
          </div>
        ) : (
          /* Yükleme Sonucu */
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
              <CheckCircle2 className="h-8 w-8" />
              <span className="text-lg font-semibold">Yükleme Başarılı</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {uploadResult.matched_employee_count}
                </div>
                <div className="text-sm text-green-600 mt-1">Eşleşen Personel</div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-700">
                  {uploadResult.missing_employee_count}
                </div>
                <div className="text-sm text-amber-600 mt-1">Eksik (Bizde Var)</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {uploadResult.extra_in_sgk_count}
                </div>
                <div className="text-sm text-blue-600 mt-1">Fazla (SGK'da Var)</div>
              </div>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Dönem:</span> {uploadResult.period?.slice(0, 4)}-{uploadResult.period?.slice(4, 6)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Çalışan kartlarınız otomatik olarak güncellendi.
              </p>
            </div>

            <p className="text-center text-sm text-gray-500">
              Bu pencere 3 saniye içinde otomatik kapanacak...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
