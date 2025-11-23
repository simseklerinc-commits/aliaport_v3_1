/**
 * BARINMA FEATURE - Main Module Component
 */

import React, { useState } from 'react';
import { BarinmaList } from './BarinmaList';
import { BarinmaForm } from './BarinmaForm';
import type { BarinmaContract } from '../types/barinma.types';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { ModuleLayout } from '../../../components/layouts';
import { Home } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export function BarinmaModule() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<BarinmaContract | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleCreate = () => {
    setSelected(null);
    setViewMode('create');
    setShowDialog(true);
  };

  const handleEdit = (item: BarinmaContract) => {
    setSelected(item);
    setViewMode('edit');
    setShowDialog(true);
  };

  const handleView = (item: BarinmaContract) => {
    setSelected(item);
    setViewMode('view');
    setShowDialog(true);
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setSelected(null);
    setViewMode('list');
  };

  const handleCancel = () => {
    setShowDialog(false);
    setSelected(null);
    setViewMode('list');
  };

  return (
    <ModuleLayout
      title="Barınma Yönetimi"
      description="Barınma kontratları ve ücretlendirme"
      icon={Home}
    >
      <BarinmaList onCreate={handleCreate} onEdit={handleEdit} onView={handleView} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <BarinmaForm barinma={selected} onSuccess={handleSuccess} onCancel={handleCancel} />
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
