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
import { useToast } from '@/hooks/useToast'
import ToastContainer from '@/components/ui/ToastContainer'

/**
 * Accounts Receivable Overview Dashboard
 * Refactorizado al 100% en español siguiendo el diseño de Stitch.
 */
const ReceivablesDashboard = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const toast = useToast()
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
          {t('action.refresh', 'Actualizar')}
        </Button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            disabled 
            onClick={() => toast.info(t('common.not_implemented'))}
            className="flex h-8 items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60 border border-gray-100 dark:border-gray-700 cursor-not-allowed opacity-70"
          >
            <Calendar className="size-4" />
            <span>Periodo: Últimos 30 Días</span>
            <ChevronDown className="size-4" />
          </button>
          <button 
            disabled 
            onClick={() => toast.info(t('common.not_implemented'))}
            className="flex h-8 items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60 border border-gray-100 dark:border-gray-700 cursor-not-allowed opacity-70"
          >
            <Globe className="size-4" />
            <span>Entidad: Todas las Regiones</span>
            <ChevronDown className="size-4" />
          </button>
          <button 
            disabled 
            onClick={() => toast.info(t('common.not_implemented'))}
            className="flex h-8 items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm font-medium text-text-secondary-light/60 dark:text-text-secondary-dark/60 border border-gray-100 dark:border-gray-700 cursor-not-allowed opacity-70"
          >
            <CircleDollarSign className="size-4" />
            <span>Moneda: Guaraníes (PYG)</span>
            <ChevronDown className="size-4" />
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
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Rendimiento de las últimas semanas</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  Gs.&nbsp;{(summary.collectionTrend?.reduce((acc, curr) => acc + curr.collected, 0) / 1000000).toFixed(0)}&nbsp;M
                </p>
                <p className="text-xs font-medium text-semantic-success">Total Cobrado (Periodo)</p>
              </div>
            </div>
            
            <div className="relative h-[300px] w-full mt-4">
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-text-secondary-light dark:text-text-secondary-dark opacity-50">
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">200M</div>
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">150M</div>
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">100M</div>
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">50M</div>
                <div className="w-full border-b border-gray-100 dark:border-gray-800 pb-1">0</div>
              </div>
              {/* Gráfico SVG dinámico simplificado */}
              <svg className="absolute inset-0 h-full w-full pt-6 pb-6 pr-4" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#137fec" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d={`M0,${100 - (summary.collectionTrend[0]?.collected / 200000000 * 80 || 20)} 
                     Q15,${100 - (summary.collectionTrend[1]?.collected / 200000000 * 80 || 40)} 33,${100 - (summary.collectionTrend[1]?.collected / 200000000 * 80 || 40)} 
                     T66,${100 - (summary.collectionTrend[2]?.collected / 200000000 * 80 || 60)} 
                     T100,${100 - (summary.collectionTrend[3]?.collected / 200000000 * 80 || 80)} V100 H0 Z`} 
                  fill="url(#chartGradient)" 
                />
                <path 
                  d={`M0,${100 - (summary.collectionTrend[0]?.collected / 200000000 * 80 || 20)} 
                     L33,${100 - (summary.collectionTrend[1]?.collected / 200000000 * 80 || 40)} 
                     L66,${100 - (summary.collectionTrend[2]?.collected / 200000000 * 80 || 60)} 
                     L100,${100 - (summary.collectionTrend[3]?.collected / 200000000 * 80 || 80)}`} 
                  fill="none" stroke="#137fec" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" 
                />
              </svg>
            </div>
            <div className="flex justify-between px-2 mt-2 text-[10px] font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">
              {summary.collectionTrend?.map((item, idx) => (
                <span key={idx}>{item.date}</span>
              )) || <span>Semana 1</span>}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <AgingSummaryChart agingData={aging} />
        </div>
      </div>

      {/* Facturas Recientes */}
      <RecentInvoicesTable invoices={recentInvoices} />

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  )
}

export default ReceivablesDashboard
