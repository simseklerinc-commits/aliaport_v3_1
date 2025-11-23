import { useForm, UseFormProps } from 'react-hook-form';
import { z, ZodTypeAny } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Generic Zod + React Hook Form adapter
export function useZodForm<TSchema extends ZodTypeAny>(schema: TSchema, options?: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'>) {
  return useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    ...options
  });
}
