// CARİ KART GİRİŞ - Yeni Cari Kartı Tanımlama Formu
// SQL tmm_cari tablosuna uygun form

import { useState } from "react";
import { Save, X, Building2, MapPin, Phone, Mail, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Theme } from "./ThemeSelector";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { CariKart } from "../data/cariData";

interface CariKartGirisProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
}

interface CariFormData {
  // GENEL BİLGİLER
  Code: string;
  Name: string;
  AccountType: 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
  Active: boolean;

  // VERGİ KİMLİK
  TaxIdType: 'VKN' | 'TCKN';
  TaxId: string;
  TaxOffice: string;
  MersisNo: string;
  KEPAddress: string;

  // ADRES BİLGİLERİ
  Address: string;
  Neighborhood: string;
  Street: string;
  BuildingNo: string;
  DoorNo: string;
  District: string;
  City: string;
  PostalCode: string;
  CountryCode: string;

  // İLETİŞİM
  Phone: string;
  Mobile: string;
  Email: string;

  // IBAN
  IBAN: string;

  // FİNANSAL PARAMETRELER
  Currency: string;
  PaymentTermDays: number;
  RiskLimit: number;

  // E-FATURA
  IsEInvoiceCustomer: boolean;
  SendMethod: 'E-FATURA' | 'E-ARSIV' | 'KAGIT';
  AcceptsEArchive: boolean;

  // NOTLAR
  Notes: string;
}

