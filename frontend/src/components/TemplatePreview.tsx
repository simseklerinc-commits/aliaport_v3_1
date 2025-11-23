import { Check, LayoutGrid, LayoutList, BarChart3, Sidebar } from "lucide-react";
import { Button } from "./ui/button";

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  preview: string;
}

export const templates: TemplateOption[] = [
  {
    id: "grid",
    name: "Klasik Grid",
    description: "Kart tabanlı modüler görünüm",
    icon: LayoutGrid,
    preview: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
  },
  {
    id: "sidebar",
    name: "Kurumsal Sidebar",
    description: "Sol menülü profesyonel tasarım",
    icon: Sidebar,
    preview: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  },
  {
    id: "dashboard",
    name: "Dashboard Layout",
    description: "Widget ve grafik odaklı görünüm",
    icon: BarChart3,
    preview: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  },
  {
    id: "list",
    name: "Liste Görünümü",
    description: "Tablo tabanlı kompakt tasarım",
    icon: LayoutList,
    preview: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  },
];

interface TemplatePreviewProps {
  onClose: () => void;
}

export function TemplatePreview({ onClose }: TemplatePreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <div className="bg-[#0d1117] rounded-xl border border-gray-800 max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0d1117] border-b border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl mb-2">Şablon Seçimi</h2>
              <p className="text-gray-400">
                Kurumsal firmanız için en uygun arayüz şablonunu seçin
              </p>
            </div>
            <Button
              variant="outline"
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              onClick={onClose}
            >
              Kapat
            </Button>
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="bg-[#0a0f1a] rounded-lg border border-gray-800 hover:border-cyan-500 transition-all overflow-hidden group cursor-pointer"
              >
                {/* Preview Image */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
                  {template.id === "grid" && <GridPreview />}
                  {template.id === "sidebar" && <SidebarPreview />}
                  {template.id === "dashboard" && <DashboardPreview />}
                  {template.id === "list" && <ListPreview />}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-cyan-500 text-black px-6 py-3 rounded-lg font-medium">
                      Bu Şablonu Seç
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg mb-1 group-hover:text-cyan-400 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0d1117] border-t border-gray-800 p-6">
          <p className="text-sm text-gray-500 text-center">
            Şablon seçimi yapıldıktan sonra tüm modüller seçilen tasarıma göre
            düzenlenecektir
          </p>
        </div>
      </div>
    </div>
  );
}

// Preview Components
function GridPreview() {
  return (
    <div className="w-full h-full p-4 bg-[#0a0f1a]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 bg-gray-700 rounded w-32"></div>
        <div className="h-3 bg-gray-700 rounded w-20"></div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-[#0d1117] border border-gray-800 rounded p-3">
            <div className="w-8 h-8 bg-cyan-500/20 rounded mb-2"></div>
            <div className="h-2 bg-gray-700 rounded w-full mb-1"></div>
            <div className="h-2 bg-gray-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0d1117] border border-gray-800 rounded p-2">
            <div className="h-2 bg-cyan-500/30 rounded w-1/2 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SidebarPreview() {
  return (
    <div className="w-full h-full flex bg-[#0a0f1a]">
      {/* Sidebar */}
      <div className="w-16 bg-[#0d1117] border-r border-gray-800 p-2 space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`h-10 rounded ${i === 1 ? "bg-cyan-500/20" : "bg-gray-800"}`}
          ></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 bg-gray-700 rounded w-40"></div>
          <div className="flex gap-2">
            <div className="h-3 bg-gray-700 rounded w-16"></div>
            <div className="h-3 bg-cyan-500/30 rounded w-20"></div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#0d1117] border border-gray-800 rounded p-3">
              <div className="h-2 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-2 bg-gray-800 rounded w-2/3 mb-2"></div>
              <div className="h-12 bg-gray-800/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full h-full p-4 bg-[#0a0f1a]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 bg-gray-700 rounded w-32"></div>
        <div className="flex gap-2">
          <div className="h-3 bg-gray-700 rounded w-16"></div>
          <div className="h-3 bg-gray-700 rounded w-16"></div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#0d1117] border border-gray-800 rounded p-2">
            <div className="h-2 bg-gray-800 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-cyan-500/30 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Charts & Widgets */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0d1117] border border-gray-800 rounded p-3">
          <div className="h-2 bg-gray-700 rounded w-20 mb-2"></div>
          <div className="flex items-end gap-1 h-20">
            {[40, 70, 50, 80, 60, 90, 75, 85].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-cyan-500/30 rounded-t"
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
        </div>
        <div className="bg-[#0d1117] border border-gray-800 rounded p-3">
          <div className="h-2 bg-gray-700 rounded w-24 mb-2"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500/50 rounded-full"></div>
                <div className="h-2 bg-gray-800 rounded flex-1"></div>
                <div className="h-2 bg-gray-700 rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListPreview() {
  return (
    <div className="w-full h-full p-4 bg-[#0a0f1a]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="h-3 bg-gray-700 rounded w-32"></div>
        <div className="flex gap-2">
          <div className="h-3 bg-gray-700 rounded w-24"></div>
          <div className="h-3 bg-cyan-500/30 rounded w-20"></div>
        </div>
      </div>

      {/* Table Header */}
      <div className="bg-[#0d1117] border border-gray-800 rounded-t p-2 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-2 bg-gray-700 rounded"></div>
        ))}
      </div>

      {/* Table Rows */}
      <div className="space-y-px">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="bg-[#0d1117] border-x border-b border-gray-800 p-2 grid grid-cols-5 gap-2 hover:bg-[#1a1f2e] transition-colors"
          >
            {[1, 2, 3, 4, 5].map((j) => (
              <div
                key={j}
                className={`h-2 rounded ${j === 1 ? "bg-cyan-500/20" : "bg-gray-800"}`}
              ></div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-2 flex justify-center gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`w-6 h-2 rounded ${i === 1 ? "bg-cyan-500/30" : "bg-gray-800"}`}
          ></div>
        ))}
      </div>
    </div>
  );
}
