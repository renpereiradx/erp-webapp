import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { dashboardService } from '../services/bi/dashboardService';
import { receivablesService } from '../services/bi/receivablesService';
import { payablesService } from '../services/bi/payablesService';
import { salesAnalyticsService } from '../services/bi/salesAnalyticsService';
import profitabilityService from '../services/bi/profitabilityService';
import { hasStoredPermission } from '../utils/userPermissions';

// Interfaces para el estado del Dashboard
export interface DashboardSummary {
  sales?: {
    total: number;
    count: number;
    average_ticket: number;
    currency: string;
    trend?: number;
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
    days_of_inventory: number;
    stockout_rate: number;
  };
  budget_kpis: {
    budget_to_sale_conversion: number;
    average_budget_value: number;
    expired_budgets: number;
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
  trend_percentage?: number;
  brand_id?: number;
  brand_name?: string;
  tags?: string[];
}

/** D2 (PLAN_ALINEACION_BI_FRONTEND): loading/error por recurso — los 4
 * fetchers ya no se pisan el estado entre sí. */
export type DashboardSlice = 'dashboard' | 'kpis' | 'heatmap' | 'topProducts';

export interface DashboardSliceFlags {
  dashboard: boolean;
  kpis: boolean;
  heatmap: boolean;
  topProducts: boolean;
}

export interface DashboardSliceErrors {
  dashboard: string | null;
  kpis: string | null;
  heatmap: string | null;
  topProducts: string | null;
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

  // D2: estados de carga y error POR RECURSO
  loadingBySlice: DashboardSliceFlags;
  errorBySlice: DashboardSliceErrors;

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
  fetchDashboardData: (period?: string) => Promise<void>;
}

// H3 (audit react): guard anti-carrera. Cambiar hoy/mes/año rápido resolvía
// en cualquier orden y la respuesta vieja pisaba al estado con el período
// equivocado (sin abort ni comparación). Cada fetcher lleva un contador de
// secuencia: una resolución cuya solicitud ya no es la última se descarta.
let seqDashboard = 0;
let seqKPIs = 0;
let seqHeatmap = 0;
let seqTopProducts = 0;

const INITIAL_SLICE_FLAGS: DashboardSliceFlags = {
  dashboard: false,
  kpis: false,
  heatmap: false,
  topProducts: false,
};

const INITIAL_SLICE_ERRORS: DashboardSliceErrors = {
  dashboard: null,
  kpis: null,
  heatmap: null,
  topProducts: null,
};

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
      loadingBySlice: { ...INITIAL_SLICE_FLAGS },
      errorBySlice: { ...INITIAL_SLICE_ERRORS },
      salesHeatmap: null,
      topProducts: [],
      topProductsMetrics: null,

      // Acción para cargar los KPIs detallados
      fetchKPIData: async (period = 'month') => {
        const requestId = ++seqKPIs;
        set({ loadingBySlice: { ...INITIAL_SLICE_FLAGS, kpis: true }, errorBySlice: { ...INITIAL_SLICE_ERRORS } });
        try {
          const response = await dashboardService.getKPIs({ period });
          // NOTE: the API returns KPIData[] while the state models DashboardKPIs
          // (contract drift pending BI unification) - cast keeps both paths typed
          if (requestId !== seqKPIs) return; // llegó otra solicitud: descartar
          set({ kpis: response.data as unknown as DashboardKPIs, loadingBySlice: { ...INITIAL_SLICE_FLAGS } });
        } catch (error: any) {
          if (requestId !== seqKPIs) return;
          // D1: sin fallback demo — el error se expone a la página.
          console.error('❌ Dashboard: Error loading KPIs:', error.message);
          set({
            loadingBySlice: { ...INITIAL_SLICE_FLAGS },
            errorBySlice: { ...INITIAL_SLICE_ERRORS, kpis: error.message },
          });
        }
      },

      fetchSalesHeatmap: async (weeks = 4) => {
        const requestId = ++seqHeatmap;
        set({ loadingBySlice: { ...INITIAL_SLICE_FLAGS, heatmap: true }, errorBySlice: { ...INITIAL_SLICE_ERRORS } });
        try {
          const response = await dashboardService.getSalesHeatmap({ weeks });
          if (requestId !== seqHeatmap) return;
          set({ salesHeatmap: response.data, loadingBySlice: { ...INITIAL_SLICE_FLAGS } });
        } catch (error: any) {
          if (requestId !== seqHeatmap) return;
          // D1: sin heatmap fabricado — el error se expone a la página.
          console.error('❌ Dashboard: Error loading heatmap:', error.message);
          set({
            loadingBySlice: { ...INITIAL_SLICE_FLAGS },
            errorBySlice: { ...INITIAL_SLICE_ERRORS, heatmap: error.message },
          });
        }
      },

