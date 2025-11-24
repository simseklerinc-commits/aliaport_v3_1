/**
 * MODERN LIST COMPONENTS - USAGE EXAMPLES
 * 
 * Virtual scroll list bileşenlerinin örnek kullanımları
 */

import { VirtualList, VirtualTable } from '@/shared/ui/VirtualList';
import { InfiniteVirtualList, InfiniteVirtualTable } from '@/shared/ui/InfiniteVirtualList';
import { DataTable } from '@/shared/ui/DataTable';
import type { Cari } from '@/shared/types/cari';

// =====================================================
// EXAMPLE 1: Simple Virtual List
// =====================================================

export function CariVirtualListExample({ items }: { items: Cari[] }) {
  return (
    <VirtualList
      data={items}
      estimateSize={80}
      renderItem={(cari, index) => (
        <div className="p-4 border-b hover:bg-gray-50">
          <div className="flex justify-between">
            <div>
              <div className="font-semibold">{cari.CariKod}</div>
              <div className="text-sm text-gray-600">{cari.Unvan}</div>
            </div>
            <div className="text-sm text-gray-500">
              {cari.CariTip} · {cari.Rol}
            </div>
          </div>
        </div>
      )}
      getItemKey={(cari) => cari.Id}
      className="h-[600px] border rounded-lg"
      emptyMessage="Henüz cari kaydı bulunmuyor"
    />
  );
}

// =====================================================
// EXAMPLE 2: Virtual Table
// =====================================================

export function CariVirtualTableExample({ items }: { items: Cari[] }) {
  return (
    <VirtualTable
      data={items}
      columns={[
        {
          key: 'CariKod',
          header: 'Cari Kodu',
          width: 'w-32',
          render: (cari) => (
            <span className="font-mono text-sm">{cari.CariKod}</span>
          ),
        },
        {
          key: 'Unvan',
          header: 'Ünvan',
          render: (cari) => (
            <span className="font-medium">{cari.Unvan}</span>
          ),
        },
        {
          key: 'CariTip',
          header: 'Tip',
          width: 'w-24',
          align: 'center',
          render: (cari) => (
            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
              {cari.CariTip}
            </span>
          ),
        },
        {
          key: 'Rol',
          header: 'Rol',
          width: 'w-28',
          render: (cari) => cari.Rol,
        },
        {
          key: 'AktifMi',
          header: 'Durum',
          width: 'w-24',
          align: 'center',
          render: (cari) => (
            <span
              className={`px-2 py-1 text-xs rounded ${
                cari.AktifMi
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cari.AktifMi ? 'Aktif' : 'Pasif'}
            </span>
          ),
        },
      ]}
      getItemKey={(cari) => cari.Id}
      onRowClick={(cari) => console.log('Clicked:', cari.CariKod)}
      emptyMessage="Kayıt bulunamadı"
    />
  );
}

// =====================================================
// EXAMPLE 3: Infinite Virtual List (React Query Integration)
// =====================================================

import { useInfiniteQuery } from '@tanstack/react-query';
import { cariApi } from '@/lib/api';

export function CariInfiniteListExample() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['cari-infinite'],
    queryFn: ({ pageParam = 1 }) =>
      cariApi.getAll({ page: pageParam, page_size: 50 }).then(res => res.data),
    getNextPageParam: (lastPage, pages) => {
      const total = lastPage.pagination?.total || 0;
      const loaded = pages.length * 50;
      return loaded < total ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allItems = data?.pages.flatMap((page) => page.data || []) || [];

  return (
    <InfiniteVirtualList
      data={allItems}
      hasMore={!!hasNextPage}
      onLoadMore={fetchNextPage}
      isLoading={isFetchingNextPage}
      estimateSize={80}
      renderItem={(cari) => (
        <div className="p-4 border-b hover:bg-gray-50 cursor-pointer">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{cari.CariKod}</div>
              <div className="text-sm text-gray-600">{cari.Unvan}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{cari.Rol}</div>
              <div className="text-xs text-gray-500">{cari.CariTip}</div>
            </div>
          </div>
        </div>
      )}
      getItemKey={(cari) => cari.Id}
      emptyMessage="Henüz cari kaydı bulunmuyor"
      height="h-[700px]"
    />
  );
}

// =====================================================
// EXAMPLE 4: Advanced Data Table (Sortable + Filterable + Selectable)
// =====================================================

export function CariDataTableExample({ items }: { items: Cari[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  return (
    <div>
      <DataTable
        data={items}
        columns={[
          {
            key: 'CariKod',
            header: 'Cari Kodu',
            width: 'w-32',
            sortable: true,
            filterable: true,
            getValue: (cari) => cari.CariKod,
          },
          {
            key: 'Unvan',
            header: 'Ünvan',
            sortable: true,
            filterable: true,
            getValue: (cari) => cari.Unvan,
          },
          {
            key: 'CariTip',
            header: 'Tip',
            width: 'w-28',
            sortable: true,
            align: 'center',
            render: (cari) => (
              <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                {cari.CariTip}
              </span>
            ),
          },
          {
            key: 'Rol',
            header: 'Rol',
            width: 'w-28',
            sortable: true,
            getValue: (cari) => cari.Rol,
          },
          {
            key: 'Il',
            header: 'Şehir',
            width: 'w-32',
            sortable: true,
            filterable: true,
            getValue: (cari) => cari.Il || '-',
          },
          {
            key: 'AktifMi',
            header: 'Durum',
            width: 'w-24',
            sortable: true,
            align: 'center',
            render: (cari) => (
              <span
                className={`px-2 py-1 text-xs rounded ${
                  cari.AktifMi
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cari.AktifMi ? 'Aktif' : 'Pasif'}
              </span>
            ),
            getValue: (cari) => cari.AktifMi ? 1 : 0,
          },
        ]}
        getItemKey={(cari) => cari.Id}
        selectable
        onSelectionChange={(selected) => {
          setSelectedIds(selected);
          console.log('Seçili kayıtlar:', Array.from(selected));
        }}
        onRowClick={(cari) => console.log('Clicked:', cari.CariKod)}
        globalSearch
        height="h-[600px]"
        emptyMessage="Kayıt bulunamadı"
      />

      {selectedIds.size > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">
              {selectedIds.size} kayıt seçildi
            </span>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Toplu İşlem
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Seçimi Temizle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
