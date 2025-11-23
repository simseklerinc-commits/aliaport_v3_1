// Tarife module barrel exports

export { tarifeApi } from './api/tarifeApi';
export type { 
  PriceList, 
  PriceListCreate, 
  PriceListUpdate,
  PriceListItem,
  PriceListItemCreate,
  PriceListItemUpdate 
} from './types/tarife.types';

// Components
export { TarifeModule } from './components/TarifeModule';
export { TarifeList } from './components/TarifeList';
export { TarifeForm } from './components/TarifeForm';

// Hooks
export { useTarifeList, useTarifeMutations, useTarifeById } from './hooks/useTarife';
