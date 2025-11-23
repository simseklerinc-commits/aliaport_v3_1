import React from 'react';
import '../index.css';

interface AppLayoutProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ header, sidebar, children, footer }) => {
  return (
    <div className="app-layout flex h-screen w-full bg-neutral-50 text-neutral-900">
      {sidebar && (
        <aside className="sidebar w-64 border-r border-neutral-200 bg-white flex-shrink-0 overflow-y-auto">
          {sidebar}
        </aside>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        {header && (
          <header className="header h-14 border-b border-neutral-200 bg-white flex items-center px-4 shadow-sm">
            {header}
          </header>
        )}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
        {footer && (
          <footer className="footer h-10 border-t border-neutral-200 bg-white flex items-center px-4 text-xs text-neutral-500">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default AppLayout;
