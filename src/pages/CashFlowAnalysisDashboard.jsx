import React, { useEffect, useMemo, useState } from 'react'
import { useFinancialReports } from '@/hooks/useFinancialReports'
import { formatPYG } from '@/utils/currencyUtils'

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
]

const SOURCE_IS_DEMO = import.meta.env.VITE_USE_DEMO === 'true'

const toNumber = value => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const toDateLabel = value => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value || '-'
  }

  return date.toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
  })
}

const formatSignedPYG = amount => `${amount > 0 ? '+' : ''}${formatPYG(amount)}`

const CashFlowAnalysisDashboard = () => {
  const [period, setPeriod] = useState('month')
  const { loading, error, cashFlow, fetchCashFlow } = useFinancialReports()

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
  } = useMemo(() => {
    const source = cashFlow || {}
    const operating = source.operating_activities || {}
    const investing = source.investing_activities || {}
    const financing = source.financing_activities || {}

    const beginning = toNumber(source.beginning_cash)
    const reportedEnding = toNumber(source.ending_cash)
    const reportedNetChange = toNumber(source.net_cash_change)

    const salesInflow = toNumber(operating.cash_from_sales)
    const receivablesInflow = toNumber(operating.cash_from_receivables)
    const suppliersOutflow = toNumber(operating.cash_paid_to_suppliers)
    const expensesOutflow = toNumber(operating.cash_paid_for_expenses)
    const salariesOutflow = toNumber(operating.cash_paid_for_salaries)

    const equipmentOutflow = toNumber(investing.equipment_purchases)
    const loanOutflow = toNumber(financing.loan_payments)

    const normalizedDaily = (
      Array.isArray(source.daily_breakdown) ? source.daily_breakdown : []
    )
      .slice(-7)
      .map(entry => ({
        date: toDateLabel(entry.date),
        inflows: toNumber(entry.inflows),
        outflows: toNumber(entry.outflows),
        netFlow: toNumber(entry.net_flow),
        balance: toNumber(entry.balance),
      }))

    const totalInflowsFromDaily = normalizedDaily.reduce(
      (sum, row) => sum + row.inflows,
      0,
    )
    const totalOutflowsFromDaily = normalizedDaily.reduce(
      (sum, row) => sum + row.outflows,
      0,
    )

    const inflowsFromActivities = salesInflow + receivablesInflow
    const outflowsFromActivities =
      suppliersOutflow +
      expensesOutflow +
      salariesOutflow +
      equipmentOutflow +
      loanOutflow

    const resolvedInflows =
      totalInflowsFromDaily > 0 ? totalInflowsFromDaily : inflowsFromActivities
    const resolvedOutflows =
      totalOutflowsFromDaily > 0
        ? totalOutflowsFromDaily
        : outflowsFromActivities
    const resolvedNetChange =
      reportedNetChange !== 0
        ? reportedNetChange
        : resolvedInflows - resolvedOutflows
    const resolvedEnding =
      reportedEnding !== 0 ? reportedEnding : beginning + resolvedNetChange

    const computedOperatingNet =
      toNumber(operating.net_operating_cash_flow) ||
      salesInflow +
        receivablesInflow -
        suppliersOutflow -
        expensesOutflow -
        salariesOutflow

    const computedInvestingNet =
      toNumber(investing.net_investing_cash_flow) || -Math.abs(equipmentOutflow)

    const computedFinancingNet =
      toNumber(financing.net_financing_cash_flow) || -Math.abs(loanOutflow)

    const balances = normalizedDaily.length
      ? normalizedDaily.map(row => row.balance)
      : [beginning, resolvedEnding]

    const minBal = Math.min(...balances)
    const maxBal = Math.max(...balances)
    const maxBar = Math.max(
      1,
      ...normalizedDaily.flatMap(row => [
        row.inflows,
        row.outflows,
        Math.abs(row.netFlow),
      ]),
    )

    return {
      beginningCash: beginning,
      endingCash: resolvedEnding,
      netCashChange: resolvedNetChange,
      totalInflows: resolvedInflows,
      totalOutflows: resolvedOutflows,
      operatingRows: [
        {
          concept: 'Cobros por ventas',
          inflows: salesInflow,
          outflows: 0,
        },
        {
          concept: 'Cobros por cuentas por cobrar',
          inflows: receivablesInflow,
          outflows: 0,
        },
        {
          concept: 'Pagos a proveedores',
          inflows: 0,
          outflows: suppliersOutflow,
        },
        {
          concept: 'Pagos de gastos operativos',
          inflows: 0,
          outflows: expensesOutflow,
        },
        {
          concept: 'Pagos de salarios',
          inflows: 0,
          outflows: salariesOutflow,
        },
      ],
      operatingNet: computedOperatingNet,
      investingRows: [
        {
          concept: 'Compra de equipos',
          amount: -Math.abs(equipmentOutflow),
        },
      ],
      investingNet: computedInvestingNet,
      financingRows: [
        {
          concept: 'Pago de préstamos',
          amount: -Math.abs(loanOutflow),
        },
      ],
      financingNet: computedFinancingNet,
      dailyData: normalizedDaily,
      maxBarValue: maxBar,
      minBalance: minBal,
      maxBalance: maxBal,
    }
  }, [cashFlow])

  const getBalancePosition = value => {
    if (maxBalance === minBalance) {
      return 50
    }
    return clamp(
      ((value - minBalance) / (maxBalance - minBalance)) * 100,
      5,
      95,
    )
  }

  const retryFetch = () => {
    fetchCashFlow(period)
  }

  if (loading && !cashFlow) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary'></div>
        <span className='ml-3 font-bold text-slate-500 uppercase tracking-widest text-xs'>
          Cargando flujo de efectivo...
        </span>
      </div>
    )
  }

  return (
    <div className='flex-1 w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen'>
      <main className='flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8'>
        <nav className='flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400'>
          <span>Contabilidad</span>
          <span className='material-symbols-outlined text-[16px]'>
            chevron_right
          </span>
          <span>Reportes</span>
          <span className='material-symbols-outlined text-[16px]'>
            chevron_right
          </span>
          <span className='text-primary font-semibold'>Flujo de Efectivo</span>
        </nav>

        <div className='flex flex-col lg:flex-row lg:items-end justify-between gap-6'>
          <div className='flex flex-col gap-2 max-w-3xl'>
            <h1 className='text-slate-900 dark:text-white text-3xl font-bold tracking-tight'>
              Flujo de Efectivo Analítico
            </h1>
            <p className='text-slate-500 dark:text-slate-400 text-sm leading-relaxed'>
              Vista consolidada de entradas, salidas y saldo diario, conectada
              al reporte financiero real.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700'>
              {PERIOD_OPTIONS.map(option => {
                const isActive = period === option.value
                return (
                  <button
                    key={option.value}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-700 text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    onClick={() => setPeriod(option.value)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>

            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                SOURCE_IS_DEMO
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              {SOURCE_IS_DEMO ? 'Fuente: Demo' : 'Fuente: API'}
            </span>

            <button className='bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20'>
              <span className='material-symbols-outlined text-[20px]'>
                file_download
              </span>
              Exportar
            </button>
          </div>
        </div>

        {error && !cashFlow && (
          <div className='rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300 p-4 flex items-center justify-between gap-4'>
            <p className='text-sm'>
              No se pudo cargar el flujo de efectivo desde la API.
            </p>
            <button
              onClick={retryFetch}
              className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800'
            >
              Reintentar
            </button>
          </div>
        )}

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-sm font-semibold text-slate-500 uppercase tracking-wider'>
                Saldo Inicial
              </p>
              <div className='p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-400'>
                <span className='material-symbols-outlined text-[20px]'>
                  account_balance
                </span>
              </div>
            </div>
            <div>
              <h3 className='text-4xl font-bold tracking-tight text-slate-900 dark:text-white'>
                {formatPYG(beginningCash)}
              </h3>
              <p className='text-xs text-slate-400 mt-2'>
                Periodo: {PERIOD_OPTIONS.find(p => p.value === period)?.label}
              </p>
            </div>
          </div>

          <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border-l-4 border-l-emerald-500 border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-slate-800 dark:border-r-slate-800 shadow-sm'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-sm font-semibold text-slate-500 uppercase tracking-wider'>
                Entradas Totales
              </p>
              <div className='p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded text-emerald-600'>
                <span className='material-symbols-outlined text-[20px]'>
                  arrow_downward
                </span>
              </div>
            </div>
            <div>
              <h3 className='text-4xl font-bold tracking-tight text-slate-900 dark:text-white'>
                {formatSignedPYG(totalInflows)}
              </h3>
              <p className='text-xs text-slate-400 mt-2'>
                Total acumulado del periodo
              </p>
            </div>
          </div>

          <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border-l-4 border-l-rose-500 border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-slate-800 dark:border-r-slate-800 shadow-sm'>
            <div className='flex justify-between items-start mb-4'>
              <p className='text-sm font-semibold text-slate-500 uppercase tracking-wider'>
                Salidas Totales
              </p>
              <div className='p-1.5 bg-rose-50 dark:bg-rose-900/30 rounded text-rose-600'>
                <span className='material-symbols-outlined text-[20px]'>
                  arrow_upward
                </span>
              </div>
            </div>
            <div>
              <h3 className='text-4xl font-bold tracking-tight text-slate-900 dark:text-white'>
                {formatPYG(-Math.abs(totalOutflows))}
              </h3>
              <p className='text-xs text-slate-400 mt-2'>
                Total egresado del periodo
              </p>
            </div>
          </div>

          <div className='bg-primary p-6 rounded-xl shadow-lg shadow-primary/20 text-white relative overflow-hidden'>
            <div className='flex justify-between items-start mb-4 relative z-10'>
              <p className='text-sm font-semibold text-blue-100 uppercase tracking-wider'>
                Saldo Final
              </p>
              <div className='p-1.5 bg-white/20 rounded text-white'>
                <span className='material-symbols-outlined text-[20px]'>
                  check_circle
                </span>
              </div>
            </div>
            <div className='relative z-10'>
              <h3 className='text-4xl font-bold tracking-tight'>
                {formatPYG(endingCash)}
              </h3>
              <p className='text-xs text-blue-100/80 mt-2'>
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

        <div className='bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8'>
            <div>
              <h3 className='text-xl font-bold text-slate-900 dark:text-white'>
                Tendencia de Flujo de Caja
              </h3>
              <p className='text-sm text-slate-500'>
                Entradas y salidas diarias reportadas por la API
              </p>
            </div>
            <div className='flex items-center gap-6'>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-emerald-500'></span>
                <span className='text-sm font-medium text-slate-600 dark:text-slate-300'>
                  Entradas
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-rose-500'></span>
                <span className='text-sm font-medium text-slate-600 dark:text-slate-300'>
                  Salidas
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full border-2 border-primary border-dashed'></span>
                <span className='text-sm font-medium text-slate-600 dark:text-slate-300'>
                  Saldo
                </span>
              </div>
            </div>
          </div>

          {!dailyData.length ? (
            <div className='h-72 w-full rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm text-slate-500'>
              No hay desglose diario disponible para este periodo.
            </div>
          ) : (
            <div className='h-72 w-full flex items-end justify-between gap-4 px-2 relative mt-4'>
              <div className='absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10'>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className='border-t border-slate-900 dark:border-white h-px w-full'
                  ></div>
                ))}
              </div>

              {dailyData.map((item, index) => {
                const inflowPct = (item.inflows / maxBarValue) * 100
                const outflowPct = (item.outflows / maxBarValue) * 100
                const balancePosition = getBalancePosition(item.balance)

                return (
                  <div
                    key={`${item.date}-${index}`}
                    className='flex-1 flex flex-col items-center gap-3 z-10 h-full justify-end group'
                  >
                    <div className='w-full flex items-end justify-center gap-2 h-full pb-2 relative'>
                      <div
                        className='w-3 sm:w-5 bg-emerald-500/90 rounded-t-lg transition-all hover:bg-emerald-500'
                        style={{ height: `${clamp(inflowPct, 2, 100)}%` }}
                      ></div>
                      <div
                        className='w-3 sm:w-5 bg-rose-500/90 rounded-t-lg transition-all hover:bg-rose-500'
                        style={{ height: `${clamp(outflowPct, 2, 100)}%` }}
                      ></div>
                      <div
                        className='absolute w-3 sm:w-5 h-1 bg-primary rounded-full transition-all'
                        style={{ bottom: `${balancePosition}%` }}
                      ></div>
                    </div>
                    <span className='text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide'>
                      {item.date}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden'>
            <div className='px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20'>
              <h3 className='text-lg font-bold flex items-center gap-2'>
                <span className='material-symbols-outlined text-emerald-600'>
                  inventory_2
                </span>
                Actividades de Operación
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  operatingNet >= 0
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'
                }`}
              >
                Neto: {formatSignedPYG(operatingNet)}
              </span>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider'>
                    <th className='px-6 py-4'>Concepto</th>
                    <th className='px-6 py-4 text-right'>Entradas</th>
                    <th className='px-6 py-4 text-right'>Salidas</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
                  {operatingRows.map(row => (
                    <tr
                      key={row.concept}
                      className='hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors'
                    >
                      <td className='px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200'>
                        {row.concept}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-emerald-600 text-right'>
                        {row.inflows > 0 ? formatPYG(row.inflows) : '-'}
                      </td>
                      <td className='px-6 py-4 text-sm font-medium text-rose-600 text-right'>
                        {row.outflows > 0
                          ? formatPYG(-Math.abs(row.outflows))
                          : '-'}
                      </td>
                    </tr>
                  ))}

                  <tr className='bg-slate-50/60 dark:bg-slate-800/40'>
                    <td className='px-6 py-4 text-sm font-black text-slate-900 dark:text-white'>
                      Resultado Operativo
                    </td>
                    <td
                      className='px-6 py-4 text-sm font-black text-right'
                      colSpan={2}
                    >
                      <span
                        className={
                          operatingNet >= 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
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
            <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <span className='material-symbols-outlined text-blue-500'>
                    trending_up
                  </span>
                  <h3 className='text-lg font-bold'>Inversión</h3>
                </div>
                <span
                  className={`text-xs font-bold ${investingNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                >
                  {formatSignedPYG(investingNet)} Neto
                </span>
              </div>
              <div className='space-y-3'>
                {investingRows.map(row => (
                  <div
                    key={row.concept}
                    className='flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg'
                  >
                    <span className='text-slate-600 dark:text-slate-400 font-medium'>
                      {row.concept}
                    </span>
                    <span
                      className={`font-bold ${row.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {formatSignedPYG(row.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2'>
                  <span className='material-symbols-outlined text-indigo-500'>
                    account_balance
                  </span>
                  <h3 className='text-lg font-bold'>Financiación</h3>
                </div>
                <span
                  className={`text-xs font-bold ${financingNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                >
                  {formatSignedPYG(financingNet)} Neto
                </span>
              </div>
              <div className='space-y-3'>
                {financingRows.map(row => (
                  <div
                    key={row.concept}
                    className='flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg'
                  >
                    <span className='text-slate-600 dark:text-slate-400 font-medium'>
                      {row.concept}
                    </span>
                    <span
                      className={`font-bold ${row.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {formatSignedPYG(row.amount)}
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
