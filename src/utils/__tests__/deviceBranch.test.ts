/**
 * deviceBranch (D.3/D.4 + FASE E — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
 * Helpers de localStorage para el binding de la terminal: nivel 1
 * (device.defaultBranch) + registro en backend (device.id → header
 * X-Device-ID). setPairedDevice/clearPairedDevice manejan ambas claves.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  DEVICE_DEFAULT_BRANCH_KEY,
  DEVICE_ID_KEY,
  clearPairedDevice,
  pairDeviceWithBranch,
  readDeviceDefaultBranch,
  readDeviceId,
  setPairedDevice,
  unpairDevice,
} from '../deviceBranch'

describe('deviceBranch helpers', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('reads unset keys as null', () => {
    expect(readDeviceDefaultBranch()).toBeNull()
    expect(readDeviceId()).toBeNull()
  })

  it('stores and clears the full device binding (FASE E)', () => {
    setPairedDevice(7, 2)

    expect(localStorage.getItem(DEVICE_ID_KEY)).toBe('7')
    expect(readDeviceId()).toBe(7)
    expect(readDeviceDefaultBranch()).toBe(2)

    clearPairedDevice()
    expect(localStorage.getItem(DEVICE_ID_KEY)).toBeNull()
    expect(localStorage.getItem(DEVICE_DEFAULT_BRANCH_KEY)).toBeNull()
    expect(readDeviceId()).toBeNull()
  })

  it('treats invalid device ids as unpaired', () => {
    localStorage.setItem(DEVICE_ID_KEY, '0')
    expect(readDeviceId()).toBeNull()
    localStorage.setItem(DEVICE_ID_KEY, 'not-a-number')
    expect(readDeviceId()).toBeNull()
  })

  it('level-1 helpers keep working standalone', () => {
    const handler = vi.fn()
    window.addEventListener('device:branch_changed', handler)
    pairDeviceWithBranch(3)
    expect(readDeviceDefaultBranch()).toBe(3)
    expect(handler).toHaveBeenCalledTimes(1)

    unpairDevice()
    expect(readDeviceDefaultBranch()).toBeNull()
    expect(handler).toHaveBeenCalledTimes(2)
    window.removeEventListener('device:branch_changed', handler)
  })
})
