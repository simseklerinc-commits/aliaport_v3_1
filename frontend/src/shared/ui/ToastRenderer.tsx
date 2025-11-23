import React from 'react';
import { useToastStore } from '../../core/state/toastStore';

export const ToastRenderer: React.FC = () => {
  const { toasts, remove } = useToastStore();
  if (!toasts.length) return null;
  return (
    <div className="fixed inset-x-0 top-2 flex flex-col items-center gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto min-w-[260px] max-w-sm px-4 py-3 rounded shadow text-sm border flex flex-col gap-1 bg-white ${
            t.type === 'success' ? 'border-green-300' : t.type === 'error' ? 'border-red-300' : t.type === 'warning' ? 'border-yellow-300' : 'border-neutral-300'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium capitalize">{t.type}</div>
            <button
              onClick={() => remove(t.id)}
              className="text-neutral-500 hover:text-neutral-800 transition"
            >×</button>
          </div>
          <div className="text-neutral-800">{t.message}</div>
          {t.description && <div className="text-neutral-500 text-xs leading-snug">{t.description}</div>}
        </div>
      ))}
    </div>
  );
};

export default ToastRenderer;
