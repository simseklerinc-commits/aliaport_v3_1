import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Theme } from "./ThemeSelector";

interface MotorbotFormQuickProps {
  theme: Theme;
  onSave: (motorbot: any) => void;
  onCancel: () => void;
}

export function MotorbotFormQuick({ theme, onSave, onCancel }: MotorbotFormQuickProps) {
  const [formData, setFormData] = useState({
    name: "",
    registrationNumber: "",
    type: "",
    length: "",
    width: "",
    draft: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new motorbot object
    const newMotorbot = {
      id: `MB-${Date.now()}`, // Temporary ID
      name: formData.name,
      registrationNumber: formData.registrationNumber,
      type: formData.type,
      length: parseFloat(formData.length) || 0,
      width: parseFloat(formData.width) || 0,
      draft: parseFloat(formData.draft) || 0,
      ownerName: "Yeni Sahip", // Placeholder
      ownerContact: "",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    onSave(newMotorbot);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Temel Bilgiler */}
      <div className="space-y-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <h3 className="flex items-center gap-2 text-blue-400">
          <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
          Temel Bilgiler
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-300">Tekne Adı *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Deniz Yıldızı"
            required
            className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationNumber" className="text-gray-300">Sicil No *</Label>
          <Input
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            placeholder="Örn: IST-2024-001"
            required
            className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="text-gray-300">Tekne Tipi *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-blue-500">
              <SelectValue placeholder="Tip seçin" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="motor-yacht">Motor Yat</SelectItem>
              <SelectItem value="sailing-yacht">Yelkenli</SelectItem>
              <SelectItem value="catamaran">Katamaran</SelectItem>
              <SelectItem value="gulet">Gulet</SelectItem>
              <SelectItem value="speedboat">Sürat Teknesi</SelectItem>
              <SelectItem value="fishing-boat">Balıkçı Teknesi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Teknik Özellikler */}
      <div className="space-y-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <h3 className="flex items-center gap-2 text-green-400">
          <div className="w-1 h-5 bg-green-500 rounded-full"></div>
          Teknik Özellikler
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="length" className="text-gray-300">Boy (m) *</Label>
            <Input
              id="length"
              type="number"
              step="0.01"
              value={formData.length}
              onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              placeholder="12.50"
              required
              className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="width" className="text-gray-300">En (m) *</Label>
            <Input
              id="width"
              type="number"
              step="0.01"
              value={formData.width}
              onChange={(e) => setFormData({ ...formData, width: e.target.value })}
              placeholder="4.20"
              required
              className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="draft" className="text-gray-300">Draft (m)</Label>
            <Input
              id="draft"
              type="number"
              step="0.01"
              value={formData.draft}
              onChange={(e) => setFormData({ ...formData, draft: e.target.value })}
              placeholder="1.80"
              className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-green-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 sticky bottom-0 bg-gray-900 pb-2">
        <Button
          type="submit"
          className={`flex-1 ${theme.colors.primary} ${theme.colors.primaryHover} text-black shadow-lg hover:shadow-xl transition-all`}
        >
          Kaydet
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 bg-red-900/20 border-red-600/50 text-red-400 hover:bg-red-900/40 hover:border-red-500 transition-all"
        >
          İptal
        </Button>
      </div>
    </form>
  );
}