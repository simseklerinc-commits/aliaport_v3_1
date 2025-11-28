// frontend/src/features/portal/components/PortalLogin.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { usePortalAuth } from '../context/PortalAuthContext';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(1, 'Şifre zorunludur'),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export const PortalLogin: React.FC = () => {
  const { login, isLoading, isAuthenticated } = usePortalAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      window.location.hash = '#/portal/dashboard';
    }
  }, [isAuthenticated]);

  const onSubmit = async (values: FormValues) => {
    setLoginError(null);
    try {
      await login({
        username: values.email,
        password: values.password,
      });
      // navigate will be triggered by useEffect when isAuthenticated changes
    } catch (e: any) {
      setLoginError(e?.message || 'Giriş başarısız. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aliaport Portal</h1>
          <p className="text-gray-600">Firma Temsilcisi Girişi</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {loginError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-medium">Giriş Başarısız</p>
                  <p className="text-sm text-red-600 mt-1">{loginError}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  placeholder="ornek@firma.com"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`block w-full pl-10 pr-12 py-2.5 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  {...register('rememberMe')}
                />
                <span className="ml-2 text-sm text-gray-600">Beni hatırla</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                onClick={() => window.location.hash = '#/portal/forgot-password'}
              >
                Şifremi Unuttum
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-3 text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Hesabınız yok mu?{' '}
            <a href="mailto:destek@aliaport.com" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
              İletişime geçin
            </a>
          </p>
        </div>

        {/* Support Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-gray-600 text-center">
            Giriş sorunu yaşıyorsanız lütfen firma yetkilinize veya Aliaport destek ekibine başvurunuz.
          </p>
        </div>
      </div>
    </div>
  );
};
