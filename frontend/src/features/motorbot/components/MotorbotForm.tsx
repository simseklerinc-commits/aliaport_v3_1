/**
 * MOTORBOT MODULE - Motorbot Form Component
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMotorbotMutations } from '../hooks/useMotorbot';
import type { Motorbot, MotorbotCreate, MotorbotUpdate } from '../types/motorbot.types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Switch } from '../../../components/ui/switch';

interface MotorbotFormProps {
  motorbot?: Motorbot | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MotorbotForm({ motorbot, onSuccess, onCancel }: MotorbotFormProps) {
  const { createMotorbot, updateMotorbot, loading } = useMotorbotMutations();
  const isEditMode = !!motorbot;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MotorbotCreate | MotorbotUpdate>({
    defaultValues: motorbot
      ? {
          MotorbotKodu: motorbot.MotorbotKodu,
          Ad: motorbot.Ad,
          Tip: motorbot.Tip,
          BrutTonaj: motorbot.BrutTonaj,
          NetTonaj: motorbot.NetTonaj,
          Boy: motorbot.Boy,
          En: motorbot.En,
          CekisDerisi: motorbot.CekisDerisi,
          YapimYili: motorbot.YapimYili,
          BayrakUlke: motorbot.BayrakUlke,
          LimanSicilNo: motorbot.LimanSicilNo,
          IMO_No: motorbot.IMO_No,
          GT: motorbot.GT,
          DWT: motorbot.DWT,
          AktifMi: motorbot.AktifMi !== false,
        }
      : {
          MotorbotKodu: '',
          Ad: '',
          Tip: '',
          AktifMi: true,
        },
  });

  useEffect(() => {
    if (motorbot) {
      reset({
        MotorbotKodu: motorbot.MotorbotKodu,
        Ad: motorbot.Ad,
        Tip: motorbot.Tip,
        BrutTonaj: motorbot.BrutTonaj,
        NetTonaj: motorbot.NetTonaj,
        Boy: motorbot.Boy,
        En: motorbot.En,
        CekisDerisi: motorbot.CekisDerisi,
        YapimYili: motorbot.YapimYili,
        BayrakUlke: motorbot.BayrakUlke,
        LimanSicilNo: motorbot.LimanSicilNo,
        IMO_No: motorbot.IMO_No,
        GT: motorbot.GT,
        DWT: motorbot.DWT,
        AktifMi: motorbot.AktifMi !== false,
      });
    }
  }, [motorbot, reset]);

  const onSubmit = async (data: MotorbotCreate | MotorbotUpdate) => {
    let success = false;

    if (isEditMode && motorbot) {
      const result = await updateMotorbot(motorbot.Id, data);
      success = !!result;
    } else {
      const result = await createMotorbot(data as MotorbotCreate);
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
              <Label htmlFor="MotorbotKodu">
                Motorbot Kodu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="MotorbotKodu"
                {...register('MotorbotKodu', {
                  required: 'Motorbot kodu zorunludur',
                  maxLength: { value: 20, message: 'Maksimum 20 karakter' },
                })}
                disabled={isEditMode}
                placeholder="MB001"
              />
              {errors.MotorbotKodu && (
                <p className="text-sm text-destructive">{errors.MotorbotKodu.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="Ad">
                Ad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="Ad"
                {...register('Ad', {
                  required: 'Ad zorunludur',
                  maxLength: { value: 100, message: 'Maksimum 100 karakter' },
                })}
                placeholder="Motorbot Adı"
              />
              {errors.Ad && <p className="text-sm text-destructive">{errors.Ad.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="Tip">
              Tip <span className="text-destructive">*</span>
            </Label>
            <Input
              id="Tip"
              {...register('Tip', {
                required: 'Tip zorunludur',
                maxLength: { value: 50, message: 'Maksimum 50 karakter' },
              })}
              placeholder="Kargo Gemisi, Tanker, vb."
            />
            {errors.Tip && <p className="text-sm text-destructive">{errors.Tip.message}</p>}
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

      {/* Teknik Özellikler */}
      <Card>
        <CardHeader>
          <CardTitle>Teknik Özellikler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="BrutTonaj">Brüt Tonaj</Label>
              <Input
                id="BrutTonaj"
                type="number"
                step="0.01"
                {...register('BrutTonaj', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="NetTonaj">Net Tonaj</Label>
              <Input
                id="NetTonaj"
                type="number"
                step="0.01"
                {...register('NetTonaj', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="Boy">Boy (m)</Label>
              <Input
                id="Boy"
                type="number"
                step="0.01"
                {...register('Boy', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="En">En (m)</Label>
              <Input
                id="En"
                type="number"
                step="0.01"
                {...register('En', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="CekisDerisi">Çekiş Derisi (m)</Label>
              <Input
                id="CekisDerisi"
                type="number"
                step="0.01"
                {...register('CekisDerisi', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="GT">GT (Gross Tonnage)</Label>
              <Input
                id="GT"
                type="number"
                step="0.01"
                {...register('GT', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="DWT">DWT (Deadweight Tonnage)</Label>
              <Input
                id="DWT"
                type="number"
                step="0.01"
                {...register('DWT', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sicil Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle>Sicil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="YapimYili">Yapım Yılı</Label>
              <Input
                id="YapimYili"
                type="number"
                {...register('YapimYili', { valueAsNumber: true })}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="BayrakUlke">Bayrak Ülke</Label>
              <Input
                id="BayrakUlke"
                {...register('BayrakUlke', {
                  maxLength: { value: 50, message: 'Maksimum 50 karakter' },
                })}
                placeholder="Türkiye"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="LimanSicilNo">Liman Sicil No</Label>
              <Input
                id="LimanSicilNo"
                {...register('LimanSicilNo', {
                  maxLength: { value: 20, message: 'Maksimum 20 karakter' },
                })}
                placeholder="LSN001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="IMO_No">IMO No</Label>
              <Input
                id="IMO_No"
                {...register('IMO_No', {
                  maxLength: { value: 20, message: 'Maksimum 20 karakter' },
                })}
                placeholder="IMO1234567"
              />
            </div>
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
