/**
 * BARINMA MODULE - Accommodation Contract List Component
 */

import React, { useState } from 'react';
import { useBarinmaList, useBarinmaMutations } from '../hooks/useBarinma';
import type { BarinmaContract } from '../types/barinma.types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Loader2, Search, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';

interface BarinmaListProps {
  onEdit?: (barinma: BarinmaContract) => void;
  onView?: (barinma: BarinmaContract) => void;
  onCreate?: () => void;
}

export function BarinmaList({ onEdit, onView, onCreate }: BarinmaListProps) {
  const { barinmaList, isLoading, error, refetch } = useBarinmaList();
  const { deleteBarinma } = useBarinmaMutations();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredList = barinmaList.filter((item) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return item.ContractNumber?.toLowerCase().includes(s);
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Bu kontratı silmek istediğinizden emin misiniz?')) return;
    setDeletingId(id);
    const success = await deleteBarinma(id);
    setDeletingId(null);
    if (success) refetch();
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
            <CardTitle>Barınma Kontratları</CardTitle>
            <CardDescription>Toplam {barinmaList.length} kontrat</CardDescription>
          </div>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kontrat
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Kontrat numarası ile ara..."
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
                <TableHead>Kontrat No</TableHead>
                <TableHead>Motorbot</TableHead>
                <TableHead>Cari</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Birim Fiyat</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz kontrat bulunmuyor'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((item) => (
                  <TableRow key={item.Id}>
                    <TableCell className="font-medium">{item.ContractNumber}</TableCell>
                    <TableCell>{item.MotorbotId}</TableCell>
                    <TableCell>{item.CariId}</TableCell>
                    <TableCell>{item.StartDate ? new Date(item.StartDate).toLocaleDateString('tr-TR') : '-'}</TableCell>
                    <TableCell>{item.EndDate ? new Date(item.EndDate).toLocaleDateString('tr-TR') : '-'}</TableCell>
                    <TableCell>{item.UnitPrice} {item.Currency}</TableCell>
                    <TableCell>
                      {item.IsActive ? <Badge variant="default">Aktif</Badge> : <Badge variant="secondary">Pasif</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onView?.(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit?.(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.Id)}
                          disabled={deletingId === item.Id}
                        >
                          {deletingId === item.Id ? (
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
