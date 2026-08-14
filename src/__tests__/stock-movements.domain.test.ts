import { describe, it, expect } from 'vitest';
import {
  computeDelta,
  inferMovementTypes,
  buildMovementMetadata,
  buildPayloadFromForm,
  movementFormSchema,
} from '@/domain/stock/movements';
import type { MovementFormValues } from '@/domain/stock/movements';

describe('stock movements domain', () => {
  describe('computeDelta', () => {
    it('computes positive delta', () => {
      expect(computeDelta(10, 15)).toBe(5);
    });
    it('computes negative delta', () => {
      expect(computeDelta(15, 10)).toBe(-5);
    });
    it('returns zero when target equals current', () => {
      expect(computeDelta(7, 7)).toBe(0);
    });
    it('supports decimal units (kg) without branching', () => {
      expect(computeDelta(1.5, 2.25)).toBe(0.75);
    });
    it('rounds floating point noise to 4 decimals', () => {
      expect(computeDelta(0.1, 0.2)).toBeCloseTo(0.1, 5);
    });
    it('throws on non-finite values', () => {
      expect(() => computeDelta(Number.NaN, 5)).toThrow();
      expect(() => computeDelta(5, Number.POSITIVE_INFINITY)).toThrow();
    });
  });

  describe('inferMovementTypes', () => {
    it.each([
      ['LOSS', 'LOSS'],
      ['DAMAGE', 'LOSS'],
      ['EXPIRY', 'LOSS'],
      ['THEFT', 'LOSS'],
    ] as const)('maps %s to transaction_type LOSS', (cat, expected) => {
      expect(inferMovementTypes(cat).transaction_type).toBe(expected);
      expect(inferMovementTypes(cat).reference_type).toBe('manual_adjustment');
    });

    it.each([
      ['FOUND', 'FOUND'],
      ['RETURN', 'FOUND'],
    ] as const)('maps %s to transaction_type FOUND', (cat, expected) => {
      expect(inferMovementTypes(cat).transaction_type).toBe(expected);
    });

    it('maps INITIAL_COUNT to INITIAL / initial_stock', () => {
      const r = inferMovementTypes('INITIAL_COUNT');
      expect(r.transaction_type).toBe('INITIAL');
      expect(r.reference_type).toBe('initial_stock');
    });

    it('maps INVENTORY_COUNT to ADJUSTMENT / inventory_check', () => {
      const r = inferMovementTypes('INVENTORY_COUNT');
      expect(r.transaction_type).toBe('ADJUSTMENT');
      expect(r.reference_type).toBe('inventory_check');
    });

    it('maps CORRECTION to ADJUSTMENT / manual_adjustment', () => {
      const r = inferMovementTypes('CORRECTION');
      expect(r.transaction_type).toBe('ADJUSTMENT');
      expect(r.reference_type).toBe('manual_adjustment');
    });
  });

  describe('buildMovementMetadata', () => {
    it('builds audit metadata with source and system_version', () => {
      const m = buildMovementMetadata({
        operator: 'jperez',
        reasonCategory: 'INVENTORY_COUNT',
        previousStock: 10,
        newStock: 12,
        notes: 'conteo',
      });
      expect(m.source).toBe('stock_movements_ui');
      expect(m.system_version).toBe('4.3.0-frontend');
      expect(m.operator).toBe('jperez');
      expect(m.previous_stock).toBe(10);
      expect(m.new_stock).toBe(12);
      expect(m.stock_difference).toBe(2);
      expect(m.reason_category).toBe('INVENTORY_COUNT');
    });
  });

  describe('movementFormSchema', () => {
    it('accepts a valid target-mode form', () => {
      const r = movementFormSchema.safeParse({
        product_id: 'P1',
        mode: 'target',
        targetStock: 20,
        reasonCategory: 'INVENTORY_COUNT',
      });
      expect(r.success).toBe(true);
    });

    it('rejects delta mode with zero difference', () => {
      const r = movementFormSchema.safeParse({
        product_id: 'P1',
        mode: 'delta',
        delta: 0,
        reasonCategory: 'CORRECTION',
      });
      expect(r.success).toBe(false);
    });

    it('rejects negative target stock', () => {
      const r = movementFormSchema.safeParse({
        product_id: 'P1',
        mode: 'target',
        targetStock: -1,
        reasonCategory: 'INVENTORY_COUNT',
      });
      expect(r.success).toBe(false);
    });

    it('rejects missing product_id', () => {
      const r = movementFormSchema.safeParse({
        mode: 'target',
        targetStock: 5,
        reasonCategory: 'INVENTORY_COUNT',
      });
      expect(r.success).toBe(false);
    });
  });

  describe('buildPayloadFromForm', () => {
    const baseTarget: MovementFormValues = {
      product_id: 'P1',
      mode: 'target',
      targetStock: 12,
      reasonCategory: 'INVENTORY_COUNT',
      approvalLevel: 'operator',
    };

    it('computes delta from target mode and derives types', () => {
      const payload = buildPayloadFromForm(baseTarget, 10, 'jperez');
      expect(payload.product_id).toBe('P1');
      expect(payload.quantity_change).toBe(2);
      expect(payload.transaction_type).toBe('ADJUSTMENT');
      expect(payload.reference_type).toBe('inventory_check');
      expect(payload.metadata?.operator).toBe('jperez');
      // MUST NOT include branch_id (backend resolves from JWT)
      expect(payload).not.toHaveProperty('branch_id');
    });

    it('uses delta directly in delta mode', () => {
      const payload = buildPayloadFromForm(
        { ...baseTarget, mode: 'delta', targetStock: undefined, delta: -3 },
        10,
        'jperez',
      );
      expect(payload.quantity_change).toBe(-3);
      expect(payload.transaction_type).toBe('ADJUSTMENT');
    });

    it('maps LOSS category to transaction_type LOSS', () => {
      const payload = buildPayloadFromForm(
        { ...baseTarget, reasonCategory: 'THEFT' },
        10,
        'jperez',
      );
      expect(payload.transaction_type).toBe('LOSS');
      expect(payload.reference_type).toBe('manual_adjustment');
    });
  });
});
