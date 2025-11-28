// frontend/src/PortalApp.tsx
import React, { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/cache/queryClient';
import { Toaster } from 'sonner';
import { PortalAuthProvider, usePortalAuth } from './features/portal/context/PortalAuthContext';
import { PortalLogin } from './features/portal/components/PortalLogin';
import { PortalDashboard } from './features/portal/components/PortalDashboard';
import { PortalLayout } from './features/portal/components/PortalLayout';
import { WorkOrderRequestForm } from './features/portal/components/WorkOrderRequestForm';
import { WorkOrderTrackingList } from './features/portal/components/WorkOrderTrackingList';
import { DocumentUpload } from './features/portal/components/DocumentUpload';
import { PortalProfile } from './features/portal/components/PortalProfile';
import { EmployeeManagement } from './features/portal/components/EmployeeManagement';
import { VehicleManagement } from './features/portal/components/VehicleManagement';

type PortalRoute = 'login' | 'dashboard' | 'work-orders' | 'new-request' | 'employees' | 'vehicles' | 'documents' | 'profile' | 'change-password';

function PortalRouter() {
  const { isAuthenticated, isLoading } = usePortalAuth();
  const [currentRoute, setCurrentRoute] = useState<PortalRoute>('login');

  useEffect(() => {
    // URL hash navigation
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'login';
      setCurrentRoute(hash as PortalRoute);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // Redirect logic
    if (isLoading) return;

    if (!isAuthenticated && currentRoute !== 'login') {
      window.location.hash = 'login';
    } else if (isAuthenticated && currentRoute === 'login') {
      window.location.hash = 'dashboard';
    }
  }, [isAuthenticated, isLoading, currentRoute]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PortalLogin />;
  }

  return (
    <PortalLayout currentRoute={currentRoute}>
      {currentRoute === 'dashboard' && <PortalDashboard />}
      {currentRoute === 'work-orders' && <WorkOrderTrackingList />}
      {currentRoute === 'new-request' && <WorkOrderRequestForm />}
      {currentRoute === 'employees' && <EmployeeManagement />}
      {currentRoute === 'vehicles' && <VehicleManagement />}
      {currentRoute === 'documents' && <DocumentUpload />}
      {currentRoute === 'profile' && <PortalProfile />}
      {currentRoute === 'change-password' && <div className="p-6">Şifre Değiştir (Yakında)</div>}
    </PortalLayout>
  );
}

export function PortalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <PortalAuthProvider>
        <PortalRouter />
        <Toaster position="top-right" richColors />
      </PortalAuthProvider>
    </QueryClientProvider>
  );
}
