import { useState } from "react";
import { 
  Ruler, 
  Calculator, 
  ShieldCheck, 
  FolderTree, 
  Tag, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Settings,
  ChevronRight,
  Users,
  Shield
} from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Theme } from "./ThemeSelector";

import {
  parameterUnitsMasterData,
  parameterVatRatesMasterData,
  parameterVatExemptionsMasterData,
  parameterServiceGroupsMasterData,
  parameterServiceCategoriesMasterData,
  currencyMasterData,
  parameterPricingRulesMasterData,
} from "../data/parametersData";

import { usersData, rolesData, permissionsData } from "../data/usersData";

interface ParametrelerProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  theme: Theme;
  currentUser?: { is_admin: boolean }; // ✨ YENİ: Admin kontrolü için
}

type ParameterType = 
  | "birimler" 
  | "para-birimleri" 
  | "kdv-oranlari" 
  | "kdv-istisnalari" 
  | "hizmet-gruplari" 
  | "hizmet-kategorileri" 
  | "fiyatlandirma-kurallari"
  | "kullanicilar"  // ✨ YENİ
  | "roller"        // ✨ YENİ
  | null;

export function Parametreler({ onNavigateHome, onNavigateBack, theme, currentUser }: ParametrelerProps) {
  const [selectedParameter, setSelectedParameter] = useState<ParameterType>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // İstatistikler
  const parameterCategories = [
    {
      id: "birimler",
      name: "Birim Tanımları",
      description: "Ölçü birimleri tanımları",
      icon: Ruler,
      count: parameterUnitsMasterData.length,
      activeCount: parameterUnitsMasterData.filter(u => u.is_active).length,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30"
    },
    {
      id: "para-birimleri",
      name: "Döviz Tanımları",
      description: "Para birimi ve kur tanımları",
      icon: DollarSign,
      count: currencyMasterData.length,
      activeCount: currencyMasterData.filter(c => c.is_active).length,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30"
    },
    {
      id: "kdv-oranlari",
      name: "KDV Oranları",
      description: "KDV oran tanımları",
      icon: Calculator,
      count: parameterVatRatesMasterData.length,
      activeCount: parameterVatRatesMasterData.filter(v => v.is_active).length,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30"
    },
    {
      id: "kdv-istisnalari",
      name: "KDV İstisna Tanımları",
      description: "KDV istisna ve muafiyet tanımları",
      icon: ShieldCheck,
      count: parameterVatExemptionsMasterData.length,
      activeCount: parameterVatExemptionsMasterData.filter(v => v.is_active).length,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30"
    },
    {
      id: "hizmet-gruplari",
      name: "Hizmet Ana Grup Tanımları",
      description: "Ana grup sınıflandırması",
      icon: FolderTree,
      count: parameterServiceGroupsMasterData.length,
      activeCount: parameterServiceGroupsMasterData.filter(g => g.is_active).length,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30"
    },
    {
      id: "hizmet-kategorileri",
      name: "Hizmet Kategori Tanımları",
      description: "Detaylı kategori tanımları",
      icon: Tag,
      count: parameterServiceCategoriesMasterData.length,
      activeCount: parameterServiceCategoriesMasterData.filter(c => c.is_active).length,
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/30"
    },
    {
      id: "fiyatlandirma-kurallari",
      name: "Fiyatlandırma Hesaplama Kuralları",
      description: "Minimum fiyat ve hesaplama kuralları",
      icon: TrendingUp,
      count: parameterPricingRulesMasterData.length,
      activeCount: parameterPricingRulesMasterData.filter(r => r.is_active).length,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30"
    },
    // ✨ YENİ: KULLANICI YÖNETİMİ (SADECE ADMIN)
    {
      id: "kullanicilar",
      name: "Kullanıcı Yönetimi",
      description: "Sistem kullanıcıları ve yetkilendirme",
      icon: Users,
      count: usersData.length,
      activeCount: usersData.filter(u => u.is_active).length,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      adminOnly: true, // ✨ Admin kontrolü
    },
    // ✨ YENİ: ROL YÖNETİMİ (SADECE ADMIN)
    {
      id: "roller",
      name: "Rol ve Yetki Yönetimi",
      description: "Kullanıcı rolleri ve yetki tanımları",
      icon: Shield,
      count: rolesData.length,
      activeCount: rolesData.filter(r => r.is_active).length,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/30",
      adminOnly: true, // ✨ Admin kontrolü
    }
  ];

  // Admin kontrolü - Admin değilse admin-only kategorileri filtrele
  const visibleCategories = currentUser?.is_admin 
    ? parameterCategories 
    : parameterCategories.filter(cat => !cat.adminOnly);

  // Ana menü göster
  if (!selectedParameter) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl mb-2 flex items-center gap-3">
            <Settings className={`w-8 h-8 ${theme.colors.primaryText}`} />
            Sistem Parametreleri
          </h1>
          <p className="text-gray-400">Merkezi parametre tanımlamaları ve yönetim - Detay için bir kategori seçin</p>
        </div>

        {/* Grid - Tıklanabilir Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id}
                className={`${theme.colors.bgCard} border-${theme.colors.border} hover:border-${theme.colors.primary}/50 transition-all cursor-pointer group`}
                onClick={() => setSelectedParameter(category.id as ParameterType)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-4 rounded-lg ${category.bgColor}`}>
                        <Icon className={`w-8 h-8 ${category.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 group-hover:${theme.colors.primaryText} transition-colors">
                          {category.name}
                        </CardTitle>
                        <CardDescription className="text-base text-gray-400">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className={`w-6 h-6 text-gray-500 group-hover:${theme.colors.primaryText} transition-all group-hover:translate-x-1`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`flex items-center justify-between p-4 rounded-lg ${category.bgColor} border ${category.borderColor}`}>
                    <span className="text-base text-gray-300">Toplam Kayıt</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${category.color} text-base px-3 py-1`}>
                        {category.activeCount} Aktif
                      </Badge>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {category.count} Toplam
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Detay sayfası - Seçili parametreye göre
  const selectedCategory = parameterCategories.find(c => c.id === selectedParameter);
  const Icon = selectedCategory?.icon || Settings;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setSelectedParameter(null);
              setSearchTerm("");
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl flex items-center gap-3">
              <Icon className={`w-6 h-6 ${selectedCategory?.color}`} />
              {selectedCategory?.name}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{selectedCategory?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button className={`${theme.colors.primary} ${theme.colors.primaryHover} text-black`}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ekle
          </Button>
        </div>
      </div>

      {/* Detay Tablo */}
      <Card className={`${theme.colors.bgCard} border-${theme.colors.border}`}>
        <CardContent className="pt-6">
          {selectedParameter === "birimler" && (
            <BirimlerTable searchTerm={searchTerm} theme={theme} />
          )}
          {selectedParameter === "para-birimleri" && (
            <ParaBirimleriTable searchTerm={searchTerm} theme={theme} />
          )}
          {selectedParameter === "kdv-oranlari" && (
            <KdvOranlariTable searchTerm={searchTerm} theme={theme} />
          )}
          {selectedParameter === "kdv-istisnalari" && (
            <KdvIstisnalariTable searchTerm={searchTerm} theme={theme} />
          )}
          {selectedParameter === "hizmet-gruplari" && (
            <HizmetGruplariTable searchTerm={searchTerm} theme={theme} />
          )}
          {selectedParameter === "hizmet-kategorileri" && (
            <HizmetKategorileriTable searchTerm={searchTerm} theme={theme} />
          )}
          {selectedParameter === "fiyatlandirma-kurallari" && (
            <FiyatlandirmaKurallariTable searchTerm={searchTerm} theme={theme} />
          )}
          {selectedParameter === "kullanicilar" && (
            <KullanicilarTable searchTerm={searchTerm} theme={theme} />
          )}
          {selectedParameter === "roller" && (
            <RollerTable searchTerm={searchTerm} theme={theme} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// SHARED TABLE STYLING CONSTANTS
const TABLE_STYLES = {
  container: "rounded-lg border border-gray-700 overflow-hidden",
  headerRow: "bg-gray-800/50 hover:bg-gray-800/50",
  headerCell: "text-base text-gray-300",
  evenRow: "bg-gray-900/30",
  oddRow: "bg-gray-900/50",
  code: "text-base bg-gray-800 px-3 py-1.5 rounded text-white",
  textCell: "text-base text-white",
  textCellGray: "text-base text-gray-300",
  badgeActive: "bg-green-500/20 text-green-300 border-green-500/30 text-base",
  badgeInactive: "text-gray-400 text-base",
  iconEdit: "w-5 h-5 text-blue-400",
  iconDelete: "w-5 h-5 text-red-400",
  buttonHover: "hover:bg-gray-700"
};

// BİRİMLER TABLOSU
function BirimlerTable({ searchTerm, theme }: { searchTerm: string; theme: Theme }) {
  const filteredData = parameterUnitsMasterData.filter(unit => 
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={TABLE_STYLES.container}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_STYLES.headerRow}>
            <TableHead className={TABLE_STYLES.headerCell}>Kod</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Birim Adı</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Sembol</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Sıra</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Durum</TableHead>
            <TableHead className={`${TABLE_STYLES.headerCell} text-right`}>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((unit, index) => (
            <TableRow key={unit.id} className={index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow}>
              <TableCell>
                <code className={TABLE_STYLES.code}>{unit.code}</code>
              </TableCell>
              <TableCell className={TABLE_STYLES.textCell}>{unit.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-base">{unit.symbol || "-"}</Badge>
              </TableCell>
              <TableCell className={TABLE_STYLES.textCellGray}>{unit.display_order}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch checked={unit.is_active} />
                  {unit.is_active ? (
                    <Badge className={TABLE_STYLES.badgeActive}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={TABLE_STYLES.badgeInactive}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Pasif
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Edit className={TABLE_STYLES.iconEdit} />
                  </Button>
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Trash2 className={TABLE_STYLES.iconDelete} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// PARA BİRİMLERİ TABLOSU
function ParaBirimleriTable({ searchTerm, theme }: { searchTerm: string; theme: Theme }) {
  const filteredData = currencyMasterData.filter(currency => 
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={TABLE_STYLES.container}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_STYLES.headerRow}>
            <TableHead className={TABLE_STYLES.headerCell}>Kod</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Para Birimi</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Sembol</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Sıra</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Durum</TableHead>
            <TableHead className={`${TABLE_STYLES.headerCell} text-right`}>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((currency, index) => (
            <TableRow key={currency.id} className={index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow}>
              <TableCell>
                <code className={TABLE_STYLES.code}>{currency.code}</code>
              </TableCell>
              <TableCell className={TABLE_STYLES.textCell}>{currency.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-base">{currency.symbol}</Badge>
              </TableCell>
              <TableCell className={TABLE_STYLES.textCellGray}>{currency.display_order}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch checked={currency.is_active} />
                  {currency.is_active ? (
                    <Badge className={TABLE_STYLES.badgeActive}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={TABLE_STYLES.badgeInactive}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Pasif
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Edit className={TABLE_STYLES.iconEdit} />
                  </Button>
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Trash2 className={TABLE_STYLES.iconDelete} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// KDV ORANLARI TABLOSU
function KdvOranlariTable({ searchTerm, theme }: { searchTerm: string; theme: Theme }) {
  const filteredData = parameterVatRatesMasterData.filter(vat => 
    vat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vat.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={TABLE_STYLES.container}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_STYLES.headerRow}>
            <TableHead className={TABLE_STYLES.headerCell}>Kod</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>KDV Açıklama</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Oran (%)</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Sıra</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Durum</TableHead>
            <TableHead className={`${TABLE_STYLES.headerCell} text-right`}>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((vat, index) => (
            <TableRow key={vat.id} className={index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow}>
              <TableCell>
                <code className={TABLE_STYLES.code}>{vat.code}</code>
              </TableCell>
              <TableCell className={TABLE_STYLES.textCell}>{vat.name}</TableCell>
              <TableCell>
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-base">
                  %{vat.rate.toFixed(2)}
                </Badge>
              </TableCell>
              <TableCell className={TABLE_STYLES.textCellGray}>{vat.display_order}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch checked={vat.is_active} />
                  {vat.is_active ? (
                    <Badge className={TABLE_STYLES.badgeActive}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={TABLE_STYLES.badgeInactive}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Pasif
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Edit className={TABLE_STYLES.iconEdit} />
                  </Button>
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Trash2 className={TABLE_STYLES.iconDelete} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// KDV İSTİSNALARI TABLOSU
function KdvIstisnalariTable({ searchTerm, theme }: { searchTerm: string; theme: Theme }) {
  const filteredData = parameterVatExemptionsMasterData.filter(exemption => 
    exemption.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exemption.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={TABLE_STYLES.container}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_STYLES.headerRow}>
            <TableHead className={TABLE_STYLES.headerCell}>Kod</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>İstisna Adı</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Açıklama</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Otomatik Sıfır</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Durum</TableHead>
            <TableHead className={`${TABLE_STYLES.headerCell} text-right`}>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((exemption, index) => (
            <TableRow key={exemption.id} className={index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow}>
              <TableCell>
                <code className={TABLE_STYLES.code}>{exemption.code}</code>
              </TableCell>
              <TableCell className={TABLE_STYLES.textCell}>{exemption.name}</TableCell>
              <TableCell className="max-w-xs text-base text-gray-400">
                {exemption.description}
              </TableCell>
              <TableCell>
                {exemption.force_zero_vat ? (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-base">
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    Evet
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-400 text-base">
                    Hayır
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch checked={exemption.is_active} />
                  {exemption.is_active ? (
                    <Badge className={TABLE_STYLES.badgeActive}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={TABLE_STYLES.badgeInactive}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Pasif
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Edit className={TABLE_STYLES.iconEdit} />
                  </Button>
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Trash2 className={TABLE_STYLES.iconDelete} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// HİZMET GRUPLARI TABLOSU
function HizmetGruplariTable({ searchTerm, theme }: { searchTerm: string; theme: Theme }) {
  const filteredData = parameterServiceGroupsMasterData.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={TABLE_STYLES.container}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_STYLES.headerRow}>
            <TableHead className={TABLE_STYLES.headerCell}>Kod</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Grup Adı</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Açıklama</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Sıra</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Durum</TableHead>
            <TableHead className={`${TABLE_STYLES.headerCell} text-right`}>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((group, index) => (
            <TableRow key={group.id} className={index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow}>
              <TableCell>
                <code className={TABLE_STYLES.code}>{group.code}</code>
              </TableCell>
              <TableCell className={TABLE_STYLES.textCell}>{group.name}</TableCell>
              <TableCell className="max-w-xs text-base text-gray-400">
                {group.description}
              </TableCell>
              <TableCell className={TABLE_STYLES.textCellGray}>{group.display_order}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch checked={group.is_active} />
                  {group.is_active ? (
                    <Badge className={TABLE_STYLES.badgeActive}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={TABLE_STYLES.badgeInactive}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Pasif
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Edit className={TABLE_STYLES.iconEdit} />
                  </Button>
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Trash2 className={TABLE_STYLES.iconDelete} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// HİZMET KATEGORİLERİ TABLOSU
function HizmetKategorileriTable({ searchTerm, theme }: { searchTerm: string; theme: Theme }) {
  const filteredData = parameterServiceCategoriesMasterData.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={TABLE_STYLES.container}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_STYLES.headerRow}>
            <TableHead className={TABLE_STYLES.headerCell}>Kod</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Kategori Adı</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Grup</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Açıklama</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Durum</TableHead>
            <TableHead className={`${TABLE_STYLES.headerCell} text-right`}>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((category, index) => {
            const group = parameterServiceGroupsMasterData.find(g => g.id === category.group_id);
            return (
              <TableRow key={category.id} className={index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow}>
                <TableCell>
                  <code className={TABLE_STYLES.code}>{category.code}</code>
                </TableCell>
                <TableCell className={TABLE_STYLES.textCell}>{category.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-orange-400 text-base">
                    {group?.name || "Bilinmiyor"}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs text-base text-gray-400">
                  {category.description}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={category.is_active} />
                    {category.is_active ? (
                      <Badge className={TABLE_STYLES.badgeActive}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={TABLE_STYLES.badgeInactive}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Pasif
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                      <Edit className={TABLE_STYLES.iconEdit} />
                    </Button>
                    <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                      <Trash2 className={TABLE_STYLES.iconDelete} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// FİYATLANDIRMA KURALLARI TABLOSU
function FiyatlandirmaKurallariTable({ searchTerm, theme }: { searchTerm: string; theme: Theme }) {
  const filteredData = parameterPricingRulesMasterData.filter(rule => 
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={TABLE_STYLES.container}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_STYLES.headerRow}>
            <TableHead className={TABLE_STYLES.headerCell}>Kod</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Kural Adı</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Min. Miktar</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Hesap Tipi</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Açıklama</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Durum</TableHead>
            <TableHead className={`${TABLE_STYLES.headerCell} text-right`}>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((rule, index) => (
            <TableRow key={rule.id} className={index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow}>
              <TableCell>
                <code className={TABLE_STYLES.code}>{rule.code}</code>
              </TableCell>
              <TableCell className={TABLE_STYLES.textCell}>{rule.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 text-base">
                  {rule.min_quantity}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={rule.calculation_type === "STANDARD" ? "text-green-400 text-base" : "text-orange-400 text-base"}>
                  {rule.calculation_type === "STANDARD" ? "Standart" : "Paket+Aşan"}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs text-base text-gray-400">
                {rule.description}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch checked={rule.is_active} />
                  {rule.is_active ? (
                    <Badge className={TABLE_STYLES.badgeActive}>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={TABLE_STYLES.badgeInactive}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Pasif
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Edit className={TABLE_STYLES.iconEdit} />
                  </Button>
                  <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                    <Trash2 className={TABLE_STYLES.iconDelete} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// KULLANICILAR TABLOSU
function KullanicilarTable({ searchTerm, theme }: { searchTerm: string; theme: Theme }) {
  const filteredData = usersData.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={TABLE_STYLES.container}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_STYLES.headerRow}>
            <TableHead className={TABLE_STYLES.headerCell}>Kullanıcı Adı</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Ad Soyad</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>E-posta</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Rol</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Departman</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Durum</TableHead>
            <TableHead className={`${TABLE_STYLES.headerCell} text-right`}>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((user, index) => {
            const role = rolesData.find(r => r.id === user.role_id);
            return (
              <TableRow key={user.id} className={index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow}>
                <TableCell>
                  <code className={TABLE_STYLES.code}>{user.username}</code>
                </TableCell>
                <TableCell className={TABLE_STYLES.textCell}>
                  {user.full_name}
                  {user.is_admin && (
                    <Badge variant="outline" className="ml-2 bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                      ADMIN
                    </Badge>
                  )}
                </TableCell>
                <TableCell className={TABLE_STYLES.textCellGray}>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-blue-400 text-base">
                    {role?.name || "Bilinmiyor"}
                  </Badge>
                </TableCell>
                <TableCell className={TABLE_STYLES.textCellGray}>
                  {user.department || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={user.is_active} />
                    {user.is_active ? (
                      <Badge className={TABLE_STYLES.badgeActive}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={TABLE_STYLES.badgeInactive}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Pasif
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                      <Edit className={TABLE_STYLES.iconEdit} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={TABLE_STYLES.buttonHover}
                      disabled={user.is_admin} // Admin kullanıcı silinemez
                    >
                      <Trash2 className={TABLE_STYLES.iconDelete} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ROLLER TABLOSU
function RollerTable({ searchTerm, theme }: { searchTerm: string; theme: Theme }) {
  const filteredData = rolesData.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={TABLE_STYLES.container}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_STYLES.headerRow}>
            <TableHead className={TABLE_STYLES.headerCell}>Kod</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Rol Adı</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Açıklama</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Yetki Sayısı</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Kullanıcı</TableHead>
            <TableHead className={TABLE_STYLES.headerCell}>Durum</TableHead>
            <TableHead className={`${TABLE_STYLES.headerCell} text-right`}>İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((role, index) => {
            const userCount = usersData.filter(u => u.role_id === role.id).length;
            return (
              <TableRow key={role.id} className={index % 2 === 0 ? TABLE_STYLES.evenRow : TABLE_STYLES.oddRow}>
                <TableCell>
                  <code className={TABLE_STYLES.code}>{role.code}</code>
                </TableCell>
                <TableCell className={TABLE_STYLES.textCell}>
                  {role.name}
                  {role.is_system && (
                    <Badge variant="outline" className="ml-2 bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                      SİSTEM
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-xs text-base text-gray-400">
                  {role.description}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 text-base">
                    {role.permissions.length} Yetki
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 text-base">
                    {userCount} Kullanıcı
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={role.is_active} disabled={role.is_system && role.code === 'ADMIN'} />
                    {role.is_active ? (
                      <Badge className={TABLE_STYLES.badgeActive}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={TABLE_STYLES.badgeInactive}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Pasif
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" className={TABLE_STYLES.buttonHover}>
                      <Edit className={TABLE_STYLES.iconEdit} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={TABLE_STYLES.buttonHover}
                      disabled={role.is_system} // Sistem rolleri silinemez
                    >
                      <Trash2 className={TABLE_STYLES.iconDelete} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}