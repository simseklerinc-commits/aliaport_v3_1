/**
 * HIZMET MODULE - Hizmet Form Component
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useHizmetMutations } from '../hooks/useHizmet';
import type { Hizmet, HizmetCreate, HizmetUpdate } from '../types/hizmet.types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';

interface HizmetFormProps {
  hizmet?: Hizmet | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function HizmetForm({ hizmet, onSuccess, onCancel }: HizmetFormProps) {
  const { createHizmet, updateHizmet, loading } = useHizmetMutations();
  const isEditMode = !!hizmet;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HizmetCreate | HizmetUpdate>({
    defaultValues: hizmet
      ? {
          Kod: hizmet.Kod,
          Ad: hizmet.Ad,
          Aciklama: hizmet.Aciklama,
          MuhasebeKodu: hizmet.MuhasebeKodu,
          GrupKod: hizmet.GrupKod,
          Birim: hizmet.Birim,
          Fiyat: hizmet.Fiyat,
          ParaBirimi: hizmet.ParaBirimi || 'TRY',
          KdvOrani: hizmet.KdvOrani,
          AktifMi: hizmet.AktifMi !== false,
        }
      : {
          Kod: '',
          Ad: '',
          ParaBirimi: 'TRY',
          AktifMi: true,
        },
  });

  useEffect(() => {
    if (hizmet) {
      reset({
        Kod: hizmet.Kod,
        Ad: hizmet.Ad,
        Aciklama: hizmet.Aciklama,
        MuhasebeKodu: hizmet.MuhasebeKodu,
        GrupKod: hizmet.GrupKod,
        Birim: hizmet.Birim,
        Fiyat: hizmet.Fiyat,
        ParaBirimi: hizmet.ParaBirimi || 'TRY',
        KdvOrani: hizmet.KdvOrani,
        AktifMi: hizmet.AktifMi !== false,
      });
    }
  }, [hizmet, reset]);

  const onSubmit = async (data: HizmetCreate | HizmetUpdate) => {
    let success = false;

    if (isEditMode && hizmet) {
      const result = await updateHizmet(hizmet.Id, data);
      success = !!result;
    } else {
      const result = await createHizmet(data as HizmetCreate);
      success = !!result;
    }

    if (success) {
      onSuccess();
    }
  };

  const aktifMi = watch('AktifMi');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Temel Bilgiler */}
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Kod">
                Hizmet Kodu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="Kod"
                {...register('Kod', {
                  required: 'Hizmet kodu zorunludur',
                  maxLength: { value: 50, message: 'Maksimum 50 karakter' },
                })}
                disabled={isEditMode}
                placeholder="HZ001"
              />
              {errors.Kod && (
                <p className="text-sm text-destructive">{errors.Kod.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="Ad">
                Hizmet Adı <span className="text-destructive">*</span>
              </Label>
              <Input
                id="Ad"
                {...register('Ad', {
                  required: 'Hizmet adı zorunludur',
                  maxLength: { value: 200, message: 'Maksimum 200 karakter' },
                })}
                placeholder="Hizmet Adı"
              />
              {errors.Ad && <p className="text-sm text-destructive">{errors.Ad.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="Aciklama">Açıklama</Label>
            <Textarea
              id="Aciklama"
              {...register('Aciklama')}
              placeholder="Hizmet açıklaması..."
              rows={3}
            />
          </div>

          {isEditMode && (
            <div className="flex items-center space-x-2">
              <Switch
                id="AktifMi"
                checked={aktifMi !== false}
                onCheckedChange={(checked) => setValue('AktifMi', checked)}
              />
              <Label htmlFor="AktifMi">Aktif</Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sınıflandırma */}
      <Card>
        <CardHeader>
          <CardTitle>Sınıflandırma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="GrupKod">Grup Kodu</Label>
              <Input
                id="GrupKod"
                {...register('GrupKod', {
                  maxLength: { value: 50, message: 'Maksimum 50 karakter' },
                })}
                placeholder="BARINMA, SEFER, vb."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="MuhasebeKodu">Muhasebe Kodu</Label>
              <Input
                id="MuhasebeKodu"
                {...register('MuhasebeKodu', {
                  maxLength: { value: 50, message: 'Maksimum 50 karakter' },
                })}
                placeholder="600.01.001"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiyatlandırma */}
      <Card>
        <CardHeader>
          <CardTitle>Fiyatlandırma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Fiyat">Birim Fiyat</Label>
              <Input
                id="Fiyat"
                type="number"
                step="0.01"
                {...register('Fiyat', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ParaBirimi">Para Birimi</Label>
              <Select
                value={watch('ParaBirimi')}
                onValueChange={(value) => setValue('ParaBirimi', value)}
              >
                <SelectTrigger id="ParaBirimi">
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

            <div className="space-y-2">
              <Label htmlFor="KdvOrani">KDV Oranı (%)</Label>
              <Input
                id="KdvOrani"
                type="number"
                step="0.01"
                {...register('KdvOrani', { valueAsNumber: true })}
                placeholder="20.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="Birim">Birim</Label>
            <Input
              id="Birim"
              {...register('Birim', {
                maxLength: { value: 20, message: 'Maksimum 20 karakter' },
              })}
              placeholder="Adet, Saat, Gün, Metre, vb."
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          İptal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}
