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

const KPICard = ({ title, value, trend, trendValue, isCurrency = true, delay = "0" }) => {
  const isPositive = trend === 'up' || parseFloat(trendValue) > 0
  const isNegative = trend === 'down' || parseFloat(trendValue) < 0
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  
  const colorClass = isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-400'
  const bgTrendClass = isPositive ? 'bg-emerald-500/10' : isNegative ? 'bg-rose-500/10' : 'bg-slate-500/10'

  const displayValue = formatPYG(value)
  const displayTrendValue = `${formatPercent(Math.abs(trendValue), 1)}%`

  const fontSizeClass = getDynamicFontClass(displayValue, {
    baseClass: 'text-3xl',
    mediumClass: 'text-2xl',
    smallClass: 'text-xl',
    extraSmallClass: 'text-lg',
  })

  return (
    <div 
      style={{ animationDelay: `${delay}ms` }}
      className='bg-white/70 backdrop-blur-xl rounded-2xl border border-white shadow-fluent-2 transition-all duration-500 hover:shadow-fluent-16 hover:-translate-y-1 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4'
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className='p-6 flex flex-col gap-5'>
        <div className='flex items-center justify-between'>
          <p className='text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none'>
            {title}
          </p>
          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-300 group-hover:text-primary transition-colors">
            <Activity size={14} />
          </div>
        </div>

        <div className='flex flex-col gap-2.5'>
          <div className="flex items-baseline gap-1.5">
            {isCurrency && <span className="text-xs font-bold text-slate-300">Gs.</span>}
            <h3 className={`min-w-0 font-bold text-slate-900 tracking-tight leading-none font-display ${fontSizeClass}`}>
              {isCurrency ? displayValue : `${formatPercent(value)}%`}
            </h3>
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${bgTrendClass} ${colorClass} text-[10px] font-bold uppercase tracking-tight border border-current/10`}>
            <Icon size={10} strokeWidth={3} />
            <span>{displayTrendValue}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProfitabilityDashboard = () => {
  const [period, setPeriod] = useState('month')
  const { data, loading, error } = useProfitability('getDashboard', period)

  if (loading)
    return (
      <div className='p-32 text-center animate-in fade-in duration-1000'>
        <div className="flex flex-col items-center gap-6">
          <div className="relative size-16">
             <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
             <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
             <Zap className="absolute inset-0 m-auto text-primary animate-pulse" size={24} />
          </div>
          <p className="text-xs font-bold text-slate-400 tracking-[0.3em] uppercase">Sincronizando Inteligencia Financiera</p>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="p-10 text-center animate-in zoom-in-95 duration-500">
        <div className="max-w-md mx-auto glass-acrylic border border-rose-200 p-8 rounded-2xl text-[#d13438] shadow-2xl">
          <AlertTriangle className="mx-auto mb-4" size={40} />
          <h4 className="font-bold text-base uppercase tracking-widest mb-2">Interrupción de Datos</h4>
          <p className="text-xs font-medium opacity-80">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-[#d13438] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors">Reintentar</button>
        </div>
      </div>
    )

  const { kpis, break_even_status, alerts } = data

  return (
    <div className='space-y-12 animate-in fade-in duration-1000 pb-32'>
      {/* Header Premium Section */}
      <div className='flex flex-col md:flex-row md:items-end justify-between gap-8 relative'>
        <div className="absolute -left-10 top-0 w-1 h-full bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-full"></div>
        <div className='flex flex-col gap-2'>
          <nav className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-4">
             <span className="flex items-center gap-1.5"><Zap size={12} className="text-primary" /> BUSINESS INTELLIGENCE</span>
             <ChevronRight size={10} className="text-slate-300" />
             <span className="text-primary/70">PROFITABILITY</span>
          </nav>
          <h1 className='text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter leading-none'>
            Dashboard <span className="text-primary/80">Premium</span>
          </h1>
          <p className='text-sm font-medium text-slate-400 mt-4 max-w-xl leading-relaxed'>
            Análisis algorítmico de márgenes operativos y rendimiento de activos financieros auditados bajo estándar corporativo.
          </p>
        </div>

        <div className='flex gap-1.5 p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-inner'>
          {['today', 'week', 'month', 'year'].map((p, idx) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${
                period === p
                  ? 'bg-white text-primary shadow-fluent-8 scale-105'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/30'
              }`}
            >
              {p === 'today' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid - Glass Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6'>
        <KPICard title='Ingresos' value={kpis.total_revenue} trend='up' trendValue={kpis.revenue_growth} delay="100" />
        <KPICard title='Beneficio' value={kpis.total_profit} trend='up' trendValue={kpis.profit_growth} delay="200" />
        <KPICard title='Margen Bruto' value={kpis.gross_margin_pct} trend='up' trendValue={kpis.margin_change} isCurrency={false} delay="300" />
        <KPICard title='Margen Neto' value={kpis.net_margin_pct} trend='up' trendValue='0.5' isCurrency={false} delay="400" />
        <KPICard title='ROI Auditado' value={kpis.roi} trend='up' trendValue='3.1' isCurrency={false} delay="500" />
        <KPICard title='Ganancia / Tx' value={kpis.profit_per_transaction} trend='stable' trendValue='0' delay="600" />
      </div>

      <div className='grid grid-cols-12 gap-8'>
        {/* Chart Section - Acrylic Glass */}
        <div className='col-span-12 lg:col-span-8 glass-acrylic p-10 rounded-3xl border border-white shadow-fluent-16 group relative overflow-hidden'>
          <div className="absolute -right-20 -top-20 size-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-1000"></div>
          
          <div className='flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-4 relative z-10'>
            <div>
              <h3 className='text-lg font-bold uppercase tracking-[0.2em] text-slate-900 leading-none'>
                Tendencia de Eficiencia
              </h3>
              <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3'>
                Correlación flujo de caja vs margen real neto
              </p>
            </div>
            <div className='flex items-center gap-8 bg-white/50 p-3 rounded-full border border-white/50'>
              <div className='flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-tight'>
                <span className='size-2.5 rounded-full bg-primary/20 ring-4 ring-primary/5'></span>
                <span className='text-slate-400'>Ingresos</span>
              </div>
              <div className='flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-tight'>
                <span className='size-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,124,16,0.5)] ring-4 ring-emerald-500/10'></span>
                <span className='text-emerald-600'>Profit</span>
              </div>
            </div>
          </div>

          <div className='h-80 flex items-end justify-between px-8 bg-slate-50/40 rounded-2xl p-10 gap-4 border border-white/40 shadow-inner relative z-10'>
            {[60, 75, 65, 85, 90, 70, 80, 95].map((h, i) => (
              <div
                key={i}
                className='flex-1 max-w-[56px] bg-primary/5 rounded-t-xl relative group/bar transition-all duration-500 hover:bg-primary/10'
                style={{ height: `${h}%` }}
              >
                <div
                  className='absolute bottom-0 w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-1000 group-hover/bar:scale-y-105 origin-bottom shadow-lg group-hover/bar:shadow-emerald-500/40'
                  style={{ height: `${h * 0.4}%` }}
                />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                   {h}% Perf.
                </div>
              </div>
            ))}
          </div>
          <div className='flex justify-between px-12 mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] relative z-10'>
            {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO'].map(m => (
              <span key={m} className="hover:text-primary transition-colors cursor-default">{m}</span>
            ))}
          </div>
        </div>

        {/* Sidebar - High Contrast & Information */}
        <div className='col-span-12 lg:col-span-4 space-y-8'>
          <div className='bg-primary p-12 rounded-3xl text-white shadow-2xl shadow-primary/30 relative overflow-hidden group'>
            {/* Animated backgrounds */}
            <div className="absolute top-0 right-0 size-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 size-48 bg-black/10 rounded-full blur-[60px] -ml-24 -mb-24"></div>
            
            <div className='flex justify-between items-start mb-10 relative z-10'>
              <h3 className='font-bold text-[11px] uppercase tracking-[0.3em] leading-none opacity-80'>
                Punto de Equilibrio
              </h3>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md group-hover:rotate-12 transition-transform">
                <Target size={24} />
              </div>
            </div>
            
            <p className='text-base font-medium leading-relaxed mb-12 relative z-10'>
              {break_even_status.has_reached_break_even
                ? 'Objetivo corporativo alcanzado. La organización opera con margen positivo constante.'
                : 'Se requiere una cobertura del 18% para alcanzar el punto de equilibrio operativo proyectado.'}
            </p>
            
            <div className='space-y-10 relative z-10'>
              <div className='w-full bg-white/20 h-3 rounded-full overflow-hidden p-0.5 shadow-inner'>
                <div
                  className='bg-gradient-to-r from-white to-white/80 h-full rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all duration-2000 ease-out relative'
                  style={{ width: '82%' }}
                >
                   <div className="absolute top-0 right-0 size-2 bg-white rounded-full ring-4 ring-white/20 animate-ping"></div>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-10'>
                <div className="space-y-1">
                  <p className='text-[10px] uppercase font-bold tracking-widest opacity-60'>Performance</p>
                  <p className='font-bold text-lg uppercase tracking-tight'>
                    {break_even_status.performance_status === 'ABOVE_BREAK_EVEN' ? 'OPTIMO' : 'REQUERIDO'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className='text-[10px] uppercase font-bold tracking-widest opacity-60'>ROI Auditado</p>
                  <p className='font-bold text-lg font-mono'>+{kpis.roi}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white/80 backdrop-blur-md p-10 rounded-3xl border border-white shadow-fluent-8 group relative'>
            <div className="absolute top-6 right-6">
               <span className="flex size-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                 <span className="relative inline-flex rounded-full size-3 bg-warning"></span>
               </span>
            </div>
            
            <h3 className='font-bold text-[11px] uppercase tracking-[0.25em] mb-10 flex items-center gap-4 text-slate-900'>
              <AlertTriangle className='text-warning' size={22} />
              Alertas Críticas
            </h3>
            
            <div className='space-y-6'>
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className='flex gap-5 p-5 bg-slate-50/50 border border-white hover:border-slate-200 hover:bg-white transition-all duration-300 rounded-2xl group/item cursor-default'
                >
                  <div
                    className={`px-2.5 py-1 h-fit rounded text-[8px] font-bold uppercase tracking-widest text-white shadow-sm transition-transform group-hover/item:scale-110 ${alert.severity === 'HIGH' ? 'bg-[#d13438]' : 'bg-primary'}`}
                  >
                    {alert.severity || 'INFO'}
                  </div>
                  <div className='flex flex-col gap-2'>
                    <p className='text-xs font-bold text-slate-900 uppercase tracking-tight leading-none group-hover/item:text-primary transition-colors'>
                      {alert.type}
                    </p>
                    <p className='text-[10px] text-slate-500 font-medium uppercase tracking-tight leading-relaxed opacity-80'>
                      {alert.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-10 py-3 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-600 transition-all">
               Ver historial de alertas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfitabilityDashboard
