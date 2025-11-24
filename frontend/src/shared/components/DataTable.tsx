/**
 * SHARED COMPONENTS - Generic DataTable
 * Tüm modüllerde kullanılabilir generic tablo bileşeni
 */

import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Search, Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string | null;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  addButtonText?: string;
  emptyMessage?: string;
  itemsPerPage?: number;
  getItemKey: (item: T) => string | number;
}

export function DataTable<T>({
  title,
  data,
  columns,
  loading = false,
  error = null,
  searchable = true,
  searchPlaceholder = 'Ara...',
  searchKeys = [],
  onAdd,
  onEdit,
  onDelete,
  onView,
  addButtonText = 'Yeni Ekle',
  emptyMessage = 'Henüz kayıt yok',
  itemsPerPage = 10,
  getItemKey,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Arama filtresi
  const filteredData = searchable && searchQuery
    ? data.filter((item) => {
        const query = searchQuery.toLowerCase();
        return searchKeys.some((key) => {
          const value = item[key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(query);
        });
      })
    : data;

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Sayfa değiştiğinde başa dön
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">Hata: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {onAdd && (
            <Button onClick={onAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {addButtonText}
            </Button>
          )}
        </div>
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-gray-300 focus:border-cyan-500"
            />
          </div>
        )}
      </div>
      <div className="p-6">
        {paginatedData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery ? 'Arama sonucu bulunamadı' : emptyMessage}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-800 rounded-lg">
              <table className="w-full bg-gray-950">
                <thead className="bg-gray-900 border-b border-gray-800">
                  <tr>
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider"
                        style={{ width: column.width }}
                      >
                        {column.header}
                      </th>
                    ))}
                    {(onEdit || onDelete || onView) && (
                      <th className="text-right p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">İşlemler</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr key={getItemKey(item)} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                      {columns.map((column, colIndex) => (
                        <td key={colIndex} className="p-4 text-gray-300">
                          {column.render
                            ? column.render(item)
                            : String(item[column.key as keyof T] ?? '-')}
                        </td>
                      ))}
                      {(onEdit || onDelete || onView) && (
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            {onView && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onView(item)}
                                title="Görüntüle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                title="Düzenle"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(item)}
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {filteredData.length} kayıttan {startIndex + 1}-
                  {Math.min(endIndex, filteredData.length)} arası gösteriliyor
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-gray-400">
                    Sayfa {currentPage} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
