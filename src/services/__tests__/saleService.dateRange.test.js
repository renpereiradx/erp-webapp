/**
 * saleService.getSalesByDateRange — contract tests.
 * Reemplaza al antiguo src/__tests__/saleService.dateRange.test.js: el mock
 * vive en la frontera correcta (apiClient de @/services/api) y verifica el
 * contrato actual del servicio: mapeo de parámetros, defaults, alias
 * dateFrom/dateTo/limit y contrato de resultado { success, data, pagination }.
 *
 * Nota: el clamp de page_size / normalización de page lo hace el backend;
 * el servicio los pasa tal cual.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saleService } from '@/services/saleService'
import { apiClient } from '@/services/api'

vi.mock('@/services/api', () => ({
  apiClient: {
    getSalesByDateRange: vi.fn(),
  },
}))

const API_RESPONSE = {
  data: [{ id: 's1', total: 100 }],
  pagination: { page: 1, page_size: 50, total: 1 },
}

describe('saleService.getSalesByDateRange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiClient.getSalesByDateRange.mockResolvedValue(API_RESPONSE)
  })

  it('llama al endpoint con start_date, end_date, page y page_size mapeados', async () => {
    const result = await saleService.getSalesByDateRange({
      start_date: '2025-09-01',
      end_date: '2025-09-30',
      page: 2,
      page_size: 25,
    })

    expect(apiClient.getSalesByDateRange).toHaveBeenCalledWith('2025-09-01', '2025-09-30', 2, 25)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(API_RESPONSE.data)
    expect(result.pagination).toBeDefined()
  })

  it('aplica defaults page=1 y page_size=50', async () => {
    await saleService.getSalesByDateRange({
      start_date: '2025-09-01',
      end_date: '2025-09-30',
    })

    expect(apiClient.getSalesByDateRange).toHaveBeenCalledWith('2025-09-01', '2025-09-30', 1, 50)
  })

  it('acepta los alias dateFrom/dateTo y limit', async () => {
    await saleService.getSalesByDateRange({
      dateFrom: '2025-09-01',
      dateTo: '2025-09-30',
      limit: 25,
    })

    expect(apiClient.getSalesByDateRange).toHaveBeenCalledWith('2025-09-01', '2025-09-30', 1, 25)
  })

  it('pasa page_size sin clampear (el límite lo aplica el backend)', async () => {
    await saleService.getSalesByDateRange({
      start_date: '2025-09-01',
      end_date: '2025-09-30',
      page_size: 500,
    })

    expect(apiClient.getSalesByDateRange).toHaveBeenCalledWith('2025-09-01', '2025-09-30', 1, 500)
  })

  it('devuelve success:false si faltan fechas, sin llamar a la API', async () => {
    const result = await saleService.getSalesByDateRange({ page: 1 })

    expect(apiClient.getSalesByDateRange).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/start_date|end_date|required/i)
  })

  it('devuelve success:false y el mensaje ante un error de API', async () => {
    apiClient.getSalesByDateRange.mockRejectedValue(new Error('Network error'))

    const result = await saleService.getSalesByDateRange({
      start_date: '2025-09-01',
      end_date: '2025-09-30',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })
})
