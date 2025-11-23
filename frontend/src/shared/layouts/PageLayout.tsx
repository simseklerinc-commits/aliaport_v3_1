import React from 'react';

interface PageLayoutProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ title, description, actions, children }) => {
  return (
    <div className="page-layout flex flex-col gap-4">
      {(title || description || actions) && (
        <div className="page-header flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              {title && <h1 className="text-lg font-semibold tracking-tight">{title}</h1>}
              {description && <p className="text-sm text-neutral-600 max-w-3xl">{description}</p>}
            </div>
            {actions && <div className="actions flex items-center gap-2">{actions}</div>}
          </div>
          <div className="h-px w-full bg-neutral-200" />
        </div>
      )}
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
