// Generic persistence utilities for Zustand stores

interface PersistOptions<T> {
  key: string;
  version?: number;
  migrate?: (storedValue: any) => T;
  partialize?: (state: T) => Partial<T>;
}

const storage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore quota errors
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};

export function persistStore<T extends Record<string, any>>(key: string, initial: T, options?: Omit<PersistOptions<T>, 'key'>) {
  const storedRaw = storage.getItem(key);
  let state: T = initial;
  if (storedRaw) {
    try {
      const parsed = JSON.parse(storedRaw);
      state = options?.migrate ? options.migrate(parsed) : { ...state, ...parsed };
    } catch {
      // malformed JSON ignored
    }
  }
  const save = (current: T) => {
    const toStore = options?.partialize ? options.partialize(current) : current;
    storage.setItem(key, JSON.stringify(toStore));
  };
  return { state, save };
}
