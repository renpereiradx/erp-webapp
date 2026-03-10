import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Activity,
  ChevronRight,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart2,
} from 'lucide-react'
import salesAnalyticsService from '@/services/salesAnalyticsService'
import { MOCK_COMPARE } from '@/services/mocks/salesAnalyticsMock'

const PeriodComparison = () => {
  const [compareData, setCompareData] = useState(MOCK_COMPARE.data)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [periodA, setPeriodA] = useState('Mes Actual')
  const [periodB, setPeriodB] = useState('Mes Anterior')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [compRes, trendsA, trendsB] = await Promise.all([
          salesAnalyticsService.comparePeriods({ period: 'month' }),
          salesAnalyticsService.getTrends({
            period: 'month',
            granularity: 'daily',
          }), // Simplifying for demo
          salesAnalyticsService.getTrends({
            period: 'year',
            granularity: 'monthly',
          }), // Different period for visual diff
        ])

        if (compRes && compRes.success) setCompareData(compRes.data)

        // Merge trends for comparison chart
        const pointsA = trendsA?.success ? trendsA.data.data_points : []
        const pointsB = trendsB?.success ? trendsB.data.data_points : []
        const merged = pointsA.map((p, i) => ({
          label: p.label,
          periodA: p.sales,
          periodB: pointsB[i]?.sales || 0,
        }))
        setChartData(merged)
      } catch (error) {
        console.error('Error fetching comparison data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = value => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      {/* Header */}
      <header className='flex flex-col gap-1'>
        <div className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400'>
          <span>Ventas</span>
          <ChevronRight size={10} />
          <span className='text-[#137fec]'>Comparativa de Períodos</span>
        </div>
        <h2 className='text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight'>
          Comparativa de Períodos
        </h2>
        <p className='text-sm text-slate-500 font-medium'>
          Análisis detallado de rendimiento entre dos rangos de fechas
          seleccionados.
        </p>
      </header>

      {/* Selection Bar */}
      <section className='bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 shadow-sm'>
        <div className='flex flex-wrap items-end gap-6 max-w-6xl'>
          <div className='flex-1 min-w-[280px]'>
            <label className='block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2'>
              Período A (Actual)
            </label>
            <select
              value={periodA}
              onChange={e => setPeriodA(e.target.value)}
              className='w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-bold focus:ring-[#137fec] focus:border-[#137fec] py-2.5'
            >
              <option>Mes Actual (Mayo 2024)</option>
              <option>Semana Actual</option>
              <option>Personalizado</option>
            </select>
          </div>
          <div className='flex-1 min-w-[280px]'>
            <label className='block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2'>
              Período B (Comparativo)
            </label>
            <select
              value={periodB}
              onChange={e => setPeriodB(e.target.value)}
              className='w-full rounded-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-bold focus:ring-[#137fec] focus:border-[#137fec] py-2.5'
            >
              <option>Mes Anterior (Abril 2024)</option>
              <option>Mismo mes año anterior</option>
              <option>Personalizado</option>
            </select>
          </div>
          <button className='bg-[#137fec] hover:bg-[#137fec]/90 text-white font-black py-2.5 px-8 rounded-lg transition-all flex items-center gap-2 shadow-md shadow-[#137fec]/20 uppercase text-xs tracking-widest'>
            <Activity size={18} />
            Comparar
          </button>
        </div>
      </section>

      {/* Grid Metrics */}
      <div className='flex-1 overflow-y-auto p-4 space-y-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          <CompareKPICard
            title='Ventas Totales'
            value={formatCurrency(compareData.period_1.total_sales)}
            prevValue={formatCurrency(compareData.period_2.total_sales)}
            diff={compareData.differences.sales_change_pct}
            absDiff={formatCurrency(compareData.differences.sales_change)}
          />
          <CompareKPICard
            title='Transacciones'
            value={compareData.period_1.total_transactions}
            prevValue={compareData.period_2.total_transactions}
            diff={compareData.differences.transactions_change_pct}
            absDiff={compareData.differences.transactions_change}
          />
          <CompareKPICard
            title='Unidades Vendidas'
            value={compareData.period_1.total_units}
            prevValue={compareData.period_2.total_units}
            diff={compareData.differences.units_change_pct}
            absDiff={compareData.differences.units_change}
          />
          <CompareKPICard
            title='Ticket Promedio'
            value={formatCurrency(compareData.period_1.average_ticket)}
            prevValue={formatCurrency(compareData.period_2.average_ticket)}
            diff={compareData.differences.ticket_change_pct}
            absDiff={formatCurrency(compareData.differences.ticket_change)}
          />
          <CompareKPICard
            title='Clientes Únicos'
            value={compareData.period_1.unique_customers}
            prevValue={compareData.period_2.unique_customers}
            diff={compareData.differences.customers_change_pct}
            absDiff={compareData.differences.customers_change}
          />
          <CompareKPICard
            title='Margen Bruto'
            value={`${((compareData.period_1.gross_margin / compareData.period_1.total_sales) * 100).toFixed(1)}%`}
            prevValue={`${((compareData.period_2.gross_margin / compareData.period_2.total_sales) * 100).toFixed(1)}%`}
            diff={compareData.differences.margin_change_pct}
            absDiff='0.8pp'
          />
        </div>

        {/* Trend Chart Section */}
        <div className='bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm'>
          <div className='flex justify-between items-center mb-8'>
            <div>
              <h3 className='text-lg font-bold uppercase tracking-tight'>
                Tendencia Diaria de Ventas
              </h3>
              <p className='text-sm text-slate-500 font-medium font-display'>
                Comparativa día a día entre Período A y Período B
              </p>
            </div>
            <div className='flex gap-4'>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-[#137fec]'></span>
                <span className='text-[10px] font-black uppercase tracking-widest text-slate-500'>
                  Período A
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='w-3 h-3 rounded-full bg-slate-400'></span>
                <span className='text-[10px] font-black uppercase tracking-widest text-slate-500'>
                  Período B
                </span>
              </div>
            </div>
          </div>
          <div className='h-[300px] w-full font-mono'>
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
                  formatter={value => [formatCurrency(value), 'Ventas']}
                />
                <Area
                  type='monotone'
                  dataKey='periodA'
                  stroke='#137fec'
                  strokeWidth={3}
                  fillOpacity={1}
                  fill='url(#colorA)'
                />
                <Area
                  type='monotone'
                  dataKey='periodB'
                  stroke='#94a3b8'
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

const CompareKPICard = ({ title, value, prevValue, diff, absDiff }) => (
  <div className='bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:border-[#137fec] transition-all group'>
    <div className='flex justify-between items-start mb-4'>
      <h3 className='text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-[#137fec] transition-colors leading-none'>
        {title}
      </h3>
      <span
        className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
          diff >= 0
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
            : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
        }`}
      >
        {diff >= 0 ? '+' : ''}
        {diff}%
      </span>
    </div>
    <div className='flex items-end justify-between'>
      <div className='space-y-1'>
        <p className='text-2xl font-black text-slate-900 dark:text-white font-mono leading-none tracking-tight'>
          {value}
        </p>
        <p className='text-[10px] text-slate-400 font-bold uppercase tracking-tighter'>
          vs <span className='font-mono'>{prevValue}</span>
        </p>
      </div>
      <p
        className={`text-xs font-black font-mono ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
      >
        {diff >= 0 ? '+' : ''}
        {absDiff}
      </p>
    </div>
  </div>
)

export default PeriodComparison
