import { describe, expect, it } from 'vitest'
import type { AuditKPIs, AuditUserActivitySummary } from '@/types/bi'
import {
  auditDashboardKpis,
  auditSuccessRateLabel,
  auditUserKpis,
  formatAuditKpiValue,
} from './kpis'

const kpis = (overrides: Partial<AuditKPIs> = {}): AuditKPIs => ({
  total_actions: 180,
  successful_actions: 170,
  failed_actions: 10,
  success_rate: 94.44444444444444,
  unique_users: 13,
  unique_sessions: 10,
  avg_actions_per_user: 13.846153846153847,
  avg_actions_per_session: 18,
  peak_hour: 19,
  peak_hour_actions: 60,
  critical_errors: 0,
  security_incidents: 0,
  ...overrides,
})

const summary = (overrides: Partial<AuditUserActivitySummary> = {}): AuditUserActivitySummary => ({
  user_id: 'jJkV4F6HR',
  username: 'admin',
  total_actions: 163,
  successful_actions: 153,
  failed_actions: 10,
  unique_categories: 8,
  unique_sessions: 9,
  last_activity: '2026-10-20T08:25:46.980545-03:00',
  avg_actions_per_day: 0.4465753424657534,
  ...overrides,
})

const byId = (rows: ReturnType<typeof auditDashboardKpis>) =>
  Object.fromEntries(rows.map((row) => [row.id, row]))

describe('audit/kpis', () => {
  it('KPIs del dashboard con sus valores reales', () => {
    const values = byId(auditDashboardKpis(kpis()))
    expect(formatAuditKpiValue(values.totalActions)).toBe('180')
    expect(formatAuditKpiValue(values.successRate)).toBe('94,4%')
    expect(formatAuditKpiValue(values.failedActions)).toBe('10')
    expect(formatAuditKpiValue(values.uniqueUsers)).toBe('13')
    expect(formatAuditKpiValue(values.uniqueSessions)).toBe('10')
    expect(formatAuditKpiValue(values.criticalErrors)).toBe('0')
    expect(formatAuditKpiValue(values.securityIncidents)).toBe('0')
    expect(formatAuditKpiValue(values.peakHour)).toBe('19:00')
  })

  it('sin acciones: tasa n/d y hora pico —', () => {
    const values = byId(
      auditDashboardKpis(
        kpis({ total_actions: 0, successful_actions: 0, failed_actions: 0, success_rate: 0, peak_hour: 0, peak_hour_actions: 0 }),
      ),
    )
    expect(formatAuditKpiValue(values.successRate)).toBe('n/d')
    expect(formatAuditKpiValue(values.peakHour)).toBe('—')
    expect(auditDashboardKpis(null)).toEqual([])
  })

  it('KPIs de la ficha de usuario (tasa derivada y última actividad)', () => {
    const values = byId(auditUserKpis(summary()))
    expect(formatAuditKpiValue(values.totalActions)).toBe('163')
    expect(formatAuditKpiValue(values.successfulActions)).toBe('153')
    expect(formatAuditKpiValue(values.failedActions)).toBe('10')
    expect(formatAuditKpiValue(values.successRate)).toBe('93,9%')
    expect(formatAuditKpiValue(values.uniqueCategories)).toBe('8')
    expect(formatAuditKpiValue(values.uniqueSessions)).toBe('9')
    expect(formatAuditKpiValue(values.avgPerDay)).toBe('0,45')
    expect(formatAuditKpiValue(values.lastActivity)).toContain('2026')
  })

  it('usuario sin actividad: n/d y última actividad —', () => {
    const values = byId(
      auditUserKpis(
        summary({
          total_actions: 0,
          successful_actions: 0,
          failed_actions: 0,
          last_activity: '0001-01-01T00:00:00Z',
          avg_actions_per_day: 0,
        }),
      ),
    )
    expect(formatAuditKpiValue(values.successRate)).toBe('n/d')
    expect(formatAuditKpiValue(values.lastActivity)).toBe('—')
    expect(auditUserKpis(null)).toEqual([])
  })

  it('tasa textual para resúmenes de sección', () => {
    expect(auditSuccessRateLabel(4, 3)).toBe('75%')
    expect(auditSuccessRateLabel(0, 0)).toBe('n/d')
  })
})
