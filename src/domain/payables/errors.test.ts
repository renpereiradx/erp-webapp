import { describe, expect, it } from 'vitest'
import { isNotFoundError } from './errors'

describe('payables/errors', () => {
  it('reconoce el 404 tipado en sus tres formas', () => {
    expect(isNotFoundError({ status: 404 })).toBe(true)
    expect(isNotFoundError({ code: 'NOT_FOUND' })).toBe(true)
    expect(isNotFoundError({ response: { status: 404 } })).toBe(true)
  })

  it('no confunde otros errores ni valores vacíos', () => {
    expect(isNotFoundError(new Error('boom'))).toBe(false)
    expect(isNotFoundError({ status: 500 })).toBe(false)
    expect(isNotFoundError(null)).toBe(false)
    expect(isNotFoundError('404')).toBe(false)
  })
})
