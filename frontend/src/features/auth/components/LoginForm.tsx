// frontend/src/features/auth/components/LoginForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(8, 'En az 8 karakter'),
});

type FormValues = z.infer<typeof schema>;

export const LoginForm: React.FC = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    await login(values);
  };

  if (isAuthenticated) {
    return <div className="p-4 text-sm text-green-600">Zaten giriş yapıldı.</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm mx-auto p-6 border rounded-md bg-white shadow-sm">
      <h2 className="text-lg font-semibold">Giriş Yap</h2>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="email">E-posta</label>
        <input
          id="email"
          type="email"
          className="border rounded px-3 py-2 text-sm"
          placeholder="kullanici@aliaport.com"
          {...register('email')}
        />
        {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="password">Şifre</label>
        <input
          id="password"
          type="password"
          className="border rounded px-3 py-2 text-sm"
          placeholder="••••••••"
          {...register('password')}
        />
        {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded py-2 text-sm font-medium"
      >
        {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>
    </form>
  );
};
