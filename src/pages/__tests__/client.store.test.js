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
});
