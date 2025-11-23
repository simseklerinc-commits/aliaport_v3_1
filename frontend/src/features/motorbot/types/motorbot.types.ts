/**
 * MOTORBOT MODULE - TypeScript Types
 */

export interface Motorbot {
  Id: number;
  MotorbotKodu: string;
  Ad: string;
  Tip: string;
  BrutTonaj?: number;
  NetTonaj?: number;
  Boy?: number;
  En?: number;
  CekisDerisi?: number;
  YapimYili?: number;
  BayrakUlke?: string;
  LimanSicilNo?: string;
  IMO_No?: string;
  GT?: number;
  DWT?: number;
  AktifMi?: boolean;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface MotorbotCreate {
  MotorbotKodu: string;
  Ad: string;
  Tip: string;
  BrutTonaj?: number;
  NetTonaj?: number;
  Boy?: number;
  En?: number;
  CekisDerisi?: number;
  YapimYili?: number;
  BayrakUlke?: string;
  LimanSicilNo?: string;
  IMO_No?: string;
  GT?: number;
  DWT?: number;
}

export interface MotorbotUpdate {
  MotorbotKodu?: string;
  Ad?: string;
  Tip?: string;
  BrutTonaj?: number;
  NetTonaj?: number;
  Boy?: number;
  En?: number;
  CekisDerisi?: number;
  YapimYili?: number;
  BayrakUlke?: string;
  LimanSicilNo?: string;
  IMO_No?: string;
  GT?: number;
  DWT?: number;
  AktifMi?: boolean;
}
