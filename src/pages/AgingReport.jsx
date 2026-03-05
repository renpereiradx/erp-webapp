import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Download, 
  Calendar as CalendarIcon, 
  Globe, 
  ChevronDown,
  RefreshCw,
  Home,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { useI18n } from '@/lib/i18n'
import ToastContainer from '@/components/ui/ToastContainer'

// Sub-componentes
import AgingOverviewCards from '@/features/receivables/components/AgingOverviewCards'
import AgingSummaryChart from '@/features/receivables/components/AgingSummaryChart'
import AgingByClientTable from '@/features/receivables/components/AgingByClientTable'
import BillingVsCollectionChart from '@/features/receivables/components/BillingVsCollectionChart'

import { useAgingReport } from '@/features/receivables/hooks/useAgingReport'

/**
 * Reporte de Antigüedad y Estadísticas de Cobranza.
 * Refactorizado para 100% fidelidad visual y consistencia con Payables.
 */
const AgingReport = () => {
  const { t } = useI18n()
  const toast = useToast()
  const { data, loading, error } = useAgingReport('month')

  useEffect(() => {
    document.title = 'Reporte de Antigüedad | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <RefreshCw className='animate-spin text-[#137fec]' size={48} strokeWidth={1.5} />
        <p className='text-lg font-medium text-slate-500'>Cargando reporte de antigüedad...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
              Inicio
            </Link>
            <ChevronRight size={12} className="mx-2 opacity-30" />
            <Link to="/receivables" className="hover:text-primary transition-colors">
              Cuentas por Cobrar
            </Link>
            <ChevronRight size={12} className="mx-2 opacity-30" />
            <span className="text-slate-600 dark:text-slate-300">Reporte de Antigüedad</span>
          </nav>

          {/* Title & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary shadow-sm border border-primary/20 flex-shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate flex items-center gap-3">
                  Reporte de Antigüedad y Estadísticas
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5 truncate">
                  Análisis estratégico de cartera y recuperación
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                disabled
                className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed opacity-50"
              >
                <CalendarIcon size={16} className="mr-2" />
                <span>Oct 2023</span>
              </button>
              <button 
                onClick={() => toast.info(t('common.not_implemented'))}
                className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md shadow-primary/20 active:scale-95"
              >
                <Download size={16} className="mr-2" />
                Exportar Reporte
              </button>
            </div>
          </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="flex flex-col gap-6">
          <AgingOverviewCards stats={data?.statistics} />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <AgingSummaryChart agingData={data?.summary} />
            </div>
            <div className="lg:col-span-8">
              <BillingVsCollectionChart trendData={data?.statistics?.collection_trend} />
            </div>
          </div>

          <AgingByClientTable clientsData={data?.detailed?.by_client} />
        </div>

        <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  )
}

export default AgingReport
