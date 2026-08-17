import { describe, it, expect } from 'vitest'

import {
  PARTY_DOCUMENT_TYPES,
  PARTY_COUNTRIES,
  isISOAlpha2,
  normalizeDocumentType,
  isValidDocumentType,
  isPartyCountry,
  countryDisplayName,
} from '@/domain/party/identity'

describe('domain/party/identity — document types', () => {
  it('refleja la whitelist del backend (12 valores en mayúsculas)', () => {
    expect(PARTY_DOCUMENT_TYPES).toHaveLength(12)
    for (const dt of PARTY_DOCUMENT_TYPES) {
      expect(dt).toBe(dt.toUpperCase())
    }
  })

  describe('normalizeDocumentType', () => {
    it.each([
      ['CI', 'CI'],
      ['ci', 'CI'],
      ['  Ruc ', 'RUC'],
      ['passport', 'PASSPORT'],
    ])('canonicaliza %p → %p', (input, expected) => {
      expect(normalizeDocumentType(input)).toBe(expected)
    })

    it.each([
      ['LIBRETA'],
      ['C.I.'],
      [''],
      ['   '],
      [null],
      [undefined],
    ])('rechaza %p con string vacío', input => {
      expect(normalizeDocumentType(input)).toBe('')
    })
  })

  it('isValidDocumentType delega en la whitelist', () => {
    expect(isValidDocumentType('cnpj')).toBe(true)
    expect(isValidDocumentType('XX')).toBe(false)
  })
})

describe('domain/party/identity — países ISO 3166-1 alpha-2', () => {
  it('acepta códigos alpha-2 válidos y rechaza el resto', () => {
    expect(isISOAlpha2('PY')).toBe(true)
    expect(isISOAlpha2('ar')).toBe(false)
    expect(isISOAlpha2('PRY')).toBe(false)
    expect(isISOAlpha2('P1')).toBe(false)
    expect(isISOAlpha2('')).toBe(false)
    expect(isISOAlpha2(null)).toBe(false)
  })

  it('todos los países de la lista son alpha-2 y únicos', () => {
    expect(new Set(PARTY_COUNTRIES).size).toBe(PARTY_COUNTRIES.length)
    for (const code of PARTY_COUNTRIES) {
      expect(isISOAlpha2(code)).toBe(true)
    }
  })

  it('la lista está curada con América primero (raíz PY)', () => {
    expect(PARTY_COUNTRIES[0]).toBe('PY')
    expect(isPartyCountry('AR')).toBe(true)
    expect(isPartyCountry('ZZ')).toBe(false)
  })

  describe('countryDisplayName', () => {
    it('localiza el nombre vía Intl.DisplayNames', () => {
      expect(countryDisplayName('PY', 'es')).toBe('Paraguay')
    })

    it('hace fallback al código ante entrada sintácticamente inválida', () => {
      expect(countryDisplayName('xyz')).toBe('xyz')
      expect(countryDisplayName('P1')).toBe('P1')
    })

    it('no lanza ante códigos válidos pero no asignados (ZZ)', () => {
      // Algunas versiones de ICU devuelven "Región desconocida" en vez
      // de undefined; con cualquiera de las dos no debe crashear.
      expect(typeof countryDisplayName('ZZ')).toBe('string')
    })
  })
})
