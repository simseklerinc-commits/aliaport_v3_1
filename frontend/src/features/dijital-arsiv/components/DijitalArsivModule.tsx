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
import { ModuleLayout } from '../../../components/layouts';

export function DijitalArsivModule() {
  const categories = [
    {
      id: 'firma-belge',
      title: 'Firma Belgeleri',
      description: 'Firma ile ilgili belgeler ve evraklar',
      icon: Building2,
      count: 0,
    },
    {
      id: 'personel-belge',
      title: 'Firma Personel Belgeleri',
      description: 'Personel evrakları ve belgeler',
      icon: Users,
      count: 0,
    },
    {
      id: 'arac-belge',
      title: 'Firma Araç Belgeleri',
      description: 'Araç evrakları ve ruhsatlar',
      icon: Car,
      count: 0,
    },
    {
      id: 'motorbot-belge',
      title: 'Firma Motorbot Belgeleri',
      description: 'Motorbot evrakları ve belgeler',
      icon: Anchor,
      count: 0,
    },
  ];

  return (
    <ModuleLayout
      title="Dijital Arşiv"
      description="Belge ve evrak yönetim sistemi"
      icon={Archive}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <category.icon className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-muted-foreground">
                  {category.count}
                </span>
              </div>
              <CardTitle className="text-lg">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Belgeleri Görüntüle
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Yüklenen Belgeler</CardTitle>
          <CardDescription>Yakın zamanda sisteme eklenen belgeler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Henüz belge bulunmuyor
          </div>
        </CardContent>
      </Card>
    </ModuleLayout>
  );
}
