import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useCashFlowReport } from '@/features/financial-reports/hooks/useFinancialReports'
import { formatPYG } from '@/utils/currencyUtils'
import PageHeader from '@/components/ui/PageHeader'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ErrorState from '@/components/ui/ErrorState'
// F1 (PLAN_ALINEACION_BI_FRONTEND): vista del flujo extraída a domain
import {
  buildCashFlowView,
  clampNumber,
  formatSignedPYG,
  getBalancePosition,
} from '@/domain/finance/cashFlow'

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
]

const SOURCE_IS_DEMO = import.meta.env.VITE_USE_DEMO === 'true'

const CashFlowAnalysisDashboard = () => {
  const { t } = useI18n()
  const [period, setPeriod] = useState('month')
  const { cashFlow, loading, error, fetchCashFlow } = useCashFlowReport()

  useEffect(() => {
    document.title = 'Flujo de Efectivo Analítico | ERP System'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    fetchCashFlow(period)
  }, [fetchCashFlow, period])

  const {
    beginningCash,
    endingCash,
    netCashChange,
    totalInflows,
    totalOutflows,
    operatingRows,
    operatingNet,
    investingRows,
    investingNet,
    financingRows,
    financingNet,
    dailyData,
    maxBarValue,
    minBalance,
    maxBalance,
  } = useMemo(() => buildCashFlowView(cashFlow), [cashFlow])

  const retryFetch = () => {
    fetchCashFlow(period)
  }

  if (loading && !cashFlow) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg' aria-busy='true' data-testid='cashflow-skeleton'>
          <div className='h-16 bg-surface-muted rounded-md animate-pulse' />
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-28 bg-surface-muted rounded-md animate-pulse' />
            ))}
          </div>
          <GenericSkeletonList count={5} data-testid='page-skeleton-list' />
        </div>
      </div>
    )
  }

  return (
    <div className='flex-1 w-full bg-surface-muted text-foreground min-h-screen'>
      <main className='flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8'>
        <PageHeader
          breadcrumb='Contabilidad · Reportes'
          title='Flujo de Efectivo Analítico'
          subtitle='Vista consolidada de entradas, salidas y saldo diario, conectada al reporte financiero real.'
          actions={
            <div className='flex flex-wrap items-center gap-sm'>
              <div className='flex bg-surface p-xs rounded-md border border-border-subtle' role='group' aria-label='Período'>
                {PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    aria-pressed={period === option.value}
                    onClick={() => setPeriod(option.value)}
                    className={`px-md py-xs rounded-sm text-body-sm-bold transition-colors ${
                      period === option.value
                        ? 'bg-surface-muted text-primary shadow-sm'
                        : 'text-on-surface-deep hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  SOURCE_IS_DEMO
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-success/10 text-success border-success/20'
                }`}
              >
                {SOURCE_IS_DEMO ? 'Fuente: Demo' : 'Fuente: API'}
              </span>
              <button
                type='button'
                onClick={retryFetch}
                className='inline-flex items-center gap-xs px-md py-xs rounded-button bg-surface border border-border-subtle text-body-sm-bold text-on-surface-deep hover:bg-surface-muted transition-colors'
              >
                {t('bi.profitability.action.refresh', 'Actualizar')}
              </button>
            </div>
          }
        />

        {error && !cashFlow && (
          <ErrorState
            title='No se pudo cargar el flujo de efectivo'
            message={error}
            onRetry={retryFetch}
          />
        )}

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between relative overflow-hidden'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-sm font-semibold text-on-surface-deep uppercase tracking-wider'>
                Saldo Inicial
              </p>
              <div className='p-1.5 bg-surface-muted rounded text-on-surface-deep'>
                <span className='material-symbols-outlined text-[20px]'>
                  account_balance
                </span>
              </div>
            </div>
            <div>
              <h3 className='text-4xl font-bold tracking-tight text-foreground'>
                {formatPYG(beginningCash)}
              </h3>
              <p className='text-xs text-on-surface-deep mt-2'>
                Periodo: {PERIOD_OPTIONS.find(p => p.value === period)?.label}
              </p>
            </div>
          </div>

          <div className='bg-surface p-6 rounded-xl border-l-4 border-l-emerald-500 border-y border-r border-y-slate-200 border-r-slate-200 shadow-sm'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-sm font-semibold text-on-surface-deep uppercase tracking-wider'>
                Entradas Totales
              </p>
              <div className='p-1.5 bg-success/10 rounded text-success'>
                <span className='material-symbols-outlined text-[20px]'>
                  arrow_downward
                </span>
              </div>
            </div>
            <div>
              <h3 className='text-4xl font-bold tracking-tight text-foreground'>
                {formatSignedPYG(totalInflows)}
              </h3>
              <p className='text-xs text-on-surface-deep mt-2'>
                Total acumulado del periodo
              </p>
            </div>
          </div>

          <div className='bg-surface p-6 rounded-xl border-l-4 border-l-rose-500 border-y border-r border-y-slate-200 border-r-slate-200 shadow-sm'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-sm font-semibold text-on-surface-deep uppercase tracking-wider'>
                Salidas Totales
              </p>
              <div className='p-1.5 bg-error/10 rounded text-error'>
                <span className='material-symbols-outlined text-[20px]'>
                  arrow_upward
                </span>
              </div>
            </div>
            <div>
              <h3 className='text-4xl font-bold tracking-tight text-foreground'>
                {formatPYG(-Math.abs(totalOutflows))}
              </h3>
              <p className='text-xs text-on-surface-deep mt-2'>
                Total egresado del periodo
              </p>
            </div>
          </div>

          <div className='bg-primary p-6 rounded-xl shadow-whisper shadow-primary/20 text-white relative overflow-hidden'>
            <div className='flex justify-between items-start mb-4 relative z-10'>
              <p className='text-sm font-semibold text-primary uppercase tracking-wider'>
                Saldo Final
              </p>
              <div className='p-1.5 bg-surface/20 rounded text-white'>
                <span className='material-symbols-outlined text-[20px]'>
                  check_circle
                </span>
              </div>
            </div>
            <div className='relative z-10'>
              <h3 className='text-4xl font-bold tracking-tight'>
                {formatPYG(endingCash)}
              </h3>
              <p className='text-xs text-primary/80 mt-2'>
                Variación neta: {formatSignedPYG(netCashChange)}
              </p>
            </div>
            <div className='absolute -right-6 -bottom-6 opacity-10'>
              <span className='material-symbols-outlined text-[120px]'>
                account_balance_wallet
              </span>
            </div>
          </div>
        </div>

        <div className='bg-surface p-8 rounded-xl border border-border-subtle shadow-sm'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8'>
            <div>
              <h3 className='text-xl font-bold text-foreground'>
                Tendencia de Flujo de Caja
              </h3>
              <p className='text-sm text-on-surface-deep'>
                Entradas y salidas diarias reportadas por la API
              </p>
            </div>
            <div className='flex items-center gap-6'>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-success'></span>
                <span className='text-sm font-medium text-on-surface-deep'>
                  Entradas
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-error'></span>
                <span className='text-sm font-medium text-on-surface-deep'>
                  Salidas
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full border-2 border-primary border-dashed'></span>
                <span className='text-sm font-medium text-on-surface-deep'>
                  Saldo
                </span>
              </div>
            </div>
          </div>

          {!dailyData.length ? (
            <div className='h-72 w-full rounded-xl border border-dashed border-border-subtle flex items-center justify-center text-sm text-on-surface-deep'>
              No hay desglose diario disponible para este periodo.
            </div>
          ) : (
            <div className='h-72 w-full flex items-end justify-between gap-4 px-2 relative mt-4'>
              <div className='absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10'>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className='border-t border-divider h-px w-full'
                  ></div>
                ))}
              </div>

              {dailyData.map((item, index) => {
                const inflowPct = ((item.inflows ?? 0) / maxBarValue) * 100
                const outflowPct = ((item.outflows ?? 0) / maxBarValue) * 100
                const balancePosition = getBalancePosition(item.balance, minBalance, maxBalance)

                return (
                  <div
                    key={`${item.date}-${index}`}
                    className='flex-1 flex flex-col items-center gap-3 z-10 h-full justify-end group'
                  >
                    <div className='w-full flex items-end justify-center gap-2 h-full pb-2 relative'>
                      <div
                        className='w-3 sm:w-5 bg-success/90 rounded-t-lg transition-all hover:bg-success'
                        style={{ height: `${clampNumber(inflowPct, 2, 100)}%` }}
                      ></div>
                      <div
                        className='w-3 sm:w-5 bg-error/90 rounded-t-lg transition-all hover:bg-error'
                        style={{ height: `${clampNumber(outflowPct, 2, 100)}%` }}
                      ></div>
                      <div
                        className='absolute w-3 sm:w-5 h-1 bg-primary rounded-full transition-all'
                        style={{ bottom: `${balancePosition}%` }}
                      ></div>
                    </div>
                    <span className='text-[10px] sm:text-xs font-medium text-on-surface-deep uppercase tracking-wide'>
                      {item.date}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden'>
            <div className='px-6 py-5 border-b border-border-subtle flex justify-between items-center bg-surface-muted'>
              <h3 className='text-lg font-bold flex items-center gap-2'>
                <span className='material-symbols-outlined text-success'>
                  inventory_2
                </span>
                Actividades de Operación
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  operatingNet >= 0
                    ? 'text-success bg-success/10 dark:bg-success/10/20'
                    : 'text-error bg-error/10 dark:bg-error/10/20'
                }`}
              >
                Neto: {formatSignedPYG(operatingNet)}
              </span>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-surface-muted text-on-surface-deep text-xs font-bold uppercase tracking-wider'>
                    <th className='px-6 py-4'>Concepto</th>
                    <th className='px-6 py-4 text-right'>Entradas</th>
                    <th className='px-6 py-4 text-right'>Salidas</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border-subtle'>
                  {operatingRows.map(row => (
                    <tr
                      key={row.concept}
                      className='hover:bg-surface-muted:bg-surface-deep/30 transition-colors'
                    >
                      <td className='px-6 py-4 text-sm font-semibold text-foreground'>
                        {row.concept}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-success text-right'>
                        {(row.inflows ?? 0) > 0 ? formatPYG(row.inflows ?? 0) : '-'}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-error text-right'>
                        {(row.outflows ?? 0) > 0
                          ? formatPYG(-Math.abs(row.outflows ?? 0))
                          : '-'}
                      </td>
                    </tr>
                  ))}

                  <tr className='bg-surface-muted/60'>
                    <td className='px-6 py-4 text-sm font-black text-foreground'>
                      Resultado Operativo
                    </td>
                    <td
                      className='px-6 py-4 text-sm font-black text-right'
                      colSpan={2}
                    >
                      <span
                        className={
                          operatingNet >= 0
                            ? 'text-success'
                            : 'text-error'
                        }
                      >
                        {formatSignedPYG(operatingNet)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <span className='material-symbols-outlined text-primary'>
                    trending_up
                  </span>
                  <h3 className='text-lg font-bold'>Inversión</h3>
                </div>
                <span
                  className={`text-xs font-bold ${investingNet >= 0 ? 'text-success' : 'text-error'}`}
                >
                  {formatSignedPYG(investingNet)} Neto
                </span>
              </div>
              <div className='space-y-3'>
                {investingRows.map(row => (
                  <div
                    key={row.concept}
                    className='flex justify-between items-center text-sm p-3 bg-surface-muted rounded-lg'
                  >
                    <span className='text-on-surface-deep font-medium'>
                      {row.concept}
                    </span>
                    <span
                      className={`font-bold ${(row.amount ?? 0) >= 0 ? 'text-success' : 'text-error'}`}
                    >
                      {formatSignedPYG(row.amount ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <span className='material-symbols-outlined text-secondary'>
                    account_balance
                  </span>
                  <h3 className='text-lg font-bold'>Financiación</h3>
                </div>
                <span
                  className={`text-xs font-bold ${financingNet >= 0 ? 'text-success' : 'text-error'}`}
                >
                  {formatSignedPYG(financingNet)} Neto
                </span>
              </div>
              <div className='space-y-3'>
                {financingRows.map(row => (
                  <div
                    key={row.concept}
                    className='flex justify-between items-center text-sm p-3 bg-surface-muted rounded-lg'
                  >
                    <span className='text-on-surface-deep font-medium'>
                      {row.concept}
                    </span>
                    <span
                      className={`font-bold ${(row.amount ?? 0) >= 0 ? 'text-success' : 'text-error'}`}
                    >
                      {formatSignedPYG(row.amount ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CashFlowAnalysisDashboard
