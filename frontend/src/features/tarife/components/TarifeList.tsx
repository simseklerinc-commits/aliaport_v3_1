/**
 * TARIFE MODULE - Price List Component
 * Displays price lists with filtering and CRUD operations
 */

import React, { useState } from 'react';
import { useTarifeList, useTarifeMutations } from '../hooks/useTarife';
import type { PriceList } from '../types/tarife.types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Loader2, Search, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';

interface TarifeListProps {
  onEdit?: (tarife: PriceList) => void;
  onView?: (tarife: PriceList) => void;
  onCreate?: () => void;
}

export function TarifeList({ onEdit, onView, onCreate }: TarifeListProps) {
  const { tarifeList, isLoading, error, refetch } = useTarifeList();
  const { deleteTarife } = useTarifeMutations();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredList = tarifeList.filter((tarife) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      tarife.Kod?.toLowerCase().includes(s) ||
      tarife.Ad?.toLowerCase().includes(s) ||
      tarife.ParaBirimi?.toLowerCase().includes(s)
    );
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Bu tarife kaydını silmek istediğinizden emin misiniz?')) return;
    setDeletingId(id);
    const success = await deleteTarife(id);
    setDeletingId(null);
    if (success) refetch();
  };

  const getDurumBadge = (durum: string) => {
    if (durum === 'AKTIF') return <Badge variant="default">Aktif</Badge>;
    if (durum === 'TASLAK') return <Badge variant="secondary">Taslak</Badge>;
    return <Badge variant="outline">Pasif</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refetch}>Tekrar Dene</Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tarife Yönetimi</CardTitle>
            <CardDescription>Toplam {tarifeList.length} tarife kaydı</CardDescription>
          </div>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Tarife
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Kod, Ad veya Para Birimi ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Ad</TableHead>
                <TableHead>Para Birimi</TableHead>
                <TableHead>Versiyon</TableHead>
                <TableHead>Geçerlilik</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz tarife kaydı bulunmuyor'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((tarife) => (
                  <TableRow key={tarife.Id}>
                    <TableCell className="font-medium">{tarife.Kod}</TableCell>
                    <TableCell>{tarife.Ad}</TableCell>
                    <TableCell>{tarife.ParaBirimi}</TableCell>
                    <TableCell>{tarife.Versiyon || '1.0'}</TableCell>
                    <TableCell>
                      {tarife.GecerlilikBaslangic ? 
                        new Date(tarife.GecerlilikBaslangic).toLocaleDateString('tr-TR') : '-'}
                    </TableCell>
                    <TableCell>{getDurumBadge(tarife.Durum)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onView?.(tarife)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit?.(tarife)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tarife.Id)}
                          disabled={deletingId === tarife.Id}
                        >
                          {deletingId === tarife.Id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
