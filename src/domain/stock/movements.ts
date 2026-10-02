/**
 * Lógica PURA de movimientos de stock (sin React, sin side-effects).
 *
 * Reglas:
 *  - POST /stock-transactions/ trabaja con DELTAS con signo (quantity_change), NO con stock absoluto.
 *    A diferencia del viejo /manual_adjustment/ (que recibía new_quantity), aquí el cliente calcula
 *    la diferencia entre el stock objetivo y el stock actual.
 *  - Soporta unidades decimales (kg, L) sin ramificar: quantity_change es float.
 */

import { z } from 'zod';
import type {
  ReasonCategory,
  ReferenceType,
  RegisterMovementPayload,
  TransactionType,
} from '@/features/stock-movements/types';

/** Modo de entrada del formulario: stock objetivo o diferencia directa. */
export type MovementFormMode = 'target' | 'delta';

/**
 * Calcula el delta con signo a enviar al backend.
 * @throws Error si los valores no son numéricos válidos.
 */
export function computeDelta(currentStock: number, targetStock: number): number {
  if (!Number.isFinite(currentStock) || !Number.isFinite(targetStock)) {
    throw new Error('Invalid stock values');
  }
  return Number((targetStock - currentStock).toFixed(4));
}

/**
 * Mapea la categoría de motivo de UI a la semántica del ledger
 * (transaction_type + reference_type) que usa el backend.
 */
export function inferMovementTypes(
  reasonCategory: ReasonCategory,
): { transaction_type: TransactionType; reference_type: ReferenceType } {
  switch (reasonCategory) {
    case 'LOSS':
    case 'DAMAGE':
    case 'EXPIRY':
    case 'THEFT':
      return { transaction_type: 'LOSS', reference_type: 'manual_adjustment' };
    case 'FOUND':
    case 'RETURN':
      return { transaction_type: 'FOUND', reference_type: 'manual_adjustment' };
    case 'INITIAL_COUNT':
      return { transaction_type: 'INITIAL', reference_type: 'initial_stock' };
    case 'INVENTORY_COUNT':
      return { transaction_type: 'ADJUSTMENT', reference_type: 'inventory_check' };
    case 'CORRECTION':
    default:
      return { transaction_type: 'ADJUSTMENT', reference_type: 'manual_adjustment' };
  }
}

/** Construye el bloque de metadata de auditoría que viaja en el movimiento. */
export function buildMovementMetadata(input: {
  operator: string;
  reasonCategory: ReasonCategory;
  previousStock: number;
  newStock: number;
  notes?: string;
  approvalLevel?: string;
}): Record<string, unknown> {
  return {
    source: 'stock_movements_ui',
    timestamp: new Date().toISOString(),
    system_version: '4.3.0-frontend',
    operator: input.operator,
    reason_category: input.reasonCategory,
    adjustment_type: input.reasonCategory,
    previous_stock: input.previousStock,
    new_stock: input.newStock,
    stock_difference: Number((input.newStock - input.previousStock).toFixed(4)),
    approval_level: input.approvalLevel ?? 'L1',
    notes: input.notes ?? '',
  };
}

export const movementFormSchema = z
  .object({
    product_id: z.string().min(1),
    variant_id: z.string().optional(),
    mode: z.enum(['target', 'delta']),
    targetStock: z.number().optional(),
    delta: z.number().optional(),
    /** Unidad elegida para la cantidad (omitted = base_unit del producto). */
    unit: z.string().optional(),
    reasonCategory: z.string().min(1),
    reason: z.string().max(280).optional(),
    approvalLevel: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => (data.mode === 'target' ? data.targetStock !== undefined : data.delta !== undefined),
    { message: 'mode_value_required', path: ['mode'] },
  )
  .refine((data) => data.mode !== 'delta' || data.delta !== 0, {
    message: 'delta_nonzero',
    path: ['delta'],
  })
  .refine((data) => data.mode !== 'target' || (data.targetStock ?? 0) >= 0, {
    message: 'target_non_negative',
    path: ['targetStock'],
  });

export type MovementFormValues = z.infer<typeof movementFormSchema>;

/**
 * Construye el payload listo para POST /stock-transactions/ a partir del formulario.
 * @param currentStock stock actual EN BASE (del producto o variante seleccionada).
 * @param operator identificador del usuario (para auditoría).
 * @param unitContext unidad elegida por el usuario + factor unit→base
 *   (resolveUnitFactor del mismo valor que usará el backend; 1 = base).
 *   Con unidad ≠ base, el delta viaja en ESA unidad y el backend convierte
 *   (register_stock_movement p_unit, PLAN_UNITS_V2_COMPLETACION F4).
 */
export function buildPayloadFromForm(
  form: MovementFormValues,
  currentStock: number,
  operator: string,
  unitContext?: { unit: string; unitFactor: number },
): RegisterMovementPayload {
  const useUnit =
    unitContext != null && unitContext.unit !== '' && unitContext.unitFactor > 0;
  // Cantidad actual expresada en la unidad elegida (base ÷ factor).
  const currentInUnit = useUnit ? currentStock / unitContext.unitFactor : currentStock;

  const delta =
    form.mode === 'target'
      ? computeDelta(currentInUnit, Number(form.targetStock))
      : Number(form.delta);

  const { transaction_type, reference_type } = inferMovementTypes(
    form.reasonCategory as ReasonCategory,
  );

  // El stock del ledger SIEMPRE queda en base: delta(en unidad) × factor.
  const deltaInBase = useUnit ? delta * unitContext.unitFactor : delta;
  const newStock = Number((currentStock + deltaInBase).toFixed(4));

  return {
    product_id: form.product_id,
    variant_id: form.variant_id,
    transaction_type,
    quantity_change: delta,
    unit: useUnit ? unitContext.unit : undefined,
    reference_type,
    reason: form.reason?.trim() ? form.reason.trim() : form.reasonCategory,
    metadata: buildMovementMetadata({
      operator,
      reasonCategory: form.reasonCategory as ReasonCategory,
      previousStock: currentStock,
      newStock,
      notes: form.notes,
      approvalLevel: form.approvalLevel,
    }),
  };
}
