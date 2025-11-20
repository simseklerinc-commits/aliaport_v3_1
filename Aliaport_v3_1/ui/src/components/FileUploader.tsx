// DOSYA YÜKLEME COMPONENT - Drag & Drop ile dosya yükleme

import { useState, useCallback } from "react";
import { Upload, X, FileText, File, Check, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";

interface UploadedFile {
  file: File;
  preview?: string;
  doc_type: string;
  notes: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploaderProps {
  workOrderId?: number;
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // MB cinsinden
}

export function FileUploader({
  workOrderId,
  onUploadComplete,
  maxFiles = 10,
  maxSize = 10, // 10MB
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Dosya tipine göre ikon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return '🖼️';
    } else if (['pdf'].includes(ext || '')) {
      return '📄';
    } else if (['doc', 'docx'].includes(ext || '')) {
      return '📝';
    } else if (['xls', 'xlsx'].includes(ext || '')) {
      return '📊';
    }
    return '📎';
  };

  // Dosya boyutunu formatla
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Dosya ekle
  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;

    const filesArray = Array.from(newFiles);
    const validFiles: UploadedFile[] = [];

    filesArray.forEach((file) => {
      // Boyut kontrolü
      if (file.size > maxSize * 1024 * 1024) {
        validFiles.push({
          file,
          doc_type: 'OTHER',
          notes: '',
          status: 'error',
          error: `Dosya boyutu ${maxSize}MB'dan büyük`,
        });
        return;
      }

      // Önizleme oluştur (sadece resimler için)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file ? { ...f, preview: e.target?.result as string } : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      validFiles.push({
        file,
        doc_type: 'OTHER',
        notes: '',
        status: 'pending',
      });
    });

    setFiles((prev) => {
      const newList = [...prev, ...validFiles];
      if (newList.length > maxFiles) {
        return newList.slice(0, maxFiles);
      }
      return newList;
    });
  }, [maxFiles, maxSize]);

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  // Dosya seç
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
  };

  // Dosya sil
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Dosya tipi güncelle
  const updateFileType = (index: number, docType: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, doc_type: docType } : f))
    );
  };

  // Not güncelle
  const updateFileNotes = (index: number, notes: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, notes } : f))
    );
  };

  // Dosyaları yükle
  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    
    // Simüle edilmiş upload
    for (const file of pendingFiles) {
      const index = files.indexOf(file);
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'uploading' } : f))
      );

      // 1 saniye bekle (gerçek upload'da API çağrısı olacak)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: 'success' } : f))
      );
    }

    // Başarılı upload'ları bildir
    if (onUploadComplete) {
      const successFiles = files.filter((f) => f.status === 'success');
      onUploadComplete(successFiles);
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-700 bg-gray-900/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload
          className={`w-12 h-12 mx-auto mb-4 ${
            isDragging ? 'text-blue-400' : 'text-gray-500'
          }`}
        />
        <p className="text-gray-300 mb-2">
          Dosyaları sürükleyip bırakın veya seçmek için tıklayın
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Maksimum {maxFiles} dosya, her biri {maxSize}MB'a kadar
        </p>
        <label>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          />
          <Button
            type="button"
            variant="outline"
            className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
            onClick={(e) => {
              e.preventDefault();
              (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Dosya Seç
          </Button>
        </label>
      </div>

      {/* Dosya Listesi */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm text-gray-400">
              Yüklenecek Dosyalar ({files.length}/{maxFiles})
            </h4>
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={handleUpload}
                className="bg-green-600 hover:bg-green-700"
              >
                {pendingCount} Dosyayı Yükle
              </Button>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {files.map((uploadedFile, index) => (
              <div
                key={index}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-3"
              >
                <div className="flex items-start gap-3">
                  {/* Önizleme / İkon */}
                  <div className="w-12 h-12 flex-shrink-0 rounded bg-gray-900 flex items-center justify-center overflow-hidden">
                    {uploadedFile.preview ? (
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">
                        {getFileIcon(uploadedFile.file.name)}
                      </span>
                    )}
                  </div>

                  {/* Dosya Bilgileri */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="text-sm text-white truncate flex-1">
                        {uploadedFile.file.name}
                      </h5>
                      <Badge
                        className={
                          uploadedFile.status === 'success'
                            ? 'bg-green-500/20 text-green-400'
                            : uploadedFile.status === 'error'
                            ? 'bg-red-500/20 text-red-400'
                            : uploadedFile.status === 'uploading'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }
                      >
                        {uploadedFile.status === 'success' && (
                          <>
                            <Check className="w-3 h-3 mr-1" /> Yüklendi
                          </>
                        )}
                        {uploadedFile.status === 'error' && (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" /> Hata
                          </>
                        )}
                        {uploadedFile.status === 'uploading' && 'Yükleniyor...'}
                        {uploadedFile.status === 'pending' && 'Bekliyor'}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-500 mb-2">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>

                    {uploadedFile.error && (
                      <p className="text-xs text-red-400 mb-2">
                        {uploadedFile.error}
                      </p>
                    )}

                    {uploadedFile.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={uploadedFile.doc_type}
                          onValueChange={(v) => updateFileType(index, v)}
                        >
                          <SelectTrigger className="bg-gray-900 border-gray-700 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CONTRACT">Kontrat</SelectItem>
                            <SelectItem value="INVOICE">Fatura</SelectItem>
                            <SelectItem value="RECEIPT">Fiş</SelectItem>
                            <SelectItem value="PHOTO">Fotoğraf</SelectItem>
                            <SelectItem value="CERTIFICATE">Sertifika</SelectItem>
                            <SelectItem value="REPORT">Rapor</SelectItem>
                            <SelectItem value="OTHER">Diğer</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Not..."
                          value={uploadedFile.notes}
                          onChange={(e) => updateFileNotes(index, e.target.value)}
                          className="bg-gray-900 border-gray-700 h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Sil Butonu */}
                  {uploadedFile.status !== 'uploading' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Özet */}
          {successCount > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-sm text-green-400">
              <Check className="w-4 h-4 inline mr-2" />
              {successCount} dosya başarıyla yüklendi
            </div>
          )}
        </div>
      )}
    </div>
  );
}
