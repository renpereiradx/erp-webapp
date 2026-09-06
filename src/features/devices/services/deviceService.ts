/**
 * Servicio HTTP del feature de terminales — consume los endpoints del
 * contexto devices del backend (FASE E):
 *   GET    /api/v1/devices        (lista; gating branches:read)
 *   POST   /api/v1/devices        (alta; gating branches:write)
 *   PUT    /api/v1/devices/{id}   (patch parcial; gating branches:write)
 *   DELETE /api/v1/devices/{id}
 *   POST   /api/v1/devices/pair   (emparejamiento por código; solo auth)
 *
 * Los errores del backend llegan tipados con mensaje en español — se muestra
 * directo en toast.
 */
import { apiClient } from '@/services/api';
import type { Device, DeviceInput, PairedDevice } from '@/features/devices/types';

const BASE = '/api/v1/devices';

const devicePath = (id: number) => `${BASE}/${encodeURIComponent(String(id))}`;

export const deviceService = {
  async list(): Promise<Device[]> {
    const response = await apiClient.get(BASE);
    // El backend devuelve la lista cruda (patrón brand: array directo).
    return Array.isArray(response) ? response : ((response as { devices?: Device[] })?.devices ?? []);
  },

  async create(input: DeviceInput): Promise<Device> {
    return apiClient.post(BASE, input);
  },

  async update(id: number, patch: Partial<DeviceInput>): Promise<Device> {
    return apiClient.put(devicePath(id), patch);
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(devicePath(id));
  },

  /** Intercambia un código de emparejamiento por el binding de la terminal. */
  async pair(pairingCode: string): Promise<PairedDevice> {
    return apiClient.post(`${BASE}/pair`, { pairing_code: pairingCode });
  },
};

export default deviceService;
