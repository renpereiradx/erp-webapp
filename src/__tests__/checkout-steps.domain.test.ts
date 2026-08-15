/**
 * Tests for the SaleCheckoutWizard step composition (pure domain logic).
 *
 * Covers the "Reservas" step visibility rules:
 * - hidden when the cart already carries an item with `reserve_id`
 *   (backend allows a single reservation per sale);
 * - visible otherwise when there are pending reservations or a selected
 *   client (walk-in registration keeps working).
 */

import { describe, it, expect } from 'vitest'
import {
  computeCheckoutSteps,
  type CheckoutStepsInput,
} from '../features/sales/checkoutSteps'

const base: CheckoutStepsInput = {
  activeSalesCount: 0,
  pendingReservationsCount: 0,
  hasClient: false,
  hasReserveInCart: false,
}

const input = (overrides: Partial<CheckoutStepsInput> = {}): CheckoutStepsInput => ({
  ...base,
  ...overrides,
})

// ─────────────────────────────────────────────────────────────
// computeCheckoutSteps
// ─────────────────────────────────────────────────────────────
describe('computeCheckoutSteps', () => {
  it('always ends the flow with payment and collection', () => {
    const steps = computeCheckoutSteps(input())
    expect(steps[0]).toBe('client')
    expect(steps.slice(-2)).toEqual(['payment', 'collection'])
  })

  it('shows reservations when the client has pending confirmed reservations', () => {
    const steps = computeCheckoutSteps(input({ pendingReservationsCount: 2 }))
    expect(steps).toContain('reservations')
  })

  it('shows reservations when a client is selected (walk-in path)', () => {
    const steps = computeCheckoutSteps(input({ hasClient: true }))
    expect(steps).toContain('reservations')
  })

  it('hides reservations when the cart already has an item with reserve_id, even with a client selected', () => {
    const steps = computeCheckoutSteps(
      input({ hasClient: true, pendingReservationsCount: 3, hasReserveInCart: true }),
    )
    expect(steps).not.toContain('reservations')
    expect(steps).toEqual(['client', 'payment', 'collection'])
  })

  it('keeps reservations visible when no reservation is loaded (walk-in still works)', () => {
    const steps = computeCheckoutSteps(input({ hasClient: true, hasReserveInCart: false }))
    expect(steps).toContain('reservations')
  })

  it('shows pending before reservations when both apply', () => {
    const steps = computeCheckoutSteps(
      input({ activeSalesCount: 1, pendingReservationsCount: 1 }),
    )
    expect(steps).toEqual(['client', 'pending', 'reservations', 'payment', 'collection'])
  })

  it('omits pending and reservations when neither applies', () => {
    const steps = computeCheckoutSteps(input())
    expect(steps).toEqual(['client', 'payment', 'collection'])
  })

  it('hides reservations when a reserve is in the cart even without a selected client', () => {
    const steps = computeCheckoutSteps(input({ hasReserveInCart: true }))
    expect(steps).not.toContain('reservations')
  })
})
