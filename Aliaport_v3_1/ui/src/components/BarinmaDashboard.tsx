import { Theme } from "./ThemeSelector";
import { 
  Ship, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  BarChart3,
  PieChart
} from "lucide-react";
import { Badge } from "./ui/badge";

interface BarinmaDashboardProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

// Mock data - gerçek uygulamada SQL'den gelecek
const dashboardData = {
  totalActiveContracts: 87,
  totalMonthlyRevenue: 245000,
  totalYearlyRevenue: 2940000,
  occupancyRate: 82,
  expiringContracts30Days: 12,
  expiringContracts60Days: 24,
  overduePayments: 5,
  revenueByPeriod: {
    yearly: 65,
    monthly: 25,
    daily: 10,
  },
  revenueByBoatSize: [
    { range: '10-15m', count: 35, revenue: 105000 },
    { range: '15-20m', count: 28, revenue: 98000 },
    { range: '20-30m', count: 24, revenue: 96000 },
  ],
  monthlyTrend: [
    { month: 'Oca', revenue: 230000 },
    { month: 'Şub', revenue: 235000 },
    { month: 'Mar', revenue: 240000 },
    { month: 'Nis', revenue: 238000 },
    { month: 'May', revenue: 242000 },
    { month: 'Haz', revenue: 245000 },
  ],
};

export function BarinmaDashboard({ onNavigateHome, onNavigateBack, theme }: BarinmaDashboardProps) {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1">Barınma Dashboard</h2>
            <p className={theme.colors.textMuted}>Genel bakış, istatistikler ve trend analizi</p>
          </div>
        </div>

        {/* KPI Cards - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Aktif Kontratlar */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <Ship className="w-6 h-6 text-blue-400" />
              </div>
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                Aktif
              </Badge>
            </div>
            <div>
              <p className={`text-sm ${theme.colors.textMuted} mb-1`}>Toplam Aktif Kontrat</p>
              <p className="text-3xl text-white">{dashboardData.totalActiveContracts}</p>
              <p className="text-xs text-green-400 mt-2">↑ 8% geçen aya göre</p>
            </div>
          </div>

          {/* Aylık Gelir */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                Aylık
              </Badge>
            </div>
            <div>
              <p className={`text-sm ${theme.colors.textMuted} mb-1`}>Toplam Aylık Gelir</p>
              <p className="text-3xl text-white">
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                  minimumFractionDigits: 0,
                }).format(dashboardData.totalMonthlyRevenue)}
              </p>
              <p className="text-xs text-green-400 mt-2">↑ 5% geçen aya göre</p>
            </div>
          </div>

          {/* Doluluk Oranı */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                Kapasite
              </Badge>
            </div>
            <div>
              <p className={`text-sm ${theme.colors.textMuted} mb-1`}>Doluluk Oranı</p>
              <p className="text-3xl text-white">{dashboardData.occupancyRate}%</p>
              <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all" 
                  style={{ width: `${dashboardData.occupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Süre Dolacak Kontratlar */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                Uyarı
              </Badge>
            </div>
            <div>
              <p className={`text-sm ${theme.colors.textMuted} mb-1`}>Süresi Dolacak (30 Gün)</p>
              <p className="text-3xl text-white">{dashboardData.expiringContracts30Days}</p>
              <p className="text-xs text-orange-400 mt-2">
                60 gün içinde: {dashboardData.expiringContracts60Days}
              </p>
            </div>
          </div>
        </div>

        {/* Charts and Details - Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol - Periyot Dağılımı */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <PieChart className="w-5 h-5 text-blue-400" />
              Periyot Dağılımı
            </h3>
            <div className="space-y-4">
              {/* Yıllık */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Yıllık</span>
                  <span className="text-sm text-blue-400">{dashboardData.revenueByPeriod.yearly}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all" 
                    style={{ width: `${dashboardData.revenueByPeriod.yearly}%` }}
                  />
                </div>
              </div>

              {/* Aylık */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Aylık</span>
                  <span className="text-sm text-green-400">{dashboardData.revenueByPeriod.monthly}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all" 
                    style={{ width: `${dashboardData.revenueByPeriod.monthly}%` }}
                  />
                </div>
              </div>

              {/* Günlük */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Günlük</span>
                  <span className="text-sm text-purple-400">{dashboardData.revenueByPeriod.daily}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all" 
                    style={{ width: `${dashboardData.revenueByPeriod.daily}%` }}
                  />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4 mt-6">
                <p className="text-xs text-gray-500">
                  Toplam {dashboardData.totalActiveContracts} kontrat
                </p>
              </div>
            </div>
          </div>

          {/* Orta - Boy Bazlı Dağılım */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-green-400" />
              Boy Bazlı Dağılım
            </h3>
            <div className="space-y-4">
              {dashboardData.revenueByBoatSize.map((item, index) => (
                <div key={item.range} className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm">{item.range}</p>
                      <p className="text-xs text-gray-500">{item.count} tekne</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-400">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                          minimumFractionDigits: 0,
                        }).format(item.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">aylık</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-green-500' : 
                        'bg-purple-500'
                      }`}
                      style={{ width: `${(item.count / dashboardData.totalActiveContracts) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ - Aylık Trend */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="flex items-center gap-2 mb-5">
              <Calendar className="w-5 h-5 text-purple-400" />
              Son 6 Ay Trend
            </h3>
            <div className="space-y-3">
              {dashboardData.monthlyTrend.map((item, index) => {
                const maxRevenue = Math.max(...dashboardData.monthlyTrend.map(m => m.revenue));
                const percentage = (item.revenue / maxRevenue) * 100;
                
                return (
                  <div key={item.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8">{item.month}</span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-800 rounded-full h-6 relative">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full transition-all flex items-center justify-end pr-2" 
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-[10px] text-white">
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(item.revenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-800 pt-4 mt-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Yıllık Hedef:</span>
                <span className="text-green-400">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    minimumFractionDigits: 0,
                  }).format(dashboardData.totalYearlyRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Uyarılar ve Önemli Bilgiler */}
        <div className={`mt-6 p-6 ${theme.colors.bgCard} border ${theme.colors.border} rounded-lg`}>
          <h3 className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Uyarılar ve Bildirimler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-orange-400 mb-1">Süresi Dolacak Kontratlar</p>
              <p className="text-2xl text-white mb-1">{dashboardData.expiringContracts30Days}</p>
              <p className="text-xs text-gray-400">30 gün içinde işlem yapılmalı</p>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 mb-1">Gecikmiş Ödemeler</p>
              <p className="text-2xl text-white mb-1">{dashboardData.overduePayments}</p>
              <p className="text-xs text-gray-400">Takip edilmesi gereken</p>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400 mb-1">Boş Kapasite</p>
              <p className="text-2xl text-white mb-1">{100 - dashboardData.occupancyRate}%</p>
              <p className="text-xs text-gray-400">Yeni kontrat potansiyeli</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}