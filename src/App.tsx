import React, { useState } from "react";
import { CariModule } from "./components/modules/CariModule";
import { CariEkstre } from "./components/modules/CariEkstre";
import { MotorbotModule } from "./components/modules/MotorbotModule";
import { SeferModule } from "./components/modules/SeferModule";
import { HizmetModule } from "./components/modules/HizmetModule";
import { Kurlar } from "./components/Kurlar";
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
        id: "hizmet-yonetimi",
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
        description: "Cari kartları · Ekstre & Bakiye · CRUD operasyonları · E-Fatura entegrasyonu",
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
        id: "motorbot-yonetimi",
        title: "Motorbot Kartları Dashboard",
        description: "Motorbot kartları · Kontrat analizi · İstatistikler · Detaylı raporlama",
      },
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
  "e-fatura": {
    title: "E-Fatura",
    items: [
      {
        id: "invoice-module",
        title: "Fatura Yönetimi",
        description: "Fatura kartları · e-Fatura entegrasyonu · Tahsilat takibi · invoice + invoice_line",
      },
      {
        id: "e-fatura-olustur",
        title: "E-Fatura Oluştur",
        description: "Manuel fatura oluşturma · Barınma ve sefer faturaları",
      },
    ],
  },
  barinma: {
    title: "Barınma",
    items: [
      {
        id: "barinma-dashboard",
        title: "Dashboard",
        description: "Genel bakış ve istatistikler",
      },
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
      {
        id: "barinma-raporlar",
        title: "Barınma Raporları",
        description: "Gelir analizi ve istatistikler",
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("menu");
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);
  const [showTemplatePreview, setShowTemplatePreview] = useState<boolean>(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  
  // E-Fatura state
  const [eFaturaContractData, setEFaturaContractData] = useState<any>(null);
  const [eFaturaSourceModule, setEFaturaSourceModule] = useState<string | null>(null);

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
      setEFaturaContractData(null); // Clear contract data when navigating from main menu
      setEFaturaSourceModule(null);
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

  // E-Fatura navigation handlers
  const handleNavigateToEFatura = (contractData: any) => {
    setEFaturaContractData(contractData);
    setEFaturaSourceModule('barinma');
    setNavigationHistory([...navigationHistory, currentPage]);
    setCurrentPage('e-fatura');
  };

  const handleNavigateFromEFatura = () => {
    if (eFaturaSourceModule === 'barinma') {
      setCurrentPage('barinma-motorbot-liste');
    } else if (eFaturaSourceModule === 'sefer') {
      setCurrentPage('sefer-giris');
    } else {
      handleGoBack();
    }
    setEFaturaContractData(null);
    setEFaturaSourceModule(null);
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
    if (currentPage === "barinma-dashboard") return "Barınma Dashboard";
    if (currentPage === "barinma-motorbot-liste") return "Barınma Kontratları";
    if (currentPage === "kontrat-giris") return "Yeni Barınma Kontratı";
    if (currentPage === "barinma-raporlar") return "Barınma Raporları";
    if (currentPage === "e-fatura") return "E-Fatura";
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
    if (currentPage === "hizmet-yonetimi") return "Hizmet Yönetimi";
    if (currentPage === "tarife-kart-giris") return "Yeni Tarife Kartı";
    if (currentPage === "kurlar") return "Kurlar";
    if (currentPage === "parametreler") return "Parametreler";
    if (currentPage === "saha-personeli") return "Saha Personeli";
    if (currentPage === "guvenlik") return "Güvenlik";
    return "Aliaport Liman Yönetimi";
  };

  return (
    <div className={`min-h-screen ${currentTheme.colors.bg} ${currentTheme.colors.text} flex`}>
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

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {currentPage === "menu" && <SidebarMainMenu theme={currentTheme} />}
          
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
          
          {/* Cari Module */}
          {currentPage === "cari-module" && (
            <CariModule onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Cari Ekstre & Bakiye */}
          {currentPage === "cari-ekstre" && (
            <CariEkstre onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Motorbot Module */}
          {currentPage === "motorbot-module" && (
            <MotorbotModule onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Sefer Module */}
          {currentPage === "sefer-module" && (
            <SeferModule 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
            />
          )}

          {/* Hizmet Module */}
          {currentPage === "hizmet-module" && (
            <HizmetModule 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
            />
          )}

          {/* Kurlar */}
          {currentPage === "kurlar" && (
            <Kurlar 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToMenu} 
              theme={currentTheme}
            />
          )}

          {/* PLACEHOLDER MODULES - All other pages */}
          {currentPage !== "menu" && 
           currentPage !== "submenu" && 
           currentPage !== "cari-module" && 
           currentPage !== "cari-ekstre" && 
           currentPage !== "motorbot-module" && 
           currentPage !== "sefer-module" && 
           currentPage !== "hizmet-module" && 
           currentPage !== "kurlar" && (
            <PlaceholderModule 
              onNavigateHome={handleBackToMenu}
              onNavigateBack={handleGoBack}
              moduleName={getPageTitle()}
            />
          )}
        </div>
      </div>
    </div>
  );
} 
