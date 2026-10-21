import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import {
  HEALTH_RATING_TONE,
  healthRatingKey,
} from '@/domain/finance/kpis'
import {
  PRORRATEO_STATUS_TONE,
  allocationTypeKey,
  prorrateoStatusKey,
} from '@/domain/finance/prorrateo'
import { VAT_STATUS_TONE, vatStatusKey } from '@/domain/finance/vat'

export type FinanceBadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const TONE_CLASSES: Record<FinanceBadgeTone, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-primary/10 text-primary',
  neutral: 'bg-surface-muted text-on-surface-deep',
}

export const FinanceBadge = ({
  tone,
  children,
  testId,
}: {
  tone: FinanceBadgeTone
  children: ReactNode
  testId?: string
}) => (
  <span
    className={`inline-flex w-max items-center rounded-full px-sm py-xs text-body-sm-bold ${TONE_CLASSES[tone]}`}
    data-testid={testId}
  >
    {children}
  </span>
)

const RATING_FALLBACK: Record<string, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  fair: 'Regular',
  poor: 'Malo',
  unknown: 'Sin datos',
}

export const HealthRatingBadge = ({ rating }: { rating: string | null | undefined }) => {
  const { t } = useI18n()
  const key = healthRatingKey(rating)
  return (
    <FinanceBadge tone={HEALTH_RATING_TONE[key]} testId={`finance-rating-${key}`}>
      {t(`finance.health.rating.${key}`, RATING_FALLBACK[key])}
    </FinanceBadge>
  )
}

const VAT_FALLBACK: Record<string, string> = {
  toPay: 'A pagar',
  credit: 'Saldo a favor',
  balanced: 'Equilibrado',
  unknown: 'Sin datos',
}

export const VatStatusBadge = ({ status }: { status: string | null | undefined }) => {
  const { t } = useI18n()
  const key = vatStatusKey(status)
  return (
    <FinanceBadge tone={VAT_STATUS_TONE[key]} testId={`finance-vat-status-${key}`}>
      {t(`finance.vat.status.${key}`, VAT_FALLBACK[key])}
    </FinanceBadge>
  )
}

const PRORRATEO_FALLBACK: Record<string, string> = {
  pending: 'Pendiente',
  processed: 'Procesado',
  closed: 'Cerrado',
  cancelled: 'Cancelado',
  unknown: 'Sin datos',
}

export const ProrrateoStatusBadge = ({ status }: { status: string | null | undefined }) => {
  const { t } = useI18n()
  const key = prorrateoStatusKey(status)
  return (
    <FinanceBadge tone={PRORRATEO_STATUS_TONE[key]} testId={`finance-prorrateo-status-${key}`}>
      {t(`finance.prorrateo.status.${key}`, PRORRATEO_FALLBACK[key])}
    </FinanceBadge>
  )
}

const ALLOCATION_FALLBACK: Record<string, string> = {
  direct: 'Directo',
  indirect: 'Indirecto',
  exempt: 'Exento',
  unknown: 'Sin datos',
}

const ALLOCATION_TONE: Record<string, FinanceBadgeTone> = {
  direct: 'success',
  indirect: 'info',
  exempt: 'neutral',
  unknown: 'neutral',
}

export const AllocationBadge = ({ type }: { type: string | null | undefined }) => {
  const { t } = useI18n()
  const key = allocationTypeKey(type)
  return (
    <FinanceBadge tone={ALLOCATION_TONE[key]} testId={`finance-allocation-${key}`}>
      {t(`finance.prorrateo.allocationType.${key}`, ALLOCATION_FALLBACK[key])}
    </FinanceBadge>
  )
}

export default FinanceBadge
