import { describe, expect, it } from 'vitest'
import type { CustomerSalesSummary } from '@/types/bi'
import {
  buildCustomerSummaryItems,
  frequencyKey,
  segmentKey,
} from './customers'

const SUMMARY: CustomerSalesSummary = {
  total_customers: 4,
  new_customers: 1,
  returning_customers: 3,
  average_lifetime_value: 1396995,
  top_customer_revenue: 2959728,
  customer_retention_rate: 75,
}

describe('buildCustomerSummaryItems', () => {
  it('arma las 6 métricas en orden con sus tipos', () => {
    const items = buildCustomerSummaryItems(SUMMARY)
    expect(items.map((item) => item.id)).toEqual([
      'total',
      'new',
      'returning',
      'retention',
      'ltv',
      'topCustomer',
    ])
    expect(items.map((item) => item.kind)).toEqual([
      'count',
      'count',
      'count',
      'percent',
      'money',
      'money',
    ])
  })

  it('la retención conserva el conteo de recurrentes para el hint', () => {
    const retention = buildCustomerSummaryItems(SUMMARY).find(
      (item) => item.id === 'retention',
    )
    expect(retention?.value).toBe(75)
    expect(retention?.secondaryCount).toBe(3)
  })

  it('sin resumen no inventa métricas', () => {
    expect(buildCustomerSummaryItems(null)).toEqual([])
    expect(buildCustomerSummaryItems(undefined)).toEqual([])
  })
})

describe('frequencyKey / segmentKey', () => {
  it('mapea los códigos del BE a claves i18n', () => {
    expect(frequencyKey('FREQUENT')).toBe('frequent')
    expect(frequencyKey('OCCASIONAL')).toBe('occasional')
    expect(frequencyKey('NEW')).toBe('new')
    expect(frequencyKey('unknown-code')).toBe('unknown')
    expect(segmentKey('VIP')).toBe('vip')
    expect(segmentKey('STANDARD')).toBe('standard')
    expect(segmentKey(null)).toBe('unknown')
  })
})
