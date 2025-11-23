/**
 * KURLAR FEATURE - Main Module Component
 */

import React from 'react';
import { useKurlarList, useKurlarMutations } from '../hooks/useKurlar';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { ModuleLayout } from '../../../components/layouts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';

export function KurlarModule() {
  const { kurlarList, isLoading, error, refetch } = useKurlarList();
  const { fetchTCMB, isFetching } = useKurlarMutations();

  const handleTCMBUpdate = async () => {
    const success = await fetchTCMB();
    if (success) refetch();
  };

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

  return (
    <ModuleLayout
      title="Döviz Kurları"
      description="Güncel döviz kurları ve TCMB entegrasyonu"
      icon={TrendingUp}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kur Listesi</CardTitle>
              <CardDescription>Toplam {kurlarList.length} kur kaydı</CardDescription>
            </div>
            <Button onClick={handleTCMBUpdate} disabled={isFetching}>
              {isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              TCMB Güncelle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Para Birimi</TableHead>
                  <TableHead>Alış</TableHead>
                  <TableHead>Satış</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kaynak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kurlarList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Henüz kur kaydı bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  kurlarList.map((kur) => (
                    <TableRow key={kur.Id}>
                      <TableCell className="font-medium">
                        {kur.CurrencyFrom}/{kur.CurrencyTo}
                      </TableCell>
                      <TableCell>{kur.Rate?.toFixed(4) || '-'}</TableCell>
                      <TableCell>{kur.SellRate?.toFixed(4) || '-'}</TableCell>
                      <TableCell>
                        {kur.RateDate ? new Date(kur.RateDate).toLocaleDateString('tr-TR') : '-'}
                      </TableCell>
                      <TableCell>{kur.Source || '-'}</TableCell>
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
