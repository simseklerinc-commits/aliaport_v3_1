/**
 * DİJİTAL ARŞİV - BELGE UPLOAD UI
 * 
 * Özellikler:
 * - Drag & Drop dosya yükleme
 * - Belge tipi seçimi
 * - Önizleme modal (PDF/Image)
 * - Multiple file upload
 * - Progress bar
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { 
  Upload, FileText, Image as ImageIcon, X, CheckCircle, 
  AlertCircle, Eye, Download 
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface UploadedFile {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  documentId?: number;
}

interface DocumentUploadProps {
  category: 'WORK_ORDER' | 'EMPLOYEE' | 'VEHICLE' | 'CARI' | 'GENERAL';
  workOrderId?: number;
  cariId?: number;
  onUploadComplete?: (documentId: number) => void;
}

const DOCUMENT_TYPES = [
  { value: 'GUMRUK_IZIN_BELGESI', label: 'Gümrük İzin Belgesi' },
  { value: 'SRC5', label: 'SRC5 Belgesi' },
  { value: 'MANIFESTO', label: 'Manifesto' },
  { value: 'KONISIMENTO', label: 'Konişimento' },
  { value: 'FATURA', label: 'Fatura' },
  { value: 'KIMLIK_BELGESI', label: 'Kimlik Belgesi' },
  { value: 'PASAPORT', label: 'Pasaport' },
  { value: 'RUHSAT', label: 'Araç Ruhsatı' },
  { value: 'SOZLESME', label: 'Sözleşme' },
  { value: 'DIGER', label: 'Diğer' },
];

export function DocumentUpload({ 
  category, 
  workOrderId, 
  cariId,
  onUploadComplete 
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  
  // Form fields
  const [documentType, setDocumentType] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map((file) => {
      const uploadFile: UploadedFile = {
        file,
        status: 'pending',
        progress: 0,
      };

      // Image preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadFile.preview = e.target?.result as string;
          setFiles((prev) => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      return uploadFile;
    });

    setFiles((prev) => [...prev, ...uploadedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (uploadedFile: UploadedFile, index: number) => {
    const formData = new FormData();
    formData.append('file', uploadedFile.file);
    formData.append('category', category);
    formData.append('document_type', documentType);
    if (description) formData.append('description', description);
    if (issueDate) formData.append('issue_date', issueDate);
    if (expiresAt) formData.append('expires_at', expiresAt);
    if (workOrderId) formData.append('work_order_id', workOrderId.toString());
    if (cariId) formData.append('cari_id', cariId.toString());

    try {
      // Update status
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'uploading' as const } : f))
      );

      const response = await fetch('http://localhost:8001/api/archive/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      // Success
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'success' as const,
                progress: 100,
                documentId: result.data.id,
              }
            : f
        )
      );

      onUploadComplete?.(result.data.id);
    } catch (error: any) {
      // Error
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: 'error' as const,
                error: error.message || 'Upload failed',
              }
            : f
        )
      );
    }
  };

  const handleUploadAll = async () => {
    if (!documentType) {
      alert('Lütfen belge tipi seçiniz');
      return;
    }

    const pendingFiles = files.filter((f) => f.status === 'pending');
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(files[i], i);
      }
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Belge Yükleme
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Belge Tipi Seçimi */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Belge Tipi *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Belge tipi seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Belge hakkında not..."
            />
          </div>

          <div className="space-y-2">
            <Label>Düzenlenme Tarihi</Label>
            <Input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Son Geçerlilik Tarihi</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          )}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-2">
            Dosyaları sürükleyip bırakın veya
          </p>
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              Dosya Seç
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              />
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            PDF, resim, Word, Excel dosyaları desteklenir
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Seçilen Dosyalar ({files.length})
              </Label>
              <Button
                size="sm"
                onClick={handleUploadAll}
                disabled={files.every((f) => f.status !== 'pending') || !documentType}
              >
                <Upload className="h-4 w-4 mr-1" />
                Tümünü Yükle
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  {getFileIcon(uploadedFile.file)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {uploadedFile.file.name}
                      </p>
                      {uploadedFile.status === 'success' && (
                        <Badge variant="outline" className="text-green-600">
                          Yüklendi
                        </Badge>
                      )}
                      {uploadedFile.status === 'error' && (
                        <Badge variant="outline" className="text-red-600">
                          Hata
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.file.size / 1024).toFixed(2)} KB
                    </p>
                    {uploadedFile.status === 'uploading' && (
                      <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${uploadedFile.progress}%` }}
                        />
                      </div>
                    )}
                    {uploadedFile.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {uploadedFile.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {getStatusIcon(uploadedFile.status)}
                    
                    {uploadedFile.preview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewFile(uploadedFile)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {uploadedFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewFile?.file.name}</DialogTitle>
              <DialogDescription>
                {previewFile && (previewFile.file.size / 1024).toFixed(2)} KB
              </DialogDescription>
            </DialogHeader>
            {previewFile?.preview && (
              <div className="overflow-auto max-h-[70vh]">
                <img
                  src={previewFile.preview}
                  alt="Preview"
                  className="w-full h-auto"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
