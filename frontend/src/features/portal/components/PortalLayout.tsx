// frontend/src/features/portal/components/PortalLayout.tsx
import React from 'react';
import { usePortalAuth } from '../context/PortalAuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  User, 
  LogOut,
  Menu,
  X,
  Bell,
  Upload,
  Users,
  Car
} from 'lucide-react';

interface PortalLayoutProps {
  children: React.ReactNode;
  currentRoute: string;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ children, currentRoute }) => {
  const { user, logout } = usePortalAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: LayoutDashboard },
    { id: 'work-orders', label: 'Taleplerim', icon: FileText },
    { id: 'new-request', label: 'Yeni Talep', icon: PlusCircle },
    { id: 'employees', label: 'Firma Çalışanları', icon: Users },
    { id: 'vehicles', label: 'Araçlarım', icon: Car },
    { id: 'documents', label: 'Belgelerim', icon: Upload },
    { id: 'profile', label: 'Profilim', icon: User },
  ];

  const handleNavigate = (route: string) => {
    window.location.hash = route;
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Aliaport Portal</h1>
              <p className="text-xs text-gray-500">{user?.cari_code || 'Firma Portalı'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            
            <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.position || 'Firma Temsilcisi'}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] sticky top-16">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </aside>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
            <aside className="w-64 bg-white h-full" onClick={(e) => e.stopPropagation()}>
              <nav className="p-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Çıkış Yap</span>
                </button>
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
};
