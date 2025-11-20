// MOTORBOT API - Motorbot master data + barınma contract
// GET, POST, PUT, DELETE işlemleri
// motorbot + barinma_contract ilişkisi

import { api } from './client';
import type { 
  Motorbot, 
  BarinmaContract,
  MotorbotWithContract,
  PaginatedResponse 
} from '../types/database';

// ============================================
// MOTORBOT ENDPOINTS
// ============================================

export const motorbotApi = {
  // Tüm motorbotları getir
  getAll: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    owner_cari_id?: number;
    is_active?: boolean;
  }) => 
    api.get<PaginatedResponse<Motorbot>>('/motorbot', { params }),

  // Tek motorbot detayı
  getById: (id: number) => 
    api.get<Motorbot>(`/motorbot/${id}`),

  // Motorbot kodu ile getir
  getByCode: (code: string) => 
    api.get<Motorbot>(`/motorbot/code/${code}`),

  // Motorbot + Contract birlikte
  getWithContract: (id: number) => 
    api.get<MotorbotWithContract>(`/motorbot/${id}/with-contract`),

  // Cari'ye ait motorbotlar
  getByCari: (cariId: number) => 
    api.get<Motorbot[]>(`/motorbot/cari/${cariId}`),

  // Yeni motorbot oluştur
  create: (data: Omit<Motorbot, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Motorbot>('/motorbot', data),

  // Motorbot güncelle
  update: (id: number, data: Partial<Motorbot>) => 
    api.put<Motorbot>(`/motorbot/${id}`, data),

  // Motorbot sil
  delete: (id: number) => 
    api.delete<void>(`/motorbot/${id}`),

  // Motorbot durumunu değiştir
  updateStatus: (id: number, is_active: boolean) => 
    api.patch<Motorbot>(`/motorbot/${id}/status`, { is_active }),
};

// ============================================
// BARINMA CONTRACT ENDPOINTS
// ============================================

export const barinmaApi = {
  // Tüm kontratları getir
  getAllContracts: (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    motorbot_id?: number;
  }) => 
    api.get<PaginatedResponse<BarinmaContract>>('/barinma-contract', { params }),

  // Tek kontrat detayı
  getContractById: (id: number) => 
    api.get<BarinmaContract>(`/barinma-contract/${id}`),

  // Motorbot'a ait aktif kontrat
  getActiveContract: (motorbotId: number) => 
    api.get<BarinmaContract>(`/motorbot/${motorbotId}/active-contract`),

  // Yeni kontrat oluştur
  createContract: (data: Omit<BarinmaContract, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<BarinmaContract>('/barinma-contract', data),

  // Kontrat güncelle
  updateContract: (id: number, data: Partial<BarinmaContract>) => 
    api.put<BarinmaContract>(`/barinma-contract/${id}`, data),

  // Kontrat sil
  deleteContract: (id: number) => 
    api.delete<void>(`/barinma-contract/${id}`),

  // Kontrat durumunu değiştir
  updateContractStatus: (id: number, status: string) => 
    api.patch<BarinmaContract>(`/barinma-contract/${id}/status`, { status }),
};

// ============================================
// MOCK DATA
// ============================================

