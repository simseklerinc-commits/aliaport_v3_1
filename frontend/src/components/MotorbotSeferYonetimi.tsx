// MOTORBOT SEFER YÖNETİMİ - SEFER LİSTESİ
// Çıkış/dönüş kayıtları, sefer listesi ve durum takibi
// Faturalandırma ayrı menüde

import { useState } from "react";
import { Theme } from "./ThemeSelector";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Calendar, 
  Ship, 
  Clock, 
  DollarSign, 
  FileText, 
  Filter
} from "lucide-react";
import { 
  MotorbotSefer, 
  motorbotSeferData,
  getSeferStats
} from "../data/motorbotSeferData";

interface MotorbotSeferYonetimiProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  onNavigateToEFatura?: (seferData: any) => void;
  seferler?: MotorbotSefer[];
}

export function MotorbotSeferYonetimi({ 
  onNavigateHome, 
  onNavigateBack, 
  theme, 
  onNavigateToEFatura,
  seferler = []
}: MotorbotSeferYonetimiProps) {
  const [selectedMonth, setSelectedMonth] = useState("2025-11");
  
  // Tüm seferleri birleştir
  const allSefers = [...motorbotSeferData, ...seferler];
  
  // İstatistikler
  const stats = getSeferStats(allSefers);
  
  // Seçili ay için seferleri filtrele
  const filteredSefers = allSefers.filter(sefer => 
    sefer.DepartureDate.startsWith(selectedMonth)
  );
  
  // Motorbota göre grupla
  const motorbotGroups = filteredSefers.reduce((acc, sefer) => {
    const key = sefer.MotorbotCode;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(sefer);
    return acc;
  }, {} as Record<string, MotorbotSefer[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Ship className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Motorbot Sefer Yönetimi</h1>
                <p className="text-sm text-gray-400">
                  Çıkış/dönüş kayıtları ve dönemsel faturalandırma
                </p>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Ship className="w-8 h-8 text-orange-400" />
                <div>
                  <div className="text-3xl font-bold text-orange-400">{stats.total}</div>
                  <div className="text-sm text-gray-400">Toplam Sefer</div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-400" />
                <div>
                  <div className="text-3xl font-bold text-yellow-400">{stats.departed}</div>
                  <div className="text-sm text-gray-400">Denizde</div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-400" />
                <div>
                  <div className="text-3xl font-bold text-purple-400">{stats.uninvoiced}</div>
                  <div className="text-sm text-gray-400">Faturalanmamış</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-400">${stats.totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Toplam Gelir</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Dönem Seçiniz:</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white"
            >
              <option key="list-2025-11" value="2025-11">2025-11</option>
              <option key="list-2025-10" value="2025-10">2025-10</option>
              <option key="list-2025-09" value="2025-09">2025-09</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-gray-700 text-gray-300"
            >
              Filtrele: Tüm Cariler
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-gray-700 text-gray-300"
            >
              Tüm Motorbotlar
            </Button>
          </div>
        </div>

        {/* Sefer Tablosu */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/50 border-b border-gray-700">
                <th className="text-left p-4 text-sm text-gray-400 uppercase">Motorbot</th>
                <th className="text-left p-4 text-sm text-gray-400 uppercase">Çıkış</th>
                <th className="text-left p-4 text-sm text-gray-400 uppercase">Dönüş</th>
                <th className="text-left p-4 text-sm text-gray-400 uppercase">Süre</th>
                <th className="text-left p-4 text-sm text-gray-400 uppercase">Fiyat</th>
                <th className="text-left p-4 text-sm text-gray-400 uppercase">Durum</th>
                <th className="text-right p-4 text-sm text-gray-400 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(motorbotGroups).map(([motorbotCode, sefers]) => (
                sefers.map((sefer) => (
                  <tr key={sefer.Id} className="border-b border-gray-800 hover:bg-gray-800/30">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Ship className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{sefer.MotorbotCode}</div>
                          <div className="text-sm text-gray-400">{sefer.MotorbotName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-white">{sefer.DepartureDate}</div>
                      <div className="text-xs text-gray-400">{sefer.DepartureTime}</div>
                    </td>
                    <td className="p-4">
                      {sefer.ReturnDate ? (
                        <>
                          <div className="text-sm text-white">{sefer.ReturnDate}</div>
                          <div className="text-xs text-gray-400">{sefer.ReturnTime}</div>
                        </>
                      ) : (
                        <div className="text-sm text-yellow-400">Beklemede</div>
                      )}
                    </td>
                    <td className="p-4">
                      {sefer.Duration ? (
                        <div className="text-sm text-white">
                          {Math.floor(sefer.Duration / 60)}s {sefer.Duration % 60}dk
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">-</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-green-400">
                        ${sefer.TotalPrice.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">KDV: ${sefer.VatAmount.toFixed(2)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {sefer.Status === 'DEPARTED' ? (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                            Denizde
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            Döndü
                          </Badge>
                        )}
                        {sefer.IsInvoiced && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">
                            Faturalandı
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                          Görüntüle
                        </Button>
                        <Button size="sm" variant="ghost" className="text-yellow-400 hover:text-yellow-300">
                          Düzenle
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                          Sil
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
          
          {filteredSefers.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Ship className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Bu dönem için sefer kaydı bulunamadı</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div>Toplam {filteredSefers.length} sefer</div>
          <div className="flex gap-2">
            <span>KDV: %{allSefers[0]?.VatRate || 18}</span>
            <span>•</span>
            <span>Fiyat: ${allSefers[0]?.UnitPrice || 10}/sefer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
