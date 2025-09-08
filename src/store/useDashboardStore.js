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

const useDashboardStore = create()(
  devtools(
    (set) => ({
      // Estado de las métricas
      clientStats: null,
      productStats: null, // Placeholder
      salesStats: null, // Placeholder
      
      // Estados de carga y error
      loading: false,
      error: null,

      // Acción para cargar todos los datos del dashboard
      fetchDashboardData: async () => {
        set({ loading: true, error: null });
        
        try {
          // Si demo está habilitado, usar datos demo
          if (DEMO_CONFIG_DASHBOARD.enabled && !DEMO_CONFIG_DASHBOARD.useRealAPI) {
            // Cargar datos demo de forma paralela
            const [clientResult, productResult, salesResult] = await Promise.all([
              getDemoClientStats(),
              getDemoProductStats(), 
              getDemoSalesStats()
            ]);
            
            set({
              clientStats: clientResult.data.client_statistics,
              productStats: productResult.data.product_statistics,
              salesStats: salesResult.data.sales_statistics,
              loading: false
            });
            return;
          }
          
          // Si demo está deshabilitado, usar API real
          
          // Cargar estadísticas de clientes
          const clientResult = await clientService.getStatistics();
          if (clientResult.success !== false) {
            set({ clientStats: (clientResult.data || clientResult).client_statistics });
          }

          // TODO: Cargar estadísticas de productos y ventas cuando los servicios estén listos
          // const productResult = await productService.getStatistics();
          // const salesResult = await saleService.getStatistics();

          // Datos de ejemplo para API real (temporal)
          set({
            productStats: { total: 1253, lowStock: 4 },
            salesStats: { today: 147, total: 125430, trend: 12.5 },
          });

          set({ loading: false });
          // Dashboard API data loaded successfully
          
        } catch (error) {
          console.error('❌ Dashboard: Error loading data:', error.message);
          
          // Si falla la API y demo está habilitado como fallback
          if (DEMO_CONFIG_DASHBOARD.enabled) {
            console.log('🔄 Dashboard: Falling back to demo data...');
            const demoData = await getDemoDashboardData();
            set({
              clientStats: demoData.data.clientStats,
              productStats: demoData.data.productStats,
              salesStats: demoData.data.salesStats,
              loading: false,
              error: null // Clear error since we have fallback data
            });
            // Dashboard fallback data loaded
          } else {
            set({ error: error.message, loading: false });
          }
        }
      },
    }),
    { name: 'dashboard-store' }
  )
);

export default useDashboardStore;
