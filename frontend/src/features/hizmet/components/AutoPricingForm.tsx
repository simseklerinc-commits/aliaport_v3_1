/**
 * AUTO PRICING FORM
 * Otomatik Fiyat Hesaplama Formu
 * 
 * Özellikler:
 *  - Hizmet seçimi (ID veya Kod ile)
 *  - 6 Hesaplama Tipi desteği (FIXED, PER_UNIT, X_SECONDARY, PER_BLOCK, BASE_PLUS_INCREMENT, VEHICLE_4H_RULE)
 *  - Dinamik parametre alanları (hesaplama tipine göre)
 *  - Tarif listesi override (geçerlilik tarihi bazlı)
 *  - Hesaplama sonucu görüntüleme (fiyat + formül + breakdown)
 *  - Real-time validation
 * 
 * Backend endpoint:
 *  - POST /api/hizmet/calculate-price
 */

import { useState, useEffect, useMemo } from 'react';
import { Loader } from '../../../shared/ui/Loader';
import { ErrorMessage } from '../../../shared/ui/ErrorMessage';
import type { PriceCalculationRequest, PriceCalculationResponse, CalculationType } from '../types/hizmet.types';
import { hizmetApi } from '../api/hizmetApi';
import { useHizmetList } from '../hooks/useHizmet';
import {
  CalculatorIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const CALCULATION_TYPES: { value: CalculationType; label: string; description: string }[] = [
  {
    value: 'FIXED' as CalculationType,
    label: 'Sabit Fiyat (FIXED)',
    description: 'Sabit ücret - parametre gerektirmez',
  },
  {
    value: 'PER_UNIT' as CalculationType,
    label: 'Birim Başına (PER_UNIT)',
    description: 'Kişi sayısı x birim fiyat',
  },
  {
    value: 'X_SECONDARY' as CalculationType,
    label: 'İkincil Çarpan (X_SECONDARY)',
    description: 'Oran x GT x Kişi sayısı (GT gemiler için)',
  },
  {
    value: 'PER_BLOCK' as CalculationType,
    label: 'Blok Başına (PER_BLOCK)',
    description: 'Blok başına fiyat x blok sayısı',
  },
  {
    value: 'BASE_PLUS_INCREMENT' as CalculationType,
    label: 'Baz + Artış (BASE_PLUS_INCREMENT)',
    description: 'Baz fiyat + (eşik üzeri x artış oranı)',
  },
  {
    value: 'VEHICLE_4H_RULE' as CalculationType,
    label: 'Araç 4 Saat Kuralı (VEHICLE_4H_RULE)',
    description: 'İlk 4 saat baz, sonrası dakika başı',
  },
];

export function AutoPricingForm() {
  const { hizmetList, isLoading: isLoadingHizmet, error: errorHizmet } = useHizmetList();
  
  const [formData, setFormData] = useState<PriceCalculationRequest>({
    hizmet_id: 0,
    effective_date: new Date().toISOString().split('T')[0], // Today's date
  });

  const [selectedCalcType, setSelectedCalcType] = useState<CalculationType | ''>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<PriceCalculationResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get selected hizmet details
  const selectedHizmet = useMemo(() => {
    return hizmetList.find(h => h.Id === formData.hizmet_id);
  }, [hizmetList, formData.hizmet_id]);

  // Update calc type when hizmet changes
  useEffect(() => {
    if (selectedHizmet?.CalculationType) {
      setSelectedCalcType(selectedHizmet.CalculationType as CalculationType);
    }
  }, [selectedHizmet]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.hizmet_id || formData.hizmet_id <= 0) {
      newErrors.hizmet_id = 'Hizmet seçimi zorunludur';
    }
    
    if (!selectedCalcType) {
      newErrors.calculation_type = 'Hesaplama tipi seçimi zorunludur';
    }
    
    // Type-specific validations
    if (selectedCalcType === 'PER_UNIT' || selectedCalcType === 'X_SECONDARY') {
      if (!formData.person_count || formData.person_count <= 0) {
        newErrors.person_count = 'Kişi sayısı zorunludur';
      }
    }
    
    if (selectedCalcType === 'X_SECONDARY') {
      if (!formData.multiplier_x || formData.multiplier_x <= 0) {
        newErrors.multiplier_x = 'Çarpan (X) zorunludur';
      }
      if (!formData.weight_tons || formData.weight_tons <= 0) {
        newErrors.weight_tons = 'GT (Ton) zorunludur';
      }
    }
    
    if (selectedCalcType === 'PER_BLOCK') {
      if (!formData.quantity || formData.quantity <= 0) {
        newErrors.quantity = 'Miktar zorunludur';
      }
      if (!formData.block_size || formData.block_size <= 0) {
        newErrors.block_size = 'Blok boyutu zorunludur';
      }
    }
    
    if (selectedCalcType === 'BASE_PLUS_INCREMENT') {
      if (!formData.quantity || formData.quantity <= 0) {
        newErrors.quantity = 'Miktar (örn: GT) zorunludur';
      }
      if (!formData.base_threshold || formData.base_threshold <= 0) {
        newErrors.base_threshold = 'Baz eşik zorunludur';
      }
    }
    
    if (selectedCalcType === 'VEHICLE_4H_RULE') {
      if (!formData.duration_minutes || formData.duration_minutes <= 0) {
        newErrors.duration_minutes = 'Süre (dakika) zorunludur';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof PriceCalculationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsCalculating(true);
    setResult(null);
    
    try {
      const response = await hizmetApi.calculatePrice(formData);
      setResult(response);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Fiyat hesaplanırken hata oluştu' });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setFormData({
      hizmet_id: 0,
      effective_date: new Date().toISOString().split('T')[0],
    });
    setSelectedCalcType('');
    setResult(null);
    setErrors({});
  };

  if (isLoadingHizmet) return <Loader message="Hizmet listesi yükleniyor..." />;
  if (errorHizmet) return <ErrorMessage message={errorHizmet} />;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="bg-green-600 text-white p-4 rounded-full">
            <CalculatorIcon className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Otomatik Fiyat Hesaplama</h1>
            <p className="text-gray-600">6 Hesaplama Tipi - Tarif Listesi Override Desteği</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            {/* Hizmet Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">Hizmet Seçimi *</label>
              <select
                value={formData.hizmet_id || ''}
                onChange={(e) => handleChange('hizmet_id', parseInt(e.target.value) || 0)}
                className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                  errors.hizmet_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Hizmet Seçiniz</option>
                {hizmetList.map(h => (
                  <option key={h.Id} value={h.Id}>
                    {h.Kod} - {h.Ad} ({h.Fiyat} {h.ParaBirimi})
                  </option>
                ))}
              </select>
              {errors.hizmet_id && <p className="text-red-500 text-sm mt-1">{errors.hizmet_id}</p>}
              
              {selectedHizmet && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Hesaplama Tipi:</strong> {selectedHizmet.CalculationType || 'Belirtilmemiş'}
                  </p>
                  {selectedHizmet.FormulaParams && (
                    <p className="text-xs text-blue-700 mt-1">
                      <strong>Formül Parametreleri:</strong> {JSON.stringify(selectedHizmet.FormulaParams)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Calculation Type Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">Hesaplama Tipi *</label>
              <select
                value={selectedCalcType}
                onChange={(e) => setSelectedCalcType(e.target.value as CalculationType)}
                className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                  errors.calculation_type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Hesaplama Tipi Seçiniz</option>
                {CALCULATION_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>
                    {ct.label}
                  </option>
                ))}
              </select>
              {errors.calculation_type && <p className="text-red-500 text-sm mt-1">{errors.calculation_type}</p>}
              
              {selectedCalcType && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <InformationCircleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    {CALCULATION_TYPES.find(ct => ct.value === selectedCalcType)?.description}
                  </p>
                </div>
              )}
            </div>

            {/* Effective Date */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Geçerlilik Tarihi (Tarif Listesi Override)
              </label>
              <input
                type="date"
                value={formData.effective_date || ''}
                onChange={(e) => handleChange('effective_date', e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Belirtilen tarihte geçerli tarif listesi varsa, o fiyat kullanılır.
              </p>
            </div>

            {/* Dynamic Parameters */}
            {selectedCalcType && (
              <div className="space-y-4 border-t-2 border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900">Hesaplama Parametreleri</h3>
                
                {/* PER_UNIT, X_SECONDARY: person_count */}
                {(selectedCalcType === 'PER_UNIT' || selectedCalcType === 'X_SECONDARY') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kişi Sayısı *</label>
                    <input
                      type="number"
                      value={formData.person_count || ''}
                      onChange={(e) => handleChange('person_count', parseInt(e.target.value) || undefined)}
                      className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                        errors.person_count ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Örn: 3"
                    />
                    {errors.person_count && <p className="text-red-500 text-sm mt-1">{errors.person_count}</p>}
                  </div>
                )}
                
                {/* X_SECONDARY: multiplier_x, weight_tons */}
                {selectedCalcType === 'X_SECONDARY' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Çarpan (X) *</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.multiplier_x || ''}
                        onChange={(e) => handleChange('multiplier_x', parseFloat(e.target.value) || undefined)}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                          errors.multiplier_x ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Örn: 0.03"
                      />
                      {errors.multiplier_x && <p className="text-red-500 text-sm mt-1">{errors.multiplier_x}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GT (Ton) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.weight_tons || ''}
                        onChange={(e) => handleChange('weight_tons', parseFloat(e.target.value) || undefined)}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                          errors.weight_tons ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Örn: 500"
                      />
                      {errors.weight_tons && <p className="text-red-500 text-sm mt-1">{errors.weight_tons}</p>}
                    </div>
                  </>
                )}
                
                {/* PER_BLOCK: quantity, block_size, multiplier_x */}
                {selectedCalcType === 'PER_BLOCK' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Toplam Miktar *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.quantity || ''}
                        onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || undefined)}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                          errors.quantity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Örn: 45"
                      />
                      {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Blok Boyutu *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.block_size || ''}
                        onChange={(e) => handleChange('block_size', parseFloat(e.target.value) || undefined)}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                          errors.block_size ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Örn: 30"
                      />
                      {errors.block_size && <p className="text-red-500 text-sm mt-1">{errors.block_size}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Çarpan (Opsiyonel)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.multiplier_x || ''}
                        onChange={(e) => handleChange('multiplier_x', parseFloat(e.target.value) || undefined)}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg"
                        placeholder="Örn: 5"
                      />
                    </div>
                  </>
                )}
                
                {/* BASE_PLUS_INCREMENT: quantity, base_threshold */}
                {selectedCalcType === 'BASE_PLUS_INCREMENT' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Miktar (örn: GT) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.quantity || ''}
                        onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || undefined)}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                          errors.quantity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Örn: 5000"
                      />
                      {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Baz Eşik *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.base_threshold || ''}
                        onChange={(e) => handleChange('base_threshold', parseFloat(e.target.value) || undefined)}
                        className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                          errors.base_threshold ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Örn: 1000"
                      />
                      {errors.base_threshold && <p className="text-red-500 text-sm mt-1">{errors.base_threshold}</p>}
                    </div>
                  </>
                )}
                
                {/* VEHICLE_4H_RULE: duration_minutes */}
                {selectedCalcType === 'VEHICLE_4H_RULE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Süre (Dakika) *</label>
                    <input
                      type="number"
                      value={formData.duration_minutes || ''}
                      onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || undefined)}
                      className={`w-full px-4 py-3 text-lg border-2 rounded-lg ${
                        errors.duration_minutes ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Örn: 450 (7.5 saat)"
                    />
                    {errors.duration_minutes && <p className="text-red-500 text-sm mt-1">{errors.duration_minutes}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      İlk 4 saat (240 dk) baz ücret, sonrası dakika başı ek ücret hesaplanır.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={isCalculating}
                className="flex-1 bg-green-600 text-white px-6 py-4 text-xl font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
              >
                {isCalculating ? (
                  <>
                    <Loader message="" />
                    Hesaplanıyor...
                  </>
                ) : (
                  <>
                    <CalculatorIcon className="w-7 h-7" />
                    Fiyat Hesapla
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Sıfırla
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Result */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
            Hesaplama Sonucu
          </h2>
          
          {result ? (
            <div className="space-y-6">
              {/* Price */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                <p className="text-sm text-green-600 mb-2">Hesaplanan Fiyat</p>
                <p className="text-6xl font-bold text-green-700">
                  {result.calculated_price.toFixed(2)} <span className="text-3xl">{result.currency}</span>
                </p>
                
                {result.tarife_override_applied && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="text-sm font-semibold">Tarif Listesi Override Uygulandı</span>
                  </div>
                )}
              </div>

              {/* Formula */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-semibold mb-2">Kullanılan Formül:</p>
                <p className="text-lg font-mono text-blue-900 bg-white px-3 py-2 rounded border border-blue-200">
                  {result.formula_used}
                </p>
              </div>

              {/* Breakdown */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-semibold mb-3">Hesaplama Detayı:</p>
                <div className="space-y-2">
                  {Object.entries(result.breakdown).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center bg-white px-3 py-2 rounded border border-gray-200">
                      <span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-sm font-semibold text-gray-900">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Hesaplama Tipi:</strong> {result.calculation_type}</p>
                {result.effective_date && (
                  <p><strong>Geçerlilik Tarihi:</strong> {new Date(result.effective_date).toLocaleDateString('tr-TR')}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CalculatorIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Hesaplama sonucu burada görüntülenecek
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Sol taraftaki formu doldurup "Fiyat Hesapla" butonuna tıklayın
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
