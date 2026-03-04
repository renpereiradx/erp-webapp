import React from 'react';
import { useParams } from 'react-router-dom';

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
 * 100% STITCH FIDELITY - RESPONSIVE OPTIMIZED
 */
const SupplierAnalysis = () => {
  const { id } = useParams();
  const { loading, supplier, tableStats } = useSupplierAnalysis(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Cargando Análisis Inteligente...</p>
        </div>
      </div>
    );
  }

  if (!supplier) return null;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      <SupplierHeader supplier={supplier} />
      <DebtKpis stats={supplier.stats} />
      <AnalysisCards rating={supplier.rating} terms={supplier.terms} />
      <ActiveObligationsTable invoices={supplier.invoices} summary={tableStats} />
      <DebtTrendChart data={supplier.trend} />
    </div>
  );
};

export default SupplierAnalysis;
