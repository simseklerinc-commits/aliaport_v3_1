/**
 * CARI FEATURE - Main Module Component
 * Cari modülü ana sayfası
 */

import React, { useState } from 'react';
import { CariListModern } from './components/CariListModern';
import { CariForm } from './components/CariForm';
import type { Cari } from './types/cari.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ModuleLayout } from '../../components/layouts';
import { Users } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export function CariModule() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCari, setSelectedCari] = useState<Cari | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleCreate = () => {
    setSelectedCari(null);
    setViewMode('create');
    setShowDialog(true);
  };

  const handleEdit = (cari: Cari) => {
    setSelectedCari(cari);
    setViewMode('edit');
    setShowDialog(true);
  };

  const handleView = (cari: Cari) => {
    setSelectedCari(cari);
    setViewMode('view');
    setShowDialog(true);
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setSelectedCari(null);
    setViewMode('list');
    // List component will refetch automatically
  };

  const handleCancel = () => {
    setShowDialog(false);
    setSelectedCari(null);
    setViewMode('list');
  };

  return (
    <ModuleLayout
      title="Cari Yönetimi"
      description="Cari kartları, müşteri ve tedarikçi bilgileri"
      icon={Users}
    >
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Cari Listesi</TabsTrigger>
          <TabsTrigger value="ekstre">Cari Ekstre</TabsTrigger>
          <TabsTrigger value="bakiye">Bakiye Raporu</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <CariListModern
            onCreate={handleCreate}
            onEdit={handleEdit}
            onView={handleView}
          />
        </TabsContent>

        <TabsContent value="ekstre" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Cari ekstre modülü yakında...
          </div>
        </TabsContent>

        <TabsContent value="bakiye" className="mt-6">
          <div className="text-center text-muted-foreground py-12">
            Bakiye raporu modülü yakında...
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewMode === 'view' && selectedCari ? (
            <>
              <DialogHeader>
                <DialogTitle>Cari Detayı</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kod</p>
                    <p className="text-lg">{selectedCari.Kod}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ünvan</p>
                    <p className="text-lg">{selectedCari.Unvan}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Vergi Dairesi
                    </p>
                    <p>{selectedCari.VergiDairesi || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vergi No</p>
                    <p>{selectedCari.VergiNo || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Adres</p>
                    <p>{selectedCari.Adres || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                    <p>{selectedCari.Telefon || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-posta</p>
                    <p>{selectedCari.Email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Yetkili Kişi
                    </p>
                    <p>{selectedCari.YetkiliKisi || '-'}</p>
                  </div>
                  {selectedCari.Notlar && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Notlar</p>
                      <p>{selectedCari.Notlar}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <CariForm
              cari={selectedCari}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
