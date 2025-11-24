/**
 * VIRTUAL LIST COMPONENT
 * 
 * @tanstack/react-virtual bazlı sanal scroll list bileşeni
 * Binlerce satır için optimize performans
 * 
 * @example
 * <VirtualList
 *   data={items}
 *   estimateSize={60}
 *   renderItem={(item) => <div>{item.name}</div>}
 * />
 */

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualListProps<T> {
  data: T[];
  estimateSize?: number; // Satır yüksekliği tahmini (px)
  overscan?: number; // Görünür alanın dışında render edilecek ekstra item sayısı
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingRows?: number;
}

export function VirtualList<T>({
  data,
  estimateSize = 50,
  overscan = 5,
  renderItem,
  getItemKey,
  className = '',
  emptyMessage = 'Kayıt bulunamadı',
  isLoading = false,
  loadingRows = 10,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: isLoading ? loadingRows : data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  if (!isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = data[virtualItem.index];
          const key = getItemKey
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
              {isLoading ? (
                <div className="animate-pulse bg-gray-100 h-full rounded mx-2 my-1" />
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
 * VIRTUAL TABLE COMPONENT
 * Tablo formatında sanal scroll
 */

export interface VirtualTableColumn<T> {
  key: string;
  header: string;
  width?: string; // Tailwind class (w-32, w-1/4, etc.)
  render: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  estimateSize?: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
}

export function VirtualTable<T>({
  data,
  columns,
  estimateSize = 56,
  overscan = 5,
  getItemKey,
  className = '',
  emptyMessage = 'Kayıt bulunamadı',
  isLoading = false,
  onRowClick,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: isLoading ? 10 : data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  if (!isLoading && data.length === 0) {
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
        <div className="flex items-center justify-center h-64 text-gray-500">
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
        className="overflow-auto"
        style={{ height: '600px' }} // Configurable height
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = data[virtualItem.index];
            const key = getItemKey
              ? getItemKey(item, virtualItem.index)
              : virtualItem.index;

            return (
              <div
                key={key}
                className={`absolute top-0 left-0 w-full border-b hover:bg-gray-50 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => onRowClick?.(item)}
              >
                {isLoading ? (
                  <div className="flex items-center px-4 py-3 gap-4">
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        className={`animate-pulse bg-gray-200 h-4 rounded ${
                          col.width || 'flex-1'
                        }`}
                      />
                    ))}
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
