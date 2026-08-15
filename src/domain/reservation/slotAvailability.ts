/**
 * Slot availability rules for reservations.
 *
 * Pure domain logic (no React, no HTTP): determines how many consecutive
 * hours are bookable from a given start time based on the day's schedule
 * slots. Shared by the agenda timeline and the walk-in checkout form so both
 * compute the same maximum duration.
 */

export interface BookableSlot {
  start_time: string
  end_time: string
  status: string
  /** Present when the slot is tied to a reservation (normalized API shape). */
  reserve?: unknown
}

/**
 * A slot is bookable when it has no reservation attached and its status is
 * AVAILABLE. Normalized slots may express occupation either way, so both are
 * checked (mirrors the agenda's ReservationForm behavior).
 */
export const isSlotBookable = (slot: BookableSlot): boolean =>
  !slot.reserve && slot.status === 'AVAILABLE'

/**
 * Returns the maximum duration (in hours) that can be booked starting at
 * `startTime`: counts the run of consecutive bookable slots from the selected
 * one onwards, capped at `maxDuration` (the product's configured maximum).
 * Returns 0 when the start time does not match any slot or the run is broken
 * at the very first slot.
 */
export const getMaxConsecutiveDuration = (
  slots: BookableSlot[],
  startTime: string | null,
  maxDuration = 4,
): number => {
  if (!startTime || slots.length === 0) return maxDuration

  const sorted = [...slots].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  )

  const startIndex = sorted.findIndex((s) => s.start_time === startTime)
  if (startIndex === -1) return maxDuration

  let consecutive = 1 // the selected slot counts as 1
  for (let i = startIndex + 1; i < sorted.length; i++) {
    if (!isSlotBookable(sorted[i])) break // stop at the first occupied slot
    consecutive++
  }

  return Math.min(consecutive, maxDuration)
}

/**
 * Lists the bookable slots of the day (sorted chronologically) — the options
 * for a walk-in start time.
 */
export const getBookableSlots = (slots: BookableSlot[]): BookableSlot[] =>
  slots
    .filter(isSlotBookable)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
