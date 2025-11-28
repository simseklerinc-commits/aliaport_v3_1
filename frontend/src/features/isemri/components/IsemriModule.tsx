/**
 * İŞ EMRİ MODÜLÜ - Main Module Component
 */

import React from 'react';
import { WorkOrderListModern } from './IsemriListModern';
import { useIsemriStats } from '../hooks/useIsemri';
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
  const { stats } = useIsemriStats();

  return (
    <ModuleLayout
      title="İş Emirleri"
      description="İş emri takip ve yönetim sistemi"
      icon={ClipboardList}
    >
      {/* Stats Cards - Runbook Uyumlu */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Onay Bekleyen
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {stats.ByStatus?.SUBMITTED || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.ByStatus?.SUBMITTED || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">İş emirleri onay bekliyor</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Eksik Belgeler
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {stats.MissingDocuments || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.MissingDocuments || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Zorunlu belgeler eksik</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Aktif İş Emirleri
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {stats.Active || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.Active || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sahada veya devam eden</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                Bugün Biten
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {stats.DueToday || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.DueToday || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bugün tamamlanmalı</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modern Work Orders List */}
      <WorkOrderListModern />
    </ModuleLayout>
  );
}
