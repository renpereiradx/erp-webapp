// ===========================================================================
// Tests de la orquestación pedido→caja (PLAN_PEDIDOS_MOSTRADOR — FASE 3.5).
// Mocks en la frontera: módulo del service + store de precarga (hoisted).
// ===========================================================================

import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const preloadStore = vi.hoisted(() => ({
  preload: null as unknown,
  consumePreload: vi.fn((): unknown => null),
  setPreload: vi.fn(),
  clearPreload: vi.fn(),
}))

vi.mock('@/services/counterOrderService', () => ({
  counterOrderService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    claim: vi.fn(),
    release: vi.fn(),
    convert: vi.fn(),
    cancel: vi.fn(),
  },
}))

vi.mock('@/store/useCounterOrderPreloadStore', () => ({
  useCounterOrderPreloadStore: (selector?: (s: typeof preloadStore) => unknown) =>
    selector ? selector(preloadStore) : preloadStore,
}))

import { counterOrderService } from '@/services/counterOrderService'
import { useCounterOrderCheckout, type UseCounterOrderCheckoutOptions } from '../hooks/useCounterOrderCheckout'
import type { CounterOrderDetail, CounterOrderSummary } from '../types'

const claimMock = vi.mocked(counterOrderService.claim)
const releaseMock = vi.mocked(counterOrderService.release)
const convertMock = vi.mocked(counterOrderService.convert)
const getByIdMock = vi.mocked(counterOrderService.getById)

const orderSummary = (): CounterOrderSummary => ({
  id: 'CO-1',
  code: 'PED-ABC234',
  client_id: 'CLIENT-1',
  branch_id: 1,
  status: 'OPEN',
  notes: 'sin maní',
  created_by: 'user-vendor',
  claimed_by: null,
  claimed_at: null,
  converted_sale_id: null,
  converted_at: null,
  cancelled_reason: null,
  cancelled_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  client_name: 'Juan Pérez',
  created_by_name: 'Vendedor Uno',
  claimed_by_name: null,
  item_count: 1,
  total: 182000,
})

const orderDetail = (): CounterOrderDetail => ({
  ...orderSummary(),
  items: [
    {
      id: 1,
      product_id: 'PROD-1',
      variant_id: null,
      quantity: 2,
      unit: 'unit',
      notes: null,
      product_name: 'Coca 2L',
      stock_available: 10,
      stock_warning: false,
      unit_price: 91000,
      tax_rate_id: 1,
      tax_rate_code: 'IVA10',
      tax_rate: 10,
      unit_price_with_tax: 91000,
      unit_price_without_tax: 82727.27,
      tax_amount: 8272.73,
      line_total: 182000,
    },
  ],
  total: 182000,
})

const toast = () => ({
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  addToast: vi.fn(),
})

const t = (key: string, fallback?: string, vars?: Record<string, unknown>) => {
  if (!fallback) return key
  return fallback.replace(/\{(\w+)\}/g, (_, k: string) => String(vars?.[k] ?? `{${k}}`))
}

// Probe: expone la última instancia del hook para aserciones directas.
let latest: ReturnType<typeof useCounterOrderCheckout>
let options: UseCounterOrderCheckoutOptions

function Probe(props: UseCounterOrderCheckoutOptions) {
  latest = useCounterOrderCheckout(props)
  return null
}

const renderHook = (overrides: Partial<UseCounterOrderCheckoutOptions> = {}) => {
  const addItems = vi.fn()
  const opts: UseCounterOrderCheckoutOptions = {
    toast: toast(),
    t,
    addItems,
    ...overrides,
  }
  options = opts
  render(<Probe {...opts} />)
  return { addItems }
}

beforeEach(() => {
  vi.clearAllMocks()
  preloadStore.consumePreload.mockReturnValue(null)
})

afterEach(() => cleanup())

