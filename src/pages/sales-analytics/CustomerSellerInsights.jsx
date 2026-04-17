import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wallet, 
  RefreshCw, 
  Star, 
  Calendar, 
  Download, 
  Search, 
  Bell,
  Filter,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import salesAnalyticsService from '@/services/salesAnalyticsService';
import { MOCK_BY_CUSTOMER, MOCK_BY_SELLER } from '@/services/mocks/salesAnalyticsMock';

const CustomerSellerInsights = () => {
  const [customerData, setCustomerData] = useState(MOCK_BY_CUSTOMER.data);
  const [sellerData, setSellerData] = useState(MOCK_BY_SELLER.data);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, sellerRes] = await Promise.all([
          salesAnalyticsService.getByCustomer({ period: 'month' }),
          salesAnalyticsService.getBySeller({ period: 'month' })
        ]);
        
        if (custRes && custRes.success) setCustomerData(custRes.data);
        if (sellerRes && sellerRes.success) setSellerData(sellerRes.data);
      } catch (error) {
        console.error("Error fetching insights data:", error);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value);
  };

  const getSegmentStyles = (segment) => {
    switch(segment) {
      case 'VIP': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'PREMIUM': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">Insights de Clientes y Vendedores</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Análisis detallado del rendimiento de ventas y comportamiento de la cartera.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800 shadow-sm font-mono">
              <Calendar className="text-slate-400" size={16} />
              <span className="text-xs font-bold uppercase">Periodo actual</span>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-[#0f79eb] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#0f79eb]/90 transition-all uppercase tracking-wider">
              <Download size={16} />
              Exportar Reporte
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InsightKPICard 
            title="Total Clientes" 
            value={customerData?.summary?.total_customers || 0} 
            growth={12} 
            subtext={`${customerData?.summary?.returning_customers || 0} Recurrentes | ${customerData?.summary?.new_customers || 0} Nuevos`}
            icon={<Users className="text-[#0f79eb]/60" size={24} />}
          />
          <InsightKPICard 
            title="Lifetime Value (LTV)" 
            value={formatCurrency(customerData?.summary?.average_lifetime_value || 0)} 
            growth={5.4} 
            subtext="Promedio por cliente"
            icon={<Wallet className="text-[#0f79eb]/60" size={24} />}
          />
          <InsightKPICard 
            title="Tasa de Retención" 
            value={`${customerData?.summary?.customer_retention_rate || 0}%`} 
            growth={-2.1} 
            subtext="Churn rate: 13.9%"
            icon={<RefreshCw className="text-[#0f79eb]/60" size={24} />}
          />
          <InsightKPICard 
            title="Venta Clientes Top" 
            value={formatCurrency(customerData?.summary?.top_customer_revenue || 0)} 
            growth={15} 
            subtext="Máximo histórico individual"
            icon={<Star className="text-[#0f79eb]/60" size={24} />}
          />
        </div>

        {/* Client Segmentation Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Segmentación de Clientes</h2>
            <button className="text-xs font-black text-[#0f79eb] hover:underline uppercase tracking-tighter">Ver todos los clientes</button>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Nombre del Cliente</th>
                    <th className="px-6 py-4">RUC</th>
                    <th className="px-6 py-4 text-center">Segmento</th>
                    <th className="px-6 py-4 text-center">Frecuencia</th>
                    <th className="px-6 py-4 text-right">Total Compras</th>
                    <th className="px-6 py-4 text-right">Última Compra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerData?.customers?.map((cust) => (
                    <tr key={cust.customer_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{cust.customer_name}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs font-bold">{cust.customer_ruc}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getSegmentStyles(cust.segment)}`}>
                          {cust.segment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-600 dark:text-slate-400 capitalize font-bold text-xs">{cust.frequency.toLowerCase()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black font-mono text-[#0f79eb]">{formatCurrency(cust.total_purchases)}</td>
                      <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs font-bold">{new Date(cust.last_purchase).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(!customerData?.customers || customerData.customers.length === 0) && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-medium italic text-xs uppercase tracking-widest">
                        Sin datos de clientes disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Seller Performance Section */}
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Ranking de Desempeño de Vendedores</h2>
            <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:bg-slate-50">
              <Filter size={20} />
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Vendedor</th>
                    <th className="px-6 py-4 text-right">Ventas Totales</th>
                    <th className="px-6 py-4 text-right">Unidades Vendidas</th>
                    <th className="px-6 py-4">Progreso de Meta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sellerData?.sellers?.map((seller) => (
                    <tr key={seller.seller_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#0f79eb]/10 flex items-center justify-center text-[#0f79eb] font-black overflow-hidden font-mono">
                            {seller.seller_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{seller.seller_name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Rank <span className="font-mono">#{seller.rank}</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black font-mono text-[#0f79eb]">{formatCurrency(seller.total_sales)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-slate-600 dark:text-slate-400">{seller.units_sold} uds.</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden min-w-[100px] shadow-inner">
                            <div className="h-full bg-[#0f79eb] transition-all duration-1000 ease-out" style={{ width: `${seller.target_progress}%` }}></div>
                          </div>
                          <span className="text-xs font-black font-mono w-10">{seller.target_progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!sellerData?.sellers || sellerData.sellers.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400 font-medium italic text-xs uppercase tracking-widest">
                        Sin datos de vendedores disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  );
};

const InsightKPICard = ({ title, value, growth, subtext, icon }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition-all group">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest group-hover:text-[#0f79eb] transition-colors">{title}</p>
      {icon}
    </div>
    <p className="mt-2 text-3xl font-black font-mono tracking-tight">{value}</p>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase font-black">
      <span className={`flex items-center font-mono ${growth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {growth >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
        {growth >= 0 ? '+' : ''}{growth}%
      </span>
      <span className="text-slate-400 line-clamp-1 tracking-tighter">{subtext}</span>
    </div>
  </div>
);

export default CustomerSellerInsights;
