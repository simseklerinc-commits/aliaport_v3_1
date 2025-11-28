/**
 * GÜVENLİK MODÜLÜ - Kapı Kontrol
 * İş emri onayı checklist karşılaştırma + WorkOrderPerson + 4 Saat Kuralı
 * 
 * RUNBOOK REF: 10_MODUL_GUVENLIK.md + ISEMRI_DIJITAL_ARSIV_RUNBOOK_PART3B
 */

import React, { useState, useEffect } from 'react';
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
  Key,
  Users,
  Car,
  Clock,
  DollarSign,
  Upload,
  IdCard
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ModuleLayout } from '../../../components/layouts';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
}

interface WorkOrderPerson {
  id: number;
  full_name: string;
  tc_kimlik_no?: string;
  passport_no?: string;
  identity_document_id?: number;
  identity_photo_url?: string;
  gate_entry_time?: string;
  gate_exit_time?: string;
  approved_by_security: boolean;
  security_notes?: string;
}

interface WorkOrder {
  id: number;
  woNumber: string;
  cariTitle: string;
  motorbot: string;
  subject: string;
  status: 'ONAYLANDI' | 'BEKLEMEDE' | 'REDDEDILDI' | 'APPROVED' | 'IN_PROGRESS';
  approvedBy?: string;
  approvedAt?: string;
  checklist: ChecklistItem[];
  persons?: WorkOrderPerson[];
}

interface VehicleEntry {
  vehicle_plate: string;
  vehicle_type: string;
  driver_name: string;
  entry_time: string;
}

