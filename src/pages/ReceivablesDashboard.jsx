import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { 
  RefreshCw, 
  Calendar, 
  Globe, 
  CircleDollarSign,
  ChevronDown
} from 'lucide-react'

// Hooks
import { useReceivablesDashboard } from '@/features/receivables/hooks/useReceivablesDashboard'

// Sub-componentes
import SummaryCardsGrid from '@/features/receivables/components/SummaryCardsGrid'
import AgingSummaryChart from '@/features/receivables/components/AgingSummaryChart'
import RecentInvoicesTable from '@/features/receivables/components/RecentInvoicesTable'

/**
 * Accounts Receivable Overview Dashboard
 * Refactorizado al 100% en español siguiendo el diseño de Stitch.
 */
const ReceivablesDashboard = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { summary, aging, recentInvoices, loading, error, refresh } =
    useReceivablesDashboard()

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <RefreshCw className='animate-spin text-primary' size={48} />
        <p className='text-lg font-medium text-text-secondary-light'>Cargando tablero...</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Título de Página y Botón de Actualizar */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tight uppercase">
            {t('receivables.master.title')}
          </h1>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-medium">Resumen general de cartera y cobranzas</p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} className="gap-2 rounded-lg">
          <RefreshCw className="size-4" />
          Actualizar
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex h-8 items-center gap-2 rounded-lg bg-white dark:bg-surface-dark px-3 py-1.5 text-sm font-medium text-text-primary-light dark:text-text-primary-dark shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
            <Calendar className="size-4 text-text-secondary-light" />
            <span>Periodo: Últimos 30 Días</span>
            <ChevronDown className="size-4 text-text-secondary-light" />
          </button>
          <button className="flex h-8 items-center gap-2 rounded-lg bg-white dark:bg-surface-dark px-3 py-1.5 text-sm font-medium text-text-primary-light dark:text-text-primary-dark shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
            <Globe className="size-4 text-text-secondary-light" />
            <span>Entidad: Todas las Regiones</span>
            <ChevronDown className="size-4 text-text-secondary-light" />
          </button>
          <button className="flex h-8 items-center gap-2 rounded-lg bg-white dark:bg-surface-dark px-3 py-1.5 text-sm font-medium text-text-primary-light dark:text-text-primary-dark shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
            <CircleDollarSign className="size-4 text-text-secondary-light" />
            <span>Moneda: Guaraníes (PYG)</span>
            <ChevronDown className="size-4 text-text-secondary-light" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
          <RefreshCw className="size-4" />
          <p className="text-xs font-medium">Generado el: {new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
      </div>

      {/* KPIs */}
      <SummaryCardsGrid summary={summary} />

      {/* Sección de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white dark:bg-surface-dark p-6 shadow-card border border-gray-100 dark:border-gray-800 h-full overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Tendencia de Cobranza</h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Rendimiento de los últimos 6 meses</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Gs.&nbsp;4200&nbsp;M</p>
                <p className="text-xs font-medium text-semantic-success">Total Cobrado</p>
              </div>
            </div>
            
            <div className="relative h-[300px] w-full mt-4">
              <div className="absolute inset-0 flex flex-col justify-between text-xs text-text-secondary-light dark:text-text-secondary-dark opacity-50">
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">1000k</div>
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">750k</div>
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">500k</div>
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">250k</div>
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">0</div>
              </div>
              <svg className="absolute inset-0 h-full w-full pt-6 pb-6 pr-4" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#137fec" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,80 Q10,75 20,60 T40,55 T60,30 T80,35 T100,10 V100 H0 Z" fill="url(#chartGradient)" />
                <path d="M0,80 Q10,75 20,60 T40,55 T60,30 T80,35 T100,10" fill="none" stroke="#137fec" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <circle cx="0" cy="80" fill="#ffffff" r="3" stroke="#137fec" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <circle cx="20" cy="60" fill="#ffffff" r="3" stroke="#137fec" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <circle cx="40" cy="55" fill="#ffffff" r="3" stroke="#137fec" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <circle cx="60" cy="30" fill="#ffffff" r="3" stroke="#137fec" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <circle cx="80" cy="35" fill="#ffffff" r="3" stroke="#137fec" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <circle cx="100" cy="10" fill="#ffffff" r="3" stroke="#137fec" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="flex justify-between px-2 mt-2 text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">
              <span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <AgingSummaryChart agingData={aging} />
        </div>
      </div>

      {/* Facturas Recientes */}
      <RecentInvoicesTable invoices={recentInvoices} />
    </div>
  )
}

export default ReceivablesDashboard
