/**
 * Shared pricing core: rounding utilities for monetary values.
 *
 * Policy: All Guaraní (PYG) prices must be a multiple of 50.
 * Default rounding mode is 'ceil' (always round up) to preserve margin.
 *
 * This is the single source of truth for rounding logic.
 * Components and services must NOT duplicate this math.
 */

/**
 * @typedef {'ceil' | 'floor' | 'nearest'} RoundingMode
 */

/**
 * Rounds a numeric value to the nearest multiple of `step`.
 *
 * @param {number} value - The value to round.
 * @param {number} [step=50] - The step to round to. Must be > 0.
 * @param {RoundingMode} [mode='ceil'] - How to round: 'ceil', 'floor', or 'nearest'.
 * @returns {number} The rounded value.
 * @throws {Error} If value is not finite or step is not > 0.
 *
 * @example
 * roundToStep(12999, 50, 'ceil')  // => 13000
 * roundToStep(12950, 50, 'ceil')  // => 12950  (already a multiple)
 * roundToStep(12951, 50, 'ceil')  // => 13000
 * roundToStep(0, 50, 'ceil')      // => 0
 */
export function roundToStep(value, step = 50, mode = 'ceil') {
  if (!Number.isFinite(value)) {
    throw new Error(`roundToStep: value must be a finite number, got ${value}`)
  }
  if (!Number.isFinite(step) || step <= 0) {
    throw new Error(`roundToStep: step must be a positive finite number, got ${step}`)
  }

  const quotient = value / step

  switch (mode) {
    case 'ceil':
      return Math.ceil(quotient) * step
    case 'floor':
      return Math.floor(quotient) * step
    case 'nearest':
      return Math.round(quotient) * step
    default:
      throw new Error(`roundToStep: unknown mode "${mode}". Use 'ceil', 'floor', or 'nearest'.`)
  }
}

/**
 * Returns true if the value is already a multiple of step.
 *
 * @param {number} value
 * @param {number} [step=50]
 * @returns {boolean}
 */
export function isMultipleOfStep(value, step = 50) {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return false
  return value % step === 0
}
