import React, { useState } from "react";
import { CariModule } from "./components/modules/CariModule";
import { CariEkstre } from "./components/modules/CariEkstre";
import { HizmetModule } from "./components/modules/HizmetModule";
import { TarifeModule } from "./components/modules/TarifeModule";
import { MotorbotModule } from "./components/modules/MotorbotModule";
import { InvoiceModule } from "./components/modules/InvoiceModule";
import { TopluFaturalamaModule } from "./components/modules/TopluFaturalamaModule";
import { SeferRaporModule } from "./components/modules/SeferRaporModule";
import { SeferModule } from "./components/modules/SeferModule";
import { IsEmriModule } from "./components/modules/IsEmriModule";
import { MotorbotYonetimi } from "./components/MotorbotYonetimi";
import { ThemeSelector, Theme, themes } from "./components/ThemeSelector";
import { Toaster } from "sonner";
import { Layout } from "lucide-react";
import { Button } from "./components/ui/button";
import { TemplatePreview } from "./components/TemplatePreview";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { SidebarMainMenu } from "./components/SidebarMainMenu";
import { SubMenu } from "./components/SubMenu";
import { CariKartGiris } from "./components/CariKartGiris";
import { CariKartlari } from "./components/CariKartlari";
import { MotorbotKartlari } from "./components/MotorbotKartlari";
import { MotorbotSeferYonetimi } from "./components/MotorbotSeferYonetimi";
import { SeferFaturalandirma } from "./components/SeferFaturalandirma";
import { BarinmaDashboard } from "./components/BarinmaDashboard";
import { BarinmaSozlesmeleri } from "./components/BarinmaSozlesmeleri";
import { KontratGiris } from "./components/KontratGiris";
import { BarinmaRaporlari } from "./components/BarinmaRaporlari";
import { EFatura } from "./components/EFatura";
import { HizmetYonetimi } from "./components/HizmetYonetimi";
import { TarifeKartiGiris } from "./components/TarifeKartiGiris";
import { Parametreler } from "./components/Parametreler";
import { Kurlar } from "./components/Kurlar";
import { SahaPersoneli } from "./components/SahaPersoneli";
import { Guvenlik } from "./components/Guvenlik";

