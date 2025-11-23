/**
 * HIZMET MODULE - Hizmet List Component
 */

import React from 'react';
import { useHizmetList, useHizmetMutations } from '../hooks/useHizmet';
import type { Hizmet } from '../types/hizmet.types';
import { DataTable, Column, formatCurrency } from '../../../shared';

interface HizmetListProps {
  onEdit: (hizmet: Hizmet) => void;
  onView: (hizmet: Hizmet) => void;
  onAdd: () => void;
}

export function HizmetList({ onEdit, onView, onAdd }: HizmetListProps) {
  const { hizmetler, loading, error, refetch } = useHizmetList();
  const { deleteHizmet } = useHizmetMutations();

  const handleDelete = async (hizmet: Hizmet) => {
    if (window.confirm(`"${hizmet.Ad}" hizmetini silmek istediğinizden emin misiniz?`)) {
      const success = await deleteHizmet(hizmet.Id);
      if (success) {
        refetch();
      }
    }
  };

  const columns: Column<Hizmet>[] = [
    {
      key: 'Kod',
      header: 'Hizmet Kodu',
      width: '150px',
      render: (hizmet) => <span className="font-mono">{hizmet.Kod}</span>,
    },
    {
      key: 'Ad',
      header: 'Hizmet Adı',
      render: (hizmet) => (
        <div>
          <div className="font-medium">{hizmet.Ad}</div>
          {hizmet.Aciklama && (
            <div className="text-xs text-muted-foreground mt-1">
              {hizmet.Aciklama.substring(0, 60)}
              {hizmet.Aciklama.length > 60 ? '...' : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'GrupKod',
      header: 'Grup',
      width: '120px',
      render: (hizmet) => hizmet.GrupKod || '-',
    },
    {
      key: 'Birim',
      header: 'Birim',
      width: '80px',
      render: (hizmet) => hizmet.Birim || '-',
    },
    {
      key: 'Fiyat',
      header: 'Fiyat',
      width: '120px',
      render: (hizmet) =>
        hizmet.Fiyat
          ? formatCurrency(hizmet.Fiyat, hizmet.ParaBirimi || 'TRY')
          : '-',
    },
    {
      key: 'KdvOrani',
      header: 'KDV %',
      width: '80px',
      render: (hizmet) => (hizmet.KdvOrani ? `%${hizmet.KdvOrani}` : '-'),
    },
    {
      key: 'AktifMi',
      header: 'Durum',
      width: '100px',
      render: (hizmet) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
            hizmet.AktifMi !== false
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {hizmet.AktifMi !== false ? 'Aktif' : 'Pasif'}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      title="Hizmet Listesi"
      data={hizmetler}
      columns={columns}
      loading={loading}
      error={error}
      searchable
      searchPlaceholder="Hizmet ara (kod, ad, grup)..."
      searchKeys={['Kod', 'Ad', 'GrupKod', 'Aciklama']}
      onAdd={onAdd}
      onEdit={onEdit}
      onView={onView}
      onDelete={handleDelete}
      addButtonText="Yeni Hizmet"
      emptyMessage="Henüz hizmet kaydı yok"
      getItemKey={(hizmet) => hizmet.Id}
      itemsPerPage={15}
    />
  );
}
