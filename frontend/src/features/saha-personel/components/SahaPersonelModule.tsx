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
  HardHat
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ModuleLayout } from '../../../components/layouts';

export function SahaPersonelModule() {
  const [activeTask, setActiveTask] = useState<any>(null);
  const [timeStart, setTimeStart] = useState<string>('');
  const [timeEnd, setTimeEnd] = useState<string>('');

  // Mock data - gerçekte API'den gelecek
  const assignedTasks = [
    {
      id: 1,
      type: 'İş Emri',
      woNumber: 'WO202511-001',
      cariTitle: 'ABC Denizcilik',
      subject: 'Motor Bakımı',
      motorbot: 'ATLAS',
      status: 'SAHADA',
      plannedStart: '2025-11-22 09:00',
    },
    {
      id: 2,
      type: 'Sefer',
      seferNo: 'SF-20251122-MB01',
      motorbot: 'DELFİN',
      route: 'Liman → Platform A',
      status: 'DEVAM_EDIYOR',
      actualStart: '2025-11-22 08:30',
    },
  ];

  const startWork = (task: any) => {
    setActiveTask(task);
    setTimeStart(new Date().toISOString().slice(0, 16));
  };

  const endWork = () => {
    setTimeEnd(new Date().toISOString().slice(0, 16));
  };

  const saveWorkLog = () => {
    console.log('WorkLog kaydediliyor:', {
      task: activeTask,
      timeStart,
      timeEnd,
    });
    // API call yapılacak
    setActiveTask(null);
    setTimeStart('');
    setTimeEnd('');
  };

  return (
    <ModuleLayout
      title="Saha Personeli"
      description="Görev takibi ve veri girişi"
      icon={HardHat}
    >
      <Tabs defaultValue="gorevler" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-14">
          <TabsTrigger value="gorevler" className="text-lg">
            <FileText className="h-5 w-5 mr-2" />
            Görevlerim
          </TabsTrigger>
          <TabsTrigger value="aktif" className="text-lg">
            <PlayCircle className="h-5 w-5 mr-2" />
            Aktif Görev
          </TabsTrigger>
        </TabsList>

        {/* Görevlerim */}
        <TabsContent value="gorevler" className="space-y-4">
          {assignedTasks.map((task) => (
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
                    variant={task.status === 'SAHADA' ? 'default' : 'secondary'}
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
                <Button 
                  onClick={() => startWork(task)} 
                  size="lg" 
                  className="w-full h-14 text-lg"
                  disabled={activeTask !== null}
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  İşe Başla
                </Button>
              </CardContent>
            </Card>
          ))}
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
                      <Input
                        id="timeEnd"
                        type="datetime-local"
                        value={timeEnd}
                        onChange={(e) => setTimeEnd(e.target.value)}
                        className="h-14 text-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hizmet" className="text-lg">Hizmet *</Label>
                      <Select>
                        <SelectTrigger className="h-14 text-lg">
                          <SelectValue placeholder="Hizmet seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BAKIM">Motor Bakımı</SelectItem>
                          <SelectItem value="TAMIR">Arıza Tamiri</SelectItem>
                          <SelectItem value="TRANSFER">Transfer Hizmeti</SelectItem>
                          <SelectItem value="FORKLIFT">Forklift Hizmeti</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="miktar" className="text-lg">Miktar</Label>
                      <Input
                        id="miktar"
                        type="number"
                        step="0.01"
                        placeholder="Miktar girin"
                        className="h-14 text-lg"
                      />
                    </div>
                    <div>
                      <Label htmlFor="not" className="text-lg">Not / Açıklama</Label>
                      <Textarea
                        id="not"
                        rows={4}
                        placeholder="Yapılan işler, gözlemler..."
                        className="text-lg resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={endWork} 
                      size="lg" 
                      variant="outline"
                      className="h-14 text-lg"
                    >
                      <StopCircle className="h-5 w-5 mr-2" />
                      İşi Bitir
                    </Button>
                    <Button 
                      onClick={saveWorkLog} 
                      size="lg"
                      className="h-14 text-lg"
                      disabled={!timeStart}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Zaman Takibi */}
              {timeStart && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
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
      </Tabs>
    </ModuleLayout>
  );
}
