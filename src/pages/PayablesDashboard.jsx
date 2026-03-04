import React, { useEffect } from 'react';
import DashboardHeader from '../features/accounts-payable/components/DashboardHeader';
import FilterRibbon from '../features/accounts-payable/components/FilterRibbon';
import KPICards from '../features/accounts-payable/components/KPICards';
import AgingSummary from '../features/accounts-payable/components/AgingSummary';
import UpcomingPayments from '../features/accounts-payable/components/UpcomingPayments';
import SuppliersDebtTable from '../features/accounts-payable/components/SuppliersDebtTable';
import { accountsPayableData } from '../features/accounts-payable/data/mockData';

/**
 * Main Page for Accounts Payable Executive Dashboard.
 * Delegated responsibilities to MainLayout according to layout-guidelines.md
 */
const PayablesDashboard = () => {
  useEffect(() => {
    document.title = 'Resumen de Cuentas por Pagar | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <DashboardHeader lastUpdate={accountsPayableData.lastUpdate} />
      
      <FilterRibbon />
      
      <KPICards kpis={accountsPayableData.kpis} />
      
      {/* Middle Section: Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <AgingSummary 
            aging={accountsPayableData.aging} 
            stats={accountsPayableData.agingStats} 
          />
        </div>
        <div>
          <UpcomingPayments payments={accountsPayableData.upcomingPayments} />
        </div>
      </div>
      
      <SuppliersDebtTable vendors={accountsPayableData.topVendors} />
    </div>
  );
};

export default PayablesDashboard;
