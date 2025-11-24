import { FileText, Wrench, Users, Ship, Anchor, DollarSign, Settings, Archive, ChevronLeft, ChevronRight, BarChart3, Receipt, Tablet, Shield } from "lucide-react";
import { Theme } from "./ThemeSelector";
import { useState } from "react";
import { queryClient } from "@/core/cache/queryClient";
import { cariApi, motorbotApi, tarifeApi } from "@/lib/api";

// Prefetch helper: kritik listeleri hover'da cache'e al
async function prefetchCritical(id: string) {
  try {
    switch (id) {
      case 'cari':
        await queryClient.prefetchQuery({
          queryKey: ['cari','list',{page:1,page_size:20}],
          queryFn: async () => {
            const res = await cariApi.getAll({ page:1, page_size:20 });
            return res.items ?? res.data ?? res; // unwrap fallback
          },
          staleTime: 5 * 60 * 1000,
        });
        break;
      case 'mb-sefer':
        await queryClient.prefetchQuery({
          queryKey: ['sefer','list',{page:1,page_size:20}],
          queryFn: async () => {
            // seferApi listesi: modül export'u index üzerinden (dynamic import yerine doğrudan çağrı)
            const { seferApi } = await import('@/lib/api/sefer');
            const res = await seferApi.getAll({ page:1, page_size:20 });
            return res.items ?? res.data ?? res;
          },
          staleTime: 30 * 1000,
        });
        break;
      case 'hizmet':
        await queryClient.prefetchQuery({
          queryKey: ['hizmet','list',{page:1,page_size:50}],
          queryFn: async () => {
            const { hizmetApi } = await import('@/lib/api/hizmet');
            const res = await hizmetApi.getAll({ page:1, page_size:50 });
            return res.items ?? res.data ?? res;
          },
          staleTime: 30 * 60 * 1000,
        });
        break;
      case 'tarife':
        await queryClient.prefetchQuery({
          queryKey: ['tarife','list',{page:1,page_size:50}],
          queryFn: async () => {
            const res = await tarifeApi.getAll({ page:1, page_size:50 });
            return res.items ?? res.data ?? res;
          },
          staleTime: 30 * 60 * 1000,
        });
        break;
      case 'is-emri':
        await queryClient.prefetchQuery({
          queryKey: ['workorder','list',{page:1,page_size:20}],
          queryFn: async () => {
            const { workOrderApi } = await import('@/lib/api/is-emri');
            const res = await workOrderApi.getAll({ page:1, page_size:20 });
            return res.items ?? res.data ?? res;
          },
          staleTime: 30 * 1000,
        });
        break;
      default:
        break;
    }
  } catch {
    // Prefetch hatası kullanıcıya gösterilmez; sessiz geç
  }
}

interface SidebarProps {
  onNavigate: (page: string) => void;
  theme: Theme;
  currentPage?: string;
}

const menuItems = [
  {
    id: "is-emri",
    title: "İş Emri",
    icon: Wrench,
  },
  {
    id: "hizmet",
    title: "Hizmet",
    icon: FileText,
  },
  {
    id: "cari",
    title: "Cari",
    icon: Users,
  },
  {
    id: "mb-sefer",
    title: "MB Sefer",
    icon: Ship,
  },
  {
    id: "barinma",
    title: "Barınma",
    icon: Anchor,
  },
  {
    id: "kurlar",
    title: "Kurlar",
    icon: DollarSign,
  },
  {
    id: "parametreler",
    title: "Parametreler",
    icon: Settings,
  },
  {
    id: "dijital-arsiv",
    title: "Dijital Arşiv",
    icon: Archive,
  },
  {
    id: "raporlar",
    title: "Raporlar",
    icon: BarChart3,
  },
];

const sahaPersoneliItems = [
  {
    id: "saha-personeli",
    title: "Saha Personeli",
    icon: Tablet,
  },
  {
    id: "guvenlik",
    title: "Güvenlik",
    icon: Shield,
  },
];

export function Sidebar({ onNavigate, theme, currentPage }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`${theme.colors.bgCard} border-r ${theme.colors.border} h-screen sticky top-0 flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl">Aliaport</h1>
            <p className="text-xs text-gray-500">Liman Yönetimi</p>
          </div>
        )}
        {isCollapsed && (
          <div className="text-xl mx-auto">A</div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Main Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => prefetchCritical(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? `${theme.colors.primary} text-black`
                    : `hover:bg-gray-800/50 ${theme.colors.text}`
                }`}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm">{item.title}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Double Line Divider */}
        <div className="my-4 px-2">
          <div className="space-y-1">
            <div className="h-px bg-gray-700"></div>
            <div className="h-px bg-gray-700"></div>
          </div>
        </div>

        {/* Saha Personeli Section */}
        <div className="space-y-2">
          {sahaPersoneliItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => prefetchCritical(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? `bg-orange-500 text-black`
                    : `hover:bg-orange-500/10 ${theme.colors.text}`
                }`}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-black' : 'text-orange-400'}`} />
                {!isCollapsed && (
                  <span className="text-sm">{item.title}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800/50 transition-all ${theme.colors.text}`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Daralt</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}