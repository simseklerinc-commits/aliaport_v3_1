import React, { useState } from "react";
import { usePaginated } from "@/src/core/hooks/usePaginated"; // adjust alias if needed
import { WorkOrder } from "@/src/shared/types/workorder";
import { Loader } from "@/src/shared/ui/Loader";
import { ErrorMessage } from "@/src/shared/ui/ErrorMessage";
import { PaginationControls } from "@/src/shared/ui/PaginationControls";

// Örnek İş Emri Liste Componenti (Pagination + Arama)
export const WorkOrderList: React.FC = () => {
  const [search, setSearch] = useState("");
  const { items, loading, error, page, totalPages, hasNext, hasPrev, setPage, refetch } = usePaginated<WorkOrder>(
    "/work-order",
    {
      pageSize: 20,
      query: search ? { search } : undefined,
      enabled: true,
      dependencies: [search]
    }
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">İş Emirleri</h2>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ara (no / konu / açıklama)"
            className="border px-2 py-1 rounded text-sm w-64"
          />
          <button
            onClick={() => refetch()}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Yenile
          </button>
        </div>
      </header>

      {loading && <Loader label="Liste yükleniyor" />}
      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!loading && !error && (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr className="text-left">
                <th className="px-3 py-2">No</th>
                <th className="px-3 py-2">Konu</th>
                <th className="px-3 py-2">Cari</th>
                <th className="px-3 py-2">Durum</th>
                <th className="px-3 py-2">Öncelik</th>
                <th className="px-3 py-2">Tip</th>
                <th className="px-3 py-2">Oluşturma</th>
              </tr>
            </thead>
            <tbody>
              {items.map((wo) => (
                <tr key={wo.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 font-mono text-xs">{wo.wo_number}</td>
                  <td className="px-3 py-2">{wo.subject}</td>
                  <td className="px-3 py-2">{wo.cari_code}</td>
                  <td className="px-3 py-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">{wo.status}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">{wo.priority}</td>
                  <td className="px-3 py-2 text-xs">{wo.type}</td>
                  <td className="px-3 py-2 text-xs">{new Date(wo.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-500 text-sm">
                    Kayıt bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onChange={(p) => setPage(p)}
      />
    </div>
  );
};
