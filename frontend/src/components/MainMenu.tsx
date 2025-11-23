import { FileText, Wrench, Users, Ship, Anchor, DollarSign, Settings, Archive, TrendingUp, AlertCircle, CheckCircle2, Clock, Receipt } from "lucide-react";
import { Theme } from "./ThemeSelector";

interface MainMenuProps {
  onNavigate: (page: string) => void;
  theme: Theme;
}

const menuItems = [
  {
    id: "is-emri",
    title: "İş Emri Yönetimi",
    icon: Wrench,
    description: "İş emirlerini görüntüle ve yönet",
  },
  {
    id: "hizmet",
    title: "Hizmet Yönetimi",
    icon: FileText,
    description: "Hizmet kayıtları ve işlemler",
  },
  {
    id: "cari",
    title: "Cari Yönetim",
    icon: Users,
    description: "Müşteri ve tedarikçi yönetimi",
  },
  {
    id: "mb-sefer",
    title: "MB Sefer Yönetimi",
    icon: Ship,
    description: "Motorbot sefer kayıtları ve faturalandırma",
  },
  {
    id: "barinma",
    title: "Barınma",
    icon: Anchor,
    description: "Motorbot barınma kontratları",
  },
  {
    id: "e-fatura",
    title: "E-Fatura",
    icon: Receipt,
    description: "Elektronik fatura oluştur ve gönder",
  },
  {
    id: "kurlar",
    title: "Kurlar",
    icon: DollarSign,
    description: "Döviz kurları ve güncellemeler",
  },
  {
    id: "parametreler",
    title: "Parametreler",
    icon: Settings,
    description: "Sistem parametreleri ve ayarlar",
  },
  {
    id: "dijital-arsiv",
    title: "Dijital Arşiv",
    icon: Archive,
    description: "Dijital doküman arşivi",
  },
  {
    id: "raporlar",
    title: "Raporlar",
    icon: TrendingUp,
    description: "Sistem raporları ve analizler",
  },
];

export function MainMenu({ onNavigate, theme }: MainMenuProps) {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl mb-2">Aliaport Liman Yönetim Dashboard</h1>
          <p className={theme.colors.textMuted}>Hoş geldiniz - Sistem özeti ve hızlı erişim</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 ${theme.colors.primary}/10 rounded-lg`}>
                <Ship className={`w-6 h-6 ${theme.colors.primaryText}`} />
              </div>
              <TrendingUp className={`w-5 h-5 ${theme.colors.primaryText}`} />
            </div>
            <div className={`text-3xl mb-1`}>16</div>
            <div className={`text-sm ${theme.colors.textMuted}`}>Toplam Motorbot</div>
            <div className={`text-xs ${theme.colors.primaryText} mt-2`}>+2 bu ay</div>
          </div>

          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 ${theme.colors.primary}/10 rounded-lg`}>
                <CheckCircle2 className={`w-6 h-6 ${theme.colors.primaryText}`} />
              </div>
              <TrendingUp className={`w-5 h-5 ${theme.colors.primaryText}`} />
            </div>
            <div className={`text-3xl mb-1`}>5</div>
            <div className={`text-sm ${theme.colors.textMuted}`}>Aktif Kontrat</div>
            <div className={`text-xs ${theme.colors.primaryText} mt-2`}>%85 doluluk</div>
          </div>

          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 ${theme.colors.primary}/10 rounded-lg`}>
                <Clock className={`w-6 h-6 ${theme.colors.primaryText}`} />
              </div>
              <AlertCircle className={`w-5 h-5 text-amber-400`} />
            </div>
            <div className={`text-3xl mb-1`}>12</div>
            <div className={`text-sm ${theme.colors.textMuted}`}>Bekleyen İş Emri</div>
            <div className={`text-xs text-amber-400 mt-2`}>3 acil</div>
          </div>

          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 ${theme.colors.primary}/10 rounded-lg`}>
                <DollarSign className={`w-6 h-6 ${theme.colors.primaryText}`} />
              </div>
              <TrendingUp className={`w-5 h-5 ${theme.colors.primaryText}`} />
            </div>
            <div className={`text-3xl mb-1`}>₺2.4M</div>
            <div className={`text-sm ${theme.colors.textMuted}`}>Aylık Gelir</div>
            <div className={`text-xs ${theme.colors.primaryText} mt-2`}>+12% bu ay</div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="mb-6">
          <h2 className="text-xl mb-4">Modüller</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-4 ${theme.colors.borderHover} hover:shadow-lg transition-all text-center group`}
                >
                  <div className={`p-3 ${theme.colors.primary}/10 rounded-lg group-hover:${theme.colors.primary}/20 transition-colors mx-auto w-fit mb-2`}>
                    <Icon className={`w-5 h-5 ${theme.colors.primaryText}`} />
                  </div>
                  <h3 className={`text-xs group-hover:${theme.colors.primaryText} transition-colors`}>
                    {item.title}
                  </h3>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="text-lg mb-4">Son Aktiviteler</h3>
            <div className="space-y-3">
              {[
                { text: "Yeni kontrat eklendi - M/B Deniz Yıldızı", time: "5 dk önce", type: "success" },
                { text: "İş emri tamamlandı - #IE-2024-089", time: "1 saat önce", type: "success" },
                { text: "Kontrat sona eriyor - M/B Atlas", time: "2 gün", type: "warning" },
                { text: "Yeni hizmet kartı oluşturuldu", time: "3 gün önce", type: "info" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-800 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'success' ? theme.colors.primary : 
                    activity.type === 'warning' ? 'bg-amber-500' : 
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className={`text-xs ${theme.colors.textMuted} mt-1`}>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
            <h3 className="text-lg mb-4">Hızlı İstatistikler</h3>
            <div className="space-y-4">
              {[
                { label: "Doluluk Oranı", value: 85, color: theme.colors.primary },
                { label: "İş Emri Tamamlanma", value: 68, color: "bg-blue-500" },
                { label: "Müşteri Memnuniyeti", value: 92, color: "bg-green-500" },
                { label: "Sistem Kullanımı", value: 76, color: "bg-purple-500" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">{stat.label}</span>
                    <span className={`text-sm ${theme.colors.primaryText}`}>{stat.value}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`${stat.color} h-2 rounded-full transition-all`}
                      style={{ width: `${stat.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}