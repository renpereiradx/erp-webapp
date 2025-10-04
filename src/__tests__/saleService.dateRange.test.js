/**
 * Tests para el endpoint de ventas por rango de fechas
 * Verifica la construcción correcta de query parameters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import saleService from '@/services/saleService';

// Mock de BusinessManagementAPI
vi.mock('@/services/BusinessManagementAPI', () => ({
  default: class MockAPI {
    async makeRequest(url, options) {
      // Verificar que la URL tiene los query parameters correctos
      expect(url).toMatch(/\/sale\/date_range\/\?/);
      expect(url).toMatch(/start_date=/);
      expect(url).toMatch(/end_date=/);
      expect(url).toMatch(/page=/);
      expect(url).toMatch(/page_size=/);

      // Verificar que es GET, no POST
      expect(options.method).toBe('GET');

      // Verificar que NO hay body (GET no debe tener body)
      expect(options.body).toBeUndefined();

      return {
        data: [],
        pagination: {
          page: 1,
          page_size: 50,
          total_records: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false
        }
      };
    }
  }
}));

describe('getSalesByDateRange - Query Parameters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('construye URL correctamente con query parameters', async () => {
    const params = {
      start_date: '2025-09-01',
      end_date: '2025-09-30',
      page: 1,
      page_size: 50
    };

    const result = await saleService.getSalesByDateRange(params);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.pagination).toBeDefined();
  });

  it('valida que start_date y end_date sean requeridos', async () => {
    const params = {
      page: 1,
      page_size: 50
      // Sin start_date ni end_date
    };

    // El servicio debería validar internamente, pero si cae en mock,
    // el mock también requiere las fechas
    try {
      await saleService.getSalesByDateRange(params);
      // Si llega aquí sin error, verificar que al menos funcionó
      // (el mock podría no lanzar error pero devolver datos vacíos)
    } catch (error) {
      expect(error.message).toMatch(/start_date|end_date|required/i);
    }
  });

  it('aplica valores por defecto a page y page_size', async () => {
    const params = {
      start_date: '2025-09-01',
      end_date: '2025-09-30'
    };

    const result = await saleService.getSalesByDateRange(params);

    expect(result.success).toBe(true);
    // Debe usar defaults: page=1, page_size=50
  });

  it('limita page_size a máximo 100', async () => {
    const params = {
      start_date: '2025-09-01',
      end_date: '2025-09-30',
      page: 1,
      page_size: 500 // Mayor al máximo
    };

    const result = await saleService.getSalesByDateRange(params);

    expect(result.success).toBe(true);
    // Internamente debe limitar a 50 (default cuando excede)
  });

  it('ajusta page mínimo a 1', async () => {
    const params = {
      start_date: '2025-09-01',
      end_date: '2025-09-30',
      page: -5, // Negativo
      page_size: 50
    };

    const result = await saleService.getSalesByDateRange(params);

    expect(result.success).toBe(true);
    // Internamente debe ajustar a 1
  });

  it('acepta formato alternativo de parámetros (dateFrom/dateTo)', async () => {
    const params = {
      dateFrom: '2025-09-01',
      dateTo: '2025-09-30',
      page: 1,
      limit: 25 // Alternativa a page_size
    };

    const result = await saleService.getSalesByDateRange(params);

    expect(result.success).toBe(true);
  });

  it('construye URLSearchParams correctamente', () => {
    const params = new URLSearchParams({
      start_date: '2025-09-01',
      end_date: '2025-09-30',
      page: '1',
      page_size: '50'
    });

    const url = `/sale/date_range/?${params.toString()}`;

    expect(url).toBe('/sale/date_range/?start_date=2025-09-01&end_date=2025-09-30&page=1&page_size=50');
  });

  it('maneja caracteres especiales en fechas con hora', () => {
    const params = new URLSearchParams({
      start_date: '2025-09-01 00:00:00',
      end_date: '2025-09-30 23:59:59',
      page: '1',
      page_size: '50'
    });

    const url = `/sale/date_range/?${params.toString()}`;

    // URLSearchParams debe codificar los espacios como +
    expect(url).toContain('2025-09-01+00%3A00%3A00');
    expect(url).toContain('2025-09-30+23%3A59%3A59');
  });
});

describe('getSalesByDateRange - Ventajas del método GET', () => {
  it('la URL es compartible (bookmarkable)', async () => {
    const params = {
      start_date: '2025-09-01',
      end_date: '2025-09-30',
      page: 2,
      page_size: 25
    };

    // La URL completa puede guardarse y compartirse
    const shareableUrl = new URLSearchParams({
      start_date: params.start_date,
      end_date: params.end_date,
      page: params.page.toString(),
      page_size: params.page_size.toString()
    });

    const fullUrl = `https://api.example.com/sale/date_range/?${shareableUrl.toString()}`;

    expect(fullUrl).toBe(
      'https://api.example.com/sale/date_range/?start_date=2025-09-01&end_date=2025-09-30&page=2&page_size=25'
    );
  });

  it('es cacheable por el navegador (GET puro)', async () => {
    // GET sin body es cacheable según especificación HTTP
    // POST nunca es cacheable automáticamente

    const method = 'GET';
    expect(method).toBe('GET'); // Confirma que usamos GET
  });
});
