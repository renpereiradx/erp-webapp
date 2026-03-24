import { 
  ManageReserveRequest, 
  GenerateSchedulesForDateRequest, 
  UpsertScheduleConfigByProductRequest, 
  ScheduleSlot, 
  ProductScheduleConfig 
} from '../domain/reservation';

const BASE_URL = ''; // Se usa el proxy de Vite en desarrollo o la ruta relativa en prod

const getHeaders = () => {
  const token = localStorage.getItem('authToken'); // Cambiado de 'jwt_token' a 'authToken'
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  if (res.status === 404) return []; // Para búsquedas sin resultados
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Error del servidor: ${res.status}`);
  }
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
};

export const reservationService = {
  // Reservas
  manageReserve: async (data: ManageReserveRequest) => {
    const res = await fetch(`${BASE_URL}/reserve/manage`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getAvailableSchedules: async (productId: string, date: string, duration: number) => {
    const res = await fetch(`${BASE_URL}/reserve/available-schedules?product_id=${productId}&date=${date}&duration=${duration}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Horarios
  getSchedulesForProductAndDate: async (productId: string, date: string): Promise<ScheduleSlot[]> => {
    const res = await fetch(`${BASE_URL}/schedules/product/${productId}/date/${date}/all`);
    const data = await handleResponse(res);
    return data || [];
  },

  getProductConfig: async (productId: string): Promise<ProductScheduleConfig> => {
    const res = await fetch(`${BASE_URL}/schedules/product/${productId}/config`);
    return handleResponse(res);
  },

  generateSchedules: async (data: GenerateSchedulesForDateRequest) => {
    const res = await fetch(`${BASE_URL}/schedules/generate/date`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  upsertProductConfig: async (productId: string, data: UpsertScheduleConfigByProductRequest) => {
    const res = await fetch(`${BASE_URL}/schedules/product/${productId}/config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Clientes y Productos (Integración)
  searchClients: async (name: string) => {
    const res = await fetch(`/api/client/name/${encodeURIComponent(name)}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getInitialClients: async () => {
    const res = await fetch(`/api/client/1/20`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getProducts: async () => {
    const res = await fetch(`/api/products/service-courts`, {
      headers: getHeaders(),
    });
    // Si falla el específico, intentar con all
    if (!res.ok) {
      const allRes = await fetch(`/api/products/all`, { headers: getHeaders() });
      return handleResponse(allRes);
    }
    return handleResponse(res);
  },
};
