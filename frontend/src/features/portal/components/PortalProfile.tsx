/**
 * PORTAL PROFIL SAYFASI
 * Kullanıcı bilgileri görüntüleme ve şifre değiştirme
 * 
 * RUNBOOK REF: ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART2
 * API: POST /api/portal/auth/change-password
 */

import React, { useState, useEffect } from 'react';
import { usePortalAuth } from '../context/PortalAuthContext';
import { portalTokenStorage } from '../utils/portalTokenStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Building2,
  Phone,
  Calendar,
  Shield,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface ProfileData {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  position?: string;
  is_admin: boolean;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at?: string;
  login_count: number;
  created_at?: string;
  cari_id: number;
  cari_code?: string;
  cari_unvan?: string;
  cari_telefon?: string;
  cari_email?: string;
}

export function PortalProfile() {
  const { user, logout } = usePortalAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Şifre değiştirme form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Profil verilerini yükle
  useEffect(() => {
    const fetchProfileData = async () => {
      const token = portalTokenStorage.getToken();
      if (!token) {
        console.warn('Token bulunamadı');
        setIsLoadingProfile(false);
        return;
      }

      try {
        console.log('Profil verisi çekiliyor...', { token: token.substring(0, 20) + '...' });
        const response = await axios.get(`${API_BASE_URL}/api/v1/portal/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Profil API response:', response.data);
        setProfileData(response.data);
      } catch (error: any) {
        console.error('Profil yükleneme hatası:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        toast.error(error.response?.data?.detail || 'Profil bilgileri yüklenemedi');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, []);

  if (isLoadingProfile) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-lg text-muted-foreground">Profil yüklen iyor...</p>
        </div>
      </div>
    );
  }

  if (!user || !profileData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">Kullanıcı bilgisi bulunamadı</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Şifre validasyonu
  const validatePassword = (password: string): string => {
    if (password.length < 8) {
      return 'Şifre en az 8 karakter olmalıdır';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Şifre en az bir büyük harf içermelidir';
    }
    if (!/[a-z]/.test(password)) {
      return 'Şifre en az bir küçük harf içermelidir';
    }
    if (!/[0-9]/.test(password)) {
      return 'Şifre en az bir rakam içermelidir';
    }
    return '';
  };

  // Şifre değiştirme
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setPasswordErrors({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    // Validation
    let hasError = false;

    if (!passwordForm.oldPassword) {
      setPasswordErrors((prev) => ({ ...prev, oldPassword: 'Mevcut şifre gereklidir' }));
      hasError = true;
    }

    const newPasswordError = validatePassword(passwordForm.newPassword);
    if (newPasswordError) {
      setPasswordErrors((prev) => ({ ...prev, newPassword: newPasswordError }));
      hasError = true;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors((prev) => ({ ...prev, confirmPassword: 'Şifreler eşleşmiyor' }));
      hasError = true;
    }

    if (passwordForm.oldPassword === passwordForm.newPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        newPassword: 'Yeni şifre mevcut şifreden farklı olmalıdır',
      }));
      hasError = true;
    }

    if (hasError) {
      toast.error('Lütfen hataları düzeltin');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = portalTokenStorage.getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/portal/auth/change-password`,
        {
          old_password: passwordForm.oldPassword,
          new_password: passwordForm.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      toast.success('Şifreniz başarıyla değiştirildi!');

      // Form reset
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Kullanıcıyı logout et (güvenlik)
      setTimeout(() => {
        toast.info('Yeni şifrenizle tekrar giriş yapın');
        logout();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message);
      if (error.message.includes('Mevcut şifre hatalı')) {
        setPasswordErrors((prev) => ({ ...prev, oldPassword: 'Mevcut şifre hatalı' }));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Profil Ayarları</h1>
        <p className="text-gray-600 mt-2">Hesap bilgilerinizi görüntüleyin ve şifrenizi değiştirin</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="profile" className="text-base">
            <User className="h-4 w-4 mr-2" />
            Profil Bilgileri
          </TabsTrigger>
          <TabsTrigger value="password" className="text-base">
            <Key className="h-4 w-4 mr-2" />
            Şifre Değiştir
          </TabsTrigger>
        </TabsList>

        {/* Profil Bilgileri */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Kişisel Bilgiler
              </CardTitle>
              <CardDescription>Hesap ve iletişim bilgileriniz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm text-muted-foreground">Ad Soyad</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{profileData.full_name}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">E-posta</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{profileData.email}</p>
                  </div>
                </div>

                {profileData.phone && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Telefon</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{profileData.phone}</p>
                    </div>
                  </div>
                )}

                {profileData.position && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Pozisyon</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{profileData.position}</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Hesap Durumu</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {profileData.is_active ? (
                      <Badge className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pasif
                      </Badge>
                    )}
                  </div>
                </div>

                {profileData.created_at && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Kayıt Tarihi</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {new Date(profileData.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                )}

                {profileData.last_login_at && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Son Giriş</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {new Date(profileData.last_login_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Toplam Giriş</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium">{profileData.login_count} kez</p>
                  </div>
                </div>

                {profileData.is_admin && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Yetki</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-purple-100 text-purple-700">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Şirket Bilgileri
              </CardTitle>
              <CardDescription>Bağlı olduğunuz şirket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm text-muted-foreground">Şirket Ünvanı</Label>
                  <p className="font-medium mt-1">{profileData.cari_unvan || '-'}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Cari Kodu</Label>
                  <p className="font-medium mt-1">{profileData.cari_code || '-'}</p>
                </div>

                {profileData.cari_email && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Şirket E-posta</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{profileData.cari_email}</p>
                    </div>
                  </div>
                )}

                {profileData.cari_telefon && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Şirket Telefon</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{profileData.cari_telefon}</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Cari ID</Label>
                  <p className="font-medium mt-1">#{profileData.cari_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Şifre Değiştirme */}
        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Şifre Değiştir
              </CardTitle>
              <CardDescription>
                Güvenliğiniz için güçlü bir şifre seçin (en az 8 karakter, büyük/küçük harf ve rakam)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Mevcut Şifre */}
                <div>
                  <Label htmlFor="oldPassword">
                    Mevcut Şifre <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? 'text' : 'password'}
                      value={passwordForm.oldPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                      }
                      className={`pr-10 ${passwordErrors.oldPassword ? 'border-red-300' : ''}`}
                      placeholder="Mevcut şifrenizi girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.oldPassword && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {passwordErrors.oldPassword}
                    </p>
                  )}
                </div>

                {/* Yeni Şifre */}
                <div>
                  <Label htmlFor="newPassword">
                    Yeni Şifre <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      className={`pr-10 ${passwordErrors.newPassword ? 'border-red-300' : ''}`}
                      placeholder="Yeni şifrenizi girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {passwordErrors.newPassword}
                    </p>
                  )}
                  {passwordForm.newPassword && !passwordErrors.newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {passwordForm.newPassword.length >= 8 ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
                          En az 8 karakter
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {/[A-Z]/.test(passwordForm.newPassword) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                          En az bir büyük harf
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {/[a-z]/.test(passwordForm.newPassword) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                          En az bir küçük harf
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {/[0-9]/.test(passwordForm.newPassword) ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                        <span className={/[0-9]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-muted-foreground'}>
                          En az bir rakam
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Şifre Tekrarı */}
                <div>
                  <Label htmlFor="confirmPassword">
                    Yeni Şifre (Tekrar) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      className={`pr-10 ${passwordErrors.confirmPassword ? 'border-red-300' : ''}`}
                      placeholder="Yeni şifrenizi tekrar girin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                  {passwordForm.confirmPassword &&
                    passwordForm.newPassword === passwordForm.confirmPassword && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Şifreler eşleşiyor
                      </p>
                    )}
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isChangingPassword}
                    size="lg"
                    className="w-full"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Değiştiriliyor...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Şifreyi Değiştir
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-yellow-800">
                      <p className="font-medium">Güvenlik Bildirimi</p>
                      <p className="mt-1">
                        Şifrenizi değiştirdikten sonra güvenlik nedeniyle oturumunuz kapatılacak
                        ve yeni şifrenizle tekrar giriş yapmanız gerekecektir.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
