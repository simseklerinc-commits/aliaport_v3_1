import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Search,
  RefreshCw,
  Download,
  ArrowLeft,
  DollarSign
} from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Theme } from "./ThemeSelector";
import { kurlarApi, type ExchangeRate } from "../lib/api/kurlar";
import { currencyMasterData } from "../data/parametersData";
import { toast } from "sonner";

interface KurlarProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

// Para birimi flag mapping
const CURRENCY_FLAGS: { [key: string]: string } = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  CHF: "🇨🇭",
  JPY: "🇯🇵",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  SAR: "🇸🇦",
  SEK: "🇸🇪",
  NOK: "🇳🇴",
  DKK: "🇩🇰",
  KWD: "🇰🇼",
  TRY: "🇹🇷",
};

export function Kurlar({ onNavigateHome, onNavigateBack, theme }: KurlarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");

  // Kurları yükle
  const loadRates = async (date: string) => {
    setLoading(true);
    try {
      // Gerçek API'den kurları çek (tarihe göre tüm kurlar)
      const response = await kurlarApi.getByDateAll(date);
      
      if (response && response.length > 0) {
        setRates(response);
        const previousDay = new Date(date);
        previousDay.setDate(previousDay.getDate() - 1);
        setLastUpdateTime(`${previousDay.toLocaleDateString('tr-TR')} 15:30`);
        toast.success(`${response.length} kur başarıyla yüklendi`);
      } else {
        // Eğer o gün için kur yoksa, bugünün kurlarını getir
        const todayRates = await kurlarApi.getToday();
        setRates(todayRates);
        setLastUpdateTime(new Date().toLocaleDateString('tr-TR') + ' 15:30');
        if (todayRates.length > 0) {
          toast.info(`Bugünkü ${todayRates.length} kur gösteriliyor`);
        } else {
          toast.warning('Henüz kur bilgisi yok');
        }
      }
    } catch (error) {
      console.error('Kurlar yüklenemedi:', error);
      toast.error('Kurlar yüklenemedi', {
        description: error instanceof Error ? error.message : 'Bilinmeyen hata'
      });
      setRates([]);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme - bugünün kurları
  useEffect(() => {
    loadRates(selectedDate);
  }, []);

  // Tarih değiştiğinde kurları yükle
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    loadRates(date);
  };

  // EVDS API'sinden kurları yenile (geçmiş tarihler dahil)
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // EVDS API'sinden kurları çek (tatil günleri için önceki iş gününün kurları otomatik gelir)
      const updatedRates = await kurlarApi.fetchFromEVDS(selectedDate);
      toast.success('TCMB kurları güncellendi', {
        description: `${updatedRates.length} kur kaydı eklendi/güncellendi`
      });
      await loadRates(selectedDate);
    } catch (error: any) {
      console.error('Kurlar güncellenemedi:', error);
      
      // Backend error mesajını kullan
      const errorMessage = error?.message || 'TCMB kurları güncellenemedi';
      
      toast.error('TCMB güncellemesi başarısız', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Arama filtresi
  const filteredRates = rates.filter(rate => {
    const currency = currencyMasterData.find(c => c.code === rate.currency_from);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      rate.currency_from.toLowerCase().includes(searchLower) ||
      (currency?.name.toLowerCase().includes(searchLower))
    );
  });

  // Kur değişim yüzdesini hesapla (mock - gerçekte bir önceki günle karşılaştırılacak)
  const calculateChange = (rate: number): number => {
    // Mock: Rastgele değişim %
    return (Math.random() - 0.5) * 2; // -1% ile +1% arası
  };

  // Para birimi adını getir
  const getCurrencyName = (code: string): string => {
    const currency = currencyMasterData.find(c => c.code === code);
    return currency?.name || code;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 flex items-center gap-3">
            <DollarSign className={`w-8 h-8 ${theme.colors.primaryText}`} />
            Döviz Kurları
          </h1>
          <p className="text-base text-gray-200">
            T.C. Merkez Bankası Günlük Döviz Kurları {lastUpdateTime && `- Son Güncelleme: ${lastUpdateTime}`}
          </p>
        </div>
        <Button 
          onClick={onNavigateHome}
          variant="outline"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ana Menü
        </Button>
      </div>

      {/* Kontrol Paneli */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Tarih Seçici */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-48 bg-gray-800 text-white border-gray-700 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-50"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Arama */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Para birimi ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 text-white border-gray-700 placeholder:text-gray-500"
          />
        </div>

        {/* Yenile Butonu */}
        <Button
          onClick={handleRefresh}
          disabled={loading}
          className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          TCMB'den Güncelle
        </Button>

        {/* Excel Export */}
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Excel
        </Button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {filteredRates.slice(0, 4).map((rate) => {
          const change = calculateChange(rate.rate);
          const isPositive = change > 0;
          
          return (
            <Card key={rate.id} className={`${theme.colors.bgCard} border-${theme.colors.border}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CURRENCY_FLAGS[rate.currency_from] || "🏳️"}</span>
                    <div>
                      <CardTitle className="text-lg">{rate.currency_from}</CardTitle>
                      <CardDescription className="text-sm text-gray-300">
                        {getCurrencyName(rate.currency_from)}
                      </CardDescription>
                    </div>
                  </div>
                  {isPositive ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl">{rate.rate.toFixed(4)}</span>
                    <span className="text-sm text-gray-400">TRY</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${isPositive ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'}`}
                  >
                    {isPositive ? '+' : ''}{change.toFixed(2)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ana Tablo */}
      <Card className={`${theme.colors.bgCard} border-${theme.colors.border}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-white">
            <Calendar className="w-5 h-5" />
            {new Date(selectedDate).toLocaleDateString('tr-TR', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              weekday: 'long'
            })} Günü Döviz Kurları
          </CardTitle>
          <CardDescription className="text-base text-gray-200">
            {filteredRates.length} para birimi - TCMB resmi kurları
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-400">Kurlar yükleniyor...</span>
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Seçilen tarih için kur bilgisi bulunamadı.</p>
              <p className="text-sm mt-2">Lütfen farklı bir tarih seçin.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-800/50 hover:bg-gray-800/50">
                    <TableHead className="text-base text-gray-300 w-12"></TableHead>
                    <TableHead className="text-base text-gray-300">Döviz Kodu</TableHead>
                    <TableHead className="text-base text-gray-300">Döviz Adı</TableHead>
                    <TableHead className="text-base text-gray-300 text-right">Birim</TableHead>
                    <TableHead className="text-base text-gray-300 text-right">Döviz Alış</TableHead>
                    <TableHead className="text-base text-gray-300 text-right">Döviz Satış</TableHead>
                    <TableHead className="text-base text-gray-300 text-right">Efektif Alış</TableHead>
                    <TableHead className="text-base text-gray-300 text-right">Efektif Satış</TableHead>
                    <TableHead className="text-base text-gray-300 text-right">Değişim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRates.map((rate, index) => {
                    const change = calculateChange(rate.rate);
                    const isPositive = change > 0;
                    const buyRate = rate.rate * 0.998; // Alış kuru (mock)
                    const sellRate = rate.rate * 1.002; // Satış kuru (mock)
                    const effectiveBuy = rate.rate * 0.995; // Efektif alış (mock)
                    const effectiveSell = rate.rate * 1.005; // Efektif satış (mock)
                    
                    return (
                      <TableRow 
                        key={rate.id} 
                        className={index % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-900/50'}
                      >
                        <TableCell className="text-2xl">
                          {CURRENCY_FLAGS[rate.currency_from] || "🏳️"}
                        </TableCell>
                        <TableCell>
                          <code className="text-base bg-gray-800 px-3 py-1.5 rounded text-white">
                            {rate.currency_from}
                          </code>
                        </TableCell>
                        <TableCell className="text-base text-white">
                          {getCurrencyName(rate.currency_from)}
                        </TableCell>
                        <TableCell className="text-base text-gray-300 text-right">
                          1
                        </TableCell>
                        <TableCell className="text-base text-white text-right font-mono">
                          ₺{buyRate.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-base text-white text-right font-mono">
                          ₺{sellRate.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-base text-gray-300 text-right font-mono">
                          ₺{effectiveBuy.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-base text-gray-300 text-right font-mono">
                          ₺{effectiveSell.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant="outline"
                            className={`${
                              isPositive 
                                ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                                : 'bg-red-500/20 text-red-300 border-red-500/30'
                            } text-base font-mono`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-4 h-4 mr-1 inline" />
                            ) : (
                              <TrendingDown className="w-4 h-4 mr-1 inline" />
                            )}
                            {isPositive ? '+' : ''}{change.toFixed(2)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alt Bilgi */}
      <Card className={`${theme.colors.bgCard} border-${theme.colors.border} bg-blue-500/10 border-blue-500/30`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-base mb-2 text-blue-300">Döviz Kurları Hakkında</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• TCMB döviz kurları her iş günü saat 15:30'da yayınlanır</li>
                <li>• Örneğin: 19 Kasım 2025 kurları, 18 Kasım 2025 saat 15:30'da açıklanır</li>
                <li>• Kurlar bir önceki iş gününün kapanış değerlerine göre belirlenir</li>
                <li>• Döviz alış: Bankanın döviz alış kuru | Döviz satış: Bankanın döviz satış kuru</li>
                <li>• Efektif kurlar nakit döviz alım-satımında kullanılır</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}