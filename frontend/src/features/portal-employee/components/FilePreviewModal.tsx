/**
 * FILE PREVIEW MODAL
 * 
 * Araç evraklarının PDF/resim önizlemesi için modal
 * - PDF dosyaları için embedded viewer
 * - Resim dosyaları için image viewer
 * - Download butonu
 */

import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';

interface FilePreviewModalProps {
  fileStorageKey: string;
  fileName?: string;
  onClose: () => void;
}

export function FilePreviewModal({ fileStorageKey, fileName = "Dosya", onClose }: FilePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'unknown'>('unknown');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFile();
  }, [fileStorageKey]);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Backend'den dosya URL'ini al
      const response = await axios.get(`/api/portal/employee/vehicles/documents/file/${fileStorageKey}`, {
        responseType: 'blob'
      });

      const blob = response.data;
      const contentType = response.headers['content-type'];
      
      // Dosya tipini belirle
      if (contentType.includes('pdf')) {
        setFileType('pdf');
      } else if (contentType.includes('image')) {
        setFileType('image');
      } else {
        setFileType('unknown');
      }

      // Blob URL oluştur
      const url = URL.createObjectURL(blob);
      setFileUrl(url);

    } catch (err: any) {
      console.error('Dosya yükleme hatası:', err);
      setError(err.response?.data?.message || 'Dosya yüklenirken hata oluştu');
      toast.error('Dosya önizleme hatası', {
        description: err.response?.data?.message || 'Dosya yüklenemedi'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!fileUrl) return;

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Dosya indiriliyor');
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {fileType === 'pdf' && <FileText className="w-5 h-5 text-red-400" />}
            {fileType === 'image' && <ImageIcon className="w-5 h-5 text-blue-400" />}
            <div>
              <h3 className="text-lg font-semibold text-white">{fileName}</h3>
              <p className="text-sm text-gray-400">
                {fileType === 'pdf' && 'PDF Dökümanı'}
                {fileType === 'image' && 'Resim Dosyası'}
                {fileType === 'unknown' && 'Dosya'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              disabled={!fileUrl || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              İndir
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-800">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Dosya yükleniyor...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">Dosya Yüklenemedi</h4>
                <p className="text-gray-400 mb-4">{error}</p>
                <Button onClick={loadFile} className="bg-blue-600 hover:bg-blue-700">
                  Tekrar Dene
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && fileUrl && (
            <>
              {fileType === 'pdf' && (
                <iframe
                  src={fileUrl}
                  className="w-full h-full min-h-[600px]"
                  title="PDF Preview"
                />
              )}

              {fileType === 'image' && (
                <div className="flex items-center justify-center p-8 h-full">
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                  />
                </div>
              )}

              {fileType === 'unknown' && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">Bu dosya türü önizlenemiyor</p>
                    <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
                      <Download className="w-4 h-4 mr-2" />
                      Dosyayı İndir
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Dosya Anahtarı: {fileStorageKey}</span>
            <span>ESC tuşuna basarak kapatabilirsiniz</span>
          </div>
        </div>
      </div>
    </div>
  );
}
