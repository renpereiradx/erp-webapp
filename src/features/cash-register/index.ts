/**
 * cash-register feature — public surface.
 * Pages compose from here; internal modules stay private.
 */
export { CashRegisterStatusCard } from './components/CashRegisterStatusCard';
export { OpenSessionForm } from './components/OpenSessionForm';
export type { OpenSessionInput } from './components/OpenSessionForm';
export { CloseSessionForm } from './components/CloseSessionForm';
export type { CloseSessionInput } from './components/CloseSessionForm';
export { MovementsTable } from './components/MovementsTable';
export { MovementsFilterPanel } from './components/MovementsFilterPanel';
export { RegisterMovementModal } from './components/RegisterMovementModal';
export type { RegisterMovementPayload } from './components/RegisterMovementModal';
export { VoidMovementModal } from './components/VoidMovementModal';
export { useCashRegisterSession } from './hooks/useCashRegisterSession';
export {
  useCashMovements,
  hasActiveFilters,
} from './hooks/useCashMovements';
export type { MovementFilters } from './hooks/useCashMovements';
export {
  MOVEMENT_CONCEPTS,
  composeMovementConcept,
  isVoidableMovement,
} from './constants';
export type { MovementDirection, MovementConcept, VoidableMovement } from './constants';
