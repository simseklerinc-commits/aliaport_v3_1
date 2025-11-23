// SEFER FATURALANDIRMA - İKİ KIRILIMLI GÖRÜNÜM
// Dönem → Cari → Sefer Detayları
// Dönemsel faturalandırma ve fatura oluşturma

import { useState } from "react";
import { Theme } from "./ThemeSelector";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Calendar, 
  Ship, 
  FileText, 
  ChevronDown,
  ChevronRight,
  Building2,
  CheckCircle2
} from "lucide-react";
import { 
  MotorbotSefer, 
  motorbotSeferData,
  getSeferStats,
  groupSefersByPeriod,
  getPeriodSummary
} from "../data/motorbotSeferData";
import { cariMasterData } from "../data/cariData";

interface SeferFaturalandirmaProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  seferler?: MotorbotSefer[];
}

export function SeferFaturalandirma({ 
  onNavigateHome, 
  onNavigateBack, 
  theme,
  seferler = []
}: SeferFaturalandirmaProps) {
  const [selectedMonth, setSelectedMonth] = useState("2025-11");
  const [selectedCari, setSelectedCari] = useState<string | null>(null);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [expandedCaris, setExpandedCaris] = useState<Set<string>>(new Set());
  
  // Tüm seferleri birleştir
  const allSefers = [...motorbotSeferData, ...seferler];
  
  // İstatistikler
  const stats = getSeferStats(allSefers);
  
  // Seçili döneme göre filtrele
  const filteredSefers = allSefers.filter(sefer => 
    sefer.DepartureDate.startsWith(selectedMonth)
  );
  
  // Fatura dönemlerine göre grupla
  const periodGroups = groupSefersByPeriod(filteredSefers);
  const periods = Object.keys(periodGroups).sort().reverse();
  
  // Dönem içindeki carilere göre grupla
  const groupByCari = (sefers: MotorbotSefer[]) => {
    return sefers.reduce((acc, sefer) => {
      const cariCode = sefer.CariCode || 'UNKNOWN';
      if (!acc[cariCode]) {
        acc[cariCode] = [];
      }
      acc[cariCode].push(sefer);
      return acc;
    }, {} as Record<string, MotorbotSefer[]>);
  };
  
  // Dönem toggle
  const togglePeriod = (period: string) => {
    const newExpanded = new Set(expandedPeriods);
    if (newExpanded.has(period)) {
      newExpanded.delete(period);
    } else {
      newExpanded.add(period);
    }
    setExpandedPeriods(newExpanded);
  };
  
  // Cari toggle
  const toggleCari = (cariCode: string) => {
    const newExpanded = new Set(expandedCaris);
    if (newExpanded.has(cariCode)) {
      newExpanded.delete(cariCode);
    } else {
      newExpanded.add(cariCode);
    }
    setExpandedCaris(newExpanded);
  };
  
  // Cari bilgisi al
  const getCariInfo = (cariCode: string) => {
    return cariMasterData.find(c => c.code === cariCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Sefer Faturalandırma</h1>
                <p className="text-sm text-gray-400">
                  Dönemsel faturalandırma ve cari bazlı fatura oluşturma
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Faturalanmamış Sefer</div>
                <div className="text-2xl font-bold text-orange-400">{stats.uninvoiced}</div>
              </div>
              
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => alert('Toplu faturalandırma başlatıldı!')}
                disabled={stats.uninvoiced === 0}
              >
                <FileText className="w-5 h-5 mr-2" />
                Toplu Faturalandır
                {stats.uninvoiced > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{stats.uninvoiced}</Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Faturalandırma Dönemleri */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg">
          {/* Filter Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-400" />
                Faturalandırma Dönemleri
              </h2>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Dönem Seçiniz:</label>
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option key="period-2025-11" value="2025-11">2025-11</option>
                    <option key="period-2025-10" value="2025-10">2025-10</option>
                    <option key="period-2025-09" value="2025-09">2025-09</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Cari:</label>
                  <select 
                    value={selectedCari || 'ALL'}
                    onChange={(e) => setSelectedCari(e.target.value === 'ALL' ? null : e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option key="cari-ALL" value="ALL">Tüm Cariler</option>
                    {cariMasterData.map(cari => (
                      <option key={`cari-${cari.id}`} value={cari.code}>{cari.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dönem Listesi (İki Kırılımlı) */}
          <div className="divide-y divide-gray-700">
            {periods.length === 0 ? (
              <div className="p-12 text-center">
                <Ship className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
                <p className="text-gray-400">Bu dönem için sefer kaydı bulunamadı</p>
              </div>
            ) : (
              periods.map(period => {
                const periodSefers = periodGroups[period] || [];
                const periodSummary = getPeriodSummary(period, allSefers);
                const isPeriodExpanded = expandedPeriods.has(period);
                const cariGroups = groupByCari(periodSefers);
                const cariCodes = Object.keys(cariGroups).sort();
                
                // Cari filtresini uygula
                const filteredCariCodes = selectedCari 
                  ? cariCodes.filter(code => code === selectedCari)
                  : cariCodes;
                
                if (filteredCariCodes.length === 0 && selectedCari) return null;
                
                return (
                  <div key={period}>
                    {/* DÖNEM BAŞLIĞI (1. Kırılım) */}
                    <button
                      onClick={() => togglePeriod(period)}
                      className="w-full p-6 hover:bg-gray-800/30 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {isPeriodExpanded ? (
                            <ChevronDown className="w-5 h-5 text-blue-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                          
                          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-400" />
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {period.split('-').reverse().join('.')} Ay Dönemi
                            </h3>
                            <p className="text-sm text-gray-400">
                              {periodSummary.SeferCount} sefer • {filteredCariCodes.length} cari • {periodSummary.StartDate} - {periodSummary.EndDate}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">
                              ${periodSummary.TotalAmount.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">Dönem Geliri</div>
                          </div>
                          
                          {periodSummary.IsInvoiced ? (
                            <Badge className="bg-green-500/20 text-green-400 border border-green-500">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Faturalandı
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500">
                              Bekliyor
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* CARİ GRUPLARI (2. Kırılım) */}
                    {isPeriodExpanded && (
                      <div className="bg-gray-900/30 border-t border-gray-700">
                        {filteredCariCodes.map(cariCode => {
                          const cariSefers = cariGroups[cariCode];
                          const cariInfo = getCariInfo(cariCode);
                          const isCariExpanded = expandedCaris.has(`${period}-${cariCode}`);
                          const cariTotal = cariSefers.reduce((sum, s) => sum + s.TotalPrice, 0);
                          const cariUninvoiced = cariSefers.filter(s => !s.IsInvoiced && s.Status === 'RETURNED').length;
                          
                          return (
                            <div key={cariCode} className="border-b border-gray-800 last:border-b-0">
                              {/* CARİ BAŞLIĞI */}
                              <div className="w-full p-5 pl-16 hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <button
                                    onClick={() => toggleCari(`${period}-${cariCode}`)}
                                    className="flex items-center gap-4 flex-1 text-left"
                                  >
                                    {isCariExpanded ? (
                                      <ChevronDown className="w-5 h-5 text-green-400" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-gray-400" />
                                    )}
                                    
                                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                      <Building2 className="w-5 h-5 text-green-400" />
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-bold text-white">
                                        {cariInfo?.title || cariCode}
                                      </h4>
                                      <p className="text-sm text-gray-400">
                                        {cariCode} • {cariSefers.length} sefer
                                      </p>
                                    </div>
                                  </button>
                                  
                                  <div className="flex items-center gap-6">
                                    <div className="text-right">
                                      <div className="text-xl font-bold text-green-400">
                                        ${cariTotal.toFixed(2)}
                                      </div>
                                      <div className="text-xs text-gray-400">Cari Toplamı</div>
                                    </div>
                                    
                                    {cariUninvoiced > 0 ? (
                                      <Button 
                                        size="sm"
                                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          alert(`${cariInfo?.title || cariCode} için ${cariUninvoiced} sefer faturalandırılacak!`);
                                        }}
                                      >
                                        <FileText className="w-4 h-4 mr-1" />
                                        Fatura Oluştur ({cariUninvoiced})
                                      </Button>
                                    ) : (
                                      <Badge className="bg-green-500/20 text-green-400 border border-green-500">
                                        Tamamlandı
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* SEFER DETAYLARI */}
                              {isCariExpanded && (
                                <div className="bg-gray-950/50 p-6 pl-24">
                                  <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="bg-gray-900/80 border-b border-gray-800">
                                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Motorbot</th>
                                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Çıkış</th>
                                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Dönüş</th>
                                          <th className="text-left p-3 text-xs text-gray-400 uppercase">Süre</th>
                                          <th className="text-right p-3 text-xs text-gray-400 uppercase">Fiyat</th>
                                          <th className="text-center p-3 text-xs text-gray-400 uppercase">Durum</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {cariSefers.map(sefer => (
                                          <tr 
                                            key={sefer.Id} 
                                            className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                                          >
                                            <td className="p-3">
                                              <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                                  <Ship className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div>
                                                  <div className="text-sm font-medium text-white">{sefer.MotorbotCode}</div>
                                                  <div className="text-xs text-gray-500">{sefer.MotorbotName}</div>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="p-3">
                                              <div className="text-sm text-white">{sefer.DepartureDate}</div>
                                              <div className="text-xs text-gray-400">{sefer.DepartureTime}</div>
                                            </td>
                                            <td className="p-3">
                                              {sefer.ReturnDate ? (
                                                <>
                                                  <div className="text-sm text-white">{sefer.ReturnDate}</div>
                                                  <div className="text-xs text-gray-400">{sefer.ReturnTime}</div>
                                                </>
                                              ) : (
                                                <div className="text-sm text-yellow-400">Beklemede</div>
                                              )}
                                            </td>
                                            <td className="p-3">
                                              {sefer.Duration ? (
                                                <div className="text-sm text-purple-400">
                                                  {Math.floor(sefer.Duration / 60)}s {sefer.Duration % 60}dk
                                                </div>
                                              ) : (
                                                <div className="text-sm text-gray-500">-</div>
                                              )}
                                            </td>
                                            <td className="p-3 text-right">
                                              <div className="text-sm font-bold text-green-400">
                                                ${sefer.TotalPrice.toFixed(2)}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                KDV: ${sefer.VatAmount.toFixed(2)}
                                              </div>
                                            </td>
                                            <td className="p-3">
                                              <div className="flex flex-col gap-1 items-center">
                                                {sefer.Status === 'DEPARTED' ? (
                                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                                                    Denizde
                                                  </Badge>
                                                ) : (
                                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
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
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-blue-300">
              <FileText className="w-4 h-4" />
              <span>Motorbot sefer kayıtları dönemsel olarak faturalandırılır. Her cari için ayrı fatura oluşturulabilir.</span>
            </div>
            <div className="flex gap-4 text-gray-400">
              <span>Birim Fiyat: $10.00</span>
              <span>•</span>
              <span>KDV: %18</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}