/**
 * CARI MODULE - Cari List Component
 * Backend schema'ya uyumlu liste
 */

import React, { useState } from 'react';
import { useCariList, useCariMutations } from '../hooks/useCari';
import type { Cari } from '../types/cari.types';
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

interface CariListProps {
  onEdit?: (cari: Cari) => void;
  onView?: (cari: Cari) => void;
  onCreate?: () => void;
}

export function CariList({ onEdit, onView, onCreate }: CariListProps) {
  const { cariList, isLoading, error, refetch } = useCariList();
  const { deleteCari } = useCariMutations();
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredCariList = cariList.filter((cari) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      cari.CariKod.toLowerCase().includes(s) ||
      cari.Unvan.toLowerCase().includes(s) ||
      cari.VergiNo?.toLowerCase().includes(s) ||
      cari.Telefon?.toLowerCase().includes(s)
    );
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Bu cari kaydını silmek istediğinizden emin misiniz?')) return;
    setDeletingId(id);
    const success = await deleteCari(id);
    setDeletingId(null);
    if (success) refetch();
  };

  const getCariTipBadge = (tip: string) => {
    if (tip === 'MUSTERI') return <Badge>Müşteri</Badge>;
    if (tip === 'TEDARIKCI') return <Badge variant="secondary">Tedarikçi</Badge>;
    return <Badge variant="outline">Her İkisi</Badge>;
  };

  const getRolBadge = (rol: string) => {
    if (rol === 'VIP') return <Badge className="bg-purple-500">VIP</Badge>;
    if (rol === 'KURUMSAL') return <Badge className="bg-blue-500">Kurumsal</Badge>;
    return <Badge variant="outline">Normal</Badge>;
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
            <CardTitle>Cari Yönetimi</CardTitle>
            <CardDescription>Toplam {cariList.length} cari kaydı</CardDescription>
          </div>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Cari
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Kod, Ünvan, Vergi No veya Telefon ile ara..."
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
                <TableHead>Ünvan</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Vergi No</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCariList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz cari kaydı bulunmuyor'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCariList.map((cari) => (
                  <TableRow key={cari.Id}>
                    <TableCell className="font-medium">{cari.CariKod}</TableCell>
                    <TableCell>{cari.Unvan}</TableCell>
                    <TableCell>{getCariTipBadge(cari.CariTip)}</TableCell>
                    <TableCell>{getRolBadge(cari.Rol)}</TableCell>
                    <TableCell>{cari.VergiNo || '-'}</TableCell>
                    <TableCell>{cari.Telefon || '-'}</TableCell>
                    <TableCell>
                      {cari.AktifMi !== false ? (
                        <Badge variant="default">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Pasif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onView?.(cari)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEdit?.(cari)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cari.Id)}
                          disabled={deletingId === cari.Id}
                        >
                          {deletingId === cari.Id ? (
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
