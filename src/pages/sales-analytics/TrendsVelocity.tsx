import { useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  Clock,
  Zap,
  Package,
  Calendar,
  RefreshCcw,
  Info,
  Banknote,
} from 'lucide-react'
import salesAnalyticsService from '@/services/bi/salesAnalyticsService'

interface VelocityOverall {
  sales_per_day?: number
  sales_per_hour?: number
  units_per_day?: number
  avg_minutes_between_sales?: number
}

interface VelocityData {
  overall?: VelocityOverall
}

interface HeatmapData {
  data?: number[][]
  period?: { start_date?: string; end_date?: string }
}

interface TrendPoint {
  label?: string
  sales?: number
}

const TrendsVelocity = () => {
  const [velocityData, setVelocityData] = useState<VelocityData | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [trendsData, setTrendsData] = useState<{ daily: TrendPoint[]; hourly: TrendPoint[] }>({ daily: [], hourly: [] })
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  // Hora pico REAL: la hora con más ventas del hourly (antes estaba fija en 14:00)
  const peakHourLabel =
    (trendsData.hourly || []).reduce(
      (best: TrendPoint | null, cur: TrendPoint) => ((cur?.sales || 0) > (best?.sales || 0) ? cur : best),
      null,
    )?.label || null

  // H7 (FASE 5): "Actualizar" cableado — mismo fetch del mount, re-ejecutable.
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [velRes, heatRes, dailyTrends, hourlyTrends] = await Promise.all([
        salesAnalyticsService.getVelocity({ period: 'month' }),
        salesAnalyticsService.getHeatmap({ period: 'month' }),
        salesAnalyticsService.getTrends({
          period: 'month',
          granularity: 'daily',
        }),
        salesAnalyticsService.getTrends({
          period: 'month',
          granularity: 'hourly',
        }),
      ])

      if (velRes && velRes.success) setVelocityData(velRes.data)
      if (heatRes && heatRes.success) setHeatmapData(heatRes.data)
      setTrendsData({
        daily: dailyTrends?.success ? dailyTrends.data.data_points : [],
        hourly: hourlyTrends?.success ? hourlyTrends.data.data_points : [],
      })
    } catch (error) {
      console.error('Error fetching velocity or heatmap data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
    fetchData()
  }, [fetchData])

  // Intensidad relativa al máximo REAL del período (antes: max fijo 1000000
  // "consistent with mock max" que aplastaba el heatmap — hallazgo P1-4).
  const heatmapMax = (() => {
    const rows = heatmapData?.data
    if (!Array.isArray(rows)) return 0
    let max = 0
    for (const row of rows) {
      if (!Array.isArray(row)) continue
      for (const v of row) {
        const n = Number(v) || 0
        if (n > max) max = n
      }
    }
    return max
  })()

  const getHeatmapIntensity = (dayIdx: number, hourIdx: number) => {
    const row = heatmapData?.data?.[dayIdx]
    if (!row) return 0.1
    const value = Number(row[hourIdx]) || 0
    if (heatmapMax <= 0) return 0.1
    const ratio = value / heatmapMax
    return ratio > 0.8 ? 0.9 : ratio > 0.5 ? 0.6 : ratio > 0.2 ? 0.3 : 0.1
  }

  const formatCurrency = (value: number | null | undefined) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0,
    }).format(value || 0)
  }

  const periodLabel = heatmapData?.period
    ? `${new Date(heatmapData.period.start_date || '').toLocaleDateString()} - ${new Date(heatmapData.period.end_date || '').toLocaleDateString()}`
    : 'Periodo actual'

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      {/* Header Section */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-foreground text-3xl font-black leading-tight tracking-tight uppercase'>
            Tendencias Temporales y Velocidad
          </h1>
          <p className='text-on-surface-deep text-sm font-medium'>
            Análisis detallado de frecuencia de transacciones y picos de demanda
            operativa.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2 bg-surface border border-border-subtle rounded-lg px-4 py-2 text-sm font-bold shadow-sm font-mono uppercase tracking-tighter'>
            <Calendar size={18} className='text-on-surface-deep' />
            <span>{periodLabel}</span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className='flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-md shadow-primary/20 uppercase tracking-wider disabled:opacity-50'
          >
            <RefreshCcw size={18} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <VelocityKPICard
          title='Ventas por Día'
          value={formatCurrency(velocityData?.overall?.sales_per_day || 0)}
          icon={<Banknote size={20} />}
          status='Promedio por día'
          trend={<TrendingUp size={14} className='text-success' />}
        />
        <VelocityKPICard
          title='Ventas por Hora'
          value={formatCurrency(velocityData?.overall?.sales_per_hour || 0)}
          icon={<Zap size={20} />}
          status={peakHourLabel ? `Hora pico: ${peakHourLabel}` : 'Hora pico: n/d'}
          trend={<TrendingUp size={14} className='text-warning' />}
        />
        <VelocityKPICard
          title='Unidades por Día'
          value={Math.round((velocityData?.overall?.units_per_day || 0) * 10) / 10}
          icon={<Package size={20} />}
          status='Promedio por día'
          isBadge={true}
        />
        <VelocityKPICard
          title='Ciclo de Venta'
          value={`${velocityData?.overall?.avg_minutes_between_sales || 0} min`}
          icon={<Clock size={20} />}
          status='Tiempo prom. entre ventas'
        />
      </div>

      {/* Heatmap Section */}
      <div className='bg-surface p-8 rounded-lg border border-border-subtle shadow-sm'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center gap-3'>
            <h2 className='text-foreground text-xl font-bold tracking-tight uppercase'>
              Heatmap de Ventas
            </h2>
            <Info size={18} className='text-on-surface-deep cursor-help' />
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-[10px] font-black text-on-surface-deep uppercase tracking-widest'>
              Baja
            </span>
            <div className='flex gap-1'>
              {[0.1, 0.3, 0.6, 0.9].map(op => (
                <div
                  key={op}
                  className='size-3 rounded-sm bg-primary'
                  style={{ opacity: op }}
                ></div>
              ))}
            </div>
            <span className='text-[10px] font-black text-on-surface-deep uppercase tracking-widest'>
              Alta
            </span>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <div className='min-w-[800px]'>
            <div className='grid grid-cols-[80px_repeat(24,1fr)] gap-1 mb-2'>
              <div></div>
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className='text-[10px] font-black text-on-surface-deep text-center font-mono'
                >
                  {i % 2 === 0 ? i.toString().padStart(2, '0') : ''}
                </div>
              ))}
            </div>
            {[
              'Lunes',
              'Martes',
              'Miércoles',
              'Jueves',
              'Viernes',
              'Sábado',
              'Domingo',
            ].map((day, dIdx) => (
              <div
                key={day}
                className='grid grid-cols-[80px_repeat(24,1fr)] gap-1 mb-1'
              >
                <div className='text-[10px] font-black text-on-surface-deep flex items-center pr-2 uppercase tracking-tighter'>
                  {day}
                </div>
                {Array.from({ length: 24 }).map((_, hIdx) => {
                  const opacity = getHeatmapIntensity(dIdx, hIdx)
                  return (
                    <div
                      key={hIdx}
                      className='h-8 rounded-sm bg-primary hover:scale-110 transition-transform cursor-pointer shadow-sm border border-black/5'
                      style={{ opacity }}
                    ></div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Ventas por Día de la Semana */}
        <div className='bg-surface p-8 rounded-lg border border-border-subtle shadow-sm flex flex-col h-[400px]'>
          <h2 className='text-foreground text-xl font-bold tracking-tight mb-8 uppercase'>
            Ventas por Día
          </h2>
          <div className='flex-1 font-mono'>
            {!loading && isMounted && (
              <ResponsiveContainer
                width='100%'
                height='100%'
                minWidth={0}
                minHeight={0}
              >
                <BarChart data={trendsData.daily || []}>
                  <XAxis
                    dataKey='label'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    formatter={value => [formatCurrency(Number(value)), 'Ventas']}
                  />
                  <Bar
                    dataKey='sales'
                    name='Ventas'
                    fill='#137fec'
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ventas por Hora del Día */}
        <div className='bg-surface p-8 rounded-lg border border-border-subtle shadow-sm flex flex-col h-[400px]'>
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h2 className='text-foreground text-xl font-bold tracking-tight uppercase'>
                Ventas por Hora
              </h2>
              <p className='text-xs font-bold text-on-surface-deep uppercase tracking-tighter'>
                Distribución horaria
              </p>
            </div>
            {peakHourLabel && (
              <div className='bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded uppercase font-mono tracking-widest'>
                Pico: {peakHourLabel}
              </div>
            )}
          </div>
          <div className='flex-1 font-mono'>
            {!loading && isMounted && (
              <ResponsiveContainer
                width='100%'
                height='100%'
                minWidth={0}
                minHeight={0}
              >
                <AreaChart data={trendsData.hourly || []}>
                  <defs>
                    <linearGradient id='colorHr' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#137fec' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='#137fec' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey='label'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    formatter={value => [formatCurrency(Number(value)), 'Ventas']}
                  />
                  <Area
                    type='monotone'
                    dataKey='sales'
                    name='Ventas'
                    stroke='#137fec'
                    strokeWidth={3}
                    fillOpacity={1}
                    fill='url(#colorHr)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface VelocityKPICardProps {
  title: string
  value: string | number
  icon: ReactNode
  status?: string
  trend?: ReactNode
  isBadge?: boolean
}

const VelocityKPICard = ({ title, value, icon, status, trend, isBadge }: VelocityKPICardProps) => (
  <div className='bg-surface p-6 rounded-lg border border-border-subtle shadow-sm flex flex-col gap-2 hover:border-primary transition-all group'>
    <div className='flex justify-between items-start'>
      <p className='text-on-surface-deep text-[11px] font-black uppercase tracking-widest group-hover:text-primary transition-colors'>
        {title}
      </p>
      <div className='text-primary bg-primary/10 p-2 rounded-lg'>
        {icon}
      </div>
    </div>
    <p className='text-foreground text-3xl font-black tracking-tight font-mono leading-none'>
      {value}
    </p>
    <div className='flex items-center gap-1.5 mt-2'>
      {trend}
      {isBadge ? (
        <span className='bg-success/10 text-success text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter font-mono'>
          {status}
        </span>
      ) : (
        <p className='text-on-surface-deep text-[10px] font-bold uppercase tracking-tight'>
          {status}
        </p>
      )}
    </div>
  </div>
)

export default TrendsVelocity