describe('useCounterOrderCheckout', () => {
  it('continueOrder: reclama, mapea ítems a CartItems con flag y avisa con toast', async () => {
    const detail = orderDetail()
    claimMock.mockResolvedValue(detail)
    const { addItems } = renderHook()

    const ok = await latest.continueOrder(orderSummary())
    expect(ok).toBe(true)
    expect(claimMock).toHaveBeenCalledWith('CO-1')
    expect(addItems).toHaveBeenCalledTimes(1)
    const items = addItems.mock.calls[0][0]
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      productId: 'PROD-1',
      quantity: 2,
      price: 91000,
      isFromCounterOrder: true,
      counterOrderId: 'CO-1',
      counterOrderCode: 'PED-ABC234',
    })
    expect(options.toast.success).toHaveBeenCalled()
    expect(latest.hasClaimedOrder()).toBe(true)
  })

  it('continueOrder: claim 409 (otra caja) → false + toast de error, sin ítems', async () => {
    claimMock.mockRejectedValue(new Error('el pedido PED-ABC234 ya está siendo procesado'))
    const { addItems } = renderHook()

    const ok = await latest.continueOrder(orderSummary())
    expect(ok).toBe(false)
    expect(addItems).not.toHaveBeenCalled()
    expect(options.toast.error).toHaveBeenCalledWith(
      expect.stringContaining('ya está siendo procesado'),
    )
    expect(latest.hasClaimedOrder()).toBe(false)
  })

  it('continueOrder con destino merge: activa el modo merge de la página', async () => {
    claimMock.mockResolvedValue(orderDetail())
    const enterMergeMode = vi.fn()
    renderHook({ enterMergeMode })

    const sale = { sale_id: 'SALE-9' }
    await latest.continueOrder(orderSummary(), sale)
    expect(enterMergeMode).toHaveBeenCalledWith(sale)
  })

  it('convertAfterCheckout: marca CONVERTED y limpia el claim', async () => {
    claimMock.mockResolvedValue(orderDetail())
    convertMock.mockResolvedValue({ message: 'ok' })
    renderHook()
    await latest.continueOrder(orderSummary())

    await latest.convertAfterCheckout('SALE-1')
    expect(convertMock).toHaveBeenCalledWith('CO-1', 'SALE-1')
    expect(latest.hasClaimedOrder()).toBe(false)
    expect(options.toast.addToast).not.toHaveBeenCalled()
  })

  it('convertAfterCheckout: si falla, toast accionable con reintento', async () => {
    claimMock.mockResolvedValue(orderDetail())
    convertMock.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ message: 'ok' })
    const addToast = vi.fn()
    renderHook({ toast: { ...toast(), addToast } })
    await latest.continueOrder(orderSummary())

    await latest.convertAfterCheckout('SALE-1')
    expect(addToast).toHaveBeenCalledWith(
      expect.stringContaining('PED-ABC234'),
      'warning',
      expect.any(Number),
      expect.arrayContaining([expect.objectContaining({ label: 'Marcar como procesado' })]),
    )
    // El claim sigue vivo (el pedido no quedó marcado): el reintento lo cierra.
    expect(latest.hasClaimedOrder()).toBe(true)

    const actions = addToast.mock.calls[0][3] as Array<{ onClick: () => void }>
    actions[0].onClick()
    await vi.waitFor(() => {
      expect(convertMock).toHaveBeenCalledTimes(2)
      expect(latest.hasClaimedOrder()).toBe(false)
    })
  })

  it('releaseClaimed: libera el pedido reclamado', async () => {
    claimMock.mockResolvedValue(orderDetail())
    releaseMock.mockResolvedValue({ message: 'ok' })
    renderHook()
    await latest.continueOrder(orderSummary())

    await latest.releaseClaimed()
    expect(releaseMock).toHaveBeenCalledWith('CO-1')
    expect(latest.hasClaimedOrder()).toBe(false)
  })

  it('resumePreload: precarga el pedido reclamado desde la bandeja y abre el wizard', async () => {
    getByIdMock.mockResolvedValue(orderDetail())
    const openWizard = vi.fn()
    const selectClient = vi.fn()
    const { addItems } = renderHook({ openWizard, selectClient })
    preloadStore.consumePreload.mockReturnValueOnce({
      orderId: 'CO-1',
      code: 'PED-ABC234',
      clientId: 'CLIENT-1',
      clientName: 'Juan Pérez',
    })

    await latest.resumePreload()
    expect(getByIdMock).toHaveBeenCalledWith('CO-1')
    expect(addItems).toHaveBeenCalledTimes(1)
    expect(selectClient).toHaveBeenCalledWith({ id: 'CLIENT-1', name: 'Juan Pérez' })
    expect(openWizard).toHaveBeenCalled()
    expect(latest.hasClaimedOrder()).toBe(true)
  })

  it('resumePreload: pedido convertido/cancelado → aviso y sin wizard', async () => {
    getByIdMock.mockResolvedValue({
      ...orderDetail(),
      status: 'CONVERTED',
      converted_sale_id: 'SALE-5',
    })
    const openWizard = vi.fn()
    renderHook({ openWizard })
    preloadStore.consumePreload.mockReturnValueOnce({
      orderId: 'CO-1',
      code: 'PED-ABC234',
      clientId: 'CLIENT-1',
      clientName: 'Juan Pérez',
    })

    await latest.resumePreload()
    expect(openWizard).not.toHaveBeenCalled()
    expect(options.toast.info).toHaveBeenCalled()
  })
})
