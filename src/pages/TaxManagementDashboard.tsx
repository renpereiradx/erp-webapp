import { useEffect, useMemo, useState } from 'react'
import { formatPYG } from '@/utils/currencyUtils'
import { useVatReport, useTaxSummary } from '@/features/financial-reports/hooks/useFinancialReports'
import PageHeader from '@/components/ui/PageHeader'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ErrorState from '@/components/ui/ErrorState'
// F1 (PLAN_ALINEACION_BI_FRONTEND): vista IVA extraída a domain
import { buildVatView, monthLabel } from '@/domain/finance/vat'

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
]

const SOURCE_IS_DEMO = import.meta.env.VITE_USE_DEMO === 'true'

const TaxManagementDashboard = () => {
  const [period, setPeriod] = useState('month')

  const { vatReport, loading: vatLoading, error: vatError, fetchVatReport } = useVatReport();
  const { taxSummary, loading: taxLoading, error: taxError, fetchTaxSummary } = useTaxSummary();
  const loading = vatLoading || taxLoading;
  const error = vatError || taxError;

  useEffect(() => {
    document.title = 'Gestión de IVA | ERP System'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    fetchVatReport(period)
    fetchTaxSummary(period)
  }, [fetchTaxSummary, fetchVatReport, period])

  const {
    salesVat,
    purchaseVat,
    vatBalance,
    taxTotals,
    monthlyRows,
    debitDelta,
    creditDelta,
  } = useMemo(
    () => buildVatView(vatReport, taxSummary),
    [taxSummary, vatReport],
  )

  const maxTrend = Math.max(
    1,
    ...monthlyRows.flatMap(item => [item.debit, item.credit]),
  )

  const retry = () => {
    fetchVatReport(period)
    fetchTaxSummary(period)
  }

  if (loading && !vatReport && !taxSummary) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg' aria-busy='true' data-testid='tax-skeleton'>
          <div className='h-16 bg-surface-muted rounded-md animate-pulse' />
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-24 bg-surface-muted rounded-md animate-pulse' />
            ))}
          </div>
          <GenericSkeletonList count={5} data-testid='page-skeleton-list' />
        </div>
      </div>
    )
  }

  return (
    <div className='flex-1 overflow-y-auto p-4 md:p-8 bg-surface-muted min-h-screen'>
      <PageHeader
        breadcrumb='Finanzas'
        title='Gestión de IVA y Resumen Fiscal'
        subtitle={`Origen: ${SOURCE_IS_DEMO ? 'Demo' : 'API'}`}
      />
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8'>
        <div />

        <div className='flex flex-wrap gap-3 items-center'>
          <div className='flex bg-surface p-1 rounded-xl border border-border-subtle'>
            {PERIOD_OPTIONS.map(option => {
              const active = period === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-surface-muted dark:bg-surface-deep text-primary shadow-sm'
                      : 'text-on-surface-deep hover:text-foreground dark:hover:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

        </div>
      </div>

      {error && !vatReport && !taxSummary && (
        <ErrorState
          title='No se pudo cargar el módulo fiscal'
          message={error}
          onRetry={retry}
        />
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-sm'>
          <p className='text-sm font-medium text-on-surface-deep'>Total IVA Débito</p>
          <h3 className='text-2xl font-bold text-foreground mt-1'>
            {formatPYG(vatBalance.debit || salesVat.totalVat)}
          </h3>
          <p className='text-success text-xs font-semibold mt-2 flex items-center gap-1'>
            <span className='material-symbols-outlined text-xs'>trending_up</span>
            {debitDelta >= 0 ? '+' : ''}
            {debitDelta.toFixed(1)}% vs periodo anterior
          </p>
        </div>

        <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-sm'>
          <p className='text-sm font-medium text-on-surface-deep'>Total IVA Crédito</p>
          <h3 className='text-2xl font-bold text-foreground mt-1'>
            {formatPYG(vatBalance.credit || purchaseVat.totalVat)}
          </h3>
          <p className='text-error text-xs font-semibold mt-2 flex items-center gap-1'>
            <span className='material-symbols-outlined text-xs'>trending_down</span>
            {creditDelta >= 0 ? '+' : ''}
            {creditDelta.toFixed(1)}% vs periodo anterior
          </p>
        </div>

        <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-sm ring-2 ring-primary/20'>
          <p className='text-sm font-medium text-primary'>Saldo IVA a Pagar</p>
          <h3 className='text-2xl font-bold text-foreground mt-1'>
            {formatPYG(vatBalance.payable || taxTotals.net)}
          </h3>
          <p className='text-on-surface-deep text-xs font-medium mt-2'>
            Corresponde a liquidación del periodo
          </p>
        </div>

        <div className='bg-surface p-6 rounded-xl border border-border-subtle shadow-sm'>
          <p className='text-sm font-medium text-on-surface-deep'>Crédito Acumulado</p>
          <h3 className='text-2xl font-bold text-foreground mt-1'>
            {formatPYG(vatBalance.carryover || taxTotals.credits)}
          </h3>
          <p className='text-on-surface-deep text-xs font-medium mt-2'>
            Saldo a favor para periodos siguientes
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        <div className='bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm'>
          <div className='p-4 border-b border-border-subtle bg-surface-muted'>
            <h4 className='font-bold text-foreground flex items-center gap-2'>
              <span className='material-symbols-outlined text-primary'>outbox</span>
              IVA Ventas (Débito)
            </h4>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='text-xs uppercase text-on-surface-deep border-b border-border-subtle'>
                <tr>
                  <th className='px-6 py-4 font-semibold'>Tasa</th>
                  <th className='px-6 py-4 font-semibold text-right'>Base Imponible</th>
                  <th className='px-6 py-4 font-semibold text-right'>IVA</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border-subtle'>
                <tr>
                  <td className='px-6 py-4 font-medium'>IVA 10%</td>
                  <td className='px-6 py-4 text-right'>{formatPYG(salesVat.base10)}</td>
                  <td className='px-6 py-4 text-right font-bold'>{formatPYG(salesVat.iva10)}</td>
                </tr>
                <tr>
                  <td className='px-6 py-4 font-medium'>IVA 5%</td>
                  <td className='px-6 py-4 text-right'>{formatPYG(salesVat.base5)}</td>
                  <td className='px-6 py-4 text-right font-bold'>{formatPYG(salesVat.iva5)}</td>
                </tr>
                <tr>
                  <td className='px-6 py-4 font-medium'>Exento</td>
                  <td className='px-6 py-4 text-right'>{formatPYG(salesVat.exempt)}</td>
                  <td className='px-6 py-4 text-right font-bold'>{formatPYG(0)}</td>
                </tr>
                <tr className='bg-surface-muted'>
                  <td className='px-6 py-4 font-bold text-primary'>TOTAL</td>
                  <td className='px-6 py-4 text-right font-bold'>{formatPYG(salesVat.totalGross)}</td>
                  <td className='px-6 py-4 text-right font-bold text-primary text-base'>
                    {formatPYG(salesVat.totalVat)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className='bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm'>
          <div className='p-4 border-b border-border-subtle bg-surface-muted'>
            <h4 className='font-bold text-foreground flex items-center gap-2'>
              <span className='material-symbols-outlined text-success'>inbox</span>
              IVA Compras (Crédito)
            </h4>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='text-xs uppercase text-on-surface-deep border-b border-border-subtle'>
                <tr>
                  <th className='px-6 py-4 font-semibold'>Tasa</th>
                  <th className='px-6 py-4 font-semibold text-right'>Base Imponible</th>
                  <th className='px-6 py-4 font-semibold text-right'>IVA</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border-subtle'>
                <tr>
                  <td className='px-6 py-4 font-medium'>IVA 10%</td>
                  <td className='px-6 py-4 text-right'>{formatPYG(purchaseVat.base10)}</td>
                  <td className='px-6 py-4 text-right font-bold'>{formatPYG(purchaseVat.iva10)}</td>
                </tr>
                <tr>
                  <td className='px-6 py-4 font-medium'>IVA 5%</td>
                  <td className='px-6 py-4 text-right'>{formatPYG(purchaseVat.base5)}</td>
                  <td className='px-6 py-4 text-right font-bold'>{formatPYG(purchaseVat.iva5)}</td>
                </tr>
                <tr>
                  <td className='px-6 py-4 font-medium'>Exento</td>
                  <td className='px-6 py-4 text-right'>{formatPYG(purchaseVat.exempt)}</td>
                  <td className='px-6 py-4 text-right font-bold'>{formatPYG(0)}</td>
                </tr>
                <tr className='bg-surface-muted'>
                  <td className='px-6 py-4 font-bold text-success'>TOTAL</td>
                  <td className='px-6 py-4 text-right font-bold'>{formatPYG(purchaseVat.totalGross)}</td>
                  <td className='px-6 py-4 text-right font-bold text-success text-base'>
                    {formatPYG(purchaseVat.totalVat)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className='bg-surface rounded-xl border border-border-subtle p-6 shadow-sm'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
          <h4 className='font-bold text-foreground text-lg'>
            Tendencia Mensual: Débito vs Crédito
          </h4>
          <div className='text-xs font-semibold text-on-surface-deep'>
            Posición neta: {formatPYG(taxTotals.net || vatBalance.payable)}
          </div>
        </div>

        {!monthlyRows.length ? (
          <div className='h-64 rounded-xl border border-dashed border-border-subtle flex items-center justify-center text-sm text-on-surface-deep'>
            No hay detalle mensual para este periodo.
          </div>
        ) : (
          <div className='h-64 flex items-end justify-between gap-2 md:gap-4 px-2'>
            {monthlyRows.map((item, index) => (
              <div key={`${item.month}-${index}`} className='flex-1 flex flex-col items-center gap-2 group'>
                <div className='w-full flex justify-center items-end gap-1 h-full'>
                  <div
                    className='w-1/3 bg-surface-deep rounded-t-sm'
                    style={{ height: `${Math.max(3, (item.credit / maxTrend) * 100)}%` }}
                  ></div>
                  <div
                    className='w-1/3 bg-primary rounded-t-sm'
                    style={{ height: `${Math.max(3, (item.debit / maxTrend) * 100)}%` }}
                  ></div>
                </div>
                <span className='text-[10px] text-on-surface-deep font-bold uppercase'>
                  {monthLabel(item.month)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaxManagementDashboard