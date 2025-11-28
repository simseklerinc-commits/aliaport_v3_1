/**
 * İŞ EMRİ DETAY MODAL - Runbook Uyumlu
 * 
 * Özellikler:
 * - Tam ekran modal görünümü
 * - Timeline (durum geçiş tarihleri)
 * - Belge listesi ve önizleme
 * - State machine butonları (geçerli geçişler)
 * - WorkOrderItem listesi
 * - WorkOrderPerson listesi
 * - Not girişi
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { 
  CheckCircle, XCircle, Play, Check, FileText, 
  Clock, User, AlertCircle, DollarSign, Users 
} from 'lucide-react';
import type { WorkOrder } from '../types/isemri.types';
import { WorkOrderStatus } from '../types/isemri.types';
import { WorkOrderPersonList } from './WorkOrderPersonList';
import { useWorkOrderPersons } from '../hooks/useWorkOrderPersons';
import { DocumentUpload } from '../../dijital-arsiv/components/DocumentUpload';

interface WorkOrderDetailProps {
  workOrder: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (newStatus: WorkOrderStatus, notes?: string) => void;
}

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.DRAFT]: 'Taslak',
  [WorkOrderStatus.SUBMITTED]: 'Onay Bekliyor',
  [WorkOrderStatus.PENDING_APPROVAL]: 'Belge Onayı Bekliyor',
  [WorkOrderStatus.APPROVED]: 'Onaylandı',
  [WorkOrderStatus.IN_PROGRESS]: 'İşlemde',
  [WorkOrderStatus.COMPLETED]: 'Tamamlandı',
  [WorkOrderStatus.INVOICED]: 'Faturalandı',
  [WorkOrderStatus.CLOSED]: 'Kapatıldı',
  [WorkOrderStatus.REJECTED]: 'Reddedildi',
  [WorkOrderStatus.SAHADA]: 'Sahada',
  [WorkOrderStatus.TAMAMLANDI]: 'Tamamlandı (Legacy)',
  [WorkOrderStatus.FATURALANDI]: 'Faturalandı (Legacy)',
  [WorkOrderStatus.KAPANDI]: 'Kapatıldı (Legacy)',
};

const AVAILABLE_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.DRAFT]: [WorkOrderStatus.SUBMITTED],
  [WorkOrderStatus.SUBMITTED]: [WorkOrderStatus.APPROVED, WorkOrderStatus.REJECTED],
  [WorkOrderStatus.APPROVED]: [WorkOrderStatus.SAHADA, WorkOrderStatus.IN_PROGRESS],
  [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.COMPLETED],
  [WorkOrderStatus.SAHADA]: [WorkOrderStatus.TAMAMLANDI],
  [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.INVOICED],
  [WorkOrderStatus.TAMAMLANDI]: [WorkOrderStatus.FATURALANDI],
  [WorkOrderStatus.INVOICED]: [WorkOrderStatus.CLOSED],
  [WorkOrderStatus.FATURALANDI]: [WorkOrderStatus.KAPANDI],
  [WorkOrderStatus.REJECTED]: [WorkOrderStatus.DRAFT],
  [WorkOrderStatus.PENDING_APPROVAL]: [WorkOrderStatus.APPROVED],
  [WorkOrderStatus.CLOSED]: [],
  [WorkOrderStatus.KAPANDI]: [],
};

export function WorkOrderDetail({ workOrder, isOpen, onClose, onStatusChange }: WorkOrderDetailProps) {
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<WorkOrderStatus | null>(null);

  // WorkOrderPerson hook
  const {
    persons,
    isLoading: personsLoading,
    error: personsError,
    addPerson,
    updatePerson,
    deletePerson,
  } = useWorkOrderPersons(workOrder?.Id || 0);

  if (!workOrder) return null;

  const availableTransitions = AVAILABLE_TRANSITIONS[workOrder.Status as WorkOrderStatus] || [];

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    // Bazı geçişler için not zorunlu (RED, BAŞLAT, TAMAMLA)
    const requiresNotes = [
      WorkOrderStatus.REJECTED,
      WorkOrderStatus.SAHADA,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.COMPLETED,
      WorkOrderStatus.TAMAMLANDI,
    ].includes(newStatus);

    if (requiresNotes && !showNotesInput) {
      setPendingTransition(newStatus);
      setShowNotesInput(true);
      return;
    }

    onStatusChange?.(newStatus, notes);
    setShowNotesInput(false);
    setNotes('');
    setPendingTransition(null);
  };

  const getStatusIcon = (status: WorkOrderStatus) => {
    if ([WorkOrderStatus.COMPLETED, WorkOrderStatus.TAMAMLANDI, WorkOrderStatus.CLOSED, WorkOrderStatus.KAPANDI].includes(status)) {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (status === WorkOrderStatus.REJECTED) {
      return <XCircle className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getStatusBadgeClass = (status: WorkOrderStatus) => {
    const map: Record<WorkOrderStatus, string> = {
      [WorkOrderStatus.DRAFT]: 'bg-gray-100 text-gray-700',
      [WorkOrderStatus.SUBMITTED]: 'bg-yellow-100 text-yellow-700',
      [WorkOrderStatus.PENDING_APPROVAL]: 'bg-orange-100 text-orange-700',
      [WorkOrderStatus.APPROVED]: 'bg-green-100 text-green-700',
      [WorkOrderStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
      [WorkOrderStatus.SAHADA]: 'bg-blue-100 text-blue-700',
      [WorkOrderStatus.COMPLETED]: 'bg-green-100 text-green-700',
      [WorkOrderStatus.TAMAMLANDI]: 'bg-green-100 text-green-700',
      [WorkOrderStatus.INVOICED]: 'bg-purple-100 text-purple-700',
      [WorkOrderStatus.FATURALANDI]: 'bg-purple-100 text-purple-700',
      [WorkOrderStatus.CLOSED]: 'bg-gray-100 text-gray-700',
      [WorkOrderStatus.KAPANDI]: 'bg-gray-100 text-gray-700',
      [WorkOrderStatus.REJECTED]: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">İş Emri Detayı</DialogTitle>
              <DialogDescription className="text-lg font-semibold mt-1">
                {workOrder.WONumber}
              </DialogDescription>
            </div>
            <Badge className={getStatusBadgeClass(workOrder.Status as WorkOrderStatus)}>
              {STATUS_LABELS[workOrder.Status as WorkOrderStatus]}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="items">Kalemler</TabsTrigger>
            <TabsTrigger value="persons">Kişiler</TabsTrigger>
            <TabsTrigger value="documents">Belgeler</TabsTrigger>
          </TabsList>

          {/* Genel Bakış */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">İş Emri Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cari:</span>
                    <span className="font-medium">{workOrder.CariCode} - {workOrder.CariTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Konu:</span>
                    <span className="font-medium">{workOrder.Subject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tip:</span>
                    <Badge variant="outline">{workOrder.WorkType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Öncelik:</span>
                    <Badge variant="outline">{workOrder.Priority}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tarihler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Planlanan Başlangıç:</span>
                    <span className="font-medium">{workOrder.PlannedStart ? new Date(workOrder.PlannedStart).toLocaleString('tr-TR') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Planlanan Bitiş:</span>
                    <span className="font-medium">{workOrder.PlannedEnd ? new Date(workOrder.PlannedEnd).toLocaleString('tr-TR') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fiili Başlangıç:</span>
                    <span className="font-medium">{workOrder.ActualStart ? new Date(workOrder.ActualStart).toLocaleString('tr-TR') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fiili Bitiş:</span>
                    <span className="font-medium">{workOrder.ActualEnd ? new Date(workOrder.ActualEnd).toLocaleString('tr-TR') : '-'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Açıklama */}
            {workOrder.Description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Açıklama</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{workOrder.Description}</p>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Durum Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Placeholder - backend'den gelecek */}
                  <div className="flex items-start gap-3">
                    {getStatusIcon(workOrder.Status as WorkOrderStatus)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{STATUS_LABELS[workOrder.Status as WorkOrderStatus]}</span>
                        <span className="text-xs text-muted-foreground">
                          {workOrder.UpdatedAt ? new Date(workOrder.UpdatedAt).toLocaleString('tr-TR') : '-'}
                        </span>
                      </div>
                      {workOrder.RejectionReason && (
                        <p className="text-xs text-red-600 mt-1">{workOrder.RejectionReason}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* State Machine Butonları */}
            {availableTransitions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Durum Değiştir</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {availableTransitions.map((transition) => (
                      <Button
                        key={transition}
                        variant={transition === WorkOrderStatus.REJECTED ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleStatusChange(transition)}
                        className="flex items-center gap-2"
                      >
                        {transition === WorkOrderStatus.SAHADA || transition === WorkOrderStatus.IN_PROGRESS ? (
                          <Play className="h-4 w-4" />
                        ) : transition === WorkOrderStatus.COMPLETED || transition === WorkOrderStatus.TAMAMLANDI ? (
                          <Check className="h-4 w-4" />
                        ) : transition === WorkOrderStatus.REJECTED ? (
                          <XCircle className="h-4 w-4" />
                        ) : transition === WorkOrderStatus.APPROVED ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        {STATUS_LABELS[transition]}
                      </Button>
                    ))}
                  </div>

                  {showNotesInput && (
                    <div className="space-y-2">
                      <Label htmlFor="notes">Not / Açıklama</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Durum değişikliği için not girin..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => pendingTransition && handleStatusChange(pendingTransition)}
                          disabled={!notes.trim()}
                        >
                          Onayla ve Kaydet
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowNotesInput(false);
                            setNotes('');
                            setPendingTransition(null);
                          }}
                        >
                          İptal
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* İş Emri Kalemleri */}
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">İş Emri Kalemleri</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Henüz kalem eklenmemiş.</p>
                {/* TODO: WorkOrderItem listesi */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kişiler */}
          <TabsContent value="persons">
            <WorkOrderPersonList
              workOrderId={workOrder.Id}
              persons={persons}
              onAdd={addPerson}
              onEdit={updatePerson}
              onDelete={deletePerson}
            />
            {personsError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {personsError}
              </div>
            )}
          </TabsContent>

          {/* Belgeler */}
          <TabsContent value="documents">
            <DocumentUpload
              category="WORK_ORDER"
              workOrderId={workOrder.Id}
              onUploadComplete={(documentId) => {
                console.log('Document uploaded:', documentId);
                // TODO: Belge listesini yenile
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
