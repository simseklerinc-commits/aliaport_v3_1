/**
 * GÜVENLİK MODÜLÜ - Kapı Kontrol
 * İş emri onayı checklist karşılaştırma
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Textarea } from '../../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  LogIn,
  LogOut,
  Camera,
  FileCheck,
  Key
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ModuleLayout } from '../../../components/layouts';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
}

interface WorkOrder {
  woNumber: string;
  cariTitle: string;
  motorbot: string;
  subject: string;
  status: 'ONAYLANDI' | 'BEKLEMEDE' | 'REDDEDILDI';
  approvedBy?: string;
  approvedAt?: string;
  checklist: ChecklistItem[];
}

export function GuvenlikModule() {
  const [woNumber, setWoNumber] = useState('');
  const [currentWO, setCurrentWO] = useState<WorkOrder | null>(null);
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);
  const [exceptionPIN, setExceptionPIN] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [entryType, setEntryType] = useState<'GIRIS' | 'CIKIS'>('GIRIS');

  // Mock iş emri verisi
  const mockWorkOrders: Record<string, WorkOrder> = {
    'WO202511-001': {
      woNumber: 'WO202511-001',
      cariTitle: 'ABC Denizcilik',
      motorbot: 'ATLAS',
      subject: 'Motor Bakımı',
      status: 'ONAYLANDI',
      approvedBy: 'Ali Yılmaz',
      approvedAt: '2025-11-22 08:00',
      checklist: [
        { id: '1', label: 'İş Emri Belgesi', required: true, checked: true },
        { id: '2', label: 'Motorbot Ruhsatı', required: true, checked: true },
        { id: '3', label: 'Sigorta Poliçesi', required: true, checked: false },
        { id: '4', label: 'Yetkili İmzası', required: true, checked: true },
        { id: '5', label: 'Malzeme Listesi', required: false, checked: false },
      ],
    },
    'WO202511-002': {
      woNumber: 'WO202511-002',
      cariTitle: 'XYZ Yat İşletmesi',
      motorbot: 'DELFİN',
      subject: 'Periyodik Bakım',
      status: 'BEKLEMEDE',
      checklist: [],
    },
  };

  const searchWorkOrder = () => {
    const wo = mockWorkOrders[woNumber];
    if (wo) {
      setCurrentWO(wo);
    } else {
      setCurrentWO(null);
      // Hata toast göster
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!currentWO) return;
    setCurrentWO({
      ...currentWO,
      checklist: currentWO.checklist.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    });
  };

  const allRequiredChecked = currentWO
    ? currentWO.checklist
        .filter((item) => item.required)
        .every((item) => item.checked)
    : false;

  const allowEntry = () => {
    console.log('Giriş izni verildi:', currentWO?.woNumber);
    // API call - gate log kaydet
    setCurrentWO(null);
    setWoNumber('');
  };

  const denyEntry = () => {
    console.log('Giriş reddedildi:', currentWO?.woNumber);
    setCurrentWO(null);
    setWoNumber('');
  };

  const handleException = () => {
    if (exceptionPIN.length === 4) {
      console.log('İstisna PIN:', exceptionPIN, 'Sebep:', exceptionReason);
      // API call - exception log kaydet
      setShowExceptionDialog(false);
      setExceptionPIN('');
      setExceptionReason('');
      allowEntry();
    }
  };

  const capturePhoto = () => {
    console.log('Fotoğraf çekiliyor...');
    // Kamera API kullan
    setShowPhotoDialog(false);
  };

  return (
    <ModuleLayout
      title="Güvenlik Kontrol"
      description="Kapı giriş/çıkış kontrol ve onay"
      icon={Shield}
    >
      <Tabs defaultValue="kontrol" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-14">
          <TabsTrigger value="kontrol" className="text-lg">
            <FileCheck className="h-5 w-5 mr-2" />
            Kontrol
          </TabsTrigger>
          <TabsTrigger value="gecmis" className="text-lg">
            <LogIn className="h-5 w-5 mr-2" />
            Geçmiş
          </TabsTrigger>
        </TabsList>

        {/* Kontrol */}
        <TabsContent value="kontrol" className="space-y-4">
          {/* Giriş Tipi Seçimi */}
          <Card>
            <CardHeader>
              <CardTitle>Giriş Tipi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => setEntryType('GIRIS')}
                  size="lg"
                  variant={entryType === 'GIRIS' ? 'default' : 'outline'}
                  className="h-16 text-lg"
                >
                  <LogIn className="h-6 w-6 mr-2" />
                  GİRİŞ
                </Button>
                <Button
                  onClick={() => setEntryType('CIKIS')}
                  size="lg"
                  variant={entryType === 'CIKIS' ? 'default' : 'outline'}
                  className="h-16 text-lg"
                >
                  <LogOut className="h-6 w-6 mr-2" />
                  ÇIKIŞ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* İş Emri Arama */}
          <Card>
            <CardHeader>
              <CardTitle>İş Emri Sorgula</CardTitle>
              <CardDescription className="text-base">
                İş emri numarasını girerek kontrol edin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="İş Emri No (örn: WO202511-001)"
                  value={woNumber}
                  onChange={(e) => setWoNumber(e.target.value.toUpperCase())}
                  className="h-14 text-lg flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && searchWorkOrder()}
                />
                <Button 
                  onClick={searchWorkOrder} 
                  size="lg" 
                  className="h-14 px-8 text-lg"
                >
                  Sorgula
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* İş Emri Detayı */}
          {currentWO && (
            <Card className={`border-2 ${
              currentWO.status === 'ONAYLANDI' 
                ? 'border-green-500' 
                : currentWO.status === 'REDDEDILDI'
                ? 'border-red-500'
                : 'border-yellow-500'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{currentWO.woNumber}</CardTitle>
                  <Badge 
                    variant={
                      currentWO.status === 'ONAYLANDI' 
                        ? 'default' 
                        : currentWO.status === 'REDDEDILDI'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="text-base px-4 py-1"
                  >
                    {currentWO.status === 'ONAYLANDI' && <CheckCircle2 className="h-4 w-4 mr-1" />}
                    {currentWO.status === 'REDDEDILDI' && <XCircle className="h-4 w-4 mr-1" />}
                    {currentWO.status === 'BEKLEMEDE' && <AlertTriangle className="h-4 w-4 mr-1" />}
                    {currentWO.status}
                  </Badge>
                </div>
                <CardDescription className="text-lg">{currentWO.subject}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bilgiler */}
                <div className="grid grid-cols-2 gap-4 text-lg">
                  <div>
                    <span className="text-muted-foreground">Müşteri:</span>
                    <p className="font-medium">{currentWO.cariTitle}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Motorbot:</span>
                    <p className="font-medium">{currentWO.motorbot}</p>
                  </div>
                  {currentWO.approvedBy && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Onaylayan:</span>
                        <p className="font-medium">{currentWO.approvedBy}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Onay Tarihi:</span>
                        <p className="font-medium">
                          {currentWO.approvedAt && new Date(currentWO.approvedAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Checklist */}
                {currentWO.status === 'ONAYLANDI' && currentWO.checklist.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-xl font-semibold">Doküman Kontrol Listesi</Label>
                    <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                      {currentWO.checklist.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={item.id}
                            checked={item.checked}
                            onCheckedChange={() => toggleChecklistItem(item.id)}
                            className="h-6 w-6"
                          />
                          <label
                            htmlFor={item.id}
                            className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                          >
                            {item.label}
                            {item.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                          {item.checked && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                    {!allRequiredChecked && (
                      <p className="text-sm text-red-500 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        * ile işaretli alanlar zorunludur
                      </p>
                    )}
                  </div>
                )}

                {/* Aksiyon Butonları */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button
                    onClick={() => setShowPhotoDialog(true)}
                    size="lg"
                    variant="outline"
                    className="h-14 text-lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Fotoğraf Çek
                  </Button>
                  {currentWO.status === 'ONAYLANDI' && allRequiredChecked ? (
                    <Button
                      onClick={allowEntry}
                      size="lg"
                      className="h-14 text-lg bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Giriş İzni Ver
                    </Button>
                  ) : (
                    <Button
                      onClick={denyEntry}
                      size="lg"
                      variant="destructive"
                      className="h-14 text-lg"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Giriş Reddet
                    </Button>
                  )}
                </div>

                {/* İstisna Butonu */}
                {currentWO.status !== 'ONAYLANDI' && (
                  <Button
                    onClick={() => setShowExceptionDialog(true)}
                    size="lg"
                    variant="outline"
                    className="w-full h-14 text-lg border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  >
                    <Key className="h-5 w-5 mr-2" />
                    İstisna İzni (PIN Gerekli)
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Geçmiş */}
        <TabsContent value="gecmis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bugünkü Giriş/Çıkış Kayıtları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mock geçmiş kayıtlar */}
                {[
                  { time: '08:15', wo: 'WO202511-001', type: 'GIRIS', motorbot: 'ATLAS' },
                  { time: '09:30', wo: 'WO202511-003', type: 'GIRIS', motorbot: 'DELFİN' },
                  { time: '11:45', wo: 'WO202511-001', type: 'CIKIS', motorbot: 'ATLAS' },
                ].map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.type === 'GIRIS' ? (
                        <LogIn className="h-6 w-6 text-green-500" />
                      ) : (
                        <LogOut className="h-6 w-6 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium text-lg">{log.wo} - {log.motorbot}</p>
                        <p className="text-sm text-muted-foreground">{log.time}</p>
                      </div>
                    </div>
                    <Badge variant={log.type === 'GIRIS' ? 'default' : 'secondary'}>
                      {log.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* İstisna PIN Dialog */}
      <AlertDialog open={showExceptionDialog} onOpenChange={setShowExceptionDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              İstisna İzni
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Bu işlem güvenlik loglarına kaydedilecektir
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="pin" className="text-lg">Yetkilendirme PIN *</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                value={exceptionPIN}
                onChange={(e) => setExceptionPIN(e.target.value)}
                className="h-14 text-center text-2xl tracking-widest"
                placeholder="****"
              />
            </div>
            <div>
              <Label htmlFor="reason" className="text-lg">İstisna Sebebi *</Label>
              <Textarea
                id="reason"
                rows={3}
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                className="text-base resize-none"
                placeholder="İstisna sebebini açıklayın..."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 text-base">İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleException}
              disabled={exceptionPIN.length !== 4 || !exceptionReason}
              className="h-12 text-base"
            >
              Onayla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fotoğraf Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Fotoğraf Çek</DialogTitle>
            <DialogDescription className="text-base">
              Giriş/çıkış belgelendirmesi için fotoğraf
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center">
            <Camera className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              Kamera erişimi için izin gerekiyor
            </p>
          </div>
          <DialogFooter>
            <Button onClick={capturePhoto} size="lg" className="w-full h-12 text-lg">
              <Camera className="h-5 w-5 mr-2" />
              Fotoğraf Çek
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
