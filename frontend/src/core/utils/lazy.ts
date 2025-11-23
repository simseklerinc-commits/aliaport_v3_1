import React from 'react';

// preload destekli React.lazy sarmalayıcı
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const Component = React.lazy(factory) as T & {
    preload?: () => Promise<{ default: T }>;
  };
  (Component as any).preload = factory;
  return Component;
}

// Örnek: const Feature = lazyWithPreload(() => import('@/features/feature'));
// Menü hover: (Feature as any).preload();