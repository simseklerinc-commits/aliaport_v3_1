/**
 * MODULE LAYOUT - Tüm modüller için ortak layout komponenti
 * Figma tasarımı: Minimal, clean dark theme
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
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {Icon && <Icon className="w-6 h-6 text-cyan-500" />}
              <h1 className="text-2xl font-semibold text-white">{title}</h1>
            </div>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
      </div>

      {/* Content Section - Scrollable */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {children}
      </div>
    </div>
  );
}
