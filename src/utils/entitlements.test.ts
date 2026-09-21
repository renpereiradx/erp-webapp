import { beforeEach, describe, expect, it } from 'vitest';
import {
  BI_ENTITLEMENTS,
  CORE_ENTITLEMENTS,
  clearStoredEntitlements,
  hasStoredEntitlement,
  isValidEntitlements,
  persistEntitlements,
  readStoredEntitlements,
} from './entitlements';

describe('entitlements (PLAN_BI_PACK_PREMIUM F3)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persiste y lee entitlements válidos', () => {
    persistEntitlements({
      edition: 'core+bi',
      modules: ['bi'],
      bi_expires_at: '2027-09-21T12:00:00Z',
    });
    expect(readStoredEntitlements()).toEqual({
      edition: 'core+bi',
      modules: ['bi'],
      bi_expires_at: '2027-09-21T12:00:00Z',
    });
  });

  it('ignora valores inválidos (undefined/null/malformados) sin escribir', () => {
    persistEntitlements(undefined);
    persistEntitlements(null);
    persistEntitlements({ edition: 42, modules: 'bi' } as unknown as never);
    expect(readStoredEntitlements()).toBeNull();
  });

  it('hasStoredEntitlement responde por membresía de módulo', () => {
    persistEntitlements(BI_ENTITLEMENTS);
    expect(hasStoredEntitlement('bi')).toBe(true);

    persistEntitlements(CORE_ENTITLEMENTS);
    expect(hasStoredEntitlement('bi')).toBe(false);
  });

  it('fail-open: sin espejo persistido el módulo se considera disponible', () => {
    expect(hasStoredEntitlement('bi')).toBe(true);
  });

  it('fail-open también con JSON corrupto en localStorage', () => {
    localStorage.setItem('entitlements', '{not-json');
    expect(hasStoredEntitlement('bi')).toBe(true);
  });

  it('isValidEntitlements exige edition string + modules array', () => {
    expect(isValidEntitlements({ edition: 'core', modules: [] })).toBe(true);
    expect(isValidEntitlements({ edition: 'core' })).toBe(false);
    expect(isValidEntitlements({ modules: [] })).toBe(false);
    expect(isValidEntitlements('core+bi')).toBe(false);
    expect(isValidEntitlements(null)).toBe(false);
  });

  it('clearStoredEntitlements borra el espejo', () => {
    persistEntitlements(BI_ENTITLEMENTS);
    clearStoredEntitlements();
    expect(readStoredEntitlements()).toBeNull();
    expect(hasStoredEntitlement('bi')).toBe(true); // fail-open tras borrar
  });
});
