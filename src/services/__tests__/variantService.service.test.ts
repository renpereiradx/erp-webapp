/**
 * Contrato de variantService.getStockSummary: apiClient.get devuelve el body
 * JSON ya desempaquetado y el handler de Go escribe el resumen directo
 * (writeJSON(w, summary), sin wrapper {data: ...}). Devolver response.data
 * era undefined → react-query rechazaba la query por cada card del catálogo
 * ("Query data cannot be undefined").
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api', () => ({ apiClient: { get: vi.fn() } }))

import { apiClient } from '../api'
import { variantService } from '../variantService'

const getMock = vi.mocked(apiClient.get)

afterEach(() => vi.clearAllMocks())

describe('variantService.getStockSummary', () => {
  it('devuelve el body directo del endpoint (sin .data)', async () => {
    const summary = { product_id: 'p1', branch_id: 3, base_stock: 4, variants_stock: 10, total_stock: 14 }
    getMock.mockResolvedValue(summary)

    await expect(variantService.getStockSummary('p1', 3)).resolves.toEqual(summary)
    expect(getMock).toHaveBeenCalledWith('/products/p1/stock-summary', { params: { branch_id: 3 } })
  })

  it('propaga el error del endpoint (la query cae al fallback de las cards)', async () => {
    getMock.mockRejectedValue(new Error('stock-summary 500'))
    await expect(variantService.getStockSummary('p1')).rejects.toThrow('stock-summary 500')
  })
})
