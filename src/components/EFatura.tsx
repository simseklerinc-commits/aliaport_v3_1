import { useState } from "react";
import { 
  Receipt, 
  FileText, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowLeft,
  Anchor
} from "lucide-react";
import { Theme } from "./ThemeSelector";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { invoiceMasterData, invoiceLineData } from "../data/invoiceData";

interface EFaturaProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  sourceModule?: string; // "barinma" ise geri dön butonu göster
  contractData?: any; // Barınma'dan gelen kontrat verisi
}

export function EFatura({ onNavigateHome, onNavigateBack, theme, sourceModule, contractData }: EFaturaProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Fatura durumuna göre filtrele
  const filterInvoices = (status?: string) => {
    let filtered = invoiceMasterData;
    
    if (status) {
      filtered = filtered.filter(inv => inv.status === status);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.contract_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const allInvoices = filterInvoices();
  const draftInvoices = filterInvoices('TASLAK');
  const sentInvoices = filterInvoices('GONDERILDI');
  const approvedInvoices = filterInvoices('ONAYLANDI');
  const rejectedInvoices = filterInvoices('REDDEDILDI');

  // Durum badge'i
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'TASLAK': { color: 'border-gray-500/30 text-gray-400', icon: Clock },
      'GONDERILDI': { color: 'border-blue-500/30 text-blue-400', icon: Send },
      'ONAYLANDI': { color: 'border-green-500/30 text-green-400', icon: CheckCircle2 },
      'REDDEDILDI': { color: 'border-red-500/30 text-red-400', icon: XCircle },
      'IPTAL': { color: 'border-gray-500/30 text-gray-500', icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['TASLAK'];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  // Toplam istatistikler
  const stats = {
    total: invoiceMasterData.length,
    draft: draftInvoices.length,
    sent: sentInvoices.length,
    approved: approvedInvoices.length,
    rejected: rejectedInvoices.length,
    totalAmount: invoiceMasterData.reduce((sum, inv) => sum + inv.total, 0),
    approvedAmount: approvedInvoices.reduce((sum, inv) => sum + inv.total, 0),
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateHome}
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                Ana Menü
              </Button>
              {sourceModule === 'barinma' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateBack}
                  className="bg-transparent border-blue-700 text-blue-400 hover:bg-blue-900/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Barınma Sözleşmelerine Dön
                </Button>
              )}
            </div>
            <h1 className="text-3xl flex items-center gap-3">
              <Receipt className={`w-8 h-8 ${theme.colors.primaryText}`} />
              E-Fatura Yönetimi
            </h1>
            <p className={`${theme.colors.textMuted} mt-1`}>
              Elektronik fatura oluştur, gönder ve takip et
            </p>
          </div>
          <Button
            className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
            onClick={() => console.log('Yeni fatura:', contractData)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Fatura Oluştur
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl mb-1">{stats.total}</div>
            <div className={`text-sm ${theme.colors.textMuted}`}>Toplam Fatura</div>
            <div className="text-xs text-blue-400 mt-2">
              {stats.draft} taslak bekliyor
            </div>
          </div>

          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl mb-1">{stats.approved}</div>
            <div className={`text-sm ${theme.colors.textMuted}`}>Onaylanan</div>
            <div className="text-xs text-green-400 mt-2">
              %{((stats.approved / stats.total) * 100).toFixed(0)} başarı oranı
            </div>
          </div>

          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
              <Send className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-3xl mb-1">{stats.sent}</div>
            <div className={`text-sm ${theme.colors.textMuted}`}>Gönderilen</div>
            <div className="text-xs text-orange-400 mt-2">
              Onay bekliyor
            </div>
          </div>

          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 ${theme.colors.primary}/10 rounded-lg`}>
                <DollarSign className={`w-6 h-6 ${theme.colors.primaryText}`} />
              </div>
              <TrendingUp className={`w-5 h-5 ${theme.colors.primaryText}`} />
            </div>
            <div className="text-3xl mb-1">₺{(stats.approvedAmount / 1000).toFixed(0)}K</div>
            <div className={`text-sm ${theme.colors.textMuted}`}>Onaylanan Tutar</div>
            <div className={`text-xs ${theme.colors.primaryText} mt-2`}>
              Toplam: ₺{(stats.totalAmount / 1000).toFixed(0)}K
            </div>
          </div>
        </div>

        {/* Kontrat verisi varsa bilgi göster */}
        {contractData && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-400 mb-2">
                  Barınma sözleşmesinden fatura oluşturuluyor
                </p>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Kontrat:</span>
                    <span className="ml-2">{contractData.kontratNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Cari:</span>
                    <span className="ml-2">{contractData.cariAdi}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tekne:</span>
                    <span className="ml-2">{contractData.tekneAdi}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tutar:</span>
                    <span className="ml-2 text-green-400">{formatCurrency(contractData.tutar, contractData.para)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Fatura no, cari adı veya kontrat no ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white"
            />
          </div>
          <Button
            variant="outline"
            className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700">
              Tümü ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-gray-700">
              Taslaklar ({stats.draft})
            </TabsTrigger>
            <TabsTrigger value="sent" className="data-[state=active]:bg-gray-700">
              Gönderilen ({stats.sent})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-gray-700">
              Onaylanan ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-gray-700">
              Reddedilen ({stats.rejected})
            </TabsTrigger>
          </TabsList>

          {/* All Invoices */}
          <TabsContent value="all">
            <InvoiceList invoices={allInvoices} theme={theme} getStatusBadge={getStatusBadge} formatCurrency={formatCurrency} formatDate={formatDate} />
          </TabsContent>

          {/* Draft Invoices */}
          <TabsContent value="draft">
            <InvoiceList invoices={draftInvoices} theme={theme} getStatusBadge={getStatusBadge} formatCurrency={formatCurrency} formatDate={formatDate} />
          </TabsContent>

          {/* Sent Invoices */}
          <TabsContent value="sent">
            <InvoiceList invoices={sentInvoices} theme={theme} getStatusBadge={getStatusBadge} formatCurrency={formatCurrency} formatDate={formatDate} />
          </TabsContent>

          {/* Approved Invoices */}
          <TabsContent value="approved">
            <InvoiceList invoices={approvedInvoices} theme={theme} getStatusBadge={getStatusBadge} formatCurrency={formatCurrency} formatDate={formatDate} />
          </TabsContent>

          {/* Rejected Invoices */}
          <TabsContent value="rejected">
            <InvoiceList invoices={rejectedInvoices} theme={theme} getStatusBadge={getStatusBadge} formatCurrency={formatCurrency} formatDate={formatDate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Invoice List Component
function InvoiceList({ invoices, theme, getStatusBadge, formatCurrency, formatDate }: any) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Fatura bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      {invoices.map((invoice: any) => (
        <div
          key={invoice.id}
          className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6 hover:border-gray-600 transition-all cursor-pointer`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg">{invoice.invoice_no}</h3>
                {getStatusBadge(invoice.status)}
                {invoice.contract_no && (
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                    <Anchor className="w-3 h-3 mr-1" />
                    {invoice.contract_no}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(invoice.issue_date)}
                </span>
                <span>•</span>
                <span>{invoice.customer_name}</span>
                <span>•</span>
                <span>VKN: {invoice.customer_vkn}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl text-green-400 mb-1">
                {formatCurrency(invoice.total, invoice.currency)}
              </div>
              <div className="text-xs text-gray-500">
                KDV: {formatCurrency(invoice.vat_total, invoice.currency)}
              </div>
            </div>
          </div>

          {invoice.rejection_reason && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Red Nedeni: {invoice.rejection_reason}
              </p>
            </div>
          )}

          {invoice.notes && (
            <div className="mb-4 text-sm text-gray-400">
              <FileText className="w-3 h-3 inline mr-1" />
              {invoice.notes}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              <Eye className="w-3 h-3 mr-1" />
              Görüntüle
            </Button>
            {invoice.status === 'TASLAK' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Düzenle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-green-700 text-green-400 hover:bg-green-900/20"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Gönder
                </Button>
              </>
            )}
            {(invoice.status === 'ONAYLANDI' || invoice.status === 'GONDERILDI') && (
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                <Download className="w-3 h-3 mr-1" />
                İndir
              </Button>
            )}
            {invoice.status === 'TASLAK' && (
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-red-900/50 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Sil
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
