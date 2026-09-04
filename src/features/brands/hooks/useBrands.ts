import { useState, useMemo, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/lib/i18n'
import { useBrandStore } from '@/store/useBrandStore'
import type { Brand } from '../types/brand'

export function useBrands() {
  const { t } = useI18n()
  const { brands, loading, error, fetchBrands, createBrand, updateBrand, deleteBrand } =
    useBrandStore()
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    fetchBrands()
      .then(() => setLoadError(null))
      .catch((err: any) => {
        console.error('Error fetching brands:', err)
        setLoadError(err?.message || t('brands.toast.load_error'))
      })
  }, [fetchBrands, t])

  const selectedBrand = useMemo(() => {
    if (!selectedBrandId) return null
    if (selectedBrandId === 'new') return { id: 'new' as const } as unknown as Brand
    return brands.find((b) => b.id === selectedBrandId || String(b.id) === selectedBrandId) || null
  }, [brands, selectedBrandId])

  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands
    const lowerQuery = searchQuery.toLowerCase()
    return brands.filter(
      (b) =>
        b.name?.toLowerCase().includes(lowerQuery) ||
        b.description?.toLowerCase().includes(lowerQuery) ||
        b.slug?.toLowerCase().includes(lowerQuery),
    )
  }, [brands, searchQuery])

  const handleSelectBrand = useCallback((id: string) => {
    setSelectedBrandId(String(id))
  }, [])

  const handleCreateNew = useCallback(() => {
    setSelectedBrandId('new')
  }, [])

  const handleSaveBrand = async (brandData: Partial<Brand>) => {
    try {
      if (selectedBrandId === 'new') {
        const result = await createBrand(brandData)
        setSelectedBrandId(String(result.id))
        toast.success(t('brands.toast.created'))
      } else if (selectedBrandId) {
        await updateBrand(selectedBrandId, brandData)
        toast.success(t('brands.toast.updated'))
      }
    } catch (err: any) {
      console.error('Error saving brand:', err)
      toast.error(err?.response?.data?.message || err?.message || t('brands.toast.save_error'))
    }
  }

  const handleDeleteBrand = async (id: string) => {
    try {
      await deleteBrand(id)
      if (selectedBrandId === String(id)) {
        setSelectedBrandId(null)
      }
      toast.success(t('brands.toast.deleted'))
    } catch (err: any) {
      console.error('Error deleting brand:', err)
      toast.error(err?.response?.data?.message || err?.message || t('brands.toast.delete_error'))
    }
  }

  const handleCloseDetail = useCallback(() => {
    setSelectedBrandId(null)
  }, [])

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
    error: loadError ?? (error && typeof error === 'string' ? error : null),
    refetch: fetchBrands,
  }
}
