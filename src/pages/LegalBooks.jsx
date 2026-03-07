import React, { useEffect, useMemo, useState } from 'react'
import { formatPYG } from '@/utils/currencyUtils'
import { useFinancialReports } from '@/hooks/useFinancialReports'

const SOURCE_IS_DEMO = import.meta.env.VITE_USE_DEMO === 'true'

const toNumber = value => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toDateInputValue = date => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = dateLike => {
  const date = new Date(dateLike)
  if (Number.isNaN(date.getTime())) {
    return dateLike || '-'
  }

  return date.toLocaleDateString('es-PY')
}

const LegalBooks = () => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [activeTab, setActiveTab] = useState('ventas')
  const [fromDate, setFromDate] = useState(toDateInputValue(monthStart))
  const [toDate, setToDate] = useState(toDateInputValue(now))
  const [pageSize, setPageSize] = useState(50)

  const {
    loading,
    error,
    salesLedger,
    purchaseLedger,
    fetchSalesLedger,
    fetchSalesLedgerDateRange,
    fetchPurchaseLedger,
    fetchPurchaseLedgerDateRange,
  } = useFinancialReports()

  useEffect(() => {
    document.title = 'Libros Legales | ERP System'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const hasRange = fromDate && toDate

    if (activeTab === 'ventas') {
      if (hasRange) {
        fetchSalesLedgerDateRange(fromDate, toDate, 1, pageSize)
      } else {
        fetchSalesLedger('month', 1, pageSize)
      }
      return
    }

    if (hasRange) {
      fetchPurchaseLedgerDateRange(fromDate, toDate, 1, pageSize)
    } else {
      fetchPurchaseLedger('month', 1, pageSize)
    }
  }, [
    activeTab,
    fetchPurchaseLedger,
    fetchPurchaseLedgerDateRange,
    fetchSalesLedger,
    fetchSalesLedgerDateRange,
    fromDate,
    pageSize,
    toDate,
  ])

  const activeLedger = activeTab === 'ventas' ? salesLedger : purchaseLedger
  const summary = activeLedger?.summary || {}
  const pagination = activeLedger?.pagination || {}

  const tableRows = useMemo(() => {
    const currentEntries = Array.isArray(activeLedger?.entries)
      ? activeLedger.entries
      : []

    return currentEntries.map(item => {
        const gross = toNumber(item.gross_amount)
        const iva10 = toNumber(item.vat_10)
        const iva5 = toNumber(item.vat_5)
        const exempt = toNumber(item.exempt)

        return {
          date: formatDate(item.date),
          invoiceNo: item.invoice_number || '-',
          timbrado: item.timbrado || '-',
          ruc:
            activeTab === 'ventas'
              ? item.client_ruc || '-'
              : item.supplier_ruc || '-',
          name:
            activeTab === 'ventas'
              ? item.client_name || '-'
              : item.supplier_name || '-',
          exempt,
          iva5,
          iva10,
          gross,
        }
      })
  }, [activeLedger, activeTab])

  const retry = () => {
    if (activeTab === 'ventas') {
      fetchSalesLedgerDateRange(fromDate, toDate, 1, pageSize)
      return
    }

    fetchPurchaseLedgerDateRange(fromDate, toDate, 1, pageSize)
  }

  if (loading && !activeLedger) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary'></div>
        <span className='ml-3 font-bold text-slate-500 uppercase tracking-widest text-xs'>
          Cargando libros legales...
        </span>
      </div>
    )
  }

  return (
    <div className='flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen'>
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8'>
        <div>
          <nav aria-label='Breadcrumb' className='flex mb-2'>
            <ol className='flex items-center space-x-2 text-xs text-slate-500'>
              <li>Reportes</li>
              <li>
                <span className='material-symbols-outlined text-xs mx-1'>
                  chevron_right
                </span>
              </li>
              <li>Cumplimiento</li>
              <li>
                <span className='material-symbols-outlined text-xs mx-1'>
                  chevron_right
                </span>
              </li>
              <li className='text-primary font-semibold'>Libros Legales</li>
            </ol>
          </nav>
          <h1 className='text-3xl font-black text-slate-900 dark:text-white tracking-tight'>
            Libros Legales
          </h1>
          <p className='text-slate-500 dark:text-slate-400 font-medium'>
            Ventas y Compras • Origen: {SOURCE_IS_DEMO ? 'Demo' : 'API'}
          </p>
        </div>

        <div className='flex gap-2'>
          <button className='flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all text-slate-700 dark:text-slate-200 shadow-sm'>
            <span className='material-symbols-outlined text-xl'>file_download</span>
            Export XLS
          </button>
          <button className='flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all'>
            <span className='material-symbols-outlined text-xl'>print</span>
            Imprimir Libro
          </button>
        </div>
      </div>

      {error && !activeLedger && (
        <div className='rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300 p-4 flex items-center justify-between gap-4 mb-6'>
          <p className='text-sm'>No se pudo cargar el libro legal desde la API.</p>
          <button
            onClick={retry}
            className='px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800'
          >
            Reintentar
          </button>
        </div>
      )}

      <div className='bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 overflow-hidden'>
        <div className='border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between bg-white dark:bg-slate-900'>
          <div className='flex gap-8'>
            <button
              onClick={() => setActiveTab('ventas')}
              className={`py-4 border-b-2 transition-all text-sm font-bold ${
                activeTab === 'ventas'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Libro Ventas
            </button>
            <button
              onClick={() => setActiveTab('compras')}
              className={`py-4 border-b-2 transition-all text-sm font-bold ${
                activeTab === 'compras'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Libro Compras
            </button>
          </div>

          <div className='flex items-center gap-4 py-2'>
            <div className='flex items-center gap-2 text-sm text-slate-500 font-medium'>
              <span className='material-symbols-outlined text-base'>calendar_month</span>
              <span>
                Desde <strong className='text-slate-700 dark:text-slate-300'>{fromDate}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className='p-6 bg-slate-50/50 dark:bg-slate-800/20 grid grid-cols-1 md:grid-cols-4 gap-6'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
              Desde Fecha
            </label>
            <input
              className='border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm focus:ring-primary focus:border-primary transition-all'
              type='date'
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
              Hasta Fecha
            </label>
            <input
              className='border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm focus:ring-primary focus:border-primary transition-all'
              type='date'
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
              {activeTab === 'ventas' ? 'RUC Cliente' : 'RUC Proveedor'}
            </label>
            <input
              className='border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm focus:ring-primary focus:border-primary transition-all placeholder-slate-400'
              placeholder='Filtrar visualmente en la tabla'
              type='text'
              disabled
            />
          </div>

          <div className='flex items-end'>
            <button
              onClick={retry}
              className='w-full bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-bold border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm'
            >
              Actualizar Reporte
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm border-collapse'>
            <thead>
              <tr className='bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800'>
                <th className='px-6 py-4'>Fecha</th>
                <th className='px-6 py-4'>Nº Factura</th>
                <th className='px-6 py-4'>Timbrado</th>
                <th className='px-6 py-4'>RUC</th>
                <th className='px-6 py-4'>
                  {activeTab === 'ventas' ? 'Cliente' : 'Proveedor'}
                </th>
                <th className='px-6 py-4 text-right'>Exento</th>
                <th className='px-6 py-4 text-right'>IVA 5%</th>
                <th className='px-6 py-4 text-right'>IVA 10%</th>
                <th className='px-6 py-4 text-right'>Monto Bruto</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
              {!tableRows.length ? (
                <tr>
                  <td className='px-6 py-8 text-center text-slate-500' colSpan={9}>
                    No hay registros para el rango seleccionado.
                  </td>
                </tr>
              ) : (
                tableRows.map((row, index) => (
                  <tr key={`${row.invoiceNo}-${index}`} className='hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors'>
                    <td className='px-6 py-4 text-slate-600 dark:text-slate-400'>{row.date}</td>
                    <td className='px-6 py-4 font-medium text-slate-900 dark:text-slate-100'>{row.invoiceNo}</td>
                    <td className='px-6 py-4 text-slate-600 dark:text-slate-400'>{row.timbrado}</td>
                    <td className='px-6 py-4 text-slate-600 dark:text-slate-400'>{row.ruc}</td>
                    <td className='px-6 py-4 text-slate-600 dark:text-slate-400'>{row.name}</td>
                    <td className='px-6 py-4 text-right text-slate-600 dark:text-slate-400'>{formatPYG(row.exempt)}</td>
                    <td className='px-6 py-4 text-right text-slate-600 dark:text-slate-400'>{formatPYG(row.iva5)}</td>
                    <td className='px-6 py-4 text-right text-slate-600 dark:text-slate-400'>{formatPYG(row.iva10)}</td>
                    <td className='px-6 py-4 text-right font-bold text-slate-900 dark:text-white'>
                      {formatPYG(row.gross)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className='bg-primary/5 dark:bg-primary/10 font-bold border-t-2 border-primary/20'>
                <td className='px-6 py-4 text-right uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400' colSpan={5}>
                  Resumen Total del Periodo
                </td>
                <td className='px-6 py-4 text-right text-primary'>
                  {formatPYG(toNumber(summary.total_exempt))}
                </td>
                <td className='px-6 py-4 text-right text-primary'>
                  {formatPYG(toNumber(summary.total_vat_5))}
                </td>
                <td className='px-6 py-4 text-right text-primary'>
                  {formatPYG(toNumber(summary.total_vat_10))}
                </td>
                <td className='px-6 py-4 text-right text-primary text-base underline decoration-double'>
                  {formatPYG(toNumber(summary.total_gross))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className='px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900'>
          <div className='text-sm text-slate-500 font-medium'>
            Mostrando <span className='font-semibold text-slate-900 dark:text-white'>{tableRows.length}</span> de{' '}
            <span className='font-semibold text-slate-900 dark:text-white'>
              {toNumber(pagination.total_items) || tableRows.length}
            </span>{' '}
            registros
          </div>

          <div className='flex items-center gap-2'>
            <label className='text-sm text-slate-500 mr-2'>Filas por página:</label>
            <select
              className='border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm px-2 py-1 focus:ring-primary outline-none transition-all'
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm'>
          <span className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
            Transacciones
          </span>
          <div className='text-2xl font-black text-slate-900 dark:text-white mt-2'>
            {toNumber(summary.total_transactions)}
          </div>
        </div>

        <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm'>
          <span className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
            Total Neto
          </span>
          <div className='text-2xl font-black text-slate-900 dark:text-white mt-2'>
            {formatPYG(toNumber(summary.total_net))}
          </div>
        </div>

        <div className='bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm'>
          <span className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
            IVA Total
          </span>
          <div className='text-2xl font-black text-slate-900 dark:text-white mt-2'>
            {formatPYG(toNumber(summary.total_vat_10) + toNumber(summary.total_vat_5))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LegalBooks