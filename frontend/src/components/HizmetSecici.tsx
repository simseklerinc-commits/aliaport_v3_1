// HİZMET SEÇİCİ COMPONENT - Dialog ile aranabilir hizmet kartı seçimi

import { useState } from "react";
import { Search, Package, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface ServiceCard {
  Id: number;
  Kod: string;
  Ad: string;
  Aciklama?: string | null;
  GrupKod?: string | null;
  Birim?: string | null;
  ParaBirimi?: string | null;
  AktifMi: boolean;
}

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

  // Filtreleme - Kod, Ad ile arama
  const filteredHizmetList = hizmetList.filter((hizmet) => {
    if (!hizmet || !hizmet.AktifMi) return false; // Sadece aktif hizmetler
    const term = searchTerm.toLowerCase();
    return (
      (hizmet.Kod && hizmet.Kod.toLowerCase().includes(term)) ||
      (hizmet.Ad && hizmet.Ad.toLowerCase().includes(term)) ||
      (hizmet.Aciklama && hizmet.Aciklama.toLowerCase().includes(term))
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

        {/* Results - Liste Görünümü */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px]">
          {filteredHizmetList.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Hizmet bulunamadı</p>
              <p className="text-sm text-gray-500 mt-2">
                Farklı arama terimleri deneyin
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase p-3">Kod</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase p-3">Hizmet Adı</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase p-3">Grup</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase p-3">Birim</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase p-3">Para Birimi</th>
                </tr>
              </thead>
              <tbody>
                {filteredHizmetList.map((hizmet) => {
                  const isSelected = selectedHizmet?.Id === hizmet.Id;
                  
                  return (
                    <tr
                      key={hizmet.Id}
                      onClick={() => handleSelect(hizmet)}
                      className={`cursor-pointer border-b border-gray-700/50 transition-colors ${
                        isSelected
                          ? "bg-blue-500/20 hover:bg-blue-500/30"
                          : "hover:bg-gray-800/50"
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                          <span className="font-mono text-sm text-gray-300">{hizmet.Kod}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-white">{hizmet.Ad}</div>
                        {hizmet.Aciklama && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{hizmet.Aciklama}</div>
                        )}
                      </td>
                      <td className="p-3">
                        {hizmet.GrupKod && (
                          <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                            {hizmet.GrupKod}
                          </Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-gray-300">{hizmet.Birim || "-"}</span>
                      </td>
                      <td className="p-3">
                        {hizmet.ParaBirimi && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-400 text-xs">
                            {hizmet.ParaBirimi}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
