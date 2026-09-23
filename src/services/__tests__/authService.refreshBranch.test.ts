// src/services/__tests__/authService.refreshBranch.test.ts
// El switch de sucursal es client-side (BranchContext + X-Branch-ID): el
// backend responde /auth/refresh con la sucursal default del JWT y NO sabe de
// la selección del usuario. El refresh solo debe SEMBRAR active_branch cuando
// no hay selección previa — pisarla revertiría la sucursal activa en cada
// refresh silencioso, y 'branchView=global' (vista global elegida) no se
// siembra.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from '../authService';

const post = vi.fn();

vi.mock('../api', () => ({
  default: {
    post: (...args: unknown[]) => post(...args),
    setToken: vi.fn(),
    getToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

const REFRESH_OK = {
  success: true,
  access_token: 'tok-nuevo',
  refresh_token: 'refresh-nuevo',
  active_branch: 2,
  allowed_branches: [2, 3],
};

describe('authService.refreshToken — active_branch', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    post.mockResolvedValue(REFRESH_OK);
  });

  it('siembra la sucursal default cuando no hay selección previa', async () => {
    await authService.refreshToken('refresh-viejo');

    expect(localStorage.getItem('activeBranch')).toBe('2');
  });

  it('no pisa la selección del usuario (switch client-side)', async () => {
    localStorage.setItem('activeBranch', '3');

    await authService.refreshToken('refresh-viejo');

    expect(localStorage.getItem('activeBranch')).toBe('3');
  });

  it('no siembra nada cuando la vista global está elegida (branchView=global)', async () => {
    localStorage.setItem('branchView', 'global');

    await authService.refreshToken('refresh-viejo');

    expect(localStorage.getItem('activeBranch')).toBeNull();
  });
});
