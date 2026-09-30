import { describe, expect, it } from 'vitest';
import {
  computePaymentProgress,
  formatDocumentId,
  normalizeSaleRow,
  normalizeSaleStatus,
  normalizeStatusFilterForApi,
} from './cobros';

describe('normalizeStatusFilterForApi', () => {
  it('returns undefined for empty/all', () => {
    expect(normalizeStatusFilterForApi('')).toBeUndefined();
    expect(normalizeStatusFilterForApi('all')).toBeUndefined();
  });

  it('maps aliases to canonical statuses', () => {
    expect(normalizeStatusFilterForApi('pending_payment')).toBe('PENDING');
    expect(normalizeStatusFilterForApi('partial')).toBe('PARTIAL');
    expect(normalizeStatusFilterForApi('completed')).toBe('PAID');
    expect(normalizeStatusFilterForApi('canceled')).toBe('CANCELLED');
  });
});

describe('normalizeSaleStatus', () => {
  it('normalizes raw aliases', () => {
    expect(normalizeSaleStatus({ payment_status: 'PARTIAL_PAYMENT' })).toBe(
      'PARTIAL',
    );
    expect(normalizeSaleStatus({ status: 'completed' })).toBe('PAID');
  });

  it('derives from amounts when status is missing', () => {
    expect(
      normalizeSaleStatus({ balance_due: 0, total_paid: 100 }),
    ).toBe('PAID');
    expect(
      normalizeSaleStatus({ balance_due: 50, total_paid: 50 }),
    ).toBe('PARTIAL');
    expect(normalizeSaleStatus({ balance_due: 100 })).toBe('PENDING');
  });
});

describe('computePaymentProgress', () => {
  it('computes clamped progress', () => {
    expect(computePaymentProgress(1000, 250)).toBe(75);
    expect(computePaymentProgress(0, 0)).toBe(0);
    expect(computePaymentProgress(100, 0, 'CANCELLED')).toBe(0);
  });
});

describe('formatDocumentId', () => {
  it('groups thousands with dots', () => {
    expect(formatDocumentId(1234567)).toBe('1.234.567');
    expect(formatDocumentId(null)).toBe('');
  });
});

describe('normalizeSaleRow', () => {
  it('normalizes nested sale shape and zeroes paid balance', () => {
    const row = normalizeSaleRow({
      sale: {
        sale_id: 7,
        sale_date: '2026-09-01',
        client_name: 'Cliente',
        total_amount: 1000,
        paid_amount: 1000,
        remaining_amount: 0,
        payment_status: 'PAID',
      },
    });
    expect(row.id).toBe(7);
    expect(row.status).toBe('PAID');
    expect(row.balance_due).toBe(0);
    expect(row.payment_progress).toBe(100);
  });
});
