// src/services/__tests__/cashRegisterService.service.test.ts
// Regresión (apertura de caja como vendedor): GET /cash-registers/active
// responde 404 "No hay caja activa" cuando el usuario no tiene una caja
// abierta — es el estado normal previo a la apertura, no un fallo. El
// servicio debía mapearlo a null, pero gateaba con error.status cuando
// ApiError no conservaba el status HTTP → el 404 se re-lanzaba, el store
// seteaba activeCashRegisterError y /caja-registradora quedaba en ErrorState
// sin permitir abrir una caja.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cashRegisterService } from '../cashRegisterService';
import { apiClient } from '../api';
import { ApiError } from '@/utils/ApiError';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('@/utils/telemetry', () => ({
  telemetry: { record: vi.fn() },
}));

const notFoundError = () =>
  new ApiError('NOT_FOUND', 'No hay caja activa', undefined, undefined, 404);

describe('cashRegisterService.getActiveCashRegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when the backend responds 404 "No hay caja activa"', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(notFoundError());

    await expect(cashRegisterService.getActiveCashRegister()).resolves.toBeNull();
  });

  it('does not retry a 404 (non-transient client error)', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(notFoundError());

    await cashRegisterService.getActiveCashRegister();

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('returns the active register on success', async () => {
    const register = { id: 31, name: 'CAJA-01-TARDE', status: 'OPEN' };
    vi.mocked(apiClient.get).mockResolvedValue(register);

    await expect(cashRegisterService.getActiveCashRegister()).resolves.toEqual(register);
  });

  it('returns null for the 204 interception wrapper {success: true} without a register', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ success: true });

    await expect(cashRegisterService.getActiveCashRegister()).resolves.toBeNull();
  });
});
