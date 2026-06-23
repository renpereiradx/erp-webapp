import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { useBrandStore } from '@/store/useBrandStore';
import { Brand } from '../types/brand';

export function useBrands() {
  const { brands, loading, error, fetchBrands, createBrand, updateBrand, deleteBrand } = useBrandStore();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const selectedBrand = useMemo(() => {
    if (!selectedBrandId) return null;
    if (selectedBrandId === 'new') return { id: 'new' as const } as unknown as Brand;
    return brands.find((b) => b.id === selectedBrandId || String(b.id) === selectedBrandId) || null;
  }, [brands, selectedBrandId]);

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const lowerQuery = searchQuery.toLowerCase();
    return brands.filter(
      (b) =>
        b.name?.toLowerCase().includes(lowerQuery) ||
        b.description?.toLowerCase().includes(lowerQuery) ||
        b.slug?.toLowerCase().includes(lowerQuery)
    );
  }, [brands, searchQuery]);

  const handleSelectBrand = (id: string) => {
    setSelectedBrandId(String(id));
  };

  const handleCreateNew = () => {
    setSelectedBrandId('new');
  };

  const handleSaveBrand = async (brandData: Partial<Brand>) => {
    try {
      if (selectedBrandId === 'new') {
        const result = await createBrand(brandData);
        setSelectedBrandId(String(result.id));
        toast.success('Marca creada exitosamente');
      } else if (selectedBrandId) {
        await updateBrand(selectedBrandId, brandData);
        toast.success('Marca actualizada exitosamente');
      }
    } catch (err: any) {
      console.error('Error saving brand:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Error al guardar la marca');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      await deleteBrand(id);
      if (selectedBrandId === String(id)) {
        setSelectedBrandId(null);
      }
      toast.success('Marca eliminada exitosamente');
    } catch (err: any) {
      console.error('Error deleting brand:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Error al eliminar la marca');
    }
  };

  const handleCloseDetail = () => {
    setSelectedBrandId(null);
  };

  return {
    brands: filteredBrands,
    totalBrands: brands.length,
    selectedBrandId,
    selectedBrand,
    searchQuery,
    setSearchQuery,
    handleSelectBrand,
    handleCreateNew,
    handleSaveBrand,
    handleDeleteBrand,
    handleCloseDetail,
    loading,
    error,
  };
}

