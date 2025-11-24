import React, { useState } from "react";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { CariModule as CariModuleNew } from "./features/cari";
import { MotorbotModule as MotorbotModuleNew } from "./features/motorbot";
import { HizmetModule as HizmetModuleNew } from "./features/hizmet";
import { TarifeModule as TarifeModuleNew } from "./features/tarife";
import { BarinmaModule as BarinmaModuleNew } from "./features/barinma";
import { KurlarModule as KurlarModuleNew } from "./features/kurlar";
import { ParametrelerModule as ParametrelerModuleNew } from "./features/parametreler";
import { IsemriModule as IsemriModuleNew } from "./features/isemri";
import { DijitalArsivModule } from "./features/dijital-arsiv";
import { RaporlarModule } from "./features/raporlar";
import { SahaPersonelModule } from "./features/saha-personel";
import { GuvenlikModule } from "./features/guvenlik";
import { CariModule as CariModuleOld } from "./components/modules/CariModule";
import { CariEkstre } from "./components/modules/CariEkstre";
import { MotorbotModule as MotorbotModuleOld } from "./components/modules/MotorbotModule";
import { SeferModule } from "./components/modules/SeferModule";
import { HizmetModule as HizmetModuleOld } from "./components/modules/HizmetModule";
import { TarifeModule } from "./components/modules/TarifeModule";
import { BarinmaModule } from "./components/modules/BarinmaModule";
import { IsEmriModule } from "./components/modules/IsEmriModule";
import { HizmetYonetimi } from "./components/HizmetYonetimi";
import { Kurlar } from "./components/Kurlar";
import { Parametreler } from "./components/Parametreler";
import { PlaceholderModule } from "./components/PlaceholderModule";
import { ThemeSelector, Theme, themes } from "./components/ThemeSelector";
import { Toaster } from "sonner";
import { Layout } from "lucide-react";
import { Button } from "./components/ui/button";
import { TemplatePreview } from "./components/TemplatePreview";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { SidebarMainMenu } from "./components/SidebarMainMenu";
import { SubMenu } from "./components/SubMenu";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './core/cache/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ApiDebugPanel } from './dev/ApiDebugPanel';
import { ErrorBoundary } from './dev/ErrorBoundary';

const subMenus = {
  "is-emri": {
    title: "İş Emri Yönetimi",
    items: [
      {
        id: "is-emri-talep",
        title: "İş Emri Talebi",
        description: "Yeni iş emri talebi oluştur",
      },
      {
        id: "is-emri-onay",
        title: "İş Emri Giriş Onay",
        description: "İş emri taleplerini onayla",
      },
      {
        id: "is-emri-liste",
        title: "İş Emri Listesi",
        description: "Tüm iş emirlerini görüntüle",
      },
    ],
  },
  hizmet: {
    title: "Hizmet Yönetimi",
    items: [
      {
        id: "hizmet-dashboard",
        title: "Dashboard",
        description: "Hizmet ve tarife istatistikleri · Özet bilgiler · Kategori dağılımı · Hızlı erişim",
      },
      {
        id: "hizmet-module",
        title: "Hizmet Kartları",
        description: "Hizmet kartları · Kategori bazlı filtreleme · CRUD operasyonları · API entegrasyonu",
      },
      {
        id: "tarife-module",
        title: "Tarife Yönetimi",
        description: "Fiyat listeleri · Tarife kartları · Master-detail yapı · Versiyon kontrolü",
      },
    ],
  },
  cari: {
    title: "Cari Yönetim",
    items: [
      {
        id: "cari-module",
        title: "Cari Yönetimi",
        description: "Cari kartları · Ekstre & Bakiye · CRUD operasyonları · Mikro Jump entegrasyonu",
      },
      {
        id: "cari-ekstre",
        title: "Cari Ekstre & Bakiye",
        description: "Cari hesap hareketleri ve bakiye takibi · Grafikler · Detaylı analiz",
      },
    ],
  },
  "mb-sefer": {
    title: "MB Sefer",
    items: [
      {
        id: "motorbot-module",
        title: "Motorbot Yönetimi",
        description: "Motorbot kartları · Barınma kontratları · Master data yönetimi · CRUD operasyonları",
      },
      {
        id: "sefer-module",
        title: "Sefer Çıkış/Dönüş",
        description: "Sefer kayıt sistemi · Saha & ofis personeli · Çıkış/Dönüş formu · Seferde olan/Dönen/Tümü",
      },
      {
        id: "toplu-faturalama-module",
        title: "Toplu Faturalandırma",
        description: "Dönemsel toplu faturalama · 7-14-21-28-30/31 günlerde kesim · Tarihsel & Cari bazlı filtreleme",
      },
    ],
  },
  barinma: {
    title: "Barınma",
    items: [
      {
        id: "barinma-motorbot-liste",
        title: "Barınma Kontratları",
        description: "Kontrat bilgileri ve tarife yönetimi",
      },
      {
        id: "kontrat-giris",
        title: "Kontrat Giriş",
        description: "Yeni barınma kontratı oluştur",
      },
    ],
  },
  "dijital-arsiv": {
    title: "Dijital Arşiv",
    items: [
      {
        id: "firma-belge",
        title: "Firma Belgeleri",
        description: "Firma ile ilgili belgeler",
      },
      {
        id: "personel-belge",
        title: "Firma Personel Belgeleri",
        description: "Personel evrakları ve belgeler",
      },
      {
        id: "arac-belge",
        title: "Firma Araç Belgeleri",
        description: "Araç evrakları ve ruhsatlar",
      },
      {
        id: "motorbot-belge",
        title: "Firma Motorbot Belgeleri",
        description: "Motorbot evrakları ve belgeler",
      },
    ],
  },
  raporlar: {
    title: "Raporlar",
    items: [
      {
        id: "gelir-rapor",
        title: "Gelir Raporları",
        description: "Aylık ve yıllık gelir analizleri",
      },
      {
        id: "is-emri-rapor",
        title: "İş Emri Raporları",
        description: "İş emri performans ve istatistikleri",
      },
      {
        id: "cari-rapor",
        title: "Cari Hesap Raporları",
        description: "Cari bakiye ve ekstre raporları",
      },
      {
        id: "sefer-rapor-module",
        title: "Sefer Raporları",
        description: "Motorbot sefer istatistikleri · 3 bloklu rapor formatı · Detaylı filtreleme · Excel/PDF export",
      },
    ],
  },
};

