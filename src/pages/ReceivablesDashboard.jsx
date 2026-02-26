import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { Download, RefreshCw, Calendar, Globe, CircleDollarSign } from 'lucide-react'

// Hooks
import { useReceivablesDashboard } from '@/features/receivables/hooks/useReceivablesDashboard'

// Sub-componentes
import SummaryCardsGrid from '@/features/receivables/components/SummaryCardsGrid'
import AgingSummaryChart from '@/features/receivables/components/AgingSummaryChart'
import RecentInvoicesTable from '@/features/receivables/components/RecentInvoicesTable'
import DashboardNav from '@/components/business-intelligence/DashboardNav'

/**
 * Accounts Receivable Overview Dashboard
 * Vista centralizada con KPIs ejecutivos, tendencias y resumen visual de aging.
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
        <p className='text-lg font-medium text-text-secondary'>{t('receivables.loading.generic')}</p>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <header className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-black text-text-main tracking-tight uppercase'>
            {t('receivables.master.title')} Overview
          </h1>
          <p className='text-sm text-text-secondary font-medium'>
            Finanzas y Contabilidad
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Button variant='primary' size='md' className="shadow-md">
            <Download size={18} className="mr-2" />
            <span>{t('receivables.profile.actions.export')}</span>
          </Button>
          <Button variant='secondary' size='md' className="shadow-sm border-border-subtle bg-surface" onClick={refresh}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('common.refresh', 'Actualizar')}</span>
          </Button>
        </div>
      </header>

      <DashboardNav />

      {/* Barra de Filtros */}
      <div className='bg-surface p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col md:flex-row items-center justify-between gap-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <button className='flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-border-subtle text-xs font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors'>
            <Calendar size={16} />
            <span>Periodo: Últimos 30 Días</span>
            <span className='material-symbols-outlined text-[18px]'>expand_more</span>
          </button>
          <button className='flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-border-subtle text-xs font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors'>
            <Globe size={16} />
            <span>Entidad: Todas las Regiones</span>
            <span className='material-symbols-outlined text-[18px]'>expand_more</span>
          </button>
          <button className='flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border border-border-subtle text-xs font-black uppercase tracking-widest text-text-secondary hover:text-primary transition-colors'>
            <CircleDollarSign size={16} />
            <span>Moneda: PYG</span>
            <span className='material-symbols-outlined text-[18px]'>expand_more</span>
          </button>
        </div>
        <div className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60'>
          <RefreshCw size={14} />
          <p>Generado el: {new Date().toLocaleString('es-ES')}</p>
        </div>
      </div>

      {/* KPIs */}
      <SummaryCardsGrid summary={summary} />

      {/* Gráfico de Aging */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <AgingSummaryChart agingData={aging} />
        <div className="bg-surface rounded-xl border border-border-subtle shadow-fluent-2 p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="size-16 rounded-full bg-blue-50 flex items-center justify-center text-primary">
            <RefreshCw size={32} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 leading-relaxed">
            Visualización de tendencias adicionales en desarrollo
          </p>
        </div>
      </div>

      {/* Facturas Recientes */}
      <section className='space-y-6 pb-10'>
        <header className='flex items-center justify-between'>
          <h3 className='text-lg font-black text-text-main uppercase tracking-tight'>Facturas Recientes</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary font-black uppercase tracking-widest text-[11px] hover:bg-blue-50"
            onClick={() => navigate('/receivables/list')}
          >
            Ver Todas
          </Button>
        </header>
        <RecentInvoicesTable invoices={recentInvoices} />
      </section>
    </div>
  )
}

export default ReceivablesDashboard
