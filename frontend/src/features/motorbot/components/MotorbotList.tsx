/**
 * MOTORBOT MODULE - Motorbot List Component
 */

import React, { useState } from 'react';
import { useMotorbotList, useMotorbotMutations } from '../hooks/useMotorbot';
import type { Motorbot } from '../types/motorbot.types';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Pencil, Trash2, Eye, Plus, Search } from 'lucide-react';

interface MotorbotListProps {
  onEdit: (motorbot: Motorbot) => void;
  onView: (motorbot: Motorbot) => void;
  onAdd: () => void;
}

export function MotorbotList({ onEdit, onView, onAdd }: MotorbotListProps) {
  const { motorботlar, loading, error, refetch } = useMotorbotList();
  const { deleteMotorbot } = useMotorbotMutations();
  const [searchQuery, setSearchQuery] = useState('');

  const handleDelete = async (id: number, ad: string) => {
    if (window.confirm(`"${ad}" isimli motorbotu silmek istediğinizden emin misiniz?`)) {
      const success = await deleteMotorbot(id);
      if (success) {
        refetch();
      }
    }
  };

  const filteredMotorbotlar = motorботlar.filter((motorbot) => {
    const query = searchQuery.toLowerCase();
    return (
      motorbot.Ad.toLowerCase().includes(query) ||
      motorbot.MotorbotKodu.toLowerCase().includes(query) ||
      motorbot.Tip?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">Hata: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Motorbot Listesi</CardTitle>
          <Button onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Motorbot
          </Button>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Motorbot ara (ad, kod, tip)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredMotorbotlar.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz motorbot kaydı yok'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Kod</th>
                  <th className="text-left p-2">Ad</th>
                  <th className="text-left p-2">Tip</th>
                  <th className="text-left p-2">Brüt Tonaj</th>
                  <th className="text-left p-2">Boy (m)</th>
                  <th className="text-left p-2">En (m)</th>
                  <th className="text-left p-2">Yapım Yılı</th>
                  <th className="text-left p-2">Bayrak</th>
                  <th className="text-left p-2">Durum</th>
                  <th className="text-right p-2">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredMotorbotlar.map((motorbot) => (
                  <tr key={motorbot.Id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{motorbot.MotorbotKodu}</td>
                    <td className="p-2">{motorbot.Ad}</td>
                    <td className="p-2">{motorbot.Tip || '-'}</td>
                    <td className="p-2">{motorbot.BrutTonaj || '-'}</td>
                    <td className="p-2">{motorbot.Boy || '-'}</td>
                    <td className="p-2">{motorbot.En || '-'}</td>
                    <td className="p-2">{motorbot.YapimYili || '-'}</td>
                    <td className="p-2">{motorbot.BayrakUlke || '-'}</td>
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          motorbot.AktifMi !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {motorbot.AktifMi !== false ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(motorbot)}
                          title="Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(motorbot)}
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(motorbot.Id, motorbot.Ad)}
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
