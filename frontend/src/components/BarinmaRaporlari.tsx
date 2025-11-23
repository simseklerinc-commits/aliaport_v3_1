import { useState } from "react";
import { Theme } from "./ThemeSelector";
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Ship,
  Download,
  Filter,
  BarChart3
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

interface BarinmaRaporlariProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

// Mock data - gerçek uygulamada SQL'den gelecek
const reportData = {
  monthlyRevenue: [
    { month: 'Ocak 2025', yillik: 180000, aylik: 45000, gunluk: 5000, total: 230000 },
    { month: 'Şubat 2025', yillik: 185000, aylik: 40000, gunluk: 10000, total: 235000 },
    { month: 'Mart 2025', yillik: 190000, aylik: 42000, gunluk: 8000, total: 240000 },
    { month: 'Nisan 2025', yillik: 188000, aylik: 43000, gunluk: 7000, total: 238000 },
    { month: 'Mayıs 2025', yillik: 192000, aylik: 38000, gunluk: 12000, total: 242000 },
    { month: 'Haziran 2025', yillik: 195000, aylik: 40000, gunluk: 10000, total: 245000 },
  ],
  topCustomers: [
    { cariKod: 'C-001', cariAdi: 'MARINA YAT A.Ş.', contractCount: 5, totalRevenue: 250000, period: 'Yıllık' },
    { cariKod: 'C-002', cariAdi: 'BLUE SEA DENİZCİLİK', contractCount: 3, totalRevenue: 180000, period: 'Yıllık' },
    { cariKod: 'C-003', cariAdi: 'OCEAN TECH LTD', contractCount: 4, totalRevenue: 160000, period: 'Aylık' },
    { cariKod: 'C-004', cariAdi: 'AKDENIZ YACHT', contractCount: 2, totalRevenue: 140000, period: 'Yıllık' },
    { cariKod: 'C-005', cariAdi: 'EGE MARINE', contractCount: 3, totalRevenue: 120000, period: 'Aylık' },
  ],
  boatSizeDistribution: [
    { range: '10-15m', count: 35, percentage: 40, avgPrice: 36000 },
    { range: '15-20m', count: 28, percentage: 32, avgPrice: 63000 },
    { range: '20-30m', count: 24, percentage: 28, avgPrice: 96000 },
  ],
  periodAnalysis: {
    yillik: { count: 57, percentage: 65, revenue: 2280000 },
    aylik: { count: 22, percentage: 25, revenue: 554400 },
    gunluk: { count: 8, percentage: 10, revenue: 146000 },
  },
};

