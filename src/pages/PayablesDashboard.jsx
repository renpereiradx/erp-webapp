import React, { useEffect, useMemo, useState, useCallback } from 'react';
import DashboardHeader from '../features/accounts-payable/components/DashboardHeader';
import FilterRibbon from '../features/accounts-payable/components/FilterRibbon';
import KPICards from '../features/accounts-payable/components/KPICards';
import AgingSummary from '../features/accounts-payable/components/AgingSummary';
import UpcomingPayments from '../features/accounts-payable/components/UpcomingPayments';
import SuppliersDebtTable from '../features/accounts-payable/components/SuppliersDebtTable';
import { usePayables } from '../hooks/usePayables';
import { formatPYG, formatNumber } from '../utils/currencyUtils';

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
  const transformedKpis = useMemo(() => {
    if (!overview) return [];
    return [
      {
        id: "total-pending",
        title: "Total Pendiente",
        value: overview.total_pending,
        currency: overview.currency,
        icon: "account_balance_wallet",
        subtitle: "Capital comprometido"
      },
      {
        id: "total-overdue",
        title: "Total Vencido",
        value: overview.total_overdue,
        currency: overview.currency,
        trend: `${overview.overdue_count} facturas`,
        trendType: "danger",
        icon: "priority_high",
        subtitle: "Acción inmediata requerida",
        critical: true
      },
      {
        id: "weekly-payments",
        title: "Pagos esta Semana",
        value: overview.due_this_week,
        currency: overview.currency,
        icon: "calendar_today",
        subtitle: "Flujo proyectado 7 días"
      },
      {
        id: "compliance-rate",
        title: "Tasa de Cumplimiento",
        value: overview.payment_rate,
        isPercentage: true,
        icon: "speed",
        progress: overview.payment_rate
      }
    ];
  }, [overview]);

  const agingData = useMemo(() => {
    if (!overview?.aging_summary) return [];
    const summary = overview.aging_summary;
    return [
      { label: "0 - 30 Días", amount: summary.current.amount, percentage: summary.current.percentage, color: "bg-primary" },
      { label: "31 - 60 Días", amount: summary.days_30_60.amount, percentage: summary.days_30_60.percentage, color: "bg-primary/70" },
      { label: "61 - 90 Días", amount: summary.days_60_90.amount, percentage: summary.days_60_90.percentage, color: "bg-fluent-warning" },
      { label: "Más de 90 Días", amount: summary.over_90_days.amount, percentage: summary.over_90_days.percentage, color: "bg-fluent-danger", critical: true }
    ];
  }, [overview]);

  const agingStats = useMemo(() => {
    if (!overview) return {};
    return {
      total: formatPYG(overview.total_pending, { compact: true }),
      onTime: `${formatNumber(overview.payment_rate)}%`,
      critical: `${formatNumber(overview.aging_summary?.over_90_days?.percentage || 0)}%`,
      avgDays: `${Math.round(overview.average_days_to_pay || 0)} Días`
    };
  }, [overview]);

  const transformedPayments = useMemo(() => {
    if (!schedule || schedule.length === 0) return [];
    
    return schedule.map(s => {
      const item = s.items?.[0];
      if (!item) return null;
      
      const date = new Date(s.date);
      const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
      return {
        id: item.payable_id,
        date: { month: months[date.getMonth()], day: date.getDate().toString() },
        vendor: item.supplier_name,
        invoice: item.purchase_order_id ? `#${item.purchase_order_id}` : `#FAC-${item.payable_id.split('_')[1] || '000'}`,
        amount: item.amount,
        status: item.priority === 'HIGH' || item.priority === 'URGENT' ? 'Urgente' : 'Programado',
        statusType: item.priority === 'HIGH' || item.priority === 'URGENT' ? 'danger' : 'info'
      };
    }).filter(Boolean);
  }, [schedule]);

  const transformedVendors = useMemo(() => {
    if (!topSuppliers) return [];
    
    // Filter locally by search if needed
    const filtered = filters.search 
      ? topSuppliers.filter(s => s.supplier_name.toLowerCase().includes(filters.search.toLowerCase()))
      : topSuppliers;

    return filtered.map(v => ({
      id: v.supplier_id,
      name: v.supplier_name,
      rfc: v.supplier_ruc || "N/A",
      totalBalance: v.total_pending,
      overdueAmount: v.total_overdue,
      nextPayment: v.next_due_date ? new Date(v.next_due_date).toLocaleDateString('es-PY') : "Sin pagos pdtes.",
      priority: v.total_overdue > 0 ? 'Alta' : 'Media',
      priorityType: v.total_overdue > 0 ? 'warning' : 'info'
    }));
  }, [topSuppliers, filters.search]);

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
