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
    // Actualización optimista de la interfaz para una UX instantánea y fluida
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isActive: !currentStatus } : v))
    );

    try {
      await variantService.updateVariant(id, { is_active: !currentStatus });
      toast.success("Estado de la variante actualizado");
      
      if (activeProductId) {
        try {
          await useProductStore.getState().refreshProductData(activeProductId.toString());
        } catch (e) {
          console.error("Error al refrescar detalles del producto tras cambio de estado:", e);
        }
      }
    } catch (error: any) {
      // Reversión del estado optimista en caso de error en el backend
      setVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isActive: currentStatus } : v))
      );
      toast.error(error.message || "Error al actualizar el estado de la variante");
    }
  };

  const createVariant = async (data: any) => {
    if (!activeProductId) return;
    try {
      const created = await variantService.createVariant(activeProductId.toString(), data);
      toast.success("Variante creada con éxito");
      
      // Actualización optimista instantánea
      if (created) {
        const optAttrs = Object.entries(created.variant_attributes || {}).map(([key, value]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value),
          bgColor: key.toLowerCase() === 'color' ? 'bg-secondary-container/50' : 'bg-surface-container',
          color: key.toLowerCase() === 'color' ? 'text-on-secondary-container' : 'text-on-surface-variant',
          borderColor: key.toLowerCase() === 'color' ? 'border-secondary-container' : 'border-outline-variant/30'
        }));
        
        const optVariant: VariantUI = {
          id: created.id,
          sku: created.sku || '-',
          name: created.variant_name || Object.values(created.variant_attributes || {}).join(' / ') || 'Variante',
          barcode: created.barcode || '-',
          attributes: optAttrs,
          stock: data.initial_stock || 0,
          price: data.initial_price || 0,
          isActive: created.is_active !== undefined ? created.is_active : true,
          lowStock: (data.initial_stock || 0) <= 5,
          raw_attributes: created.variant_attributes || {}
        };
        setVariants(prev => [...prev, optVariant]);
      }

      // Sincronización posterior con delay
      setTimeout(() => {
        fetchVariants();
      }, 1500);

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
      // Actualización optimista local
      setVariants((prev) =>
        prev.map((v) => {
          if (v.id === id) {
            const updatedAttrs = data.variant_attributes 
              ? Object.entries(data.variant_attributes).map(([key, value]) => ({
                  name: key.charAt(0).toUpperCase() + key.slice(1),
                  value: String(value),
                  bgColor: key.toLowerCase() === 'color' ? 'bg-secondary-container/50' : 'bg-surface-container',
                  color: key.toLowerCase() === 'color' ? 'text-on-secondary-container' : 'text-on-surface-variant',
                  borderColor: key.toLowerCase() === 'color' ? 'border-secondary-container' : 'border-outline-variant/30'
                }))
              : v.attributes;

            return {
              ...v,
              barcode: data.barcode !== undefined ? (data.barcode || '-') : v.barcode,
              stock: data.initial_stock !== undefined ? data.initial_stock : v.stock,
              price: data.initial_price !== undefined ? data.initial_price : v.price,
              attributes: updatedAttrs,
              raw_attributes: data.variant_attributes || v.raw_attributes
            };
          }
          return v;
        })
      );

      await variantService.updateVariant(id, data);
      toast.success("Variante actualizada con éxito");

      // Sincronización posterior con delay
      setTimeout(() => {
        fetchVariants();
      }, 1500);

      if (activeProductId) {
        try {
          await useProductStore.getState().refreshProductData(activeProductId.toString());
        } catch (e) {
          console.error("Error refreshing product details after edit:", e);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar variante");
      fetchVariants();
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
