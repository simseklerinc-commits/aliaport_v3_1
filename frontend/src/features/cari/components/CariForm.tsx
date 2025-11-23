/**
 * CARI MODULE - Cari Form Component
 * Backend schema'ya tam uyumlu
 */

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCariMutations } from '../hooks/useCari';
import type { Cari, CariCreate, CariUpdate } from '../types/cari.types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Loader2, Save, X } from 'lucide-react';
import { Switch } from '../../../components/ui/switch';

interface CariFormProps {
  cari?: Cari | null;
  onSuccess?: (cari: Cari) => void;
  onCancel?: () => void;
}

type FormData = CariCreate & { AktifMi?: boolean };

export function CariForm({ cari, onSuccess, onCancel }: CariFormProps) {
  const { createCari, updateCari, isCreating, isUpdating } = useCariMutations();
  const isEditMode = !!cari;
  const isSubmitting = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      CariKod: '',
      Unvan: '',
      CariTip: 'MUSTERI',
      Rol: 'NORMAL',
      ParaBirimi: 'TRY',
      Ulke: 'Türkiye',
      VadeGun: 0,
      AktifMi: true,
    },
  });

  const aktifMi = watch('AktifMi');
  const cariTip = watch('CariTip');
  const rol = watch('Rol');
  const paraBirimi = watch('ParaBirimi');

  useEffect(() => {
    if (cari) {
      reset({
        ...cari,
        AktifMi: cari.AktifMi !== false,
      });
    }
  }, [cari, reset]);

  const onSubmit = async (data: FormData) => {
    let result: Cari | null = null;

    if (isEditMode && cari) {
      result = await updateCari(cari.Id, data as CariUpdate);
    } else {
      const { AktifMi, ...createData } = data;
      result = await createCari(createData as CariCreate);
    }

    if (result) {
      onSuccess?.(result);
      if (!isEditMode) reset();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Cari Düzenle' : 'Yeni Cari'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Cari bilgilerini güncelleyin' : 'Yeni cari kaydı oluşturun'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cariKod">Cari Kodu <span className="text-destructive">*</span></Label>
              <Input id="cariKod" {...register('CariKod', { required: 'Zorunlu' })} disabled={isEditMode} />
              {errors.CariKod && <p className="text-sm text-destructive">{errors.CariKod.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unvan">Ünvan <span className="text-destructive">*</span></Label>
              <Input id="unvan" {...register('Unvan', { required: 'Zorunlu' })} />
              {errors.Unvan && <p className="text-sm text-destructive">{errors.Unvan.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cari Tipi <span className="text-destructive">*</span></Label>
              <Select value={cariTip} onValueChange={(v) => setValue('CariTip', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MUSTERI">Müşteri</SelectItem>
                  <SelectItem value="TEDARIKCI">Tedarikçi</SelectItem>
                  <SelectItem value="HER_IKISI">Her İkisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rol <span className="text-destructive">*</span></Label>
              <Select value={rol} onValueChange={(v) => setValue('Rol', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="KURUMSAL">Kurumsal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vergiDairesi">Vergi Dairesi</Label>
              <Input id="vergiDairesi" {...register('VergiDairesi')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vergiNo">Vergi No</Label>
              <Input id="vergiNo" {...register('VergiNo')} maxLength={10} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ulke">Ülke</Label>
              <Input id="ulke" {...register('Ulke')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="il">İl</Label>
              <Input id="il" {...register('Il')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ilce">İlçe</Label>
              <Input id="ilce" {...register('Ilce')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adres">Adres</Label>
            <Textarea id="adres" {...register('Adres')} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefon">Telefon</Label>
              <Input id="telefon" {...register('Telefon')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eposta">E-posta</Label>
              <Input id="eposta" type="email" {...register('Eposta')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iletisimKisi">İletişim Kişisi</Label>
            <Input id="iletisimKisi" {...register('IletisimKisi')} placeholder="İletişim kurulan kişinin adı" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vadeGun">Vade Gün</Label>
              <Input id="vadeGun" type="number" {...register('VadeGun', { valueAsNumber: true })} min="0" />
            </div>
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select value={paraBirimi} onValueChange={(v) => setValue('ParaBirimi', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" {...register('Iban')} maxLength={32} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notlar">Notlar</Label>
            <Textarea 
              id="notlar" 
              {...register('Notlar')} 
              placeholder="Cari ile ilgili genel notlar, özel durumlar..." 
              rows={3}
            />
          </div>

          {isEditMode && (
            <div className="flex items-center space-x-2">
              <Switch id="aktifMi" checked={aktifMi} onCheckedChange={(c) => setValue('AktifMi', c)} />
              <Label htmlFor="aktifMi">Aktif</Label>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isEditMode ? 'Güncelle' : 'Kaydet'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
