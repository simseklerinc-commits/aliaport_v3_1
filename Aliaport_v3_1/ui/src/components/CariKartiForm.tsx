import { useState, useEffect } from "react";
import { Theme } from "./ThemeSelector";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CariKart } from "../data/cariData";
import { FileText, MapPin, Phone, DollarSign, Building2, AlertCircle } from "lucide-react";
import { validateField } from "../utils/cariValidation";

interface CariKartiFormProps {
  cari: CariKart;
  isEditing: boolean;
  isNewCari: boolean;
  theme: Theme;
  onChange: (field: keyof CariKart, value: any) => void;
}

export function CariKartiForm({ cari, isEditing, isNewCari, theme, onChange }: CariKartiFormProps) {
  const isFormEditable = isEditing || isNewCari;
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validate field on change
  const handleChange = (field: keyof CariKart, value: any) => {
    onChange(field, value);
    
    // Real-time validation
    if (isFormEditable) {
      const error = validateField(field as string, value, cari);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
  };

  // Clear errors when switching to view mode
  useEffect(() => {
    if (!isFormEditable) {
      setErrors({});
    }
  }, [isFormEditable]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sol Blok - Genel & Vergi Bilgileri */}
      <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
        <h3 className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-4">
          <Building2 className="w-4 h-4" />
          GENEL BİLGİLER
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Cari Kodu *</Label>
            {isFormEditable ? (
              <Input
                value={cari.Code}
                onChange={(e) => handleChange("Code", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                placeholder="01.001"
              />
            ) : (
              <p className="text-sm mt-1 font-mono text-blue-400">{cari.Code}</p>
            )}
            {errors.Code && <p className="text-xs text-red-500 mt-1">{errors.Code}</p>}
          </div>
          
          <div>
            <Label className="text-xs text-gray-500">Ünvan / Ad Soyad *</Label>
            {isFormEditable ? (
              <Textarea
                value={cari.Name}
                onChange={(e) => handleChange("Name", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm min-h-[60px]"
                placeholder="Firma ünvanı veya şahıs adı"
              />
            ) : (
              <p className="text-sm mt-1">{cari.Name}</p>
            )}
            {errors.Name && <p className="text-xs text-red-500 mt-1">{errors.Name}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">Cari Tipi</Label>
            {isFormEditable ? (
              <Select
                value={cari.AccountType}
                onValueChange={(value: any) => handleChange("AccountType", value)}
              >
                <SelectTrigger className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Müşteri</SelectItem>
                  <SelectItem value="SUPPLIER">Tedarikçi</SelectItem>
                  <SelectItem value="BOTH">Her İkisi</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm mt-1">
                {cari.AccountType === 'CUSTOMER' ? 'Müşteri' : 
                 cari.AccountType === 'SUPPLIER' ? 'Tedarikçi' : 'Her İkisi'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Switch
              checked={cari.Active}
              onCheckedChange={(checked) => handleChange("Active", checked)}
              disabled={!isFormEditable}
            />
            <Label className="text-xs text-gray-500">Aktif</Label>
          </div>
        </div>

        {/* VERGİ KİMLİK */}
        <h3 className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-4 mt-6">
          <FileText className="w-4 h-4" />
          VERGİ KİMLİK
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Kimlik Tipi *</Label>
            {isFormEditable ? (
              <Select
                value={cari.TaxIdType}
                onValueChange={(value: any) => handleChange("TaxIdType", value)}
              >
                <SelectTrigger className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VKN">VKN (Vergi Kimlik No)</SelectItem>
                  <SelectItem value="TCKN">TCKN (TC Kimlik No)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm mt-1">{cari.TaxIdType}</p>
            )}
            {errors.TaxIdType && <p className="text-xs text-red-500 mt-1">{errors.TaxIdType}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">
              {cari.TaxIdType === 'VKN' ? 'VKN (10 haneli)' : 'TCKN (11 haneli)'} *
            </Label>
            {isFormEditable ? (
              <Input
                value={cari.TaxId}
                onChange={(e) => handleChange("TaxId", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm font-mono"
                placeholder={cari.TaxIdType === 'VKN' ? '1234567890' : '12345678901'}
                maxLength={cari.TaxIdType === 'VKN' ? 10 : 11}
              />
            ) : (
              <p className="text-sm mt-1 font-mono text-green-400">{cari.TaxId}</p>
            )}
            {errors.TaxId && <p className="text-xs text-red-500 mt-1">{errors.TaxId}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">Vergi Dairesi</Label>
            {isFormEditable ? (
              <Input
                value={cari.TaxOffice || ''}
                onChange={(e) => handleChange("TaxOffice", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                placeholder="ALİAĞA VERGİ DAİRESİ"
              />
            ) : (
              <p className="text-sm mt-1">{cari.TaxOffice}</p>
            )}
            {errors.TaxOffice && <p className="text-xs text-red-500 mt-1">{errors.TaxOffice}</p>}
          </div>
        </div>

        {/* TİCARİ KİMLİK */}
        <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3 mt-6">TİCARİ KİMLİK (Opsiyonel)</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Mersis No (16 haneli)</Label>
            {isFormEditable ? (
              <Input
                value={cari.MersisNo || ''}
                onChange={(e) => handleChange("MersisNo", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm font-mono"
                placeholder="0123456789012345"
                maxLength={16}
              />
            ) : (
              cari.MersisNo && <p className="text-sm mt-1 font-mono">{cari.MersisNo}</p>
            )}
            {errors.MersisNo && <p className="text-xs text-red-500 mt-1">{errors.MersisNo}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">KEP Adresi</Label>
            {isFormEditable ? (
              <Input
                type="email"
                value={cari.KepAddress || ''}
                onChange={(e) => handleChange("KepAddress", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                placeholder="firma@hs01.kep.tr"
              />
            ) : (
              cari.KepAddress && <p className="text-sm mt-1">{cari.KepAddress}</p>
            )}
            {errors.KepAddress && <p className="text-xs text-red-500 mt-1">{errors.KepAddress}</p>}
          </div>
        </div>
      </div>

      {/* Orta Blok - Adres & İletişim */}
      <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
        <h3 className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-4">
          <MapPin className="w-4 h-4" />
          ADRES BİLGİLERİ
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Açık Adres *</Label>
            {isFormEditable ? (
              <Textarea
                value={cari.Address}
                onChange={(e) => handleChange("Address", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm min-h-[80px]"
                placeholder="Tam adres bilgisi (mahalle, cadde, bina no, daire)"
              />
            ) : (
              <p className="text-sm mt-1">{cari.Address}</p>
            )}
            {errors.Address && <p className="text-xs text-red-500 mt-1">{errors.Address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">Mahalle/Köy</Label>
              {isFormEditable ? (
                <Input
                  value={cari.Neighborhood || ''}
                  onChange={(e) => handleChange("Neighborhood", e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                  placeholder="Alsancak Mah."
                />
              ) : (
                cari.Neighborhood && <p className="text-sm mt-1">{cari.Neighborhood}</p>
              )}
              {errors.Neighborhood && <p className="text-xs text-red-500 mt-1">{errors.Neighborhood}</p>}
            </div>

            <div>
              <Label className="text-xs text-gray-500">Cadde/Sokak</Label>
              {isFormEditable ? (
                <Input
                  value={cari.Street || ''}
                  onChange={(e) => handleChange("Street", e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                  placeholder="Atatürk Cad."
                />
              ) : (
                cari.Street && <p className="text-sm mt-1">{cari.Street}</p>
              )}
              {errors.Street && <p className="text-xs text-red-500 mt-1">{errors.Street}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">Bina No</Label>
              {isFormEditable ? (
                <Input
                  value={cari.BuildingNo || ''}
                  onChange={(e) => handleChange("BuildingNo", e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                  placeholder="378"
                />
              ) : (
                cari.BuildingNo && <p className="text-sm mt-1">{cari.BuildingNo}</p>
              )}
              {errors.BuildingNo && <p className="text-xs text-red-500 mt-1">{errors.BuildingNo}</p>}
            </div>

            <div>
              <Label className="text-xs text-gray-500">Daire/Kapı</Label>
              {isFormEditable ? (
                <Input
                  value={cari.DoorNo || ''}
                  onChange={(e) => handleChange("DoorNo", e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                  placeholder="52"
                />
              ) : (
                cari.DoorNo && <p className="text-sm mt-1">{cari.DoorNo}</p>
              )}
              {errors.DoorNo && <p className="text-xs text-red-500 mt-1">{errors.DoorNo}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">İlçe</Label>
              {isFormEditable ? (
                <Input
                  value={cari.District || ''}
                  onChange={(e) => handleChange("District", e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                  placeholder="Konak"
                />
              ) : (
                cari.District && <p className="text-sm mt-1">{cari.District}</p>
              )}
              {errors.District && <p className="text-xs text-red-500 mt-1">{errors.District}</p>}
            </div>

            <div>
              <Label className="text-xs text-gray-500">İl *</Label>
              {isFormEditable ? (
                <Input
                  value={cari.City}
                  onChange={(e) => handleChange("City", e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                  placeholder="İzmir"
                />
              ) : (
                <p className="text-sm mt-1">{cari.City}</p>
              )}
              {errors.City && <p className="text-xs text-red-500 mt-1">{errors.City}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-gray-500">Posta Kodu *</Label>
              {isFormEditable ? (
                <Input
                  value={cari.PostalCode || ''}
                  onChange={(e) => handleChange("PostalCode", e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm font-mono"
                  placeholder="35210"
                  maxLength={5}
                />
              ) : (
                <p className="text-sm mt-1 font-mono">{cari.PostalCode}</p>
              )}
              {errors.PostalCode && <p className="text-xs text-red-500 mt-1">{errors.PostalCode}</p>}
            </div>

            <div>
              <Label className="text-xs text-gray-500">Ülke Kodu *</Label>
              {isFormEditable ? (
                <Input
                  value={cari.CountryCode}
                  onChange={(e) => handleChange("CountryCode", e.target.value.toUpperCase())}
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm font-mono"
                  placeholder="TR"
                  maxLength={2}
                />
              ) : (
                <p className="text-sm mt-1 font-mono">{cari.CountryCode}</p>
              )}
              {errors.CountryCode && <p className="text-xs text-red-500 mt-1">{errors.CountryCode}</p>}
            </div>
          </div>
        </div>

        {/* İLETİŞİM */}
        <h3 className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-4 mt-6">
          <Phone className="w-4 h-4" />
          İLETİŞİM
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Telefon</Label>
            {isFormEditable ? (
              <Input
                value={cari.Phone || ''}
                onChange={(e) => handleChange("Phone", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                placeholder="+90 232 123 45 67"
              />
            ) : (
              cari.Phone && <p className="text-sm mt-1">{cari.Phone}</p>
            )}
            {errors.Phone && <p className="text-xs text-red-500 mt-1">{errors.Phone}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">Cep Telefonu</Label>
            {isFormEditable ? (
              <Input
                value={cari.Mobile || ''}
                onChange={(e) => handleChange("Mobile", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                placeholder="+90 532 111 22 33"
              />
            ) : (
              cari.Mobile && <p className="text-sm mt-1">{cari.Mobile}</p>
            )}
            {errors.Mobile && <p className="text-xs text-red-500 mt-1">{errors.Mobile}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">E-posta</Label>
            {isFormEditable ? (
              <Input
                type="email"
                value={cari.Email || ''}
                onChange={(e) => handleChange("Email", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                placeholder="info@firma.com"
              />
            ) : (
              cari.Email && <p className="text-sm mt-1">{cari.Email}</p>
            )}
            {errors.Email && <p className="text-xs text-red-500 mt-1">{errors.Email}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">IBAN</Label>
            {isFormEditable ? (
              <Input
                value={cari.IBAN || ''}
                onChange={(e) => handleChange("IBAN", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm font-mono"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              />
            ) : (
              cari.IBAN && <p className="text-sm mt-1 font-mono">{cari.IBAN}</p>
            )}
            {errors.IBAN && <p className="text-xs text-red-500 mt-1">{errors.IBAN}</p>}
          </div>
        </div>
      </div>

      {/* Sağ Blok - E-Fatura & Finans */}
      <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-5`}>
        <h3 className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-4">
          <FileText className="w-4 h-4 text-purple-400" />
          E-FATURA AYARLARI
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={cari.IsEInvoiceCustomer}
              onCheckedChange={(checked) => handleChange("IsEInvoiceCustomer", checked)}
              disabled={!isFormEditable}
            />
            <Label className="text-xs text-gray-500">E-Fatura Mükellefi</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={cari.AcceptsEArchive}
              onCheckedChange={(checked) => handleChange("AcceptsEArchive", checked)}
              disabled={!isFormEditable}
            />
            <Label className="text-xs text-gray-500">E-Arşiv Kabul Eder</Label>
          </div>

          {cari.IsEInvoiceCustomer && (
            <>
              <div>
                <Label className="text-xs text-gray-500">E-Fatura Tipi</Label>
                {isFormEditable ? (
                  <Select
                    value={cari.EInvoiceType || ''}
                    onValueChange={(value: any) => handleChange("EInvoiceType", value || undefined)}
                  >
                    <SelectTrigger className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GB">GB - Gelir İdaresi Başkanlığı</SelectItem>
                      <SelectItem value="PK">PK - Özel Entegratör</SelectItem>
                      <SelectItem value="OK">OK - Özel Kullanıcı</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm mt-1">{cari.EInvoiceType}</p>
                )}
                {errors.EInvoiceType && <p className="text-xs text-red-500 mt-1">{errors.EInvoiceType}</p>}
              </div>

              <div>
                <Label className="text-xs text-gray-500">E-Fatura Alias/Etiket</Label>
                {isFormEditable ? (
                  <Input
                    value={cari.EInvoiceAlias || ''}
                    onChange={(e) => handleChange("EInvoiceAlias", e.target.value)}
                    className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                    placeholder="urn:mail:defaultpk@efatura.com.tr"
                  />
                ) : (
                  cari.EInvoiceAlias && <p className="text-sm mt-1 font-mono text-xs break-all">{cari.EInvoiceAlias}</p>
                )}
                {errors.EInvoiceAlias && <p className="text-xs text-red-500 mt-1">{errors.EInvoiceAlias}</p>}
              </div>
            </>
          )}

          <div>
            <Label className="text-xs text-gray-500">Gönderim Yöntemi</Label>
            {isFormEditable ? (
              <Select
                value={cari.SendMethod}
                onValueChange={(value: any) => handleChange("SendMethod", value)}
              >
                <SelectTrigger className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E-ARSIV">E-Arşiv Fatura</SelectItem>
                  <SelectItem value="E-FATURA">E-Fatura</SelectItem>
                  <SelectItem value="KAGIT">Kağıt Fatura</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm mt-1">
                {cari.SendMethod === 'E-ARSIV' && '📄 E-Arşiv'}
                {cari.SendMethod === 'E-FATURA' && '⚡ E-Fatura'}
                {cari.SendMethod === 'KAGIT' && '📋 Kağıt'}
              </p>
            )}
            {errors.SendMethod && <p className="text-xs text-red-500 mt-1">{errors.SendMethod}</p>}
          </div>
        </div>

        {/* FİNANSAL PARAMETRELER */}
        <h3 className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-4 mt-6">
          <DollarSign className="w-4 h-4" />
          FİNANSAL PARAMETRELER
        </h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500">Para Birimi</Label>
            {isFormEditable ? (
              <Input
                value={cari.Currency}
                onChange={(e) => handleChange("Currency", e.target.value.toUpperCase())}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm font-mono"
                placeholder="TRY"
                maxLength={3}
              />
            ) : (
              <p className="text-sm mt-1 font-mono">{cari.Currency}</p>
            )}
            {errors.Currency && <p className="text-xs text-red-500 mt-1">{errors.Currency}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">Ödeme Vadesi (gün)</Label>
            {isFormEditable ? (
              <Input
                type="number"
                value={cari.PaymentTermDays}
                onChange={(e) => handleChange("PaymentTermDays", parseInt(e.target.value) || 0)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                placeholder="0"
                min="0"
              />
            ) : (
              <p className="text-sm mt-1">{cari.PaymentTermDays} gün</p>
            )}
            {errors.PaymentTermDays && <p className="text-xs text-red-500 mt-1">{errors.PaymentTermDays}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">Risk Limiti</Label>
            {isFormEditable ? (
              <Input
                type="number"
                value={cari.RiskLimit || ''}
                onChange={(e) => handleChange("RiskLimit", parseFloat(e.target.value) || undefined)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm"
                placeholder="0"
                min="0"
              />
            ) : (
              cari.RiskLimit && (
                <p className="text-sm mt-1">
                  {cari.RiskLimit.toLocaleString('tr-TR')} {cari.RiskCurrency}
                </p>
              )
            )}
            {errors.RiskLimit && <p className="text-xs text-red-500 mt-1">{errors.RiskLimit}</p>}
          </div>

          <div>
            <Label className="text-xs text-gray-500">Muhasebe Kodu (GL)</Label>
            {isFormEditable ? (
              <Input
                value={cari.GlCode || ''}
                onChange={(e) => handleChange("GlCode", e.target.value)}
                className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm font-mono"
                placeholder="120.01.001"
              />
            ) : (
              cari.GlCode && <p className="text-sm mt-1 font-mono">{cari.GlCode}</p>
            )}
            {errors.GlCode && <p className="text-xs text-red-500 mt-1">{errors.GlCode}</p>}
          </div>
        </div>

        {/* NOTLAR */}
        {(isFormEditable || cari.Notes) && (
          <>
            <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3 mt-6">NOTLAR</h3>
            <div>
              {isFormEditable ? (
                <Textarea
                  value={cari.Notes || ''}
                  onChange={(e) => handleChange("Notes", e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-700 text-white text-sm min-h-[60px]"
                  placeholder="Genel notlar ve açıklamalar..."
                />
              ) : (
                cari.Notes && <p className="text-sm mt-1 text-gray-400">{cari.Notes}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}