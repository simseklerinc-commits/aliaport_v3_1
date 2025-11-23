import { Theme } from "./ThemeSelector";
import { Button } from "./ui/button";
import { AlertCircle } from "lucide-react";

interface PlaceholderModuleProps {
  onNavigateHome?: () => void;
  onNavigateBack?: () => void;
  theme?: Theme;
  moduleName?: string;
}

export function PlaceholderModule({ 
  onNavigateHome, 
  onNavigateBack,
  moduleName = "Bu modül"
}: PlaceholderModuleProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-yellow-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">
          Modül Henüz Aktif Değil
        </h2>
        
        <p className="text-gray-400 mb-6">
          {moduleName} şu anda geliştirme aşamasındadır.
        </p>
        
        <div className="flex gap-3 justify-center">
          {onNavigateBack && (
            <Button
              onClick={onNavigateBack}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              Geri Dön
            </Button>
          )}
          {onNavigateHome && (
            <Button
              onClick={onNavigateHome}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ana Menüye Dön
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