export function GuvenlikModule() {
  const [woNumber, setWoNumber] = useState('');
  const [currentWO, setCurrentWO] = useState<WorkOrder | null>(null);
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);
  const [exceptionPIN, setExceptionPIN] = useState('');
  const [exceptionReason, setExceptionReason] = useState('');
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [entryType, setEntryType] = useState<'GIRIS' | 'CIKIS'>('GIRIS');
  
  // 🆕 WorkOrderPerson State
  const [selectedPerson, setSelectedPerson] = useState<WorkOrderPerson | null>(null);
  const [showPersonListDialog, setShowPersonListDialog] = useState(false);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  
  // 🆕 Vehicle Entry State
  const [showVehicleDialog, setShowVehicleDialog] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleEntry>({
    vehicle_plate: '',
    vehicle_type: 'Kamyon',
    driver_name: '',
    entry_time: new Date().toISOString()
  });
  
  // 🆕 Exit Time & 4-Hour Rule State
  const [exitTime, setExitTime] = useState<string>('');
  const [extraCharge, setExtraCharge] = useState<number>(0);
  const [showExtraChargeAlert, setShowExtraChargeAlert] = useState(false);

  // Mock iş emri verisi
  const mockWorkOrders: Record<string, WorkOrder> = {
    'WO202511-001': {
      id: 1,
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
      persons: [
        {
          id: 1,
          full_name: 'Mehmet Yılmaz',
          tc_kimlik_no: '12345678901',
          identity_document_id: 101,
          identity_photo_url: '/uploads/identity_101.jpg',
          approved_by_security: true,
          gate_entry_time: '2025-11-25 08:00:00'
        },
        {
          id: 2,
          full_name: 'Ali Demir',
          passport_no: 'AB123456',
          identity_document_id: 102,
          approved_by_security: false
        },
        {
          id: 3,
          full_name: 'Ahmet Kaya',
          tc_kimlik_no: '98765432109',
          approved_by_security: false
        }
      ]
    },
    'WO202511-002': {
      id: 2,
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

  // 🆕 4 Saat Kuralı Hesaplama
  const calculate4HourRule = (entryTime: string, exitTime: string) => {
    const entry = new Date(entryTime);
    const exit = new Date(exitTime);
    const durationMinutes = (exit.getTime() - entry.getTime()) / (1000 * 60);
    const baseMinutes = 4 * 60; // 4 saat = 240 dakika
    
    if (durationMinutes > baseMinutes) {
      const extraMinutes = durationMinutes - baseMinutes;
      const extraHours = extraMinutes / 60;
      // Varsayılan saat ücreti: 25 TL (örnek)
      const hourlyRate = 25;
      const charge = extraHours * hourlyRate;
      return {
        duration: durationMinutes,
        extraMinutes,
        extraHours: Math.round(extraHours * 100) / 100,
        charge: Math.round(charge * 100) / 100
      };
    }
    return null;
  };

  const handleVehicleExit = () => {
    if (!currentWO || !exitTime) return;
    
    // Araç giriş zamanını bul (mock - gerçekte API'den gelecek)
    const entryTime = '2025-11-25 08:00:00';
    const extraChargeData = calculate4HourRule(entryTime, exitTime);
    
    if (extraChargeData) {
      setExtraCharge(extraChargeData.charge);
      setShowExtraChargeAlert(true);
    } else {
      // Normal çıkış
      toast.success('Çıkış kaydedildi');
      setCurrentWO(null);
    }
  };

  const handleIdentityUpload = async (personId: number) => {
    if (!identityFile) {
      toast.error('Lütfen kimlik belgesi seçin');
      return;
    }
    
    // API call - kimlik belgesi upload
    const formData = new FormData();
    formData.append('file', identityFile);
    formData.append('person_id', personId.toString());
    
    toast.success('Kimlik belgesi yüklendi');
    setIdentityFile(null);
    setSelectedPerson(null);
  };

  const approvePersonEntry = async (personId: number) => {
    // API call - güvenlik onayı
    toast.success('Personel girişi onaylandı');
    
    // Update local state
    if (currentWO?.persons) {
      const updatedPersons = currentWO.persons.map(p => 
        p.id === personId ? { ...p, approved_by_security: true, gate_entry_time: new Date().toISOString() } : p
      );
      setCurrentWO({ ...currentWO, persons: updatedPersons });
    }
  };

  const allowEntry = () => {
    console.log('Giriş izni verildi:', currentWO?.woNumber);
    // API call - gate log kaydet
    setCurrentWO(null);
    setWoNumber('');
    toast.success('Giriş izni verildi');
  };

  const denyEntry = () => {
    console.log('Giriş reddedildi:', currentWO?.woNumber);
    setCurrentWO(null);
    setWoNumber('');
    toast.error('Giriş reddedildi');
  };

  const handleException = () => {
    if (exceptionPIN.length === 4) {
      console.log('İstisna PIN:', exceptionPIN, 'Sebep:', exceptionReason);
      // API call - exception log kaydet
      setShowExceptionDialog(false);
      setExceptionPIN('');
      setExceptionReason('');
      allowEntry();
      toast.warning('İstisna ile giriş izni verildi');
    }
  };

  const capturePhoto = () => {
    console.log('Fotoğraf çekiliyor...');
    // Kamera API kullan
    setShowPhotoDialog(false);
    toast.success('Fotoğraf kaydedildi');
  };

  // 🆕 WorkOrderPerson listesi gösterme
  const getPersonIdentityStatus = (person: WorkOrderPerson) => {
    if (person.identity_document_id && person.identity_photo_url) {
      return { label: 'Tam', color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
    } else if (person.identity_document_id || person.tc_kimlik_no || person.passport_no) {
      return { label: 'Eksik', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
    }
    return { label: 'Yok', color: 'bg-red-100 text-red-700', icon: XCircle };
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

                {/* 🆕 WorkOrderPerson Listesi */}
                {currentWO.persons && currentWO.persons.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xl font-semibold">
                        Personel Listesi ({currentWO.persons.length})
                      </Label>
                      <Button
                        onClick={() => setShowPersonListDialog(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Tüm Personeli Gör
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {currentWO.persons.slice(0, 3).map((person) => {
                        const identityStatus = getPersonIdentityStatus(person);
                        const StatusIcon = identityStatus.icon;
                        return (
                          <div key={person.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <IdCard className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{person.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {person.tc_kimlik_no ? `TC: ${person.tc_kimlik_no}` : 
                                   person.passport_no ? `Pasaport: ${person.passport_no}` : 'Kimlik bilgisi yok'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={identityStatus.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {identityStatus.label}
                              </Badge>
                              {person.approved_by_security ? (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Onaylı
                                </Badge>
                              ) : (
                                <Button
                                  onClick={() => approvePersonEntry(person.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  Onayla
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {currentWO.persons.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          +{currentWO.persons.length - 3} kişi daha...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 🆕 Araç Giriş/Çıkış Butonları */}
                {entryType === 'GIRIS' && (
                  <Button
                    onClick={() => setShowVehicleDialog(true)}
                    size="lg"
                    variant="outline"
                    className="w-full h-14 text-lg border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <Car className="h-5 w-5 mr-2" />
                    Araç Girişi Kaydet
                  </Button>
                )}

                {entryType === 'CIKIS' && (
                  <div className="space-y-3">
                    <Label className="text-lg">Çıkış Zamanı</Label>
                    <Input
                      type="datetime-local"
                      value={exitTime}
                      onChange={(e) => setExitTime(e.target.value)}
                      className="h-12 text-lg"
                    />
                    <Button
                      onClick={handleVehicleExit}
                      size="lg"
                      className="w-full h-14 text-lg"
                      disabled={!exitTime}
                    >
                      <Clock className="h-5 w-5 mr-2" />
                      Çıkış Kaydet ve Süre Hesapla
                    </Button>
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

      {/* 🆕 WorkOrderPerson Listesi Dialog */}
      <Dialog open={showPersonListDialog} onOpenChange={setShowPersonListDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Personel Listesi</DialogTitle>
            <DialogDescription className="text-base">
              İş emrine atanan tüm personel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {currentWO?.persons?.map((person) => {
              const identityStatus = getPersonIdentityStatus(person);
              const StatusIcon = identityStatus.icon;
              return (
                <div key={person.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IdCard className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-lg">{person.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {person.tc_kimlik_no ? `TC: ${person.tc_kimlik_no}` : 
                           person.passport_no ? `Pasaport: ${person.passport_no}` : 'Kimlik bilgisi yok'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={identityStatus.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {identityStatus.label}
                      </Badge>
                      {person.approved_by_security && (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Onaylı
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Kimlik Belgesi Upload */}
                  {!person.identity_document_id && (
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setIdentityFile(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleIdentityUpload(person.id)}
                        disabled={!identityFile}
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Yükle
                      </Button>
                    </div>
                  )}

                  {/* Giriş/Çıkış Bilgileri */}
                  {person.gate_entry_time && (
                    <div className="text-sm text-muted-foreground">
                      <p>Giriş: {new Date(person.gate_entry_time).toLocaleString('tr-TR')}</p>
                      {person.gate_exit_time && (
                        <p>Çıkış: {new Date(person.gate_exit_time).toLocaleString('tr-TR')}</p>
                      )}
                    </div>
                  )}

                  {/* Onay Butonu */}
                  {!person.approved_by_security && person.identity_document_id && (
                    <Button
                      onClick={() => approvePersonEntry(person.id)}
                      size="sm"
                      className="w-full"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Güvenlik Onayı Ver
                    </Button>
                  )}

                  {person.security_notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                      <p className="font-medium text-yellow-800">Güvenlik Notu:</p>
                      <p className="text-yellow-700">{person.security_notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* 🆕 Araç Giriş Dialog */}
      <Dialog open={showVehicleDialog} onOpenChange={setShowVehicleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Car className="h-6 w-6" />
              Araç Giriş Kaydı
            </DialogTitle>
            <DialogDescription className="text-base">
              Araç bilgilerini girin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="vehicle_plate">Araç Plakası *</Label>
              <Input
                id="vehicle_plate"
                value={vehicleData.vehicle_plate}
                onChange={(e) => setVehicleData({...vehicleData, vehicle_plate: e.target.value.toUpperCase()})}
                placeholder="34 ABC 123"
                className="text-lg uppercase"
              />
            </div>
            <div>
              <Label htmlFor="vehicle_type">Araç Tipi *</Label>
              <select
                id="vehicle_type"
                value={vehicleData.vehicle_type}
                onChange={(e) => setVehicleData({...vehicleData, vehicle_type: e.target.value})}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="Kamyon">Kamyon</option>
                <option value="Minibüs">Minibüs</option>
                <option value="Hafif Ticari">Hafif Ticari</option>
                <option value="Binek">Binek</option>
                <option value="Çekici">Çekici</option>
              </select>
            </div>
            <div>
              <Label htmlFor="driver_name">Sürücü Adı *</Label>
              <Input
                id="driver_name"
                value={vehicleData.driver_name}
                onChange={(e) => setVehicleData({...vehicleData, driver_name: e.target.value})}
                placeholder="Mehmet Yılmaz"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                // API call - vehicle entry kaydet
                toast.success('Araç girişi kaydedildi');
                setShowVehicleDialog(false);
                setVehicleData({
                  vehicle_plate: '',
                  vehicle_type: 'Kamyon',
                  driver_name: '',
                  entry_time: new Date().toISOString()
                });
              }}
              disabled={!vehicleData.vehicle_plate || !vehicleData.driver_name}
              size="lg"
              className="w-full h-12"
            >
              <Car className="h-5 w-5 mr-2" />
              Giriş Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🆕 4 Saat Kuralı Ek Ücret Uyarısı */}
      <AlertDialog open={showExtraChargeAlert} onOpenChange={setShowExtraChargeAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-yellow-500" />
              Ek Ücret Uyarısı
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              4 saat kuralı aşıldı!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Baz Süre:</span>
                <span className="font-medium">4 saat (240 dakika)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Aşan Süre:</span>
                <span className="font-medium text-yellow-700">
                  {calculate4HourRule('2025-11-25 08:00:00', exitTime)?.extraHours} saat
                </span>
              </div>
              <div className="border-t border-yellow-200 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Ek Ücret:</span>
                  <span className="text-lg font-bold text-yellow-700">
                    {extraCharge} TL
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Bu ücret iş emri kalemlerine otomatik olarak eklenecektir.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // API call - extra charge kaydet
                toast.success(`Çıkış kaydedildi. Ek ücret: ${extraCharge} TL`);
                setShowExtraChargeAlert(false);
                setCurrentWO(null);
                setExitTime('');
                setExtraCharge(0);
              }}
            >
              Onayla ve Kaydet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
