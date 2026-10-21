import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Clock,
  FileQuestion,
  ListChecks,
  Receipt,
  Timer,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import type { Receivable } from '@/types/bi'
import {
  AgingBucketsPanel,
  ClientRiskPanel,
  ReceivablesKpiLedger,
  ReceivablesPageLayout,
  ReceivablesPriorityBadge,
  ReceivablesRefreshButton,
  ReceivablesStatusBadge,
  ReceivablesTable,
  useClientReceivables,
  useClientRisk,
  type ReceivablesColumn,
  type ReceivablesKpiItem,
  type ReceivablesKpiTone,
} from '@/features/receivables'
import { invoiceAgingBreakdown } from '@/domain/receivables/aging'
import { isNotFoundError } from '@/domain/receivables/errors'
import { formatDate, formatMoney } from '@/domain/receivables/format'
import { buildClientKpis, formatKpiValue } from '@/domain/receivables/kpis'
import type { ReceivablesKpiValue } from '@/domain/receivables/kpis'

interface KpiMeta {
  icon: LucideIcon
  tone: ReceivablesKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const CLIENT_META: Record<string, KpiMeta> = {
  clientPending: {
    icon: Wallet,
    tone: 'primary',
    labelKey: 'receivables.client.kpis.pending',
    label: 'Saldo pendiente',
    hintKey: 'receivables.client.hints.pending',
    hint: 'Suma de las cuentas con saldo del cliente',
  },
  clientOverdue: {
    icon: AlertTriangle,
    tone: 'warning',
    labelKey: 'receivables.client.kpis.overdue',
    label: 'Vencido (+30 días)',
    hintKey: 'receivables.client.hints.overdue',
    hint: 'Saldo con más de 30 días desde la venta (definición del endpoint)',
  },
  clientPendingOrders: {
    icon: ListChecks,
    tone: 'secondary',
    labelKey: 'receivables.client.kpis.pendingOrders',
    label: 'Cuentas pendientes',
    hintKey: 'receivables.client.hints.pendingOrders',
    hint: 'Órdenes con saldo pendiente',
  },
  clientOldest: {
    icon: CalendarClock,
    tone: 'neutral',
    labelKey: 'receivables.client.kpis.oldest',
    label: 'Venta más antigua pendiente',
    hintKey: 'receivables.client.hints.oldest',
    hint: 'Fecha de la cuenta pendiente más vieja',
  },
  clientMaxAge: {
    icon: Timer,
    tone: 'warning',
    labelKey: 'receivables.client.kpis.maxAge',
    label: 'Antigüedad máxima',
    hintKey: 'receivables.client.hints.maxAge',
    hint: 'Días desde la venta de la cuenta más antigua',
  },
  clientAvgAge: {
    icon: Timer,
    tone: 'neutral',
    labelKey: 'receivables.client.kpis.avgAge',
    label: 'Antigüedad promedio',
    hintKey: 'receivables.client.hints.avgAge',
    hint: 'Promedio de días desde la venta de la deuda pendiente',
  },
  clientOver90: {
    icon: AlertTriangle,
    tone: 'error',
    labelKey: 'receivables.client.kpis.over90',
    label: 'Deuda de más de 90 días',
    hintKey: 'receivables.client.hints.over90',
    hint: 'Saldo con más de 90 días desde la venta',
  },
  clientPayments: {
    icon: Receipt,
    tone: 'secondary',
    labelKey: 'receivables.client.kpis.payments',
    label: 'Pagos registrados',
    hintKey: 'receivables.client.hints.payments',
    hint: 'Pagos no cancelados del cliente en la sucursal',
  },
  clientAvgDaysToPay: {
    icon: Clock,
    tone: 'neutral',
    labelKey: 'receivables.client.kpis.avgDaysToPay',
    label: 'Días promedio de pago',
    hintKey: 'receivables.client.hints.avgDaysToPay',
    hint: 'Desde la venta hasta cada pago; sin pagos se muestra —',
  },
}

/**
 * F7 — Ficha de crédito del cliente. `total_overdue` de este endpoint se mide
 * en días desde la venta (>30), no con el vencimiento real del listado: el
 * hint lo explicita. La antigüedad de las cuentas se deriva de `sale_date`
 * (misma definición del reporte) y se avisa cuando el endpoint capa a 100.
 */
const ClientCreditProfilePage = () => {
  const { t, lang } = useI18n()
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const clientQuery = useClientReceivables(clientId ?? '')
  const riskQuery = useClientRisk(clientId ?? '')

  const errorTitle = t('receivables.errors.title', 'No se pudieron cargar los datos')
  const backToList = () => navigate('/receivables/list')
  const client = clientQuery.data?.client
  const receivables = clientQuery.data?.receivables ?? []
  const risk = riskQuery.data

  const kpiItems: ReceivablesKpiItem[] = client
    ? buildClientKpis(client, risk).map((row: ReceivablesKpiValue) => {
        const meta = CLIENT_META[row.id]
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

  const aging = invoiceAgingBreakdown(receivables)
  const capped =
    client !== undefined && client.pending_count > receivables.length && receivables.length > 0

  const columns: Array<ReceivablesColumn<Receivable>> = [
    {
      key: 'account',
      mono: true,
      header: t('receivables.columns.account', 'Cuenta'),
      render: (row) => (
        <button
          type='button'
          onClick={() => navigate(`/receivables/detail/${encodeURIComponent(row.id)}`)}
          className='text-left text-primary hover:underline'
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'saleDate',
      mono: true,
      header: t('receivables.columns.saleDate', 'Venta'),
      render: (row) => formatDate(row.sale_date, lang),
    },
    {
      key: 'daysOverdue',
      align: 'right',
      header: t('receivables.columns.daysOverdue', 'Días vencidos'),
      render: (row) => (
        <div className='flex flex-col items-end gap-xs'>
          <span className='font-data-mono text-data-mono'>{row.days_overdue}</span>
          <ReceivablesPriorityBadge daysOverdue={row.days_overdue} />
        </div>
      ),
    },
    {
      key: 'original',
      align: 'right',
      header: t('receivables.columns.original', 'Original'),
      render: (row) => formatMoney(row.original_amount),
    },
    {
      key: 'paid',
      align: 'right',
      header: t('receivables.columns.paid', 'Cobrado'),
      render: (row) => formatMoney(row.paid_amount),
    },
    {
      key: 'pending',
      align: 'right',
      header: t('receivables.columns.pending', 'Pendiente'),
      render: (row) => formatMoney(row.pending_amount),
    },
    {
      key: 'status',
      header: t('receivables.columns.status', 'Estado'),
      render: (row) => <ReceivablesStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: t('receivables.columns.actions', 'Acciones'),
      render: (row) => (
        <button
          type='button'
          onClick={() => navigate(`/receivables/detail/${encodeURIComponent(row.id)}`)}
          className='text-body-sm-bold text-primary hover:underline'
        >
          {t('receivables.actions.viewDetail', 'Ver detalle')}
        </button>
      ),
    },
  ]

  const actions = (
    <>
      <Button variant='secondary' size='md' onClick={backToList} data-testid='receivables-client-back'>
        <ArrowLeft size={16} className='mr-sm' aria-hidden='true' />
        {t('receivables.client.backToList', 'Volver al listado')}
      </Button>
      <ReceivablesRefreshButton />
    </>
  )

  const notFound = (
    <SectionCard
      title={t('receivables.client.title', 'Ficha de crédito')}
      testId='receivables-client-not-found'
    >
      <div className='flex flex-col items-center gap-md py-xl'>
        <TableEmptyState
          icon={FileQuestion}
          title={t('receivables.client.notFoundTitle', 'Cliente no encontrado')}
          description={t(
            'receivables.client.notFoundMessage',
            'El cliente no existe o no pertenece a la sucursal activa.',
          )}
        />
        <Button variant='secondary' onClick={backToList}>
          {t('receivables.client.backToList', 'Volver al listado')}
        </Button>
      </div>
    </SectionCard>
  )

  // Solo el 404 del cliente es "no encontrado"; un fallo del análisis de riesgo
  // es un error de sección (el cliente y su cartera siguen siendo válidos).
  const missingClient = !clientId || isNotFoundError(clientQuery.error)

  return (
    <ReceivablesPageLayout
      title={t('receivables.client.title', 'Ficha de crédito')}
      subtitle={
        client?.client_name
          ? `${client.client_name} · ${t(
              'receivables.client.subtitle',
              'Cuentas pendientes, riesgo y antigüedad del cliente.',
            )}`
          : t('receivables.client.subtitle', 'Cuentas pendientes, riesgo y antigüedad del cliente.')
      }
      actions={actions}
    >
      {missingClient ? (
        notFound
      ) : (
        <>
          <SectionCard
            title={t('receivables.client.kpiTitle', 'Cartera del cliente')}
            description={t(
              'receivables.client.kpiSubtitle',
              'Saldos y métricas del análisis de riesgo que informa el backend.',
            )}
            testId='receivables-client-summary'
          >
            <QueryBoundary
              isLoading={clientQuery.isLoading || riskQuery.isLoading}
              error={clientQuery.error ?? riskQuery.error}
              errorTitle={errorTitle}
              onRetry={() => {
                void clientQuery.refetch()
                void riskQuery.refetch()
              }}
              skeleton={<PanelSkeleton rows={9} testId='receivables-client-skeleton' />}
            >
              <ReceivablesKpiLedger items={kpiItems} testId='receivables-client-kpis' />
            </QueryBoundary>
          </SectionCard>

          <div className='grid gap-lg xl:grid-cols-2'>
            <SectionCard
              title={t('receivables.client.riskTitle', 'Análisis de riesgo')}
              description={t(
                'receivables.client.riskSubtitle',
                'Nivel, señales y comportamiento según las reglas del reporte de CxC.',
              )}
              testId='receivables-client-risk-card'
            >
              <QueryBoundary
                isLoading={riskQuery.isLoading}
                error={riskQuery.error}
                errorTitle={errorTitle}
                onRetry={() => void riskQuery.refetch()}
                skeleton={<PanelSkeleton rows={4} testId='receivables-client-risk-skeleton' />}
              >
                {risk ? <ClientRiskPanel risk={risk} locale={lang} /> : null}
              </QueryBoundary>
            </SectionCard>

            <SectionCard
              title={t('receivables.client.agingTitle', 'Antigüedad de las cuentas')}
              description={t(
                'receivables.client.agingSubtitle',
                'Derivada de la fecha de venta de las cuentas listadas, misma definición del reporte.',
              )}
              testId='receivables-client-aging-card'
            >
              <AgingBucketsPanel
                rows={aging.rows}
                unclassifiedAmount={aging.unclassifiedAmount}
                testId='receivables-client-aging'
              />
              {capped ? (
                <p className='mt-md text-body-sm text-on-surface-deep'>
                  {t(
                    'receivables.client.agingPartial',
                    'Se muestran {shown} de {total} cuentas pendientes.',
                    {
                      shown: receivables.length,
                      total: client?.pending_count ?? receivables.length,
                    },
                  )}
                </p>
              ) : null}
            </SectionCard>
          </div>

          <TableCard
            title={t('receivables.client.accountsTitle', 'Cuentas pendientes')}
            description={t(
              'receivables.client.accountsSubtitle',
              'Hasta 100 cuentas, ordenadas por fecha de venta descendente.',
            )}
            testId='receivables-client-accounts-card'
          >
            <QueryBoundary
              isLoading={clientQuery.isLoading}
              error={clientQuery.error}
              errorTitle={errorTitle}
              onRetry={() => void clientQuery.refetch()}
              skeleton={<TableSkeleton rows={4} testId='receivables-client-accounts-skeleton' />}
            >
              <ReceivablesTable
                columns={columns}
                rows={receivables}
                rowKey={(row) => row.id}
                testId='receivables-client-accounts'
                minWidthClass='min-w-[940px]'
                dense
                caption={t('receivables.client.accountsTitle', 'Cuentas pendientes')}
                empty={
                  <TableEmptyState
                    icon={Receipt}
                    title={t('receivables.client.empty', 'Sin deuda pendiente')}
                    description={t(
                      'receivables.client.emptyHint',
                      'El cliente no tiene cuentas con saldo.',
                    )}
                  />
                }
              />
            </QueryBoundary>
          </TableCard>
        </>
      )}
    </ReceivablesPageLayout>
  )
}

export default ClientCreditProfilePage
