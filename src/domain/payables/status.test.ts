import { describe, expect, it } from 'vitest'
import {
  PAYABLES_BEHAVIOR_TONE,
  PAYABLES_IMPORTANCE_TONE,
  PAYABLES_PRIORITY_TONE,
  PAYABLES_STATUS_TONE,
  payablesBehaviorKey,
  payablesBehaviorLabelKey,
  payablesImportanceKey,
  payablesImportanceLabelKey,
  payablesPriorityKey,
  payablesPriorityLabelKey,
  payablesStatusKey,
  payablesStatusLabelKey,
  toPriorityParam,
  toStatusParam,
} from './status'

describe('payables/status', () => {
  it('mapea estados del contrato y tolera desconocidos', () => {
    expect(payablesStatusKey('PENDING')).toBe('pending')
    expect(payablesStatusKey('partial')).toBe('partial')
    expect(payablesStatusKey('OVERDUE')).toBe('overdue')
    expect(payablesStatusKey('PAID')).toBe('paid')
    expect(payablesStatusKey('WHATEVER')).toBe('unknown')
    expect(payablesStatusKey(null)).toBe('unknown')
    expect(payablesStatusLabelKey('OVERDUE')).toBe('payables.status.overdue')
    expect(PAYABLES_STATUS_TONE.overdue).toBe('error')
  })

  it('el filtro ALL no viaja al BE', () => {
    expect(toStatusParam('ALL')).toBeUndefined()
    expect(toStatusParam('OVERDUE')).toBe('OVERDUE')
    expect(toPriorityParam('ALL')).toBeUndefined()
    expect(toPriorityParam('URGENT')).toBe('URGENT')
  })

  it('mapea prioridades del BE', () => {
    expect(payablesPriorityKey('URGENT')).toBe('urgent')
    expect(payablesPriorityKey('HIGH')).toBe('high')
    expect(payablesPriorityKey('MEDIUM')).toBe('medium')
    expect(payablesPriorityKey('LOW')).toBe('low')
    expect(payablesPriorityKey('')).toBe('unknown')
    expect(payablesPriorityLabelKey('HIGH')).toBe('payables.priority.high')
    expect(PAYABLES_PRIORITY_TONE.urgent).toBe('error')
  })

  it('mapea comportamiento de pago e importancia', () => {
    expect(payablesBehaviorKey('EXCELLENT')).toBe('excellent')
    expect(payablesBehaviorKey('POOR')).toBe('poor')
    expect(payablesBehaviorKey('NONE')).toBe('unknown')
    expect(payablesBehaviorLabelKey('GOOD')).toBe('payables.behavior.good')
    expect(PAYABLES_BEHAVIOR_TONE.excellent).toBe('success')

    expect(payablesImportanceKey('CRITICAL')).toBe('critical')
    expect(payablesImportanceKey('LOW')).toBe('low')
    expect(payablesImportanceKey(undefined)).toBe('unknown')
    expect(payablesImportanceLabelKey('HIGH')).toBe('payables.importance.high')
    expect(PAYABLES_IMPORTANCE_TONE.critical).toBe('error')
  })
})
