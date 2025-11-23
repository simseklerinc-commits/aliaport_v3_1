/**
 * RAPORLAR MODÜLÜ
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { FileText, TrendingUp, DollarSign, Users, Calendar, Download, BarChart3 } from 'lucide-react';
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

export function RaporlarModule() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const reportCategories = [
    {
      id: 'mali',
      title: 'Mali Raporlar',
      icon: DollarSign,
      reports: ['Gelir-Gider Raporu', 'Cari Hesap Özeti', 'Tahsilat Raporu'],
    },
    {
      id: 'operasyonel',
      title: 'Operasyonel Raporlar',
      icon: TrendingUp,
      reports: ['İş Emri Özeti', 'Sefer Raporu', 'Barınma Doluluk Raporu'],
    },
    {
      id: 'personel',
      title: 'Personel Raporlar',
      icon: Users,
      reports: ['Çalışma Saatleri', 'İzin Raporu', 'Performans Raporu'],
    },
    {
      id: 'barinma',
      title: 'Barınma Raporlar',
      icon: Calendar,
      reports: ['Doluluk Oranı', 'Gelir Analizi', 'Sözleşme Takibi'],
    },
  ];

  return (
    <ModuleLayout
      title="Raporlar"
      description="İstatistikler, analizler ve raporlar"
      icon={BarChart3}
    >
      <div className="flex items-center justify-end mb-6">
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

      <Tabs defaultValue="mali" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mali">Mali</TabsTrigger>
          <TabsTrigger value="operasyonel">Operasyonel</TabsTrigger>
          <TabsTrigger value="personel">Personel</TabsTrigger>
          <TabsTrigger value="barinma">Barınma</TabsTrigger>
        </TabsList>

        {reportCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {category.reports.map((reportName, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <category.icon className="h-6 w-6 text-primary" />
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-base">{reportName}</CardTitle>
                    <CardDescription>
                      {selectedPeriod === 'daily' && 'Günlük'}
                      {selectedPeriod === 'weekly' && 'Haftalık'}
                      {selectedPeriod === 'monthly' && 'Aylık'}
                      {selectedPeriod === 'yearly' && 'Yıllık'} rapor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
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

      <Card>
        <CardHeader>
          <CardTitle>Hızlı Raporlar</CardTitle>
          <CardDescription>Sık kullanılan raporlar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" className="justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Bugünün Özeti
            </Button>
            <Button variant="outline" className="justify-start">
              <DollarSign className="h-4 w-4 mr-2" />
              Aylık Gelir
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Aktif İş Emirleri
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performans Özeti
            </Button>
          </div>
        </CardContent>
      </Card>
    </ModuleLayout>
  );
}
