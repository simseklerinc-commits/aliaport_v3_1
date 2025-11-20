// HİZMET SEÇİCİ COMPONENT - Dialog ile aranabilir hizmet kartı seçimi

import { useState } from "react";
import { Search, Package, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ServiceCard } from "../data/serviceCardData";

interface HizmetSeciciProps {
  hizmetList: ServiceCard[];
  selectedHizmet: ServiceCard | null;
  onSelect: (hizmet: ServiceCard | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function HizmetSecici({
  hizmetList,
  selectedHizmet,
  onSelect,
  open,
  onOpenChange,
  title = "Hizmet Seç",
}: HizmetSeciciProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtreleme - Code, Name ile arama
  const filteredHizmetList = hizmetList.filter((hizmet) => {
    if (!hizmet.is_active) return false; // Sadece aktif hizmetler
    const term = searchTerm.toLowerCase();
    return (
      hizmet.code.toLowerCase().includes(term) ||
      hizmet.name.toLowerCase().includes(term) ||
      hizmet.description.toLowerCase().includes(term)
    );
  });

  const handleSelect = (hizmet: ServiceCard) => {
    onSelect(hizmet);
    onOpenChange(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onSelect(null);
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-blue-400" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Hizmet kodu veya adı ile arama yapabilirsiniz
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Hizmet ara... (Kod, Ad)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px] max-h-[400px]">
          {filteredHizmetList.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Hizmet bulunamadı</p>
              <p className="text-sm text-gray-500 mt-2">
                Farklı arama terimleri deneyin
              </p>
            </div>
          ) : (
            filteredHizmetList.map((hizmet) => {
              const isSelected = selectedHizmet?.id === hizmet.id;

              return (
                <button
                  key={hizmet.id}
                  onClick={() => handleSelect(hizmet)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Package className="w-5 h-5 text-blue-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-white truncate">{hizmet.name}</h4>
                        {isSelected && <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <span className="font-mono">{hizmet.code}</span>
                      </div>

                      {hizmet.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                          {hizmet.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <Badge 
                          variant="default"
                          className="bg-green-500/20 text-green-400 text-xs"
                        >
                          Aktif
                        </Badge>
                        
                        {hizmet.accounting_code && (
                          <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">
                            Muhasebe: {hizmet.accounting_code}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            {filteredHizmetList.length} hizmet kartı
          </p>
          <div className="flex gap-2">
            {selectedHizmet && (
              <Button
                onClick={handleClear}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                Seçimi Temizle
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Kapat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
