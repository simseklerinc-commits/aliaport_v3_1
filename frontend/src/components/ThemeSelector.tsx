import { Palette } from "lucide-react";
import { Button } from "./ui/button";

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    primaryHover: string;
    primaryText: string;
    bg: string;
    bgCard: string;
    bgCardHover: string;
    border: string;
    borderHover: string;
    text: string;
    textMuted: string;
  };
}

export const themes: Theme[] = [
  {
    id: "ocean",
    name: "Ocean (Mevcut)",
    colors: {
      primary: "bg-cyan-500",
      primaryHover: "hover:bg-cyan-600",
      primaryText: "text-cyan-400",
      bg: "bg-[#0a0f1a]",
      bgCard: "bg-[#0d1117]",
      bgCardHover: "hover:bg-[#1a1f2e]",
      border: "border-gray-800",
      borderHover: "hover:border-cyan-500",
      text: "text-white",
      textMuted: "text-gray-400",
    },
  },
  {
    id: "purple",
    name: "Purple Dream",
    colors: {
      primary: "bg-purple-500",
      primaryHover: "hover:bg-purple-600",
      primaryText: "text-purple-400",
      bg: "bg-[#0f0a1a]",
      bgCard: "bg-[#140d1f]",
      bgCardHover: "hover:bg-[#1f1a2e]",
      border: "border-purple-900/30",
      borderHover: "hover:border-purple-500",
      text: "text-white",
      textMuted: "text-purple-200/60",
    },
  },
  {
    id: "emerald",
    name: "Emerald Forest",
    colors: {
      primary: "bg-emerald-500",
      primaryHover: "hover:bg-emerald-600",
      primaryText: "text-emerald-400",
      bg: "bg-[#0a1410]",
      bgCard: "bg-[#0d1915]",
      bgCardHover: "hover:bg-[#1a2e24]",
      border: "border-emerald-900/30",
      borderHover: "hover:border-emerald-500",
      text: "text-white",
      textMuted: "text-emerald-200/60",
    },
  },
  {
    id: "amber",
    name: "Amber Sunset",
    colors: {
      primary: "bg-amber-500",
      primaryHover: "hover:bg-amber-600",
      primaryText: "text-amber-400",
      bg: "bg-[#1a130a]",
      bgCard: "bg-[#1f170d]",
      bgCardHover: "hover:bg-[#2e251a]",
      border: "border-amber-900/30",
      borderHover: "hover:border-amber-500",
      text: "text-white",
      textMuted: "text-amber-200/60",
    },
  },
  {
    id: "rose",
    name: "Rose Garden",
    colors: {
      primary: "bg-rose-500",
      primaryHover: "hover:bg-rose-600",
      primaryText: "text-rose-400",
      bg: "bg-[#1a0a0f]",
      bgCard: "bg-[#1f0d14]",
      bgCardHover: "hover:bg-[#2e1a1f]",
      border: "border-rose-900/30",
      borderHover: "hover:border-rose-500",
      text: "text-white",
      textMuted: "text-rose-200/60",
    },
  },
  {
    id: "sky",
    name: "Sky Blue",
    colors: {
      primary: "bg-sky-500",
      primaryHover: "hover:bg-sky-600",
      primaryText: "text-sky-400",
      bg: "bg-[#0a131a]",
      bgCard: "bg-[#0d161f]",
      bgCardHover: "hover:bg-[#1a252e]",
      border: "border-sky-900/30",
      borderHover: "hover:border-sky-500",
      text: "text-white",
      textMuted: "text-sky-200/60",
    },
  },
  {
    id: "indigo",
    name: "Indigo Night",
    colors: {
      primary: "bg-indigo-500",
      primaryHover: "hover:bg-indigo-600",
      primaryText: "text-indigo-400",
      bg: "bg-[#0a0f1a]",
      bgCard: "bg-[#0d1220]",
      bgCardHover: "hover:bg-[#1a1f35]",
      border: "border-indigo-900/30",
      borderHover: "hover:border-indigo-500",
      text: "text-white",
      textMuted: "text-indigo-200/60",
    },
  },
  {
    id: "slate",
    name: "Slate Gray",
    colors: {
      primary: "bg-slate-500",
      primaryHover: "hover:bg-slate-600",
      primaryText: "text-slate-300",
      bg: "bg-[#0f1419]",
      bgCard: "bg-[#1a1f26]",
      bgCardHover: "hover:bg-[#252a33]",
      border: "border-slate-700",
      borderHover: "hover:border-slate-500",
      text: "text-white",
      textMuted: "text-slate-400",
    },
  },
];

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSelector({ currentTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="group">
        <Button
          className={`${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-black rounded-full w-14 h-14 shadow-lg`}
        >
          <Palette className="w-6 h-6" />
        </Button>
        
        <div className="absolute bottom-16 right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
          <div className={`${currentTheme.colors.bgCard} ${currentTheme.colors.border} border rounded-lg shadow-xl p-4 w-64`}>
            <h3 className="text-sm mb-3">Tema Seçin</h3>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme)}
                  className={`p-3 rounded-lg border transition-all ${
                    currentTheme.id === theme.id
                      ? `${theme.colors.border} ${theme.colors.borderHover.replace('hover:', '')} shadow-md`
                      : `${theme.colors.border} ${theme.colors.borderHover}`
                  }`}
                  style={{
                    background: theme.colors.bgCard.replace('bg-', ''),
                    borderColor: currentTheme.id === theme.id ? theme.colors.primary.replace('bg-', '') : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full ${theme.colors.primary}`}></div>
                    <span className="text-xs">{theme.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className={`w-full h-1 rounded ${theme.colors.primary}`}></div>
                    <div className={`w-full h-1 rounded ${theme.colors.border}`}></div>
                    <div className={`w-full h-1 rounded ${theme.colors.bgCard}`}></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
