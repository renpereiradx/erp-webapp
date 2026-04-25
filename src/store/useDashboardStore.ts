import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  DEMO_CONFIG_DASHBOARD, 
  getDemoDashboardData
} from '../config/demoData';
import { dashboardService } from '../services/bi/dashboardService';
import { receivablesService } from '../services/bi/receivablesService';
import { payablesService } from '../services/bi/payablesService';
import { salesAnalyticsService } from '../services/bi/salesAnalyticsService';
import { inventoryAnalyticsService } from '../services/bi/inventoryAnalyticsService';

// Interfaces para el estado del Dashboard
export interface DashboardSummary {
  sales?: {
    total: number;
    count: number;
    average_ticket: number;
    currency: string;
  };
  purchases?: {
    total: number;
    count: number;
    currency: string;
  };
  profit?: {
    gross: number;
    margin_percentage: number;
  };
  inventory?: {
    total_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_value: number;
  };
  cash_registers?: {
    open_count: number;
    total_balance: number;
  };
  receivables?: {
    total_pending: number;
    overdue_count: number;
  };
  payables?: {
    total_pending: number;
    due_this_week: number;
  };
  // Fallback for legacy demo mapping
  sales_today?: number;
  sales_this_week?: number;
  sales_this_month?: number;
  total_revenue?: number;
  revenue_trend?: string | number;
  active_customers?: number;
  low_stock_alerts?: number;
}

export interface DashboardKPIs {
  sales_kpis: {
    average_ticket: number;
    sales_per_day: number;
    conversion_rate: number;
    repeat_customer_rate: number;
  };
  financial_kpis: {
    net_margin: number;
    gross_margin: number;
    operating_expense_ratio: number;
  };
  customer_kpis: {
    new_customers: number;
    active_customers: number;
    total_customers: number;
    average_purchase_frequency: number;
  };
  inventory_kpis: {
    turnover_rate: number;
  };
}

export interface DashboardAlert {
  id: string | number;
  severity: 'info' | 'warning' | 'error' | 'success' | 'critical';
  message: string;
  category: string;
  title?: string;
  action_url?: string;
  created_at?: string;
}

export interface DashboardActivity {
  id: string | number;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
  amount?: number;
  details?: any;
}

export interface TopProduct {
  id: string | number;
  name: string;
  category: string;
  quantity_sold: number;
  revenue: number;
  profit: number;
  margin_percentage: number;
  trend: string;
  stock_status: string;
}

export interface DashboardState {
  // Estado de las métricas
  summary: DashboardSummary | null;
  kpis: DashboardKPIs | null;
  alerts: DashboardAlert[];
  activities: DashboardActivity[];
  
  // Nuevos estados dinámicos
  trends: any | null;
  profitabilityTrends: any | null;
  receivablesOverview: any | null;
  payablesOverview: any | null;
  salesPerformance: any | null;

  // Estados de carga y error
  loading: boolean;
  error: string | null;

  // Estado para nuevas páginas
  salesHeatmap: any | null; 
  topProducts: TopProduct[];
  topProductsMetrics: {
    total_revenue: number;
    total_profit: number;
  } | null;

  // Acciones
  fetchKPIData: (period?: string) => Promise<void>;
  fetchSalesHeatmap: (weeks?: number) => Promise<void>;
  fetchTopProducts: (period?: string, limit?: number, sortBy?: string) => Promise<void>;
  fetchDashboardData: () => Promise<void>;
}

