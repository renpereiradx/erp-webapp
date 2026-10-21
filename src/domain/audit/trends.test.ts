import { describe, expect, it } from 'vitest'
import type { AuditDailyActivity, AuditTrendPoint } from '@/types/bi'
import {
  auditGranularityForPeriod,
  buildAuditDailyData,
  buildAuditTrendData,
  formatAuditBucketLabel,
  maxAuditChartValue,
} from './trends'

const trend = (overrides: Partial<AuditTrendPoint> = {}): AuditTrendPoint => ({
  date: '2026-10-20T00:00:00Z',
  label: '20 Oct',
  total_actions: 6,
  successful: 5,
  failed: 1,
  unique_users: 2,
  error_rate: 16.6667,
  ...overrides,
})

describe('audit/trends', () => {
  it('replica la granularidad del repo de auditoría', () => {
    // today = 1 día → horaria
    expect(
      auditGranularityForPeriod({
        start_date: '2026-10-21T00:00:00-03:00',
        end_date: '2026-10-22T00:00:00-03:00',
      }),
    ).toBe('hourly')
    // week rolling = 8 días → diaria
    expect(
      auditGranularityForPeriod({
        start_date: '2026-10-14T15:00:00-03:00',
        end_date: '2026-10-22T15:00:00-03:00',
      }),
    ).toBe('daily')
    // mes ≈ 31 días → diaria
    expect(
      auditGranularityForPeriod({
        start_date: '2026-10-01T00:00:00-03:00',
        end_date: '2026-11-01T00:00:00-03:00',
      }),
    ).toBe('daily')
    // año = 365 días → semanal
    expect(
      auditGranularityForPeriod({
        start_date: '2026-01-01T00:00:00-03:00',
        end_date: '2027-01-01T00:00:00-03:00',
      }),
    ).toBe('weekly')
  })

  it('sin período válido cae a diaria', () => {
    expect(auditGranularityForPeriod(null)).toBe('daily')
    expect(
      auditGranularityForPeriod({ start_date: 'nope', end_date: '2026-01-01' }),
    ).toBe('daily')
    expect(
      auditGranularityForPeriod({
        start_date: '2026-10-01T00:00:00-03:00',
        end_date: '2026-10-01T00:00:00-03:00',
      }),
    ).toBe('daily')
  })

  it('re-deriva la etiqueta: date-only en UTC, semanal en local, nunca el label inglés', () => {
    expect(formatAuditBucketLabel(trend(), 'daily', 'es')).toBe('20 oct')
    expect(formatAuditBucketLabel(trend(), 'daily', 'es')).not.toContain('Oct')
    expect(
      formatAuditBucketLabel({ date: '2026-02-02T00:00:00-03:00' }, 'weekly', 'es'),
    ).toBe(
      new Date('2026-02-02T00:00:00-03:00').toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
      }),
    )
    expect(formatAuditBucketLabel({ date: 'nope' }, 'daily', 'es')).toBe('—')
    expect(
      formatAuditBucketLabel({ date: '2026-10-20T17:00:00Z' }, 'hourly', 'es'),
    ).toBe(
      new Date('2026-10-20T17:00:00Z').toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    )
  })

  it('arma los puntos del gráfico con los valores reales', () => {
    const data = buildAuditTrendData([trend(), trend({ date: '2026-10-21T00:00:00Z', total_actions: 2 })], 'daily', 'es')
    expect(data).toHaveLength(2)
    expect(data[0]).toMatchObject({
      label: '20 oct',
      total: 6,
      successful: 5,
      failed: 1,
      uniqueUsers: 2,
    })
    expect(data[1].total).toBe(2)
    expect(maxAuditChartValue(data)).toBe(6)
    expect(buildAuditTrendData(null, 'daily')).toEqual([])
    expect(maxAuditChartValue([])).toBe(0)
  })

  it('acciones por día de la ficha: date-only en UTC', () => {
    const days: AuditDailyActivity[] = [
      { date: '2026-04-21T00:00:00Z', label: '21 Apr', actions: 56, success: 56, failed: 0 },
    ]
    const data = buildAuditDailyData(days, 'es')
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({ label: '21 abr', total: 56, failed: 0 })
    expect(buildAuditDailyData(null, 'es')).toEqual([])
  })
})
