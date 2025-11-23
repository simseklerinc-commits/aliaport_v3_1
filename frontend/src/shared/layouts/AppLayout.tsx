import React from 'react';
import '../index.css';
import '../../assets/styles/a11y.css';

interface AppLayoutProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ header, sidebar, children, footer }) => {
  return (
    <div className="app-layout flex h-screen w-full bg-neutral-50 text-neutral-900">
      {/* Skip link erişilebilirlik için */}
      <a href="#main-content" className="skip-link">İçeriğe geç</a>
      {sidebar && (
        <aside className="sidebar w-64 border-r border-neutral-200 bg-white flex-shrink-0 overflow-y-auto" aria-label="Yan menü">
          {sidebar}
        </aside>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        {header && (
          <header className="header h-14 border-b border-neutral-200 bg-white flex items-center px-4 shadow-sm" role="banner">
            {header}
          </header>
        )}
        <main id="main-content" className="flex-1 overflow-y-auto p-4" role="main">
          {children}
        </main>
        {footer && (
          <footer className="footer h-10 border-t border-neutral-200 bg-white flex items-center px-4 text-xs text-neutral-500" role="contentinfo">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export default AppLayout;
