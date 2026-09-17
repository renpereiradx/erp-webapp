import { useState, useEffect } from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { Activity, ChevronRight } from 'lucide-react'
import salesAnalyticsService from '@/services/bi/salesAnalyticsService'
import { useI18n } from '@/lib/i18n'

/** Límites resueltos por el BE para cada período del compare. */
interface ComparisonPeriodInfo {
  start_date?: string
  end_date?: string
}

interface ComparePeriodSnapshot {
  period?: ComparisonPeriodInfo
  total_sales?: number
  total_transactions?: number
  total_units?: number
  average_ticket?: number
  unique_customers?: number
  gross_margin?: number
}

interface CompareDiff {
  sales_change_pct?: number
  sales_change?: number
  transactions_change_pct?: number
  transactions_change?: number
  units_change_pct?: number
  units_change?: number
  ticket_change_pct?: number
  ticket_change?: number
  customers_change_pct?: number
  customers_change?: number
  margin_change_pct?: number
}

/** GET /sales-analytics/compare → data. */
interface ComparisonData {
  period_1?: ComparePeriodSnapshot
  period_2?: ComparePeriodSnapshot
  differences?: CompareDiff
}

/** Punto de /sales-analytics/trends(/date-range). */
interface TrendPoint {
  label?: string
  sales?: number
}

interface ChartPoint {
  label: string
  periodA: number | null
  periodB: number | null
}

interface CompareParams {
  period?: string
  start1?: string
  end1?: string
  start2?: string
  end2?: string
}

const dayOf = (iso?: string): string | null => (iso ? String(iso).slice(0, 10) : null)

