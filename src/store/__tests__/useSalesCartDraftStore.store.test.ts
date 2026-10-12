/**
 * useSalesCartDraftStore — borrador persistido del carrito de /ventas.
 *
 * Scoping por operador (terminales compartidas, GUIDE_TERMINALES_LOCAL §4):
 * getDraftFor devuelve el snapshot SOLO al dueño; saveDraft/clearDraft no pisan
 * borradores de otro operador. Snapshot COHERENTE: ítems + cliente + venta en
 * merge viajan juntos (restaurar ítems de merge sin saleId duplicaría la venta).
 * Persistencia vía zustand persist → localStorage.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useSalesCartDraftStore } from '../useSalesCartDraftStore'
import type { SalesCartDraftData } from '../useSalesCartDraftStore'
import type { CartItem } from '@/features/sales/types/cart'

const item = (id: string): CartItem => ({
  id,
  productId: `P-${id}`,
  name: `Producto ${id}`,
  quantity: 1,
  price: 100,
  originalPrice: 100,
  discount: 0,
  discountType: 'amount',
  discountInput: 0,
  discountReason: '',
  taxRate: 0.1,
  unit: 'unit',
})

const data = (over: Partial<SalesCartDraftData> = {}): SalesCartDraftData => ({
  items: [item('IT1')],
  client: null,
  saleId: null,
  saleBranchId: null,
  ...over,
})

const resetState = () =>
  useSalesCartDraftStore.setState({ userId: null, data: null, savedAt: null })

describe('useSalesCartDraftStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetState()
  })

  it('saveDraft persiste snapshot y dueño en localStorage', () => {
    useSalesCartDraftStore.getState().saveDraft('USER_A', data({ items: [item('IT1'), item('IT2')] }))

    const s = useSalesCartDraftStore.getState()
    expect(s.userId).toBe('USER_A')
    expect(s.data?.items).toHaveLength(2)
    expect(s.savedAt).toBeTruthy()

    const raw = localStorage.getItem('sales-cart-draft')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.userId).toBe('USER_A')
    expect(parsed.state.data.items).toHaveLength(2)
  })

  it('getDraftFor entrega el snapshot al dueño', () => {
    useSalesCartDraftStore.getState().saveDraft('USER_A', data())
    expect(useSalesCartDraftStore.getState().getDraftFor('USER_A')?.items).toHaveLength(1)
  })

  it('getDraftFor devuelve null para otro operador (terminales compartidas)', () => {
    useSalesCartDraftStore.getState().saveDraft('USER_A', data())
    expect(useSalesCartDraftStore.getState().getDraftFor('USER_B')).toBeNull()
  })

  it('saveDraft con snapshot vacío limpia el borrador propio', () => {
    const store = useSalesCartDraftStore.getState()
    store.saveDraft('USER_A', data())
    store.saveDraft('USER_A', data({ items: [], client: null, saleId: null, saleBranchId: null }))
    expect(useSalesCartDraftStore.getState().userId).toBeNull()
    expect(useSalesCartDraftStore.getState().data).toBeNull()
  })

  it('saveDraft con cliente solo (sin ítems) NO se considera vacío', () => {
    useSalesCartDraftStore.getState().saveDraft('USER_A', data({ items: [], client: { id: 'C1', name: 'Cliente' } }))
    expect(useSalesCartDraftStore.getState().data?.client?.id).toBe('C1')
  })

  it('saveDraft con snapshot vacío NO pisa el borrador de otro operador', () => {
    useSalesCartDraftStore.getState().saveDraft('USER_A', data())
    useSalesCartDraftStore.getState().saveDraft('USER_B', { items: [], client: null, saleId: null, saleBranchId: null })
    expect(useSalesCartDraftStore.getState().userId).toBe('USER_A')
    expect(useSalesCartDraftStore.getState().data?.items).toHaveLength(1)
  })

  it('clearDraft sin userId limpia siempre (salir sin guardar en pantalla)', () => {
    useSalesCartDraftStore.getState().saveDraft('USER_A', data())
    useSalesCartDraftStore.getState().clearDraft()
    expect(useSalesCartDraftStore.getState().data).toBeNull()
  })

  it('clearDraft con userId ajeno respeta la propiedad', () => {
    useSalesCartDraftStore.getState().saveDraft('USER_A', data())
    useSalesCartDraftStore.getState().clearDraft('USER_B')
    expect(useSalesCartDraftStore.getState().data?.items).toHaveLength(1)
  })
})
