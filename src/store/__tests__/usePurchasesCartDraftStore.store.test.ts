/**
 * usePurchasesCartDraftStore — borrador persistido del carrito de /compras.
 *
 * Scoping por operador (terminales compartidas, GUIDE_TERMINALES_LOCAL §4):
 * getDraftFor devuelve el snapshot SOLO al dueño; saveDraft/clearDraft no pisan
 * borradores de otro operador. El snapshot lleva ítems + proveedor + notas
 * (sin proveedor los ítems no se pueden guardar); notas solas NO son borrador.
 * Persistencia vía zustand persist → localStorage.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { usePurchasesCartDraftStore } from '../usePurchasesCartDraftStore'
import type { PurchasesCartDraftData } from '../usePurchasesCartDraftStore'
import type { PurchaseItem } from '@/features/purchases/types'

const item = (id: string): PurchaseItem => ({
  id,
  product_id: `P-${id}`,
  name: `Producto ${id}`,
  sku: 'SKU-1',
  quantity: 2,
  unit_price: 5000,
  unit: 'unit',
  profit_pct: 30,
  sale_price: 6500,
  pricing_mode: 'margin',
  tax_rate_id: null,
  tax_rate: 10,
  price_includes_tax: true,
})

const data = (over: Partial<PurchasesCartDraftData> = {}): PurchasesCartDraftData => ({
  items: [item('IT1')],
  supplier: null,
  notes: '',
  ...over,
})

const resetState = () =>
  usePurchasesCartDraftStore.setState({ userId: null, data: null, savedAt: null })

describe('usePurchasesCartDraftStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetState()
  })

  it('saveDraft persiste snapshot y dueño en localStorage', () => {
    usePurchasesCartDraftStore.getState().saveDraft('USER_A', data({ items: [item('IT1'), item('IT2')] }))

    const s = usePurchasesCartDraftStore.getState()
    expect(s.userId).toBe('USER_A')
    expect(s.data?.items).toHaveLength(2)
    expect(s.savedAt).toBeTruthy()

    const raw = localStorage.getItem('purchases-cart-draft')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.userId).toBe('USER_A')
    expect(parsed.state.data.items).toHaveLength(2)
  })

  it('getDraftFor entrega el snapshot al dueño', () => {
    usePurchasesCartDraftStore.getState().saveDraft('USER_A', data())
    expect(usePurchasesCartDraftStore.getState().getDraftFor('USER_A')?.items).toHaveLength(1)
  })

  it('getDraftFor devuelve null para otro operador (terminales compartidas)', () => {
    usePurchasesCartDraftStore.getState().saveDraft('USER_A', data())
    expect(usePurchasesCartDraftStore.getState().getDraftFor('USER_B')).toBeNull()
  })

  it('saveDraft con snapshot vacío limpia el borrador propio', () => {
    const store = usePurchasesCartDraftStore.getState()
    store.saveDraft('USER_A', data())
    store.saveDraft('USER_A', data({ items: [], supplier: null, notes: '' }))
    expect(usePurchasesCartDraftStore.getState().userId).toBeNull()
    expect(usePurchasesCartDraftStore.getState().data).toBeNull()
  })

  it('saveDraft con proveedor solo (sin ítems) NO se considera vacío', () => {
    usePurchasesCartDraftStore
      .getState()
      .saveDraft('USER_A', data({ items: [], supplier: { id: 'S1', first_name: 'PROVEEDOR' } }))
    expect(usePurchasesCartDraftStore.getState().data?.supplier?.id).toBe('S1')
  })

  it('saveDraft con notas solas (sin ítems ni proveedor) NO constituye borrador', () => {
    usePurchasesCartDraftStore.getState().saveDraft('USER_A', data({ items: [], supplier: null, notes: 'nota' }))
    expect(usePurchasesCartDraftStore.getState().data).toBeNull()
  })

  it('saveDraft con snapshot vacío NO pisa el borrador de otro operador', () => {
    usePurchasesCartDraftStore.getState().saveDraft('USER_A', data())
    usePurchasesCartDraftStore
      .getState()
      .saveDraft('USER_B', { items: [], supplier: null, notes: '' })
    expect(usePurchasesCartDraftStore.getState().userId).toBe('USER_A')
    expect(usePurchasesCartDraftStore.getState().data?.items).toHaveLength(1)
  })

  it('clearDraft sin userId limpia siempre (salir sin guardar en pantalla)', () => {
    usePurchasesCartDraftStore.getState().saveDraft('USER_A', data())
    usePurchasesCartDraftStore.getState().clearDraft()
    expect(usePurchasesCartDraftStore.getState().data).toBeNull()
  })

  it('clearDraft con userId ajeno respeta la propiedad', () => {
    usePurchasesCartDraftStore.getState().saveDraft('USER_A', data())
    usePurchasesCartDraftStore.getState().clearDraft('USER_B')
    expect(usePurchasesCartDraftStore.getState().data?.items).toHaveLength(1)
  })
})
