// SAHA PERSONELİ - Mobil Motorbot Sefer Giriş Ekranı
// Saha personeline özel çıkış/dönüş kayıt ekranı
// Motorbot master data ile entegre, hizmet kartından fiyat alır

import { useState } from "react";
import { Theme } from "./ThemeSelector";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { 
  Ship, 
  Calendar, 
  Clock, 
  LogOut, 
  LogIn,
  Save,
  X,
  DollarSign,
  FileText,
  User,
  MapPin
} from "lucide-react";
import { motorbotMasterData } from "../data/motorbotData";
import { 
  MotorbotSefer, 
  calculateDuration,
  calculatePricing,
  getFaturaDonemi 
} from "../data/motorbotSeferData";
import { serviceCardMasterData } from "../data/serviceCardData";

interface SahaPersoneliProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  seferler?: MotorbotSefer[];
  onSaveSefer?: (sefer: MotorbotSefer) => void;
}

type SeferMode = 'CIKIS' | 'DONUS';

export function SahaPersoneli({ 
  onNavigateHome, 
  onNavigateBack, 
  theme, 
  seferler,
  onSaveSefer 
}: SahaPersoneliProps) {
  const [mode, setMode] = useState<SeferMode>('CIKIS');
  const [showMotorbotPicker, setShowMotorbotPicker] = useState(false);
  
  // Form state
  const [selectedMotorbot, setSelectedMotorbot] = useState<typeof motorbotMasterData[0] | null>(null);
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState(new Date().toTimeString().slice(0, 5));
  const [departureNote, setDepartureNote] = useState('');
  
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [returnNote, setReturnNote] = useState('');

  // Motorbot seçimi
  const handleMotorbotSelect = (motorbot: typeof motorbotMasterData[0]) => {
    setSelectedMotorbot(motorbot);
    setShowMotorbotPicker(false);
    
    // DONUS modundaysa, ilgili seferin çıkış bilgilerini otomatik doldur
    if (mode === 'DONUS' && seferler) {
      const activeSefer = seferler.find(s => s.MotorbotId === motorbot.Id && s.Status === 'DEPARTED');
      if (activeSefer) {
        setDepartureDate(activeSefer.DepartureDate);
        setDepartureTime(activeSefer.DepartureTime);
        setDepartureNote(activeSefer.DepartureNote || '');
        
        // Dönüş tarih ve saatini otomatik doldur (şu anki zaman)
        const now = new Date();
        setReturnDate(now.toISOString().split('T')[0]);
        setReturnTime(now.toTimeString().slice(0, 5));
      }
    }
  };

  // Çıkış kaydı kaydet
  const handleSaveCikis = () => {
    if (!selectedMotorbot) {
      alert('Lütfen motorbot seçiniz!');
      return;
    }

    const newSefer: MotorbotSefer = {
      Id: Date.now(), // Geçici ID, backend'den gelecek
      MotorbotId: selectedMotorbot.Id,
      MotorbotCode: selectedMotorbot.Code,
      MotorbotName: selectedMotorbot.Name,
      MotorbotOwner: selectedMotorbot.Owner,
      CariCode: selectedMotorbot.CariCode,
      
      DepartureDate: departureDate,
      DepartureTime: departureTime,
      DepartureNote: departureNote,
      
      Status: 'DEPARTED',
      
      UnitPrice: 10.00, // Hizmet kartının tarifesinden
      Currency: 'USD',
      VatRate: 18, // KDV oranı
      VatAmount: 1.80, // KDV tutarı
      TotalPrice: 11.80, // Toplam fiyat
      
      IsInvoiced: false,
      
      CreatedAt: new Date().toISOString(),
      CreatedBy: 1, // Kullanıcı ID'si
    };

    onSaveSefer?.(newSefer);
    
    // Form'u temizle
    setSelectedMotorbot(null);
    setDepartureNote('');
    setDepartureDate(new Date().toISOString().split('T')[0]);
    setDepartureTime(new Date().toTimeString().slice(0, 5));
    
    alert('✅ Çıkış kaydı başarıyla oluşturuldu!');
  };

  // Dönüş kaydı kaydet
  const handleSaveDonus = () => {
    if (!selectedMotorbot) {
      alert('Lütfen motorbot seçiniz!');
      return;
    }

    if (!returnDate || !returnTime) {
      alert('Lütfen dönüş tarihi ve saati giriniz!');
      return;
    }

    // Mevcut seferi bul
    const existingSefer = (seferler || []).find(
      s => s.MotorbotId === selectedMotorbot.Id && s.Status === 'DEPARTED'
    );

    if (!existingSefer) {
      alert('Hata: Aktif sefer kaydı bulunamadı!');
      return;
    }

    const duration = calculateDuration(departureDate, departureTime, returnDate, returnTime);
    const faturaDonemi = getFaturaDonemi(departureDate);

    // Mevcut seferi güncelle (RETURNED olarak)
    const updatedSefer: MotorbotSefer = {
      ...existingSefer,
      ReturnDate: returnDate,
      ReturnTime: returnTime,
      ReturnNote: returnNote,
      Duration: duration,
      Status: 'RETURNED',
      InvoicePeriod: faturaDonemi.period,
      UpdatedAt: new Date().toISOString(),
      UpdatedBy: 1,
    };

    onSaveSefer?.(updatedSefer);
    
    // Form'u temizle
    setSelectedMotorbot(null);
    setDepartureNote('');
    setDepartureDate(new Date().toISOString().split('T')[0]);
    setDepartureTime(new Date().toTimeString().slice(0, 5));
    setReturnDate('');
    setReturnTime('');
    setReturnNote('');
    
    alert('✅ Dönüş kaydı başarıyla oluşturuldu!');
  };

  // Motorbot picker modal
  if (showMotorbotPicker) {
    // DONUS modunda sadece aktif seferdeki motorbot'ları göster
    const activeSeferMotorbotIds = mode === 'DONUS' 
      ? (seferler || [])
          .filter(s => s.Status === 'DEPARTED')
          .map(s => s.MotorbotId)
      : [];
    
    const availableMotorbots = mode === 'DONUS'
      ? motorbotMasterData.filter(mb => activeSeferMotorbotIds.includes(mb.Id))
      : motorbotMasterData;

    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
        <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Ship className="w-6 h-6 text-blue-400" />
              {mode === 'DONUS' ? 'Seferdeki Motorbot Seçimi' : 'Motorbot Seçimi'}
            </h2>
            <Button
              onClick={() => setShowMotorbotPicker(false)}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            {/* Motorbot Listesi */}
            {availableMotorbots.length === 0 ? (
              <div className="text-center py-12">
                <Ship className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Şu anda seferde motorbot bulunmuyor</p>
                <p className="text-gray-500 text-sm mt-2">Önce bir motorbot için çıkış kaydı oluşturun</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableMotorbots.map((mb) => {
                  // DONUS modundaysa ilgili sefer bilgisini bul
                  const activeSefer = mode === 'DONUS' 
                    ? (seferler || []).find(s => s.MotorbotId === mb.Id && s.Status === 'DEPARTED')
                    : null;
                  
                  return (
                    <button
                      key={mb.Id}
                      onClick={() => handleMotorbotSelect(mb)}
                      className="w-full p-4 rounded-lg border-2 transition-all text-left border-gray-700 bg-gray-800/50 hover:border-blue-400 hover:bg-gray-800"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Ship className="w-5 h-5 text-blue-400 flex-shrink-0" />
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {mb.Name}
                              </h3>
                              <div className="text-sm text-gray-400">
                                {mb.Code} • {mb.Owner}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 mt-2">
                            {mb.Type} • {mb.Length}m × {mb.Width}m
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            {mb.Active ? (
                              <Badge className="bg-green-500/20 text-green-400 border border-green-500 text-xs">
                                AKTİF
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border border-red-500 text-xs">
                                PASİF
                              </Badge>
                            )}
                            
                            {activeSefer && (
                              <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500 text-xs">
                                SEFERDE
                              </Badge>
                            )}
                          </div>
                          
                          {activeSefer && (
                            <div className="mt-3 text-xs text-gray-400 bg-gray-900/50 p-2 rounded">
                              Çıkış: {activeSefer.DepartureDate} {activeSefer.DepartureTime}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Saha Personeli</h1>
                <p className="text-sm text-gray-400">Motorbot çıkış/dönüş kayıt sistemi</p>
              </div>
            </div>
            
            <Button
              onClick={onNavigateBack}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-3">
            <Button
              onClick={() => setMode('CIKIS')}
              className={`flex-1 ${
                mode === 'CIKIS' 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Çıkış Kaydı
            </Button>
            
            <Button
              onClick={() => setMode('DONUS')}
              className={`flex-1 ${
                mode === 'DONUS' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Dönüş Kaydı
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 space-y-6">
          {/* Motorbot Seçimi */}
          <div>
            <Label className="text-gray-300 mb-2 block">Motorbot Seçimi *</Label>
            {selectedMotorbot ? (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ship className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">{selectedMotorbot.Code}</div>
                    <div className="text-sm text-gray-400">{selectedMotorbot.Name}</div>
                    <div className="text-xs text-gray-500">{selectedMotorbot.Owner}</div>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedMotorbot(null)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Değiştir
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowMotorbotPicker(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
              >
                <Ship className="w-5 h-5 mr-2" />
                Motorbot Seç
              </Button>
            )}
          </div>

          {/* Çıkış Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Çıkış Tarihi *
              </Label>
              <Input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            
            <div>
              <Label className="text-gray-300 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Çıkış Saati *
              </Label>
              <Input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block">Çıkış Notu</Label>
            <Textarea
              value={departureNote}
              onChange={(e) => setDepartureNote(e.target.value)}
              placeholder="Çıkış hakkında not ekleyebilirsiniz..."
              className="bg-gray-900 border-gray-700 text-white min-h-[80px]"
            />
          </div>

          {/* Dönüş Bilgileri (Sadece DONUS modunda) */}
          {mode === 'DONUS' && (
            <>
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-green-400" />
                  Dönüş Bilgileri
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-gray-300 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Dönüş Tarihi *
                    </Label>
                    <Input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-300 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Dönüş Saati *
                    </Label>
                    <Input
                      type="time"
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">Dönüş Notu</Label>
                  <Textarea
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    placeholder="Dönüş hakkında not ekleyebilirsiniz..."
                    className="bg-gray-900 border-gray-700 text-white min-h-[80px]"
                  />
                </div>

                {/* Süre hesaplama */}
                {returnDate && returnTime && (
                  <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Sefer Süresi:</span>
                      <span className="text-lg font-bold text-purple-400">
                        {(() => {
                          const dur = calculateDuration(departureDate, departureTime, returnDate, returnTime);
                          return dur ? `${Math.floor(dur / 60)}s ${dur % 60}dk` : '-';
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onNavigateBack}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            
            <Button
              onClick={mode === 'CIKIS' ? handleSaveCikis : handleSaveDonus}
              className={`flex-1 ${
                mode === 'CIKIS' 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
              disabled={!selectedMotorbot}
            >
              <Save className="w-4 h-4 mr-2" />
              {mode === 'CIKIS' ? 'Çıkış Kaydet' : 'Dönüş Kaydet'}
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-gray-300">
          <MapPin className="w-4 h-4 inline mr-2 text-blue-400" />
          Motorbot sefer kayıtları otomatik olarak fiyatlandırılır ve dönemsel faturalandırma için hazır hale gelir.
          Her sefer MB-SEFER-001 hizmet kartına tanımlı tarife üzerinden işlenir.
        </div>
      </div>
    </div>
  );
}