import { useCallback, useEffect, useState } from 'react';
import { useCashRegisterStore } from '@/store/useCashRegisterStore';
import { cashRegisterService } from '@/services/cashRegisterService';
import type { Movement } from '@/store/useCashRegisterStore';
import {
  composeMovementConcept,
  type MovementDirection,
} from '../constants';

export interface MovementFilters {
  type: string;
  date_from: string;
  date_to: string;
}

export interface CreateMovementInput {
  movement_type: MovementDirection;
  conceptId: string;
  amount: number;
  notes: string;
  /** Translates a concept id into its stored label; injected to keep this hook UI-free. */
  translateConcept: (direction: MovementDirection, conceptId: string) => string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const EMPTY_FILTERS: MovementFilters = { type: '', date_from: '', date_to: '' };

export function hasActiveFilters(filters: MovementFilters): boolean {
  return Boolean(filters.type || filters.date_from || filters.date_to);
}

/**
 * Data + actions for the manual movements page: loads the active session,
 * lists its movements (plain or filtered via the /movements/filter endpoint),
 * and registers/voids movements. UI feedback (toasts) stays in the page.
 */
export function useCashMovements() {
  const {
    activeCashRegister,
    isActiveCashRegisterLoading,
    activeCashRegisterError,
    getActiveCashRegister,
  } = useCashRegisterStore();

  const [movements, setMovements] = useState<Movement[]>([]);
  const [isMovementsLoading, setIsMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MovementFilters>(EMPTY_FILTERS);
  const [isCreating, setIsCreating] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);

  const registerId = activeCashRegister?.id;

  const loadMovements = useCallback(
    async (applied: MovementFilters, id: number) => {
      setIsMovementsLoading(true);
      setMovementsError(null);
      try {
        const result = hasActiveFilters(applied)
          ? await cashRegisterService.getFilteredMovements(id, {
              type: applied.type || undefined,
              date_from: applied.date_from || undefined,
              date_to: applied.date_to || undefined,
            })
          : await cashRegisterService.getMovements(id);
        setMovements(result);
      } catch (error) {
        setMovementsError(error instanceof Error ? error.message : String(error));
        setMovements([]);
      } finally {
        setIsMovementsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (registerId) {
      loadMovements(EMPTY_FILTERS, registerId);
    }
  }, [registerId, loadMovements]);

  const setFilter = useCallback((field: keyof MovementFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const applyFilters = useCallback((): void => {
    if (registerId) void loadMovements(filters, registerId);
  }, [filters, registerId, loadMovements]);

  const clearFilters = useCallback((): void => {
    setFilters(EMPTY_FILTERS);
    if (registerId) void loadMovements(EMPTY_FILTERS, registerId);
  }, [registerId, loadMovements]);

  const refresh = useCallback((): void => {
    if (registerId) void loadMovements(filters, registerId);
    void getActiveCashRegister();
  }, [filters, registerId, loadMovements, getActiveCashRegister]);

  const createMovement = useCallback(
    async (input: CreateMovementInput): Promise<ActionResult> => {
      if (!registerId) {
        return { ok: false, error: 'cashMovement.error.noActiveCashRegister' };
      }
      setIsCreating(true);
      try {
        const label = input.translateConcept(input.movement_type, input.conceptId);
        await cashRegisterService.createMovement({
          cash_register_id: registerId,
          movement_type: input.movement_type,
          amount: input.amount,
          category: input.conceptId,
          concept: composeMovementConcept(label, input.notes),
        });
        await loadMovements(filters, registerId);
        void getActiveCashRegister();
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      } finally {
        setIsCreating(false);
      }
    },
    [registerId, filters, loadMovements, getActiveCashRegister]
  );

  const voidMovement = useCallback(
    async (movementId: number, reason: string): Promise<ActionResult> => {
      setIsVoiding(true);
      try {
        await cashRegisterService.voidMovement(movementId, reason);
        await loadMovements(filters, registerId as number);
        void getActiveCashRegister();
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      } finally {
        setIsVoiding(false);
      }
    },
    [filters, registerId, loadMovements, getActiveCashRegister]
  );

  return {
    activeCashRegister,
    isActiveCashRegisterLoading,
    activeCashRegisterError,
    movements,
    isMovementsLoading,
    movementsError,
    filters,
    hasActiveFilters: hasActiveFilters(filters),
    setFilter,
    applyFilters,
    clearFilters,
    isCreating,
    isVoiding,
    createMovement,
    voidMovement,
    refresh,
  };
}
