import React from 'react';

// Feature components
import AgingHero from '@/features/accounts-payable/components/AgingReport/AgingHero';
import AgingKpiGrid from '@/features/accounts-payable/components/AgingReport/AgingKpiGrid';
import AgingBreakdownTable from '@/features/accounts-payable/components/AgingReport/AgingBreakdownTable';
import AgingTrendAnalysis from '@/features/accounts-payable/components/AgingReport/AgingTrendAnalysis';

// Hooks
import { useAgingReport } from '@/features/accounts-payable/hooks/useAgingReport';

/**
 * Aging Report Page.
 * 100% LITERAL STITCH REPRODUCTION - PIXEL PERFECT
 * Avoids project UI components to prevent style pollution.
 */
const AgingReport = () => {
  const { 
    loading, 
    summary, 
    kpis, 
    providers, 
    totals, 
    searchTerm, 
    setSearchTerm 
  } = useAgingReport();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f8] dark:bg-[#101922]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Generando Reporte Analítico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f6f7f8] dark:bg-[#101922] font-['Inter',_sans-serif] text-slate-900 dark:text-slate-100 min-h-screen selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navigation Bar (Literal Classes) */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-3">
        <div className="max-w-[2560px] margin-0-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-icons-round text-[#137fec] text-3xl">account_balance_wallet</span>
              <h1 className="text-xl font-bold tracking-tight">Reporte de Antigüedad de Deuda</h1>
            </div>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider leading-none">Corte al:</p>
              <p className="text-sm font-medium">{summary.lastUpdate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="material-icons-round text-sm">filter_list</span> Filtrar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="material-icons-round text-sm">file_download</span> Exportar a Excel
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="material-icons-round text-sm">print</span> Imprimir
            </button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2"></div>
            <button className="bg-[#137fec] hover:opacity-90 text-white px-5 py-2 rounded text-sm font-semibold transition-all shadow-sm">
              Nuevo Pago
            </button>
          </div>
        </div>
      </nav>

      <main className="p-8 space-y-8 max-w-[2560px] mx-auto animate-in fade-in">
        <AgingHero summary={summary} />
        <AgingKpiGrid kpis={kpis} />
        <AgingBreakdownTable 
          providers={providers} 
          totals={totals} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />
        <AgingTrendAnalysis trendData={summary} />
      </main>

      {/* Global Floating Help */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
        <button className="w-12 h-12 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all">
          <span className="material-icons-round">help_outline</span>
        </button>
        <button className="w-12 h-12 bg-[#137fec] text-white shadow-xl rounded-full flex items-center justify-center hover:scale-105 transition-all">
          <span className="material-icons-round">chat_bubble_outline</span>
        </button>
      </div>
    </div>
  );
};

export default AgingReport;
