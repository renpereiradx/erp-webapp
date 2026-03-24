import { 
  ManageReserveRequest, 
  GenerateSchedulesForDateRequest, 
  UpsertScheduleConfigByProductRequest, 
  ScheduleSlot, 
  ProductScheduleConfig 
} from '../domain/reservation';

const BASE_URL = 'http://localhost:8080';

const getHeaders = () => {
  const token = localStorage.getItem('jwt_token'); // O donde se guarde el token
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const reservationService = {
  // Reservas
  manageReserve: async (data: ManageReserveRequest) => {
    const res = await fetch(`${BASE_URL}/reserve/manage`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getAvailableSchedules: async (productId: string, date: string, duration: number) => {
    const res = await fetch(`${BASE_URL}/reserve/available-schedules?product_id=${productId}&date=${date}&duration=${duration}`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  // Horarios
  getSchedulesForProductAndDate: async (productId: string, date: string): Promise<ScheduleSlot[]> => {
    const res = await fetch(`${BASE_URL}/schedules/product/${productId}/date/${date}/all`);
    return res.json();
  },

  getProductConfig: async (productId: string): Promise<ProductScheduleConfig> => {
    const res = await fetch(`${BASE_URL}/schedules/product/${productId}/config`);
    return res.json();
  },

  generateSchedules: async (data: GenerateSchedulesForDateRequest) => {
    const res = await fetch(`${BASE_URL}/schedules/generate/date`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  upsertProductConfig: async (productId: string, data: UpsertScheduleConfigByProductRequest) => {
    const res = await fetch(`${BASE_URL}/schedules/product/${productId}/config`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
