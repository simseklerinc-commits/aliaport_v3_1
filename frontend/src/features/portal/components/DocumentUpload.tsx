/**
 * BELGE UPLOAD COMPONENT
 * Drag & drop, multiple file, progress bar, validation
 * 
 * RUNBOOK REF: ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART3B
 * API: POST /api/portal/documents/upload
 */

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  File,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { portalTokenStorage } from '../utils/portalTokenStorage';
import { PORTAL_API_BASE } from '../config';

// Interfaces
interface UploadFile {
  id: string;
  file: File;
  category: string;
  documentType: string;
  description: string;
  issueDate?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface DocumentUploadProps {
  workOrderId?: number;
  onUploadComplete?: (documentId: number) => void;
  maxFiles?: number;
  maxFileSize?: number; // MB
}

// Belge Kategorileri
const DOCUMENT_CATEGORIES = [
  { value: 'SHIP', label: 'Gemi Belgeleri' },
  { value: 'PERSONNEL', label: 'Personel Belgeleri' },
  { value: 'VEHICLE', label: 'Araç Belgeleri' },
  { value: 'INVOICE', label: 'Faturalar' },
  { value: 'CONTRACT', label: 'Sözleşmeler' },
  { value: 'OTHER', label: 'Diğer' },
];

// Belge Tipleri (kategori bazlı)
const DOCUMENT_TYPES: Record<string, { value: string; label: string; needsDate?: boolean }[]> = {
  SHIP: [
    { value: 'LOADLINE', label: 'Yük Hattı Belgesi', needsDate: true },
    { value: 'SRC5', label: 'SRC-5 Belgesi', needsDate: true },
    { value: 'REGISTRY', label: 'Gemi Sicil Belgesi' },
  ],
  PERSONNEL: [
    { value: 'ID_CARD', label: 'Kimlik Belgesi' },
    { value: 'HEALTH_CERT', label: 'Sağlık Sertifikası', needsDate: true },
    { value: 'SEAMAN_BOOK', label: 'Gemiadamı Cüzdanı' },
  ],
  VEHICLE: [
    { value: 'ARAC_RUHSAT', label: 'Araç Ruhsatı' },
    { value: 'ARAC_MUAYENE', label: 'Araç Muayene', needsDate: true },
    { value: 'ARAC_SIGORTA', label: 'Araç Sigortası', needsDate: true },
  ],
  INVOICE: [
    { value: 'PROFORMA', label: 'Proforma Fatura' },
    { value: 'FINAL_INVOICE', label: 'Kesin Fatura' },
  ],
  CONTRACT: [
    { value: 'SERVICE_CONTRACT', label: 'Hizmet Sözleşmesi' },
  ],
  OTHER: [
    { value: 'OTHER', label: 'Diğer' },
  ],
};

export function DocumentUpload({
  workOrderId,
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 10, // MB
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dosya validasyon
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return 'Sadece PDF, JPEG, PNG dosyaları yüklenebilir';
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `Dosya boyutu ${maxFileSize}MB'dan büyük olamaz`;
    }

    return null;
  };

