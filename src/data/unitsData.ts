// Units (Birimler) Master Data
// SQL Tablo: dbo.units

export interface Unit {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

export const unitsMasterData: Unit[] = [
  { id: 1, code: "ADET", name: "Adet", is_active: true },
  { id: 2, code: "GUN", name: "Gün", is_active: true },
  { id: 3, code: "AY", name: "Ay", is_active: true },
  { id: 4, code: "YIL", name: "Yıl", is_active: true },
  { id: 5, code: "M", name: "Metre", is_active: true },
  { id: 6, code: "M2", name: "Metrekare", is_active: true },
  { id: 7, code: "M3", name: "Metreküp", is_active: true },
  { id: 8, code: "KG", name: "Kilogram", is_active: true },
  { id: 9, code: "LT", name: "Litre", is_active: true },
  { id: 10, code: "SAAT", name: "Saat", is_active: true },
  { id: 11, code: "PAKET", name: "Paket", is_active: true },
  { id: 12, code: "SET", name: "Set", is_active: true },
  { id: 13, code: "TON", name: "Ton", is_active: true },
];
