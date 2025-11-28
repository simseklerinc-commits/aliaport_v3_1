/**
 * HİZMET SEÇİMİ VE FİYAT HESAPLAMA COMPONENT
 * 
 * Özellikler:
 * - Hizmet dropdown (aktif hizmetler)
 * - CalculationType'a göre dynamic form alanları
 * - Otomatik fiyat hesaplama (/calculate-price API)
 * - Fiyat breakdown gösterimi
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { DollarSign, Calculator, Info } from 'lucide-react';
import axios from 'axios';

interface Hizmet {
  Id: number;
  Kod: string;
  Ad: string;
  CalculationType: string;
  Fiyat: number;
  ParaBirimi: string;
  Birim: string;
}

interface PriceCalculation {
  service_code: string;
  service_name: string;
  base_price: number;
  base_currency: string;
  converted_price: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  calculation_details: string;
  breakdown: Record<string, any>;
  exchange_rate?: number;
}

interface ServicePricingProps {
  onServiceSelect?: (hizmetId: number, price: number) => void;
  workOrderId?: number;
}

const CALCULATION_TYPE_LABELS: Record<string, string> = {
  FIXED: 'Sabit Ücret',
  PER_UNIT: 'Birim Başına',
  X_SECONDARY: 'Çarpan × İkincil Değer',
  PER_BLOCK: 'Blok Bazlı',
  BASE_PLUS_INCREMENT: 'Baz + Artış',
  VEHICLE_4H_RULE: 'Araç 4 Saat Kuralı',
};

export function ServicePricing({ onServiceSelect, workOrderId }: ServicePricingProps) {
  const [hizmetler, setHizmetler] = useState<Hizmet[]>([]);
  const [selectedHizmet, setSelectedHizmet] = useState<Hizmet | null>(null);
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Form fields based on PriceCalculationRequest
  const [quantity, setQuantity] = useState<number>(1);
  const [weight, setWeight] = useState<number>(0);
  const [days, setDays] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [hours, setHours] = useState<number>(0);
  const [grt, setGrt] = useState<number>(0);
  const [sqMeter, setSqMeter] = useState<number>(0);

  // Load hizmetler
  useEffect(() => {
    loadHizmetler();
  }, []);

  const loadHizmetler = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/hizmet/', {
        params: { is_active: true, page_size: 100 },
      });
      setHizmetler(response.data.data.items || []);
    } catch (error) {
      console.error('Hizmet listesi yüklenemedi:', error);
    }
  };

  const handleHizmetSelect = (hizmetId: string) => {
    const hizmet = hizmetler.find((h) => h.Id === parseInt(hizmetId));
    setSelectedHizmet(hizmet || null);
    setCalculation(null);
    
    // Reset form fields
    setQuantity(1);
    setWeight(0);
    setDays(0);
    setMinutes(0);
    setHours(0);
    setGrt(0);
    setSqMeter(0);
  };

  const calculatePrice = async () => {
    if (!selectedHizmet) return;

    setIsCalculating(true);

    try {
      const payload: any = {
        service_code: selectedHizmet.Kod,
        quantity: quantity > 0 ? quantity : undefined,
        weight: weight > 0 ? weight : undefined,
        days: days > 0 ? days : undefined,
        minutes: minutes > 0 ? minutes : undefined,
        hours: hours > 0 ? hours : undefined,
        grt: grt > 0 ? grt : undefined,
        sqmeter: sqMeter > 0 ? sqMeter : undefined,
      };

      const response = await axios.post(
        'http://localhost:8000/api/work-order/calculate-price',
        payload
      );

      const result = response.data.data as PriceCalculation;
      setCalculation(result);
      onServiceSelect?.(selectedHizmet.Id, result.grand_total);
    } catch (error: any) {
      console.error('Fiyat hesaplama hatası:', error);
      alert(error.response?.data?.detail || 'Fiyat hesaplanamadı');
    } finally {
      setIsCalculating(false);
    }
  };

  const renderCalculationFields = () => {
    if (!selectedHizmet) return null;

    const calcType = selectedHizmet.CalculationType;

    return (
      <div className="space-y-3">
        {/* Quantity - Her hesaplama tipi için */}
        <div className="space-y-2">
          <Label htmlFor="quantity">Miktar (Adet)</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Weight */}
        {(calcType === 'PER_UNIT' || calcType === 'X_SECONDARY') && (
          <div className="space-y-2">
            <Label htmlFor="weight">Ağırlık (KG)</Label>
            <Input
              id="weight"
              type="number"
              min="0"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        {/* Days */}
        {calcType === 'X_SECONDARY' && (
          <div className="space-y-2">
            <Label htmlFor="days">Gün Sayısı</Label>
            <Input
              id="days"
              type="number"
              min="0"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 0)}
            />
          </div>
        )}

        {/* Minutes */}
        {(calcType === 'PER_BLOCK' || calcType === 'VEHICLE_4H_RULE') && (
          <div className="space-y-2">
            <Label htmlFor="minutes">Süre (Dakika)</Label>
            <Input
              id="minutes"
              type="number"
              min="0"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
            />
            {calcType === 'VEHICLE_4H_RULE' && (
              <p className="text-xs text-muted-foreground">
                İlk 4 saat (240 dk) ücretsiz
              </p>
            )}
          </div>
        )}

        {/* Hours */}
        {calcType === 'BASE_PLUS_INCREMENT' && (
          <div className="space-y-2">
            <Label htmlFor="hours">Saat</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        {/* GRT */}
        <div className="space-y-2">
          <Label htmlFor="grt">GRT (Gross Registered Tonnage)</Label>
          <Input
            id="grt"
            type="number"
            min="0"
            step="0.01"
            value={grt}
            onChange={(e) => setGrt(parseFloat(e.target.value) || 0)}
          />
        </div>

        {/* Square Meter */}
        <div className="space-y-2">
          <Label htmlFor="sqMeter">Metrekare</Label>
          <Input
            id="sqMeter"
            type="number"
            min="0"
            step="0.01"
            value={sqMeter}
            onChange={(e) => setSqMeter(parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Hizmet Seçimi ve Fiyatlandırma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hizmet Seçimi */}
        <div className="space-y-2">
          <Label htmlFor="hizmet">Hizmet *</Label>
          <Select
            value={selectedHizmet?.Id.toString() || ''}
            onValueChange={handleHizmetSelect}
          >
            <SelectTrigger>
              <SelectValue placeholder="Hizmet seçiniz..." />
            </SelectTrigger>
            <SelectContent>
              {hizmetler.map((hizmet) => (
                <SelectItem key={hizmet.Id} value={hizmet.Id.toString()}>
                  {hizmet.Kod} - {hizmet.Ad} ({hizmet.Fiyat} {hizmet.ParaBirimi})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedHizmet && (
          <>
            {/* Hesaplama Tipi Badge */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Hesaplama Tipi: {CALCULATION_TYPE_LABELS[selectedHizmet.CalculationType] || selectedHizmet.CalculationType}
                </p>
                <p className="text-xs text-blue-700">
                  Baz Fiyat: {selectedHizmet.Fiyat} {selectedHizmet.ParaBirimi}
                </p>
              </div>
            </div>

            {/* Dynamic Calculation Fields */}
            {renderCalculationFields()}

            {/* Hesapla Button */}
            <Button
              className="w-full"
              onClick={calculatePrice}
              disabled={isCalculating}
            >
              <Calculator className="h-4 w-4 mr-2" />
              {isCalculating ? 'Hesaplanıyor...' : 'Fiyat Hesapla'}
            </Button>

            {/* Calculation Result */}
            {calculation && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">Baz Fiyat:</span>
                    <span className="font-medium text-green-900">
                      {calculation.base_price.toFixed(2)} {calculation.base_currency}
                    </span>
                  </div>
                  
                  {calculation.exchange_rate && calculation.base_currency !== 'TRY' && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Kur:</span>
                      <span className="font-medium text-green-900">
                        1 {calculation.base_currency} = {calculation.exchange_rate.toFixed(2)} TRY
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">TRY Fiyat:</span>
                    <span className="font-medium text-green-900">
                      {calculation.converted_price.toFixed(2)} TRY
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">KDV ({calculation.vat_rate}%):</span>
                    <span className="font-medium text-green-900">
                      {calculation.vat_amount.toFixed(2)} TRY
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-green-300">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-green-900">
                      KDV Dahil Toplam:
                    </span>
                    <span className="text-2xl font-bold text-green-700">
                      {calculation.grand_total.toFixed(2)} TRY
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-green-200">
                  <p className="text-xs text-green-700">
                    {calculation.calculation_details}
                  </p>

                  {/* Breakdown */}
                  <details className="mt-2">
                    <summary className="text-xs text-green-700 cursor-pointer hover:underline">
                      Hesaplama Detayları
                    </summary>
                    <pre className="text-xs mt-2 p-2 bg-white rounded border border-green-200 overflow-x-auto">
                      {JSON.stringify(calculation.breakdown, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
