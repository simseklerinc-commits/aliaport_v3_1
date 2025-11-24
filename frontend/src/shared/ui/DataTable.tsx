/**
 * ADVANCED DATA TABLE
 * 
 * Virtual scroll + sıralama + filtreleme + arama + selection
 * Enterprise-grade data table component
 * 
 * Features:
 * - Virtual scrolling (büyük dataset desteği)
 * - Column sorting (tek/çoklu)
 * - Column filtering
 * - Global search
 * - Row selection (checkbox)
 * - Custom cell renderers
 * - Sticky header
 * - Responsive
 * 
 * @example
 * <DataTable
 *   data={items}
 *   columns={[
 *     { key: 'id', header: 'ID', sortable: true },
 *     { key: 'name', header: 'Ad', sortable: true, filterable: true },
 *   ]}
 *   onSelectionChange={(selected) => console.log(selected)}
 * />
 */

import { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  getValue?: (item: T) => any; // For sorting/filtering
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getItemKey?: (item: T) => string | number;
  selectable?: boolean;
  onSelectionChange?: (selectedKeys: Set<string | number>) => void;
  onRowClick?: (item: T) => void;
  className?: string;
  height?: string;
  estimateSize?: number;
  emptyMessage?: string;
  isLoading?: boolean;
  globalSearch?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function DataTable<T>({
  data,
  columns,
  getItemKey,
  selectable = false,
  onSelectionChange,
  onRowClick,
  className = '',
  height = 'h-[600px]',
  estimateSize = 52,
  emptyMessage = 'Kayıt bulunamadı',
  isLoading = false,
  globalSearch = true,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());
  
  const parentRef = useRef<HTMLDivElement>(null);

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Global search
    if (globalSearch && searchTerm) {
      result = result.filter((item) =>
        columns.some((col) => {
          const value = col.getValue
            ? col.getValue(item)
            : (item as any)[col.key];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Column filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        result = result.filter((item) => {
          const col = columns.find((c) => c.key === key);
          const value = col?.getValue
            ? col.getValue(item)
            : (item as any)[key];
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    return result;
  }, [data, searchTerm, filters, columns, globalSearch]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const col = columns.find((c) => c.key === sortConfig.key);
      const aVal = col?.getValue ? col.getValue(a) : (a as any)[sortConfig.key];
      const bVal = col?.getValue ? col.getValue(b) : (b as any)[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, sortConfig, columns]);

  const virtualizer = useVirtualizer({
    count: isLoading ? 10 : sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 5,
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null; // Remove sort
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(
        sortedData.map((item) =>
          getItemKey ? getItemKey(item) : (item as any).id
        )
      );
      setSelectedKeys(allKeys);
      onSelectionChange?.(allKeys);
    } else {
      setSelectedKeys(new Set());
      onSelectionChange?.(new Set());
    }
  };

  const handleSelectRow = (item: T, checked: boolean) => {
    const key = getItemKey ? getItemKey(item) : (item as any).id;
    const newSelected = new Set(selectedKeys);
    
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }
    
    setSelectedKeys(newSelected);
    onSelectionChange?.(newSelected);
  };

  const allSelected = selectable && sortedData.length > 0 && selectedKeys.size === sortedData.length;
  const someSelected = selectable && selectedKeys.size > 0 && selectedKeys.size < sortedData.length;

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Search bar */}
      {globalSearch && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            {selectable && (
              <div className="w-12 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => el && (el.indeterminate = someSelected)}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {columns.map((col) => (
              <div
                key={col.key}
                className={`font-semibold text-sm text-gray-700 ${col.width || 'flex-1'} ${
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${col.sortable ? 'cursor-pointer hover:text-gray-900' : ''}`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  <span>{col.header}</span>
                  {col.sortable && sortConfig?.key === col.key && (
                    <span className="text-blue-600">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
                {col.filterable && (
                  <input
                    type="text"
                    placeholder="Filtrele..."
                    value={filters[col.key] || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      setFilters({ ...filters, [col.key]: e.target.value });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {!isLoading && sortedData.length === 0 && (
          <div className={`flex items-center justify-center ${height} text-gray-500`}>
            {emptyMessage}
          </div>
        )}

        {/* Body */}
        {(isLoading || sortedData.length > 0) && (
          <div ref={parentRef} className={`overflow-auto ${height}`}>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = sortedData[virtualItem.index];
                const itemKey = getItemKey ? getItemKey(item) : (item as any).id;
                const isSelected = selectedKeys.has(itemKey);

                return (
                  <div
                    key={itemKey || virtualItem.index}
                    className={`absolute top-0 left-0 w-full border-b ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                    style={{
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    onClick={() => onRowClick?.(item)}
                  >
                    {isLoading ? (
                      <div className="flex items-center px-4 py-3 gap-4">
                        {selectable && <div className="w-12" />}
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
                        {selectable && (
                          <div className="w-12 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectRow(item, e.target.checked);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
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
                            {col.render
                              ? col.render(item, virtualItem.index)
                              : String((item as any)[col.key] || '-')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      {selectable && selectedKeys.size > 0 && (
        <div className="mt-2 text-sm text-gray-600">
          {selectedKeys.size} / {sortedData.length} kayıt seçildi
        </div>
      )}
    </div>
  );
}
