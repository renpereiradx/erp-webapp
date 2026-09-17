import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Download,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import salesAnalyticsService from '@/services/bi/salesAnalyticsService'

/** KPIs de GET /sales-analytics/dashboard. */
interface SalesKPIs {
  total_sales?: number
  sales_growth_pct?: number
  total_transactions?: number
  transactions_growth_pct?: number
  average_ticket?: number
  ticket_growth_pct?: number
  gross_margin_pct?: number
  margin_growth_pct?: number
  [key: string]: number | undefined
}

interface SalesTrendPoint {
  label?: string
  sales?: number
}

interface SalesAlert {
  type?: string
  message?: string
}

interface TopProduct {
  product_name?: string
  units_sold?: number
  sales?: number
}

interface PaymentMixItem {
  display_name?: string
  percentage?: number
}

interface SalesDashboardData {
  kpis?: SalesKPIs
  trends?: SalesTrendPoint[]
  alerts?: SalesAlert[]
  top_products?: TopProduct[]
  payment_mix?: PaymentMixItem[]
}

// Map for UI labels
const labelMap: Record<string, string> = {
  'today': 'hoy',
  'week': 'semana',
  'month': 'mes',
  'year': 'año'
}

const Dashboard = () => {
  const [data, setData] = useState<SalesDashboardData | null>(null)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await salesAnalyticsService.getDashboard({ period })
        if (response && response.success) {
          setData(response.data)
        } else {
          throw new Error('Respuesta de API inválida')
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Error al cargar datos')
        // El fallback ya está en el estado inicial o se mantiene el anterior
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  const kpis: SalesKPIs = useMemo(() => data?.kpis || {}, [data])
  const trends: SalesTrendPoint[] = useMemo(() => data?.trends || [], [data])
  const alerts: SalesAlert[] = useMemo(() => data?.alerts || [], [data])
  const topProducts: TopProduct[] = useMemo(() => data?.top_products || [], [data])
  const paymentMix: PaymentMixItem[] = useMemo(() => data?.payment_mix || [], [data])

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      maximumFractionDigits: 0,
    }).format(value || 0)
  }

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-start justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-foreground text-3xl font-black tracking-tight uppercase'>
            Dashboard de Ventas
          </h1>
          <p className='text-on-surface-deep text-sm font-medium'>
            Resumen ejecutivo del rendimiento comercial y financiero
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex h-10 items-center rounded-lg bg-surface-muted p-1 font-mono shadow-sm'>
            {Object.entries(labelMap).map(([apiVal, label]) => (
              <button
                key={apiVal}
                onClick={() => setPeriod(apiVal)}
                className={`flex cursor-pointer h-full items-center justify-center rounded-lg px-4 text-xs font-bold uppercase tracking-wider transition-all ${
                  period === apiVal
                    ? 'bg-surface shadow-sm text-primary'
                    : 'text-on-surface-deep hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button className='flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-on-primary text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all uppercase tracking-wider'>
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Error (estado honesto: la API falló y no hay datos previos) */}
      {error && !loading && (
        <div className='rounded-lg border border-error/20 bg-error/5 p-4 text-sm font-bold text-error'>
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <KPICard
          title='Ventas Totales'
          value={formatCurrency(kpis.total_sales)}
          growth={kpis.sales_growth_pct}
        />
        <KPICard
          title='Transacciones'
          value={kpis.total_transactions ?? 0}
          growth={kpis.transactions_growth_pct}
        />
        <KPICard
          title='Ticket Promedio'
          value={formatCurrency(kpis.average_ticket)}
          growth={kpis.ticket_growth_pct}
        />
        <KPICard
          title='Margen Bruto'
          value={`${Math.round((kpis.gross_margin_pct || 0) * 10) / 10}%`}
          growth={kpis.margin_growth_pct}
        />
      </div>

      {/* Charts & Alerts Row */}
      <div className='grid grid-cols-1 lg:grid-cols-10 gap-6'>
        <div className='lg:col-span-6 flex flex-col gap-4 rounded-lg p-6 bg-surface border border-border-subtle shadow-sm'>
          <div className='flex justify-between items-center mb-2'>
            <h3 className='text-foreground text-lg font-bold uppercase tracking-tight'>
              Tendencia de Ventas
            </h3>
            <button className='text-on-surface-deep hover:text-primary transition-colors'>
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className='h-[280px] w-full font-mono relative'>
            {loading && (
              <div className='absolute inset-0 flex items-center justify-center bg-surface/50 z-10 rounded-lg'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
              </div>
            )}

            {!loading && isClient && trends && trends.length > 0 && (
              <ResponsiveContainer
                width='100%'
                height='100%'
                minWidth={0}
                minHeight={0}
              >
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id='colorSales' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#137fec' stopOpacity={0.2} />
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
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
                    fill='url(#colorSales)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className='lg:col-span-4 flex flex-col gap-4 rounded-lg p-6 bg-surface border border-border-subtle shadow-sm'>
          <h3 className='text-foreground text-lg font-bold mb-2 uppercase tracking-tight'>
            Alertas del Sistema
          </h3>
          <div className='flex flex-col gap-3'>
            {alerts.map((alert, idx) => (
              <AlertItem key={idx} alert={alert} />
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Payment Mix Row */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='flex flex-col gap-4 rounded-lg p-6 bg-surface border border-border-subtle shadow-sm overflow-hidden'>
          <h3 className='text-foreground text-lg font-bold uppercase tracking-tight'>
            Top Productos
          </h3>
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='border-b border-border-subtle'>
                  <th className='py-3 text-on-surface-deep text-[10px] font-black uppercase tracking-wider'>
                    Producto
                  </th>
                  <th className='py-3 text-on-surface-deep text-[10px] font-black uppercase tracking-wider text-right'>
                    Unidades
                  </th>
                  <th className='py-3 text-on-surface-deep text-[10px] font-black uppercase tracking-wider text-right'>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border-subtle'>
                {topProducts.map((product, idx) => (
                  <tr
                    key={idx}
                    className='hover:bg-surface-muted transition-colors'
                  >
                    <td className='py-4 text-sm font-bold text-foreground'>
                      {product.product_name}
                    </td>
                    <td className='py-4 text-sm text-on-surface-deep text-right font-mono font-bold'>
                      {product.units_sold}
                    </td>
                    <td className='py-4 text-sm font-black text-primary text-right font-mono'>
                      {formatCurrency(product.sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className='flex flex-col gap-4 rounded-lg p-6 bg-surface border border-border-subtle shadow-sm'>
          <h3 className='text-foreground text-lg font-bold uppercase tracking-tight'>
            Métodos de Pago
          </h3>
          <div className='flex flex-col gap-6 py-4'>
            {paymentMix.map((method, idx) => (
              <div key={idx} className='flex flex-col gap-2'>
                <div className='flex justify-between text-sm'>
                  <span className='font-bold text-foreground uppercase tracking-tighter text-xs'>
                    {method.display_name}
                  </span>
                  <span className='font-black text-foreground font-mono'>
                    {method.percentage}%
                  </span>
                </div>
                <div className='h-3 w-full bg-surface-muted rounded-full overflow-hidden shadow-inner'>
                  <div
                    className='h-full bg-primary rounded-full transition-all duration-1000 ease-out'
                    style={{
                      width: `${method.percentage}%`,
                      opacity: 1 - idx * 0.15,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className='mt-auto pt-4 border-t border-border-subtle flex justify-between items-center text-[10px] text-on-surface-deep font-bold uppercase tracking-widest'>
            <span>* Actualizado en tiempo real</span>
            <button className='text-primary hover:underline'>
              Ver Detalles
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string | number
  growth?: number
}

const KPICard = ({ title, value, growth }: KPICardProps) => (
  <div className='flex flex-col gap-2 rounded-lg p-6 bg-surface border border-border-subtle shadow-sm hover:shadow-md transition-all group'>
    <p className='text-on-surface-deep text-[11px] font-black uppercase tracking-widest group-hover:text-primary transition-colors'>
      {title}
    </p>
    <div className='flex items-end justify-between'>
      <p className='text-foreground text-2xl font-black tracking-tight font-mono leading-none'>
        {value}
      </p>
      <span
        className={`flex items-center text-[11px] font-black px-2 py-0.5 rounded font-mono ${
          (growth || 0) >= 0
            ? 'text-success bg-success/10'
            : 'text-error bg-error/10'
        }`}
      >
        {(growth || 0) >= 0 ? (
          <TrendingUp size={12} className='mr-1' />
        ) : (
          <TrendingDown size={12} className='mr-1' />
        )}
        {(growth || 0) >= 0 ? '+' : ''}
        {growth}%
      </span>
    </div>
  </div>
)

interface AlertItemProps {
  alert: SalesAlert
}

const AlertItem = ({ alert }: AlertItemProps) => {
  const getStyles = () => {
    switch (alert.type) {
      case 'POSITIVE':
        return {
          bg: 'bg-success/5',
          border: 'border-success/20',
          icon: (
            <CheckCircle
              className='text-success'
              size={20}
            />
          ),
        }
      case 'WARNING':
        return {
          bg: 'bg-warning/5',
          border: 'border-warning/20',
          icon: (
            <AlertTriangle
              className='text-warning'
              size={20}
            />
          ),
        }
      case 'NEGATIVE':
        return {
          bg: 'bg-error/5',
          border: 'border-error/20',
          icon: (
            <AlertCircle
              className='text-error'
              size={20}
            />
          ),
        }
      default:
        return {
          bg: 'bg-primary/5',
          border: 'border-primary/10',
          icon: <CheckCircle className='text-primary' size={20} />,
        }
    }
  }

  const styles = getStyles()

  return (
    <div
      className={`flex gap-4 p-4 rounded-lg border shadow-sm transition-all hover:translate-x-1 ${styles.bg} ${styles.border}`}
    >
      <div className='shrink-0'>{styles.icon}</div>
      <div className='flex flex-col'>
        <p className='text-foreground text-sm font-bold leading-tight font-mono'>
          {alert.message}
        </p>
        <p className='text-on-surface-deep text-[10px] font-black uppercase tracking-wider mt-1'>
          Hacer clic para ver detalles
        </p>
      </div>
    </div>
  )
}

export default Dashboard
