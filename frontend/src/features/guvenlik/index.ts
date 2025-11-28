// Güvenlik module barrel exports

export { GuvenlikModule } from './components/GuvenlikModule';
export { SecurityTabletUI } from './components/SecurityTabletUI';
export { gatelogApi } from './api/gatelogApi';
export { securityApi } from './api/securityApi';
export type { GateLog, GateLogWithException, GateChecklistItem, GateStats } from './api/gatelogApi';
export type {
  VehicleEntryRequest,
  VehicleExitRequest,
  VehicleExitResponse,
  GateLogVehicle,
  PersonIdentityUploadRequest,
  SecurityApprovalBulkRequest,
  PendingPerson,
  ActiveVehicle,
} from './types/security.types';
export { useActiveVehicles, usePendingPersons, useSecurityMutations } from './hooks/useSecurity';
