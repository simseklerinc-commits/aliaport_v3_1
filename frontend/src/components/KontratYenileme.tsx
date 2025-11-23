import { useState } from "react";
import { Theme } from "./ThemeSelector";
import { 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  FileText, 
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { priceListMasterData, priceListItemMasterData } from "../data/priceListData";
import { serviceCardMasterData } from "../data/serviceCardData";

interface KontratYenilemeProps {
  kontrat: {
    KontratNo: string;
    CariKod: string;
    CariAdi: string;
    TekneAdi: string;
    TamBoy: number;
    Periyot: string;
    Baslangic: string;
    Bitis: string;
    TarifeKod: string;
    TarifeAdi: string;
    Fiyat: number;
    Para: string;
    Kdv: number;
    Durum: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onRenew: (renewalData: any) => void;
  theme: Theme;
}

export function KontratYenileme({ kontrat, isOpen, onClose, onRenew, theme }: KontratYenilemeProps) {
  const [step, setStep] = useState<'review' | 'confirm' | 'success'>('review');
  
  const [renewalData, setRenewalData] = useState({
    yeniBaslangic: kontrat.Bitis, // Eski bitiş = Yeni başlangıç
    yeniBitis: calculateEndDate(kontrat.Bitis, kontrat.Periyot),
    eskiFiyat: kontrat.Fiyat,
    yeniFiyat: kontrat.Fiyat,
    fiyatGuncelle: false,
    yeniTarifeId: 0,
    yeniTarifeAdi: kontrat.TarifeAdi,
    yeniPara: kontrat.Para,
    yeniKdv: kontrat.Kdv,
    notlar: '',
  });

  const [showPriceUpdate, setShowPriceUpdate] = useState(false);

  // Periyoda göre bitiş tarihi hesapla
  function calculateEndDate(startDate: string, period: string): string {
    const date = new Date(startDate);
    switch (period) {
      case 'YIL':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'AY':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'GUN':
        date.setDate(date.getDate() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  }

  // Uygun tarifeleri bul
  const availableTariffs = priceListMasterData.filter((priceList) => 
    priceList.is_active &&
    priceList.status === "AKTIF" &&
    priceList.period === kontrat.Periyot &&
    priceList.length_min !== undefined &&
    priceList.length_max !== undefined &&
    kontrat.TamBoy >= priceList.length_min &&
    kontrat.TamBoy <= priceList.length_max
  );

  // Tarife seçildiğinde fiyat hesapla
  const handleTariffChange = (tariffId: number) => {
    const selectedTariff = priceListMasterData.find(t => t.id === tariffId);
    if (!selectedTariff) return;

    const priceItems = priceListItemMasterData.filter(item => 
      item.price_list_id === tariffId && item.is_active
    );

    let calculatedPrice = kontrat.Fiyat;
    let kdvRate = kontrat.Kdv;

    if (priceItems.length > 0) {
      const unitPrice = priceItems[0].unit_price;
      calculatedPrice = unitPrice * kontrat.TamBoy;

      // Hizmet kartından KDV al
      const serviceCard = serviceCardMasterData.find(s => s.id === priceItems[0].service_card_id);
      if (serviceCard && serviceCard.vat_code) {
        kdvRate = Number(serviceCard.vat_code);
      }
    }

    setRenewalData({
      ...renewalData,
      yeniTarifeId: tariffId,
      yeniTarifeAdi: selectedTariff.name,
      yeniFiyat: calculatedPrice,
      yeniPara: selectedTariff.currency,
      yeniKdv: kdvRate,
    });
  };

  // Başlangıç tarihi değiştiğinde bitiş tarihini güncelle
  const handleStartDateChange = (newStart: string) => {
    setRenewalData({
      ...renewalData,
      yeniBaslangic: newStart,
      yeniBitis: calculateEndDate(newStart, kontrat.Periyot),
    });
  };

  // Yenileme işlemini onayla
  const handleConfirmRenewal = () => {
    const newKontrat = {
      ...kontrat,
      KontratNo: `${kontrat.KontratNo}-R${Date.now()}`, // Yeni kontrat no
      Baslangic: renewalData.yeniBaslangic,
      Bitis: renewalData.yeniBitis,
      TarifeAdi: renewalData.yeniTarifeAdi,
      Fiyat: renewalData.yeniFiyat,
      Para: renewalData.yeniPara,
      Kdv: renewalData.yeniKdv,
      Durum: 'AKTİF',
      EskiKontratNo: kontrat.KontratNo,
      YenilemeNotu: renewalData.notlar,
      YenilemeTarihi: new Date().toISOString().split('T')[0],
    };

    onRenew(newKontrat);
    setStep('success');
  };

  // Kalan gün hesapla
  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(kontrat.Bitis);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining <= 30;
  const isExpired = daysRemaining < 0;

  // Fiyat değişim yüzdesi
  const priceChangePercent = renewalData.eskiFiyat > 0 
    ? ((renewalData.yeniFiyat - renewalData.eskiFiyat) / renewalData.eskiFiyat) * 100 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${theme.colors.bgCard} ${theme.colors.text} border-gray-700 max-w-3xl`}>
        {step === 'review' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <RefreshCw className="w-6 h-6 text-blue-400" />
                Kontrat Yenileme
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Mevcut kontratı yenilemek için bilgileri kontrol edin ve gerekirse güncelleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Uyarı Mesajı */}
              <div className={`p-4 rounded-lg border ${
                isExpired 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : isExpiringSoon 
                  ? 'bg-orange-500/10 border-orange-500/30' 
                  : 'bg-blue-500/10 border-blue-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    isExpired ? 'text-red-400' : isExpiringSoon ? 'text-orange-400' : 'text-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm ${
                      isExpired ? 'text-red-400' : isExpiringSoon ? 'text-orange-400' : 'text-blue-400'
                    }`}>
                      {isExpired 
                        ? `Bu kontrat ${Math.abs(daysRemaining)} gün önce sona ermiştir!` 
                        : isExpiringSoon 
                        ? `Bu kontratın süresinin bitmesine ${daysRemaining} gün kaldı!` 
                        : `Kontrat süresi: ${daysRemaining} gün`
                      }
                    </p>
                  </div>
                  <Badge variant="outline" className={
                    isExpired 
                      ? 'border-red-500/30 text-red-400' 
                      : isExpiringSoon 
                      ? 'border-orange-500/30 text-orange-400' 
                      : 'border-blue-500/30 text-blue-400'
                  }>
                    {kontrat.Durum}
                  </Badge>
                </div>
              </div>

              {/* Mevcut Kontrat Bilgileri */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="flex items-center gap-2 text-sm mb-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Mevcut Kontrat Bilgileri
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Kontrat No</p>
                    <p>{kontrat.KontratNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cari</p>
                    <p>{kontrat.CariAdi}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tekne</p>
                    <p>{kontrat.TekneAdi}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tam Boy</p>
                    <p>{kontrat.TamBoy} m</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Başlangıç - Bitiş</p>
                    <p>{kontrat.Baslangic} → {kontrat.Bitis}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mevcut Fiyat</p>
                    <p className="text-green-400">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: kontrat.Para,
                      }).format(kontrat.Fiyat)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Yeni Kontrat Tarihleri */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Yeni Başlangıç Tarihi
                  </label>
                  <Input
                    type="date"
                    value={renewalData.yeniBaslangic}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="bg-gray-800/50 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Yeni Bitiş Tarihi
                  </label>
                  <Input
                    type="date"
                    value={renewalData.yeniBitis}
                    disabled
                    className="bg-gray-800/50 border-gray-700 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Otomatik hesaplanır ({kontrat.Periyot})</p>
                </div>
              </div>

              {/* Fiyat Güncelleme */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    Fiyat Güncelleme
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPriceUpdate(!showPriceUpdate)}
                    className="text-xs bg-transparent border-gray-700 text-white hover:bg-gray-800"
                  >
                    {showPriceUpdate ? 'Fiyat Güncelleme' : 'Aynı Fiyatla Devam Et'}
                  </Button>
                </div>

                {!showPriceUpdate ? (
                  <div className="text-sm">
                    <p className="text-gray-400">Mevcut fiyat ile devam edilecek:</p>
                    <p className="text-xl text-green-400 mt-2">
                      {new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: kontrat.Para,
                      }).format(kontrat.Fiyat)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Yeni Tarife Seç</label>
                      <select
                        value={renewalData.yeniTarifeId}
                        onChange={(e) => handleTariffChange(Number(e.target.value))}
                        className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2"
                      >
                        <option value={0}>Mevcut tarife ile devam et</option>
                        {availableTariffs.map(tariff => (
                          <option key={tariff.id} value={tariff.id}>
                            {tariff.name} - {tariff.currency}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-900/50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Eski Fiyat</p>
                        <p className="text-lg">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: kontrat.Para,
                          }).format(renewalData.eskiFiyat)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Yeni Fiyat</p>
                        <p className="text-lg text-green-400">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: renewalData.yeniPara,
                          }).format(renewalData.yeniFiyat)}
                        </p>
                      </div>
                    </div>

                    {priceChangePercent !== 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className={`w-4 h-4 ${priceChangePercent > 0 ? 'text-red-400' : 'text-green-400'}`} />
                        <span className={priceChangePercent > 0 ? 'text-red-400' : 'text-green-400'}>
                          {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}% değişim
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notlar */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Yenileme Notları (Opsiyonel)
                </label>
                <Textarea
                  value={renewalData.notlar}
                  onChange={(e) => setRenewalData({ ...renewalData, notlar: e.target.value })}
                  placeholder="Yenileme ile ilgili notlarınızı buraya yazabilirsiniz..."
                  className="bg-gray-800/50 border-gray-700 text-white min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                İptal
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Devam Et
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
                Yenileme Onayı
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Aşağıdaki bilgileri kontrol edin ve onaylayın.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <p className="text-sm text-orange-400">
                  ⚠️ Bu işlem geri alınamaz! Mevcut kontrat "YENİLENDİ" olarak işaretlenecek ve yeni kontrat oluşturulacaktır.
                </p>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Eski Kontrat No:</span>
                  <span>{kontrat.KontratNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Yeni Başlangıç:</span>
                  <span>{renewalData.yeniBaslangic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Yeni Bitiş:</span>
                  <span>{renewalData.yeniBitis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Yeni Fiyat:</span>
                  <span className="text-green-400">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: renewalData.yeniPara,
                    }).format(renewalData.yeniFiyat)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">KDV Oranı:</span>
                  <span>%{renewalData.yeniKdv}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep('review')}
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                Geri Dön
              </Button>
              <Button
                onClick={handleConfirmRenewal}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Onayla ve Yenile
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl text-green-400">
                <CheckCircle2 className="w-6 h-6" />
                Yenileme Başarılı!
              </DialogTitle>
            </DialogHeader>

            <div className="py-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-lg mb-2">Kontrat başarıyla yenilendi!</p>
                <p className="text-sm text-gray-400">
                  Yeni kontrat oluşturuldu ve eski kontrat "YENİLENDİ" olarak işaretlendi.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={onClose}
                className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black w-full`}
              >
                Kapat
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
