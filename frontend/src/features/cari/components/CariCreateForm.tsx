import React from 'react';
import { useZodForm } from '../../../core/validation/hooks/useZodForm';
import { cariCreateSchema, CariCreateFormValues } from '../../../core/validation/schemas/cariSchema';
import { FormField, TextInput, SelectInput } from '../../../shared/ui/FormField';

interface CariCreateFormProps {
  onSubmit: (values: CariCreateFormValues) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
}

export const CariCreateForm: React.FC<CariCreateFormProps> = ({ onSubmit, loading, error }) => {
  const form = useZodForm(cariCreateSchema);
  const { register, handleSubmit, formState: { errors, isValid } } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Cari Kod" name="CariKod" error={errors.CariKod} required>
        <TextInput type="text" {...register('CariKod')} error={errors.CariKod} />
      </FormField>
      
      <FormField label="Unvan" name="Unvan" error={errors.Unvan} required>
        <TextInput type="text" {...register('Unvan')} error={errors.Unvan} />
      </FormField>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Cari Tip" name="CariTip" error={errors.CariTip} required>
          <SelectInput
            {...register('CariTip')}
            error={errors.CariTip}
            options={[
              { value: 'GERCEK', label: 'Gerçek' },
              { value: 'TUZEL', label: 'Tüzel' }
            ]}
            placeholder="Seçin"
            defaultValue=""
          />
        </FormField>
        
        <FormField label="Rol" name="Rol" error={errors.Rol} required>
          <SelectInput
            {...register('Rol')}
            error={errors.Rol}
            options={[
              { value: 'MUSTERI', label: 'Müşteri' },
              { value: 'TEDARIKCI', label: 'Tedarikçi' },
              { value: 'DIGER', label: 'Diğer' }
            ]}
            placeholder="Seçin"
            defaultValue=""
          />
        </FormField>
      </div>
      
      <FormField label="E-posta" name="Eposta" error={errors.Eposta}>
        <TextInput type="email" {...register('Eposta')} error={errors.Eposta} />
      </FormField>
      
      <div className="flex items-center gap-2">
        <button type="submit" disabled={!isValid || loading} className="btn btn-primary">
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </form>
  );
};

export default CariCreateForm;
