import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Theme } from "./ThemeSelector";

interface SubMenuItem {
  id: string;
  title: string;
  description: string;
}

interface SubMenuProps {
  title: string;
  items: SubMenuItem[];
  onNavigate: (page: string) => void;
  onBack: () => void;
  theme: Theme;
}

export function SubMenu({ title, items, onNavigate, onBack, theme }: SubMenuProps) {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className={theme.colors.textMuted}>İşlem yapmak istediğiniz seçeneği belirleyin</p>
      </div>

      {/* Sub Menu Grid - Sidebar Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`${theme.colors.bgCard} rounded-lg border ${theme.colors.border} p-6 ${theme.colors.borderHover} hover:shadow-lg transition-all text-left group relative overflow-hidden`}
            >
              {/* Background Number */}
              <div className={`absolute -right-4 -top-4 text-6xl opacity-5 ${theme.colors.primaryText}`}>
                {index + 1}
              </div>
              
              {/* Content */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg ${theme.colors.primary}/10 flex items-center justify-center group-hover:${theme.colors.primary}/20 transition-colors`}>
                    <span className={`${theme.colors.primaryText}`}>{index + 1}</span>
                  </div>
                  <h3 className={`group-hover:${theme.colors.primaryText} transition-colors flex-1`}>
                    {item.title}
                  </h3>
                </div>
                <p className={`text-sm ${theme.colors.textMuted}`}>{item.description}</p>
                
                {/* Arrow indicator */}
                <div className={`mt-4 flex items-center gap-2 text-xs ${theme.colors.primaryText} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <span>Başlat</span>
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}