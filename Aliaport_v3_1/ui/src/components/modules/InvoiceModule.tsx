// INVOICE MODULE - Fatura modülü ana component
// Master-detail yapı: invoice + invoice_line
// API entegrasyonu ile veri çekme

import { useState, useEffect } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { 
  FileText, 
  Plus, 
  Search,
  Loader2,
  AlertCircle,
  DollarSign,
  ArrowLeft,
  Download,
  Send
} from "lucide-react";
import { InvoiceCard } from "../cards/InvoiceCard";
import { invoiceApi, invoiceApiMock } from "../../lib/api/invoice";
import type { Invoice, InvoiceWithLines, InvoiceLine } from "../../lib/types/database";

interface InvoiceModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  initialPage?: 'list' | 'create' | 'edit' | 'view';
}

export function InvoiceModule({ 
  onNavigateHome, 
  onNavigateBack, 
  theme,
  initialPage = 'list'
}: InvoiceModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'view'>(initialPage);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithLines | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Mock mode
  const MOCK_MODE = true;

  // Faturaları yükle
  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (MOCK_MODE) {
        const response = await invoiceApiMock.getAll();
        setInvoices(response.items);
      } else {
        const response = await invoiceApi.getAll({
          page: 1,
          page_size: 100,
          invoice_type: filterType === 'ALL' ? undefined : filterType,
          status: filterStatus === 'ALL' ? undefined : filterStatus,
        });
        setInvoices(response.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
      console.error('Fatura yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fatura detayını yükle (lines ile)
  const loadInvoiceWithLines = async (invoiceId: number) => {
    setLoading(true);
    try {
      if (MOCK_MODE) {
        const invoiceWithLines = await invoiceApiMock.getWithLines(invoiceId);
        setSelectedInvoice(invoiceWithLines);
      } else {
        const invoiceWithLines = await invoiceApi.getWithLines(invoiceId);
        setSelectedInvoice(invoiceWithLines);
      }
      setCurrentView('view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fatura detayı yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    if (currentView === 'list') {
      loadInvoices();
    }
  }, [currentView, filterStatus, filterType]);

  // Fatura sil
  const handleDelete = async (id: number) => {
    if (!confirm('Bu faturayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      if (!MOCK_MODE) {
        await invoiceApi.delete(id);
      }
      setInvoices(invoices.filter(i => i.id !== id));
    } catch (err) {
      alert('Silme işlemi başarısız: ' + (err instanceof Error ? err.message : 'Hata'));
    }
  };

  // Fatura düzenle
  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice as any);
    setCurrentView('edit');
  };

  // Fatura lines görüntüle
  const handleViewLines = (invoiceId: number) => {
    loadInvoiceWithLines(invoiceId);
  };

  // Fatura indir
  const handleDownload = (invoiceId: number) => {
    alert(`Fatura ${invoiceId} PDF olarak indirilecek (TODO)`);
  };

  // Filtrelenmiş faturalar
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.cari_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.description && invoice.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'ALL' || invoice.status === filterStatus;
    const matchesPaymentStatus = filterPaymentStatus === 'ALL' || invoice.payment_status === filterPaymentStatus;
    const matchesType = filterType === 'ALL' || invoice.invoice_type === filterType;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesType;
  });

  // İstatistikler
  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, i) => sum + i.grand_total, 0),
    paid: invoices.filter(i => i.payment_status === 'ODENDI').length,
    paidAmount: invoices.filter(i => i.payment_status === 'ODENDI').reduce((sum, i) => sum + i.grand_total, 0),
    pending: invoices.filter(i => i.payment_status === 'BEKLEMEDE').length,
    pendingAmount: invoices.filter(i => i.payment_status === 'BEKLEMEDE').reduce((sum, i) => sum + i.grand_total, 0),
    byStatus: invoices.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // LİSTE GÖRÜNÜMÜ
  const renderList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Fatura Yönetimi</h1>
              <p className="text-sm text-gray-400">
                {stats.total} fatura • {stats.paid} ödendi • {stats.pending} beklemede
                {MOCK_MODE && ' • 🔶 Mock Mode'}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setCurrentView('create')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Yeni Fatura
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Toplam Ciro</div>
            <div className="text-2xl font-bold text-white">
              {stats.totalAmount.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} TRY
            </div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Tahsil Edilen</div>
            <div className="text-2xl font-bold text-green-400">
              {stats.paidAmount.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} TRY
            </div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Bekleyen</div>
            <div className="text-2xl font-bold text-orange-400">
              {stats.pendingAmount.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} TRY
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Fatura ara (numara, cari, açıklama)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">Tüm Durumlar</option>
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <option key={status} value={status}>{status} ({count})</option>
              ))}
            </select>
            
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">Ödeme Durumu</option>
              <option value="ODENDI">Ödendi ({stats.paid})</option>
              <option value="BEKLEMEDE">Beklemede ({stats.pending})</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">Fatura Tipi</option>
              <option value="SATIS">Satış</option>
              <option value="ALIS">Alış</option>
              <option value="IADE">İade</option>
            </select>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              className={`cursor-pointer ${filterStatus === 'ALL' ? 'bg-purple-500/30 border-purple-500' : 'bg-gray-700/50 border-gray-600'}`}
              onClick={() => setFilterStatus('ALL')}
            >
              Tümü ({stats.total})
            </Badge>
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <Badge 
                key={status}
                className={`cursor-pointer ${filterStatus === status ? 'bg-purple-500/30 border-purple-500' : 'bg-gray-700/50 border-gray-600'}`}
                onClick={() => setFilterStatus(status)}
              >
                {status} ({count})
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {/* Invoice Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvoices.map(invoice => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewLines={handleViewLines}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredInvoices.length === 0 && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
          <p className="text-gray-400 mb-4">Fatura bulunamadı</p>
          <Button
            onClick={() => setCurrentView('create')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            İlk Faturayı Oluştur
          </Button>
        </div>
      )}
    </div>
  );

  // DETAY GÖRÜNÜMÜ
  const renderView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('list')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Geri
            </Button>
            {selectedInvoice && (
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedInvoice.invoice_number}</h2>
                <p className="text-sm text-gray-400">
                  {selectedInvoice.cari_name} • {selectedInvoice.line_count || 0} kalem
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => selectedInvoice && handleDownload(selectedInvoice.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF İndir
            </Button>
            {selectedInvoice?.is_e_invoice && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="w-4 h-4 mr-2" />
                e-Fatura Gönder
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Lines Table */}
      {selectedInvoice && selectedInvoice.lines && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Hizmet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Açıklama</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Miktar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Birim Fiyat</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">KDV %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {selectedInvoice.lines.map(line => (
                  <tr key={line.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm text-gray-400">{line.line_number}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white font-medium">{line.service_name}</div>
                      <div className="text-xs text-gray-500 font-mono">{line.service_code}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{line.description}</td>
                    <td className="px-4 py-3 text-sm text-right text-white">
                      {line.quantity} {line.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-white">
                      {line.unit_price.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-400">%{line.vat_rate}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-400 font-bold">
                      {line.line_total.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} {line.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  // FORM GÖRÜNÜMÜ (TODO)
  const renderForm = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          {currentView === 'edit' ? 'Fatura Düzenle' : 'Yeni Fatura'}
        </h2>
        <p className="text-gray-400 mb-6">
          Fatura formu geliştirilme aşamasında...
        </p>
        <Button
          onClick={() => setCurrentView('list')}
          variant="outline"
          className="border-gray-600 text-gray-300"
        >
          Listeye Dön
        </Button>
      </div>
    </div>
  );

  // VIEW ROUTER
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {currentView === 'list' && renderList()}
        {currentView === 'view' && renderView()}
        {(currentView === 'create' || currentView === 'edit') && renderForm()}
      </div>
    </div>
  );
}
