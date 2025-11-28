/**
 * DİJİTAL ARŞİV MODÜLÜ
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { FileText, Building2, Users, Car, Anchor, Archive } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ModuleLayout } from '../../../components/layouts';
import { DocumentListModern } from './DocumentListModern';

export function DijitalArsivModule() {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const categories = [
    {
      id: 'WORK_ORDER',
      title: 'İş Emri Belgeleri',
      description: 'İş emirlerine ait belgeler',
      icon: FileText,
    },
    {
      id: 'EMPLOYEE',
      title: 'Personel Belgeleri',
      description: 'Personel evrakları ve belgeler',
      icon: Users,
    },
    {
      id: 'VEHICLE',
      title: 'Araç Belgeleri',
      description: 'Araç evrakları ve ruhsatlar',
      icon: Car,
    },
    {
      id: 'MOTORBOT',
      title: 'Motorbot Belgeleri',
      description: 'Motorbot evrakları ve belgeler',
      icon: Anchor,
    },
    {
      id: 'CARI',
      title: 'Cari Belgeleri',
      description: 'Cari firma belgeleri',
      icon: Building2,
    },
    {
      id: 'GENERAL',
      title: 'Genel Belgeler',
      description: 'Diğer belgeler',
      icon: Archive,
    },
  ];

  return (
    <ModuleLayout
      title="Dijital Arşiv"
      description="Belge ve evrak yönetim sistemi"
      icon={Archive}
    >
      <Tabs defaultValue="belgeler" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="belgeler" className="text-base">
            <FileText className="h-5 w-5 mr-2" />
            Tüm Belgeler
          </TabsTrigger>
          <TabsTrigger value="kategoriler" className="text-base">
            <Archive className="h-5 w-5 mr-2" />
            Kategoriler
          </TabsTrigger>
        </TabsList>

        {/* Tüm Belgeler - Modern Liste */}
        <TabsContent value="belgeler">
          <DocumentListModern category={selectedCategory} />
        </TabsContent>

        {/* Kategoriler - VisitPro Style Sekmeli Görünüm */}
        <TabsContent value="kategoriler" className="space-y-4">
          {/* Kategori Sekmeleri */}
          <Tabs defaultValue="all" onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Tümü
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <category.icon className="h-4 w-4" />
                  {category.title}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <DocumentListModern />
            </TabsContent>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-6">
                <div className="mb-4 flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <category.icon className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <DocumentListModern category={category.id} />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}
