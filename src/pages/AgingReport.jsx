import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { Download, Printer, Filter, RefreshCw, Clock } from 'lucide-react'
import DashboardNav from '@/components/business-intelligence/DashboardNav'

// Sub-componentes Receivables
import AgingOverviewCards from '@/features/receivables/components/AgingOverviewCards'
import AgingSummaryChart from '@/features/receivables/components/AgingSummaryChart'
import AgingByClientTable from '@/features/receivables/components/AgingByClientTable'
import AgingTrendChart from '@/features/receivables/components/AgingTrendChart'

// Hooks
import { useAgingReport } from '@/features/receivables/hooks/useAgingReport'

/**
 * Aging Report Page - Receivables Optimized
 */
const AgingReport = () => {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [period, setPeriod] = useState('month')
  const { data, loading, error } = useAgingReport(period)

  if (loading && !data) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <RefreshCw className='animate-spin text-primary' size={48} />
        <p className='text-lg font-medium text-text-secondary'>Generando Reporte Analítico...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="p-4 bg-red-100 rounded-full text-error mb-4">
          <Clock size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-text-main">Error al generar reporte</h2>
        <p className="text-text-secondary mb-6 max-w-md">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <header className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div className="flex items-center gap-6">
            <div className="size-14 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Clock size={32} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h1 className='text-3xl font-black text-text-main tracking-tight uppercase'>
                Reporte de Antigüedad
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">
                <span>Corte al:</span>
                <strong className="text-text-main opacity-100">Hoy, {new Date().toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <Button variant="secondary" size="md" className="shadow-sm border-border-subtle bg-surface font-black uppercase tracking-widest text-[11px]">
              <Filter size={18} className="mr-2" />
              <span>Filtrar</span>
            </Button>
            <Button variant="secondary" size="md" className="shadow-sm border-border-subtle bg-surface font-black uppercase tracking-widest text-[11px]">
              <Printer size={18} className="mr-2" />
              <span>Imprimir</span>
            </Button>
            <Button variant='primary' size='md' className="shadow-md font-black uppercase tracking-widest text-[11px]">
              <Download size={18} className="mr-2" />
              <span>Exportar Reporte</span>
            </Button>
          </div>
        </header>

        <DashboardNav />

        {/* Main Content Area */}
        <div className="space-y-8">
          <AgingOverviewCards stats={data.statistics?.summary || {}} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AgingSummaryChart agingData={data.summary || {}} />
            <AgingTrendChart trendData={data.statistics?.trends || []} />
          </div>

          <div className="pb-10">
            <AgingByClientTable clientsData={data.detailed || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgingReport
