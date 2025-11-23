import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  createdAt: number;
  autoDismissMs?: number;
}

interface ToastState {
  toasts: Toast[];
  add: (t: Omit<Toast, 'id' | 'createdAt'>) => string;
  remove: (id: string) => void;
  clear: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (t) => {
    const id = generateId();
    const toast: Toast = { id, createdAt: Date.now(), ...t };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    if (t.autoDismissMs && t.autoDismissMs > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
      }, t.autoDismissMs);
    }
    return id;
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clear: () => set({ toasts: [] })
}));

export function pushToast(type: ToastType, message: string, opts?: { description?: string; autoDismissMs?: number }) {
  return useToastStore.getState().add({ type, message, description: opts?.description, autoDismissMs: opts?.autoDismissMs });
}
