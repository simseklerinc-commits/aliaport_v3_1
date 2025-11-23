// MOTORBOT SEFER RAPOR MODÜLÜ
// 3 Bloklu Layout - Sol: Filtreler | Orta: Sefer Listesi/Rapor | Sağ: Özet İstatistikler
// Çıkış/dönüş kayıtları, sefer listesi ve durum takibi

import { useState } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { 
  Calendar, 
  Ship, 
  Clock, 
  DollarSign, 
  FileText, 
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { 
  MotorbotSefer, 
  motorbotSeferData,
  getSeferStats
} from "../../data/motorbotSeferData";

interface SeferRaporModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  onNavigateToEFatura?: (seferData: any) => void;
  seferler?: MotorbotSefer[];
}

export function SeferRaporModule({ 
  onNavigateHome, 
  onNavigateBack, 
  theme, 
  onNavigateToEFatura,
  seferler = []
}: SeferRaporModuleProps) {
  const [selectedMonth, setSelectedMonth] = useState("2025-11");
  const [selectedMotorbot, setSelectedMotorbot] = useState<string>("all");
  const [selectedCari, setSelectedCari] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string>("all");
  
  // Tüm seferleri birleştir
  const allSefers = [...motorbotSeferData, ...seferler];
  
  // İstatistikler
  const stats = getSeferStats(allSefers);
  
  // Seçili ay için seferleri filtrele
  const filteredSefers = allSefers.filter(sefer => {
    const matchMonth = sefer.DepartureDate.startsWith(selectedMonth);
    const matchMotorbot = selectedMotorbot === "all" || sefer.MotorbotCode === selectedMotorbot;
    const matchCari = selectedCari === "all" || sefer.CariCode === selectedCari;
    const matchStatus = selectedStatus === "all" || sefer.Status === selectedStatus;
    const matchInvoice = selectedInvoiceStatus === "all" || 
      (selectedInvoiceStatus === "invoiced" && sefer.IsInvoiced) ||
      (selectedInvoiceStatus === "not-invoiced" && !sefer.IsInvoiced);
    
    return matchMonth && matchMotorbot && matchCari && matchStatus && matchInvoice;
  });
  
  // Unique motorbot ve cari listesi
  const uniqueMotorbots = Array.from(new Set(allSefers.map(s => s.MotorbotCode)));
  const uniqueCaris = Array.from(new Set(allSefers.map(s => s.CariCode).filter(Boolean)));
  
  // Toplam hesaplamalar
  const totalRevenue = filteredSefers.reduce((sum, s) => sum + s.TotalPrice, 0);
  const totalVat = filteredSefers.reduce((sum, s) => sum + s.VatAmount, 0);
  const totalDuration = filteredSefers.reduce((sum, s) => sum + (s.Duration || 0), 0);
  const invoicedCount = filteredSefers.filter(s => s.IsInvoiced).length;
  const departedCount = filteredSefers.filter(s => s.Status === 'DEPARTED').length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ÜSTTE GENEL İSTATİSTİKLER */}
      <div className={`${theme.colors.bgCard} border-b ${theme.colors.border} p-4`}>
        <div className="grid grid-cols-5 gap-3">
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${theme.colors.primary} bg-opacity-20 flex items-center justify-center`}>
                <Ship className={`w-5 h-5 ${theme.colors.text}`} />
              </div>
              <div>
                <div className={`text-xs ${theme.colors.textMuted}`}>Toplam Sefer</div>
                <div className="text-2xl font-bold">{filteredSefers.length}</div>
              </div>
            </div>
          </Card>
          
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className={`text-xs ${theme.colors.textMuted}`}>Denizde</div>
                <div className="text-2xl font-bold text-yellow-500">{departedCount}</div>
              </div>
            </div>
          </Card>
          
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className={`text-xs ${theme.colors.textMuted}`}>Faturalanmamış</div>
                <div className="text-2xl font-bold text-purple-500">{filteredSefers.length - invoicedCount}</div>
              </div>
            </div>
          </Card>
          
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className={`text-xs ${theme.colors.textMuted}`}>Toplam Gelir</div>
                <div className="text-lg font-bold text-green-500">${totalRevenue.toFixed(2)}</div>
              </div>
            </div>
          </Card>
          
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className={`text-xs ${theme.colors.textMuted}`}>Ort. Sefer Süresi</div>
                <div className="text-lg font-bold text-blue-500">
                  {filteredSefers.length > 0 ? Math.round(totalDuration / filteredSefers.length) : 0} dk
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 3 BLOKLU LAYOUT */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* SOL BLOK - FİLTRELER */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <div className="flex items-center gap-2 mb-4">
              <Filter className={`w-5 h-5 ${theme.colors.primary}`} />
              <h3 className="font-semibold">Filtreler</h3>
            </div>
            
            <div className="space-y-4">
              {/* Dönem Filtresi */}
              <div>
                <label className={`text-sm ${theme.colors.textMuted} block mb-2`}>
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Dönem
                </label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`w-full ${theme.colors.bg} border ${theme.colors.border} rounded px-3 py-2 text-sm`}
                >
                  <option value="2025-11">Kasım 2025</option>
                  <option value="2025-10">Ekim 2025</option>
                  <option value="2025-09">Eylül 2025</option>
                  <option value="2025-08">Ağustos 2025</option>
                </select>
              </div>

              {/* Motorbot Filtresi */}
              <div>
                <label className={`text-sm ${theme.colors.textMuted} block mb-2`}>
                  <Ship className="w-4 h-4 inline mr-1" />
                  Motorbot
                </label>
                <select 
                  value={selectedMotorbot}
                  onChange={(e) => setSelectedMotorbot(e.target.value)}
                  className={`w-full ${theme.colors.bg} border ${theme.colors.border} rounded px-3 py-2 text-sm`}
                >
                  <option value="all">Tüm Motorbotlar</option>
                  {uniqueMotorbots.map(mb => (
                    <option key={mb} value={mb}>{mb}</option>
                  ))}
                </select>
              </div>

              {/* Cari Filtresi */}
              <div>
                <label className={`text-sm ${theme.colors.textMuted} block mb-2`}>
                  Cari Hesap
                </label>
                <select 
                  value={selectedCari}
                  onChange={(e) => setSelectedCari(e.target.value)}
                  className={`w-full ${theme.colors.bg} border ${theme.colors.border} rounded px-3 py-2 text-sm`}
                >
                  <option value="all">Tüm Cariler</option>
                  {uniqueCaris.map(cari => (
                    <option key={cari} value={cari}>{cari}</option>
                  ))}
                </select>
              </div>

              {/* Durum Filtresi */}
              <div>
                <label className={`text-sm ${theme.colors.textMuted} block mb-2`}>
                  Sefer Durumu
                </label>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`w-full ${theme.colors.bg} border ${theme.colors.border} rounded px-3 py-2 text-sm`}
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="DEPARTED">Denizde</option>
                  <option value="RETURNED">Döndü</option>
                </select>
              </div>

              {/* Fatura Durumu Filtresi */}
              <div>
                <label className={`text-sm ${theme.colors.textMuted} block mb-2`}>
                  Fatura Durumu
                </label>
                <select 
                  value={selectedInvoiceStatus}
                  onChange={(e) => setSelectedInvoiceStatus(e.target.value)}
                  className={`w-full ${theme.colors.bg} border ${theme.colors.border} rounded px-3 py-2 text-sm`}
                >
                  <option value="all">Tümü</option>
                  <option value="invoiced">Faturalandı</option>
                  <option value="not-invoiced">Faturalanmadı</option>
                </select>
              </div>

              {/* Temizle Butonu */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSelectedMotorbot("all");
                  setSelectedCari("all");
                  setSelectedStatus("all");
                  setSelectedInvoiceStatus("all");
                }}
              >
                Filtreleri Temizle
              </Button>
            </div>
          </Card>

          {/* EXPORT */}
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <h3 className="font-semibold mb-3">Dışa Aktar</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Excel Raporu
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Download className="w-4 h-4 mr-2" />
                PDF Raporu
              </Button>
            </div>
          </Card>
        </div>

        {/* ORTA BLOK - SEFER LİSTESİ */}
        <div className="col-span-6 overflow-y-auto">
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border}`}>
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold">Sefer Listesi ({filteredSefers.length})</h3>
            </div>
            
            <div className="overflow-auto">
              <table className="w-full">
                <thead className={`sticky top-0 ${theme.colors.bg}`}>
                  <tr className="border-b border-gray-700">
                    <th className={`text-left p-3 text-xs ${theme.colors.textMuted} uppercase`}>Motorbot</th>
                    <th className={`text-left p-3 text-xs ${theme.colors.textMuted} uppercase`}>Çıkış</th>
                    <th className={`text-left p-3 text-xs ${theme.colors.textMuted} uppercase`}>Dönüş</th>
                    <th className={`text-center p-3 text-xs ${theme.colors.textMuted} uppercase`}>Süre</th>
                    <th className={`text-right p-3 text-xs ${theme.colors.textMuted} uppercase`}>Tutar</th>
                    <th className={`text-center p-3 text-xs ${theme.colors.textMuted} uppercase`}>Durum</th>
                    <th className={`text-center p-3 text-xs ${theme.colors.textMuted} uppercase`}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSefers.map((sefer) => (
                    <tr key={sefer.Id} className={`border-b ${theme.colors.border} hover:${theme.colors.bg} transition-colors`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <Ship className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{sefer.MotorbotCode}</div>
                            <div className={`text-xs ${theme.colors.textMuted}`}>{sefer.MotorbotName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{sefer.DepartureDate}</div>
                        <div className={`text-xs ${theme.colors.textMuted}`}>{sefer.DepartureTime}</div>
                      </td>
                      <td className="p-3">
                        {sefer.ReturnDate ? (
                          <>
                            <div className="text-sm">{sefer.ReturnDate}</div>
                            <div className={`text-xs ${theme.colors.textMuted}`}>{sefer.ReturnTime}</div>
                          </>
                        ) : (
                          <div className="text-sm text-yellow-500">Beklemede</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {sefer.Duration ? (
                          <div className="text-sm">
                            {Math.floor(sefer.Duration / 60)}s {sefer.Duration % 60}dk
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">-</div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="text-sm font-medium text-green-500">
                          ${sefer.TotalPrice.toFixed(2)}
                        </div>
                        <div className={`text-xs ${theme.colors.textMuted}`}>
                          KDV: ${sefer.VatAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col items-center gap-1">
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
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredSefers.length === 0 && (
                <div className="p-12 text-center">
                  <Ship className={`w-16 h-16 mx-auto mb-4 ${theme.colors.textMuted} opacity-20`} />
                  <p className={theme.colors.textMuted}>Bu filtrelere uygun sefer kaydı bulunamadı</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* SAĞ BLOK - ÖZET İSTATİSTİKLER & DETAYLAR */}
        <div className="col-span-3 space-y-4 overflow-y-auto">
          {/* Özet Bilgiler */}
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <h3 className="font-semibold mb-4">Özet Bilgiler</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme.colors.textMuted}`}>Toplam Sefer:</span>
                <span className="font-semibold">{filteredSefers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme.colors.textMuted}`}>Faturalandı:</span>
                <span className="font-semibold text-blue-500">{invoicedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${theme.colors.textMuted}`}>Faturalanmadı:</span>
                <span className="font-semibold text-purple-500">{filteredSefers.length - invoicedCount}</span>
              </div>
              <div className={`border-t ${theme.colors.border} pt-3 mt-3`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${theme.colors.textMuted}`}>Brüt Toplam:</span>
                  <span className="font-semibold">${(totalRevenue - totalVat).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm ${theme.colors.textMuted}`}>KDV:</span>
                  <span className="font-semibold">${totalVat.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Net Toplam:</span>
                  <span className="font-bold text-green-500">${totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Motorbot Dağılımı */}
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <h3 className="font-semibold mb-4">Motorbot Dağılımı</h3>
            <div className="space-y-2">
              {uniqueMotorbots.map(mb => {
                const count = filteredSefers.filter(s => s.MotorbotCode === mb).length;
                const percentage = filteredSefers.length > 0 ? (count / filteredSefers.length * 100) : 0;
                return (
                  <div key={mb}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{mb}</span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                    <div className={`w-full h-2 ${theme.colors.bg} rounded-full overflow-hidden`}>
                      <div 
                        className={`h-full ${theme.colors.primary}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Uyarılar */}
          <Card className={`${theme.colors.bgCard} border ${theme.colors.border} p-4`}>
            <h3 className="font-semibold mb-4">Uyarılar</h3>
            <div className="space-y-3">
              {departedCount > 0 && (
                <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-yellow-500">Denizde Olan Sefer</div>
                    <div className={`text-xs ${theme.colors.textMuted}`}>{departedCount} motorbot hala denizde</div>
                  </div>
                </div>
              )}
              {filteredSefers.length - invoicedCount > 0 && (
                <div className="flex items-start gap-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded">
                  <FileText className="w-4 h-4 text-purple-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-purple-500">Faturalanmamış Sefer</div>
                    <div className={`text-xs ${theme.colors.textMuted}`}>{filteredSefers.length - invoicedCount} sefer bekliyor</div>
                  </div>
                </div>
              )}
              {departedCount === 0 && invoicedCount === filteredSefers.length && filteredSefers.length > 0 && (
                <div className="flex items-start gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-green-500">Tüm Seferler Tamamlandı</div>
                    <div className={`text-xs ${theme.colors.textMuted}`}>Tüm seferler faturalandı</div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
