import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { clientService } from '../services/clientService';
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
          // Cargar estadísticas de clientes
          const clientResult = await clientService.getStatistics();
          if (clientResult.success !== false) {
            set({ clientStats: (clientResult.data || clientResult).client_statistics });
          }

          // TODO: Cargar estadísticas de productos y ventas cuando los servicios estén listos
          // const productResult = await productService.getStatistics();
          // const salesResult = await saleService.getStatistics();

          // Datos de ejemplo por ahora
          set({
            productStats: { total: 1253, lowStock: 4 },
            salesStats: { today: 147, total: 125430, trend: 12.5 },
          });

          set({ loading: false });
        } catch (error) {
          set({ error: error.message, loading: false });
        }
      },
    }),
    { name: 'dashboard-store' }
  )
);

export default useDashboardStore;
