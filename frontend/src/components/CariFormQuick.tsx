import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Theme } from "./ThemeSelector";
import { CariKart } from "../data/cariData";
import { Building2, Phone, Mail, FileText, AlertCircle } from "lucide-react";

interface CariFormQuickProps {
  theme: Theme;
  onSave: (cari: CariKart) => void;
  onCancel: () => void;
}

export function CariFormQuick({ theme, onSave, onCancel }: CariFormQuickProps) {
  const [formData, setFormData] = useState<Partial<CariKart>>({
    Code: "",
    Name: "",
    Active: true,
    AccountType: "CUSTOMER",
    TaxIdType: "VKN",
    TaxId: "",
    TaxOffice: "",
    Address: "",
    City: "",
    PostalCode: "",
    CountryCode: "TR",
    Phone: "",
    Email: "",
    IsEInvoiceCustomer: false,
    AcceptsEArchive: true,
    SendMethod: "E-ARSIV",
    Currency: "TRY",
    PaymentTermDays: 0,
    RiskCurrency: "TRY",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Code validation
    if (!formData.Code?.trim()) {
      newErrors.Code = "Cari kodu zorunludur";
    }

    // Name validation
    if (!formData.Name?.trim()) {
      newErrors.Name = "Ünvan/Ad Soyad zorunludur";
    }

    // TaxId validation
    if (!formData.TaxId?.trim()) {
      newErrors.TaxId = "Vergi/TC Kimlik No zorunludur";
    } else {
      const taxIdLength = formData.TaxId.length;
      if (formData.TaxIdType === 'VKN' && taxIdLength !== 10) {
        newErrors.TaxId = "VKN 10 haneli olmalıdır";
      } else if (formData.TaxIdType === 'TCKN' && taxIdLength !== 11) {
        newErrors.TaxId = "TCKN 11 haneli olmalıdır";
      }
    }

    // City validation
    if (!formData.City?.trim()) {
      newErrors.City = "İl zorunludur";
    }

    // PostalCode validation
    if (formData.PostalCode && formData.PostalCode.length !== 5) {
      newErrors.PostalCode = "Posta kodu 5 haneli olmalıdır";
    }

    // Email validation
    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = "Geçerli bir e-posta adresi giriniz";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const newCari: CariKart = {
      Id: Date.now(),
      Code: formData.Code!,
      Name: formData.Name!,
      Active: formData.Active ?? true,
      AccountType: formData.AccountType!,
      TaxIdType: formData.TaxIdType!,
      TaxId: formData.TaxId!,
      TaxOffice: formData.TaxOffice,
      Address: formData.Address || "",
      City: formData.City!,
      PostalCode: formData.PostalCode,
      CountryCode: formData.CountryCode!,
      Phone: formData.Phone,
      Email: formData.Email,
      IsEInvoiceCustomer: formData.IsEInvoiceCustomer!,
      AcceptsEArchive: formData.AcceptsEArchive!,
      SendMethod: formData.SendMethod!,
      Currency: formData.Currency!,
      PaymentTermDays: formData.PaymentTermDays!,
      RiskCurrency: formData.RiskCurrency!,
      CreatedAt: new Date().toISOString(),
    };

    onSave(newCari);
  };

  const updateField = (field: keyof CariKart, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Temel Bilgiler */}
      <div className="space-y-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <h3 className="flex items-center gap-2 text-blue-400">
          <Building2 className="w-4 h-4" />
          Temel Bilgiler
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-gray-300">Cari Kodu *</Label>
            <Input
              id="code"
              value={formData.Code || ""}
              onChange={(e) => updateField("Code", e.target.value)}
              placeholder="01.001"
              className={`bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 ${
                errors.Code ? 'border-red-500' : 'focus:border-blue-500'
              }`}
            />
            {errors.Code && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.Code}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountType" className="text-gray-300">Cari Tipi *</Label>
            <Select 
              value={formData.AccountType} 
              onValueChange={(value: any) => updateField("AccountType", value)}
            >
              <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                <SelectItem value="SUPPLIER">Tedarikçi</SelectItem>
                <SelectItem value="BOTH">Her İkisi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-300">Ünvan / Ad Soyad *</Label>
          <Input
            id="name"
            value={formData.Name || ""}
            onChange={(e) => updateField("Name", e.target.value)}
            placeholder="Firma ünvanı veya şahıs adı"
            className={`bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 ${
              errors.Name ? 'border-red-500' : 'focus:border-blue-500'
            }`}
          />
          {errors.Name && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.Name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={formData.Active}
            onCheckedChange={(checked) => updateField("Active", checked)}
          />
          <Label className="text-gray-300">Aktif</Label>
        </div>
      </div>

      {/* Vergi Bilgileri */}
      <div className="space-y-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <h3 className="flex items-center gap-2 text-purple-400">
          <FileText className="w-4 h-4" />
          Vergi Kimlik Bilgileri
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxIdType" className="text-gray-300">Kimlik Tipi *</Label>
            <Select 
              value={formData.TaxIdType} 
              onValueChange={(value: any) => updateField("TaxIdType", value)}
            >
              <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-purple-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="VKN">VKN (10 haneli)</SelectItem>
                <SelectItem value="TCKN">TCKN (11 haneli)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId" className="text-gray-300">
              {formData.TaxIdType === 'VKN' ? 'VKN *' : 'TCKN *'}
            </Label>
            <Input
              id="taxId"
              value={formData.TaxId || ""}
              onChange={(e) => updateField("TaxId", e.target.value.replace(/\D/g, ''))}
              placeholder={formData.TaxIdType === 'VKN' ? '1234567890' : '12345678901'}
              maxLength={formData.TaxIdType === 'VKN' ? 10 : 11}
              className={`bg-gray-900/50 border-gray-600 text-white font-mono placeholder:text-gray-500 ${
                errors.TaxId ? 'border-red-500' : 'focus:border-purple-500'
              }`}
            />
            {errors.TaxId && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.TaxId}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxOffice" className="text-gray-300">Vergi Dairesi</Label>
          <Input
            id="taxOffice"
            value={formData.TaxOffice || ""}
            onChange={(e) => updateField("TaxOffice", e.target.value)}
            placeholder="ALİAĞA VERGİ DAİRESİ"
            className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Adres ve İletişim */}
      <div className="space-y-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <h3 className="flex items-center gap-2 text-green-400">
          <Phone className="w-4 h-4" />
          Adres ve İletişim
        </h3>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-gray-300">Adres</Label>
          <Input
            id="address"
            value={formData.Address || ""}
            onChange={(e) => updateField("Address", e.target.value)}
            placeholder="Mahalle, Cadde, Bina No, Daire"
            className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-gray-300">İl *</Label>
            <Input
              id="city"
              value={formData.City || ""}
              onChange={(e) => updateField("City", e.target.value)}
              placeholder="İzmir"
              className={`bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 ${
                errors.City ? 'border-red-500' : 'focus:border-green-500'
              }`}
            />
            {errors.City && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.City}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode" className="text-gray-300">Posta Kodu</Label>
            <Input
              id="postalCode"
              value={formData.PostalCode || ""}
              onChange={(e) => updateField("PostalCode", e.target.value.replace(/\D/g, ''))}
              placeholder="35210"
              maxLength={5}
              className={`bg-gray-900/50 border-gray-600 text-white font-mono placeholder:text-gray-500 ${
                errors.PostalCode ? 'border-red-500' : 'focus:border-green-500'
              }`}
            />
            {errors.PostalCode && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.PostalCode}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="countryCode" className="text-gray-300">Ülke</Label>
            <Input
              id="countryCode"
              value={formData.CountryCode || ""}
              onChange={(e) => updateField("CountryCode", e.target.value.toUpperCase())}
              placeholder="TR"
              maxLength={2}
              className="bg-gray-900/50 border-gray-600 text-white font-mono placeholder:text-gray-500 focus:border-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">Telefon</Label>
            <Input
              id="phone"
              value={formData.Phone || ""}
              onChange={(e) => updateField("Phone", e.target.value)}
              placeholder="+90 232 123 45 67"
              className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={formData.Email || ""}
              onChange={(e) => updateField("Email", e.target.value)}
              placeholder="info@firma.com"
              className={`bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 ${
                errors.Email ? 'border-red-500' : 'focus:border-green-500'
              }`}
            />
            {errors.Email && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.Email}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* E-Fatura Ayarları */}
      <div className="space-y-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <h3 className="flex items-center gap-2 text-amber-400">
          <FileText className="w-4 h-4" />
          E-Fatura Ayarları
        </h3>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.IsEInvoiceCustomer}
              onCheckedChange={(checked) => updateField("IsEInvoiceCustomer", checked)}
            />
            <Label className="text-gray-300">E-Fatura Mükellefi</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.AcceptsEArchive}
              onCheckedChange={(checked) => updateField("AcceptsEArchive", checked)}
            />
            <Label className="text-gray-300">E-Arşiv Kabul Eder</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sendMethod" className="text-gray-300">Gönderim Yöntemi</Label>
          <Select 
            value={formData.SendMethod} 
            onValueChange={(value: any) => updateField("SendMethod", value)}
          >
            <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-amber-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="E-ARSIV">📄 E-Arşiv Fatura</SelectItem>
              <SelectItem value="E-FATURA">⚡ E-Fatura</SelectItem>
              <SelectItem value="KAGIT">📋 Kağıt Fatura</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-gray-300">Para Birimi</Label>
            <Select 
              value={formData.Currency} 
              onValueChange={(value: any) => updateField("Currency", value)}
            >
              <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-amber-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                <SelectItem value="USD">USD - Amerikan Doları</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - İngiliz Sterlini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms" className="text-gray-300">Ödeme Vadesi (gün)</Label>
            <Input
              id="paymentTerms"
              type="number"
              value={formData.PaymentTermDays || 0}
              onChange={(e) => updateField("PaymentTermDays", parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
              className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-gray-900 pb-2">
        <Button
          type="submit"
          className={`flex-1 ${theme.colors.primary} ${theme.colors.primaryHover} text-black shadow-lg hover:shadow-xl transition-all`}
        >
          Kaydet
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 bg-red-900/20 border-red-600/50 text-red-400 hover:bg-red-900/40 hover:border-red-500 transition-all"
        >
          İptal
        </Button>
      </div>
    </form>
  );
}
