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
 * Integrates all sub-components and manages overall state.
 */
const PayablesDashboard = () => {
  useEffect(() => {
    // Set page title
    document.title = 'Resumen de Cuentas por Pagar | ERP System';
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="payables-dashboard animate-in fade-in duration-500">
      <DashboardHeader lastUpdate={accountsPayableData.lastUpdate} />
      
      <FilterRibbon />
      
      <KPICards kpis={accountsPayableData.kpis} />
      
      <div className="payables-dashboard__split-layout">
        <div className="xl:col-span-2">
          <AgingSummary 
            aging={accountsPayableData.aging} 
            stats={accountsPayableData.agingStats} 
          />
        </div>
        <div className="h-full">
          <UpcomingPayments payments={accountsPayableData.upcomingPayments} />
        </div>
      </div>
      
      <SuppliersDebtTable vendors={accountsPayableData.topVendors} />
      
      {/* Background decoration elements (Mica Effect) */}
      <div className="payables-dashboard__bg-decoration">
        <div className="circle-1"></div>
        <div className="circle-2"></div>
      </div>
    </div>
  );
};

export default PayablesDashboard;
