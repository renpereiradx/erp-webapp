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
 * RESPONSIVE OPTIMIZED.
 */
const PayablesDashboard = () => {
  useEffect(() => {
    document.title = 'Resumen de Cuentas por Pagar | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="payables-dashboard p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 overflow-x-hidden">
      <DashboardHeader lastUpdate={accountsPayableData.lastUpdate} />
      
      <FilterRibbon />
      
      <KPICards kpis={accountsPayableData.kpis} />
      
      {/* Split Layout - Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
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
      
      {/* Background decoration elements (Mica Effect) - Adapted for responsiveness */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-[#137fec]/5 blur-[100px]"></div>
      </div>
    </div>
  );
};

export default PayablesDashboard;
