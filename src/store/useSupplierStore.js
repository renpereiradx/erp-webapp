import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supplierService } from '@/services/supplierService';
import { telemetry } from '@/utils/telemetry';

// Clasificar un mensaje de error rudimentariamente a un código estandarizado
function classifyError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('network') || m.includes('conex')) return 'NETWORK';
  if (m.includes('timeout')) return 'TIMEOUT';
  if (m.includes('valid')) return 'VALIDATION';
  if (m.includes('unauthorized') || m.includes('auth')) return 'UNAUTHORIZED';
  if (m.includes('not found')) return 'NOT_FOUND';
  return 'UNKNOWN';
}

// Retry ligero con backoff exponencial + jitter similar al usado en Products
async function withRetry(fn, { retries = 2, baseDelay = 180 } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, delay));
      attempt += 1;
    }
  }
}

const useSupplierStore = create(
  devtools(
    (set, get) => ({
      suppliers: [],
      loading: false,
      error: null,
      pagination: {},

      clearSuppliers: () => set({ suppliers: [], pagination: {}, error: null }),

      fetchSuppliers: async (page = 1, pageSize = 10, search = '') => {
        const started = performance.now?.() || Date.now();
        set({ loading: true, error: null });
        try {
          const result = await withRetry(() => supplierService.getSuppliers({ page, limit: pageSize, search }));
          let normalized = result;
          if (!normalized) normalized = { success: false, data: null, error: 'Respuesta vacía del servicio' };
          if (normalized.success === false) {
            const code = classifyError(normalized.error);
            telemetry.record?.('feature.suppliers.error', { code, page, search: !!search, latencyMs: (performance.now?.() || Date.now()) - started });
            set({ error: normalized.error || 'Error al obtener proveedores', loading: false });
            return;
          }
          const raw = normalized.data;
          const hasPagination = raw && typeof raw === 'object' && Array.isArray(raw.data) && raw.pagination;
          let list = [];
          if (hasPagination) list = Array.isArray(raw.data) ? raw.data : [];
          else if (Array.isArray(raw)) list = raw;
          else if (raw && Array.isArray(raw.results)) list = raw.results;
          else if (raw && typeof raw === 'object') list = [raw];
          const safeList = list.filter(Boolean);
          set({
            suppliers: safeList,
            pagination: hasPagination ? raw.pagination : { current_page: page, per_page: safeList.length, total: safeList.length, total_pages: 1 },
            loading: false,
          });
          telemetry.record?.('feature.suppliers.load', { page, count: safeList.length, search: !!search, latencyMs: (performance.now?.() || Date.now()) - started });
        } catch (err) {
          const code = classifyError(err.message);
            telemetry.record?.('feature.suppliers.error', { code, page, search: !!search, latencyMs: (performance.now?.() || Date.now()) - started });
          set({ error: err.message || 'Error inesperado al obtener proveedores', loading: false });
        }
      },

      createSupplier: async (supplierData) => {
        set({ loading: true });
        const started = performance.now?.() || Date.now();
        try {
          const result = await withRetry(() => supplierService.createSupplier(supplierData));
          if (result && result.success === false) throw new Error(result.error || 'Error al crear el proveedor');
          const newSupplier = result?.data ?? result;
          set((state) => ({ suppliers: [...state.suppliers, newSupplier], loading: false }));
          telemetry.record?.('feature.suppliers.create', { latencyMs: (performance.now?.() || Date.now()) - started });
          return newSupplier;
        } catch (error) {
          telemetry.record?.('feature.suppliers.error', { code: classifyError(error.message), op: 'create', latencyMs: (performance.now?.() || Date.now()) - started });
          set({ loading: false, error: error.message || 'Error al crear el proveedor' });
          throw error;
        }
      },

      updateSupplier: async (id, supplierData) => {
        set({ loading: true });
        const started = performance.now?.() || Date.now();
        try {
          const result = await withRetry(() => supplierService.updateSupplier(id, supplierData));
          if (result && result.success === false) throw new Error(result.error || 'Error al actualizar el proveedor');
          const updatedSupplier = result?.data ?? result;
          set((state) => ({ suppliers: state.suppliers.map((s) => (s.id === id ? updatedSupplier : s)), loading: false }));
          telemetry.record?.('feature.suppliers.update-success', { latencyMs: (performance.now?.() || Date.now()) - started });
          return updatedSupplier;
        } catch (error) {
          telemetry.record?.('feature.suppliers.error', { code: classifyError(error.message), op: 'update', latencyMs: (performance.now?.() || Date.now()) - started });
          set({ loading: false, error: error.message || 'Error al actualizar el proveedor' });
          throw error;
        }
      },

      deleteSupplier: async (id) => {
        set({ loading: true });
        const started = performance.now?.() || Date.now();
        try {
          const result = await withRetry(() => supplierService.deleteSupplier(id));
          if (result && result.success === false) throw new Error(result.error || 'Error al eliminar el proveedor');
          set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id), loading: false }));
          telemetry.record?.('feature.suppliers.delete-success', { latencyMs: (performance.now?.() || Date.now()) - started });
          return true;
        } catch (error) {
          telemetry.record?.('feature.suppliers.error', { code: classifyError(error.message), op: 'delete', latencyMs: (performance.now?.() || Date.now()) - started });
          set({ loading: false, error: error.message || 'Error al eliminar el proveedor' });
          throw error;
        }
      },
    }),
    { name: 'supplier-store' }
  )
);

export default useSupplierStore;