const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      // Estado inicial
      summary: null,
      kpis: null,
      alerts: [],
      activities: [],
      trends: null,
      profitabilityTrends: null,
      receivablesOverview: null,
      payablesOverview: null,
      salesPerformance: null,
      loading: false,
      error: null,
      salesHeatmap: null,
      topProducts: [],
      topProductsMetrics: null,

      // Acción para cargar los KPIs detallados
      fetchKPIData: async (period = 'month') => {
        set({ loading: true, error: null });
        try {
          const response = await dashboardService.getKPIs(period);
          set({ kpis: response.data, loading: false });
        } catch (error: any) {
          if (error.message === 'DEMO_MODE: Using local fallback data' && DEMO_CONFIG_DASHBOARD.enabled) {
              console.log('🔄 Dashboard: Mapeando KPIs de modo demo...');
              try {
                  const demo = await getDemoDashboardData();
                  const { clientStats } = demo.data;
                  
                  // Mapeo de demoData a API structure
                  const mappedKPIs: DashboardKPIs = {
                      sales_kpis: {
                          average_ticket: 350000,
                          sales_per_day: 15,
                          conversion_rate: 65.5,
                          repeat_customer_rate: 42.1
                      },
                      financial_kpis: {
                          net_margin: 32.5,
                          gross_margin: 46.03,
                          operating_expense_ratio: 13.5
                      },
                      customer_kpis: {
                          new_customers: clientStats.new_this_month,
                          active_customers: clientStats.active,
                          total_customers: clientStats.total_customers || clientStats.total,
                          average_purchase_frequency: 2.3
                      },
                      inventory_kpis: {
                          turnover_rate: 4.2
                      }
                  };
                  
                  set({ kpis: mappedKPIs, loading: false, error: null });
                  return;
              } catch (demoError) {
                  console.error('❌ Dashboard: Error en fallback de KPIs:', demoError);
              }
          }

          console.error('❌ Dashboard: Error loading KPIs:', error.message);
          set({ error: error.message, loading: false });
        }
      },
      
      fetchSalesHeatmap: async (weeks = 4) => {
        set({ loading: true, error: null });
        try {
            const response = await dashboardService.getSalesHeatmap(weeks);
            set({ salesHeatmap: response.data, loading: false });
        } catch(error: any) {
            if (error.message === 'DEMO_MODE: Using local fallback data' && DEMO_CONFIG_DASHBOARD.enabled) {
                console.log('🔄 Dashboard: Mapeando Heatmap de modo demo...');
                
                // Generar datos realistas de heatmap para demo
                const demoHeatmap = [];
                const days = [0, 1, 2, 3, 4, 5, 6]; // Sun to Sat (matches API days)
                const startHour = 8;
                const endHour = 21;

                for (const day of days) {
                    for (let hour = startHour; hour <= endHour; hour++) {
                        // Lógica para picos realistas
                        let intensity = 0.1 + Math.random() * 0.3;
                        
                        // Picos de almuerzo (12-14)
                        if (hour >= 12 && hour <= 14) intensity += 0.4;
                        // Picos de tarde (18-20)
                        if (hour >= 18 && hour <= 20) intensity += 0.3;
                        // Fines de semana más activos
                        if (day === 5 || day === 6) intensity += 0.2;
                        
                        const salesCount = Math.floor(intensity * 15);
                        const totalAmount = salesCount * (50000 + Math.random() * 150000);

                        if (salesCount > 0) {
                            demoHeatmap.push({
                                day,
                                hour,
                                sales_count: salesCount,
                                total_amount: totalAmount
                            });
                        }
                    }
                }

                set({ 
                    salesHeatmap: {
                        heatmap: demoHeatmap,
                        peak_times: [
                            { day: 'Sábado', hour: 19 },
                            { day: 'Viernes', hour: 13 }
                        ]
                    }, 
                    loading: false, 
                    error: null 
                });
                return;
            }

            console.error('❌ Dashboard: Error loading heatmap:', error.message);
            set({ error: error.message, loading: false });
        }
      },

      fetchTopProducts: async (period = 'week', limit = 10, sortBy = 'revenue') => {
        set({ loading: true, error: null });
        try {
            const response = await dashboardService.getTopProducts(period, limit, sortBy);
            set({ 
                topProducts: response.data.products, 
                topProductsMetrics: {
                    total_revenue: response.data.total_revenue,
                    total_profit: response.data.total_profit
                },
                loading: false 
            });
        } catch(error: any) {
             if (error.message === 'DEMO_MODE: Using local fallback data' && DEMO_CONFIG_DASHBOARD.enabled) {
                console.log('🔄 Dashboard: Mapeando Top Products de modo demo...');
                try {
                    const demo = await getDemoDashboardData();
                    const { topProducts } = demo.charts;
                    
                    const mappedTopProducts: TopProduct[] = topProducts.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        category: p.category || 'General',
                        quantity_sold: p.sales || p.quantity_sold,
                        revenue: p.revenue,
                        profit: p.profit || (p.revenue * 0.3),
                        margin_percentage: p.margin_percentage || 30.0,
                        trend: p.trend || 'stable',
                        stock_status: p.stock_status || 'in_stock'
                    }));
                    
                    set({ 
                        topProducts: mappedTopProducts, 
                        topProductsMetrics: {
                            total_revenue: mappedTopProducts.reduce((acc, p) => acc + p.revenue, 0),
                            total_profit: mappedTopProducts.reduce((acc, p) => acc + p.profit, 0)
                        },
                        loading: false, 
                        error: null 
                    });
                    return;
                } catch (demoError) {
                    console.error('❌ Dashboard: Error en fallback de Top Products:', demoError);
                }
             }

             console.error('❌ Dashboard: Error loading top products:', error.message);
             set({ error: error.message, loading: false });
        }
      },

      fetchDashboardData: async () => {
        set({ loading: true, error: null });
        
        try {
          const results = await Promise.allSettled([
             dashboardService.getSummary(),
             dashboardService.getAlerts(),
             dashboardService.getRecentActivity(),
             dashboardService.getTrends('month'),
             profitabilityService.getTrends({ period: 'month' }),
             receivablesService.getSummary('month'),
             payablesService.getOverview(),
             salesAnalyticsService.getPerformance({ period: 'month', compare: true })
          ]);

          const [
            summaryRes, 
            alertsRes, 
            activityRes, 
            trendsRes, 
            profitTrendsRes, 
            receivablesRes, 
            payablesRes,
            salesPerfRes
          ] = results;

          if (summaryRes.status === 'rejected') {
            throw summaryRes.reason;
          }

          const summaryData = summaryRes.value.data;
          
          const alertsData = alertsRes.status === 'fulfilled' 
            ? (alertsRes.value.data as any).alerts 
            : [];
            
          const activitiesData = activityRes.status === 'fulfilled' 
            ? (activityRes.value.data as any).activities 
            : [];

          const trendsData = trendsRes.status === 'fulfilled'
            ? trendsRes.value.data
            : null;

          const profitTrendsData = profitTrendsRes.status === 'fulfilled'
            ? profitTrendsRes.value.data
            : null;

          const receivablesData = receivablesRes.status === 'fulfilled'
            ? receivablesRes.value.data
            : null;

          const payablesData = payablesRes.status === 'fulfilled'
            ? payablesRes.value.data
            : null;

          const salesPerfData = salesPerfRes.status === 'fulfilled'
            ? salesPerfRes.value.data
            : null;

          set({
            summary: summaryData,
            alerts: alertsData,
            activities: activitiesData,
            trends: trendsData,
            profitabilityTrends: profitTrendsData,
            receivablesOverview: receivablesData,
            payablesOverview: payablesData,
            salesPerformance: salesPerfData,
            loading: false,
            error: null
          });
          
        } catch (error: any) {
          if (error.message === 'DEMO_MODE: Using local fallback data' && DEMO_CONFIG_DASHBOARD.enabled) {
            console.log('🔄 Dashboard: Mapeando datos de modo demo...');
            try {
              const demoResponse = await getDemoDashboardData();
              const { data, charts } = demoResponse;
              
              set({
                summary: {
                  sales: {
                    total: data.salesStats.today,
                    count: 15,
                    average_ticket: data.salesStats.avgOrderValue,
                    currency: 'PYG',
                    // Adding trend for heatmap page
                    trend: data.salesStats.trend
                  },
                  cash_registers: {
                    open_count: 3,
                    total_balance: 15000000
                  },
                  inventory: {
                    total_products: data.productStats.total,
                    low_stock_count: data.productStats.lowStock,
                    out_of_stock_count: data.productStats.outOfStock,
                    total_value: 450000000
                  },
                  // Legacy fields for backward compatibility
                  sales_today: data.salesStats.today,
                  sales_this_week: data.salesStats.thisWeek,
                  sales_this_month: data.salesStats.thisMonth,
                  total_revenue: data.salesStats.total,
                  revenue_trend: data.salesStats.trend,
                  active_customers: data.clientStats.active,
                  low_stock_alerts: data.productStats.lowStock
                },
                alerts: [
                  { id: 1, severity: 'warning', message: `Stock bajo en ${data.productStats.lowStock} productos`, category: 'inventory' },
                  { id: 2, severity: 'info', message: `${data.clientStats.new_this_month} nuevos clientes este mes`, category: 'sales' }
                ],
                activities: (charts as any).recentActivity.map((a: any) => ({
                  ...a,
                  // Convert demo 'time' (HH:mm) to full today's timestamp if timestamp is missing
                  timestamp: a.timestamp || (a.time ? `${new Date().toISOString().split('T')[0]}T${a.time}:00Z` : new Date().toISOString())
                })),
                trends: null,
                profitabilityTrends: {
                  data_points: [
                    { label: 'Jan 1', revenue: 4000, cost: 2400 },
                    { label: 'Jan 5', revenue: 3000, cost: 1398 },
                    { label: 'Jan 10', revenue: 2000, cost: 9800 },
                    { label: 'Jan 15', revenue: 2780, cost: 3908 },
                    { label: 'Jan 20', revenue: 1890, cost: 4800 },
                    { label: 'Jan 25', revenue: 2390, cost: 3800 },
                    { label: 'Jan 30', revenue: 3490, cost: 4300 },
                  ]
                },
                receivablesOverview: { collection_rate: 65 },
                payablesOverview: { payment_rate: 40 },
                salesPerformance: { comparison: { transactions_change_pct: 2 } },
                loading: false,
                error: null
              });
              return;
            } catch (demoError) {
              console.error('❌ Dashboard: Error fatal cargando incluso datos demo:', demoError);
            }
          }

          console.error('❌ Dashboard: Error loading data:', error.message);
          set({ error: error.message, loading: false });
        }
      },
    }),
    { name: 'dashboard-store' }
  )
);

export default useDashboardStore;