const PeriodComparison = () => {
  const { t } = useI18n()
  const [compareData, setCompareData] = useState<ComparisonData | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  // Selection state
  const [isCustom, setIsCustom] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [customDates, setCustomDates] = useState({
    start1: '',
    end1: '',
    start2: '',
    end2: ''
  })

  // Trae las dos series reales (Período A y B) desde /trends/date-range usando
  // los límites que el propio compare resuelve; si algún límite falta, esa
  // serie queda en null (sin inventar datos — regla FE-1).
  const fetchTrendSeries = async (
    rangeA: { start?: string | null; end?: string | null },
    rangeB: { start?: string | null; end?: string | null }
  ): Promise<ChartPoint[]> => {
    const [pointsA, pointsB] = await Promise.all([
      rangeA.start && rangeA.end
        ? salesAnalyticsService
            .getTrendsDateRange({ start_date: rangeA.start, end_date: rangeA.end })
            .then((res) => (res?.success ? (res.data?.data_points || []) : []))
            .catch(() => [] as TrendPoint[])
        : Promise.resolve([] as TrendPoint[]),
      rangeB.start && rangeB.end
        ? salesAnalyticsService
            .getTrendsDateRange({ start_date: rangeB.start, end_date: rangeB.end })
            .then((res) => (res?.success ? (res.data?.data_points || []) : []))
            .catch(() => [] as TrendPoint[])
        : Promise.resolve([] as TrendPoint[]),
    ])

    const len = Math.max(pointsA.length, pointsB.length)
    const merged: ChartPoint[] = []
    for (let i = 0; i < len; i++) {
      merged.push({
        label: pointsA[i]?.label || pointsB[i]?.label || `D${i + 1}`,
        periodA: pointsA[i] ? Number(pointsA[i].sales || 0) : null,
        periodB: pointsB[i] ? Number(pointsB[i].sales || 0) : null,
      })
    }
    return merged
  }

  const fetchData = async (params: CompareParams) => {
    setLoading(true)
    try {
      // Comparison metrics
      const compRes = await salesAnalyticsService.comparePeriods(params)
      const comp: ComparisonData | null = compRes && compRes.success ? compRes.data : null
      if (comp) setCompareData(comp)

      // Límites reales de ambos períodos: los da el compare (period_*). En modo
      // custom, los rangos vienen del formulario.
      const rangeA = {
        start: dayOf(comp?.period_1?.period?.start_date) || params.start1 || null,
        end: dayOf(comp?.period_1?.period?.end_date) || params.end1 || null,
      }
      const rangeB = {
        start: dayOf(comp?.period_2?.period?.start_date) || params.start2 || null,
        end: dayOf(comp?.period_2?.period?.end_date) || params.end2 || null,
      }

      setChartData(await fetchTrendSeries(rangeA, rangeB))
    } catch (error) {
      console.error('Error fetching comparison data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    fetchData({ period: 'month' })
  }, [])

  const handleCompare = () => {
    if (isCustom) {
      if (!customDates.start1 || !customDates.end1 || !customDates.start2 || !customDates.end2) {
        alert(t('bi.compare.alertIncomplete', 'Por favor complete todas las fechas para la comparación personalizada'))
        return
      }
      fetchData(customDates)
    } else {
      fetchData({ period: selectedPeriod })
    }
  }

  const formatCurrency = (value: number | null | undefined) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0,
    }).format(Number(value || 0))
  }

  // % de margen con guard de división por cero
  const pctOf = (margin: number | undefined, sales: number | undefined) =>
    (sales || 0) > 0 ? `${(((margin || 0) / (sales || 1)) * 100).toFixed(1)}%` : '—'

  // Delta en puntos porcentuales entre los márgenes de ambos períodos
  const marginPct1 =
    (compareData?.period_1?.total_sales || 0) > 0
      ? ((compareData?.period_1?.gross_margin || 0) / (compareData?.period_1?.total_sales || 1)) * 100
      : 0
  const marginPct2 =
    (compareData?.period_2?.total_sales || 0) > 0
      ? ((compareData?.period_2?.gross_margin || 0) / (compareData?.period_2?.total_sales || 1)) * 100
      : 0
  const marginPp = Math.round((marginPct1 - marginPct2) * 10) / 10

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      {/* Header */}
      <header className='flex flex-col gap-1'>
        <div className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-deep'>
          <span>{t('bi.compare.crumb.sales', 'Ventas')}</span>
          <ChevronRight size={10} />
          <span className='text-primary'>{t('bi.compare.title', 'Comparativa de Períodos')}</span>
        </div>
        <h2 className='text-2xl font-black text-foreground uppercase tracking-tight'>{t('bi.compare.title', 'Comparativa de Períodos')}</h2>
        <p className='text-sm text-on-surface-deep font-medium'>{t('bi.compare.subtitle', 'Análisis detallado de rendimiento entre dos rangos de fechas seleccionados.')}</p>
      </header>

      {/* Selection Bar */}
      <section className='bg-surface rounded-lg border border-border-subtle p-6 shadow-sm'>
        <div className='flex flex-col gap-6'>
          <div className='flex items-center gap-4'>
             <button
               onClick={() => setIsCustom(false)}
               className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!isCustom ? 'bg-primary text-on-primary' : 'bg-surface-muted text-on-surface-deep'}`}
             >{t('bi.compare.preset', 'Períodos Predefinidos')}</button>
             <button
               onClick={() => setIsCustom(true)}
               className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isCustom ? 'bg-primary text-on-primary' : 'bg-surface-muted text-on-surface-deep'}`}
             >{t('bi.compare.custom', 'Rangos Personalizados')}</button>
          </div>

          <div className='flex flex-wrap items-end gap-6 max-w-6xl'>
            {!isCustom ? (
              <div className='flex-1 min-w-[280px]'>
                <label className='block text-[10px] font-black text-on-surface-deep uppercase tracking-widest mb-2'>{t('bi.compare.selectPeriod', 'Seleccionar Período')}</label>
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className='w-full rounded-lg border-border-subtle bg-surface text-sm font-bold focus:ring-primary focus:border-primary py-2.5'
                >
                  <option value="today">{t('bi.compare.opt.today', 'Hoy vs Ayer')}</option>
                  <option value="week">{t('bi.compare.opt.week', 'Esta Semana vs Anterior')}</option>
                  <option value="month">{t('bi.compare.opt.month', 'Este Mes vs Anterior')}</option>
                  <option value="year">{t('bi.compare.opt.year', 'Este Año vs Anterior')}</option>
                </select>
              </div>
            ) : (
              <>
                <div className='grid grid-cols-2 gap-4 flex-[2] min-w-[300px]'>
                  <div>
                    <label className='block text-[10px] font-black text-on-surface-deep uppercase tracking-widest mb-2'>{t('bi.compare.p1Start', 'P1 Inicio')}</label>
                    <input type="date" value={customDates.start1} onChange={e => setCustomDates(prev => ({...prev, start1: e.target.value}))} className='w-full rounded-lg border-border-subtle bg-surface text-sm font-bold py-2' />
                  </div>
                  <div>
                    <label className='block text-[10px] font-black text-on-surface-deep uppercase tracking-widest mb-2'>{t('bi.compare.p1End', 'P1 Fin')}</label>
                    <input type="date" value={customDates.end1} onChange={e => setCustomDates(prev => ({...prev, end1: e.target.value}))} className='w-full rounded-lg border-border-subtle bg-surface text-sm font-bold py-2' />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4 flex-[2] min-w-[300px]'>
                  <div>
                    <label className='block text-[10px] font-black text-on-surface-deep uppercase tracking-widest mb-2'>{t('bi.compare.p2Start', 'P2 Inicio')}</label>
                    <input type="date" value={customDates.start2} onChange={e => setCustomDates(prev => ({...prev, start2: e.target.value}))} className='w-full rounded-lg border-border-subtle bg-surface text-sm font-bold py-2' />
                  </div>
                  <div>
                    <label className='block text-[10px] font-black text-on-surface-deep uppercase tracking-widest mb-2'>{t('bi.compare.p2End', 'P2 Fin')}</label>
                    <input type="date" value={customDates.end2} onChange={e => setCustomDates(prev => ({...prev, end2: e.target.value}))} className='w-full rounded-lg border-border-subtle bg-surface text-sm font-bold py-2' />
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleCompare}
              disabled={loading}
              className='bg-primary hover:bg-primary/90 text-on-primary font-black py-2.5 px-8 rounded-lg transition-all flex items-center gap-2 shadow-md shadow-primary/20 uppercase text-xs tracking-widest disabled:opacity-50'
            >
              {loading ? <Activity size={18} className="animate-spin" /> : <Activity size={18} />}
              Comparar
            </button>
          </div>
        </div>
      </section>

      {/* Grid Metrics */}
      <div className='flex-1 overflow-y-auto p-4 space-y-8'>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-32 bg-surface-muted rounded-lg"></div>
            ))}
          </div>
        ) : !compareData ? (
          <div className="py-16 text-center">
            <p className="text-sm font-bold text-foreground">{t('bi.compare.loadError', 'No se pudo cargar la comparación de períodos.')}</p>
            <p className="text-[10px] font-black text-on-surface-deep uppercase tracking-widest mt-2">{t('bi.common.checkConnection', 'Verifique la conexión e intente nuevamente')}</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            <CompareKPICard
              title={t('bi.sales.kpi.totalSales', 'Ventas Totales')}
              value={formatCurrency(compareData.period_1?.total_sales)}
              prevValue={formatCurrency(compareData.period_2?.total_sales)}
              diff={compareData.differences?.sales_change_pct}
              absDiff={formatCurrency(compareData.differences?.sales_change)}
            />
            <CompareKPICard
              title={t('bi.sales.kpi.transactions', 'Transacciones')}
              value={compareData.period_1?.total_transactions ?? 0}
              prevValue={compareData.period_2?.total_transactions ?? 0}
              diff={compareData.differences?.transactions_change_pct}
              absDiff={compareData.differences?.transactions_change ?? 0}
            />
            <CompareKPICard
              title={t('bi.insights.col.unitsSold', 'Unidades Vendidas')}
              value={compareData.period_1?.total_units ?? 0}
              prevValue={compareData.period_2?.total_units ?? 0}
              diff={compareData.differences?.units_change_pct}
              absDiff={compareData.differences?.units_change ?? 0}
            />
            <CompareKPICard
              title={t('bi.sales.kpi.avgTicket', 'Ticket Promedio')}
              value={formatCurrency(compareData.period_1?.average_ticket)}
              prevValue={formatCurrency(compareData.period_2?.average_ticket)}
              diff={compareData.differences?.ticket_change_pct}
              absDiff={formatCurrency(compareData.differences?.ticket_change)}
            />
            <CompareKPICard
              title={t('bi.compare.kpi.uniqueCustomers', 'Clientes Únicos')}
              value={compareData.period_1?.unique_customers ?? 0}
              prevValue={compareData.period_2?.unique_customers ?? 0}
              diff={compareData.differences?.customers_change_pct}
              absDiff={compareData.differences?.customers_change ?? 0}
            />
            <CompareKPICard
              title={t('bi.sales.kpi.grossMargin', 'Margen Bruto')}
              value={`${pctOf(compareData.period_1?.gross_margin, compareData.period_1?.total_sales)}`}
              prevValue={`${pctOf(compareData.period_2?.gross_margin, compareData.period_2?.total_sales)}`}
              diff={compareData.differences?.margin_change_pct}
              absDiff={`${marginPp >= 0 ? '+' : ''}${marginPp}pp`}
            />
          </div>
        )}

        {/* Trend Chart Section */}
        <div className='bg-surface p-8 rounded-lg border border-border-subtle shadow-sm'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h3 className='text-lg font-bold uppercase tracking-tight'>{t('bi.compare.chartTitle', 'Tendencia Diaria de Ventas')}</h3>
              <p className='text-sm text-on-surface-deep font-medium font-display'>{t('bi.compare.chartSubtitle', 'Comparativa día a día entre Período A y Período B')}</p>
            </div>
            <div className='flex gap-4'>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-primary'></span>
                <span className='text-[10px] font-black uppercase tracking-widest text-on-surface-deep'>{t('bi.compare.periodA', 'Período A')}</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-on-surface-deep'></span>
                <span className='text-[10px] font-black uppercase tracking-widest text-on-surface-deep'>{t('bi.compare.periodB', 'Período B')}</span>
              </div>
            </div>
          </div>
          <div className='h-[300px] w-full font-mono'>
            {isMounted && (
              <ResponsiveContainer
                width='100%'
                height='100%'
                minWidth={0}
                minHeight={0}
              >
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id='colorA' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#137fec' stopOpacity={0.1} />
                      <stop offset='95%' stopColor='#137fec' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    stroke='#e2e8f0'
                  />
                  <XAxis
                    dataKey='label'
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    formatter={value => [formatCurrency(Number(value)), t('bi.compare.crumb.sales', 'Ventas')]}
                  />
                  <Area
                    type='monotone'
                    dataKey='periodA'
                    name={t('bi.compare.periodA', 'Período A')}
                    stroke='#137fec'
                    strokeWidth={3}
                    fillOpacity={1}
                    fill='url(#colorA)'
                    connectNulls
                  />
                  <Area
                    type='monotone'
                    dataKey='periodB'
                    name={t('bi.compare.periodB', 'Período B')}
                    stroke='#94a3b8'
                    strokeWidth={2}
                    fillOpacity={0}
                    connectNulls
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

interface CompareKPICardProps {
  title: string
  value: string | number
  prevValue: string | number
  diff?: number
  absDiff: string | number
}

const CompareKPICard = ({ title, value, prevValue, diff, absDiff }: CompareKPICardProps) => (
  <div className='bg-surface p-6 rounded-lg border border-border-subtle shadow-sm hover:border-primary transition-all group'>
    <div className='flex justify-between items-start mb-4'>
      <h3 className='text-[11px] font-black text-on-surface-deep uppercase tracking-widest group-hover:text-primary transition-colors leading-none'>
        {title}
      </h3>
      <span
        className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
          (diff || 0) >= 0
            ? 'bg-success/10 text-success'
            : 'bg-error/10 text-error'
        }`}
      >
        {(diff || 0) >= 0 ? '+' : ''}
        {Math.round((diff || 0) * 10) / 10}%
      </span>
    </div>
    <div className='flex items-end justify-between'>
      <div className='space-y-1'>
        <p className='text-2xl font-black text-foreground font-mono leading-none tracking-tight'>
          {value}
        </p>
        <p className='text-[10px] text-on-surface-deep font-bold uppercase tracking-tighter'>
          vs <span className='font-mono'>{prevValue}</span>
        </p>
      </div>
      <p
        className={`text-xs font-black font-mono ${(diff || 0) >= 0 ? 'text-success' : 'text-error'}`}
      >
        {formatAbsDiff(absDiff, (diff || 0) >= 0)}
      </p>
    </div>
  </div>
)

/** El delta de margen viaja ya firmado ('+5pp'/'-3.2pp') — no duplicar el '+'.
 * (El test de FASE 5 cazó el doble signo que se renderizaba: "++5pp"). */
const formatAbsDiff = (absDiff: string | number, positive: boolean): string => {
  if (typeof absDiff === 'string' && /^[+-]/.test(absDiff)) return absDiff
  return `${positive ? '+' : ''}${absDiff}`
}

export default PeriodComparison
