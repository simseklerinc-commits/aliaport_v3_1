import { useState, useEffect } from "react";
import { Save, X, FileText, Tag, AlertCircle, Lock, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Theme } from "./ThemeSelector";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { ServiceCard } from "../data/serviceCardData";
import {
  parameterUnitsMasterData,
  parameterVatRatesMasterData,
  parameterVatExemptionsMasterData,
  parameterServiceGroupsMasterData,
  parameterServiceCategoriesMasterData,
  parameterPricingRulesMasterData,
} from "../data/parametersData";
import { FIELD_EDIT_RULES } from "../lib/types/audit";
import type { RecordMetadata } from "../lib/types/audit";
import { recordMetadataApiMock } from "../lib/api/audit";
import { RecordMetadataCard } from "./RecordMetadataCard";

interface HizmetKartiDuzenleProps {
  service: ServiceCard;
  onClose: () => void;
  onSave: (updatedService: ServiceCard) => void;
  theme: Theme;
}

interface ServiceCardForm {
  code: string;
  name: string;
  description: string;
  accounting_code: string;
  unit_id: number | null;
  vat_rate_id: number | null;
  vat_exemption_id: number;
  group_id: number | null;
  category_id: number | null;
  pricing_rule_id: number | null;
  // NOT: default_unit_price ve currency_code KALDIRILDI - Fiyat bilgisi sadece Tarife Yönetimi'nde!
  is_active: boolean;
  metadata_json: {
    tags: string[];
  };
}