// Types
type MotorbotSefer = {
  Id: number;
  MotorbotId: number;
  MotorbotCode: string;
  MotorbotName: string;
  MotorbotOwner?: string;
  CariCode?: string;
  DepartureDate: string;
  DepartureTime: string;
  DepartureNote?: string;
  ReturnDate?: string;
  ReturnTime?: string;
  ReturnNote?: string;
  Duration?: number;
  Status: 'DEPARTED' | 'RETURNED';
  UnitPrice: number;
  Currency: string;
  VatRate: number;
  VatAmount: number;
  TotalPrice: number;
  IsInvoiced: boolean;
  InvoiceId?: number;
  InvoiceDate?: string;
  InvoicePeriod?: string;
  CreatedAt: string;
  CreatedBy?: number;
  UpdatedAt?: string;
  UpdatedBy?: number;
};

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

  // Motorbot Sefer state
  const [motorbotSeferler, setMotorbotSeferler] = useState<MotorbotSefer[]>(motorbotSeferData);

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

          {/* Cari Kart Giriş */}
          {currentPage === "cari-kart-giris" && (
            <CariKartGiris 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleGoBack} 
              theme={currentTheme} 
            />
          )}

          {/* Cari Hesap Kartları */}
          {currentPage === "cari-kart-tanimlama" && (
            <CariKartlari 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              onNavigateToCariGiris={() => setCurrentPage("cari-kart-giris")}
              theme={currentTheme} 
            />
          )}

          {/* Cari Module */}
          {currentPage === "cari-module" && (
            <CariModule onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Cari Ekstre */}
          {currentPage === "cari-ekstre" && (
            <CariEkstre onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Motorbot Yönetimi Dashboard */}
          {currentPage === "motorbot-yonetimi" && (
            <MotorbotYonetimi 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              onNavigateToMotorbotModule={() => setCurrentPage("motorbot-module")}
              theme={currentTheme} 
            />
          )}

          {/* Motorbot Kartları */}
          {currentPage === "motorbot-liste" && (
            <MotorbotKartlari 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={() => {
                // Clear selection when going back
                if (navigationHistory[navigationHistory.length - 1] === "kontrat-giris") {
                  setSelectedMotorbotForKontrat(null);
                }
                handleGoBack();
              }} 
              theme={currentTheme}
              onNavigateToCariForm={() => {
                setNavigationHistory([...navigationHistory, currentPage]);
                setCurrentPage("cari-kart-giris");
              }}
              selectionMode={navigationHistory[navigationHistory.length - 1] === "kontrat-giris"}
              onMotorbotSelect={(motorbot) => {
                setSelectedMotorbotForKontrat(motorbot);
              }}
            />
          )}

          {/* Motorbot Sefer Yönetimi */}
          {currentPage === "sefer-yonetimi" && (
            <MotorbotSeferYonetimi 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
              onNavigateToEFatura={(seferData) => {
                setEFaturaContractData(seferData);
                setEFaturaSourceModule('sefer');
                setNavigationHistory([...navigationHistory, currentPage]);
                setCurrentPage('e-fatura');
              }}
              seferler={motorbotSeferler}
            />
          )}

          {/* Sefer Faturalandırma */}
          {currentPage === "sefer-faturalandirma" && (
            <SeferFaturalandirma 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
              seferler={motorbotSeferler}
            />
          )}

          {/* Sefer Dashboard & Raporlar */}
          {currentPage === "sefer-dashboard" && (
            <div className="p-6">
              <div className={`${currentTheme.colors.bgCard} rounded-lg border ${currentTheme.colors.border} p-12 text-center`}>
                <h2 className="text-xl mb-4">Sefer Dashboard & Raporlar</h2>
                <p className={`${currentTheme.colors.textMuted} mb-6`}>Dashboard ve raporlama modülü geliştirme aşamasında</p>
              </div>
            </div>
          )}

          {/* Barınma Dashboard */}
          {currentPage === "barinma-dashboard" && (
            <BarinmaDashboard onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Barınma Sözleşmeleri */}
          {currentPage === "barinma-motorbot-liste" && (
            <BarinmaSozlesmeleri 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
              onNavigateToMotorbotKartlari={() => handleNavigateWithHistory("motorbot-liste")}
              onNavigateToCariKartlari={() => handleNavigateWithHistory("cari-kart-tanimlama")}
              onNavigateToKontratGiris={() => handleNavigateWithHistory("kontrat-giris")}
              onNavigateToEFatura={handleNavigateToEFatura}
            />
          )}

          {/* Kontrat Giriş */}
          {currentPage === "kontrat-giris" && (
            <KontratGiris 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
              onNavigateToMotorbotKartlari={() => {
                setNavigationHistory([...navigationHistory, currentPage]);
                setCurrentPage("motorbot-liste");
              }}
              selectedMotorbot={selectedMotorbotForKontrat}
            />
          )}

          {/* Barınma Raporları */}
          {currentPage === "barinma-raporlar" && (
            <BarinmaRaporlari onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* E-Fatura */}
          {currentPage === "e-fatura" && (
            <EFatura 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleNavigateFromEFatura} 
              theme={currentTheme}
              sourceModule={eFaturaSourceModule || undefined}
              contractData={eFaturaContractData}
            />
          )}

          {/* E-Fatura Oluştur */}
          {currentPage === "e-fatura-olustur" && (
            <EFatura 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
            />
          )}

          {/* Hizmet Module */}
          {currentPage === "hizmet-module" && (
            <HizmetModule onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Tarife Module */}
          {currentPage === "tarife-module" && (
            <TarifeModule onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Motorbot Module */}
          {currentPage === "motorbot-module" && (
            <MotorbotModule onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Invoice Module */}
          {currentPage === "invoice-module" && (
            <InvoiceModule onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Toplu Faturalama Module */}
          {currentPage === "toplu-faturalama-module" && (
            <TopluFaturalamaModule 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              onNavigateToInvoice={(faturaData) => {
                // Fatura verilerini state'e kaydet ve Invoice modülüne geç
                setNavigationHistory([...navigationHistory, currentPage]);
                setCurrentPage("invoice-module");
              }}
              theme={currentTheme} 
              seferler={motorbotSeferler}
            />
          )}

          {/* Sefer Rapor Module */}
          {currentPage === "sefer-rapor-module" && (
            <SeferRaporModule onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Sefer Module - Sefer Çıkış/Dönüş */}
          {currentPage === "sefer-module" && (
            <SeferModule 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
              seferler={motorbotSeferler}
              onSaveSefer={(sefer) => {
                setMotorbotSeferler((prev) => {
                  const existingIndex = prev.findIndex(s => s.Id === sefer.Id);
                  if (existingIndex !== -1) {
                    // Var olan kaydı güncelle (dönüş kaydı)
                    const updated = [...prev];
                    updated[existingIndex] = sefer;
                    console.log('✓ Sefer güncellendi (SeferModule):', sefer.MotorbotName);
                    return updated;
                  } else {
                    // Yeni kayıt ekle (çıkış kaydı)
                    console.log('✓ Yeni sefer eklendi (SeferModule):', sefer.MotorbotName);
                    return [sefer, ...prev];
                  }
                });
              }}
            />
          )}

          {/* Hizmet Yönetimi */}
          {currentPage === "hizmet-yonetimi" && (
            <HizmetYonetimi 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              onNavigateToHizmetModule={() => setCurrentPage("hizmet-module")}
              onNavigateTotarifeModule={() => setCurrentPage("tarife-module")}
              theme={currentTheme} 
            />
          )}

          {/* İŞ EMRİ MODULE - Tüm iş emri sayfaları için tek modül */}
          {(currentPage === "is-emri-talep" || currentPage === "is-emri-onay" || currentPage === "is-emri-liste") && (
            <IsEmriModule 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
              initialPage={currentPage === "is-emri-talep" ? 'create' : 'list'}
            />
          )}

          {/* Tarife Kartı Giriş */}
          {currentPage === "tarife-kart-giris" && (
            <TarifeKartiGiris onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Kurlar page */}
          {currentPage === "kurlar" && (
            <Kurlar onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Parametreler page */}
          {currentPage === "parametreler" && (
            <Parametreler 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
              currentUser={{ is_admin: true }} // ✨ TODO: Gerçek kullanıcı oturum bilgisi gelecek
            />
          )}

          {/* Saha Personeli page */}
          {currentPage === "saha-personeli" && (
            <SahaPersoneli 
              onNavigateHome={handleBackToMenu} 
              onNavigateBack={handleBackToSubmenu} 
              theme={currentTheme}
              seferler={motorbotSeferler}
              onSaveSefer={(sefer) => {
                // Yeni sefer kaydı veya güncelleme
                setMotorbotSeferler((prev) => {
                  const existingIndex = prev.findIndex(s => s.Id === sefer.Id);
                  if (existingIndex !== -1) {
                    // Var olan kaydı güncelle (dönüş kaydı)
                    const updated = [...prev];
                    updated[existingIndex] = sefer;
                    console.log('✓ Sefer güncellendi:', sefer.MotorbotName);
                    return updated;
                  } else {
                    // Yeni kayıt ekle (çıkış kaydı)
                    console.log('✓ Yeni sefer eklendi:', sefer.MotorbotName);
                    return [sefer, ...prev];
                  }
                });
              }}
            />
          )}

          {/* Güvenlik page */}
          {currentPage === "guvenlik" && (
            <Guvenlik onNavigateHome={handleBackToMenu} onNavigateBack={handleBackToSubmenu} theme={currentTheme} />
          )}

          {/* Default for other pages */}
          {currentPage !== "menu" && 
           currentPage !== "submenu" && 
           currentPage !== "barinma-dashboard" && 
           currentPage !== "barinma-motorbot-liste" && 
           currentPage !== "kontrat-giris" && 
           currentPage !== "barinma-raporlar" && 
           currentPage !== "e-fatura" && 
           currentPage !== "e-fatura-olustur" && 
           currentPage !== "cari-module" && 
           currentPage !== "cari-ekstre" && 
           currentPage !== "cari-kart-giris" && 
           currentPage !== "cari-kart-tanimlama" && 
           currentPage !== "cari-yonetim" && 
           currentPage !== "motorbot-yonetimi" && 
           currentPage !== "motorbot-liste" && 
           currentPage !== "motorbot-module" && 
           currentPage !== "invoice-module" && 
           currentPage !== "toplu-faturalama-module" && 
           currentPage !== "sefer-rapor-module" && 
           currentPage !== "sefer-module" && 
           currentPage !== "sefer-yonetimi" && 
           currentPage !== "sefer-faturalandirma" && 
           currentPage !== "sefer-dashboard" && 
           currentPage !== "hizmet-module" && 
           currentPage !== "tarife-module" && 
           currentPage !== "hizmet-yonetimi" && 
           currentPage !== "tarife-kart-giris" && 
           currentPage !== "kurlar" && 
           currentPage !== "parametreler" && 
           currentPage !== "saha-personeli" && 
           currentPage !== "guvenlik" && 
           currentPage !== "is-emri-talep" && 
           currentPage !== "is-emri-onay" && 
           currentPage !== "is-emri-liste" && (
            <div className="p-6">
              <div className={`${currentTheme.colors.bgCard} rounded-lg border ${currentTheme.colors.border} p-12 text-center`}>
                <h2 className="text-xl mb-4">Bu sayfa henüz geliştirilme aşamasında</h2>
                <p className={`${currentTheme.colors.textMuted}`}>Yakında eklenecek</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}