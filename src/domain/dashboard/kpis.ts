/**
 * Pure descriptors for `/dashboard/kpis`.
 *
 * El endpoint devuelve 5 grupos anidados; cada valor tiene una unidad distinta
 * (guaraníes, porcentaje, días, ratio o conteo). La UI no decide formatos: lee
 * `kind` de acá, y así un mismo número no se muestra como monto en una card y
 * como porcentaje en otra. Los labels viven en i18n
 * (`dashboard.kpis.items.<id>`), no en el dominio.
 */

import type { DashboardKPIs } from '@/types/bi'

export type KpiKind = 'money' | 'percent' | 'ratio' | 'number' | 'days' | 'count'

export interface KpiItemView {
  id: string
  value: number
  kind: KpiKind
}

export type KpiGroupKey = 'sales' | 'inventory' | 'financial' | 'customer' | 'budget'

export interface KpiGroupView {
  key: KpiGroupKey
  items: KpiItemView[]
}

const safe = (value: number | null | undefined): number =>
  Number.isFinite(value) ? Number(value) : 0

/** Grupos y unidades tal como los define `models.DashboardKPIs` en el BE. */
export const buildKpiGroups = (kpis: DashboardKPIs | null | undefined): KpiGroupView[] => {
  if (!kpis) return []
  const sales = kpis.sales_kpis
  const inventory = kpis.inventory_kpis
  const financial = kpis.financial_kpis
  const customer = kpis.customer_kpis
  const budget = kpis.budget_kpis

  return [
    {
      key: 'sales',
      items: [
        { id: 'average_ticket', value: safe(sales?.average_ticket), kind: 'money' },
        { id: 'sales_per_day', value: safe(sales?.sales_per_day), kind: 'number' },
        { id: 'conversion_rate', value: safe(sales?.conversion_rate), kind: 'percent' },
        { id: 'repeat_customer_rate', value: safe(sales?.repeat_customer_rate), kind: 'percent' },
      ],
    },
    {
      key: 'inventory',
      items: [
        { id: 'turnover_rate', value: safe(inventory?.turnover_rate), kind: 'ratio' },
        { id: 'days_of_inventory', value: safe(inventory?.days_of_inventory), kind: 'days' },
        { id: 'stockout_rate', value: safe(inventory?.stockout_rate), kind: 'percent' },
      ],
    },
    {
      key: 'financial',
      items: [
        { id: 'gross_margin', value: safe(financial?.gross_margin), kind: 'percent' },
        { id: 'net_margin', value: safe(financial?.net_margin), kind: 'percent' },
        {
          id: 'operating_expense_ratio',
          value: safe(financial?.operating_expense_ratio),
          kind: 'percent',
        },
      ],
    },
    {
      key: 'customer',
      items: [
        { id: 'new_customers', value: safe(customer?.new_customers), kind: 'count' },
        { id: 'active_customers', value: safe(customer?.active_customers), kind: 'count' },
        { id: 'total_customers', value: safe(customer?.total_customers), kind: 'count' },
        {
          id: 'average_purchase_frequency',
          value: safe(customer?.average_purchase_frequency),
          kind: 'number',
        },
      ],
    },
    {
      key: 'budget',
      items: [
        {
          id: 'budget_to_sale_conversion',
          value: safe(budget?.budget_to_sale_conversion),
          kind: 'percent',
        },
        { id: 'average_budget_value', value: safe(budget?.average_budget_value), kind: 'money' },
        { id: 'expired_budgets', value: safe(budget?.expired_budgets), kind: 'count' },
      ],
    },
  ]
}
