import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Landmark, Scale } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { buttonVariants } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import SegmentedControl from '@/components/ui/SegmentedControl'
import {
  CashFlowTable,
  CoveragePanel,
  PayablesKpiLedger,
  PayablesPageLayout,
  PayablesRefreshButton,
  useCashFlowProjection,
  type PayablesKpiItem,
  type PayablesKpiTone,
} from '@/features/payables'
import {
  PAYABLES_CASH_FLOW_DAYS,
  PAYABLES_CASH_FLOW_DEFAULT_DAYS,
} from '@/domain/payables/constants'
import {
  cashFlowDays,
  cashFlowMovementDays,
  coverageRatio,
  coverageStatus,
} from '@/domain/payables/cashFlow'
import { buildCashFlowKpis, formatKpiValue } from '@/domain/payables/overview'
import type { PayablesKpiValue } from '@/domain/payables/overview'

interface KpiMeta {
  icon: LucideIcon
  tone: PayablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const CASH_FLOW_META: Record<string, KpiMeta> = {
  inflows: {
    icon: ArrowDownLeft,
    tone: 'success',
    labelKey: 'payables.cashFlow.kpis.inflows',
    label: 'Cobros esperados',
    hintKey: 'payables.cashFlow.hints.inflows',
    hint: 'Cuentas por cobrar pendientes que vencen en la ventana',
  },
  outflows: {
    icon: ArrowUpRight,
    tone: 'error',
    labelKey: 'payables.cashFlow.kpis.outflows',
    label: 'Pagos esperados',
    hintKey: 'payables.cashFlow.hints.outflows',
    hint: 'Cuentas por pagar pendientes que vencen en la ventana',
  },
  netFlow: {
    icon: Scale,
    tone: 'primary',
    labelKey: 'payables.cashFlow.kpis.net',
    label: 'Flujo neto',
    hintKey: 'payables.cashFlow.hints.net',
    hint: 'Cobros − pagos de la ventana',
  },
  cumulative: {
    icon: Landmark,
    tone: 'secondary',
    labelKey: 'payables.cashFlow.kpis.cumulative',
    label: 'Acumulado',
    hintKey: 'payables.cashFlow.hints.cumulative',
    hint: 'Acumulado del BE al cierre de la ventana',
  },
}

/**
 * F8 — Proyección de flujo de caja a partir de vencimientos de CxC y CxP.
 * No muestra saldos bancarios: el contrato de `/payables/cash-flow` no los
 * tiene y las posiciones bancarias de la pantalla vieja eran fabricadas.
 */
const CashFlowProjectionPage = () => {
  const { t, lang } = useI18n()
  const [days, setDays] = useState<number>(PAYABLES_CASH_FLOW_DEFAULT_DAYS)
  const query = useCashFlowProjection(days)

  const errorTitle = t('payables.errors.title', 'No se pudieron cargar los datos')
  const projection = query.data
  const ratio = coverageRatio(projection)
  const status = coverageStatus(ratio)
  const movementDays = cashFlowMovementDays(projection)
  const allDays = cashFlowDays(projection)

  const kpiItems: PayablesKpiItem[] = projection
    ? buildCashFlowKpis(projection).map((row: PayablesKpiValue) => {
        const meta = CASH_FLOW_META[row.id]
        return {
          id: row.id,
          icon: meta.icon,
          tone: meta.tone,
          label: t(meta.labelKey, meta.label),
          hint: t(meta.hintKey, meta.hint),
          value: formatKpiValue(row, lang),
        }
      })
    : []

  return (
    <PayablesPageLayout
      title={t('payables.cashFlow.title', 'Proyección de flujo de caja')}
      subtitle={t(
        'payables.cashFlow.subtitle',
        'Cobros y pagos esperados por vencimiento (venta/compra + 30 días). No son saldos bancarios.',
      )}
      actions={<PayablesRefreshButton />}
    >
      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('payables.cashFlow.periodTitle', 'Ventana de proyección')}
          description={t(
            'payables.cashFlow.periodDescription',
            'Desde hoy inclusive. El backend genera un punto por día, aunque no tenga movimiento.',
          )}
          action={
            <SegmentedControl
              options={PAYABLES_CASH_FLOW_DAYS.map((value) => ({
                value: String(value),
                label: t('payables.cashFlow.daysOption', '{days} días', { days: value }),
              }))}
              value={String(days)}
              onChange={(next: string) => setDays(Number(next))}
              aria-label={t('payables.cashFlow.daysAria', 'Días de la proyección')}
              size="small"
            />
          }
          testId="payables-cash-flow-card"
        >
          <QueryBoundary
            isLoading={query.isLoading}
            error={query.error}
            errorTitle={errorTitle}
            onRetry={() => void query.refetch()}
            skeleton={<PanelSkeleton rows={4} />}
          >
            <PayablesKpiLedger items={kpiItems} testId="payables-cash-flow-kpis" />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('payables.cashFlow.coverageTitle', 'Capacidad de pago de la ventana')}
          description={t(
            'payables.cashFlow.coverageDescription',
            'Relación entre lo que se espera cobrar y lo que se debe pagar en la ventana.',
          )}
          testId="payables-cash-flow-coverage-card"
        >
          <QueryBoundary
            isLoading={query.isLoading}
            error={query.error}
            errorTitle={errorTitle}
            onRetry={() => void query.refetch()}
            skeleton={<PanelSkeleton rows={3} />}
          >
            <CoveragePanel ratio={ratio} status={status} />
          </QueryBoundary>
        </SectionCard>
      </div>

      <TableCard
        title={t('payables.cashFlow.tableTitle', 'Días con movimiento')}
        description={t(
          'payables.cashFlow.tableDescription',
          'Se omiten los días sin cobros ni pagos; los totales y el acumulado son los del backend.',
        )}
        action={
          <Link
            to='/payables/invoices'
            className={buttonVariants({ variant: 'secondary', size: 'md' })}
          >
            {t('payables.cashFlow.viewInvoices', 'Ver cuentas por pagar')}
          </Link>
        }
        testId="payables-cash-flow-table-card"
      >
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<TableSkeleton rows={4} />}
        >
          <CashFlowTable rows={movementDays} />
        </QueryBoundary>
      </TableCard>

      <p className="text-body-sm text-on-surface-deep">
        {t(
          'payables.cashFlow.footnote',
          'La ventana contiene {total} días y {withMovement} con movimiento. Los vencimientos se calculan desde la fecha de la venta/compra, no desde una fecha pactada.',
          { total: allDays.length, withMovement: movementDays.length },
        )}
      </p>
    </PayablesPageLayout>
  )
}

export default CashFlowProjectionPage
