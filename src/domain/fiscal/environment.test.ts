import { describe, expect, it } from 'vitest';
import { resolveEnvironmentStatus } from './environment';
import type { SifenConfigPublic } from '@/features/fiscal/types';

const cfg = (overrides: Partial<SifenConfigPublic>): SifenConfigPublic => ({
  ambiente: 'TEST',
  urls: {},
  id_csc: '0001',
  csc_set: true,
  has_cert: true,
  i_tip_con: 1,
  actividades: [],
  is_active: true,
  ...overrides,
});

const testOk = cfg({ ambiente: 'TEST' });
const prodOk = cfg({ ambiente: 'PROD' });

describe('resolveEnvironmentStatus (H9-audit S6)', () => {
  it('sin config en ningún ambiente → unconfigured, active null', () => {
    expect(resolveEnvironmentStatus(null, null)).toEqual({
      active: null,
      health: 'unconfigured',
    });
  });

  it('solo TEST configurado y activo → active TEST, ok', () => {
    expect(resolveEnvironmentStatus(testOk, null)).toEqual({
      active: testOk,
      health: 'ok',
    });
  });

  it('TEST inactivo + PROD inactivo → inactive, muestra PROD (mayor exposición)', () => {
    const test = cfg({ ambiente: 'TEST', is_active: false });
    const prod = cfg({ ambiente: 'PROD', is_active: false });
    expect(resolveEnvironmentStatus(test, prod)).toEqual({
      active: prod,
      health: 'inactive',
    });
  });

  it('ninguna activa y solo TEST configurado → inactive, muestra TEST', () => {
    const test = cfg({ ambiente: 'TEST', is_active: false });
    expect(resolveEnvironmentStatus(test, null)).toEqual({
      active: test,
      health: 'inactive',
    });
  });

  it('PROD activo aunque TEST también lo esté → gana PROD (verdad más riesgosa)', () => {
    expect(resolveEnvironmentStatus(testOk, prodOk)).toEqual({
      active: prodOk,
      health: 'ok',
    });
  });

  it('TEST activo y PROD solo configurado → active TEST', () => {
    const prod = cfg({ ambiente: 'PROD', is_active: false });
    expect(resolveEnvironmentStatus(testOk, prod)).toEqual({
      active: testOk,
      health: 'ok',
    });
  });

  it('activo sin certificado → incomplete', () => {
    const test = cfg({ ambiente: 'TEST', has_cert: false });
    expect(resolveEnvironmentStatus(test, null).health).toBe('incomplete');
  });

  it('activo sin CSC → incomplete', () => {
    const prod = cfg({ ambiente: 'PROD', csc_set: false });
    expect(resolveEnvironmentStatus(null, prod).health).toBe('incomplete');
  });

  it('no muta las configs de entrada', () => {
    const test = cfg({ ambiente: 'TEST', is_active: false });
    const prod = cfg({ ambiente: 'PROD', is_active: false });
    resolveEnvironmentStatus(test, prod);
    expect(test.is_active).toBe(false);
    expect(prod.is_active).toBe(false);
  });
});
