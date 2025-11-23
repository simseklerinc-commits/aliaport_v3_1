import { create } from "zustand";
import { persistStore } from './persistConfig';

interface UserInfo {
  id: string;
  name: string;
  roles: string[];
}

interface AuthState {
  user: UserInfo | null;
  token: string | null; // gelecekte JWT veya session id
  loading: boolean;
  setUser: (user: UserInfo | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const { state: initialState, save } = persistStore<AuthState>(
  'auth_store_v1',
  {
    user: null,
    token: null,
    loading: false,
    setUser: () => {},
    setToken: () => {},
    setLoading: () => {},
    logout: () => {}
  },
  {
    partialize: (s) => ({ user: s.user, token: s.token })
  }
);

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setUser: (user) => set((s) => { const next = { ...s, user }; save(next); return next; }),
  setToken: (token) => set((s) => { const next = { ...s, token }; save(next); return next; }),
  setLoading: (loading) => set({ loading }),
  logout: () => set((s) => { const next = { ...s, user: null, token: null }; save(next); return next; })
}));
