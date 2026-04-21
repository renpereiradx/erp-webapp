import React, { useState } from 'react'
import { useProfitability } from '../hooks/useProfitability'
import { getDynamicFontClass } from '@/utils/ui'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Info,
  Activity,
  Zap
} from 'lucide-react'

/**
 * Formateador de moneda en Guaraníes (Estilo Premium)
 */
const formatPYG = value => {
  return new Intl.NumberFormat('es-PY', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(value);
}

const formatPercent = (value, maxDecimals = 2) => {
  const numeric = Number(value ?? 0)
  return new Intl.NumberFormat('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(Number.isFinite(numeric) ? numeric : 0)
}

/**
 * Shimmer Loading Component for Fluent 2.0
 */
const DashboardSkeleton = () => (
  <div className='space-y-10 animate-in fade-in duration-500 pb-32'>
    <div className='flex flex-col md:flex-row md:items-end justify-between gap-8'>
      <div className='space-y-4 w-full max-w-lg'>
        <div className='h-4 w-32 bg-slate-200 rounded-full animate-pulse' />
        <div className='h-12 w-full bg-slate-200 rounded-xl animate-pulse' />
        <div className='h-4 w-2/3 bg-slate-200 rounded-full animate-pulse' />
      </div>
      <div className='h-12 w-64 bg-slate-200 rounded-xl animate-pulse' />
    </div>
    
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6'>
      {[...Array(6)].map((_, i) => (
        <div key={i} className='h-32 bg-slate-100 rounded-2xl border border-slate-200 animate-pulse' />
      ))}
    </div>

    <div className='grid grid-cols-12 gap-8'>
      <div className='col-span-12 lg:col-span-8 h-[500px] bg-slate-100 rounded-3xl border border-slate-200 animate-pulse' />
      <div className='col-span-12 lg:col-span-4 space-y-8'>
        <div className='h-64 bg-slate-100 rounded-3xl border border-slate-200 animate-pulse' />
        <div className='h-80 bg-slate-100 rounded-3xl border border-slate-200 animate-pulse' />
      </div>
    </div>
  </div>
)

const KPICard = ({ title, value, trendValue, isCurrency = true, delay = "0", icon: Icon, color = "primary" }) => {
  const isPositive = parseFloat(trendValue) > 0
  const isNegative = parseFloat(trendValue) < 0
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  
  const displayValue = isCurrency ? formatPYG(value) : formatPercent(value)
  const displayTrendValue = `${formatPercent(Math.abs(trendValue), 1)}%`

  const colorVariants = {
    primary: 'bg-blue-50 text-[#0f6cbd] border-[#0f6cbd]/10',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-600/10',
    purple: 'bg-purple-50 text-purple-600 border-purple-600/10',
    orange: 'bg-orange-50 text-orange-600 border-orange-600/10'
  }

  const trendColors = isPositive ? 'text-[#107c10] bg-[#dff6dd]' : isNegative ? 'text-[#d13438] bg-[#fde7e9]' : 'text-slate-500 bg-slate-100'

  return (
    <div 
      style={{ animationDelay: `${delay}ms` }}
      className='flex flex-col gap-4 rounded-xl p-6 bg-white border border-[#e5e7eb] shadow-fluent hover:shadow-fluent-hover transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4'
    >
      <div className='flex items-start justify-between'>
        <div className={`p-2.5 rounded-lg border transition-colors duration-300 ${colorVariants[color]}`}>
          <Icon size={22} />
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono ${trendColors}`}>
          <TrendIcon size={12} strokeWidth={3} />
          {displayTrendValue}
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <p className='text-[#617589] text-[11px] font-bold uppercase tracking-[0.05em] font-sans'>{title}</p>
        <div className="flex items-baseline gap-1.5">
          {isCurrency && <span className="text-sm font-bold text-slate-300 font-mono">Gs.</span>}
          <h3 className='text-[#111418] text-3xl font-bold tracking-tight leading-none font-mono truncate'>
            {isCurrency ? displayValue : `${displayValue}%`}
          </h3>
        </div>
      </div>
    </div>
  )
}

const ProfitabilityDashboard = () => {
  const [period, setPeriod] = useState('month')
  const { data, loading, error } = useProfitability('getDashboard', period)

  if (loading) return <DashboardSkeleton />

  if (error)
    return (
      <div className="p-10 text-center animate-in zoom-in-95 duration-500">
        <div className="max-w-md mx-auto glass-acrylic border border-rose-200 p-8 rounded-2xl text-[#d13438] shadow-2xl">
          <AlertTriangle className="mx-auto mb-4" size={40} />
          <h4 className="font-bold text-base uppercase tracking-widest mb-2 font-sans">Interrupción de Datos</h4>
          <p className="text-xs font-medium opacity-80 font-sans">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-[#d13438] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors font-sans">Reintentar</button>
        </div>
      </div>
    )

  const { kpis, break_even_status, alerts, efficiency_trend } = data

  return (
    <div className='space-y-10 animate-in fade-in duration-700 pb-32 font-sans'>
      {/* Header Premium Section */}
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-8 py-4 border-b border-[#e5e7eb] mb-8'>
        <div className='flex flex-col gap-1'>
          <nav className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">
             <span className="flex items-center gap-1.5"><Zap size={14} className="text-[#0f6cbd]" /> BUSINESS INTELLIGENCE</span>
             <ChevronRight size={10} className="text-slate-300" />
             <span className="text-[#0f6cbd]/80">PROFITABILITY</span>
          </nav>
          <h1 className='text-4xl md:text-5xl font-black text-[#111418] tracking-tighter leading-none uppercase'>
            Dashboard <span className="text-[#0f6cbd]">Financiero</span>
          </h1>
          <p className='text-sm font-medium text-[#617589] mt-3 max-w-xl leading-relaxed'>
            Métricas de rentabilidad y eficiencia operativa. Datos actualizados en tiempo real bajo estándares de auditoría corporativa.
          </p>
        </div>

        <div className='flex gap-1.5 p-1.5 bg-[#f3f2f1] rounded-lg border border-[#e1dfdd]'>
          {[
            { id: 'today', label: 'Hoy' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' },
            { id: 'year', label: 'Año' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded transition-all duration-200 ${
                period === p.id
                  ? 'bg-white text-[#0f6cbd] shadow-sm ring-1 ring-[#e1dfdd] scale-105'
                  : 'text-[#617589] hover:text-[#111418] hover:bg-white/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid - High Density Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5'>
        <KPICard title='Ingresos Totales' value={kpis.total_revenue} trendValue={kpis.revenue_growth} delay="0" icon={Activity} color="primary" />
        <KPICard title='Profit Bruto' value={kpis.total_profit} trendValue={kpis.profit_growth} delay="100" icon={TrendingUp} color="emerald" />
        <KPICard title='Margen Bruto' value={kpis.gross_margin_pct} trendValue={kpis.gross_margin_growth} isCurrency={false} delay="200" icon={Target} color="purple" />
        <KPICard title='Margen Neto' value={kpis.net_margin_pct} trendValue={kpis.net_margin_growth} isCurrency={false} delay="300" icon={Zap} color="orange" />
        <KPICard title='ROI Auditado' value={kpis.roi} trendValue={kpis.roi_growth} isCurrency={false} delay="400" icon={TrendingUp} color="primary" />
        <KPICard title='Profit / Tx' value={kpis.profit_per_transaction} trendValue={kpis.profit_per_tx_growth} delay="500" icon={Activity} color="emerald" />
      </div>

      <div className='grid grid-cols-12 gap-8'>
        {/* Main Chart Section */}
        <div className='col-span-12 lg:col-span-8 rounded-xl bg-white border border-[#e5e7eb] shadow-fluent p-8 relative overflow-hidden flex flex-col'>
          <div className='flex flex-wrap items-center justify-between gap-4 mb-12'>
            <div>
              <h3 className='text-[#111418] text-xl font-bold tracking-tight uppercase'>Tendencia de Eficiencia</h3>
              <p className='text-[#617589] text-[11px] font-bold uppercase tracking-widest mt-1'>
                Correlación flujo de caja vs margen real neto por mes
              </p>
            </div>
            <div className='flex items-center gap-6 px-5 py-2.5 bg-[#f3f2f1] rounded-full border border-[#e1dfdd]'>
              <div className='flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-tight'>
                <span className='size-3 rounded-full bg-[#0f6cbd]/30'></span>
                <span className='text-[#617589]'>Ingresos</span>
              </div>
              <div className='flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-tight'>
                <span className='size-3 rounded-full bg-[#107c10] shadow-[0_0_8px_rgba(16,124,16,0.4)]'></span>
                <span className='text-[#107c10]'>Profit Real</span>
              </div>
            </div>
          </div>

          <div className='h-[320px] flex items-end justify-between px-6 gap-3 pb-8 relative z-10 mt-auto'>
            {efficiency_trend?.data_points?.map((dp, i) => (
              <div key={i} className='flex-1 flex flex-col items-center gap-4 group/chart h-full justify-end'>
                <div className='w-full max-w-[40px] h-[240px] flex items-end relative rounded-t-lg overflow-hidden bg-slate-50 border border-slate-100 shadow-inner group-hover/chart:bg-slate-100 transition-colors'>
                  {/* Revenue Bar (Background) */}
                  <div 
                    className='w-full bg-blue-500/10 transition-all duration-500 relative' 
                    style={{ height: `${dp.performance ?? 0}%` }}
                  >
                    {/* Profit Bar (Foreground) */}
                    <div 
                      className='absolute bottom-0 left-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-1000 group-hover/chart:brightness-110 shadow-[0_0_12px_rgba(16,124,16,0.2)]'
                      style={{ height: `${dp.performance > 0 ? ((dp.profit_pct ?? 0) / dp.performance) * 100 : 0}%` }}
                    />
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black py-2 px-3 rounded-xl shadow-2xl opacity-0 group-hover/chart:opacity-100 transition-all pointer-events-none whitespace-nowrap z-30 border border-white/10">
                     <div className="flex flex-col gap-1">
                       <span className="text-blue-300">EFICIENCIA: {formatPercent(dp.performance)}%</span>
                       <span className="text-emerald-300">PROFIT: {formatPercent(dp.profit_pct)}%</span>
                     </div>
                  </div>
                </div>
                <span className='text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/chart:text-[#0f6cbd] transition-colors shrink-0 font-mono'>{dp.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className='col-span-12 lg:col-span-4 space-y-8'>
          {/* Break Even Widget - Option 1: Deep Brand Blue */}
          <div className='bg-gradient-to-br from-[#003966] via-[#004578] to-[#0f6cbd] p-8 rounded-xl text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group'>
            {/* Soft Glow Effect */}
            <div className="absolute -top-24 -right-24 size-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-1000"></div>
            
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
               <Target size={120} />
            </div>
            
            <div className='flex justify-between items-start mb-10 relative z-10'>
              <h3 className='font-black text-[11px] uppercase tracking-[0.3em] text-blue-200/80 leading-none'>
                Equilibrio Corporativo
              </h3>
              <div className="p-2.5 bg-white/10 rounded-lg backdrop-blur-md border border-white/10 shadow-inner">
                <Target size={22} className="text-white" />
              </div>
            </div>
            
            <div className="relative z-10 mb-10">
              <p className='text-2xl font-bold tracking-tight mb-3'>
                {break_even_status.has_reached_break_even ? 'Objetivo Superado' : 'Faltan Cobertura'}
              </p>
              <p className='text-sm text-blue-100/70 leading-relaxed font-medium'>
                {break_even_status.has_reached_break_even
                  ? 'La organización mantiene márgenes positivos sobre el punto de equilibrio operativo.'
                  : `Se requiere alcanzar un margen adicional del ${formatPercent(break_even_status.coverage_required)}%.`}
              </p>
            </div>
            
            <div className='space-y-10 relative z-10'>
              <div className='w-full bg-black/20 h-3 rounded-full overflow-hidden p-0.5 shadow-inner'>
                <div
                  className='bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-2000 ease-out'
                  style={{ width: `${break_even_status.current_progress}%` }}
                />
              </div>
              <div className='grid grid-cols-2 gap-4 border-t border-white/10 pt-8'>
                <div>
                  <p className='text-[10px] uppercase font-black tracking-widest text-blue-200/60 mb-1.5'>Progreso</p>
                  <p className='font-black text-xl font-mono tracking-tight'>{formatPercent(break_even_status.current_progress)}%</p>
                </div>
                <div>
                  <p className='text-[10px] uppercase font-black tracking-widest text-blue-200/60 mb-1.5'>ROI Auditado</p>
                  <p className='font-black text-xl font-mono tracking-tight text-emerald-300'>+{formatPercent(kpis.roi)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Alerts Widget */}
          <div className='bg-white rounded-xl border border-[#e5e7eb] shadow-fluent flex flex-col overflow-hidden'>
            <div className="p-6 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f3f2f1]/50">
              <h3 className='font-black text-[11px] uppercase tracking-[0.2em] text-[#111418] flex items-center gap-3'>
                <AlertTriangle className='text-[#d13438]' size={20} />
                Alertas de Riesgo
              </h3>
              <span className="flex size-2.5 rounded-full bg-[#d13438] animate-pulse" />
            </div>
            
            <div className='flex flex-col divide-y divide-[#e5e7eb]'>
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className='group relative flex flex-col p-6 hover:bg-[#f3f2f1]/30 transition-colors cursor-pointer'
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${alert.severity === 'HIGH' ? 'bg-[#d13438]' : 'bg-[#0f6cbd]'} rounded-r-sm`} />
                  <div className='flex items-center justify-between mb-2.5'>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${alert.severity === 'HIGH' ? 'bg-[#fde7e9] text-[#d13438]' : 'bg-[#deecf9] text-[#0f6cbd]'}`}>
                      {alert.severity || 'INFO'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">{alert.time_ago}</span>
                  </div>
                  <p className='text-[13px] font-bold text-[#111418] uppercase tracking-tight leading-none group-hover:text-[#0f6cbd] transition-colors mb-2'>
                    {alert.type}
                  </p>
                  <p className='text-xs text-[#617589] font-medium leading-relaxed'>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
            
            <button className="w-full py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] hover:bg-[#f3f2f1] hover:text-[#0f6cbd] transition-all border-t border-[#e5e7eb]">
               Ver Auditoría Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfitabilityDashboard
