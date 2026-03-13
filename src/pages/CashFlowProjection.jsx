import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Filter, 
  Download, 
  ChevronRight
} from "lucide-react";
import { Link } from 'react-router-dom';

// Feature imports
import KpiSection from '@/features/cash-flow/components/KpiSection';
import TrendChart from '@/features/cash-flow/components/TrendChart';
import PaymentCalendar from '@/features/cash-flow/components/PaymentCalendar';
import TreasuryInsights from '@/features/cash-flow/components/TreasuryInsights';
import { useCashFlow } from '@/features/cash-flow/hooks/useCashFlow';
import { bankPositions } from '@/features/cash-flow/data/mockData';

/**
 * Main Page Component for Cash Flow Projection.
 * Refactored for 100% Fidelity with Stitch and layout-guidelines.md
 * Optimized header layout for a cleaner, more horizontal look.
 */
const CashFlowProjection = () => {
  const { 
    period, 
    setPeriod, 
    filteredData, 
    stats, 
    pendingPayments,
    loading 
  } = useCashFlow();

  useEffect(() => {
    document.title = 'Proyección de Pagos y Flujo | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading && filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Calculando Proyección Financiera...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          <Link to="/dashboard/payables" className="hover:text-primary transition-colors flex items-center gap-1">
            Finanzas
          </Link>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <Link to="/dashboard/payables" className="hover:text-primary transition-colors">
            Cuentas por Pagar
          </Link>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <span className="text-slate-600 dark:text-slate-300">Flujo de Caja</span>
        </nav>

        {/* Title & Actions - Refined Horizontal Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary shadow-sm border border-primary/20 flex-shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate">
                Proyección de Pagos y Flujo de Caja
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5 truncate">
                Dashboard Inteligente de Liquidez
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 md:gap-5">
            {/* Period Selector (Segmented Control) */}
            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              {['30D', '60D', '90D'].map((val) => {
                const isActive = period === val;
                return (
                  <button
                    key={val}
                    onClick={() => setPeriod(val)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${
                      isActive 
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-primary border border-slate-200 dark:border-slate-600' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {val === '30D' ? '30 Días' : val === '60D' ? '60 Días' : '90 Días'}
                  </button>
                );
              })}
            </div>

            <div className="hidden xl:block h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

            <div className="flex items-center gap-2.5">
              <button className="inline-flex items-center px-3.5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                Filtros
              </button>
              <button className="inline-flex items-center px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-primary text-white hover:bg-blue-600 transition-all shadow-md shadow-primary/20 active:scale-95">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-6">
        
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8">
            <PaymentCalendar pendingPayments={pendingPayments} />
          </div>

          <div className="lg:col-span-4">
            <TreasuryInsights bankPositions={bankPositions} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default CashFlowProjection;
