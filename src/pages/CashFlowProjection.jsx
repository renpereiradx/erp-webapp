import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Filter, 
  Download, 
  Cloud, 
  Building2 
} from "lucide-react";

// Feature imports
import KpiSection from '@/features/cash-flow/components/KpiSection';
import TrendChart from '@/features/cash-flow/components/TrendChart';
import PaymentCalendar from '@/features/cash-flow/components/PaymentCalendar';
import TreasuryInsights from '@/features/cash-flow/components/TreasuryInsights';
import { useCashFlow } from '@/features/cash-flow/hooks/useCashFlow';
import { bankPositions } from '@/features/cash-flow/data/mockData';

/**
 * Main Page Component for Cash Flow Projection.
 * Follows "React Components" and "React Best Practices" skills.
 */
const CashFlowProjection = () => {
  const { 
    period, 
    setPeriod, 
    filteredData, 
    stats, 
    pendingPayments 
  } = useCashFlow();

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] text-slate-800 dark:text-slate-100 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Header (Top Navigation) */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#101922]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 py-4 transition-all">
        <div className="max-w-[2400px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 group">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-xl shadow-blue-600/30 group-hover:scale-110 transition-transform cursor-pointer">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">Proyección de Pagos y Flujo de Caja</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Dashboard Inteligente de Liquidez</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 md:gap-8">
            {/* Period Selector (Segmented Control) */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
              {['30D', '60D', '90D'].map((val) => {
                const isActive = period === val;
                return (
                  <button
                    key={val}
                    onClick={() => setPeriod(val)}
                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-widest ${
                      isActive 
                        ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400 scale-[1.02]' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {val === '30D' ? '30 Días' : val === '60D' ? '60 Días' : '90 Días'}
                  </button>
                );
              })}
            </div>

            <div className="hidden xl:block h-10 w-px bg-slate-200 dark:bg-slate-700"></div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 h-11 px-5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 border-none flex items-center gap-2 h-11 px-6 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all hover:scale-[1.02] active:scale-95">
                <Download className="h-4 w-4" />
                Exportar Informe
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[2400px] mx-auto px-6 md:px-10 py-10 space-y-10 pb-24">
        
        {/* Top KPIs Summary */}
        <KpiSection 
          coverageRatio={stats.coverageRatio}
          netFlow={stats.netFlow}
          totalInflows={stats.totalInflows}
          totalOutflows={stats.totalOutflows}
        />

        {/* Main Graphical Analysis */}
        <TrendChart data={filteredData} />

        {/* Operational Grid: Pending Calendar & Strategic Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8">
            <PaymentCalendar pendingPayments={pendingPayments} />
          </div>

          <div className="lg:col-span-4">
            <TreasuryInsights bankPositions={bankPositions} />
          </div>

        </div>
      </main>

      {/* Persistence / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 md:px-10 py-2.5 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50"></span>
            <span className="group-hover:text-slate-600 transition-colors tracking-tighter">Sincronizado con el ERP (Hace 3 min)</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer">
            <Cloud className="h-3.5 w-3.5 group-hover:text-blue-500 transition-colors" />
            <span className="group-hover:text-slate-600 transition-colors tracking-tighter">Entorno: Producción</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>ID: 693252806641531510</span>
          </div>
          <span className="opacity-30">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-300">Usuario:</span>
            <span className="text-slate-500">tesoreria_admin</span>
          </div>
          <span className="opacity-30">|</span>
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400">v2.4.1-fluent</span>
        </div>
      </footer>
    </div>
  );
};

export default CashFlowProjection;
