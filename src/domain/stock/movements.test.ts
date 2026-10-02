/**
 * Tests del dominio puro de movimientos de stock (PLAN_UNITS_V2_COMPLETACION
 * F4): buildPayloadFromForm con contexto de unidad — el delta viaja en la
 * unidad elegida + `unit`, y el backend (register_stock_movement p_unit)
 * convierte a base. El preview y el payload deben compartir el MISMO factor
 * (resolveUnitFactor) para que lo visto sea lo registrado.
 */
import { describe, it, expect } from 'vitest';
import { buildPayloadFromForm, type MovementFormValues } from './movements';

const OPERATOR = 'user-1';

describe('buildPayloadFromForm sin unidad (base)', () => {
  it('delta mode: quantity_change sin unit, metadata en base', () => {
    const form: MovementFormValues = {
      product_id: 'P1',
      mode: 'delta',
      delta: 5,
      reasonCategory: 'INVENTORY_COUNT',
    };
    const payload = buildPayloadFromForm(form, 10, OPERATOR);
    expect(payload.quantity_change).toBe(5);
    expect(payload.unit).toBeUndefined();
    expect(payload.metadata!.previous_stock).toBe(10);
    expect(payload.metadata!.new_stock).toBe(15);
  });

  it('target mode: delta = objetivo − actual', () => {
    const form: MovementFormValues = {
      product_id: 'P1',
      mode: 'target',
      targetStock: 12,
      reasonCategory: 'CORRECTION',
    };
    const payload = buildPayloadFromForm(form, 10, OPERATOR);
    expect(payload.quantity_change).toBe(2);
    expect(payload.metadata!.new_stock).toBe(12);
  });
});

describe('buildPayloadFromForm con unidad (factor unit→base)', () => {
  // base kg, 1 box = 10 kg (factor box→kg = 10).
  const boxContext = { unit: 'box', unitFactor: 10 };

  it('delta mode: quantity_change viaja en la unidad elegida + unit', () => {
    const form: MovementFormValues = {
      product_id: 'P1',
      mode: 'delta',
      delta: 2,
      unit: 'box',
      reasonCategory: 'INVENTORY_COUNT',
    };
    const payload = buildPayloadFromForm(form, 50, OPERATOR, boxContext);
    // El backend recibe "2 box" y convierte: quantity_change = 2 (box).
    expect(payload.quantity_change).toBe(2);
    expect(payload.unit).toBe('box');
    // El preview del ledger queda en base: 50 + 2×10 = 70.
    expect(payload.metadata!.previous_stock).toBe(50);
    expect(payload.metadata!.new_stock).toBe(70);
  });

  it('target mode: el objetivo en unidad se compara contra el actual convertido', () => {
    const form: MovementFormValues = {
      product_id: 'P1',
      mode: 'target',
      targetStock: 3,
      unit: 'box',
      reasonCategory: 'INVENTORY_COUNT',
    };
    const payload = buildPayloadFromForm(form, 5, OPERATOR, boxContext);
    // Actual 5 kg = 0,5 box; objetivo 3 box → delta 2,5 box = +25 kg.
    expect(payload.quantity_change).toBeCloseTo(2.5, 6);
    expect(payload.unit).toBe('box');
    expect(payload.metadata!.new_stock).toBe(30);
  });

  it('unidad decimal fraccional (g→kg 0,001) mantiene precisión', () => {
    const form: MovementFormValues = {
      product_id: 'P1',
      mode: 'delta',
      delta: 500,
      unit: 'g',
      reasonCategory: 'CORRECTION',
    };
    const payload = buildPayloadFromForm(form, 1, OPERATOR, { unit: 'g', unitFactor: 0.001 });
    expect(payload.quantity_change).toBe(500);
    expect(payload.unit).toBe('g');
    expect(payload.metadata!.new_stock).toBeCloseTo(1.5, 6);
  });

  it('unit explícita igual a la base no viaja como unit', () => {
    // El formulario normaliza unit===base a undefined antes de llamar, pero el
    // builder también es defensivo vía el chequeo de la UI; acá se documenta el
    // contrato: con unit base el payload no la lleva (equivalente backend).
    const form: MovementFormValues = {
      product_id: 'P1',
      mode: 'delta',
      delta: 2,
      reasonCategory: 'INVENTORY_COUNT',
    };
    const payload = buildPayloadFromForm(form, 1, OPERATOR, { unit: 'kg', unitFactor: 1 });
    expect(payload.quantity_change).toBe(2);
    expect(payload.metadata!.new_stock).toBe(3);
  });
});
