import { create } from 'zustand';

interface RequestMetaState {
  lastRequestId?: string;
  lastErrorCode?: string;
  setRequestId: (id?: string) => void;
  setErrorCode: (code?: string) => void;
  reset: () => void;
}

export const useRequestMetaStore = create<RequestMetaState>((set) => ({
  lastRequestId: undefined,
  lastErrorCode: undefined,
  setRequestId: (id) => set({ lastRequestId: id }),
  setErrorCode: (code) => set({ lastErrorCode: code }),
  reset: () => set({ lastRequestId: undefined, lastErrorCode: undefined })
}));
