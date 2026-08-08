// src/services/__tests__/clientService.search.test.js
// Regresión del "cliente fantasma": la búsqueda de clientes debía devolver el
// wrapper {items: null} cuando el backend no encuentra coincidencias, y ese
// wrapper terminaba como un ítem "Cliente" seleccionable sin id → el checkout
// POS fallaba con "Cliente con ID  no encontrado" (payload sin client_id).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientService } from '../clientService';
import { apiClient } from '../api';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn() },
}));

describe('clientService.searchByName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns [] for an empty wrapper {items: null} instead of the wrapper itself', async () => {
    apiClient.get.mockResolvedValue({ items: null, total: 0, page: 1, page_size: 20 });

    const result = await clientService.searchByName('zzz');

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it('returns the items array from a wrapper response', async () => {
    const items = [{ id: 'ABC123', first_name: 'Carlos' }];
    apiClient.get.mockResolvedValue({ items, total: 1, page: 1, page_size: 20 });

    const result = await clientService.searchByName('carlos');

    expect(result).toEqual(items);
  });

  it('passes a bare array through unchanged', async () => {
    const arr = [{ id: 'X', first_name: 'Ana' }];
    apiClient.get.mockResolvedValue(arr);

    const result = await clientService.searchByName('ana');

    expect(result).toEqual(arr);
  });
});
