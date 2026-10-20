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

/**
 * getVariantById: `/api/v1/variants/{id}` responde la variante directa (el
 * handler no usa envelope). Devolver response.data daba undefined y la
 * cabecera del drill-down F3 caía al id en vez del nombre de la variante.
 */
describe('variantService.getVariantById', () => {
  it('devuelve la variante directa del body', async () => {
    const variant = { id: 'VAR-1', variant_name: 'Rojo M', sku: 'AD-R-M' }
    getMock.mockResolvedValue(variant)

    await expect(variantService.getVariantById('VAR-1')).resolves.toEqual(variant)
    expect(getMock).toHaveBeenCalledWith('/api/v1/variants/VAR-1')
  })

  it('tolera un envelope {data} si el endpoint cambia', async () => {
    const variant = { id: 'VAR-1', variant_name: 'Rojo M', sku: 'AD-R-M' }
    getMock.mockResolvedValue({ data: variant })

    await expect(variantService.getVariantById('VAR-1')).resolves.toEqual(variant)
  })
})
