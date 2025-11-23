/**
 * PARAMETRELER FEATURE - Main Module Component
 */

import React, { useState } from 'react';
import { useParametrelerList, useParametrelerMutations } from '../hooks/useParametreler';
import type { Parametre } from '../types/parametreler.types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { 
  Loader2, 
  Search, 
  Plus, 
  Settings,
  ChevronRight,
  ArrowLeft,
  Ruler,
  DollarSign,
  Calculator,
  ShieldCheck,
  FolderTree,
  Tag,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';

// Kategori ikonu mapping
const CATEGORY_ICONS: Record<string, any> = {
  'BIRIM': Ruler,
  'PARA_BIRIMI': DollarSign,
  'KDV_ORANI': Calculator,
  'KDV_ISTISNA': ShieldCheck,
  'HIZMET_GRUBU': FolderTree,
  'HIZMET_KATEGORI': Tag,
  'FIYATLANDIRMA_KURALI': TrendingUp,
};

// Kategori renk tema
const CATEGORY_THEMES: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  'BIRIM': { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  'PARA_BIRIMI': { color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  'KDV_ORANI': { color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  'KDV_ISTISNA': { color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  'HIZMET_GRUBU': { color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  'HIZMET_KATEGORI': { color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
  'FIYATLANDIRMA_KURALI': { color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
  'CARI_TIP': { color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' },
  'CARI_ROL': { color: 'text-teal-400', bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500/30' },
  'MOTORBOT_DURUM': { color: 'text-sky-400', bgColor: 'bg-sky-500/10', borderColor: 'border-sky-500/30' },
  'SEFER_DURUM': { color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/30' },
  'IS_EMRI_TIP': { color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' },
  'IS_EMRI_ONCELIK': { color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/10', borderColor: 'border-fuchsia-500/30' },
  'SISTEM': { color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' },
};

// Kategori açıklamaları
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'BIRIM': 'Ölçü birimleri tanımları',
  'PARA_BIRIMI': 'Para birimi ve döviz tanımları',
  'KDV_ORANI': 'KDV oran tanımları',
  'KDV_ISTISNA': 'KDV istisna ve muafiyet tanımları',
  'HIZMET_GRUBU': 'Ana grup sınıflandırması',
  'HIZMET_KATEGORI': 'Hizmet kategori tanımları',
  'FIYATLANDIRMA_KURALI': 'Fiyatlandırma hesaplama kuralları',
  'CARI_TIP': 'Cari hesap tipleri',
  'CARI_ROL': 'Cari hesap rolleri',
  'MOTORBOT_DURUM': 'Motorbot durum tanımları',
  'SEFER_DURUM': 'Sefer durum tanımları',
  'IS_EMRI_TIP': 'İş emri tip tanımları',
  'IS_EMRI_ONCELIK': 'İş emri öncelik seviyeleri',
  'SISTEM': 'Sistem yapılandırma parametreleri',
};

export function ParametrelerModule() {
  const { parametrelerList, isLoading, error, refetch } = useParametrelerList();
  const { toggleActive } = useParametrelerMutations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Kategoriye göre gruplama
  const groupedParams = parametrelerList.reduce((acc, param) => {
    const category = param.Kategori || 'Diğer';
    if (!acc[category]) acc[category] = [];
    acc[category].push(param);
    return acc;
  }, {} as Record<string, Parametre[]>);

  // Kategori istatistikleri
  const categoryStats = Object.entries(groupedParams).map(([kategori, params]) => {
    const Icon = CATEGORY_ICONS[kategori] || Tag;
    const theme = CATEGORY_THEMES[kategori] || CATEGORY_THEMES['SISTEM'];
    const description = CATEGORY_DESCRIPTIONS[kategori] || 'Parametre tanımları';
    
    return {
      id: kategori,
      name: kategori.replace(/_/g, ' '),
      description,
      icon: Icon,
      count: params.length,
      activeCount: params.filter(p => p.AktifMi !== false).length,
      ...theme
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const handleToggleActive = async (id: number) => {
    const success = await toggleActive(id);
    if (success) refetch();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refetch}>Tekrar Dene</Button>
          </div>
        </div>
      </div>
    );
  }

  // Ana menü - Kategori kartları
  if (!selectedCategory) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Sistem Parametreleri
          </h1>
          <p className="text-muted-foreground">
            Merkezi parametre tanımlamaları ve yönetim - Detay için bir kategori seçin
          </p>
        </div>

        {/* Grid - Kategori Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryStats.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="border hover:border-primary/50 transition-all cursor-pointer group"
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-4 rounded-lg ${category.bgColor}`}>
                        <Icon className={`w-8 h-8 ${category.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                          {category.name}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`flex items-center justify-between p-4 rounded-lg ${category.bgColor} border ${category.borderColor}`}>
                    <span className="text-base text-muted-foreground">Toplam Kayıt</span>
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

  // Detay sayfası - Seçili kategorinin parametreleri
  const categoryData = categoryStats.find(c => c.id === selectedCategory);
  const filteredParams = (groupedParams[selectedCategory] || []).filter(param => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      param.Kod?.toLowerCase().includes(s) ||
      param.Ad?.toLowerCase().includes(s) ||
      param.Deger?.toLowerCase().includes(s) ||
      param.Aciklama?.toLowerCase().includes(s)
    );
  });

  const Icon = categoryData?.icon || Tag;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory(null);
              setSearchTerm('');
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl flex items-center gap-3">
              <Icon className={`w-6 h-6 ${categoryData?.color}`} />
              {categoryData?.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{categoryData?.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ekle
          </Button>
        </div>
      </div>

      {/* Detay Tablo */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Kod</TableHead>
                  <TableHead>Ad</TableHead>
                  <TableHead>Değer</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParams.map((param, index) => (
                  <TableRow key={param.Id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {param.Kod}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{param.Ad}</TableCell>
                    <TableCell>{param.Deger}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-md">
                      {param.Aciklama || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={param.AktifMi !== false}
                          onCheckedChange={() => handleToggleActive(param.Id)}
                        />
                        {param.AktifMi !== false ? (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="w-4 h-4 mr-1" />
                            Pasif
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4 text-blue-400" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