export function HizmetKartiDuzenle({ service, onClose, onSave, theme }: HizmetKartiDuzenleProps) {
  const [metadata, setMetadata] = useState<RecordMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Metadata yükle
  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    setLoadingMetadata(true);
    try {
      const data = await recordMetadataApiMock.getMetadata('services', service.id);
      setMetadata(data);
    } catch (error) {
      console.error('Metadata yüklenemedi:', error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  // Alan düzenlenebilir mi kontrol et
  const isFieldEditable = (fieldName: string): boolean => {
    const rules = FIELD_EDIT_RULES.services;
    const rule = rules.find(r => r.field_name === fieldName);
    
    if (!rule) return true;
    
    if (rule.editable === 'never') return false;
    if (rule.editable === 'always') return true;
    if (rule.editable === 'if_no_movements' && metadata?.has_movements) return false;
    
    return true;
  };

  // Alan için uyarı mesajı
  const getFieldWarning = (fieldName: string): string | null => {
    if (isFieldEditable(fieldName)) return null;
    
    const rules = FIELD_EDIT_RULES.services;
    const rule = rules.find(r => r.field_name === fieldName);
    
    return rule?.validation_message || 'Bu alan değiştirilemez';
  };

  // Parse metadata
  const parseMetadata = () => {
    if (!service.metadata_json) return { tags: [] };
    try {
      const parsed = JSON.parse(service.metadata_json);
      return { tags: parsed.tags || [] };
    } catch {
      return { tags: [] };
    }
  };

  const [formData, setFormData] = useState<ServiceCardForm>({
    code: service.code,
    name: service.name,
    description: service.description,
    accounting_code: service.accounting_code,
    unit_id: service.unit_id,
    vat_rate_id: service.vat_rate_id,
    vat_exemption_id: service.vat_exemption_id,
    group_id: service.group_id,
    category_id: service.category_id,
    pricing_rule_id: service.pricing_rule_id,
    // NOT: default_unit_price ve currency_code KALDIRILDI - Fiyat bilgisi sadece Tarife Yönetimi'nde!
    is_active: service.is_active,
    metadata_json: parseMetadata(),
  });

  const [tagInput, setTagInput] = useState("");
  const [changeNote, setChangeNote] = useState("");

  // Seçilen gruba göre kategorileri filtrele
  const getAvailableCategories = () => {
    if (!formData.group_id) return [];
    return parameterServiceCategoriesMasterData.filter(
      (cat) => cat.group_id === formData.group_id && cat.is_active
    );
  };

  // Grup değiştiğinde kategoriyi sıfırla
  const handleGroupChange = (groupId: number | null) => {
    setFormData({
      ...formData,
      group_id: groupId,
      category_id: null,
    });
  };

  // KDV İstisna değiştiğinde KDV Oranını kontrol et
  const handleVatExemptionChange = (exemptionId: number) => {
    const exemption = parameterVatExemptionsMasterData.find((e) => e.id === exemptionId);
    setFormData({
      ...formData,
      vat_exemption_id: exemptionId,
      vat_rate_id: exemption?.force_zero_vat ? 4 : formData.vat_rate_id,
    });
  };

  // İstisna varsa KDV oranı disabled mı?
  const isVatRateDisabled = () => {
    const exemption = parameterVatExemptionsMasterData.find(
      (e) => e.id === formData.vat_exemption_id
    );
    return exemption?.force_zero_vat || false;
  };

  const handleInputChange = (field: keyof ServiceCardForm, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.metadata_json.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        metadata_json: {
          ...formData.metadata_json,
          tags: [...formData.metadata_json.tags, tagInput.trim()],
        },
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      metadata_json: {
        ...formData.metadata_json,
        tags: formData.metadata_json.tags.filter((t) => t !== tag),
      },
    });
  };

  const handleSave = () => {
    if (!formData.code) {
      alert("Hizmet kodu zorunludur!");
      return;
    }
    if (!formData.name) {
      alert("Hizmet adı zorunludur!");
      return;
    }
    if (!formData.unit_id) {
      alert("Birim seçimi zorunludur!");
      return;
    }

    const updatedService: ServiceCard = {
      ...service,
      code: formData.code,
      name: formData.name,
      description: formData.description,
      accounting_code: formData.accounting_code,
      unit_id: formData.unit_id,
      vat_rate_id: formData.vat_rate_id,
      vat_exemption_id: formData.vat_exemption_id,
      group_id: formData.group_id,
      category_id: formData.category_id,
      pricing_rule_id: formData.pricing_rule_id,
      // NOT: default_unit_price ve currency_code KALDIRILDI - Fiyat bilgisi sadece Tarife Yönetimi'nde!
      is_active: formData.is_active,
      metadata_json: JSON.stringify(formData.metadata_json),
      updated_at: new Date().toISOString(),
      updated_by: 1, // Mock user ID
    };

    console.log("Hizmet Kartı Güncelleniyor:", updatedService);
    console.log("Değişiklik Notu:", changeNote);

    onSave(updatedService);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl mb-1">Hizmet Kartı Düzenle</h2>
            <p className={theme.colors.textMuted}>ID: {service.id} · Kod: {service.code}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Blok - Genel Bilgiler */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-400" />
                Genel Bilgiler
              </h3>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Hizmet Kodu *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                  placeholder="MB-BAR-001"
                  className="bg-gray-800/50 border-gray-700 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Hizmet Adı *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Motorbot Barınma Hizmeti (Yıllık)"
                  className="bg-gray-800/50 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Açıklama</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Hizmet hakkında detaylı açıklama..."
                  className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[80px]"
                />
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Muhasebe Kodu
                </label>
                <Input
                  value={formData.accounting_code}
                  onChange={(e) => handleInputChange("accounting_code", e.target.value.toUpperCase())}
                  placeholder="600.01.001"
                  className="bg-gray-800/50 border-gray-700 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Grup</label>
                  <select
                    value={formData.group_id || ""}
                    onChange={(e) => handleGroupChange(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  >
                    <option value="">-- Grup seçin --</option>
                    {parameterServiceGroupsMasterData
                      .filter((g) => g.is_active)
                      .map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Kategori</label>
                  <select
                    value={formData.category_id || ""}
                    onChange={(e) => handleInputChange("category_id", e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  >
                    <option value="">-- Kategori seçin --</option>
                    {getAvailableCategories().map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Etiketler (Tags)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Etiket ekle..."
                    className="bg-gray-800/50 border-gray-700 text-white text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTag}
                    className="bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                  >
                    Ekle
                  </Button>
                </div>
                {formData.metadata_json.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.metadata_json.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-blue-500/30 text-blue-400 cursor-pointer hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-xs"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ✕
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Durum</label>
                <select
                  value={formData.is_active ? "ACTIVE" : "PASSIVE"}
                  onChange={(e) => handleInputChange("is_active", e.target.value === "ACTIVE")}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                >
                  <option value="ACTIVE">AKTİF</option>
                  <option value="PASSIVE">PASİF</option>
                </select>
              </div>
            </div>

            {/* Sağ Blok - Birim & KDV */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 mb-3">
                <Tag className="w-5 h-5 text-green-400" />
                Birim & KDV
              </h3>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>Birim *</label>
                <select
                  value={formData.unit_id || ""}
                  onChange={(e) => handleInputChange("unit_id", e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">-- Birim seçin --</option>
                  {parameterUnitsMasterData
                    .filter((u) => u.is_active)
                    .map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Fiyatlandırma Hesaplama Kuralı
                </label>
                <select
                  value={formData.pricing_rule_id || ""}
                  onChange={(e) => handleInputChange("pricing_rule_id", e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                >
                  <option value="">-- Kural Yok (Standart Birim x Fiyat) --</option>
                  {parameterPricingRulesMasterData
                    .filter((r) => r.is_active)
                    .map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name} - Min: {rule.min_quantity}
                      </option>
                    ))}
                </select>
                {formData.pricing_rule_id && (
                  <div className="mt-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs text-cyan-400">
                    {parameterPricingRulesMasterData.find((r) => r.id === formData.pricing_rule_id)?.description}
                  </div>
                )}
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>KDV Oranı (%)</label>
                <select
                  value={formData.vat_rate_id || ""}
                  onChange={(e) => handleInputChange("vat_rate_id", e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                  disabled={isVatRateDisabled()}
                >
                  {parameterVatRatesMasterData.map((rate) => (
                    <option key={rate.id} value={rate.id}>
                      {rate.rate}%
                    </option>
                  ))}
                </select>
                {isVatRateDisabled() && (
                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                    KDV İstisnası nedeniyle KDV oranı %0 olarak ayarlandı.
                  </div>
                )}
              </div>

              <div>
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>KDV İstisna</label>
                <select
                  value={formData.vat_exemption_id || ""}
                  onChange={(e) => handleVatExemptionChange(e.target.value ? Number(e.target.value) : 1)}
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-md px-3 py-2.5 text-sm"
                >
                  {parameterVatExemptionsMasterData.map((exemption) => (
                    <option key={exemption.id} value={exemption.id}>
                      {exemption.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-800 pt-4 mt-6">
                <label className={`text-xs ${theme.colors.textMuted} mb-2 block`}>
                  Değişiklik Notu (Opsiyonel)
                </label>
                <Textarea
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="Bu değişiklik neden yapıldı?"
                  className="bg-gray-800/50 border-gray-700 text-white text-sm min-h-[80px]"
                />
                <p className="text-xs text-gray-500 mt-2">
                  <AlertCircle className="inline w-3 h-3 mr-1" />
                  Bu not değişiklik geçmişinde kaydedilecektir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <span className="text-red-400">*</span> ile işaretli alanlar zorunludur
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              İptal
            </Button>
            <Button
              className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}