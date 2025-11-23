/**
 * BARINMA MODULE - Contract Form Component
 */

import React, { useState, useEffect } from 'react';
import { useBarinmaMutations } from '../hooks/useBarinma';
import type { BarinmaContract, BarinmaContractCreate } from '../types/barinma.types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface BarinmaFormProps {
  barinma?: BarinmaContract | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BarinmaForm({ barinma, onSuccess, onCancel }: BarinmaFormProps) {
  const { createBarinma, updateBarinma, isCreating, isUpdating } = useBarinmaMutations();
  const isEditMode = !!barinma;
  const isSubmitting = isCreating || isUpdating;

  const [formData, setFormData] = useState<BarinmaContractCreate>({
    ContractNumber: '',
    MotorbotId: 0,
    CariId: 0,
    StartDate: new Date().toISOString().split('T')[0],
    EndDate: null,
    UnitPrice: 0,
    Currency: 'TRY',
    VatRate: 20,
    BillingPeriod: 'MONTHLY',
    IsActive: true,
  });

  useEffect(() => {
    if (barinma) {
      setFormData({
        ContractNumber: barinma.ContractNumber || '',
        MotorbotId: barinma.MotorbotId || 0,
        CariId: barinma.CariId || 0,
        StartDate: barinma.StartDate || new Date().toISOString().split('T')[0],
        EndDate: barinma.EndDate || null,
        UnitPrice: barinma.UnitPrice || 0,
        Currency: barinma.Currency || 'TRY',
        VatRate: barinma.VatRate || 20,
        BillingPeriod: barinma.BillingPeriod || 'MONTHLY',
        IsActive: barinma.IsActive !== false,
      });
    }
  }, [barinma]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = isEditMode ? await updateBarinma(barinma.Id, formData) : await createBarinma(formData);
    if (success) onSuccess();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Kontrat Düzenle' : 'Yeni Barınma Kontratı'}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contractNumber">Kontrat Numarası *</Label>
            <Input
              id="contractNumber"
              value={formData.ContractNumber}
              onChange={(e) => setFormData({ ...formData, ContractNumber: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motorbotId">Motorbot ID *</Label>
            <Input
              id="motorbotId"
              type="number"
              value={formData.MotorbotId}
              onChange={(e) => setFormData({ ...formData, MotorbotId: parseInt(e.target.value) })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cariId">Cari ID *</Label>
            <Input
              id="cariId"
              type="number"
              value={formData.CariId}
              onChange={(e) => setFormData({ ...formData, CariId: parseInt(e.target.value) })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitPrice">Birim Fiyat *</Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              value={formData.UnitPrice}
              onChange={(e) => setFormData({ ...formData, UnitPrice: parseFloat(e.target.value) })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Para Birimi</Label>
            <Select
              value={formData.Currency}
              onValueChange={(value) => setFormData({ ...formData, Currency: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatRate">KDV Oranı (%)</Label>
            <Input
              id="vatRate"
              type="number"
              value={formData.VatRate}
              onChange={(e) => setFormData({ ...formData, VatRate: parseFloat(e.target.value) })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Başlangıç Tarihi</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.StartDate || ''}
              onChange={(e) => setFormData({ ...formData, StartDate: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Bitiş Tarihi</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.EndDate || ''}
              onChange={(e) => setFormData({ ...formData, EndDate: e.target.value || null })}
              disabled={isSubmitting}
            />
          </div>
        </div>

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