// Küçük bir üst seviye wrapper: Auth ile sarılmış gerçek uygulama
function InnerApp() {
  const [currentPage, setCurrentPage] = useState<string>("menu");
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [showTemplatePreview, setShowTemplatePreview] = useState<boolean>(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  // Motorbot selection state (for KontratGiris)
  const [selectedMotorbotForKontrat, setSelectedMotorbotForKontrat] = useState<any>(null);

  // Motorbot Sefer state - will be loaded from API
  const [motorbotSeferler, setMotorbotSeferler] = useState<any[]>([]);

  const handleNavigate = (page: string) => {
    // Check if this is a main module with sub-menu
    if (subMenus[page as keyof typeof subMenus]) {
      setCurrentModule(page);
      setCurrentPage("submenu");
    } else if (page === "kurlar" || page === "parametreler") {
      // Modules without sub-menu
      setCurrentPage(page);
    } else {
      setCurrentPage(page);
    }
  };

  const handleSubNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleBackToMenu = () => {
    setCurrentPage("menu");
    setCurrentModule(null);
    setNavigationHistory([]);
  };

  const handleBackToSubmenu = () => {
    setCurrentPage("submenu");
    setNavigationHistory([]);
  };

  const handleNavigateWithHistory = (targetPage: string) => {
    setNavigationHistory([...navigationHistory, currentPage]);
    setCurrentPage(targetPage);
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      const previousPage = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(navigationHistory.slice(0, -1));
      setCurrentPage(previousPage);
    } else {
      handleBackToSubmenu();
    }
  };



  // Get page title for TopBar
  const getPageTitle = () => {
    if (currentPage === "menu") return "Dashboard";
    if (currentPage === "submenu" && currentModule) {
      return subMenus[currentModule as keyof typeof subMenus]?.title || "Menu";
    }
    if (currentPage === "is-emri-talep") return "İş Emri Talebi";
    if (currentPage === "is-emri-onay") return "İş Emri Giriş Onay";
    if (currentPage === "is-emri-liste") return "İş Emri Listesi";
    if (currentPage === "barinma-motorbot-liste") return "Barınma Kontratları";
    if (currentPage === "kontrat-giris") return "Yeni Barınma Kontratı";
    if (currentPage === "cari-kart-giris") return "Cari Kart Tanımlama";
    if (currentPage === "cari-kart-tanimlama") return "Cari Kartlar Yönetimi";
    if (currentPage === "cari-module") return "Cari Yönetim";
    if (currentPage === "cari-ekstre") return "Cari Ekstre & Bakiye";
    if (currentPage === "motorbot-yonetimi") return "Motorbot Kartları Dashboard";
    if (currentPage === "motorbot-module") return "Motorbot Yönetimi";
    if (currentPage === "invoice-module") return "Fatura Yönetimi";
    if (currentPage === "toplu-faturalama-module") return "Toplu Faturalandırma";
    if (currentPage === "sefer-rapor-module") return "Sefer Raporları";
    if (currentPage === "motorbot-liste") return "Motorbot Kartları (ESKİ)";
    if (currentPage === "sefer-yonetimi") return "Motorbot Sefer Yönetimi";
    if (currentPage === "sefer-faturalandirma") return "Sefer Faturalandırma";
    if (currentPage === "sefer-dashboard") return "Sefer Dashboard & Raporlar";
    if (currentPage === "hizmet-module") return "Hizmet Kartları";
    if (currentPage === "tarife-module") return "Tarife Yönetimi";
    if (currentPage === "hizmet-dashboard") return "Hizmet Dashboard";
    if (currentPage === "tarife-kart-giris") return "Yeni Tarife Kartı";
    if (currentPage === "kurlar") return "Kurlar";
    if (currentPage === "parametreler") return "Parametreler";
    if (currentPage === "saha-personeli") return "Saha Personeli";
    if (currentPage === "guvenlik") return "Güvenlik";
    return "Aliaport Liman Yönetimi";
  };

  const { isAuthenticated, logout, user } = useAuth();
  const appShell = (
      <div className={`dark min-h-screen ${currentTheme.colors.bg} ${currentTheme.colors.text} flex`}>
        <Toaster position="top-right" richColors />
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-20 right-4 z-50 bg-black/90 text-white p-3 rounded text-xs">
            <p>Current Page: {currentPage}</p>
            <p>Current Module: {currentModule || 'null'}</p>
          </div>
        )}
      
      <ThemeSelector currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
      
      {/* Template Preview Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setShowTemplatePreview(true)}
          className={`${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-black rounded-full w-14 h-14 shadow-lg`}
        >
          <Layout className="w-6 h-6" />
        </Button>
      </div>

      {/* Template Preview Modal */}
      {showTemplatePreview && (
        <TemplatePreview onClose={() => setShowTemplatePreview(false)} />
      )}

      {/* Sidebar */}
      <Sidebar 
        onNavigate={handleNavigate} 
        theme={currentTheme}
        currentPage={currentModule || currentPage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar 
          theme={currentTheme}
          title={getPageTitle()}
          subtitle={currentPage === "menu" ? "Sistem özeti ve hızlı erişim" : undefined}
          showBackButton={navigationHistory.length > 0}
          onBackClick={handleGoBack}
        />
        {/* Auth Durumu */}
        <div className="absolute top-2 right-2 flex items-center gap-3 z-50">
          {isAuthenticated && user && (
            <>
              <span className="text-xs bg-black/40 text-white px-2 py-1 rounded">{user.email} · {user.roles.map(r=>r.name).join(', ')}</span>
              <button onClick={logout} className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700">Çıkış</button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {currentPage === "menu" && (
            <>
              {!isAuthenticated && (
                <div className="p-6">
                  <div className="mb-6 max-w-sm">
                    <LoginForm />
                  </div>
                </div>
              )}
              {isAuthenticated && <SidebarMainMenu theme={currentTheme} />}
            </>
          )}
          
          {currentPage === "submenu" && currentModule && subMenus[currentModule as keyof typeof subMenus] && (
            <div className="p-6">
              <SubMenu
                title={subMenus[currentModule as keyof typeof subMenus].title}
                items={subMenus[currentModule as keyof typeof subMenus].items}
                onNavigate={handleSubNavigate}
                onBack={handleBackToMenu}
                theme={currentTheme}
              />
            </div>
          )}

          {/* ACTIVE MODULES */}
          
          {/* Cari Module - NEW FEATURE-BASED */}
          {currentPage === "cari-module" && (
            <ProtectedRoute roles={["OPERASYON","SISTEM_YONETICISI","READONLY"]}>
              <div className="p-6">
                <CariModuleNew />
              </div>
            </ProtectedRoute>
          )}

          {/* Cari Ekstre & Bakiye */}
          {currentPage === "cari-ekstre" && (
            <CariEkstre onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Motorbot Module */}
          {currentPage === "motorbot-module" && (
            <ProtectedRoute roles={["OPERASYON","SISTEM_YONETICISI","SAHA","READONLY"]}>
              <div className="p-6">
                <MotorbotModuleNew />
              </div>
            </ProtectedRoute>
          )}

          {/* Sefer Module */}
          {currentPage === "sefer-module" && (
            <SeferModule 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
            />
          )}

          {/* Hizmet Dashboard */}
          {currentPage === "hizmet-dashboard" && (
            <HizmetYonetimi 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              onNavigateToHizmetModule={() => setCurrentPage("hizmet-module")}
              onNavigateTotarifeModule={() => setCurrentPage("tarife-module")}
              theme={currentTheme}
            />
          )}

          {/* Hizmet Module */}
          {currentPage === "hizmet-module" && (
            <ProtectedRoute roles={["OPERASYON","SISTEM_YONETICISI","FINANS","READONLY"]}>
              <div className="p-6">
                <HizmetModuleNew />
              </div>
            </ProtectedRoute>
          )}

          {/* Tarife Module - NEW FEATURE-BASED */}
          {currentPage === "tarife-module" && (
            <ProtectedRoute roles={["FINANS","SISTEM_YONETICISI"]}>
              <div className="p-6">
                <TarifeModuleNew />
              </div>
            </ProtectedRoute>
          )}

          {/* Kurlar */}
          {currentPage === "kurlar" && (
            <ProtectedRoute roles={["FINANS","SISTEM_YONETICISI","READONLY"]}>
              <div className="p-6">
                <KurlarModuleNew />
              </div>
            </ProtectedRoute>
          )}

          {/* Parametreler */}
          {currentPage === "parametreler" && (
            <ProtectedRoute roles={["SISTEM_YONETICISI"]}>
              <div className="p-6">
                <ParametrelerModuleNew />
              </div>
            </ProtectedRoute>
          )}

          {/* Barınma Module - Liste */}
          {currentPage === "barinma-motorbot-liste" && (
            <ProtectedRoute roles={["OPERASYON","SISTEM_YONETICISI","READONLY"]}>
              <div className="p-6">
                <BarinmaModuleNew initialPage="list" />
              </div>
            </ProtectedRoute>
          )}

          {/* Barınma Module - Kontrat Giriş */}
          {currentPage === "kontrat-giris" && (
            <ProtectedRoute roles={["OPERASYON","SISTEM_YONETICISI"]}>
              <div className="p-6">
                <BarinmaModuleNew initialPage="create" />
              </div>
            </ProtectedRoute>
          )}

          {/* İŞ EMRİ MODULE - Tüm iş emri sayfaları için tek modül */}
          {(currentPage === "is-emri-talep" || currentPage === "is-emri-onay" || currentPage === "is-emri-liste") && (
            <ProtectedRoute roles={["SAHA","OPERASYON","SISTEM_YONETICISI"]}>
              <div className="p-6">
                <IsemriModuleNew />
              </div>
            </ProtectedRoute>
          )}

          {/* Dijital Arşiv - Tüm belge sayfaları */}
          {(currentPage === "firma-belge" || currentPage === "personel-belge" || 
            currentPage === "arac-belge" || currentPage === "motorbot-belge") && (
            <ProtectedRoute roles={["OPERASYON","SISTEM_YONETICISI","READONLY"]}>
              <div className="p-6">
                <DijitalArsivModule />
              </div>
            </ProtectedRoute>
          )}

          {/* Raporlar */}
          {currentPage === "raporlar" && (
            <ProtectedRoute roles={["FINANS","OPERASYON","SISTEM_YONETICISI","READONLY"]}>
              <div className="p-6">
                <RaporlarModule />
              </div>
            </ProtectedRoute>
          )}

          {/* Saha Personeli */}
          {currentPage === "saha-personel" && (
            <ProtectedRoute roles={["SAHA","OPERASYON","SISTEM_YONETICISI","READONLY"]}>
              <SahaPersonelModule />
            </ProtectedRoute>
          )}

          {/* Güvenlik */}
          {currentPage === "guvenlik" && (
            <ProtectedRoute roles={["GUVENLIK","SISTEM_YONETICISI"]}>
              <GuvenlikModule />
            </ProtectedRoute>
          )}

          {/* PLACEHOLDER MODULES - All other pages */}
          {currentPage !== "menu" && 
           currentPage !== "submenu" && 
           currentPage !== "cari-module" && 
           currentPage !== "cari-ekstre" && 
           currentPage !== "motorbot-module" && 
           currentPage !== "sefer-module" && 
           currentPage !== "hizmet-dashboard" && 
           currentPage !== "hizmet-module" && 
           currentPage !== "tarife-module" && 
           currentPage !== "barinma-motorbot-liste" && 
           currentPage !== "kontrat-giris" && 
           currentPage !== "is-emri-talep" && 
           currentPage !== "is-emri-onay" && 
           currentPage !== "is-emri-liste" && 
           currentPage !== "kurlar" && 
           currentPage !== "parametreler" && 
           currentPage !== "firma-belge" && 
           currentPage !== "personel-belge" && 
           currentPage !== "arac-belge" && 
           currentPage !== "motorbot-belge" && 
           currentPage !== "raporlar" && 
           currentPage !== "saha-personel" && 
           currentPage !== "guvenlik" && (
            <PlaceholderModule 
              onNavigateHome={handleBackToMenu}
              onNavigateBack={handleGoBack}
              moduleName={getPageTitle()}
            />
          )}
        </div>
      </div>
      
      {/* React Query Devtools & Debug Panel - development only */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <ReactQueryDevtools initialIsOpen={false} />
          <ApiDebugPanel />
        </>
      )}
      </div>
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>{appShell}</ErrorBoundary>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}
