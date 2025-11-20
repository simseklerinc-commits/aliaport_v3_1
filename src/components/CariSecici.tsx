// CARİ SEÇİCİ COMPONENT - Dialog ile aranabilir cari kartı seçimi
// Yeni Cari Kartı oluşturma özelliği ile

import { useState } from "react";
import { Search, Building2, User, Check, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { CariKart } from "../data/cariData";

interface CariSeciciProps {
  cariList: CariKart[];
  selectedCari: CariKart | null;
  onSelect: (cari: CariKart | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  onNewCari?: () => void; // Yeni cari kartı oluşturma callback'i
}

export function CariSecici({
  cariList,
  selectedCari,
  onSelect,
  open,
  onOpenChange,
  title = "Cari Seç",
  onNewCari,
}: CariSeciciProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtreleme - Code, Name, TaxId ile arama
  const filteredCariList = cariList.filter((cari) => {
    const term = searchTerm.toLowerCase();
    return (
      cari.Code.toLowerCase().includes(term) ||
      cari.Name.toLowerCase().includes(term) ||
      (cari.TaxId && cari.TaxId.toLowerCase().includes(term))
    );
  });

  const handleSelect = (cari: CariKart) => {
    onSelect(cari);
    onOpenChange(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onSelect(null);
    onOpenChange(false);
    setSearchTerm("");
  };

  const handleNewCari = () => {
    onOpenChange(false);
    setSearchTerm("");
    onNewCari?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-6 h-6 text-cyan-400" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Cari kodu, ünvan veya vergi kimlik numarası ile arama yapabilirsiniz
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cari ara... (Kod, Ünvan, VKN/TCKN)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
            autoFocus
          />
        </div>

        {/* New Cari Button */}
        {onNewCari && (
          <Button
            onClick={handleNewCari}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Cari Kartı Oluştur
          </Button>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[300px] max-h-[400px]">
          {filteredCariList.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Cari bulunamadı</p>
              <p className="text-sm text-gray-500 mt-2">
                Farklı arama terimleri deneyin veya yeni cari kartı oluşturun
              </p>
            </div>
          ) : (
            filteredCariList.map((cari) => {
              const isSelected = selectedCari?.Id === cari.Id;
              const isCompany = cari.TaxIdType === "VKN";

              return (
                <button
                  key={cari.Id}
                  onClick={() => handleSelect(cari)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${isCompany ? "bg-blue-500/20" : "bg-purple-500/20"}`}>
                      {isCompany ? (
                        <Building2 className="w-5 h-5 text-blue-400" />
                      ) : (
                        <User className="w-5 h-5 text-purple-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-white truncate">{cari.Name}</h4>
                        {isSelected && <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <span className="font-mono">{cari.Code}</span>
                        <span>•</span>
                        <span>{cari.TaxIdType}: {cari.TaxId}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={cari.Active ? "default" : "secondary"}
                          className={cari.Active ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-300"}
                        >
                          {cari.Active ? "Aktif" : "Pasif"}
                        </Badge>
                        
                        {cari.AccountType === "CUSTOMER" && (
                          <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">
                            Müşteri
                          </Badge>
                        )}
                        {cari.AccountType === "SUPPLIER" && (
                          <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">
                            Tedarikçi
                          </Badge>
                        )}
                        {cari.AccountType === "BOTH" && (
                          <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                            Müşteri + Tedarikçi
                          </Badge>
                        )}
                        
                        {cari.IsEInvoiceCustomer && (
                          <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                            E-Fatura
                          </Badge>
                        )}
                      </div>

                      {cari.City && (
                        <p className="text-xs text-gray-500 mt-2 truncate">
                          {cari.City}
                          {cari.District && ` / ${cari.District}`}
                        </p>
                      )}
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
            {filteredCariList.length} cari kartı
          </p>
          <div className="flex gap-2">
            {selectedCari && (
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
