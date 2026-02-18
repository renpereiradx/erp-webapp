import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService } from '../services/clientService';
import { 
  DEMO_CONFIG_DASHBOARD, 
  getDemoDashboardData,
  getDemoClientStats,
  getDemoProductStats,
  getDemoSalesStats
} from '../config/demoData';
// import { productService } from '../services/productService'; // A futuro
// import { saleService } from '../services/saleService'; // A futuro
import { dashboardService } from '../services/dashboardService';

const useDashboardStore = create()(
  devtools(
    (set) => ({
      // Estado de las métricas
      summary: null,
      kpis: null,
      alerts: [],
      activities: [],
      
      // Estados de carga y error
      loading: false,
      error: null,

      // Acción para cargar los KPIs detallados
      fetchKPIData: async (period = 'month') => {
        set({ loading: true, error: null });
        try {
          const response = await dashboardService.getKPIs(period);
          set({ kpis: response.data, loading: false });
        } catch (error) {
          if (error.message === 'DEMO_MODE: Using local fallback data' && DEMO_CONFIG_DASHBOARD.enabled) {
              console.log('🔄 Dashboard: Mapeando KPIs de modo demo...');
              try {
                  const demo = await getDemoDashboardData();
                  const { clientStats } = demo.data;
                  
                  // Mapeo de demoData a API structure
                  const mappedKPIs = {
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
      
      // Estado para nuevas páginas
      salesHeatmap: null,
      topProducts: [],
      topProductsMetrics: null,

      fetchSalesHeatmap: async (weeks = 4) => {
        set({ loading: true, error: null });
        try {
            const response = await dashboardService.getSalesHeatmap(weeks);
            set({ salesHeatmap: response.data, loading: false });
        } catch(error) {
            console.error('❌ Dashboard: Error loading heatmap:', error.message);
            // Fallback mock (opcional, por ahora solo error)
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
        } catch(error) {
             console.error('❌ Dashboard: Error loading top products:', error.message);
             set({ error: error.message, loading: false });
        }
      },

      // Acción para cargar todos los datos del dashboard
      fetchDashboardData: async () => {
        set({ loading: true, error: null });
        
        try {
          // Cargar datos de la API real en paralelo de forma resiliente
          const results = await Promise.allSettled([
             dashboardService.getSummary(),
             dashboardService.getAlerts(),
             dashboardService.getRecentActivity()
          ]);

          const [summaryRes, alertsRes, activityRes] = results;

          // El resumen es crítico, si falla, lanzamos el error
          if (summaryRes.status === 'rejected') {
            throw summaryRes.reason;
          }

          // Alertas y actividad son opcionales/secundarios, si fallan usamos defaults
          const summaryData = summaryRes.value.data;
          
          const alertsData = alertsRes.status === 'fulfilled' 
            ? alertsRes.value.data.alerts 
            : [];
            
          if (alertsRes.status === 'rejected') {
            console.warn('⚠️ Dashboard: Falló la carga de alertas:', alertsRes.reason.message);
          }

          const activitiesData = activityRes.status === 'fulfilled' 
            ? activityRes.value.data.activities 
            : [];

          if (activityRes.status === 'rejected') {
            console.warn('⚠️ Dashboard: Falló la carga de actividad reciente:', activityRes.reason.message);
          }

          set({
            summary: summaryData,
            alerts: alertsData,
            activities: activitiesData,
            loading: false,
            error: null
          });
          
        } catch (error) {
          // Fallback silencioso a datos demo si está habilitado
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
                activities: charts.recentActivity,
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
