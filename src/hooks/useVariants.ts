import { useState, useEffect, useCallback, useMemo } from 'react';
import { variantService } from '../services/variantService';
import { toast } from 'sonner';
import { useBranch } from '../contexts/BranchContext';
import { apiClient } from '../services/api';
import useProductStore from '../store/useProductStore';

export interface VariantAttributeUI {
  name: string;
  value: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

export interface VariantUI {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  attributes: VariantAttributeUI[];
  stock: number | string;
  price: number | string;
  isActive: boolean;
  isActive: boolean;
  lowStock?: boolean;
  raw_attributes: Record<string, string>;
}

export const useVariants = () => {
  const [variants, setVariants] = useState<VariantUI[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | number | null>(null);
  const [productData, setProductData] = useState<any>(null);
  const { currentBranch } = useBranch();

  const fetchVariants = useCallback(async () => {
    try {
      setLoading(true);
      // Hack provisional: Obtener el primer producto disponible para demostrar la matriz de variantes
      let productId = activeProductId;
      
      if (!productId) {
        setLoading(false);
        return;
      }

      // 1. Fetch Variantes Enriquecidas (con stock y precio)
      const enrichedVariants = await variantService.getEnrichedVariants(productId!.toString(), currentBranch?.id, true);

      // 3. Transform
      const transformed: VariantUI[] = enrichedVariants.map((v: any) => {
        let stock = v.stock_quantity || 0;
        const attrs: VariantAttributeUI[] = Object.entries(v.variant_attributes || {}).map(([key, value]) => {
          return {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value),
            bgColor: key.toLowerCase() === 'color' ? 'bg-secondary-container/50' : 'bg-surface-container',
            color: key.toLowerCase() === 'color' ? 'text-on-secondary-container' : 'text-on-surface-variant',
            borderColor: key.toLowerCase() === 'color' ? 'border-secondary-container' : 'border-outline-variant/30'
          };
        });

        return {
          id: v.id,
          sku: v.sku || '-',
          name: v.variant_name || '',
          barcode: v.barcode || '-',
          attributes: attrs,
          stock: stock,
          price: v.current_price || 0,
          isActive: v.is_active,
          lowStock: stock <= 5,
          raw_attributes: v.variant_attributes || {}
        };
      });

      setVariants(transformed);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar variantes');
    } finally {
      setLoading(false);
    }
  }, [activeProductId, currentBranch]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  const filteredVariants = useMemo(() => {
    if (!searchTerm) return variants;
    const lower = searchTerm.toLowerCase();
    return variants.filter(
      (v) => v.name.toLowerCase().includes(lower) || v.sku.toLowerCase().includes(lower) || v.barcode.toLowerCase().includes(lower)
    );
  }, [variants, searchTerm]);

  const toggleVariantStatus = async (id: string, currentStatus: boolean) => {
    try {
      await variantService.updateVariant(id, { is_active: !currentStatus });
      toast.success("Estado actualizado");
      setVariants((prev) => prev.map((v) => v.id === id ? { ...v, isActive: !currentStatus } : v));
      if (activeProductId) {
        try {
          await useProductStore.getState().refreshProductData(activeProductId.toString());
        } catch (e) {
          console.error("Error refreshing product details after status change:", e);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar estado");
    }
  };

  const createVariant = async (data: any) => {
    if (!activeProductId) return;
    try {
      await variantService.createVariant(activeProductId.toString(), data);
      toast.success("Variante creada con éxito");
      await fetchVariants();
      try {
        await useProductStore.getState().refreshProductData(activeProductId.toString());
      } catch (e) {
        console.error("Error refreshing product details after creation:", e);
      }
    } catch (error: any) {
      toast.error(error.message || "Error al crear variante");
      throw error;
    }
  };

  const editVariant = async (id: string, data: any) => {
    try {
      await variantService.updateVariant(id, data);
      toast.success("Variante actualizada con éxito");
      await fetchVariants();
      if (activeProductId) {
        try {
          await useProductStore.getState().refreshProductData(activeProductId.toString());
        } catch (e) {
          console.error("Error refreshing product details after edit:", e);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar variante");
      throw error;
    }
  };

  return {
    variants: filteredVariants,
    searchTerm,
    setSearchTerm,
    toggleVariantStatus,
    loading,
    productData,
    createVariant,
    editVariant,
    setActiveProductId
  };
};
