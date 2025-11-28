import { Bell, Search, User, LogOut, ArrowLeft } from "lucide-react";
import { Theme } from "./ThemeSelector";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { VehicleDocumentNotificationBadge } from "@/features/admin/VehicleDocumentNotificationBadge";

interface TopBarProps {
  theme: Theme;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onNavigate?: (page: string) => void;
}

export function TopBar({ theme, title = "Dashboard", subtitle, showBackButton = false, onBackClick, onNavigate }: TopBarProps) {
  return (
    <div className={`${theme.colors.bgCard} border-b ${theme.colors.border} px-6 py-4 sticky top-0 z-40`}>
      <div className="flex items-center justify-between">
        {/* Title Section */}
        <div className="flex items-center gap-4">
          {showBackButton && onBackClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackClick}
              className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          )}
          <div>
            <h2 className="text-xl">{title}</h2>
            {subtitle && <p className={`text-sm ${theme.colors.textMuted}`}>{subtitle}</p>}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Ara..."
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pl-10 w-64"
            />
          </div>

          {/* Vehicle Document Notifications */}
          <VehicleDocumentNotificationBadge 
            onNotificationClick={() => onNavigate?.("admin-vehicle-documents")}
          />

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm">Admin User</p>
              <p className={`text-xs ${theme.colors.textMuted}`}>Yönetici</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`bg-transparent border-gray-700 ${theme.colors.text} hover:bg-gray-800 rounded-full w-10 h-10 p-0`}
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}