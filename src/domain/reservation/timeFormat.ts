/**
 * Time formatting for reservation slots (UI-agnostic).
 *
 * Slot times arrive as ISO strings ("2026-10-14T16:00:00Z", naive local
 * tagged as Z by the backend). Shared by the agenda timeline and the
 * new-reservation form so both render identical hour labels.
 */

export const formatSlotTime = (timeStr: string): string => {
  if (!timeStr) return ''
  try {
    const parts = timeStr.split('T')
    if (parts.length >= 2) {
      const timePart = parts[1].split(':')
      return `${timePart[0]}:${timePart[1]}`
    }
    return timeStr.substring(11, 16)
  } catch {
    return timeStr
  }
}

/** End time of a range: start + duration hours, formatted as HH:mm. */
export const formatSlotRangeEnd = (startTime: string, durationHours: number): string => {
  if (!startTime) return ''
  try {
    const end = new Date(new Date(startTime).getTime() + durationHours * 60 * 60 * 1000)
    return formatSlotTime(end.toISOString())
  } catch {
    return ''
  }
}
