// API INDEX - Tüm API modüllerinin merkezi export noktası
// Kullanım: import { cariApi, seferApi } from '@/lib/api';

export * from './client';
export * from './cari';
export * from './hizmet';
export * from './tarife';
export * from './motorbot';
export * from './sefer';
export * from './invoice';
export * from './parametre';
export * from './kurlar';
export * from './is-emri';
export * from './audit';
export * from './users';
export * from './roles';
export * from './guvenlik';
export * from './saha';
export * from './barinma';

// Re-export types
export type * from '../types/database';