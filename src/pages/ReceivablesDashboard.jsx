import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { 
  RefreshCw, 
  Calendar, 
  Globe, 
  CircleDollarSign,
  ChevronDown,
  ChevronRight
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
 * Refactorizado para 100% fidelidad visual y tipografía de precisión.
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
        <p className='text-lg font-medium text-slate-500'>Cargando tablero analítico...</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 pb-12'>
      
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          <button onClick={() => navigate('/dashboard')} className="hover:text-primary transition-colors flex items-center gap-1">
            Inicio
          </button>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <span className="text-slate-600 dark:text-slate-300">Cuentas por Cobrar</span>
        </nav>

        {/* Title & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary shadow-sm border border-primary/20 flex-shrink-0">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate">
                {t('receivables.master.title')}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5 truncate">
                Resumen general de cartera y cobranzas
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mr-2">
              <button className="px-4 py-1.5 rounded-lg text-[10px] font-black bg-white dark:bg-slate-700 shadow-sm text-primary border border-slate-200 dark:border-slate-600 uppercase tracking-widest">
                Últimos 30 Días
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} className="gap-2 rounded-xl text-xs font-bold uppercase tracking-widest h-9">
              <RefreshCw className="size-3.5" />
              {t('action.refresh', 'Actualizar')}
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <SummaryCardsGrid summary={summary} />

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white dark:bg-[#1b2633] p-6 shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] border border-[#edebe9] dark:border-[#2d3d4f] h-full overflow-hidden transition-all hover:shadow-md">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Tendencia de Cobranza</h3>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Rendimiento de las últimas semanas</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  Gs.&nbsp;{(summary.collectionTrend?.reduce((acc, curr) => acc + curr.collected, 0) / 1000000).toFixed(0)}&nbsp;M
                </p>
                <p className="text-[10px] font-black text-semantic-success uppercase tracking-widest mt-1">Total Cobrado (Periodo)</p>
              </div>
            </div>
            
            <div className="relative h-[280px] w-full mt-4">
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] font-bold text-slate-400 opacity-50 px-1">
                <div className="w-full border-b border-slate-100 dark:border-slate-800 pb-1">200M</div>
                <div className="w-full border-b border-slate-100 dark:border-slate-800 pb-1">150M</div>
                <div className="w-full border-b border-slate-100 dark:border-slate-800 pb-1">100M</div>
                <div className="w-full border-b border-slate-100 dark:border-slate-800 pb-1">50M</div>
                <div className="w-full border-b border-slate-300 dark:border-slate-600 pb-1 font-black">0</div>
              </div>
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
                  fill="none" stroke="#137fec" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" 
                />
              </svg>
            </div>
            <div className="flex justify-between px-2 mt-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {summary.collectionTrend?.map((item, idx) => (
                <span key={idx} className={idx === summary.collectionTrend.length - 1 ? 'text-primary' : ''}>{item.date}</span>
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
