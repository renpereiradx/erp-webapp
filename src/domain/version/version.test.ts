import { describe, expect, it } from 'vitest'
import {
  compareWithBackend,
  displayBuildDate,
  displayVersion,
  normalizeVersion,
  versionBase,
} from './version'

describe('normalizeVersion', () => {
  it('quita el prefijo v y espacios', () => {
    expect(normalizeVersion(' v1.2.0 ')).toBe('1.2.0')
    expect(normalizeVersion('V1.2.0')).toBe('1.2.0')
  })

  it('conserva sufijos de build', () => {
    expect(normalizeVersion('v1.2.0-3-gabc')).toBe('1.2.0-3-gabc')
    expect(normalizeVersion('1.2.0-dirty')).toBe('1.2.0-dirty')
  })

  it('vacío para entradas vacías', () => {
    expect(normalizeVersion('')).toBe('')
    expect(normalizeVersion(null)).toBe('')
    expect(normalizeVersion(undefined)).toBe('')
  })
})

describe('versionBase', () => {
  it('descarta sufijos de build', () => {
    expect(versionBase('v1.2.0-3-gabc')).toBe('1.2.0')
    expect(versionBase('1.2.0-dirty')).toBe('1.2.0')
    expect(versionBase('1.2.0')).toBe('1.2.0')
  })

  it('vacío para entradas vacías', () => {
    expect(versionBase('')).toBe('')
    expect(versionBase(null)).toBe('')
  })
})

describe('compareWithBackend', () => {
  const backend = { version: 'v1.2.0-6-g9a91a32', commit: '9a91a32', build_date: '2026-10-07T10:00:00Z' }

  it('match cuando la base coincide (sufijos de build del BE no molestan)', () => {
    expect(compareWithBackend('1.2.0', backend)).toBe('match')
    expect(compareWithBackend('v1.2.0', { ...backend, version: 'v1.2.0' })).toBe('match')
  })

  it('diverged cuando las bases difieren (instalación parcialmente actualizada)', () => {
    expect(compareWithBackend('1.3.0', backend)).toBe('diverged')
    expect(compareWithBackend('1.2.0', { ...backend, version: 'v1.0.0' })).toBe('diverged')
  })

  it('unknown sin datos de backend o con versiones vacías', () => {
    expect(compareWithBackend('1.2.0', null)).toBe('unknown')
    expect(compareWithBackend('1.2.0', undefined)).toBe('unknown')
    expect(compareWithBackend('1.2.0', { ...backend, version: '' })).toBe('unknown')
    expect(compareWithBackend('', backend)).toBe('unknown')
  })
})

describe('displayVersion', () => {
  it('devuelve la base con prefijo v', () => {
    expect(displayVersion('1.2.0-3-gabc')).toBe('v1.2.0')
    expect(displayVersion('v1.2.0')).toBe('v1.2.0')
  })

  it('vacío si no hay versión (el badge no renderiza)', () => {
    expect(displayVersion('')).toBe('')
    expect(displayVersion(null)).toBe('')
  })
})

describe('displayBuildDate', () => {
  it('extrae la parte fecha de un RFC3339', () => {
    expect(displayBuildDate('2026-10-07T10:00:00Z')).toBe('2026-10-07')
    expect(displayBuildDate('2026-10-07')).toBe('2026-10-07')
  })

  it('vacío para valores no fechados', () => {
    expect(displayBuildDate('unknown')).toBe('')
    expect(displayBuildDate('')).toBe('')
    expect(displayBuildDate(null)).toBe('')
  })
})
