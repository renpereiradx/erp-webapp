import type { Movement } from '@/store/useCashRegisterStore';

/** Direction of a manual cash movement (the two types the backend accepts here). */
export type MovementDirection = 'INCOME' | 'EXPENSE';

export interface MovementConcept {
  id: string;
  labelKey: string;
}

/**
 * Catalog of manual movement concepts. Labels live in i18n
 * (`cashMovement.concept.*`); the id is sent as `category` to the backend.
 * Hoisted to module level (rendering-hoist-jsx): never recreated per render.
 */
export const MOVEMENT_CONCEPTS: Record<MovementDirection, MovementConcept[]> = {
  INCOME: [
    { id: 'cash_deposit', labelKey: 'cashMovement.concept.deposit' },
    { id: 'reposition', labelKey: 'cashMovement.concept.reposition' },
    { id: 'adjustment_positive', labelKey: 'cashMovement.concept.adjustmentPositive' },
    { id: 'other_income', labelKey: 'cashMovement.concept.otherIncome' },
  ],
  EXPENSE: [
    { id: 'cash_withdrawal', labelKey: 'cashMovement.concept.withdrawal' },
    { id: 'purchase', labelKey: 'cashMovement.concept.purchase' },
    { id: 'service_payment', labelKey: 'cashMovement.concept.service' },
    { id: 'adjustment_negative', labelKey: 'cashMovement.concept.adjustmentNegative' },
    { id: 'other_expense', labelKey: 'cashMovement.concept.otherExpense' },
  ],
};

/**
 * Composes the free-text `concept` stored by the backend: the translated
 * concept label plus the optional audit notes. The machine id travels in
 * `category` (same payload contract as before the migration).
 */
export function composeMovementConcept(label: string, notes: string): string {
  return notes ? `${label} - ${notes}` : label;
}

export type VoidableMovement = Pick<Movement, 'movement_id' | 'concept' | 'amount'>;

export function isVoidableMovement(
  movement: Movement | null
): movement is Movement & { movement_id: number } {
  return !!movement && typeof movement.movement_id === 'number';
}
