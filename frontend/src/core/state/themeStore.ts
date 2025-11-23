import { create } from "zustand";
import { persistStore } from './persistConfig';

type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const prefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const { state: themeInitial, save } = persistStore<ThemeState & { hydrated?: boolean }>(
  'theme_store_v1',
  { mode: prefersDark() ? 'dark' : 'light', setMode: () => {}, toggle: () => {}, hydrated: false },
  { partialize: (s) => ({ mode: s.mode }) }
);

export const useThemeStore = create<ThemeState>((set) => ({
  mode: themeInitial.mode,
  setMode: (m) => set((s) => { const next = { ...s, mode: m }; save(next as any); return next; }),
  toggle: () => set((s) => { const nextMode = s.mode === 'dark' ? 'light' : 'dark'; const next = { ...s, mode: nextMode }; save(next as any); return next; })
}));
