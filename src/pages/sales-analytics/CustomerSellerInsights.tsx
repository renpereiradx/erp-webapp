import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Users,
  Wallet,
  RefreshCw,
  Star,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import salesAnalyticsService from '@/services/bi/salesAnalyticsService';
import { useI18n } from '@/lib/i18n';
import { Link } from 'react-router-dom';

/** Summary de GET /sales-analytics/by-customer. */
interface CustomerSummary {
  total_customers?: number
  returning_customers?: number
  new_customers?: number
  average_lifetime_value?: number
  customer_retention_rate?: number
  top_customer_revenue?: number
}

interface CustomerRow {
  customer_id?: string
  customer_name?: string
  customer_ruc?: string
  segment?: string
  frequency?: string
  total_purchases?: number
  last_purchase?: string
}

/** Fila de GET /sales-analytics/by-seller. */
interface SellerRow {
  seller_id?: string
  seller_name?: string
  rank?: number
  total_sales?: number
  units_sold?: number
  target_progress?: number
}

const CustomerSellerInsights = () => {
  const { t } = useI18n();
  const [customerData, setCustomerData] = useState<{ summary?: CustomerSummary; customers?: CustomerRow[] } | null>(null);
  const [sellerData, setSellerData] = useState<{ sellers?: SellerRow[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [custRes, sellerRes] = await Promise.all([
          salesAnalyticsService.getByCustomer({ period: 'month' }),
          salesAnalyticsService.getBySeller({ period: 'month' })
        ]);

        if (custRes && custRes.success) setCustomerData(custRes.data);
        if (sellerRes && sellerRes.success) setSellerData(sellerRes.data);
      } catch (err: any) {
        console.error("Error fetching insights data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (value: number | null | undefined) => {
    return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value || 0);
  };

  const getSegmentStyles = (segment?: string) => {
    switch(segment) {
      case 'VIP': return 'bg-warning/10 text-warning';
      case 'PREMIUM': return 'bg-primary/10 text-primary';
      default: return 'bg-surface-subtle text-on-surface-deep';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 font-bold text-on-surface-deep uppercase tracking-widest text-xs">{t('bi.insights.loading', 'Cargando Insights...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-sm font-bold text-foreground">{t('bi.insights.loadError', 'No se pudieron cargar los insights.')}</p>
        <p className="text-xs text-on-surface-deep uppercase tracking-widest">{t('bi.common.checkConnection', 'Verifique la conexión e intente nuevamente')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-display">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase leading-none">{t('bi.insights.title', 'Insights de Clientes y Vendedores')}</h1>
            <p className="text-on-surface-deep text-sm font-medium">{t('bi.insights.subtitle', 'Análisis detallado del rendimiento de ventas y comportamiento de la cartera.')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 shadow-sm font-mono">
              <Calendar className="text-on-surface-deep" size={16} />
              <span className="text-xs font-bold uppercase">{t('bi.insights.currentPeriod', 'Periodo actual')}</span>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InsightKPICard
            title="Total Clientes"
            value={customerData?.summary?.total_customers || 0}
            subtext={t('bi.insights.recurringNew', '{recurrentes} Recurrentes | {nuevos} Nuevos', { recurrentes: customerData?.summary?.returning_customers || 0, nuevos: customerData?.summary?.new_customers || 0 })}
            icon={<Users className="text-primary/60" size={24} />}
          />
          <InsightKPICard
            title="Lifetime Value (LTV)"
            value={formatCurrency(customerData?.summary?.average_lifetime_value)}
            subtext="Promedio por cliente"
            icon={<Wallet className="text-primary/60" size={24} />}
          />
          <InsightKPICard
            title="Tasa de Retención"
            value={`${customerData?.summary?.customer_retention_rate || 0}%`}
            subtext="Clientes que siguen comprando"
            icon={<RefreshCw className="text-primary/60" size={24} />}
          />
          <InsightKPICard
            title="Venta Clientes Top"
            value={formatCurrency(customerData?.summary?.top_customer_revenue)}
            subtext="Mayor venta del período"
            icon={<Star className="text-primary/60" size={24} />}
          />
        </div>

        {/* Client Segmentation Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">{t('bi.insights.customersTitle', 'Segmentación de Clientes')}</h2>
            <Link to="/parties?tab=clientes" className="text-xs font-black text-primary hover:underline uppercase tracking-tighter">{t('bi.insights.viewAllCustomers', 'Ver todos los clientes')}</Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-surface-muted text-on-surface-deep uppercase text-[10px] font-black tracking-widest border-b border-border-subtle">
                  <tr>
                    <th className="px-6 py-4">{t('bi.insights.col.customer', 'Nombre del Cliente')}</th>
                    <th className="px-6 py-4">{t('bi.insights.col.ruc', 'RUC')}</th>
                    <th className="px-6 py-4 text-center">{t('bi.insights.col.segment', 'Segmento')}</th>
                    <th className="px-6 py-4 text-center">{t('bi.insights.col.frequency', 'Frecuencia')}</th>
                    <th className="px-6 py-4 text-right">{t('bi.insights.col.purchases', 'Total Compras')}</th>
                    <th className="px-6 py-4 text-right">{t('bi.insights.col.lastPurchase', 'Última Compra')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {customerData?.customers?.map((cust) => (
                    <tr key={cust.customer_id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{cust.customer_name}</td>
                      <td className="px-6 py-4 text-on-surface-deep font-mono text-xs font-bold">{cust.customer_ruc}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${getSegmentStyles(cust.segment)}`}>
                          {cust.segment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-on-surface-deep capitalize font-bold text-xs">{(cust.frequency || '').toLowerCase()}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black font-mono text-primary">{formatCurrency(cust.total_purchases)}</td>
                      <td className="px-6 py-4 text-right text-on-surface-deep font-mono text-xs font-bold">{cust.last_purchase ? new Date(cust.last_purchase).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                  {(!customerData?.customers || customerData.customers.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-on-surface-deep font-medium italic text-xs uppercase tracking-widest">{t('bi.insights.emptyCustomers', 'Sin datos de clientes disponibles')}</td>
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
            <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">{t('bi.insights.sellersTitle', 'Ranking de Desempeño de Vendedores')}</h2>
          </div>
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-surface-muted text-on-surface-deep uppercase text-[10px] font-black tracking-widest border-b border-border-subtle">
                  <tr>
                    <th className="px-6 py-4">{t('bi.insights.col.seller', 'Vendedor')}</th>
                    <th className="px-6 py-4 text-right">{t('bi.sales.kpi.totalSales', 'Ventas Totales')}</th>
                    <th className="px-6 py-4 text-right">{t('bi.insights.col.unitsSold', 'Unidades Vendidas')}</th>
                    <th className="px-6 py-4">{t('bi.insights.col.targetProgress', 'Progreso de Meta')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {sellerData?.sellers?.map((seller) => (
                    <tr key={seller.seller_id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black overflow-hidden font-mono">
                            {seller.seller_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{seller.seller_name}</p>
                            <p className="text-[10px] text-on-surface-deep font-black uppercase tracking-widest">{t('bi.insights.rank', 'Rank')}<span className="font-mono">#{seller.rank}</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black font-mono text-primary">{formatCurrency(seller.total_sales)}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-on-surface-deep">{seller.units_sold} uds.</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden min-w-[100px] shadow-inner">
                            <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${seller.target_progress}%` }}></div>
                          </div>
                          <span className="text-xs font-black font-mono w-10">{seller.target_progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!sellerData?.sellers || sellerData.sellers.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-on-surface-deep font-medium italic text-xs uppercase tracking-widest">{t('bi.insights.emptySellers', 'Sin datos de vendedores disponibles')}</td>
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

interface InsightKPICardProps {
  title: string;
  value: string | number;
  growth?: number | null;
  subtext?: string;
  icon: ReactNode;
}

const InsightKPICard = ({ title, value, growth, subtext, icon }: InsightKPICardProps) => (
  <div className="rounded-lg border border-border-subtle bg-surface p-6 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-black text-on-surface-deep uppercase tracking-widest group-hover:text-primary transition-colors">{title}</p>
      {icon}
    </div>
    <p className="mt-2 text-3xl font-black font-mono tracking-tight">{value}</p>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase font-black">
      {growth != null && (
        <span className={`flex items-center font-mono ${growth >= 0 ? 'text-success' : 'text-error'}`}>
          {growth >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
          {growth >= 0 ? '+' : ''}{growth}%
        </span>
      )}
      <span className="text-on-surface-deep line-clamp-1 tracking-tighter">{subtext}</span>
    </div>
  </div>
);

export default CustomerSellerInsights;
