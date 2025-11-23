// Parametre generic configuration entity

export interface Parametre {
  Id: number;
  Kategori: string;
  Kod: string;
  Ad: string;
  Deger?: string | null;
  Aciklama?: string | null;
  AktifMi: boolean;
  CreatedAt: string;
  UpdatedAt?: string | null;
}

export interface CreateParametrePayload {
  Kategori: string;
  Kod: string;
  Ad: string;
  Deger?: string;
  Aciklama?: string;
}

export interface UpdateParametrePayload extends Partial<CreateParametrePayload> {
  Id: number;
  AktifMi?: boolean;
}
