/**
 * useStockMovementsDraftStore — borrador persistido de la cola de ajustes.
 *
 * Scoping por operador (terminales compartidas, GUIDE_TERMINALES_LOCAL §4):
 * getDraftFor devuelve filas SOLO al dueño; saveDraft/clearDraft no pisan
 * borradores de otro operador. Persistencia vía zustand persist → localStorage.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useStockMovementsDraftStore } from '../useStockMovementsDraftStore'
import type { MovementRowUI } from '@/features/stock-movements/types'

const row = (id: string): MovementRowUI => ({
  product: { id, name: `Producto ${id}` },
  variants: [],
  selectedVariantId: '',
  mode: 'target',
  value: '5',
  unit: 'kg',
  reasonCategory: 'INVENTORY_COUNT',
  reason: '',
})

const resetState = () =>
  useStockMovementsDraftStore.setState({ userId: null, rows: [], savedAt: null })

describe('useStockMovementsDraftStore', () => {
  beforeEach(() => {
    localStorage.clear()
    resetState()
  })

  it('saveDraft persiste filas y dueño en localStorage', () => {
    useStockMovementsDraftStore.getState().saveDraft('USER_A', [row('P1'), row('P2')])

    const s = useStockMovementsDraftStore.getState()
    expect(s.userId).toBe('USER_A')
    expect(s.rows).toHaveLength(2)
    expect(s.savedAt).toBeTruthy()

    const raw = localStorage.getItem('stock-movements-draft')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.userId).toBe('USER_A')
    expect(parsed.state.rows).toHaveLength(2)
  })

  it('getDraftFor entrega las filas al dueño', () => {
    useStockMovementsDraftStore.getState().saveDraft('USER_A', [row('P1')])
    expect(useStockMovementsDraftStore.getState().getDraftFor('USER_A')).toHaveLength(1)
  })

  it('getDraftFor devuelve vacío para otro operador (terminales compartidas)', () => {
    useStockMovementsDraftStore.getState().saveDraft('USER_A', [row('P1')])
    expect(useStockMovementsDraftStore.getState().getDraftFor('USER_B')).toEqual([])
  })

  it('saveDraft con cola vacía limpia el borrador propio', () => {
    const store = useStockMovementsDraftStore.getState()
    store.saveDraft('USER_A', [row('P1')])
    store.saveDraft('USER_A', [])
    expect(useStockMovementsDraftStore.getState().userId).toBeNull()
    expect(useStockMovementsDraftStore.getState().rows).toEqual([])
  })

  it('saveDraft con cola vacía NO pisa el borrador de otro operador', () => {
    useStockMovementsDraftStore.getState().saveDraft('USER_A', [row('P1')])
    useStockMovementsDraftStore.getState().saveDraft('USER_B', [])
    expect(useStockMovementsDraftStore.getState().userId).toBe('USER_A')
    expect(useStockMovementsDraftStore.getState().rows).toHaveLength(1)
  })

  it('clearDraft sin userId limpia siempre (descarte explícito en pantalla)', () => {
    useStockMovementsDraftStore.getState().saveDraft('USER_A', [row('P1')])
    useStockMovementsDraftStore.getState().clearDraft()
    expect(useStockMovementsDraftStore.getState().rows).toEqual([])
  })

  it('clearDraft con userId ajeno respeta la propiedad', () => {
    useStockMovementsDraftStore.getState().saveDraft('USER_A', [row('P1')])
    useStockMovementsDraftStore.getState().clearDraft('USER_B')
    expect(useStockMovementsDraftStore.getState().rows).toHaveLength(1)
  })
})
