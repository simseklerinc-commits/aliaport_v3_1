/**
 * SAHA PERSONELİ MODÜLÜ - Tablet Uygulaması
 * İş emri ve sefer için saha veri girişi
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
import { Textarea } from '../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  StopCircle,
  FileText,
  Wrench,
  Ship,
  HardHat,
  Camera,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Package,
  Timer,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { ModuleLayout } from '../../../components/layouts';
import { WorkLogListModern } from './WorkLogListModern';

// Interfaces
interface WorkItem {
  hizmet_type: string;
  miktar: number;
  birim: string;
  aciklama?: string;
}

interface WorkOrderTask {
  id: number;
  type: 'İş Emri' | 'Sefer';
  woNumber?: string;
  seferNo?: string;
  cariTitle?: string;
  subject?: string;
  motorbot: string;
  route?: string;
  status: string;
  plannedStart?: string;
  actualStart?: string;
  total_persons?: number;
  approved_persons?: number;
}

export function SahaPersonelModule() {
  const [activeTask, setActiveTask] = useState<WorkOrderTask | null>(null);
  const [timeStart, setTimeStart] = useState<string>('');
  const [timeEnd, setTimeEnd] = useState<string>('');
  const [selectedHizmet, setSelectedHizmet] = useState<string>('');
  const [miktar, setMiktar] = useState<string>('1');
  const [birim, setBirim] = useState<string>('ADET');
  const [workNote, setWorkNote] = useState<string>('');
  
  // Dinamik kalem ekleme
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItemHizmet, setNewItemHizmet] = useState<string>('');
  const [newItemMiktar, setNewItemMiktar] = useState<string>('1');
  const [newItemBirim, setNewItemBirim] = useState<string>('ADET');
  const [newItemAciklama, setNewItemAciklama] = useState<string>('');
  
  // Fotoğraf
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  
  // API
  const [loading, setLoading] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState<WorkOrderTask[]>([]);

  // API - Aktif iş emirlerini çek
  const fetchActiveWorkOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/saha-personel/active-work-orders?status=IN_PROGRESS');
      const data = await response.json();
      
      if (data.success) {
        const tasks: WorkOrderTask[] = data.data.work_orders.map((wo: any) => ({
          id: wo.Id,
          type: 'İş Emri' as const,
          woNumber: wo.WONumber,
          cariTitle: wo.CariTitle,
          subject: wo.Subject,
          motorbot: wo.CariCode, // veya motorbot field
          status: wo.Status,
          plannedStart: wo.StartDate,
          total_persons: wo.TotalPersonCount,
          approved_persons: wo.ApprovedPersonCount,
        }));
        setAssignedTasks(tasks);
        toast.success(`${tasks.length} aktif görev yüklendi`);
      }
    } catch (error) {
      toast.error('Görevler yüklenirken hata oluştu');
      console.error(error);
      // Fallback mock data
      setAssignedTasks([
        {
          id: 1,
          type: 'İş Emri',
          woNumber: 'WO202511-001',
          cariTitle: 'ABC Denizcilik',
          subject: 'Motor Bakımı',
          motorbot: 'ATLAS',
          status: 'SAHADA',
          plannedStart: '2025-11-22 09:00',
          total_persons: 5,
          approved_persons: 3,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Component mount
  React.useEffect(() => {
    fetchActiveWorkOrders();
  }, []);

  const startWork = (task: WorkOrderTask) => {
    setActiveTask(task);
    setTimeStart(new Date().toISOString().slice(0, 16));
    setWorkItems([]);
    setPhotos([]);
    toast.success('Görev başlatıldı');
  };

  const endWork = () => {
    setTimeEnd(new Date().toISOString().slice(0, 16));
    toast.info('Bitiş zamanı kaydedildi');
  };
  
  const addWorkItem = () => {
    if (!newItemHizmet || !newItemMiktar) {
      toast.error('Hizmet ve miktar zorunludur');
      return;
    }
    
    const newItem: WorkItem = {
      hizmet_type: newItemHizmet,
      miktar: parseFloat(newItemMiktar),
      birim: newItemBirim,
      aciklama: newItemAciklama,
    };
    
    setWorkItems([...workItems, newItem]);
    toast.success('Kalem eklendi');
    
    // Reset form
    setNewItemHizmet('');
    setNewItemMiktar('1');
    setNewItemBirim('ADET');
    setNewItemAciklama('');
    setShowAddItemDialog(false);
  };
  
  const removeWorkItem = (index: number) => {
    setWorkItems(workItems.filter((_, i) => i !== index));
    toast.info('Kalem silindi');
  };
  
  const capturePhoto = async () => {
    // Kamera API implementation
    toast.info('Kamera açılıyor...');
    // Mock photo
    const mockPhoto = `photo_${Date.now()}.jpg`;
    setPhotos([...photos, mockPhoto]);
    setShowPhotoDialog(false);
    toast.success('Fotoğraf kaydedildi');
  };

  const saveWorkLog = async () => {
    if (!timeStart || !selectedHizmet) {
      toast.error('Başlangıç zamanı ve hizmet seçimi zorunludur');
      return;
    }
    
    setLoading(true);
    try {
      // Ana worklog
      const workLogData = {
        work_order_id: activeTask?.id,
        hizmet_type: selectedHizmet,
        miktar: parseFloat(miktar),
        birim: birim,
        baslamaTarihi: timeStart,
        bitisTarihi: timeEnd || null,
        aciklama: workNote,
        photos: photos,
        is_approved: false, // Admin onayı bekliyor
      };
      
      // API call
      const response = await fetch('/api/saha-personel/worklog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workLogData),
      });
      
      if (!response.ok) throw new Error('API hatası');
      
      // Dinamik kalemler de varsa kaydet
      if (workItems.length > 0) {
        for (const item of workItems) {
          await fetch('/api/saha-personel/worklog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              work_order_id: activeTask?.id,
              ...item,
              baslamaTarihi: timeStart,
              bitisTarihi: timeEnd || null,
              is_approved: false,
            }),
          });
        }
      }
      
      toast.success('WorkLog kaydedildi! Admin onayı bekleniyor.');
      
      // Reset
      setActiveTask(null);
      setTimeStart('');
      setTimeEnd('');
      setSelectedHizmet('');
      setMiktar('1');
      setWorkNote('');
      setWorkItems([]);
      setPhotos([]);
      
      // Refresh task list
      fetchActiveWorkOrders();
      
    } catch (error) {
      toast.error('WorkLog kaydedilirken hata oluştu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModuleLayout
      title="Saha Personeli"
      description="Görev takibi ve veri girişi"
      icon={HardHat}
    >
      <Tabs defaultValue="gorevler" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-14">
          <TabsTrigger value="gorevler" className="text-lg">
            <FileText className="h-5 w-5 mr-2" />
            Görevlerim
          </TabsTrigger>
          <TabsTrigger value="aktif" className="text-lg">
            <PlayCircle className="h-5 w-5 mr-2" />
            Aktif Görev
          </TabsTrigger>
          <TabsTrigger value="gecmis" className="text-lg">
            <Clock className="h-5 w-5 mr-2" />
            Geçmiş Kayıtlar
          </TabsTrigger>
        </TabsList>

        {/* Görevlerim */}
        <TabsContent value="gorevler" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Aktif Görevler ({assignedTasks.length})</h3>
            <Button 
              onClick={fetchActiveWorkOrders}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
          </div>
          
          {assignedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">Henüz atanmış görev yok</p>
              </CardContent>
            </Card>
          ) : (
            assignedTasks.map((task) => (
              <Card 
                key={task.id} 
                className="border-2 hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {task.type === 'İş Emri' ? (
                        <Wrench className="h-8 w-8 text-primary" />
                      ) : (
                        <Ship className="h-8 w-8 text-blue-500" />
                      )}
                      <div>
                        <CardTitle className="text-xl">
                          {task.woNumber || task.seferNo}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {task.subject || task.route}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={task.status === 'IN_PROGRESS' ? 'default' : 'secondary'}
                      className="text-sm px-3 py-1"
                    >
                      {task.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-lg">
                    {task.cariTitle && (
                      <div>
                        <span className="text-muted-foreground">Müşteri:</span>
                        <p className="font-medium">{task.cariTitle}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Motorbot:</span>
                      <p className="font-medium">{task.motorbot}</p>
                    </div>
                    {task.plannedStart && (
                      <div>
                        <span className="text-muted-foreground">Planlanan:</span>
                        <p className="font-medium">
                          {new Date(task.plannedStart).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    )}
                    {task.actualStart && (
                      <div>
                        <span className="text-muted-foreground">Başlangıç:</span>
                        <p className="font-medium">
                          {new Date(task.actualStart).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Personel Bilgisi */}
                  {task.total_persons !== undefined && (
                    <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg p-3">
                      <UserCheck className="h-5 w-5 text-primary" />
                      <span>
                        Personel: <strong>{task.approved_persons || 0}</strong> / {task.total_persons} onaylı
                      </span>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => startWork(task)} 
                    size="lg" 
                    className="w-full h-14 text-lg"
                    disabled={activeTask !== null || loading}
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    İşe Başla
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Aktif Görev */}
        <TabsContent value="aktif" className="space-y-4">
          {activeTask ? (
            <div className="space-y-4">
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <PlayCircle className="h-6 w-6 text-primary animate-pulse" />
                    Aktif Görev
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {activeTask.woNumber || activeTask.seferNo} - {activeTask.motorbot}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="timeStart" className="text-lg">Başlangıç Zamanı *</Label>
                      <Input
                        id="timeStart"
                        type="datetime-local"
                        value={timeStart}
                        onChange={(e) => setTimeStart(e.target.value)}
                        className="h-14 text-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeEnd" className="text-lg">Bitiş Zamanı</Label>
                      <div className="flex gap-2">
                        <Input
                          id="timeEnd"
                          type="datetime-local"
                          value={timeEnd}
                          onChange={(e) => setTimeEnd(e.target.value)}
                          className="h-14 text-lg flex-1"
                        />
                        <Button
                          onClick={endWork}
                          size="lg"
                          variant="outline"
                          className="h-14"
                        >
                          <StopCircle className="h-5 w-5 mr-2" />
                          Bitir
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="hizmet" className="text-lg">Ana Hizmet *</Label>
                      <Select value={selectedHizmet} onValueChange={setSelectedHizmet}>
                        <SelectTrigger className="h-14 text-lg">
                          <SelectValue placeholder="Hizmet seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BAKIM">Motor Bakımı</SelectItem>
                          <SelectItem value="TAMIR">Arıza Tamiri</SelectItem>
                          <SelectItem value="TRANSFER">Transfer Hizmeti</SelectItem>
                          <SelectItem value="FORKLIFT">Forklift Hizmeti</SelectItem>
                          <SelectItem value="ROMORKAJ">Römorkaj</SelectItem>
                          <SelectItem value="BAĞLAMA">Bağlama/Çözme</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="miktar" className="text-lg">Miktar</Label>
                        <Input
                          id="miktar"
                          type="number"
                          step="0.01"
                          value={miktar}
                          onChange={(e) => setMiktar(e.target.value)}
                          placeholder="Miktar girin"
                          className="h-14 text-lg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="birim" className="text-lg">Birim</Label>
                        <Select value={birim} onValueChange={setBirim}>
                          <SelectTrigger className="h-14 text-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADET">Adet</SelectItem>
                            <SelectItem value="SAAT">Saat</SelectItem>
                            <SelectItem value="GÜN">Gün</SelectItem>
                            <SelectItem value="TON">Ton</SelectItem>
                            <SelectItem value="M3">m³</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="not" className="text-lg">Not / Açıklama</Label>
                      <Textarea
                        id="not"
                        rows={4}
                        value={workNote}
                        onChange={(e) => setWorkNote(e.target.value)}
                        placeholder="Yapılan işler, gözlemler..."
                        className="text-lg resize-none"
                      />
                    </div>
                  </div>

                  {/* Dinamik Kalemler */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Ek Kalemler ({workItems.length})</Label>
                      <Button
                        onClick={() => setShowAddItemDialog(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Kalem Ekle
                      </Button>
                    </div>
                    
                    {workItems.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {workItems.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Package className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{item.hizmet_type}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.miktar} {item.birim}
                                  {item.aciklama && ` - ${item.aciklama}`}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => removeWorkItem(index)}
                              variant="ghost"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fotoğraflar */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">Fotoğraflar ({photos.length})</Label>
                      <Button
                        onClick={() => setShowPhotoDialog(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Fotoğraf Çek
                      </Button>
                    </div>
                    
                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo, index) => (
                          <div key={index} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                      onClick={saveWorkLog} 
                      size="lg"
                      className="h-14 text-lg"
                      disabled={!timeStart || !selectedHizmet || loading}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      {loading ? 'Kaydediliyor...' : 'Kaydet (Admin Onayı İçin)'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Zaman Takibi */}
              {timeStart && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5" />
                      Zaman Takibi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-4xl font-bold text-primary">
                        {timeEnd ? 
                          Math.round((new Date(timeEnd).getTime() - new Date(timeStart).getTime()) / 1000 / 60) + ' dk' :
                          Math.round((new Date().getTime() - new Date(timeStart).getTime()) / 1000 / 60) + ' dk'
                        }
                      </p>
                      <p className="text-lg text-muted-foreground mt-2">
                        Çalışma Süresi
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">
                  Aktif görev yok
                </p>
                <p className="text-lg text-muted-foreground mt-2">
                  Görevlerim sekmesinden bir görev seçin
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Geçmiş Kayıtlar */}
        <TabsContent value="gecmis" className="space-y-4">
          <WorkLogListModern />
        </TabsContent>
      </Tabs>

      {/* 🆕 Dinamik Kalem Ekleme Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-6 w-6" />
              Yeni Kalem Ekle
            </DialogTitle>
            <DialogDescription className="text-base">
              İş emrine ek hizmet kalemi ekleyin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newItemHizmet">Hizmet Türü *</Label>
              <Select value={newItemHizmet} onValueChange={setNewItemHizmet}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Hizmet seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAKIM">Motor Bakımı</SelectItem>
                  <SelectItem value="TAMIR">Arıza Tamiri</SelectItem>
                  <SelectItem value="TRANSFER">Transfer Hizmeti</SelectItem>
                  <SelectItem value="FORKLIFT">Forklift</SelectItem>
                  <SelectItem value="ROMORKAJ">Römorkaj</SelectItem>
                  <SelectItem value="BAĞLAMA">Bağlama/Çözme</SelectItem>
                  <SelectItem value="YAKLAŞMA">Yaklaşma</SelectItem>
                  <SelectItem value="DİĞER">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newItemMiktar">Miktar *</Label>
                <Input
                  id="newItemMiktar"
                  type="number"
                  step="0.01"
                  value={newItemMiktar}
                  onChange={(e) => setNewItemMiktar(e.target.value)}
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="newItemBirim">Birim *</Label>
                <Select value={newItemBirim} onValueChange={setNewItemBirim}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADET">Adet</SelectItem>
                    <SelectItem value="SAAT">Saat</SelectItem>
                    <SelectItem value="GÜN">Gün</SelectItem>
                    <SelectItem value="TON">Ton</SelectItem>
                    <SelectItem value="M3">m³</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="newItemAciklama">Açıklama</Label>
              <Textarea
                id="newItemAciklama"
                rows={3}
                value={newItemAciklama}
                onChange={(e) => setNewItemAciklama(e.target.value)}
                placeholder="Ek bilgi..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={addWorkItem}
              disabled={!newItemHizmet || !newItemMiktar}
              size="lg"
              className="w-full h-12"
            >
              <Plus className="h-5 w-5 mr-2" />
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🆕 Fotoğraf Çekme Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Fotoğraf Çek</DialogTitle>
            <DialogDescription className="text-base">
              İş belgesi için fotoğraf ekleyin
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
