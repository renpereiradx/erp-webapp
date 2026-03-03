import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  Calendar as CalendarIcon, 
  Globe, 
  ChevronDown,
  RefreshCw,
  Search,
  Home
} from 'lucide-react'

// Sub-componentes
import AgingOverviewCards from '@/features/receivables/components/AgingOverviewCards'
import AgingSummaryChart from '@/features/receivables/components/AgingSummaryChart'
import AgingByClientTable from '@/features/receivables/components/AgingByClientTable'
import BillingVsCollectionChart from '@/features/receivables/components/BillingVsCollectionChart'

import { useAgingReport } from '@/features/receivables/hooks/useAgingReport'

/**
 * Reporte de Antigüedad y Estadísticas de Cobranza.
 * Estilo 100% fiel al diseño de Stitch (Fluent 2).
 */
const AgingReport = () => {
  const { data, loading, error } = useAgingReport('month')

  if (loading && !data) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <RefreshCw className='animate-spin text-[#137fec]' size={48} strokeWidth={1.5} />
        <p className='text-lg font-medium text-slate-500'>Cargando Reporte Analítico...</p>
      </div>
    )
  }

  return (
    <div className='flex flex-1 justify-center py-6 px-4 lg:px-8 bg-slate-50/50 dark:bg-background-dark min-h-screen font-display'>
      <div className="flex flex-col max-w-[1200px] flex-1 w-full gap-6">
        
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#617589]">
            <a className="hover:text-[#137fec] transition-colors flex items-center gap-1" href="#"><Home size={14} /> Inicio</a>
            <span>/</span>
            <a className="hover:text-[#137fec] transition-colors" href="#">Finanzas</a>
            <span>/</span>
            <span className="text-[#111418] dark:text-white font-medium tracking-tight">Reporte de Antigüedad</span>
          </div>
          
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-[#111418] dark:text-white text-3xl font-black leading-tight tracking-tight uppercase">
                Reporte de Antigüedad y Estadísticas
              </h1>
              <p className="text-[#617589] dark:text-gray-400 text-base font-medium">
                Análisis detallado de cuentas por cobrar y rendimiento de cobranza.
              </p>
            </div>

            {/* Global Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-[#3e4a56] rounded-lg text-sm font-bold text-[#111418] dark:text-white hover:bg-[#f8f9fa] dark:hover:bg-[#25303d] transition-colors shadow-sm">
                <CalendarIcon size={18} className="text-[#617589]" />
                <span>Oct 1, 2023 - Oct 31, 2023</span>
                <ChevronDown size={18} className="text-[#617589]" />
              </button>
              
              <button className="flex items-center gap-2 h-10 px-4 bg-white dark:bg-[#1a2632] border border-[#dbe0e6] dark:border-[#3e4a56] rounded-lg text-sm font-bold text-[#111418] dark:text-white hover:bg-[#f8f9fa] dark:hover:bg-[#25303d] transition-colors shadow-sm">
                <Globe size={18} className="text-[#617589]" />
                <span>Entidad Global</span>
                <ChevronDown size={18} className="text-[#617589]" />
              </button>

              <Button className="h-10 px-5 bg-[#137fec] hover:bg-[#137fec]/90 text-white text-sm font-black rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2">
                <Download size={18} />
                <span>Exportar Reporte</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-700">
          <AgingOverviewCards stats={data?.statistics?.summary} />
          
          <AgingSummaryChart agingData={data?.summary} />

          <div className="flex flex-col xl:flex-row gap-6">
            <AgingByClientTable clientsData={data?.detailed?.by_client} />
            <BillingVsCollectionChart trendData={data?.statistics?.collection_trend} />
          </div>
        </div>
        
      </div>
    </div>
  )
}

export default AgingReport
