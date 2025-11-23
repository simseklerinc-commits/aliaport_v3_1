/**
 * TARIFE MODULE - Price List Form Component
 * Form for creating and editing price lists
 */

import React, { useState, useEffect } from 'react';
import { useTarifeMutations } from '../hooks/useTarife';
import type { PriceList, PriceListCreate, PriceListUpdate } from '../types/tarife.types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface TarifeFormProps {
  tarife?: PriceList | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TarifeForm({ tarife, onSuccess, onCancel }: TarifeFormProps) {
  const { createTarife, updateTarife, isCreating, isUpdating } = useTarifeMutations();
  const isEditMode = !!tarife;
  const isSubmitting = isCreating || isUpdating;

  const [formData, setFormData] = useState<PriceListCreate>({
    Kod: '',
    Ad: '',
    ParaBirimi: 'TRY',
    Versiyon: '1.0',
    Durum: 'TASLAK',
    GecerlilikBaslangic: new Date().toISOString().split('T')[0],
    GecerlilikBitis: null,
    Aciklama: '',
  });

  useEffect(() => {
    if (tarife) {
      setFormData({
        Kod: tarife.Kod || '',
        Ad: tarife.Ad || '',
        ParaBirimi: tarife.ParaBirimi || 'TRY',
        Versiyon: tarife.Versiyon || '1.0',
        Durum: tarife.Durum || 'TASLAK',
        GecerlilikBaslangic: tarife.GecerlilikBaslangic || new Date().toISOString().split('T')[0],
        GecerlilikBitis: tarife.GecerlilikBitis || null,
        Aciklama: tarife.Aciklama || '',
      });
    }
  }, [tarife]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = isEditMode
      ? await updateTarife(tarife.Id, formData as PriceListUpdate)
      : await createTarife(formData);

    if (success) {
      onSuccess();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Tarife Düzenle' : 'Yeni Tarife'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Kod */}
          <div className="space-y-2">
            <Label htmlFor="kod">Tarife Kodu *</Label>
            <Input
              id="kod"
              value={formData.Kod}
              onChange={(e) => setFormData({ ...formData, Kod: e.target.value })}
              placeholder="ör: TRF001"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Ad */}
          <div className="space-y-2">
            <Label htmlFor="ad">Tarife Adı *</Label>
            <Input
              id="ad"
              value={formData.Ad}
              onChange={(e) => setFormData({ ...formData, Ad: e.target.value })}
              placeholder="ör: Standart Tarife"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Para Birimi */}
          <div className="space-y-2">
            <Label htmlFor="paraBirimi">Para Birimi *</Label>
            <Select
              value={formData.ParaBirimi}
              onValueChange={(value) => setFormData({ ...formData, ParaBirimi: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Versiyon */}
          <div className="space-y-2">
            <Label htmlFor="versiyon">Versiyon</Label>
            <Input
              id="versiyon"
              value={formData.Versiyon}
              onChange={(e) => setFormData({ ...formData, Versiyon: e.target.value })}
              placeholder="1.0"
              disabled={isSubmitting}
            />
          </div>

          {/* Durum */}
          <div className="space-y-2">
            <Label htmlFor="durum">Durum *</Label>
            <Select
              value={formData.Durum}
              onValueChange={(value) => setFormData({ ...formData, Durum: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TASLAK">Taslak</SelectItem>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="PASIF">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Geçerlilik Başlangıç */}
          <div className="space-y-2">
            <Label htmlFor="baslangic">Geçerlilik Başlangıç</Label>
            <Input
              id="baslangic"
              type="date"
              value={formData.GecerlilikBaslangic || ''}
              onChange={(e) => setFormData({ ...formData, GecerlilikBaslangic: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          {/* Geçerlilik Bitiş */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="bitis">Geçerlilik Bitiş</Label>
            <Input
              id="bitis"
              type="date"
              value={formData.GecerlilikBitis || ''}
              onChange={(e) => setFormData({ ...formData, GecerlilikBitis: e.target.value || null })}
              disabled={isSubmitting}
            />
          </div>

          {/* Açıklama */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="aciklama">Açıklama</Label>
            <Textarea
              id="aciklama"
              value={formData.Aciklama || ''}
              onChange={(e) => setFormData({ ...formData, Aciklama: e.target.value })}
              placeholder="Tarife hakkında notlar..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </>
  );
}
