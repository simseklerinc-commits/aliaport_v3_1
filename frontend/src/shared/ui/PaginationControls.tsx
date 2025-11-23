import React from "react";

interface Props {
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onChange: (page: number) => void;
}

export const PaginationControls: React.FC<Props> = ({ page, totalPages, hasNext, hasPrev, onChange }) => {
  return (
    <div className="flex items-center gap-2 text-xs mt-2">
      <button
        disabled={!hasPrev}
        onClick={() => hasPrev && onChange(page - 1)}
        className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Önceki
      </button>
      <span className="px-2">Sayfa {page} / {totalPages || 1}</span>
      <button
        disabled={!hasNext}
        onClick={() => hasNext && onChange(page + 1)}
        className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Sonraki
      </button>
    </div>
  );
};
