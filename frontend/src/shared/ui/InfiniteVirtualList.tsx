/**
 * INFINITE VIRTUAL LIST
 * 
 * Virtual scroll + Infinite loading kombinasyonu
 * Sayfa scroll ederken otomatik veri yükleme
 * React Query ile entegre
 * 
 * @example
 * <InfiniteVirtualList
 *   data={allLoadedItems}
 *   hasMore={hasNextPage}
 *   onLoadMore={fetchNextPage}
 *   isLoading={isFetchingNextPage}
 *   renderItem={(item) => <ItemCard data={item} />}
 * />
 */

import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface InfiniteVirtualListProps<T> {
  data: T[];
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
  estimateSize?: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  height?: string; // Tailwind height class
}

export function InfiniteVirtualList<T>({
  data,
  hasMore,
  onLoadMore,
  isLoading = false,
  estimateSize = 80,
  overscan = 5,
  renderItem,
  getItemKey,
  className = '',
  emptyMessage = 'Kayıt bulunamadı',
  loadingMessage = 'Yükleniyor...',
  height = 'h-[600px]',
}: InfiniteVirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasMore ? data.length + 1 : data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll trigger
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= data.length - 1 &&
      hasMore &&
      !isLoading
    ) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, data.length, isLoading, virtualItems]);

  if (data.length === 0 && !isLoading) {
    return (
      <div className={`flex items-center justify-center ${height} text-gray-500`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${height} ${className}`}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const isLoaderRow = virtualItem.index > data.length - 1;
          const item = data[virtualItem.index];
          const key = getItemKey && !isLoaderRow
            ? getItemKey(item, virtualItem.index)
            : virtualItem.index;

          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>{loadingMessage}</span>
                  </div>
                </div>
              ) : (
                renderItem(item, virtualItem.index)
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * INFINITE VIRTUAL TABLE
 * Tablo formatında infinite scroll
 */

import type { VirtualTableColumn } from './VirtualList';

export interface InfiniteVirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
  estimateSize?: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  height?: string;
}

export function InfiniteVirtualTable<T>({
  data,
  columns,
  hasMore,
  onLoadMore,
  isLoading = false,
  estimateSize = 56,
  overscan = 5,
  getItemKey,
  className = '',
  emptyMessage = 'Kayıt bulunamadı',
  onRowClick,
  height = 'h-[600px]',
}: InfiniteVirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasMore ? data.length + 1 : data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll trigger
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= data.length - 1 &&
      hasMore &&
      !isLoading
    ) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, data.length, isLoading, virtualItems]);

  if (data.length === 0 && !isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b">
          <div className="flex items-center px-4 py-3">
            {columns.map((col) => (
              <div
                key={col.key}
                className={`font-semibold text-sm text-gray-700 ${col.width || 'flex-1'} ${
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                }`}
              >
                {col.header}
              </div>
            ))}
          </div>
        </div>
        {/* Empty state */}
        <div className={`flex items-center justify-center ${height} text-gray-500`}>
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header (fixed) */}
      <div className="bg-gray-50 border-b sticky top-0 z-10">
        <div className="flex items-center px-4 py-3">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`font-semibold text-sm text-gray-700 ${col.width || 'flex-1'} ${
                col.align === 'center'
                  ? 'text-center'
                  : col.align === 'right'
                  ? 'text-right'
                  : 'text-left'
              }`}
            >
              {col.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual scrollable body */}
      <div
        ref={parentRef}
        className={`overflow-auto ${height}`}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const isLoaderRow = virtualItem.index > data.length - 1;
            const item = data[virtualItem.index];
            const key = getItemKey && !isLoaderRow
              ? getItemKey(item, virtualItem.index)
              : virtualItem.index;

            return (
              <div
                key={key}
                className={`absolute top-0 left-0 w-full border-b ${
                  isLoaderRow ? '' : 'hover:bg-gray-50'
                } ${onRowClick && !isLoaderRow ? 'cursor-pointer' : ''}`}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => !isLoaderRow && onRowClick?.(item)}
              >
                {isLoaderRow ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Yükleniyor...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center px-4 py-3">
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        className={`${col.width || 'flex-1'} ${
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
                        {col.render(item, virtualItem.index)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
