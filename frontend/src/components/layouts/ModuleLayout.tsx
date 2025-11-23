/**
 * MODULE LAYOUT - Tüm modüller için ortak layout komponenti
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ModuleLayoutProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function ModuleLayout({ title, description, icon: Icon, children }: ModuleLayoutProps) {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2 flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8 text-primary" />}
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
