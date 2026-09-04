/**
 * useClientStore — contract tests.
 * Movido desde src/pages/__tests__/client.store.test.js. Actualizado al
 * contrato actual del store: fetchClients normaliza clientes (displayName,
 * contact, status...), los errores se propagan con throw y el CRUD devuelve
 * { success, data } sin refrescar la lista localmente.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import useClientStore from '../useClientStore';
import { clientService } from '@/services/clientService';

vi.mock('@/services/clientService');

describe('Client Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state before each test
    useClientStore.setState({
      clients: [],
      loading: false,
      error: null,
    });
  });

  describe('fetchClients', () => {
    it('normaliza los clientes recibidos del servicio', async () => {
      clientService.getAll.mockResolvedValue({
        clients: [{ id: 1, name: 'Test Client', email: 'test@test.com' }],
      });

      await useClientStore.getState().fetchClients();

      const state = useClientStore.getState();
      expect(state.clients).toHaveLength(1);
      expect(state.clients[0]).toMatchObject({
        id: 1,
        name: 'Test Client',
        displayName: 'Test Client',
        status: true,
        contact: expect.objectContaining({ email: 'test@test.com' }),
      });
      expect(state.totalClients).toBe(1);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('propaga el error y lo deja en el estado', async () => {
      clientService.getAll.mockRejectedValue(new Error('Network error'));

      await expect(useClientStore.getState().fetchClients()).rejects.toThrow('Network error');

      const state = useClientStore.getState();
      expect(state.clients).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });
  });

  describe('CRUD', () => {
    it('deleteClient delega en el servicio y no muta la lista local', async () => {
      useClientStore.setState({ clients: [{ id: 1, name: 'Client A' }, { id: 2, name: 'Client B' }] });
      clientService.delete.mockResolvedValue({ success: true });

      const result = await useClientStore.getState().deleteClient(1);

      expect(clientService.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true, data: { success: true } });
      expect(useClientStore.getState().clients).toHaveLength(2);
    });

    it('createClient devuelve { success, data } sin refetch', async () => {
      const fetchSpy = vi.spyOn(useClientStore.getState(), 'fetchClients');
      clientService.create.mockResolvedValue({ id: 5, name: 'New Client' });

      const result = await useClientStore.getState().createClient({ name: 'New Client' });

      expect(clientService.create).toHaveBeenCalledWith({ name: 'New Client' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 5, name: 'New Client' });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('updateClient devuelve { success, data } sin refetch', async () => {
      const fetchSpy = vi.spyOn(useClientStore.getState(), 'fetchClients');
      clientService.update.mockResolvedValue({ id: 1, name: 'Updated Client' });

      const result = await useClientStore.getState().updateClient(1, { name: 'Updated Client' });

      expect(clientService.update).toHaveBeenCalledWith(1, { name: 'Updated Client' });
      expect(result.success).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('updateClient captura el error en el estado', async () => {
      clientService.update.mockRejectedValue(new Error('Validation failed'));

      const result = await useClientStore.getState().updateClient(1, { name: 'X' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(useClientStore.getState().error).toBe('Validation failed');
    });
  });

  describe('searchClients phantom-item protection', () => {
    it('returns [] when the search yields no results', async () => {
      // El servicio ya convierte el wrapper {items: null} del backend en [].
      // El store debe propagar el array vacío sin fabricar ítems fantasma.
      clientService.searchByName.mockResolvedValue([]);

      await useClientStore.getState().searchClients('zzz');

      expect(useClientStore.getState().searchResults).toEqual([]);
    });

    it('normalizes real matches returned by the service', async () => {
      clientService.searchByName.mockResolvedValue([
        { id: 'ABC123', first_name: 'Carlos', last_name: 'Gimenez' },
      ]);

      await useClientStore.getState().searchClients('carlos');

      const results = useClientStore.getState().searchResults;
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('ABC123');
      expect(results[0].displayName).toBe('Carlos Gimenez');
    });
  });

  describe('normalizeClient guard', () => {
    it('filters out items without an id (phantom wrapper leak)', async () => {
      clientService.getAll.mockResolvedValue({
        clients: [{ id: 1, name: 'Real' }, { name: 'Fantasma' }],
      });

      await useClientStore.getState().fetchClients();

      const clients = useClientStore.getState().clients;
      expect(clients).toHaveLength(1);
      expect(clients[0].id).toBe(1);
    });
  });
});
