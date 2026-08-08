/**
 * Tests for ApiError normalization.
 *
 * Covers the backend's sale/cash-register error shape (flat, snake_case
 * `error_code`) and the HTTP-status → code mapping. The relevant case is the
 * 409 returned when the operator has no open cash register: the backend
 * serializes it as {success:false, error_code:"CONFLICT", message:"..."} and
 * the message contains neither "conflict" nor "409", so before this fix it
 * reached the UI as code:"UNKNOWN".
 */
import { describe, it, expect } from 'vitest'
import { toApiError, ApiError } from '../utils/ApiError'

describe('toApiError', () => {
  it('passes through existing ApiError instances unchanged', () => {
    const original = new ApiError('CONFLICT', 'ya existe', 'hint')
    expect(toApiError(original)).toBe(original)
  })

  it('reads nested error.code (legacy/estándar shape)', () => {
    const err = toApiError({ error: { code: 'NOT_FOUND', message: 'no está' } })
    expect(err.code).toBe('NOT_FOUND')
    expect(err.message).toBe('no está')
  })

  it('reads flat error_code (backend sale/cash-register shape)', () => {
    const err = toApiError({
      success: false,
      error_code: 'CONFLICT',
      message: 'no hay una caja registradora abierta para el usuario',
    })
    expect(err.code).toBe('CONFLICT')
    expect(err.message).toContain('caja registradora')
  })

  it('maps HTTP 409 → CONFLICT deterministically when body has no code', () => {
    // Body without error_code/error.code, and a message that does NOT contain
    // "conflict" or "409" — proves the status mapping (not the regex) is doing
    // the work.
    const err = toApiError({ message: 'algo pasó' }, 'fallback', undefined, 409)
    expect(err.code).toBe('CONFLICT')
  })

  it('maps HTTP 400 → VALIDATION when body has no code', () => {
    const err = toApiError({ message: 'bad input' }, 'fallback', undefined, 400)
    expect(err.code).toBe('VALIDATION')
  })

  it('prefers explicit error_code over HTTP status', () => {
    const err = toApiError(
      { error_code: 'INSUFFICIENT_STOCK', message: 'sin stock' },
      'fallback',
      undefined,
      409,
    )
    expect(err.code).toBe('INSUFFICIENT_STOCK')
  })

  it('falls back to message-based inference when no code and no status', () => {
    const err = toApiError({ message: 'Request failed with status 404' })
    expect(err.code).toBe('NOT_FOUND')
  })

  it('uses UNKNOWN as last resort', () => {
    const err = toApiError({})
    expect(err.code).toBe('UNKNOWN')
  })
})