const MOCK_MOTORBOT: Motorbot[] = [
  {
    id: 1,
    code: 'MB-001',
    name: 'Deniz Yıldızı',
    owner_cari_id: 1,
    owner_cari_code: 'CARI-001',
    owner_name: 'Ahmet Yılmaz',
    boat_type: 'Yelkenli',
    length_meters: 12.5,
    width_meters: 4.2,
    draft_meters: 1.8,
    year_built: 2015,
    flag: 'TR',
    registration_number: 'TR-12345',
    engine_brand: 'Yanmar',
    engine_power_hp: 40,
    fuel_type: 'Dizel',
    water_tank_liters: 200,
    fuel_tank_liters: 150,
    is_active: true,
    notes: 'Premium yelkenli tekne',
    created_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: 2,
    code: 'MB-002',
    name: 'Mavi Dalga',
    owner_cari_id: 2,
    owner_cari_code: 'CARI-002',
    owner_name: 'Mehmet Kaya',
    boat_type: 'Motor Yat',
    length_meters: 15.0,
    width_meters: 5.0,
    draft_meters: 2.0,
    year_built: 2018,
    flag: 'TR',
    registration_number: 'TR-23456',
    engine_brand: 'Volvo Penta',
    engine_power_hp: 200,
    fuel_type: 'Dizel',
    water_tank_liters: 400,
    fuel_tank_liters: 500,
    is_active: true,
    created_at: new Date('2024-02-01').toISOString(),
  },
  {
    id: 3,
    code: 'MB-003',
    name: 'Rüzgar Gülü',
    owner_cari_id: 3,
    owner_cari_code: 'CARI-003',
    owner_name: 'Ayşe Demir',
    boat_type: 'Katamaran',
    length_meters: 14.0,
    width_meters: 7.5,
    draft_meters: 1.2,
    year_built: 2020,
    flag: 'TR',
    registration_number: 'TR-34567',
    engine_brand: 'Yamaha',
    engine_power_hp: 2 * 50,
    fuel_type: 'Dizel',
    water_tank_liters: 600,
    fuel_tank_liters: 400,
    is_active: true,
    created_at: new Date('2024-03-10').toISOString(),
  },
  {
    id: 4,
    code: 'MB-004',
    name: 'Beyaz Yelken',
    owner_cari_id: 1,
    owner_cari_code: 'CARI-001',
    owner_name: 'Ahmet Yılmaz',
    boat_type: 'Yelkenli',
    length_meters: 10.0,
    width_meters: 3.5,
    draft_meters: 1.5,
    year_built: 2012,
    flag: 'TR',
    registration_number: 'TR-45678',
    engine_brand: 'Yanmar',
    engine_power_hp: 30,
    fuel_type: 'Dizel',
    water_tank_liters: 150,
    fuel_tank_liters: 100,
    is_active: true,
    created_at: new Date('2024-01-20').toISOString(),
  },
  {
    id: 5,
    code: 'MB-005',
    name: 'Kumsal',
    owner_cari_id: 4,
    owner_cari_code: 'CARI-004',
    owner_name: 'Can Öztürk',
    boat_type: 'Motor Yat',
    length_meters: 18.0,
    width_meters: 5.5,
    draft_meters: 2.2,
    year_built: 2021,
    flag: 'TR',
    registration_number: 'TR-56789',
    engine_brand: 'Caterpillar',
    engine_power_hp: 400,
    fuel_type: 'Dizel',
    water_tank_liters: 800,
    fuel_tank_liters: 1000,
    is_active: true,
    notes: 'Lüks motor yat',
    created_at: new Date('2024-04-05').toISOString(),
  },
];

const MOCK_BARINMA_CONTRACT: BarinmaContract[] = [
  {
    id: 1,
    motorbot_id: 1,
    motorbot_code: 'MB-001',
    motorbot_name: 'Deniz Yıldızı',
    cari_id: 1,
    cari_code: 'CARI-001',
    cari_name: 'Ahmet Yılmaz',
    contract_number: 'BAR-2024-001',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    price_list_id: 1,
    price_list_code: 'TARIFE-2024-STANDART',
    service_card_id: 2,
    service_code: 'BARINMA-001',
    monthly_price: 15000.00,
    currency: 'TRY',
    vat_rate: 20,
    payment_day: 1,
    payment_method: 'Otomatik Tahsilat',
    status: 'AKTIF',
    notes: 'Yıllık kontrat - standart tarife',
    is_active: true,
    created_at: new Date('2024-01-01').toISOString(),
  },
  {
    id: 2,
    motorbot_id: 2,
    motorbot_code: 'MB-002',
    motorbot_name: 'Mavi Dalga',
    cari_id: 2,
    cari_code: 'CARI-002',
    cari_name: 'Mehmet Kaya',
    contract_number: 'BAR-2024-002',
    start_date: '2024-02-01',
    end_date: '2024-12-31',
    price_list_id: 2,
    price_list_code: 'TARIFE-2024-VIP',
    service_card_id: 2,
    service_code: 'BARINMA-001',
    monthly_price: 12000.00,
    currency: 'TRY',
    vat_rate: 20,
    payment_day: 5,
    payment_method: 'Havale',
    status: 'AKTIF',
    notes: 'VIP tarife uygulanıyor',
    is_active: true,
    created_at: new Date('2024-02-01').toISOString(),
  },
  {
    id: 3,
    motorbot_id: 3,
    motorbot_code: 'MB-003',
    motorbot_name: 'Rüzgar Gülü',
    cari_id: 3,
    cari_code: 'CARI-003',
    cari_name: 'Ayşe Demir',
    contract_number: 'BAR-2024-003',
    start_date: '2024-05-01',
    end_date: '2024-09-30',
    price_list_id: 3,
    price_list_code: 'TARIFE-2024-SEZONLUK',
    service_card_id: 2,
    service_code: 'BARINMA-001',
    monthly_price: 18000.00,
    currency: 'TRY',
    vat_rate: 20,
    payment_day: 1,
    payment_method: 'Kredi Kartı',
    status: 'AKTIF',
    notes: 'Sezonluk tarife',
    is_active: true,
    created_at: new Date('2024-05-01').toISOString(),
  },
];

