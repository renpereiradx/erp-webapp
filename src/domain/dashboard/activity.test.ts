import { describe, expect, it } from 'vitest'
import { formatActorName, getActivityKey } from './activity'

describe('getActivityKey', () => {
  it.each([
    ['sale', 'sale'],
    ['PURCHASE', 'purchase'],
    [' payment ', 'payment'],
    ['adjustment', 'adjustment'],
    ['refund', 'other'],
    [null, 'other'],
    [undefined, 'other'],
  ])('%s → %s', (type, expected) => {
    expect(getActivityKey(type)).toBe(expected)
  })
})

describe('formatActorName', () => {
  it('colapsa un nombre y apellido idénticos (caso ADMINISTRADOR)', () => {
    expect(formatActorName('ADMINISTRADOR ADMINISTRADOR')).toBe('ADMINISTRADOR')
  })

  it('no altera nombres distintos', () => {
    expect(formatActorName('Juan Pérez')).toBe('Juan Pérez')
  })

  it('normaliza espacios y mayúsculas al comparar adyacentes', () => {
    expect(formatActorName('  Oscar   OSCAR  Flores  ')).toBe('Oscar Flores')
  })

  it('solo colapsa repeticiones adyacentes', () => {
    expect(formatActorName('Juan María Juan')).toBe('Juan María Juan')
  })

  it('devuelve "" para valores vacíos', () => {
    expect(formatActorName(null)).toBe('')
    expect(formatActorName('   ')).toBe('')
  })
})
