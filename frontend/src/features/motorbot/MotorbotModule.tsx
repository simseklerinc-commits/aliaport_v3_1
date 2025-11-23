/**
 * MOTORBOT MODULE - Main Module Component
 */

import React, { useState } from 'react';
import { MotorbotList } from './components/MotorbotList';
import { MotorbotForm } from './components/MotorbotForm';
import type { Motorbot } from './types/motorbot.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ModuleLayout } from '../../components/layouts';
import { Anchor } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export function MotorbotModule() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMotorbot, setSelectedMotorbot] = useState<Motorbot | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setSelectedMotorbot(null);
    setViewMode('create');
  };

  const handleEdit = (motorbot: Motorbot) => {
    setSelectedMotorbot(motorbot);
    setViewMode('edit');
  };

  const handleView = (motorbot: Motorbot) => {
    setSelectedMotorbot(motorbot);
    setViewMode('view');
  };

  const handleSuccess = () => {
    setViewMode('list');
    setSelectedMotorbot(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedMotorbot(null);
  };

  const isDialogOpen = viewMode !== 'list';

  return (
    <ModuleLayout
      title="Motorbot Yönetimi"
      description="Motorbot ve gemi kayıtlarını yönetin"
      icon={Anchor}
    >
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Motorbot Listesi</TabsTrigger>
          <TabsTrigger value="sefer">Sefer İşlemleri</TabsTrigger>
          <TabsTrigger value="bakim">Bakım Kayıtları</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <MotorbotList key={refreshTrigger} onEdit={handleEdit} onView={handleView} onAdd={handleAdd} />
        </TabsContent>

        <TabsContent value="sefer" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Sefer işlemleri modülü yakında eklenecek
          </div>
        </TabsContent>

        <TabsContent value="bakim" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Bakım kayıtları modülü yakında eklenecek
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode === 'create' && 'Yeni Motorbot'}
              {viewMode === 'edit' && 'Motorbot Düzenle'}
              {viewMode === 'view' && 'Motorbot Detayları'}
            </DialogTitle>
          </DialogHeader>

          {viewMode === 'view' && selectedMotorbot ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Motorbot Kodu</p>
                  <p className="text-lg">{selectedMotorbot.MotorbotKodu}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ad</p>
                  <p className="text-lg">{selectedMotorbot.Ad}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tip</p>
                  <p className="text-lg">{selectedMotorbot.Tip || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Durum</p>
                  <p className="text-lg">{selectedMotorbot.AktifMi !== false ? 'Aktif' : 'Pasif'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Brüt Tonaj</p>
                  <p className="text-lg">{selectedMotorbot.BrutTonaj || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Tonaj</p>
                  <p className="text-lg">{selectedMotorbot.NetTonaj || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Boy (m)</p>
                  <p className="text-lg">{selectedMotorbot.Boy || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En (m)</p>
                  <p className="text-lg">{selectedMotorbot.En || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Çekiş Derisi (m)</p>
                  <p className="text-lg">{selectedMotorbot.CekisDerisi || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Yapım Yılı</p>
                  <p className="text-lg">{selectedMotorbot.YapimYili || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bayrak Ülke</p>
                  <p className="text-lg">{selectedMotorbot.BayrakUlke || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Liman Sicil No</p>
                  <p className="text-lg">{selectedMotorbot.LimanSicilNo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IMO No</p>
                  <p className="text-lg">{selectedMotorbot.IMO_No || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">GT</p>
                  <p className="text-lg">{selectedMotorbot.GT || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">DWT</p>
                  <p className="text-lg">{selectedMotorbot.DWT || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <MotorbotForm
              motorbot={viewMode === 'edit' ? selectedMotorbot : null}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
