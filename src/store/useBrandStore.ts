import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { brandService } from '@/services/brandService';

export interface Brand {
  id: number | string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  isActive: boolean;
  icon?: string;
  // If the backend has other fields
  [key: string]: any;
}

interface BrandState {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  fetchBrands: () => Promise<Brand[]>;
  createBrand: (brandData: Partial<Brand>) => Promise<Brand>;
  updateBrand: (id: number | string, brandData: Partial<Brand>) => Promise<Brand>;
  deleteBrand: (id: number | string) => Promise<void>;
}

export const useBrandStore = create<BrandState>()(
  devtools(
    (set, get) => ({
      brands: [],
      loading: false,
      error: null,

      fetchBrands: async () => {
        set({ loading: true, error: null });
        try {
          const data = await brandService.getAll();
          set({ brands: data || [], loading: false });
          return data;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      createBrand: async (brandData) => {
        set({ loading: true, error: null });
        try {
          const result = await brandService.create(brandData);
          await get().fetchBrands();
          set({ loading: false });
          return result;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateBrand: async (id, brandData) => {
        set({ loading: true, error: null });
        try {
          const result = await brandService.update(id, brandData);
          await get().fetchBrands();
          set({ loading: false });
          return result;
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteBrand: async (id) => {
        set({ loading: true, error: null });
        try {
          await brandService.delete(id);
          await get().fetchBrands();
          set({ loading: false });
        } catch (error: any) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },
    }),
    { name: 'BrandStore' }
  )
);

export default useBrandStore;
