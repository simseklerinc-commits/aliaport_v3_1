import { TrendingUp, AlertCircle, CheckCircle2, Clock, Ship, DollarSign, Users, Wrench } from "lucide-react";
import { Theme } from "./ThemeSelector";

interface SidebarMainMenuProps {
  theme: Theme;
}

export function SidebarMainMenu({ theme }: SidebarMainMenuProps) {
  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl mb-2">Hoş Geldiniz</h1>
        <p className={theme.colors.textMuted}>
          Bugün {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      {/* Activity & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className={`lg:col-span-2 ${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
          <h3 className="text-lg mb-4">Son Aktiviteler</h3>
          <div className="space-y-4">
            {[
              { text: "Yeni kontrat eklendi - M/B Deniz Yıldızı", time: "5 dk önce", type: "success", icon: CheckCircle2 },
              { text: "İş emri tamamlandı - #IE-2024-089", time: "1 saat önce", type: "success", icon: Wrench },
              { text: "Kontrat sona eriyor - M/B Atlas", time: "2 gün", type: "warning", icon: AlertCircle },
              { text: "Yeni cari hesap oluşturuldu", time: "3 gün önce", type: "info", icon: Users },
              { text: "Sefer kaydı tamamlandı", time: "5 gün önce", type: "success", icon: Ship },
            ].map((activity, i) => {
              const IconComponent = activity.icon;
              return (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-800 last:border-0">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'success' ? `${theme.colors.primary}/10` : 
                    activity.type === 'warning' ? 'bg-amber-500/10' : 
                    'bg-blue-500/10'
                  }`}>
                    <IconComponent className={`w-4 h-4 ${
                      activity.type === 'success' ? theme.colors.primaryText : 
                      activity.type === 'warning' ? 'text-amber-400' : 
                      'text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.text}</p>
                    <p className={`text-xs ${theme.colors.textMuted} mt-1`}>{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6`}>
          <h3 className="text-lg mb-4">Performans</h3>
          <div className="space-y-4">
            {[
              { label: "Doluluk Oranı", value: 85, color: theme.colors.primary },
              { label: "İş Emri", value: 68, color: "bg-blue-500" },
              { label: "Memnuniyet", value: 92, color: "bg-green-500" },
              { label: "Verimlilik", value: 76, color: "bg-purple-500" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">{stat.label}</span>
                  <span className={`text-sm font-medium ${theme.colors.primaryText}`}>{stat.value}%</span>
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

      {/* Shortcuts Section */}
      <div className="mt-8">
        <h3 className="text-lg mb-4">Hızlı Erişim</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "Yeni Kontrat", icon: Ship, color: theme.colors.primary },
            { title: "İş Emri Oluştur", icon: Wrench, color: "bg-blue-500" },
            { title: "Cari Ekle", icon: Users, color: "bg-green-500" },
            { title: "Sefer Kaydı", icon: Ship, color: "bg-purple-500" },
          ].map((shortcut, i) => {
            const Icon = shortcut.icon;
            return (
              <button
                key={i}
                className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6 hover:border-gray-600 transition-all text-center group`}
              >
                <div className={`p-3 ${shortcut.color}/10 rounded-lg mx-auto w-fit mb-3 group-hover:${shortcut.color}/20 transition-colors`}>
                  <Icon className={`w-6 h-6 ${shortcut.color === theme.colors.primary ? theme.colors.primaryText : shortcut.color.replace('bg-', 'text-')}`} />
                </div>
                <p className="text-sm">{shortcut.title}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
