// GÜVENLİK - Tablet Modülü
// Güvenlik personeli için özel mobil-optimized ekran

import { Theme } from "./ThemeSelector";
import { Button } from "./ui/button";
import { Shield, ArrowLeft, Clock, Users, AlertTriangle, CheckCircle } from "lucide-react";

interface GuvenlikProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

export function Guvenlik({ onNavigateHome, onNavigateBack, theme }: GuvenlikProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 p-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onNavigateBack}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Shield className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h1 className="text-2xl">Güvenlik Modülü</h1>
                <p className="text-sm text-gray-400">Tablet Modu - Geliştirme Aşamasında</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Tarih</div>
            <div className="text-lg">{new Date().toLocaleDateString('tr-TR')}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="text-3xl mb-1">24</div>
            <div className="text-sm text-gray-400">Aktif Personel</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="text-3xl mb-1">156</div>
            <div className="text-sm text-gray-400">Ziyaretçi</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="text-3xl mb-1">12</div>
            <div className="text-sm text-gray-400">Bekleyen</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="text-3xl mb-1">3</div>
            <div className="text-sm text-gray-400">Uyarı</div>
          </div>
        </div>

        {/* Under Development Notice */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-orange-500/20 rounded-full">
              <Shield className="w-12 h-12 text-orange-400" />
            </div>
          </div>
          <h2 className="text-2xl mb-2">Güvenlik Modülü</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Bu modül tablet cihazlar için optimize edilmiş şekilde geliştirilmektedir.
            Güvenlik personelinin kullanımına yönelik özellikler yakında eklenecektir.
          </p>
          <div className="space-y-2 text-sm text-gray-400 max-w-md mx-auto text-left">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2"></div>
              <span>Personel giriş/çıkış kayıtları</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2"></div>
              <span>Ziyaretçi yönetimi ve takibi</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2"></div>
              <span>Araç giriş/çıkış kontrolleri</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2"></div>
              <span>Güvenlik raporları ve istatistikler</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2"></div>
              <span>Olay kayıt ve takip sistemi</span>
            </div>
          </div>
        </div>

        {/* Quick Actions - Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            disabled
            size="lg"
            className="bg-gray-800/50 border border-gray-700 hover:bg-gray-800 text-white h-20"
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="w-6 h-6" />
              <span>Personel Giriş</span>
            </div>
          </Button>

          <Button
            disabled
            size="lg"
            className="bg-gray-800/50 border border-gray-700 hover:bg-gray-800 text-white h-20"
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="w-6 h-6" />
              <span>Ziyaretçi Kayıt</span>
            </div>
          </Button>

          <Button
            disabled
            size="lg"
            className="bg-gray-800/50 border border-gray-700 hover:bg-gray-800 text-white h-20"
          >
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-6 h-6" />
              <span>Geçmiş Kayıtlar</span>
            </div>
          </Button>

          <Button
            disabled
            size="lg"
            className="bg-gray-800/50 border border-gray-700 hover:bg-gray-800 text-white h-20"
          >
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              <span>Olay Bildir</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
