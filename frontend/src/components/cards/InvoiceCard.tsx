// INVOICE CARD - Fatura detay component
// SQL: invoice + invoice_line (master-detail)
// Props: Invoice veya InvoiceWithLines model

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  FileText, 
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Send,
  Download,
  Eye
} from "lucide-react";
import type { Invoice, InvoiceWithLines } from "../../lib/types/database";

interface InvoiceCardProps {
  invoice: Invoice | InvoiceWithLines;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (id: number) => void;
  onViewLines?: (id: number) => void;
  onDownload?: (id: number) => void;
  showActions?: boolean;
  showLines?: boolean;
}

export function InvoiceCard({ 
  invoice, 
  onEdit, 
  onDelete, 
  onViewLines,
  onDownload,
  showActions = true,
  showLines = false
}: InvoiceCardProps) {
  const withLines = 'lines' in invoice ? invoice : null;

  // Status badge rengi
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ONAYLANDI': 'bg-green-500/20 text-green-400 border-green-500/50',
      'TASLAK': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      'IPTAL': 'bg-red-500/20 text-red-400 border-red-500/50',
      'BEKLEMEDE': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  // Payment status badge
  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'ODENDI': 'bg-green-500/20 text-green-400 border-green-500/50',
      'BEKLEMEDE': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      'GECIKTI': 'bg-red-500/20 text-red-400 border-red-500/50',
      'KISMI': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONAYLANDI':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'TASLAK':
        return <Clock className="w-4 h-4" />;
      case 'IPTAL':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Vade kontrolü
  const isOverdue = () => {
    if (!invoice.due_date || invoice.payment_status === 'ODENDI') return false;
    return new Date(invoice.due_date) < new Date();
  };

  return (
    <div className={`bg-gray-800/50 border rounded-lg overflow-hidden hover:border-gray-600 transition-all ${
      invoice.status === 'ONAYLANDI' 
        ? 'border-green-500/30' 
        : invoice.status === 'TASLAK'
        ? 'border-yellow-500/30'
        : 'border-gray-700'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b border-gray-700 ${
        invoice.status === 'ONAYLANDI' 
          ? 'bg-gradient-to-r from-green-600/20 to-green-800/10' 
          : invoice.status === 'TASLAK'
          ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-800/10'
          : invoice.status === 'IPTAL'
          ? 'bg-gradient-to-r from-red-600/20 to-red-800/10'
          : 'bg-gradient-to-r from-gray-600/20 to-gray-800/10'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              invoice.status === 'ONAYLANDI'
                ? 'bg-green-500/20 border border-green-500/50' 
                : invoice.status === 'TASLAK'
                ? 'bg-yellow-500/20 border border-yellow-500/50'
                : invoice.status === 'IPTAL'
                ? 'bg-red-500/20 border border-red-500/50'
                : 'bg-gray-700/50 border border-gray-600'
            }`}>
              <FileText className={`w-6 h-6 ${
                invoice.status === 'ONAYLANDI' ? 'text-green-400' : 
                invoice.status === 'TASLAK' ? 'text-yellow-400' : 
                invoice.status === 'IPTAL' ? 'text-red-400' : 'text-gray-500'
              }`} />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{invoice.invoice_number}</h3>
                {invoice.is_e_invoice && (
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                    <Send className="w-3 h-3 mr-1" />
                    e-Fatura
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(invoice.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </span>
                </Badge>
                <Badge className={getPaymentStatusColor(invoice.payment_status)}>
                  {invoice.payment_status}
                </Badge>
                {isOverdue() && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    VADESİ GEÇTİ
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1">
              {onDownload && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDownload(invoice.id)}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
              {onViewLines && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewLines(invoice.id)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              {onEdit && invoice.status === 'TASLAK' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(invoice)}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(invoice.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Cari Info */}
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Cari Hesap</span>
          </div>
          <div className="text-white font-medium">{invoice.cari_name}</div>
          <div className="text-sm text-gray-400 font-mono">{invoice.cari_code}</div>
          {invoice.cari_tax_number && (
            <div className="text-xs text-gray-500 mt-1">
              VKN: {invoice.cari_tax_number} • {invoice.cari_tax_office}
            </div>
          )}
        </div>

        {/* Amount Summary */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Ara Toplam</span>
              <span className="text-white">
                {invoice.subtotal.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {invoice.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">KDV</span>
              <span className="text-white">
                {invoice.vat_total.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {invoice.currency}
              </span>
            </div>
            {invoice.discount_total > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-400">İndirim</span>
                <span className="text-red-400">
                  -{invoice.discount_total.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {invoice.currency}
                </span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-2 flex items-center justify-between">
              <span className="text-gray-400 font-medium">Genel Toplam</span>
              <span className="text-xl font-bold text-green-400">
                {invoice.grand_total.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {invoice.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-900/30 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-gray-500">Fatura Tarihi</span>
            </div>
            <div className="text-sm text-white">
              {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}
            </div>
          </div>
          <div className={`rounded p-2 ${
            isOverdue() 
              ? 'bg-red-500/10 border border-red-500/30' 
              : 'bg-gray-900/30'
          }`}>
            <div className="flex items-center gap-1 mb-1">
              <Clock className={`w-3 h-3 ${isOverdue() ? 'text-red-400' : 'text-gray-400'}`} />
              <span className="text-xs text-gray-500">Vade Tarihi</span>
            </div>
            <div className={`text-sm ${isOverdue() ? 'text-red-400 font-bold' : 'text-white'}`}>
              {invoice.due_date 
                ? new Date(invoice.due_date).toLocaleDateString('tr-TR')
                : 'Belirsiz'}
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {invoice.payment_status === 'ODENDI' && invoice.payment_date && (
          <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ödeme Tarihi:</span>
              <span className="text-green-400">
                {new Date(invoice.payment_date).toLocaleDateString('tr-TR')}
              </span>
            </div>
            {invoice.payment_method && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-400">Ödeme Yöntemi:</span>
                <span className="text-white">{invoice.payment_method}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {invoice.description && (
          <div className="text-sm text-gray-300 bg-gray-900/30 rounded p-2">
            {invoice.description}
          </div>
        )}

        {/* E-Invoice Status */}
        {invoice.is_e_invoice && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">e-Fatura Durumu:</span>
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                {invoice.e_invoice_status}
              </Badge>
            </div>
            {invoice.e_invoice_sent_date && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-400">Gönderim:</span>
                <span className="text-white">
                  {new Date(invoice.e_invoice_sent_date).toLocaleDateString('tr-TR')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Lines Preview (if available) */}
        {showLines && withLines && withLines.lines && withLines.lines.length > 0 && (
          <div className="border-t border-gray-800 pt-3">
            <div className="text-xs text-gray-500 mb-2">
              Fatura Kalemleri ({withLines.line_count})
            </div>
            <div className="space-y-1">
              {withLines.lines.slice(0, 3).map(line => (
                <div key={line.id} className="bg-gray-900/30 rounded p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-white font-medium">{line.service_name}</div>
                      <div className="text-gray-500">{line.description}</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-white font-bold">
                        {line.line_total.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} {line.currency}
                      </div>
                      <div className="text-gray-500">
                        {line.quantity} {line.unit} × {line.unit_price?.toLocaleString('tr-TR') || '0'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {withLines.lines.length > 3 && (
                <div className="text-center text-gray-500 text-xs">
                  +{withLines.lines.length - 3} kalem daha...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs text-yellow-200">
            <div className="flex items-start gap-2">
              <FileText className="w-3 h-3 mt-0.5" />
              <div>{invoice.notes}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900/30 px-4 py-2 text-xs text-gray-500 border-t border-gray-800">
        Oluşturulma: {new Date(invoice.created_at).toLocaleDateString('tr-TR')}
        {invoice.updated_at && (
          <> • Güncelleme: {new Date(invoice.updated_at).toLocaleDateString('tr-TR')}</>
        )}
      </div>
    </div>
  );
}