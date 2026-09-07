import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearStoredPermissions,
  hasStoredPermission,
  persistPermissions,
  readStoredPermissions,
} from './userPermissions';

describe('userPermissions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persiste y lee una lista de permisos', () => {
    persistPermissions(['sales:read', 'dashboard:read']);
    expect(readStoredPermissions()).toEqual(['sales:read', 'dashboard:read']);
  });

  it('ignora valores no-array (undefined/null) sin escribir', () => {
    persistPermissions(undefined);
    persistPermissions(null);
    expect(readStoredPermissions()).toBeNull();
  });

  it('hasStoredPermission responde por membresía', () => {
    persistPermissions(['sales:read']);
    expect(hasStoredPermission('sales:read')).toBe(true);
    expect(hasStoredPermission('analytics:read')).toBe(false);
  });

  it('hasStoredPermission es fail-open sin lista persistida (comportamiento previo)', () => {
    expect(hasStoredPermission('analytics:read')).toBe(true);
  });

  it('clearStoredPermissions elimina la lista y vuelve a fail-open', () => {
    persistPermissions(['sales:read']);
    clearStoredPermissions();
    expect(readStoredPermissions()).toBeNull();
    expect(hasStoredPermission('sales:read')).toBe(true);
  });

  it('tolera JSON corrupto devolviendo null (fail-open)', () => {
    localStorage.setItem('permissions', '{no-json');
    expect(readStoredPermissions()).toBeNull();
    expect(hasStoredPermission('sales:read')).toBe(true);
  });
});
