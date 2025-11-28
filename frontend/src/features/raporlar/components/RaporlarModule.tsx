/**
 * RAPORLAR MODÜLÜ - Analytics & Business Intelligence
 * 
 * Hesap motorları, istatistikler ve raporlar
 * - Mali raporlar (Gelir-Gider, Cari, Tahsilat)
 * - Operasyonel raporlar (İş Emri, Sefer, Barınma)
 * - Personel raporlar (Çalışma saatleri, Performans)
 * - Gerçek zamanlı dashboard
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Download,
  BarChart3,
  Activity,
  PieChart,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { ModuleLayout } from '../../../components/layouts';
import { Badge } from '../../../components/ui/badge';

export function RaporlarModule() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Mock analytics data - gerçek API'den gelecek
  const kpiData = {
    total_revenue: 1250000,
    total_expenses: 875000,
    active_work_orders: 24,
    completed_work_orders: 156,
    occupancy_rate: 78,
    total_hours_worked: 3420,
  };

  const reportCategories = [
    {
      id: 'mali',
      title: 'Mali Raporlar',
      icon: DollarSign,
      color: 'text-green-600',
      reports: [
        { name: 'Gelir-Gider Raporu', description: 'Detaylı mali analiz', format: 'Excel' },
        { name: 'Cari Hesap Özeti', description: 'Borç-alacak durumu', format: 'PDF' },
        { name: 'Tahsilat Raporu', description: 'Ödeme takibi', format: 'Excel' },
        { name: 'Fatura Detayları', description: 'Faturalandırma raporu', format: 'Excel' },
      ],
    },
    {
      id: 'operasyonel',
      title: 'Operasyonel Raporlar',
      icon: TrendingUp,
      color: 'text-blue-600',
      reports: [
        { name: 'İş Emri Özeti', description: 'Durum ve performans', format: 'PDF' },
        { name: 'Sefer Raporu', description: 'Transfer detayları', format: 'Excel' },
        { name: 'Barınma Doluluk', description: 'Oda kullanım analizi', format: 'Excel' },
        { name: 'Hizmet Analizi', description: 'Hizmet tipi bazında', format: 'Excel' },
      ],
    },
    {
      id: 'personel',
      title: 'Personel Raporlar',
      icon: Users,
      color: 'text-purple-600',
      reports: [
        { name: 'Çalışma Saatleri', description: 'Saha personel takibi', format: 'Excel' },
        { name: 'İzin Raporu', description: 'İzin kullanım durumu', format: 'PDF' },
        { name: 'Performans Raporu', description: 'Verimlilik analizi', format: 'Excel' },
      ],
    },
    {
      id: 'barinma',
      title: 'Barınma Raporlar',
      icon: Calendar,
      color: 'text-orange-600',
      reports: [
        { name: 'Doluluk Oranı', description: 'Aylık doluluk analizi', format: 'Excel' },
        { name: 'Gelir Analizi', description: 'Barınma gelir raporu', format: 'Excel' },
        { name: 'Sözleşme Takibi', description: 'Kontrat durumları', format: 'PDF' },
      ],
    },
  ];

  return (
    <ModuleLayout
      title="Raporlar & Analytics"
      description="İstatistikler, analizler ve iş zekası"
      icon={BarChart3}
    >
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="dashboard" className="text-sm">
            <Activity className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="mali" className="text-sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Mali
          </TabsTrigger>
          <TabsTrigger value="operasyonel" className="text-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Operasyonel
          </TabsTrigger>
          <TabsTrigger value="personel" className="text-sm">
            <Users className="h-4 w-4 mr-2" />
            Personel
          </TabsTrigger>
          <TabsTrigger value="barinma" className="text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            Barınma
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Period Selector */}
          <div className="flex items-center justify-end">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Dönem seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Günlük</SelectItem>
                <SelectItem value="weekly">Haftalık</SelectItem>
                <SelectItem value="monthly">Aylık</SelectItem>
                <SelectItem value="yearly">Yıllık</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Toplam Gelir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ₺{kpiData.total_revenue.toLocaleString('tr-TR')}
                </p>
                <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                  +12.5% artış
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Net Kar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ₺{(kpiData.total_revenue - kpiData.total_expenses).toLocaleString('tr-TR')}
                </p>
                <Badge variant="outline" className="mt-2 text-blue-600 border-blue-600">
                  Kar Marjı: {(((kpiData.total_revenue - kpiData.total_expenses) / kpiData.total_revenue) * 100).toFixed(1)}%
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  Aktif İş Emirleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{kpiData.active_work_orders}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {kpiData.completed_work_orders} tamamlandı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Doluluk Oranı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{kpiData.occupancy_rate}%</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-600"
                    style={{ width: `${kpiData.occupancy_rate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-600" />
                  Toplam Çalışma Saati
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{kpiData.total_hours_worked}s</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ortalama: {(kpiData.total_hours_worked / 30).toFixed(0)}s/gün
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-indigo-600" />
                  Hizmet Dağılımı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bakım</span>
                    <span className="font-medium">42%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Transfer</span>
                    <span className="font-medium">35%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Barınma</span>
                    <span className="font-medium">23%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Hızlı Raporlar
              </CardTitle>
              <CardDescription>Sık kullanılan raporlar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button variant="outline" className="justify-start h-auto py-3">
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Bugünün Özeti</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Günlük operasyon</span>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3">
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">Aylık Gelir</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Mali özet</span>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3">
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Aktif İş Emirleri</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Operasyon durumu</span>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3">
                  <div className="flex flex-col items-start w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">Performans Özeti</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Analitik rapor</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Category Tabs */}
        {reportCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <category.icon className={`h-8 w-8 ${category.color}`} />
                <div>
                  <h3 className="text-xl font-bold">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.reports.length} rapor mevcut
                  </p>
                </div>
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Dönem seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Günlük</SelectItem>
                  <SelectItem value="weekly">Haftalık</SelectItem>
                  <SelectItem value="monthly">Aylık</SelectItem>
                  <SelectItem value="yearly">Yıllık</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.reports.map((report, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <Badge variant="outline">{report.format}</Badge>
                      </div>
                      <category.icon className={`h-5 w-5 ${category.color}`} />
                    </div>
                    <CardTitle className="text-base mt-2">{report.name}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="default" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Rapor Oluştur
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </ModuleLayout>
  );
}
