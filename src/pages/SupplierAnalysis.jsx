import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Feature components
import SupplierHeader from '@/features/accounts-payable/components/SupplierAnalysis/SupplierHeader';
import DebtKpis from '@/features/accounts-payable/components/SupplierAnalysis/DebtKpis';
import AnalysisCards from '@/features/accounts-payable/components/SupplierAnalysis/AnalysisCards';
import ActiveObligationsTable from '@/features/accounts-payable/components/SupplierAnalysis/ActiveObligationsTable';
import DebtTrendChart from '@/features/accounts-payable/components/SupplierAnalysis/DebtTrendChart';

// Hooks
import { useSupplierAnalysis } from '@/features/accounts-payable/hooks/useSupplierAnalysis';

/**
 * Supplier Analysis and Debt Page.
 * 100% STITCH FIDELITY - REACT BEST PRACTICES
 * Integrated into MainLayout (Navbar removed)
 */
const SupplierAnalysis = () => {
  const { id } = useParams();
  const { loading, supplier, tableStats } = useSupplierAnalysis(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Cargando Análisis Inteligente...</p>
        </div>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500 pb-12">
      <main className="max-w-[2400px] mx-auto p-6 md:p-10 space-y-10 animate-in fade-in duration-700">
        <SupplierHeader supplier={supplier} />
        <DebtKpis stats={supplier.stats} />
        <AnalysisCards rating={supplier.rating} terms={supplier.terms} />
        <ActiveObligationsTable invoices={supplier.invoices} summary={tableStats} />
        <DebtTrendChart data={supplier.trend} />
      </main>

      <footer className="max-w-[2400px] mx-auto px-10 py-12 text-center border-t border-slate-200 dark:border-slate-800 transition-opacity hover:opacity-100 opacity-60">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          © 2024 Corporación Industrial Integrada. Reservados todos los derechos. Generado por <span className="text-blue-500">Finance Intelligence Engine</span>.
        </p>
      </footer>
    </div>
  );
};

export default SupplierAnalysis;
