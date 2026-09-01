/**
 * Tests for collectionSplit — the cash-collection split used by the wizard's
 * CollectionStep. Covers the operator scenario: sale total 100.000, customer
 * pays 30.000 but hands a 50.000 note → apply 30k, change 20k, 70k stays due.
 */
import { describe, it, expect } from 'vitest';
import {
  computeAppliedAmount,
  computeCollectionChange,
  computePendingBalance,
  computeCashShortfall,
} from './collectionSplit';

describe('computeAppliedAmount', () => {
  it('uses the explicit amount to apply when typed', () => {
    expect(computeAppliedAmount(30000, 50000, 100000)).toBe(30000);
  });

  it('falls back to the received amount when nothing is typed (full collection)', () => {
    expect(computeAppliedAmount(0, 105690, 105690)).toBe(105690);
  });

  it('caps the applied amount at the document total', () => {
    expect(computeAppliedAmount(150000, 150000, 105690)).toBe(105690);
  });

  it('caps the fallback too (received exceeds total)', () => {
    expect(computeAppliedAmount(0, 200000, 105690)).toBe(105690);
  });

  it('never returns negative values', () => {
    expect(computeAppliedAmount(-50, -10, 1000)).toBe(0);
  });
});

describe('computeCollectionChange', () => {
  it('total 100k, pays 30k with 50k → change 20k', () => {
    expect(computeCollectionChange(50000, 30000)).toBe(20000);
  });

  it('exact payment → zero change', () => {
    expect(computeCollectionChange(105690, 105690)).toBe(0);
  });

  it('change keys off the APPLIED amount, not the total (partial payment with change)', () => {
    // NOT total - received (which would be 0 or negative): the customer pays
    // 30k of a 100k sale with a 50k note and takes 20k back as change.
    expect(computeCollectionChange(50000, 30000)).toBe(20000);
    expect(computeCollectionChange(50000, 50000)).toBe(0);
  });

  it('never returns negative values', () => {
    expect(computeCollectionChange(1000, 5000)).toBe(0);
  });
});

describe('computePendingBalance', () => {
  it('total 100k, applied 30k → 70k stays due', () => {
    expect(computePendingBalance(100000, 30000)).toBe(70000);
  });

  it('fully applied sale → zero pending balance', () => {
    expect(computePendingBalance(105690, 105690)).toBe(0);
  });

  it('never returns negative values', () => {
    expect(computePendingBalance(1000, 5000)).toBe(0);
  });
});

describe('computeCashShortfall', () => {
  it('flags cash missing to cover the applied amount', () => {
    expect(computeCashShortfall(20000, 30000)).toBe(10000);
  });

  it('zero when the cash covers the applied amount', () => {
    expect(computeCashShortfall(50000, 30000)).toBe(0);
  });
});

describe('operator scenario end-to-end', () => {
  it('sale 100k, customer pays 30k with a 50k note', () => {
    const total = 100000;
    const received = 50000;
    const applied = computeAppliedAmount(30000, received, total);
    expect(applied).toBe(30000);
    expect(computeCollectionChange(received, applied)).toBe(20000);
    expect(computePendingBalance(total, applied)).toBe(70000);
    expect(computeCashShortfall(received, applied)).toBe(0);
  });
});
