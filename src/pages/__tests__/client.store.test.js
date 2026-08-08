// src/__tests__/client.store.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useClientStore from '../../store/useClientStore';
import { clientService } from '../../services/clientService';

vi.mock('../../services/clientService');

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

  it('should fetch clients successfully', async () => {
    const mockData = [{ id: 1, name: 'Test Client' }];
    clientService.getAll.mockResolvedValue({ clients: mockData });
    
    await useClientStore.getState().fetchClients();
    
    const state = useClientStore.getState();
    expect(state.clients).toEqual(mockData);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle fetch error', async () => {
    clientService.getAll.mockRejectedValue(new Error('Network error'));
    
    await useClientStore.getState().fetchClients();
    
    const state = useClientStore.getState();
    expect(state.clients).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network error');
  });

  it('should delete a client locally', async () => {
    const initialClients = [{ id: 1, name: 'Client A' }, { id: 2, name: 'Client B' }];
    useClientStore.setState({ clients: initialClients });

    clientService.delete.mockResolvedValue({ success: true });

    await useClientStore.getState().deleteClient(1);

    const state = useClientStore.getState();
    expect(state.clients.length).toBe(1);
    expect(state.clients[0].id).toBe(2);
  });

  it('should refetch clients after creation', async () => {
    const fetchSpy = vi.spyOn(useClientStore.getState(), 'fetchClients');
    clientService.create.mockResolvedValue({ success: true });

    await useClientStore.getState().createClient({ name: 'New Client' });

    expect(fetchSpy).toHaveBeenCalled();
  });

  it('should refetch clients after update', async () => {
    const fetchSpy = vi.spyOn(useClientStore.getState(), 'fetchClients');
    clientService.update.mockResolvedValue({ success: true });

    await useClientStore.getState().updateClient(1, { name: 'Updated Client' });

    expect(fetchSpy).toHaveBeenCalled();
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