      fetchTopProducts: async (period = 'week', limit = 10, sortBy = 'revenue') => {
        const requestId = ++seqTopProducts;
        set({ loadingBySlice: { ...INITIAL_SLICE_FLAGS, topProducts: true }, errorBySlice: { ...INITIAL_SLICE_ERRORS } });
        try {
          const response = await dashboardService.getTopProducts({ period, limit, sort_by: sortBy });
          if (requestId !== seqTopProducts) return;
          set({
            topProducts: response.data.products,
            topProductsMetrics: {
              total_revenue: response.data.total_revenue,
              total_profit: response.data.total_profit,
            },
            loadingBySlice: { ...INITIAL_SLICE_FLAGS },
          });
        } catch (error: any) {
          if (requestId !== seqTopProducts) return;
          // D1: sin productos demo — el error se expone a la página.
          console.error('❌ Dashboard: Error loading top products:', error.message);
          set({
            loadingBySlice: { ...INITIAL_SLICE_FLAGS },
            errorBySlice: { ...INITIAL_SLICE_ERRORS, topProducts: error.message },
          });
        }
      },

      fetchDashboardData: async (period = 'month') => {
        const requestId = ++seqDashboard;
        set({ loadingBySlice: { ...INITIAL_SLICE_FLAGS, dashboard: true }, errorBySlice: { ...INITIAL_SLICE_ERRORS } });

        try {
          // Gate por permiso: los roles acotados (p. ej. VNDR01 §4.1 del
          // PLAN_VENDOR_ROLE) no tienen analytics:read ni payables:read; pedir
          // esos endpoints igual dispara 403 con toasts de error. Sin lista
          // persistida se comporta como antes (fail-open a propósito).
          const results = await Promise.allSettled([
            dashboardService.getSummary({ period }),
            dashboardService.getAlerts(),
            dashboardService.getRecentActivity(),
            dashboardService.getTrends({ period }),
            hasStoredPermission('analytics:read')
              ? profitabilityService.getTrends({ period })
              : Promise.resolve({ data: null }),
            hasStoredPermission('receivables:read')
              ? receivablesService.getOverview({ period })
              : Promise.resolve({ data: null }),
            hasStoredPermission('payables:read')
              ? payablesService.getOverview({ period })
              : Promise.resolve({ data: null }),
            hasStoredPermission('analytics:read')
              ? salesAnalyticsService.getPerformance({ period, compare: true })
              : Promise.resolve({ data: null }),
          ]);

          const [
            summaryRes,
            alertsRes,
            activityRes,
            trendsRes,
            profitTrendsRes,
            receivablesRes,
            payablesRes,
            salesPerfRes,
          ] = results;

          if (summaryRes.status === 'rejected') {
            throw summaryRes.reason;
          }

          // NA-DB-1 (auditoría BI 2C): guardar el payload (.data), no el
          // envelope {success, data} — el envelope dejaba el Resumen
          // Ejecutivo en Gs. 0 con la API llena.
          const summaryData = summaryRes.value.data;

          const alertsData =
            alertsRes.status === 'fulfilled' ? (alertsRes.value.data as any).alerts || [] : [];

          const activitiesData =
            activityRes.status === 'fulfilled' ? (activityRes.value.data as any).activities || [] : [];

          const trendsData = trendsRes.status === 'fulfilled' ? trendsRes.value.data : null;

          const profitTrendsData = profitTrendsRes.status === 'fulfilled' ? profitTrendsRes.value.data : null;

          const receivablesData = receivablesRes.status === 'fulfilled' ? receivablesRes.value.data : null;

          // Mismo desenvuelto que receivablesData: payment_rate vive en .data.
          // El gate por permiso introduce la unión FinancialOverview |
          // {data: null} — normalizo a payload o null.
          const payablesData =
            payablesRes.status === 'fulfilled'
              ? ((payablesRes.value as { data?: unknown }).data ?? null)
              : null;

          const salesPerfData = salesPerfRes.status === 'fulfilled' ? salesPerfRes.value.data : null;

          // H3: solo el último período solicitado pinta el store
          if (requestId !== seqDashboard) return;

          set({
            summary: summaryData,
            alerts: alertsData,
            activities: activitiesData,
            trends: trendsData,
            profitabilityTrends: profitTrendsData,
            receivablesOverview: receivablesData,
            payablesOverview: payablesData,
            salesPerformance: salesPerfData,
            loadingBySlice: { ...INITIAL_SLICE_FLAGS },
            errorBySlice: { ...INITIAL_SLICE_ERRORS },
          });
        } catch (error: any) {
          // H3: una solicitud vieja no pinta el error.
          // D1: sin mock demo — el error se expone a la página.
          if (requestId !== seqDashboard) return;
          console.error('❌ Dashboard: Error loading data:', error.message);
          set({
            loadingBySlice: { ...INITIAL_SLICE_FLAGS },
            errorBySlice: { ...INITIAL_SLICE_ERRORS, dashboard: error.message },
          });
        }
      },
    }),
    { name: 'dashboard-store' }
  )
);

export default useDashboardStore;