  // Dosya ekleme
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);

      if (files.length + fileArray.length > maxFiles) {
        toast.error(`En fazla ${maxFiles} dosya yükleyebilirsiniz`);
        return;
      }

      const validatedFiles: UploadFile[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
          continue;
        }

        validatedFiles.push({
          id: `${Date.now()}-${Math.random()}`,
          file,
          category: 'SHIP',
          documentType: 'LOADLINE',
          description: '',
          progress: 0,
          status: 'pending',
        });
      }

      setFiles((prev) => [...prev, ...validatedFiles]);
      toast.success(`${validatedFiles.length} dosya eklendi`);
    },
    [files.length, maxFiles, maxFileSize]
  );

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  // Dosya seçimi
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  // Dosya silme
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast.info('Dosya kaldırıldı');
  };

  // Dosya bilgileri güncelleme
  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  // Upload fonksiyonu
  const uploadFile = async (uploadFile: UploadFile) => {
    const token = portalTokenStorage.getToken();
    if (!token) {
      toast.error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    if (!workOrderId) {
      toast.error('Belge yükleyebilmek için bir iş emri seçmelisiniz');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('work_order_id', workOrderId.toString());
    formData.append('category', uploadFile.category);
    formData.append('document_type', uploadFile.documentType);
    
    if (uploadFile.description) {
      formData.append('description', uploadFile.description);
    }
    
    if (uploadFile.issueDate) {
      formData.append('issue_date', uploadFile.issueDate);
    }

    try {
      updateFile(uploadFile.id, { status: 'uploading', progress: 0 });

      // Simulated progress
      const progressInterval = setInterval(() => {
        updateFile(uploadFile.id, {
          progress: Math.min(uploadFile.progress + 10, 90),
        });
      }, 200);

      const response = await fetch(`${PORTAL_API_BASE}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload başarısız');
      }

      const data = await response.json();

      updateFile(uploadFile.id, {
        status: 'success',
        progress: 100,
      });

      toast.success(`${uploadFile.file.name} yüklendi`);
      
      if (onUploadComplete) {
        onUploadComplete(data.id);
      }
    } catch (error: any) {
      updateFile(uploadFile.id, {
        status: 'error',
        progress: 0,
        error: error.message,
      });
      toast.error(`${uploadFile.file.name}: ${error.message}`);
    }
  };

  // Tüm dosyaları yükle
  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast.info('Yüklenecek dosya yok');
      return;
    }

    toast.info(`${pendingFiles.length} dosya yükleniyor...`);

    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    toast.success('Tüm dosyalar yüklendi!');
  };

  // Dosya icon'u
  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <File className="h-8 w-8 text-muted-foreground" />;
  };

  // Status badge
  const getStatusBadge = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Bekliyor</Badge>;
      case 'uploading':
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Yükleniyor
          </Badge>
        );
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Başarılı
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Hata
          </Badge>
        );
    }
  };

  const availableTypes = files.length > 0 ? DOCUMENT_TYPES[files[0]?.category] || [] : [];

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Belge Yükleme
          </CardTitle>
          <CardDescription>
            PDF, JPEG veya PNG formatında belge yükleyebilirsiniz (Max {maxFileSize}MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Dosyaları buraya sürükleyin veya tıklayın
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              PDF, JPEG, PNG • Max {maxFileSize}MB • {files.length}/{maxFiles} dosya
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              Dosya Seç
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Yüklenecek Dosyalar ({files.length})</CardTitle>
              <Button
                onClick={uploadAll}
                disabled={files.every((f) => f.status !== 'pending')}
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Tümünü Yükle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((uploadFile) => {
              const currentTypes = DOCUMENT_TYPES[uploadFile.category] || [];
              const selectedType = currentTypes.find((t) => t.value === uploadFile.documentType);
              const needsDate = selectedType?.needsDate || false;

              return (
                <div
                  key={uploadFile.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getFileIcon(uploadFile.file)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{uploadFile.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadFile.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(uploadFile.status)}
                      {uploadFile.status === 'pending' && (
                        <Button
                          onClick={() => removeFile(uploadFile.id)}
                          variant="ghost"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="h-2" />
                  )}

                  {/* Error Message */}
                  {uploadFile.status === 'error' && uploadFile.error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                      {uploadFile.error}
                    </div>
                  )}

                  {/* Metadata (sadece pending durumdayken) */}
                  {uploadFile.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Kategori</Label>
                        <Select
                          value={uploadFile.category}
                          onValueChange={(value) =>
                            updateFile(uploadFile.id, {
                              category: value,
                              documentType: DOCUMENT_TYPES[value]?.[0]?.value || '',
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Belge Tipi</Label>
                        <Select
                          value={uploadFile.documentType}
                          onValueChange={(value) =>
                            updateFile(uploadFile.id, { documentType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {needsDate && (
                        <div className="col-span-2">
                          <Label>Belge Tarihi (Süre Hesaplama İçin)</Label>
                          <Input
                            type="date"
                            value={uploadFile.issueDate || ''}
                            onChange={(e) =>
                              updateFile(uploadFile.id, { issueDate: e.target.value })
                            }
                          />
                        </div>
                      )}
                      <div className="col-span-2">
                        <Label>Açıklama (Opsiyonel)</Label>
                        <Textarea
                          rows={2}
                          value={uploadFile.description}
                          onChange={(e) =>
                            updateFile(uploadFile.id, { description: e.target.value })
                          }
                          placeholder="Belge hakkında ek bilgi..."
                          className="resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