export function CariKartGiris({ onNavigateHome, onNavigateBack, theme }: CariKartGirisProps) {
  const [formData, setFormData] = useState<CariFormData>({
    Code: '01.001',
    Name: '',
    AccountType: 'CUSTOMER',
    Active: true,

    TaxIdType: 'VKN',
    TaxId: '',
    TaxOffice: '',
    MersisNo: '',
    KEPAddress: '',

    Address: '',
    Neighborhood: '',
    Street: '',
    BuildingNo: '',
    DoorNo: '',
    District: '',
    City: 'İzmir',
    PostalCode: '',
    CountryCode: 'TR',

    Phone: '',
    Mobile: '',
    Email: '',

    IBAN: '',

    Currency: 'TRY',
    PaymentTermDays: 0,
    RiskLimit: 0,

    IsEInvoiceCustomer: false,
    SendMethod: 'E-ARSIV',
    AcceptsEArchive: true,

    Notes: '',
  });

  const handleInputChange = (field: keyof CariFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    if (!formData.Name) {
      alert("Ünvan/Ad Soyad zorunludur!");
      return;
    }
    if (!formData.TaxId) {
      alert("VKN/TCKN zorunludur!");
      return;
    }

    console.log("Yeni Cari Kartı Kaydediliyor:", formData);
    alert("Cari kartı başarıyla kaydedildi!");

    // Navigate back to Cari Kartlar Yönetimi
    onNavigateBack();
  };

  const handleCancel = () => {
    if (confirm("Formu iptal etmek istediğinizden emin misiniz? Tüm değişiklikler kaybolacak.")) {
      onNavigateBack();
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl mb-1 text-white">Cari Kart Tanımlama</h2>
            <p className={theme.colors.textMuted}>Yeni cari hesap kartı oluştur</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button
              onClick={handleSave}
              className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
            >
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </div>

        {/* Form - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Blok - Genel Bilgiler */}
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h3 className="flex items-center gap-2 mb-5 text-white">
              <Building2 className="w-5 h-5 text-blue-400" />
              Genel Bilgiler
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Cari Kodu *</Label>
                <Input
                  value={formData.Code}
                  onChange={(e) => handleInputChange('Code', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="01.001"
                />
              </div>

              <div>
                <Label className="text-gray-300">Ünvan / Ad Soyad *</Label>
                <Textarea
                  value={formData.Name}
                  onChange={(e) => handleInputChange('Name', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1 min-h-[80px]"
                  placeholder="Firma ünvanı veya şahıs adı"
                />
              </div>

              <div>
                <Label className="text-gray-300">Cari Tipi</Label>
                <Select value={formData.AccountType} onValueChange={(v) => handleInputChange('AccountType', v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                    <SelectItem value="SUPPLIER">Tedarikçi</SelectItem>
                    <SelectItem value="BOTH">Her İkisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label className="text-gray-300">Aktif</Label>
                <Switch
                  checked={formData.Active}
                  onCheckedChange={(checked) => handleInputChange('Active', checked)}
                />
              </div>
            </div>
          </Card>

          {/* Orta Blok (Üst) - Vergi Kimlik */}
          <div className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="flex items-center gap-2 mb-5 text-white">
                <FileText className="w-5 h-5 text-green-400" />
                Vergi Kimlik
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Kimlik Tipi *</Label>
                  <Select value={formData.TaxIdType} onValueChange={(v) => handleInputChange('TaxIdType', v as 'VKN' | 'TCKN')}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="VKN">VKN (Vergi Kimlik No)</SelectItem>
                      <SelectItem value="TCKN">TCKN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300">VKN (10 haneli) *</Label>
                  <Input
                    value={formData.TaxId}
                    onChange={(e) => handleInputChange('TaxId', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                    placeholder="1234567890"
                    maxLength={11}
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Vergi Dairesi *</Label>
                  <Input
                    value={formData.TaxOffice}
                    onChange={(e) => handleInputChange('TaxOffice', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                    placeholder="ALİAĞA VERGİ DAİRESİ"
                  />
                </div>

                <div className="border-t border-gray-700 pt-4">
                  <div className="mb-4">
                    <Label className="text-gray-300">Mersis No (16 haneli)</Label>
                    <Input
                      value={formData.MersisNo}
                      onChange={(e) => handleInputChange('MersisNo', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white mt-1"
                      placeholder="0123456789012345"
                      maxLength={16}
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">KEP Adresi</Label>
                    <Input
                      value={formData.KEPAddress}
                      onChange={(e) => handleInputChange('KEPAddress', e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white mt-1"
                      placeholder="firma@hs01.kep.tr"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sağ Blok (Üst) - E-Fatura Ataçları */}
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h3 className="flex items-center gap-2 mb-5 text-white">
              <FileText className="w-5 h-5 text-purple-400" />
              E-Fatura Ataçları
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">E-Fatura Mükellefi</Label>
                <Switch
                  checked={formData.IsEInvoiceCustomer}
                  onCheckedChange={(checked) => handleInputChange('IsEInvoiceCustomer', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-300">E-Arşiv Kabul Eder</Label>
                <Switch
                  checked={formData.AcceptsEArchive}
                  onCheckedChange={(checked) => handleInputChange('AcceptsEArchive', checked)}
                />
              </div>

              <div>
                <Label className="text-gray-300">Gönderim Yöntemi</Label>
                <Select value={formData.SendMethod} onValueChange={(v) => handleInputChange('SendMethod', v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="E-FATURA">E-Fatura</SelectItem>
                    <SelectItem value="E-ARSIV">E-Arşiv Fatura</SelectItem>
                    <SelectItem value="KAGIT">Kağıt Fatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Alt Satır - 3 Kolon */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Adres Bilgileri */}
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h3 className="flex items-center gap-2 mb-5 text-white">
              <MapPin className="w-5 h-5 text-orange-400" />
              Adres Bilgileri
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Tam Adres Bilgileri *</Label>
                <Textarea
                  value={formData.Address}
                  onChange={(e) => handleInputChange('Address', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1 min-h-[100px]"
                  placeholder="Tam adres bilgisi (mahalle, cadde, bina no, daire)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Mahalle/Köy</Label>
                  <Input
                    value={formData.Neighborhood}
                    onChange={(e) => handleInputChange('Neighborhood', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                    placeholder="Alsancak Mah."
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Cadde/Sokak</Label>
                  <Input
                    value={formData.Street}
                    onChange={(e) => handleInputChange('Street', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                    placeholder="Atatürk Cad."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Bina No</Label>
                  <Input
                    value={formData.BuildingNo}
                    onChange={(e) => handleInputChange('BuildingNo', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                    placeholder="378"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Daire/Kapı</Label>
                  <Input
                    value={formData.DoorNo}
                    onChange={(e) => handleInputChange('DoorNo', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                    placeholder="52"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-gray-300">İlçe *</Label>
                  <Input
                    value={formData.District}
                    onChange={(e) => handleInputChange('District', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                    placeholder="Konak"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">İl *</Label>
                  <Input
                    value={formData.City}
                    onChange={(e) => handleInputChange('City', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                    placeholder="İzmir"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Ülke Kodu *</Label>
                  <Select value={formData.CountryCode} onValueChange={(v) => handleInputChange('CountryCode', v)}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="TR">TR</SelectItem>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="GB">GB</SelectItem>
                      <SelectItem value="DE">DE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Posta Kodu *</Label>
                <Input
                  value={formData.PostalCode}
                  onChange={(e) => handleInputChange('PostalCode', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="35210"
                  maxLength={5}
                />
              </div>
            </div>
          </Card>

          {/* İletişim */}
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h3 className="flex items-center gap-2 mb-5 text-white">
              <Phone className="w-5 h-5 text-cyan-400" />
              İletişim
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Telefon</Label>
                <Input
                  value={formData.Phone}
                  onChange={(e) => handleInputChange('Phone', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="+90 232 123 45 67"
                />
              </div>

              <div>
                <Label className="text-gray-300">Cep Telefonu</Label>
                <Input
                  value={formData.Mobile}
                  onChange={(e) => handleInputChange('Mobile', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="+90 532 111 22 33"
                />
              </div>

              <div>
                <Label className="text-gray-300">E-posta</Label>
                <Input
                  type="email"
                  value={formData.Email}
                  onChange={(e) => handleInputChange('Email', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="info@firma.com"
                />
              </div>

              <div className="border-t border-gray-700 pt-4">
                <Label className="text-gray-300">IBAN</Label>
                <Input
                  value={formData.IBAN}
                  onChange={(e) => handleInputChange('IBAN', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                />
              </div>
            </div>
          </Card>

          {/* Finansal Parametreler & Notlar */}
          <Card className="bg-gray-800/50 border-gray-700 p-6">
            <h3 className="flex items-center gap-2 mb-5 text-white">
              <Mail className="w-5 h-5 text-pink-400" />
              Finansal Parametreler
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Para Birimi</Label>
                <Select value={formData.Currency} onValueChange={(v) => handleInputChange('Currency', v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="TRY">TRY (₺)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Ödeme Vadesi (gün)</Label>
                <Input
                  type="number"
                  value={formData.PaymentTermDays}
                  onChange={(e) => handleInputChange('PaymentTermDays', Number(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="0"
                />
              </div>

              <div>
                <Label className="text-gray-300">Risk Limiti</Label>
                <Input
                  type="number"
                  value={formData.RiskLimit}
                  onChange={(e) => handleInputChange('RiskLimit', Number(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  placeholder="0"
                />
              </div>

              <div className="border-t border-gray-700 pt-4">
                <Label className="text-gray-300">Notlar</Label>
                <Textarea
                  value={formData.Notes}
                  onChange={(e) => handleInputChange('Notes', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1 min-h-[100px]"
                  placeholder="Genel notlar ve açıklamalar..."
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}