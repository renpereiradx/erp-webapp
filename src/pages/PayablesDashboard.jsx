import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DashboardHeader from '../features/accounts-payable/components/DashboardHeader';
import FilterRibbon from '../features/accounts-payable/components/FilterRibbon';
import KPICards from '../features/accounts-payable/components/KPICards';
import AgingSummary from '../features/accounts-payable/components/AgingSummary';
import UpcomingPayments from '../features/accounts-payable/components/UpcomingPayments';
import SuppliersDebtTable from '../features/accounts-payable/components/SuppliersDebtTable';
import { usePayables } from '@/features/accounts-payable/hooks/usePayables';
// F1 (PLAN_ALINEACION_BI_FRONTEND): transformaciones extraídas a domain
import {
  buildAgingBars,
  buildAgingStats,
  buildPayablesKpis,
  buildSuppliersDebtRows,
  buildUpcomingPayments,
} from '@/domain/payables/dashboard';

/**
 * Main Page for Accounts Payable Executive Dashboard.
 * Refactored using React Best Practices and Real Hook Integration.
 */
const PayablesDashboard = () => {
  const { 
    loading, 
    overview, 
    topSuppliers, 
    schedule,
    pagination,
    fetchOverview,
    fetchTopSuppliers,
    fetchSchedule
  } = usePayables();

  // Local state for interactive features
  const [filters, setFilters] = useState({
    period: 'month',
    currency: 'PYG',
    search: ''
  });

  const [suppliersPagination, setSuppliersPagination] = useState({
    page: 1,
    pageSize: 5
  });

  // 1. Effects for external synchronization (Browser APIs)
  useEffect(() => {
    document.title = 'Resumen de Cuentas por Pagar | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 2. Initial Data Fetching & Reactive Refetching
  const refreshData = useCallback(() => {
    fetchOverview(filters.period);
    fetchTopSuppliers(10); // Dashboard always shows top 10
    fetchSchedule(30);
  }, [fetchOverview, fetchTopSuppliers, fetchSchedule, filters.period]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage) => {
    // In a real scenario, this would call fetchTopSuppliers with offset
    // For now, we simulate pagination on the 10 items we have
    setSuppliersPagination(prev => ({ ...prev, page: newPage }));
  };

  // 3. Derived State / Data Transformations (Calculate During Render)
  const transformedKpis = useMemo(() => buildPayablesKpis(overview), [overview]);

  const agingData = useMemo(() => buildAgingBars(overview), [overview]);

  const agingStats = useMemo(() => buildAgingStats(overview), [overview]);

  const transformedPayments = useMemo(() => buildUpcomingPayments(schedule), [schedule]);

  const transformedVendors = useMemo(
    () => buildSuppliersDebtRows(topSuppliers, filters.search),
    [topSuppliers, filters.search],
  );

  // 4. Conditional Rendering for Loading State
  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 font-bold text-slate-500 uppercase tracking-widest text-xs">Cargando datos financieros...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      <DashboardHeader lastUpdate={new Date().toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
      
      <FilterRibbon 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      <KPICards kpis={transformedKpis} />
      
      {/* Middle Section: Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AgingSummary 
            aging={agingData} 
            stats={agingStats} 
          />
        </div>
        <div>
          <UpcomingPayments payments={transformedPayments} />
        </div>
      </div>
      
      <SuppliersDebtTable 
        vendors={transformedVendors.slice((suppliersPagination.page - 1) * suppliersPagination.pageSize, suppliersPagination.page * suppliersPagination.pageSize)} 
        pagination={{
          page: suppliersPagination.page,
          pageSize: suppliersPagination.pageSize,
          totalItems: transformedVendors.length,
          totalPages: Math.ceil(transformedVendors.length / suppliersPagination.pageSize)
        }}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default PayablesDashboard;