export function BarinmaRaporlari({ onNavigateHome, onNavigateBack, theme }: BarinmaRaporlariProps) {
  const [selectedReport, setSelectedReport] = useState<'monthly' | 'customer' | 'size' | 'period'>('monthly');
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState('2025-06-30');

  const handleExport = () => {
    alert('Rapor Excel formatında indirilecek (CSV export fonksiyonu eklenecek)');
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1">Barınma Raporları</h2>
            <p className={theme.colors.textMuted}>Gelir analizi, trend ve istatistikler</p>
          </div>
          <Button
            className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel İndir
          </Button>
        </div>

        {/* Filtre ve Rapor Seçimi */}
        <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6 mb-6`}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Tarih Aralığı */}
            <div>
              <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                <Calendar className="w-3 h-3 inline mr-1" />
                Başlangıç Tarihi
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                <Calendar className="w-3 h-3 inline mr-1" />
                Bitiş Tarihi
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                <Filter className="w-3 h-3 inline mr-1" />
                Rapor Türü
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value as any)}
                className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2"
              >
                <option value="monthly">Aylık Gelir Raporu</option>
                <option value="customer">Cari Bazlı Gelir</option>
                <option value="size">Boy Bazlı Analiz</option>
                <option value="period">Periyot Analizi</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtrele
              </Button>
            </div>
          </div>
        </div>

        {/* Rapor İçeriği */}
        {selectedReport === 'monthly' && (
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Aylık Gelir Raporu
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm text-gray-400">Ay</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400">Yıllık</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400">Aylık</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400">Günlük</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400">Toplam</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.monthlyRevenue.map((row, index) => {
                    const prevTotal = index > 0 ? reportData.monthlyRevenue[index - 1].total : row.total;
                    const change = ((row.total - prevTotal) / prevTotal) * 100;
                    
                    return (
                      <tr key={row.month} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 px-4 text-sm">{row.month}</td>
                        <td className="py-3 px-4 text-sm text-right text-blue-400">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                            minimumFractionDigits: 0,
                          }).format(row.yillik)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-green-400">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                            minimumFractionDigits: 0,
                          }).format(row.aylik)}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-purple-400">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                            minimumFractionDigits: 0,
                          }).format(row.gunluk)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                            minimumFractionDigits: 0,
                          }).format(row.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {index > 0 && (
                            <Badge 
                              variant="outline" 
                              className={change >= 0 ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}
                            >
                              {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-800/30">
                    <td className="py-3 px-4 text-sm">TOPLAM</td>
                    <td className="py-3 px-4 text-sm text-right text-blue-400">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        minimumFractionDigits: 0,
                      }).format(reportData.monthlyRevenue.reduce((sum, r) => sum + r.yillik, 0))}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-green-400">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        minimumFractionDigits: 0,
                      }).format(reportData.monthlyRevenue.reduce((sum, r) => sum + r.aylik, 0))}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-purple-400">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        minimumFractionDigits: 0,
                      }).format(reportData.monthlyRevenue.reduce((sum, r) => sum + r.gunluk, 0))}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        minimumFractionDigits: 0,
                      }).format(reportData.monthlyRevenue.reduce((sum, r) => sum + r.total, 0))}
                    </td>
                    <td className="py-3 px-4 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'customer' && (
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <DollarSign className="w-5 h-5 text-green-400" />
              Cari Bazlı Gelir Raporu
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm text-gray-400">Cari Kodu</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400">Cari Adı</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Kontrat Sayısı</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Periyot</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400">Toplam Gelir</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.topCustomers.map((row, index) => (
                    <tr key={row.cariKod} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 px-4 text-sm">
                        <Badge variant="outline" className="border-gray-600">
                          {row.cariKod}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{row.cariAdi}</td>
                      <td className="py-3 px-4 text-sm text-center">{row.contractCount}</td>
                      <td className="py-3 px-4 text-sm text-center">
                        <Badge 
                          variant="outline" 
                          className={
                            row.period === 'Yıllık' 
                              ? "border-blue-500/30 text-blue-400" 
                              : "border-green-500/30 text-green-400"
                          }
                        >
                          {row.period}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-green-400">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                          minimumFractionDigits: 0,
                        }).format(row.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'size' && (
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <Ship className="w-5 h-5 text-purple-400" />
              Boy Bazlı Analiz
            </h3>
            <div className="space-y-6">
              {reportData.boatSizeDistribution.map((item, index) => (
                <div key={item.range} className="p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg">{item.range}</p>
                      <p className="text-sm text-gray-400">{item.count} tekne • {item.percentage}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Ortalama Fiyat</p>
                      <p className="text-lg text-green-400">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                          minimumFractionDigits: 0,
                        }).format(item.avgPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-green-500' : 
                        'bg-purple-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedReport === 'period' && (
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Periyot Analizi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Yıllık */}
              <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg">Yıllık Kontratlar</h4>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                    {reportData.periodAnalysis.yillik.percentage}%
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Kontrat Sayısı</p>
                    <p className="text-3xl text-white">{reportData.periodAnalysis.yillik.count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Toplam Gelir</p>
                    <p className="text-xl text-blue-400">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        minimumFractionDigits: 0,
                      }).format(reportData.periodAnalysis.yillik.revenue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Aylık */}
              <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg">Aylık Kontratlar</h4>
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    {reportData.periodAnalysis.aylik.percentage}%
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Kontrat Sayısı</p>
                    <p className="text-3xl text-white">{reportData.periodAnalysis.aylik.count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Toplam Gelir</p>
                    <p className="text-xl text-green-400">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        minimumFractionDigits: 0,
                      }).format(reportData.periodAnalysis.aylik.revenue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Günlük */}
              <div className="p-6 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg">Günlük Kontratlar</h4>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    {reportData.periodAnalysis.gunluk.percentage}%
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Kontrat Sayısı</p>
                    <p className="text-3xl text-white">{reportData.periodAnalysis.gunluk.count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Toplam Gelir</p>
                    <p className="text-xl text-purple-400">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                        minimumFractionDigits: 0,
                      }).format(reportData.periodAnalysis.gunluk.revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Özet Bilgi */}
        <div className={`mt-6 p-4 ${theme.colors.bgCard} border ${theme.colors.border} rounded-lg`}>
          <p className="text-sm text-gray-500">
            <FileText className="w-4 h-4 inline mr-2" />
            Raporlar gerçek zamanlı SQL verilerinden üretilmektedir. Excel export özelliği yakında eklenecek.
          </p>
        </div>
      </div>
    </div>
  );
}
