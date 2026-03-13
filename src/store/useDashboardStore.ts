import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  DEMO_CONFIG_DASHBOARD, 
  getDemoDashboardData
} from '../config/demoData';
import { dashboardService } from '../services/dashboardService';

// Interfaces para el estado del Dashboard
export interface DashboardSummary {
  sales_today: number;
  sales_this_week: number;
  sales_this_month: number;
  total_revenue: number;
  revenue_trend: string | number;
  active_customers: number;
  low_stock_alerts: number;
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
  severity: 'info' | 'warning' | 'error' | 'success';
  message: string;
  category: string;
}

export interface DashboardActivity {
  id: string | number;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
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
  
  // Estados de carga y error
  loading: boolean;
  error: string | null;

  // Estado para nuevas páginas
  salesHeatmap: any | null; // Se puede refinar a futuro
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
             dashboardService.getRecentActivity()
          ]);

          const [summaryRes, alertsRes, activityRes] = results;

          if (summaryRes.status === 'rejected') {
            throw summaryRes.reason;
          }

          const summaryData = summaryRes.value.data;
          
          const alertsData = alertsRes.status === 'fulfilled' 
            ? (alertsRes.value.data as any).alerts 
            : [];
            
          if (alertsRes.status === 'rejected') {
            console.warn('⚠️ Dashboard: Falló la carga de alertas:', (alertsRes.reason as any).message);
          }

          const activitiesData = activityRes.status === 'fulfilled' 
            ? (activityRes.value.data as any).activities 
            : [];

          if (activityRes.status === 'rejected') {
            console.warn('⚠️ Dashboard: Falló la carga de actividad reciente:', (activityRes.reason as any).message);
          }

          set({
            summary: summaryData,
            alerts: alertsData,
            activities: activitiesData,
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
                activities: (charts as any).recentActivity,
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
