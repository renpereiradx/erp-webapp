import React, { useEffect, useMemo } from 'react';
import DashboardHeader from '../features/accounts-payable/components/DashboardHeader';
import FilterRibbon from '../features/accounts-payable/components/FilterRibbon';
import KPICards from '../features/accounts-payable/components/KPICards';
import AgingSummary from '../features/accounts-payable/components/AgingSummary';
import UpcomingPayments from '../features/accounts-payable/components/UpcomingPayments';
import SuppliersDebtTable from '../features/accounts-payable/components/SuppliersDebtTable';
import { usePayables } from '../hooks/usePayables';
import { formatPYG } from '../utils/currencyUtils';

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
    fetchOverview,
    fetchTopSuppliers,
    fetchSchedule
  } = usePayables();

  // 1. Effects for external synchronization (Browser APIs)
  useEffect(() => {
    document.title = 'Resumen de Cuentas por Pagar | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 2. Initial Data Fetching
  useEffect(() => {
    fetchOverview();
    fetchTopSuppliers();
    fetchSchedule();
  }, [fetchOverview, fetchTopSuppliers, fetchSchedule]);

  // 3. Derived State / Data Transformations (Calculate During Render)
  // We use useMemo to avoid re-calculating on every render if overview hasn't changed.
  const transformedKpis = useMemo(() => {
    if (!overview) return [];
    return [
      {
        id: "total-pending",
        title: "Total Pendiente",
        value: overview.total_pending,
        currency: overview.currency,
        icon: "account_balance_wallet",
        subtitle: "vs. mes anterior"
      },
      {
        id: "total-overdue",
        title: "Total Vencido",
        value: overview.total_overdue,
        currency: overview.currency,
        trend: `${overview.overdue_count} facturas`,
        trendType: "danger",
        icon: "priority_high",
        subtitle: "requieren atención inmediata",
        critical: true
      },
      {
        id: "weekly-payments",
        title: "Pagos esta Semana",
        value: overview.due_this_week,
        currency: overview.currency,
        icon: "calendar_today",
        subtitle: "Flujo de caja proyectado para 7 días"
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
      onTime: `${overview.payment_rate}%`,
      critical: `${overview.aging_summary?.over_90_days?.percentage || 0}%`,
      avgDays: `${overview.average_days_to_pay} Días`
    };
  }, [overview]);

  const transformedPayments = useMemo(() => {
    return schedule.map(s => {
      const item = s.items[0];
      const date = new Date(s.date);
      const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
      return {
        id: item.payable_id,
        date: { month: months[date.getMonth()], day: date.getDate().toString() },
        vendor: item.supplier_name,
        invoice: `#PO-${item.payable_id.split('_')[1] || '000'}`,
        amount: item.amount,
        status: item.priority === 'HIGH' ? 'Urgente' : 'Programado',
        statusType: item.priority === 'HIGH' ? 'danger' : 'info'
      };
    });
  }, [schedule]);

  const transformedVendors = useMemo(() => {
    return topSuppliers.map(v => ({
      id: v.supplier_id,
      name: v.supplier_name,
      rfc: "N/A", // Hidden anyway
      totalBalance: v.total_pending,
      overdueAmount: v.total_overdue,
      nextPayment: "Consultar detalle",
      priority: v.total_overdue > 0 ? 'Alta' : 'Media',
      priorityType: v.total_overdue > 0 ? 'warning' : 'info'
    }));
  }, [topSuppliers]);

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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <DashboardHeader lastUpdate={new Date().toLocaleString('es-PY')} />
      
      <FilterRibbon />
      
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
      
      <SuppliersDebtTable vendors={transformedVendors} />
    </div>
  );
};

export default PayablesDashboard;
