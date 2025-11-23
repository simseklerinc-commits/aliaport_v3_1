/**
 * TARIFE FEATURE - Main Module Component
 * Tarife modülü ana sayfası
 */

import React, { useState } from 'react';
import { TarifeList } from './TarifeList';
import { TarifeForm } from './TarifeForm';
import type { PriceList } from '../types/tarife.types';
import {
  Dialog,
  DialogContent,
} from '../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { ModuleLayout } from '../../../components/layouts';
import { DollarSign } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export function TarifeModule() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTarife, setSelectedTarife] = useState<PriceList | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleCreate = () => {
    setSelectedTarife(null);
    setViewMode('create');
    setShowDialog(true);
  };

  const handleEdit = (tarife: PriceList) => {
    setSelectedTarife(tarife);
    setViewMode('edit');
    setShowDialog(true);
  };

  const handleView = (tarife: PriceList) => {
    setSelectedTarife(tarife);
    setViewMode('view');
    setShowDialog(true);
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setSelectedTarife(null);
    setViewMode('list');
  };

  const handleCancel = () => {
    setShowDialog(false);
    setSelectedTarife(null);
    setViewMode('list');
  };

  return (
    <ModuleLayout
      title="Tarife Yönetimi"
      description="Fiyat listeleri ve tarife kartları yönetimi"
      icon={DollarSign}
    >
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Tarife Listesi</TabsTrigger>
          <TabsTrigger value="items">Tarife Kalemleri</TabsTrigger>
          <TabsTrigger value="raporlar">Raporlar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <TarifeList
            onCreate={handleCreate}
            onEdit={handleEdit}
            onView={handleView}
          />
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Tarife kalemleri modülü yakında...
          </div>
        </TabsContent>

        <TabsContent value="raporlar" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Tarife raporları modülü yakında...
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewMode === 'view' && selectedTarife ? (
            <>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Tarife Detayı</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kod</p>
                    <p className="text-lg">{selectedTarife.Kod}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ad</p>
                    <p className="text-lg">{selectedTarife.Ad}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Para Birimi</p>
                    <p>{selectedTarife.ParaBirimi}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Versiyon</p>
                    <p>{selectedTarife.Versiyon || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Durum</p>
                    <p>{selectedTarife.Durum}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Geçerlilik</p>
                    <p>
                      {selectedTarife.GecerlilikBaslangic ? 
                        new Date(selectedTarife.GecerlilikBaslangic).toLocaleDateString('tr-TR') : '-'}
                    </p>
                  </div>
                  {selectedTarife.Aciklama && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Açıklama</p>
                      <p>{selectedTarife.Aciklama}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <TarifeForm
              tarife={selectedTarife}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
