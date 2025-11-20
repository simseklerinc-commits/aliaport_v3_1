// MOTORBOT SEÇİCİ - Aranabilir Kart Görünümlü Liste
// Saha ve Ofis personeli için motorbot kartlarından seçim

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Motorbot } from "../data/motorbotData";
import { Search, Anchor, Calendar, DollarSign, Check, X } from "lucide-react";

interface MotorbotSeciciProps {
  motorbots: Motorbot[];
  selectedMotorbot: Motorbot | null;
  onSelect: (motorbot: Motorbot) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function MotorbotSecici({
  motorbots,
  selectedMotorbot,
  onSelect,
  open,
  onOpenChange,
  title = "Motorbot Seç"
}: MotorbotSeciciProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtreleme
  const filteredMotorbots = motorbots.filter((mb) =>
    mb.Code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mb.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mb.Owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelect = (motorbot: Motorbot) => {
    onSelect(motorbot);
    onOpenChange(false);
    setSearchTerm("");
  };
  
  const getPeriodLabel = (code: string) => {
    switch (code) {
      case "DAILY": return "Günlük";
      case "MONTHLY": return "Aylık";
      case "YEARLY": return "Yıllık";
      default: return code;
    }
  };
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-gray-700 text-white p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl text-white flex items-center gap-3">
              <Anchor className="w-6 h-6 text-blue-400" />
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <DialogDescription className="sr-only">
            Motorbot listesinden arama yaparak seçim yapabilirsiniz
          </DialogDescription>
          
          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Tekne ara... (İsim, Kod, Cari Kart)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              autoFocus
            />
          </div>
        </DialogHeader>
        
        {/* Results */}
        <ScrollArea className="h-[calc(80vh-180px)]">
          <div className="p-6 space-y-3">
            {filteredMotorbots.length === 0 ? (
              <div className="text-center py-12">
                <Anchor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400">Motorbot bulunamadı</p>
                <p className="text-sm text-gray-500 mt-2">
                  Arama kriterlerinizi değiştirerek tekrar deneyin
                </p>
              </div>
            ) : (
              filteredMotorbots.map((mb) => (
                <button
                  key={mb.Id}
                  onClick={() => handleSelect(mb)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMotorbot?.Id === mb.Id
                      ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                      : 'border-gray-700 bg-gray-800/50 hover:border-blue-400 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    {/* Left: Motorbot Info */}
                    <div className="flex-1">
                      {/* Motorbot Name & Status */}
                      <div className="flex items-center gap-3 mb-3">
                        <Anchor className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-bold text-white">
                            {mb.Name}
                          </h3>
                          {mb.Active ? (
                            <Badge className="bg-green-500/20 text-green-400 border border-green-500">
                              AKTİF
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border border-red-500">
                              PASİF
                            </Badge>
                          )}
                          {mb.IsFrozen && (
                            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500">
                              DONDURULDU
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Owner */}
                      <div className="text-sm text-gray-400 mb-3">
                        {mb.Owner} ({mb.Code})
                      </div>
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Tam Boy */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Tam Boy:</span>
                          <span className="text-sm font-medium text-white">
                            {mb.Length} m
                          </span>
                        </div>
                        
                        {/* Periyot */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="text-sm text-gray-300">
                            {getPeriodLabel(mb.Period || "YEARLY")}
                          </span>
                        </div>
                        
                        {/* Fiyat */}
                        {mb.Price && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-gray-500" />
                            <span className="text-sm font-medium text-green-400">
                              {formatCurrency(mb.Price, mb.Currency || "TRY")}
                            </span>
                          </div>
                        )}
                        
                        {/* Tarih */}
                        {mb.ContractStartDate && mb.ContractEndDate && (
                          <div className="text-xs text-gray-500">
                            {new Date(mb.ContractStartDate).toLocaleDateString('tr-TR')} - {new Date(mb.ContractEndDate).toLocaleDateString('tr-TR')}
                          </div>
                        )}
                      </div>
                      
                      {/* Type & Dimensions */}
                      <div className="mt-2 text-xs text-gray-500">
                        {mb.Type} • {mb.Length}m × {mb.Width}m
                      </div>
                    </div>
                    
                    {/* Right: Check Icon */}
                    {selectedMotorbot?.Id === mb.Id && (
                      <div className="ml-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {filteredMotorbots.length} motorbot listeleniyor
            </span>
            {selectedMotorbot && (
              <span className="text-green-400 font-medium">
                ✓ {selectedMotorbot.Name} seçildi
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}