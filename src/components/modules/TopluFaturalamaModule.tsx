// TOPLU FATURALAMA MODULE - Dönemsel toplu fatura yönetimi + Sefer Detayları
// Pattern: CariModule/HizmetModule standardında 3 bloklu layout
// Faturalama günleri: 7, 14, 21, 28, 30/31
// Tarihsel ve Cari bazlı filtreleme
// ✅ Her fatura için sefer detayları gösterimi
// ✅ E-Fatura modülüne yönlendirme

import { useState, useEffect, useMemo } from "react";
import { Theme } from "../ThemeSelector";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { 
  FileText, 
  Calendar,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Send,
  Users,
  TrendingUp,
  Package,
  Ship,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { 
  MotorbotSefer, 
  motorbotSeferData,
  getFaturaDonemi,
  groupSefersByPeriod
} from "../../data/motorbotSeferData";

import React from "react";

interface TopluFaturalamaModuleProps {
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  onNavigateToInvoice?: (faturaData: any) => void;
  theme: Theme;
  seferler?: MotorbotSefer[]; // ✅ Merkezi state'den gelen seferler
}

// Fatura günleri
const FATURA_GUNLERI = [7, 14, 21, 28, 30]; // 30/31 otomatik ayarlanacak

// Fatura kaydı tipi (+ Sefer detayları)
interface FaturaKayit {
  id: number;
  fatura_no: string;
  fatura_tarihi: string;
  vade_tarihi: string;
  cari_id: number;
  cari_kodu: string;
  cari_unvan: string;
  donem: string; // Örn: "2024-01" 
  fatura_gunu: number; // 7, 14, 21, 28, 30
  hizmet_kodu: string;
  hizmet_adi: string;
  tarife_kodu: string;
  miktar: number; // Sefer sayısı
  birim_fiyat: number;
  ara_toplam: number;
  kdv_orani: number;
  kdv_tutari: number;
  genel_toplam: number;
  durum: 'BEKLEMEDE' | 'KESILDI' | 'GONDERILDI' | 'ODENDI' | 'IPTAL';
  odeme_durumu: 'ODENMEDI' | 'KISMENPAID' | 'ODENDI';
  created_at: string;
  seferler: MotorbotSefer[]; // ✨ YENİ: Sefer detayları
}

// Mock data generator WITH SEFER DETAILS
const generateMockFaturalar = (allSeferler: MotorbotSefer[]): FaturaKayit[] => {
  const carilar = [
    { id: 1, kod: 'CR-001', unvan: 'Ahmet Yılmaz' },
    { id: 2, kod: 'CR-002', unvan: 'Mehmet Kaya' },
    { id: 3, kod: 'CR-003', unvan: 'Ayşe Demir' },
    { id: 4, kod: 'CR-004', unvan: 'Can Öztürk' },
    { id: 5, kod: 'CR-005', unvan: 'TCDD Liman İşletmeleri' },
  ];

  const gunler = [7, 14, 21, 28, 30];
  const aylar = ['2025-11']; // ✅ GERÇEK SEFER VERİLERİ 2025-11 AYINDA
  
  const faturalar: FaturaKayit[] = [];
  let idCounter = 1;

  aylar.forEach((donem, ayIndex) => {
    gunler.forEach((gun) => {
      carilar.forEach((cari) => {
        const faturaTarihi = `${donem}-${String(gun).padStart(2, '0')}`;
        const vadeTarihi = new Date(faturaTarihi);
        vadeTarihi.setDate(vadeTarihi.getDate() + 30);

        // Sefer aralığını hesapla
        const startDay = gun === 7 ? 1 : gun === 14 ? 8 : gun === 21 ? 15 : gun === 28 ? 22 : 29;
        const endDay = gun;
        
        // Bu dönem için seferleri filtrele (✅ GERÇEK SEFERLER)
        const periodeSefers = allSeferler.filter(sefer => {
          const seferDate = new Date(sefer.DepartureDate);
          const seferDay = seferDate.getDate();
          const seferMonth = `${seferDate.getFullYear()}-${String(seferDate.getMonth() + 1).padStart(2, '0')}`;
          
          // Cari eşleşmesi kontrol et
          const matchCari = sefer.CariCode === cari.kod;
          const matchMonth = seferMonth === donem;
          const matchDay = seferDay >= startDay && seferDay <= endDay;
          
          return matchCari && matchMonth && matchDay && sefer.Status === 'RETURNED';
        });

        const miktar = periodeSefers.length;
        const birimFiyat = gun === 7 ? 1500 : gun === 14 ? 1200 : gun === 21 ? 1800 : gun === 28 ? 1600 : 1400;
        const araToplam = miktar * birimFiyat;
        const kdvOrani = 20;
        const kdvTutari = araToplam * (kdvOrani / 100);
        const genelToplam = araToplam + kdvTutari;

        // Fatura durumu - geçmiş günler KESILDI, gelecek günler BEKLEMEDE
        let durum: FaturaKayit['durum'];
        const today = new Date();
        const faturaDate = new Date(faturaTarihi);
        
        if (faturaDate < today) {
          durum = 'KESILDI'; // Geçmiş faturalar kesilmiş
        } else {
          durum = 'BEKLEMEDE'; // Gelecek faturalar beklemede
        }

        const odemeDurumu: FaturaKayit['odeme_durumu'] = 
          durum === 'ODENDI' ? 'ODENDI' : 
          durum === 'GONDERILDI' ? 'KISMENPAID' : 'ODENMEDI';

        faturalar.push({
          id: idCounter++,
          fatura_no: `FT-${donem.replace('-', '')}-${String(gun).padStart(2, '0')}-${cari.kod}`,
          fatura_tarihi: faturaTarihi,
          vade_tarihi: vadeTarihi.toISOString().split('T')[0],
          cari_id: cari.id,
          cari_kodu: cari.kod,
          cari_unvan: cari.unvan,
          donem: donem,
          fatura_gunu: gun,
          hizmet_kodu: 'MB-SEFER-001',
          hizmet_adi: 'Motorbot Barınma Hizmeti',
          tarife_kodu: `TARIFE-${gun}`,
          miktar,
          birim_fiyat: birimFiyat,
          ara_toplam: araToplam,
          kdv_orani: kdvOrani,
          kdv_tutari: kdvTutari,
          genel_toplam: genelToplam,
          durum,
          odeme_durumu: odemeDurumu,
          created_at: faturaTarihi,
          seferler: periodeSefers, // ✨ SEFER DETAYLARI
        });
      });
    });
  });

  return faturalar.sort((a, b) => b.fatura_tarihi.localeCompare(a.fatura_tarihi));
};

export function TopluFaturalamaModule({ 
  onNavigateHome, 
  onNavigateBack, 
  onNavigateToInvoice,
  theme,
  seferler
}: TopluFaturalamaModuleProps) {
  const [faturalar, setFaturalar] = useState<FaturaKayit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Filtreler
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDonemBaslangic, setFilterDonemBaslangic] = useState('');
  const [filterDonemBitis, setFilterDonemBitis] = useState('');
  const [filterCariKodu, setFilterCariKodu] = useState('ALL');
  const [filterFaturaGunu, setFilterFaturaGunu] = useState<number | 'ALL'>('ALL');
  const [filterDurum, setFilterDurum] = useState<string>('ALL');
  const [filterOdemeDurumu, setFilterOdemeDurumu] = useState<string>('ALL');

  // Mock data yükle
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData = generateMockFaturalar(seferler || motorbotSeferData);
      
      // ✅ SADECE SEFER İÇEREN FATURALARI GÖSTER
      const validFaturalar = mockData.filter(f => f.miktar > 0);
      setFaturalar(validFaturalar);
      
      // ✅ Default dönem: 2025-11 (gerçek sefer verileri bu ayda)
      setFilterDonemBaslangic('2025-11');
      setFilterDonemBitis('2025-11');
      
      setLoading(false);
    };
    loadData();
  }, [seferler]);

  // Toggle row expansion
  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filtrelenmiş faturalar
  const filteredFaturalar = useMemo(() => {
    return faturalar.filter(f => {
      // Arama
      const matchesSearch = !searchTerm || 
        f.fatura_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cari_unvan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.cari_kodu.toLowerCase().includes(searchTerm.toLowerCase());

      // Dönem filtresi
      const matchesDonem = 
        (!filterDonemBaslangic || f.donem >= filterDonemBaslangic) &&
        (!filterDonemBitis || f.donem <= filterDonemBitis);

      // Cari filtresi
      const matchesCari = filterCariKodu === 'ALL' || f.cari_kodu === filterCariKodu;

      // Fatura günü filtresi
      const matchesGun = filterFaturaGunu === 'ALL' || f.fatura_gunu === filterFaturaGunu;

      // Durum filtresi
      const matchesDurum = filterDurum === 'ALL' || f.durum === filterDurum;

      // Ödeme durumu filtresi
      const matchesOdeme = filterOdemeDurumu === 'ALL' || f.odeme_durumu === filterOdemeDurumu;

      return matchesSearch && matchesDonem && matchesCari && matchesGun && matchesDurum && matchesOdeme;
    });
  }, [faturalar, searchTerm, filterDonemBaslangic, filterDonemBitis, filterCariKodu, filterFaturaGunu, filterDurum, filterOdemeDurumu]);

  // İstatistikler
  const stats = useMemo(() => {
    const total = filteredFaturalar.length;
    const toplamTutar = filteredFaturalar.reduce((sum, f) => sum + f.genel_toplam, 0);
    const toplamKdv = filteredFaturalar.reduce((sum, f) => sum + f.kdv_tutari, 0);
    const toplamAraToplam = filteredFaturalar.reduce((sum, f) => sum + f.ara_toplam, 0);
    const toplamSefer = filteredFaturalar.reduce((sum, f) => sum + f.miktar, 0);

    const byDurum = filteredFaturalar.reduce((acc, f) => {
      acc[f.durum] = (acc[f.durum] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byOdemeDurum = filteredFaturalar.reduce((acc, f) => {
      acc[f.odeme_durumu] = (acc[f.odeme_durumu] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCari = filteredFaturalar.reduce((acc, f) => {
      if (!acc[f.cari_kodu]) {
        acc[f.cari_kodu] = { unvan: f.cari_unvan, count: 0, tutar: 0 };
      }
      acc[f.cari_kodu].count++;
      acc[f.cari_kodu].tutar += f.genel_toplam;
      return acc;
    }, {} as Record<string, { unvan: string; count: number; tutar: number }>);

    const byGun = filteredFaturalar.reduce((acc, f) => {
      acc[f.fatura_gunu] = (acc[f.fatura_gunu] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      total,
      toplamTutar,
      toplamKdv,
      toplamAraToplam,
      toplamSefer,
      byDurum,
      byOdemeDurum,
      byCari: Object.entries(byCari).sort((a, b) => b[1].tutar - a[1].tutar),
      byGun,
      uniqueCariKodlari: Array.from(new Set(faturalar.map(f => f.cari_kodu))).sort(),
    };
  }, [filteredFaturalar, faturalar]);

  // Durum badge rengi
  const getDurumBadge = (durum: FaturaKayit['durum']) => {
    switch (durum) {
      case 'BEKLEMEDE': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'KESILDI': return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'GONDERILDI': return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
      case 'ODENDI': return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'IPTAL': return 'bg-red-500/10 border-red-500/30 text-red-400';
      default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const getOdemeBadge = (odeme: FaturaKayit['odeme_durumu']) => {
    switch (odeme) {
      case 'ODENMEDI': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'KISMENPAID': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'ODENDI': return 'bg-green-500/10 border-green-500/30 text-green-400';
      default: return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  // E-Fatura Oluşturma
  const handleCreateInvoice = (fatura: FaturaKayit) => {
    if (onNavigateToInvoice) {
      onNavigateToInvoice({
        fatura,
        seferler: fatura.seferler,
      });
    }
  };

  // Dönem aralığı hesapla (1-7, 8-14, 15-21, 22-28, 29-30/31)
  const getDonemAraligi = (gun: number) => {
    switch (gun) {
      case 7: return '1-7';
      case 14: return '8-14';
      case 21: return '15-21';
      case 28: return '22-28';
      case 30: return '29-30/31';
      default: return gun.toString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
          <p className="text-gray-400">Faturalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* ========== BLOK 1: HEADER & ÖZET İSTATİSTİKLER ========== */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Toplu Faturalama Yönetimi</h1>
                <p className="text-sm text-gray-400">
                  Dönemsel fatura kesimi ve takibi • Faturalama Günleri: 7, 14, 21, 28, 30 • Sefer Detayları
                </p>
              </div>
            </div>
            <Button onClick={onNavigateBack} variant="outline" className="border-gray-600 text-gray-300">
              Geri
            </Button>
          </div>

          {/* Özet Kartlar */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-blue-400 opacity-70" />
                <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400">
                  {stats.total}
                </Badge>
              </div>
              <p className="text-sm text-gray-400">Toplam Fatura</p>
              <p className="text-xs text-gray-500 mt-1">Filtrelenmiş kayıtlar</p>
            </div>

            <div className="bg-gray-900/50 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Ship className="w-8 h-8 text-cyan-400 opacity-70" />
              </div>
              <p className="text-sm text-gray-400">Toplam Sefer</p>
              <p className="text-lg font-mono text-cyan-400">{stats.toplamSefer}</p>
            </div>

            <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-400 opacity-70" />
              </div>
              <p className="text-sm text-gray-400">Toplam Tutar</p>
              <p className="text-lg font-mono text-green-400">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.toplamTutar)}
              </p>
            </div>

            <div className="bg-gray-900/50 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-purple-400 opacity-70" />
              </div>
              <p className="text-sm text-gray-400">Toplam KDV</p>
              <p className="text-lg font-mono text-purple-400">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(stats.toplamKdv)}
              </p>
            </div>

            <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-orange-400 opacity-70" />
              </div>
              <p className="text-sm text-gray-400">Cari Sayısı</p>
              <p className="text-lg font-mono text-orange-400">{stats.byCari.length}</p>
            </div>
          </div>
        </div>

        {/* ========== BLOK 2: FİLTRELER ========== */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-white mb-4">
            <Filter className="w-5 h-5 text-blue-400" />
            Filtreler
          </h3>

          {/* Arama */}
          <div className="mb-4">
            <Label className="text-gray-300 text-sm mb-2">Arama (Fatura No, Cari Ünvan, Cari Kodu)</Label>
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border-gray-700 text-white pl-10"
              />
            </div>
          </div>

          {/* Filtre Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Dönem Başlangıç */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Dönem Başlangıç</Label>
              <Input
                type="month"
                value={filterDonemBaslangic}
                onChange={(e) => setFilterDonemBaslangic(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Dönem Bitiş */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Dönem Bitiş</Label>
              <Input
                type="month"
                value={filterDonemBitis}
                onChange={(e) => setFilterDonemBitis(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Cari Filtresi */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Cari</Label>
              <select
                value={filterCariKodu}
                onChange={(e) => setFilterCariKodu(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              >
                <option value="ALL">Tümü</option>
                {stats.uniqueCariKodlari.map(kod => (
                  <option key={kod} value={kod}>{kod}</option>
                ))}
              </select>
            </div>

            {/* Fatura Günü */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Fatura Günü</Label>
              <select
                value={filterFaturaGunu}
                onChange={(e) => setFilterFaturaGunu(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              >
                <option value="ALL">Tümü</option>
                {FATURA_GUNLERI.map(gun => (
                  <option key={gun} value={gun}>{gun}. Gün</option>
                ))}
              </select>
            </div>

            {/* Durum */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Durum</Label>
              <select
                value={filterDurum}
                onChange={(e) => setFilterDurum(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              >
                <option value="ALL">Tümü</option>
                <option value="BEKLEMEDE">Beklemede ({stats.byDurum['BEKLEMEDE'] || 0})</option>
                <option value="KESILDI">Kesildi ({stats.byDurum['KESILDI'] || 0})</option>
                <option value="GONDERILDI">Gönderildi ({stats.byDurum['GONDERILDI'] || 0})</option>
                <option value="ODENDI">Ödendi ({stats.byDurum['ODENDI'] || 0})</option>
                <option value="IPTAL">İptal ({stats.byDurum['IPTAL'] || 0})</option>
              </select>
            </div>

            {/* Ödeme Durumu */}
            <div>
              <Label className="text-gray-300 text-sm mb-2">Ödeme Durumu</Label>
              <select
                value={filterOdemeDurumu}
                onChange={(e) => setFilterOdemeDurumu(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white"
              >
                <option value="ALL">Tümü</option>
                <option value="ODENMEDI">Ödenmedi ({stats.byOdemeDurum['ODENMEDI'] || 0})</option>
                <option value="KISMENPAID">Kısmen Ödendi ({stats.byOdemeDurum['KISMENPAID'] || 0})</option>
                <option value="ODENDI">Ödendi ({stats.byOdemeDurum['ODENDI'] || 0})</option>
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
            <Badge 
              className="cursor-pointer bg-blue-500/20 border-blue-500/30 text-blue-400"
              onClick={() => {
                setFilterDurum('ALL');
                setFilterOdemeDurumu('ALL');
              }}
            >
              Tümü ({stats.total})
            </Badge>
            <Badge 
              className="cursor-pointer bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
              onClick={() => setFilterDurum('BEKLEMEDE')}
            >
              <Clock className="w-3 h-3 mr-1" />
              Beklemede ({stats.byDurum['BEKLEMEDE'] || 0})
            </Badge>
            <Badge 
              className="cursor-pointer bg-green-500/20 border-green-500/30 text-green-400"
              onClick={() => setFilterDurum('ODENDI')}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Ödendi ({stats.byDurum['ODENDI'] || 0})
            </Badge>
          </div>
        </div>

        {/* ========== BLOK 3: FATURA LİSTESİ + SEFER DETAYLARI ========== */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-cyan-400" />
              Fatura Listesi ({filteredFaturalar.length}) - {stats.toplamSefer} Sefer
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Fatura No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Dönem</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Gün</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Cari</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Sefer Sayısı</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Birim Fiyat</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Ara Toplam</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">KDV</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Genel Toplam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Durum</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaturalar.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Fatura bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  filteredFaturalar.map((fatura) => (
                    <React.Fragment key={fatura.id}>
                      {/* Fatura Ana Satır */}
                      <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleRow(fatura.id)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {expandedRows.has(fatura.id) ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-cyan-400">{fatura.fatura_no}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(fatura.fatura_tarihi).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{fatura.donem}</td>
                        <td className="px-4 py-3">
                          <Badge className="bg-blue-500/20 border-blue-500/30 text-blue-400 text-xs">
                            {fatura.fatura_gunu}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="text-white">{fatura.cari_unvan}</div>
                          <div className="text-xs text-gray-500">{fatura.cari_kodu}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm">
                          <Badge className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400">
                            {fatura.miktar} sefer
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(fatura.birim_fiyat)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(fatura.ara_toplam)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-400">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(fatura.kdv_tutari)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm font-medium text-green-400">
                          {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(fatura.genel_toplam)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getDurumBadge(fatura.durum) + ' text-xs'}>
                            {fatura.durum}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button 
                            size="sm" 
                            onClick={() => handleCreateInvoice(fatura)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            E-Fatura Oluştur
                          </Button>
                        </td>
                      </tr>

                      {/* Sefer Detayları (Expanded Row) */}
                      {expandedRows.has(fatura.id) && (
                        <tr className="bg-gray-900/50">
                          <td colSpan={13} className="px-4 py-4">
                            <div className="bg-gray-800/50 border border-gray-700 rounded p-4">
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                <Ship className="w-4 h-4 text-cyan-400" />
                                Sefer Detayları ({fatura.seferler.length} adet)
                              </h4>
                              
                              {fatura.seferler.length === 0 ? (
                                <p className="text-sm text-gray-500">Bu dönem için sefer kaydı bulunmuyor</p>
                              ) : (
                                <div className="grid grid-cols-1 gap-2">
                                  {fatura.seferler.map((sefer) => (
                                    <div 
                                      key={sefer.Id} 
                                      className="bg-gray-900/50 border border-gray-700 rounded px-3 py-2 flex items-center justify-between"
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                                          <Ship className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-white">{sefer.MotorbotCode} - {sefer.MotorbotName}</div>
                                          <div className="text-xs text-gray-400">{sefer.MotorbotOwner}</div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-6 text-sm">
                                        <div>
                                          <span className="text-gray-400">Çıkış:</span>
                                          <span className="text-white ml-2">{sefer.DepartureDate} {sefer.DepartureTime}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400">Dönüş:</span>
                                          <span className="text-white ml-2">
                                            {sefer.ReturnDate && sefer.ReturnTime 
                                              ? `${sefer.ReturnDate} ${sefer.ReturnTime}` 
                                              : 'Beklemede'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400">Süre:</span>
                                          <span className="text-white ml-2">
                                            {sefer.Duration 
                                              ? `${Math.floor(sefer.Duration / 60)}s ${sefer.Duration % 60}dk`
                                              : '-'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-400">Tutar:</span>
                                          <span className="text-green-400 font-medium ml-2">
                                            ${sefer.TotalPrice.toFixed(2)}
                                          </span>
                                        </div>
                                        <div>
                                          {sefer.Status === 'DEPARTED' ? (
                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                                              Denizde
                                            </Badge>
                                          ) : (
                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                                              Döndü
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
              {filteredFaturalar.length > 0 && (
                <tfoot className="bg-gray-900 border-t-2 border-gray-700">
                  <tr>
                    <td colSpan={8} className="px-4 py-3 text-right font-medium">TOPLAM:</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.toplamAraToplam)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-400">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.toplamKdv)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-green-400">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.toplamTutar)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}