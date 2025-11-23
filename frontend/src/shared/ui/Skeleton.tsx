import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    aria-hidden="true"
  />
);

interface LineSkeletonProps {
  lines?: number;
  className?: string;
}

export const LineSkeleton: React.FC<LineSkeletonProps> = ({ lines = 3, className = '' }) => (
  <div className={className} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="animate-pulse h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 last:mb-0" />
    ))}
  </div>
);

interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ lines = 4, className = '' }) => (
  <div
    className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800 ${className}`}
    role="presentation"
  >
    <div className="h-4 w-1/3 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
    <LineSkeleton lines={lines} />
    <div className="h-8 w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
);

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns = 6, rows = 8, className = '' }) => (
  <div className={`overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 ${className}`} role="presentation">
    <div className="w-full">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-10 px-4 py-2 flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="h-3 w-2/3 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid" 
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="h-12 px-4 py-3 flex items-center border-b border-gray-200 dark:border-gray-700">
              <div className="h-3 w-1/2 animate-pulse bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Accessibility Notu:
// Skeleton bileşenleri aria-hidden="true" veya role="presentation" ile işaretlendi.
// Gerçek içerik yüklendiğinde (loading false), odak veya screen reader sırasına dahil edilir.
