import { describe, it, expect } from 'vitest';
import {
  DEFAULT_VAT_PERCENT,
  normalizeTaxRatePercent,
  resolveApplicableRatePercent,
  resolveApplicableRateFraction,
  resolveApplicableRateId,
  coerceTaxRateFraction,
} from './resolveApplicableRate';

describe('normalizeTaxRatePercent', () => {
  it('convierte fracción a percent', () => {
    expect(normalizeTaxRatePercent(0.1)).toBe(10);
    expect(normalizeTaxRatePercent(0.05)).toBe(5);
  });

  it('mantiene percent', () => {
    expect(normalizeTaxRatePercent(10)).toBe(10);
    expect(normalizeTaxRatePercent(10.0)).toBe(10);
  });

  it('acepta 0 (EXENTO) como válido', () => {
    expect(normalizeTaxRatePercent(0)).toBe(0);
  });

  it('devuelve null para valores ausentes/inválidos', () => {
    expect(normalizeTaxRatePercent(undefined)).toBeNull();
    expect(normalizeTaxRatePercent(null)).toBeNull();
    expect(normalizeTaxRatePercent('')).toBeNull();
    expect(normalizeTaxRatePercent('abc')).toBeNull();
    expect(normalizeTaxRatePercent(-1)).toBeNull();
  });
});

describe('resolveApplicableRatePercent', () => {
  it('usa applicable_tax_rate (autoridad del backend)', () => {
    const product = { applicable_tax_rate: { rate: 5.0 } };
    expect(resolveApplicableRatePercent(product)).toBe(5);
  });

  it('no cae al fallback con tasa 0 (exento)', () => {
    const product = { applicable_tax_rate: { rate: 0 } };
    expect(resolveApplicableRatePercent(product)).toBe(0);
  });

  it('usa campos legacy cuando no hay applicable_tax_rate', () => {
    expect(resolveApplicableRatePercent({ tax_rate: 0.1 })).toBe(10);
    expect(resolveApplicableRatePercent({ tax: { rate: { rate: 10 } } })).toBe(10);
    expect(resolveApplicableRatePercent({ tax: { rate: 0.1 } })).toBe(10);
  });

  it('usa la tasa de la categoría como penúltimo nivel', () => {
    const product = { category: { default_tax_rate: { rate: 5.0 } } };
    expect(resolveApplicableRatePercent(product)).toBe(5);
  });

  it('cae al fallback explícito cuando no hay ninguna tasa', () => {
    expect(resolveApplicableRatePercent({})).toBe(DEFAULT_VAT_PERCENT);
    expect(resolveApplicableRatePercent({}, 0)).toBe(0);
    expect(resolveApplicableRatePercent(null, 10)).toBe(10);
  });
});

describe('resolveApplicableRateFraction', () => {
  it('devuelve la fracción para los calculators', () => {
    expect(resolveApplicableRateFraction({ applicable_tax_rate: { rate: 10 } })).toBe(0.1);
    expect(resolveApplicableRateFraction({ applicable_tax_rate: { rate: 0 } })).toBe(0);
  });
});

describe('resolveApplicableRateId', () => {
  it('prefiere applicable_tax_rate.id', () => {
    const product = {
      applicable_tax_rate: { id: 1, rate: 10 },
      tax: { rate: { id: 2, rate: 10 } },
    };
    expect(resolveApplicableRateId(product)).toBe(1);
  });

  it('cae a campos legacy y coacciona strings a number', () => {
    expect(resolveApplicableRateId({ tax_rate_id: '4' })).toBe(4);
    expect(resolveApplicableRateId({ tax: { rate: { id: 3 } } })).toBe(3);
    expect(resolveApplicableRateId({ category: { default_tax_rate_id: 6 } })).toBe(6);
  });

  it('devuelve null sin tasa', () => {
    expect(resolveApplicableRateId({})).toBeNull();
    expect(resolveApplicableRateId(null)).toBeNull();
  });
});

describe('coerceTaxRateFraction', () => {
  it('normaliza percent y fracción a fracción', () => {
    expect(coerceTaxRateFraction(10)).toBe(0.1);
    expect(coerceTaxRateFraction(0.1)).toBe(0.1);
  });

  it('cae al fallback con valores ausentes', () => {
    expect(coerceTaxRateFraction(undefined)).toBe(DEFAULT_VAT_PERCENT / 100);
    expect(coerceTaxRateFraction(null, 0.05)).toBe(0.05);
  });
});
