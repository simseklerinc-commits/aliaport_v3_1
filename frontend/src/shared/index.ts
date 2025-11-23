/**
 * SHARED - Barrel Exports
 * Tüm shared kaynaklar için merkezi export dosyası
 */

// Components
export { DataTable } from './components/DataTable';
export type { Column, DataTableProps } from './components/DataTable';

export {
  TextField,
  NumberField,
  TextAreaField,
  SelectField,
  SwitchField,
} from './components/FormField';

// Hooks
export { useApi, useApiList, useApiMutation } from './hooks/useApi';
export { usePagination } from './hooks/usePagination';
export type { PaginationOptions } from './hooks/usePagination';

// Utils
export {
  formatCurrency,
  formatNumber,
  formatDate,
  formatPhone,
  formatIBAN,
  formatFileSize,
  formatPercent,
  formatBoolean,
  formatStatus,
} from './utils/formatters';

export {
  isValidEmail,
  isValidPhone,
  isValidTCKN,
  isValidTaxNumber,
  isValidIBAN,
  isRequired,
  minLength,
  maxLength,
  isInRange,
  isPositive,
  isValidURL,
  validationMessages,
} from './utils/validators';

// Types
export type {
  ApiError,
  PaginationParams,
  PaginatedResponse,
  BaseEntity,
  SearchParams,
} from './types/common.types';
