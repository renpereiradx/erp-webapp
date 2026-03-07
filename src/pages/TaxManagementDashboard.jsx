import React, { useEffect, useMemo, useState } from 'react'
import { formatPYG } from '@/utils/currencyUtils'
import { useFinancialReports } from '@/hooks/useFinancialReports'

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

const pct = (current, prev) => {
  if (!prev) return 0
  return ((current - prev) / prev) * 100
}

const monthLabel = dateLike => {
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) return dateLike || '-'
  return date.toLocaleDateString('es-PY', {
    month: 'short',
    year: 'numeric',
  })
}

const TaxManagementDashboard = () => {
  const [period, setPeriod] = useState('month')

  const {
    loading,
    error,
    vatReport,
    taxSummary,
    fetchVatReport,
    fetchTaxSummary,
  } = useFinancialReports()

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
  } = useMemo(() => {
    const sales = vatReport?.sales_vat || {}
    const purchases = vatReport?.purchases_vat || {}
    const balance = vatReport?.vat_balance || {}
    const summary = taxSummary || {}

    const monthly = [
      ...(Array.isArray(vatReport?.monthly_breakdown)
        ? vatReport.monthly_breakdown.map(item => ({
            month: item.month,
            debit: toNumber(item.vat_debito),
            credit: toNumber(item.vat_credito),
            net: toNumber(item.balance),
          }))
        : []),
      ...(Array.isArray(summary?.monthly_detail)
        ? summary.monthly_detail.map(item => ({
            month: item.month,
            debit: toNumber(item.vat_debito),
            credit: toNumber(item.vat_credito),
            net: toNumber(item.net_vat),
          }))
        : []),
    ]

    const dedupedMonthly = monthly
      .filter(item => item.month)
      .reduce((acc, item) => {
        acc[item.month] = item
        return acc
      }, {})

    const rows = Object.values(dedupedMonthly)
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6)

    const current = rows[rows.length - 1]
    const previous = rows[rows.length - 2]

    return {
      salesVat: {
        base10: toNumber(sales.gross_sales_10),
        iva10: toNumber(sales.vat_10),
        base5: toNumber(sales.gross_sales_5),
        iva5: toNumber(sales.vat_5),
        exempt: toNumber(sales.exempt_sales),
        totalGross: toNumber(sales.total_gross_sales),
        totalVat: toNumber(sales.total_vat_debito),
      },
      purchaseVat: {
        base10: toNumber(purchases.gross_purchases_10),
        iva10: toNumber(purchases.vat_10),
        base5: toNumber(purchases.gross_purchases_5),
        iva5: toNumber(purchases.vat_5),
        exempt: toNumber(purchases.exempt_purchases),
        totalGross: toNumber(purchases.total_gross_purchases),
        totalVat: toNumber(purchases.total_vat_credito),
      },
      vatBalance: {
        debit: toNumber(balance.vat_debito),
        credit: toNumber(balance.vat_credito),
        payable: toNumber(balance.vat_payable),
        carryover: toNumber(balance.credit_carryover),
      },
      taxTotals: {
        liability: toNumber(summary.total_tax_liability),
        credits: toNumber(summary.total_tax_credits),
        net: toNumber(summary.net_tax_position),
      },
      monthlyRows: rows,
      debitDelta: current && previous ? pct(current.debit, previous.debit) : 0,
      creditDelta:
        current && previous ? pct(current.credit, previous.credit) : 0,
    }
  }, [taxSummary, vatReport])

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
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary'></div>
        <span className='ml-3 font-bold text-slate-500 uppercase tracking-widest text-xs'>
          Cargando reporte fiscal...
        </span>
      </div>
    )
  }

  return (
    <div className='flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen'>
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8'>
        <div>
          <h2 className='text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight'>
            Gestión de IVA y Resumen Fiscal
          </h2>
          <div className='flex items-center gap-2 mt-1'>
            <span className='material-symbols-outlined text-sm text-slate-400'>
              calendar_month
            </span>
            <p className='text-slate-500 text-sm'>
              Origen: {SOURCE_IS_DEMO ? 'Demo' : 'API'}
            </p>
          </div>
        </div>

        <div className='flex flex-wrap gap-3 items-center'>
          <div className='flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700'>
            {PERIOD_OPTIONS.map(option => {
              const active = period === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-slate-100 dark:bg-slate-800 text-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <button className='flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all text-slate-700 dark:text-slate-200'>
            <span className='material-symbols-outlined text-lg'>file_download</span>
            Descargar Formulario 120
          </button>
        </div>
      </div>

      {error && !vatReport && !taxSummary && (
        <div className='rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300 p-4 flex items-center justify-between gap-4 mb-6'>
          <p className='text-sm'>No se pudo cargar el módulo fiscal desde la API.</p>
          <button
            onClick={retry}
            className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800'
          >
            Reintentar
          </button>
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm'>
          <p className='text-sm font-medium text-slate-500'>Total IVA Débito</p>
          <h3 className='text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1'>
            {formatPYG(vatBalance.debit || salesVat.totalVat)}
          </h3>
          <p className='text-emerald-500 text-xs font-semibold mt-2 flex items-center gap-1'>
            <span className='material-symbols-outlined text-xs'>trending_up</span>
            {debitDelta >= 0 ? '+' : ''}
            {debitDelta.toFixed(1)}% vs periodo anterior
          </p>
        </div>

        <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm'>
          <p className='text-sm font-medium text-slate-500'>Total IVA Crédito</p>
          <h3 className='text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1'>
            {formatPYG(vatBalance.credit || purchaseVat.totalVat)}
          </h3>
          <p className='text-rose-500 text-xs font-semibold mt-2 flex items-center gap-1'>
            <span className='material-symbols-outlined text-xs'>trending_down</span>
            {creditDelta >= 0 ? '+' : ''}
            {creditDelta.toFixed(1)}% vs periodo anterior
          </p>
        </div>

        <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ring-2 ring-primary/20'>
          <p className='text-sm font-medium text-primary'>Saldo IVA a Pagar</p>
          <h3 className='text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1'>
            {formatPYG(vatBalance.payable || taxTotals.net)}
          </h3>
          <p className='text-slate-400 text-xs font-medium mt-2'>
            Corresponde a liquidación del periodo
          </p>
        </div>

        <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm'>
          <p className='text-sm font-medium text-slate-500'>Crédito Acumulado</p>
          <h3 className='text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1'>
            {formatPYG(vatBalance.carryover || taxTotals.credits)}
          </h3>
          <p className='text-slate-400 text-xs font-medium mt-2'>
            Saldo a favor para periodos siguientes
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8'>
        <div className='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm'>
          <div className='p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50'>
            <h4 className='font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
              <span className='material-symbols-outlined text-primary'>outbox</span>
              IVA Ventas (Débito)
            </h4>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800'>
                <tr>
                  <th className='px-6 py-4 font-semibold'>Tasa</th>
                  <th className='px-6 py-4 font-semibold text-right'>Base Imponible</th>
                  <th className='px-6 py-4 font-semibold text-right'>IVA</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
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
                <tr className='bg-slate-50/50 dark:bg-slate-800/20'>
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

        <div className='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm'>
          <div className='p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50'>
            <h4 className='font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
              <span className='material-symbols-outlined text-emerald-500'>inbox</span>
              IVA Compras (Crédito)
            </h4>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead className='text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800'>
                <tr>
                  <th className='px-6 py-4 font-semibold'>Tasa</th>
                  <th className='px-6 py-4 font-semibold text-right'>Base Imponible</th>
                  <th className='px-6 py-4 font-semibold text-right'>IVA</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
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
                <tr className='bg-slate-50/50 dark:bg-slate-800/20'>
                  <td className='px-6 py-4 font-bold text-emerald-600'>TOTAL</td>
                  <td className='px-6 py-4 text-right font-bold'>{formatPYG(purchaseVat.totalGross)}</td>
                  <td className='px-6 py-4 text-right font-bold text-emerald-600 text-base'>
                    {formatPYG(purchaseVat.totalVat)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
          <h4 className='font-bold text-slate-900 dark:text-slate-100 text-lg'>
            Tendencia Mensual: Débito vs Crédito
          </h4>
          <div className='text-xs font-semibold text-slate-500'>
            Posición neta: {formatPYG(taxTotals.net || vatBalance.payable)}
          </div>
        </div>

        {!monthlyRows.length ? (
          <div className='h-64 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm text-slate-500'>
            No hay detalle mensual para este periodo.
          </div>
        ) : (
          <div className='h-64 flex items-end justify-between gap-2 md:gap-4 px-2'>
            {monthlyRows.map((item, index) => (
              <div key={`${item.month}-${index}`} className='flex-1 flex flex-col items-center gap-2 group'>
                <div className='w-full flex justify-center items-end gap-1 h-full'>
                  <div
                    className='w-1/3 bg-slate-200 dark:bg-slate-700 rounded-t-sm'
                    style={{ height: `${Math.max(3, (item.credit / maxTrend) * 100)}%` }}
                  ></div>
                  <div
                    className='w-1/3 bg-primary rounded-t-sm'
                    style={{ height: `${Math.max(3, (item.debit / maxTrend) * 100)}%` }}
                  ></div>
                </div>
                <span className='text-[10px] text-slate-400 font-bold uppercase'>
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