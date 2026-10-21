import { describe, expect, it } from 'vitest'
import { formatJsonValue, hasJsonContent } from './json'

describe('audit/json', () => {
  it('formatea objetos y arrays con indentación', () => {
    expect(formatJsonValue({ status: 'COMPLETED' })).toBe(
      '{\n  "status": "COMPLETED"\n}',
    )
    expect(formatJsonValue([1, 2])).toBe('[\n  1,\n  2\n]')
  })

  it('acepta strings JSON y texto plano', () => {
    expect(formatJsonValue('{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(formatJsonValue('not json')).toBe('not json')
  })

  it('sin contenido → null (no se renderiza un {} inventado)', () => {
    expect(formatJsonValue(null)).toBeNull()
    expect(formatJsonValue(undefined)).toBeNull()
    expect(formatJsonValue('')).toBeNull()
    expect(formatJsonValue('null')).toBeNull()
    expect(formatJsonValue({})).toBeNull()
    expect(formatJsonValue([])).toBeNull()
    expect(hasJsonContent({})).toBe(false)
    expect(hasJsonContent({ a: 1 })).toBe(true)
    expect(hasJsonContent([1])).toBe(true)
    expect(hasJsonContent(null)).toBe(false)
  })
})
