/**
 * HIZMET MODULE - Main Module Component
 */

import React, { useState } from 'react';
import { HizmetList } from './components/HizmetList';
import { HizmetForm } from './components/HizmetForm';
import type { Hizmet } from './types/hizmet.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ModuleLayout } from '../../components/layouts';
import { Wrench } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export function HizmetModule() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedHizmet, setSelectedHizmet] = useState<Hizmet | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAdd = () => {
    setSelectedHizmet(null);
    setViewMode('create');
  };

  const handleEdit = (hizmet: Hizmet) => {
    setSelectedHizmet(hizmet);
    setViewMode('edit');
  };

  const handleView = (hizmet: Hizmet) => {
    setSelectedHizmet(hizmet);
    setViewMode('view');
  };

  const handleSuccess = () => {
    setViewMode('list');
    setSelectedHizmet(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedHizmet(null);
  };

  const isDialogOpen = viewMode !== 'list';

  return (
    <ModuleLayout
      title="Hizmet Yönetimi"
      description="Hizmet kartlarını yönetin"
      icon={Wrench}
    >
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Hizmet Listesi</TabsTrigger>
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <HizmetList
            key={refreshTrigger}
            onEdit={handleEdit}
            onView={handleView}
            onAdd={handleAdd}
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Hizmet raporları modülü yakında eklenecek
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Hizmet ayarları modülü yakında eklenecek
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMode === 'create' && 'Yeni Hizmet'}
              {viewMode === 'edit' && 'Hizmet Düzenle'}
              {viewMode === 'view' && 'Hizmet Detayları'}
            </DialogTitle>
          </DialogHeader>

          {viewMode === 'view' && selectedHizmet ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hizmet Kodu</p>
                  <p className="text-lg font-mono">{selectedHizmet.Kod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hizmet Adı</p>
                  <p className="text-lg">{selectedHizmet.Ad}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Açıklama</p>
                  <p className="text-base">{selectedHizmet.Aciklama || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grup Kodu</p>
                  <p className="text-lg">{selectedHizmet.GrupKod || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Muhasebe Kodu</p>
                  <p className="text-lg font-mono">{selectedHizmet.MuhasebeKodu || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Birim</p>
                  <p className="text-lg">{selectedHizmet.Birim || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Birim Fiyat</p>
                  <p className="text-lg">
                    {selectedHizmet.Fiyat
                      ? `${selectedHizmet.Fiyat} ${selectedHizmet.ParaBirimi || 'TRY'}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">KDV Oranı</p>
                  <p className="text-lg">{selectedHizmet.KdvOrani ? `%${selectedHizmet.KdvOrani}` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Durum</p>
                  <p className="text-lg">{selectedHizmet.AktifMi !== false ? 'Aktif' : 'Pasif'}</p>
                </div>
              </div>
            </div>
          ) : (
            <HizmetForm
              hizmet={viewMode === 'edit' ? selectedHizmet : null}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
