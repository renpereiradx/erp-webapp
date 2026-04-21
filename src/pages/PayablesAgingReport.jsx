import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Filter,
  Download,
  Printer,
  Plus,
  ChevronRight,
  Search,
  Clock,
  AlertCircle,
  AlertTriangle,
  MoreHorizontal,
  ChevronLeft,
} from 'lucide-react'

import { formatPYG, formatNumber } from '@/utils/currencyUtils'
import { usePayables } from '../hooks/usePayables'

/**
 * Reporte de Antigüedad de Deuda (Payables)
 * 100% Fidelity with Stitch, React Best Practices and Real Hook Integration.
 */
const PayablesAgingReport = () => {
  const {
    loading,
    overview,
    agingReport,
    statistics,
    fetchOverview,
    fetchAgingReport,
    fetchStatistics,
  } = usePayables()

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 10;

  // 1. Effects for browser synchronization
  useEffect(() => {
    document.title = 'Reporte de Antigüedad | ERP System'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 2. Initial Data Fetching
  useEffect(() => {
    fetchOverview()
    fetchAgingReport()
    fetchStatistics('month')
  }, [fetchOverview, fetchAgingReport, fetchStatistics])

  // 3. Derived State / Data Transformations (Calculate During Render)

  // KPIs for the top of the page
  const agingKpis = useMemo(() => {
    if (!overview || !statistics)
      return { dpo: '---', overdue: '---', critical: '---' }
    return {
      dpo: `${Math.round(statistics.average_dpo || overview.average_days_to_pay || 0)} Días`,
      overdue: `${formatNumber(statistics.overdue_percentage || 0)}%`,
      critical: formatPYG(overview.aging_summary?.over_90_days?.amount || 0),
    }
  }, [overview, statistics])

  // Distribution Chart Data (Hero Section)
  const distribution = useMemo(() => {
    if (!overview?.aging_summary) return null
    const summary = overview.aging_summary
    return {
      total: overview.total_pending,
      current: {
        amount: summary.current.amount,
        percentage: summary.current.percentage,
      },
      days30_60: {
        amount: summary.days_30_60.amount,
        percentage: summary.days_30_60.percentage,
      },
      days60_90: {
        amount: summary.days_60_90.amount,
        percentage: summary.days_60_90.percentage,
      },
      over90: {
        amount: summary.over_90_days.amount,
        percentage: summary.over_90_days.percentage,
      },
    }
  }, [overview])

  const distributionSegments = useMemo(() => {
    if (!distribution) return []

    return [
      {
        key: 'current',
        label: 'Corriente',
        shortLabel: '0-30 d',
        percentage: Number(distribution.current.percentage || 0),
        bgClass: 'bg-fluent-success',
        textClass: 'text-white',
      },
      {
        key: 'days30_60',
        label: 'Vencido',
        shortLabel: '31-60 d',
        percentage: Number(distribution.days30_60.percentage || 0),
        bgClass: 'bg-fluent-warning',
        textClass: 'text-slate-900',
      },
      {
        key: 'days60_90',
        label: 'Vencido',
        shortLabel: '61-90 d',
        percentage: Number(distribution.days60_90.percentage || 0),
        bgClass: 'bg-orange-500',
        textClass: 'text-white',
      },
      {
        key: 'over90',
        label: 'Crítico',
        shortLabel: '+90 d',
        percentage: Number(distribution.over90.percentage || 0),
        bgClass: 'bg-fluent-danger',
        textClass: 'text-white',
      },
    ]
  }, [distribution])

  // Analytical Breakdown Table Data
  const filteredTableData = useMemo(() => {
    if (!agingReport?.by_supplier) return []
    
    const filtered = searchTerm 
      ? agingReport.by_supplier.filter(s => s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
      : agingReport.by_supplier;

    return filtered.map(s => {
      // Determine risk level based on overdue amounts
      let risk = 'Mínimo'
      let riskClass = 'bg-fluent-success/10 text-fluent-success border-fluent-success/20'

      if (s.over_90_days > 0) {
        risk = 'Crítico'
        riskClass = 'bg-fluent-danger/10 text-fluent-danger border-fluent-danger/20'
      } else if (s.days_60_90 > 0 || s.days_30_60 > s.total * 0.5) {
        risk = 'Moderado'
        riskClass = 'bg-fluent-warning/10 text-fluent-warning border-fluent-warning/20'
      }

      return {
        id: s.supplier_id,
        name: s.supplier_name,
        current: s.current,
        days30_60: s.days_30_60,
        days60_90: s.days_60_90,
        over90: s.over_90_days,
        total: s.total,
        risk,
        riskClass,
      }
    })
  }, [agingReport, searchTerm])

  const paginatedData = useMemo(() => {
    return filteredTableData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredTableData, currentPage]);

  const totalPages = Math.ceil(filteredTableData.length / pageSize) || 1;

  // 4. Loading State
  if (loading && !overview) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
        <span className='ml-3 font-bold text-slate-500 uppercase tracking-widest text-xs'>
          Generando reporte analítico...
        </span>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 pb-12 font-display'>
      {/* Header Section */}
      <div className='flex flex-col gap-4'>
        {/* Breadcrumbs */}
        <nav className='flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1'>
          <Link
            to='/dashboard/payables'
            className='hover:text-primary transition-colors flex items-center gap-1'
          >
            Finanzas
          </Link>
          <ChevronRight size={12} className='mx-2 opacity-30' />
          <Link
            to='/dashboard/payables'
            className='hover:text-primary transition-colors'
          >
            Cuentas por Pagar
          </Link>
          <ChevronRight size={12} className='mx-2 opacity-30' />
          <span className='text-slate-600 dark:text-slate-300'>
            Reporte de Antigüedad
          </span>
        </nav>

        {/* Title & Actions */}
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm'>
          <div className='flex items-center gap-5'>
            <div className='bg-primary/10 p-2.5 rounded-xl text-primary shadow-sm border border-primary/20 flex-shrink-0'>
              <Wallet className='h-5 w-5' />
            </div>
            <div className='flex flex-col min-w-0'>
              <h1 className='text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate flex items-center gap-3'>
                Reporte de Antigüedad de Deuda
              </h1>
              <div className='flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5'>
                <Clock size={14} className='opacity-50' />
                <span>
                  Corte al:{' '}
                  <span className='text-slate-600 dark:text-slate-300'>
                    {new Date().toLocaleDateString('es-PY', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <button className='inline-flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300'>
              <Filter className='h-4 w-4 mr-2 text-slate-400' />
              Filtrar
            </button>
            <button className='inline-flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300'>
              <Download className='h-4 w-4 mr-2 text-slate-400' />
              Excel
            </button>
            <button className='inline-flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300'>
              <Printer className='h-4 w-4 mr-2 text-slate-400' />
              Imprimir
            </button>
            <div className='hidden lg:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1'></div>
            <button className='inline-flex items-center px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-white hover:bg-blue-600 transition-all shadow-md shadow-primary/20 active:scale-95'>
              <Plus className='h-4 w-4 mr-1.5' />
              Nuevo Pago
            </button>
          </div>
        </div>
      </div>

      {/* Hero Visual Section: Stacked Bar */}
      <section className='bg-white dark:bg-[#1b2633] p-6 md:p-8 rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)]'>
        <div className='flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4'>
          <div>
            <h2 className='text-lg font-bold text-slate-900 dark:text-white mb-1'>
              Distribución Global por Vencimiento
            </h2>
            <p className='text-sm font-medium text-slate-500'>
              Visualización del flujo de caja comprometido y deuda vencida.
            </p>
          </div>
          <div className='md:text-right'>
            <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1'>
              Deuda Total Consolidada
            </p>
            <p className='text-3xl md:text-4xl font-mono font-black text-slate-900 dark:text-white break-words tracking-tight tabular-nums'>
              {formatPYG(distribution?.total || 0)}
            </p>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className='mb-6 space-y-3'>
          <div className='flex flex-wrap gap-2'>
            {distributionSegments.map(segment => {
              const percentLabel = `${formatNumber(segment.percentage)}%`
              return (
                <span
                  key={segment.key}
                  className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                >
                  <span
                    className={`w-2 h-2 rounded-full ${segment.bgClass}`}
                  ></span>
                  <span className='text-[10px] font-black uppercase tracking-widest text-slate-500'>
                    {segment.shortLabel}
                  </span>
                  <span className='text-[10px] font-black text-slate-700 dark:text-slate-200'>
                    {percentLabel}
                  </span>
                </span>
              )
            })}
          </div>

          <div className='relative w-full rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shadow-inner overflow-hidden'>
            <div className='flex h-12 md:h-16 w-full rounded-xl overflow-hidden'>
              {distributionSegments.map((segment, index) => {
                const percentLabel = `${formatNumber(segment.percentage)}%`
                const showFullLabel = segment.percentage >= 12
                const showCompactLabel = segment.percentage >= 6

                return (
                  <div
                    key={segment.key}
                    className={`group relative h-full flex items-center justify-center transition-all cursor-pointer hover:brightness-110 ${segment.bgClass} ${index > 0 ? 'border-l border-white/30 dark:border-slate-900/30' : ''}`}
                    style={{ width: `${segment.percentage}%` }}
                    title={`${segment.label} ${segment.shortLabel}: ${percentLabel}`}
                  >
                    {showFullLabel && (
                      <span
                        className={`hidden md:block px-2 text-xs font-black whitespace-nowrap ${segment.textClass}`}
                      >
                        {segment.shortLabel} ({percentLabel})
                      </span>
                    )}
                    {!showFullLabel && showCompactLabel && (
                      <span
                        className={`hidden md:block px-2 text-[10px] font-black whitespace-nowrap ${segment.textClass}`}
                      >
                        {percentLabel}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Chart Legend */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all'>
            <div className='flex items-center gap-2'>
              <div className='w-2.5 h-2.5 rounded-full bg-fluent-success shadow-sm shadow-fluent-success/50'></div>
              <p className='text-[10px] text-slate-500 uppercase font-black tracking-widest'>
                Corriente (0-30 d)
              </p>
            </div>
            <p className='text-lg font-mono font-black text-slate-900 dark:text-white tabular-nums'>
              {formatPYG(distribution?.current.amount || 0)}
            </p>
          </div>
          <div className='flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all'>
            <div className='flex items-center gap-2'>
              <div className='w-2.5 h-2.5 rounded-full bg-fluent-warning shadow-sm shadow-fluent-warning/50'></div>
              <p className='text-[10px] text-slate-500 uppercase font-black tracking-widest'>
                Vencido (31-60 d)
              </p>
            </div>
            <p className='text-lg font-mono font-black text-slate-900 dark:text-white tabular-nums'>
              {formatPYG(distribution?.days30_60.amount || 0)}
            </p>
          </div>
          <div className='flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all'>
            <div className='flex items-center gap-2'>
              <div className='w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50'></div>
              <p className='text-[10px] text-slate-500 uppercase font-black tracking-widest'>
                Vencido (61-90 d)
              </p>
            </div>
            <p className='text-lg font-mono font-black text-slate-900 dark:text-white tabular-nums'>
              {formatPYG(distribution?.days60_90.amount || 0)}
            </p>
          </div>
          <div className='flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all'>
            <div className='flex items-center gap-2'>
              <div className='w-2.5 h-2.5 rounded-full bg-fluent-danger shadow-sm shadow-fluent-danger/50'></div>
              <p className='text-[10px] text-slate-500 uppercase font-black tracking-widest'>
                Crítico (+90 d)
              </p>
            </div>
            <p className='text-lg font-mono font-black text-slate-900 dark:text-white tabular-nums'>
              {formatPYG(distribution?.over90.amount || 0)}
            </p>
          </div>
        </div>
      </section>

      {/* KPI Grid */}
      <section className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* DPO Card */}
        <div className='bg-white dark:bg-[#1b2633] p-6 md:p-8 rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] relative overflow-hidden group hover:shadow-md transition-all'>
          <div className='flex justify-between items-start'>
            <div className='flex-1 min-w-0'>
              <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors'>
                DPO (Días Promedio de Pago)
              </p>
              <h3 className='text-3xl font-black text-slate-900 dark:text-white tracking-tight'>
                {agingKpis.dpo}
              </h3>
            </div>
            <div className='bg-primary/10 p-3 rounded-xl flex-shrink-0 text-primary shadow-sm border border-primary/10'>
              <Clock size={20} />
            </div>
          </div>
          <div className='mt-8 h-12 w-full flex items-end gap-1.5 opacity-60'>
            {[40, 55, 45, 70, 60, 85, 100].map((h, i) => (
              <div key={i} className={`flex-1 bg-primary/${i === 6 ? '100' : '20 rounded-t-sm'} h-[${h}%] transition-all group-hover:bg-primary/30 ${i === 6 ? 'shadow-[0_0_8px_rgba(19,127,236,0.4)]' : ''}`}></div>
            ))}
          </div>
        </div>

        {/* % Overdue Card */}
        <div className='bg-white dark:bg-[#1b2633] p-6 md:p-8 rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] relative overflow-hidden group hover:shadow-md transition-all'>
          <div className='flex justify-between items-start'>
            <div className='flex-1 min-w-0'>
              <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-orange-500 transition-colors'>
                % de Deuda Vencida
              </p>
              <h3 className='text-3xl font-black text-slate-900 dark:text-white tracking-tight'>
                {agingKpis.overdue}
              </h3>
            </div>
            <div className='bg-orange-500/10 p-3 rounded-xl flex-shrink-0 text-orange-500 shadow-sm border border-orange-500/10'>
              <AlertCircle size={20} />
            </div>
          </div>
          <div className='absolute right-8 bottom-8 w-16 h-16 border-[6px] border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center shadow-inner'>
            <div
              className='absolute top-0 left-0 w-full h-full border-[6px] border-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}
            ></div>
            <span className='text-[9px] font-black text-orange-500 uppercase tracking-widest z-10'>
              ALTO
            </span>
          </div>
        </div>

        {/* Critical Risk Card */}
        <div className='bg-white dark:bg-[#1b2633] p-6 md:p-8 rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] relative overflow-hidden group hover:shadow-md transition-all'>
          <div className='flex justify-between items-start'>
            <div className='flex-1 min-w-0'>
              <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-fluent-danger transition-colors'>
                Monto en Riesgo Crítico
              </p>
              <h3 className='text-3xl font-mono font-black text-fluent-danger tracking-tight break-words tabular-nums'>
                {agingKpis.critical}
              </h3>
            </div>
            <div className='bg-fluent-danger/10 p-3 rounded-xl flex-shrink-0 text-fluent-danger shadow-sm border border-fluent-danger/10'>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className='mt-8 flex items-center gap-3'>
            <span className='text-[9px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md uppercase tracking-widest border border-slate-200 dark:border-slate-700'>
              {filteredTableData.length} PROVEEDORES
            </span>
          </div>
        </div>
      </section>

      {/* Main Data Grid */}
      <section className='bg-white dark:bg-[#1b2633] rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] overflow-hidden'>
        <div className='px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20'>
          <h2 className='text-lg font-extrabold flex items-center gap-2 tracking-tight text-slate-900 dark:text-white'>
            Desglose Analítico por Proveedor
          </h2>
          <div className='flex items-center gap-3 w-full sm:w-auto'>
            <div className='relative flex-1 sm:w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4' />
              <input
                className='w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all font-medium'
                placeholder='Buscar proveedor...'
                type='text'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className='overflow-x-auto custom-scrollbar'>
          <table className='w-full text-left border-collapse min-w-[1100px]'>
            <thead>
              <tr className='bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800'>
                <th className='px-6 py-4 sticky left-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur z-10'>
                  Proveedor
                </th>
                <th className='px-4 py-4 text-right'>Corriente</th>
                <th className='px-4 py-4 text-right'>31-60 Días</th>
                <th className='px-4 py-4 text-right'>61-90 Días</th>
                <th className='px-4 py-4 text-right'>+90 Días</th>
                <th className='px-4 py-4 text-right'>Total Pendiente</th>
                <th className='px-4 py-4 text-center'>Riesgo</th>
                <th className='px-6 py-4 w-12 text-center'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-50 dark:divide-slate-800/50 text-[13px]'>
              {paginatedData.map(row => (
                <tr
                  key={row.id}
                  className={`${row.risk === 'Crítico' ? 'bg-red-50/30 dark:bg-red-900/10 border-y border-red-100 dark:border-red-900/30' : ''} hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer`}
                >
                  <td
                    className={`px-6 py-4 sticky left-0 ${row.risk === 'Crítico' ? 'bg-red-50/50 dark:bg-[#1f1e24]' : 'bg-white dark:bg-[#1b2633]'} group-hover:bg-slate-50/80 dark:group-hover:bg-[#1f2b38] transition-colors z-10 font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]`}
                  >
                    {row.name}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-mono font-bold ${row.current > 0 ? 'text-fluent-success' : 'text-slate-500'}`}
                  >
                    {formatPYG(row.current)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-mono font-bold ${row.days30_60 > 0 ? 'text-fluent-warning' : 'text-slate-500'}`}
                  >
                    {formatPYG(row.days30_60)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-mono font-bold ${row.days60_90 > 0 ? 'text-orange-500' : 'text-slate-500'}`}
                  >
                    {formatPYG(row.days60_90)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-mono font-black ${row.over90 > 0 ? 'text-fluent-danger' : 'text-slate-500'}`}
                  >
                    {formatPYG(row.over90)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-mono font-black ${row.risk === 'Crítico' ? 'text-fluent-danger' : 'text-slate-900 dark:text-white'}`}
                  >
                    {formatPYG(row.total)}
                  </td>
                  <td className='px-4 py-4 text-center'>
                    <span
                      className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${row.riskClass}`}
                    >
                      {row.risk}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-right'>
                    <button className='p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all'>
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 italic">No se encontraron proveedores.</td>
                </tr>
              )}
            </tbody>
            <tfoot className='bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700'>
              <tr>
                <td className='px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest'>
                  TOTALES
                </td>
                <td className='px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white'>
                  {formatPYG(distribution?.current.amount || 0)}
                </td>
                <td className='px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white'>
                  {formatPYG(distribution?.days30_60.amount || 0)}
                </td>
                <td className='px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white'>
                  {formatPYG(distribution?.days60_90.amount || 0)}
                </td>
                <td className='px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white'>
                  {formatPYG(distribution?.over90.amount || 0)}
                </td>
                <td className='px-4 py-4 text-right font-mono font-black text-primary text-sm'>
                  {formatPYG(distribution?.total || 0)}
                </td>
                <td className='px-4 py-4'></td>
                <td className='px-6 py-4'></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className='px-6 md:px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1b2633]'>
          <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
            Mostrando {paginatedData.length} de {filteredTableData.length} proveedores
          </p>
          <div className='flex items-center gap-1.5'>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className='p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800'
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
              <button 
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`size-8 rounded-xl text-xs font-black transition-all ${p === currentPage ? 'bg-primary text-white shadow-lg' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className='p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors'
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PayablesAgingReport
