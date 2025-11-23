/**
 * Pagination Component
 * 
 * Reusable pagination controls for paginated lists
 * Uses PaginationMeta from backend response
 * 
 * @example
 * const { data } = useCariListPaginated({ page, page_size: 20 });
 * 
 * <Pagination
 *   pagination={data.pagination}
 *   onPageChange={(newPage) => setPage(newPage)}
 * />
 */

import type { PaginationMeta } from '../types/common.types';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ pagination, onPageChange, className = '' }: PaginationProps) {
  const { page, page_size, total, total_pages, has_next, has_prev } = pagination;

  // Sayfa numaralarını oluştur (akıllı sayfalama: mevcut sayfa etrafında 2 sayfa)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 7;

    if (total_pages <= maxPagesToShow) {
      // Tüm sayfaları göster
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // İlk sayfa her zaman
      pages.push(1);

      // Başlangıç ve bitiş aralıkları
      let start = Math.max(2, page - 1);
      let end = Math.min(total_pages - 1, page + 1);

      // Sol tarafta boşluk varsa ellipsis ekle
      if (start > 2) {
        pages.push('...');
      }

      // Orta sayfalar
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Sağ tarafta boşluk varsa ellipsis ekle
      if (end < total_pages - 1) {
        pages.push('...');
      }

      // Son sayfa her zaman
      if (total_pages > 1) {
        pages.push(total_pages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 ${className}`}>
      {/* Sol: Toplam kayıt bilgisi */}
      <div className="flex-1 flex justify-between sm:hidden">
        {/* Mobile view - basit prev/next */}
        <button type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!has_prev}
          aria-disabled={!has_prev}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Önceki
        </button>
        <button type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!has_next}
          aria-disabled={!has_next}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sonraki
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{total}</span> kayıt bulundu
            {total > 0 && (
              <>
                {' '}
                (
                <span className="font-medium">{(page - 1) * page_size + 1}</span>
                {' - '}
                <span className="font-medium">{Math.min(page * page_size, total)}</span>
                {' '}arası gösteriliyor)
              </>
            )}
          </p>
        </div>

        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label={`Sayfalama; toplam ${total_pages} sayfa`}>
            {/* Previous button */}
            <button type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={!has_prev}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Önceki sayfa"
              aria-disabled={!has_prev}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Page numbers */}
            {pageNumbers.map((pageNum, idx) => {
              if (pageNum === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }

              const isCurrentPage = pageNum === page;
              return (
                <button type="button"
                  key={pageNum}
                  onClick={() => onPageChange(pageNum as number)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                  aria-current={isCurrentPage ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next button */}
            <button type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={!has_next}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sonraki sayfa"
              aria-disabled={!has_next}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

/**
 * Basit pagination variant (daha kompakt)
 */
interface SimplePaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({ pagination, onPageChange, className = '' }: SimplePaginationProps) {
  const { page, total_pages, has_next, has_prev, total } = pagination;

  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      <div className="text-sm text-gray-700">
        <span className="font-medium">{total}</span> kayıt
      </div>

      <div className="flex items-center gap-2">
        <button type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!has_prev}
          aria-disabled={!has_prev}
          className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Önceki
        </button>

        <span className="px-3 py-1 text-sm text-gray-700">
          {page} / {total_pages}
        </span>

        <button type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!has_next}
          aria-disabled={!has_next}
          className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