// Mock mode için fallback
export const motorbotApiMock = {
  getAll: async () => ({
    items: MOCK_MOTORBOT,
    total: MOCK_MOTORBOT.length,
    page: 1,
    page_size: 100,
    total_pages: 1,
  }),
  
  getById: async (id: number) => {
    const motorbot = MOCK_MOTORBOT.find(m => m.id === id);
    if (!motorbot) throw new Error('Motorbot not found');
    return motorbot;
  },
  
  getByCode: async (code: string) => {
    const motorbot = MOCK_MOTORBOT.find(m => m.code === code);
    if (!motorbot) throw new Error('Motorbot not found');
    return motorbot;
  },
  
  create: async (data: any) => {
    const newId = Math.max(...MOCK_MOTORBOT.map(m => m.id), 0) + 1;
    const newMotorbot: Motorbot = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_MOTORBOT.push(newMotorbot);
    return newMotorbot;
  },
  
  update: async (id: number, data: any) => {
    const index = MOCK_MOTORBOT.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Motorbot not found');
    MOCK_MOTORBOT[index] = {
      ...MOCK_MOTORBOT[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return MOCK_MOTORBOT[index];
  },
  
  delete: async (id: number) => {
    const index = MOCK_MOTORBOT.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Motorbot not found');
    MOCK_MOTORBOT.splice(index, 1);
  },
  
  updateStatus: async (id: number, is_active: boolean) => {
    const index = MOCK_MOTORBOT.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Motorbot not found');
    MOCK_MOTORBOT[index] = {
      ...MOCK_MOTORBOT[index],
      is_active,
      updated_at: new Date().toISOString(),
    };
    return MOCK_MOTORBOT[index];
  },
  
  getWithContract: async (id: number) => {
    const motorbot = MOCK_MOTORBOT.find(m => m.id === id) || MOCK_MOTORBOT[0];
    const contract = MOCK_BARINMA_CONTRACT.find(c => c.motorbot_id === id);
    return {
      ...motorbot,
      active_contract: contract,
      has_contract: !!contract,
    };
  },
  
  getByCari: async (cariId: number) => 
    MOCK_MOTORBOT.filter(m => m.owner_cari_id === cariId),
};

export const barinmaApiMock = {
  getAllContracts: async () => ({
    items: MOCK_BARINMA_CONTRACT,
    total: MOCK_BARINMA_CONTRACT.length,
    page: 1,
    page_size: 20,
    total_pages: 1,
  }),

  getContractById: async (id: number) => 
    MOCK_BARINMA_CONTRACT.find(c => c.id === id) || MOCK_BARINMA_CONTRACT[0],

  getActiveContract: async (motorbotId: number) => 
    MOCK_BARINMA_CONTRACT.find(c => c.motorbot_id === motorbotId && c.status === 'AKTIF'),
};