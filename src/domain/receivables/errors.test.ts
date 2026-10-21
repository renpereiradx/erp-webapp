import { describe, expect, it } from 'vitest'
import { isNotFoundError } from './errors'

describe('receivables/errors (F7)', () => {
  it('reconoce el 404 tipado del API client', () => {
    expect(isNotFoundError({ code: 'NOT_FOUND' })).toBe(true)
    expect(isNotFoundError({ status: 404 })).toBe(true)
    expect(isNotFoundError({ response: { status: 404 } })).toBe(true)
  })

  it('no confunde otros fallos con "no encontrado"', () => {
    expect(isNotFoundError(new Error('offline'))).toBe(false)
    expect(isNotFoundError({ status: 500 })).toBe(false)
    expect(isNotFoundError(null)).toBe(false)
    expect(isNotFoundError('404')).toBe(false)
  })
})
