import { describe, expect, it } from 'vitest'
import {
  HEALTH_RATING_TONE,
  formatKpiValue,
  healthRatingKey,
  healthScoreKpis,
} from './kpis'
import type { FinancialHealthScore } from '@/types/bi'

const score: FinancialHealthScore = {
  score: 95,
  rating: 'EXCELLENT',
  current_ratio: 4.5104,
  quick_ratio: 0.2097,
  net_margin: 81.3622,
  working_capital: 10919160.38,
  period_start: '2026-10-01T00:00:00-03:00',
  period_end: '2026-11-01T00:00:00-03:00',
}

describe('finance/kpis', () => {
  it('formatea cada tipo y usa — en ausencias', () => {
    expect(formatKpiValue({ id: 'a', kind: 'money', value: 1000 })).toContain('1.000')
    expect(formatKpiValue({ id: 'a', kind: 'percent', value: 81.3622 })).toBe('81,4%')
    expect(formatKpiValue({ id: 'a', kind: 'count', value: 95 })).toBe('95')
    expect(formatKpiValue({ id: 'a', kind: 'ratio', value: 4.5104 })).toBe('4,51×')
    expect(formatKpiValue({ id: 'a', kind: 'money', value: null })).toBe('—')
  })

  it('traduce el rating sin mostrar el código crudo', () => {
    expect(healthRatingKey('EXCELLENT')).toBe('excellent')
    expect(healthRatingKey('POOR')).toBe('poor')
    expect(healthRatingKey('OTHER')).toBe('unknown')
    expect(HEALTH_RATING_TONE.excellent).toBe('success')
  })

  it('arma los KPIs del score con sus ratios', () => {
    const kpis = healthScoreKpis(score)
    expect(kpis.map((kpi) => kpi.id)).toEqual([
      'score',
      'ratingCurrentRatio',
      'ratingQuickRatio',
      'ratingNetMargin',
      'ratingWorkingCapital',
    ])
    expect(kpis[2].value).toBe(0.2097)
  })
})
