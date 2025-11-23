/**
 * İŞ EMRİ MODÜLÜ - Main Module Component
 */

import React from 'react';
import { useIsemriList, useIsemriStats } from '../hooks/useIsemri';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Loader2, FileText, ClipboardList } from 'lucide-react';
import { ModuleLayout } from '../../../components/layouts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { WorkOrderStatus, WorkOrderPriority } from '../types/isemri.types';

export function IsemriModule() {
  const { isemriList, isLoading, error, refetch } = useIsemriList();
  const { stats } = useIsemriStats();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refetch}>Tekrar Dene</Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: WorkOrderStatus) => {
    const variants: Record<WorkOrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [WorkOrderStatus.DRAFT]: 'outline',
      [WorkOrderStatus.SUBMITTED]: 'secondary',
      [WorkOrderStatus.APPROVED]: 'default',
      [WorkOrderStatus.SAHADA]: 'default',
      [WorkOrderStatus.TAMAMLANDI]: 'default',
      [WorkOrderStatus.FATURALANDI]: 'default',
      [WorkOrderStatus.KAPANDI]: 'secondary',
      [WorkOrderStatus.REJECTED]: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: WorkOrderPriority) => {
    const variants: Record<WorkOrderPriority, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      [WorkOrderPriority.LOW]: 'outline',
      [WorkOrderPriority.MEDIUM]: 'secondary',
      [WorkOrderPriority.HIGH]: 'default',
      [WorkOrderPriority.URGENT]: 'destructive',
    };
    return <Badge variant={variants[priority]}>{priority}</Badge>;
  };

  return (
    <ModuleLayout
      title="İş Emirleri"
      description="İş emri takip ve yönetim sistemi"
      icon={ClipboardList}
    >
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam İş Emri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.Total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Onay Bekleyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.ByStatus?.SUBMITTED || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sahada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.ByStatus?.SAHADA || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tamamlanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.ByStatus?.TAMAMLANDI || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Work Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>İş Emri Listesi</CardTitle>
              <CardDescription>Toplam {isemriList.length} iş emri</CardDescription>
            </div>
            <Button onClick={refetch}>
              <FileText className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İş Emri No</TableHead>
                  <TableHead>Cari</TableHead>
                  <TableHead>Konu</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Öncelik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isemriList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Henüz iş emri kaydı bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  isemriList.map((wo) => (
                    <TableRow key={wo.Id}>
                      <TableCell className="font-medium">{wo.WONumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{wo.CariCode}</div>
                          <div className="text-sm text-muted-foreground">{wo.CariTitle}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{wo.Subject}</TableCell>
                      <TableCell>{wo.Type}</TableCell>
                      <TableCell>{getPriorityBadge(wo.Priority)}</TableCell>
                      <TableCell>{getStatusBadge(wo.Status)}</TableCell>
                      <TableCell>
                        {new Date(wo.CreatedAt).toLocaleDateString('tr-TR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </ModuleLayout>
  );
}
