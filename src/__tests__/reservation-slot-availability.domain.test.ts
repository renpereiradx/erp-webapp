/**
 * Tests for the reservation slot availability domain.
 * Covers: slot bookability and max consecutive duration from a start time.
 */

import { describe, it, expect } from 'vitest'
import {
  isSlotBookable,
  getMaxConsecutiveDuration,
  getBookableSlots,
} from '../domain/reservation/slotAvailability'

const slot = (start: string, end: string, status = 'AVAILABLE', reserve?: unknown) => ({
  start_time: start,
  end_time: end,
  status,
  ...(reserve !== undefined ? { reserve } : {}),
})

// ─────────────────────────────────────────────────────────────
// isSlotBookable
// ─────────────────────────────────────────────────────────────
describe('isSlotBookable', () => {
  it('accepts a slot with status AVAILABLE and no reservation', () => {
    expect(isSlotBookable(slot('2026-08-14T10:00:00', '2026-08-14T11:00:00'))).toBe(true)
  })

  it('rejects a slot with a reservation attached even if status says AVAILABLE', () => {
    expect(
      isSlotBookable(slot('2026-08-14T10:00:00', '2026-08-14T11:00:00', 'AVAILABLE', { id: 3 })),
    ).toBe(false)
  })

  it('rejects slots with occupied statuses', () => {
    for (const status of ['RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']) {
      expect(isSlotBookable(slot('2026-08-14T10:00:00', '2026-08-14T11:00:00', status))).toBe(false)
    }
  })
})

// ─────────────────────────────────────────────────────────────
// getMaxConsecutiveDuration
// ─────────────────────────────────────────────────────────────
describe('getMaxConsecutiveDuration', () => {
  const day = [
    slot('2026-08-14T08:00:00', '2026-08-14T09:00:00'),
    slot('2026-08-14T09:00:00', '2026-08-14T10:00:00'),
    slot('2026-08-14T10:00:00', '2026-08-14T11:00:00', 'CONFIRMED', { id: 1 }),
    slot('2026-08-14T11:00:00', '2026-08-14T12:00:00'),
    slot('2026-08-14T12:00:00', '2026-08-14T13:00:00'),
  ]

  it('counts consecutive bookable slots from the selected start', () => {
    // From 11:00: 11:00 and 12:00 are bookable → 2
    expect(getMaxConsecutiveDuration(day, '2026-08-14T11:00:00')).toBe(2)
  })

  it('stops at the first occupied slot', () => {
    // From 08:00: 08:00, 09:00 bookable, 10:00 occupied → 2
    expect(getMaxConsecutiveDuration(day, '2026-08-14T08:00:00')).toBe(2)
  })

  it('caps the run at the configured max duration', () => {
    const freeDay = [
      slot('2026-08-14T08:00:00', '2026-08-14T09:00:00'),
      slot('2026-08-14T09:00:00', '2026-08-14T10:00:00'),
      slot('2026-08-14T10:00:00', '2026-08-14T11:00:00'),
      slot('2026-08-14T11:00:00', '2026-08-14T12:00:00'),
      slot('2026-08-14T12:00:00', '2026-08-14T13:00:00'),
    ]
    expect(getMaxConsecutiveDuration(freeDay, '2026-08-14T08:00:00', 3)).toBe(3)
    expect(getMaxConsecutiveDuration(freeDay, '2026-08-14T08:00:00', 4)).toBe(4)
  })

  it('the selected slot itself counts as 1', () => {
    // From 12:00 (last slot): only itself → 1
    expect(getMaxConsecutiveDuration(day, '2026-08-14T12:00:00')).toBe(1)
  })

  it('returns the fallback max when there is no start time or no slots', () => {
    expect(getMaxConsecutiveDuration(day, null, 4)).toBe(4)
    expect(getMaxConsecutiveDuration([], '2026-08-14T08:00:00', 4)).toBe(4)
  })

  it('returns the fallback max when the start time does not match any slot', () => {
    expect(getMaxConsecutiveDuration(day, '2026-08-14T07:00:00', 4)).toBe(4)
  })

  it('sorts unsorted input chronologically', () => {
    const shuffled = [...day].reverse()
    expect(getMaxConsecutiveDuration(shuffled, '2026-08-14T11:00:00')).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────
// getBookableSlots
// ─────────────────────────────────────────────────────────────
describe('getBookableSlots', () => {
  it('filters occupied slots and sorts chronologically', () => {
    const day = [
      slot('2026-08-14T12:00:00', '2026-08-14T13:00:00'),
      slot('2026-08-14T10:00:00', '2026-08-14T11:00:00', 'CONFIRMED', { id: 1 }),
      slot('2026-08-14T09:00:00', '2026-08-14T10:00:00'),
    ]
    const bookable = getBookableSlots(day)
    expect(bookable.map((s) => s.start_time)).toEqual([
      '2026-08-14T09:00:00',
      '2026-08-14T12:00:00',
    ])
  })
})
