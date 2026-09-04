import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/lib/i18n'
import useTaxRateStore from '@/store/useTaxRateStore'
import { taxClassificationService } from '@/services/taxClassificationService'
import { productService } from '@/services/productService'

import type { SifenCodeInfo } from '@/types'

const GENERAL_CODE = 'GENERAL'

interface SifenClassificationTarget {
  id: number | string
  name: string
  default_tax_rate_id?: number | null
}

/**
 * Orquestación SIFEN para una categoría: códigos disponibles, clasificación
 * detectada en sus productos y aplicación masiva.
 */
export function useSifenClassification(selectedCategory: SifenClassificationTarget | null | undefined) {
  const { t } = useI18n()
  const { taxRates, fetchTaxRates, loading: loadingRates } = useTaxRateStore()
  const [sifenCodes, setSifenCodes] = useState<SifenCodeInfo[]>([])
  const [selectedSifenCode, setSelectedSifenCode] = useState('')
  const [detectedSifenCode, setDetectedSifenCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [checkingClassification, setCheckingClassification] = useState(false)
  const [loadingCodes, setLoadingCodes] = useState(false)

  useEffect(() => {
    fetchTaxRates().catch(() => {})

    setLoadingCodes(true)
    taxClassificationService
      .getInfo()
      .then((res) => {
        const codes = Array.isArray(res) ? res : res?.data || []
        setSifenCodes(codes)
      })
      .catch((err) => {
        console.error('Error al cargar códigos SIFEN:', err)
        toast.error(t('categories.tax.toast.load_codes_error'))
      })
      .finally(() => {
        setLoadingCodes(false)
      })
  }, [fetchTaxRates, t])

  // Clasificación actual detectada en los productos de la categoría.
  useEffect(() => {
    if (selectedCategory?.id) {
      setCheckingClassification(true)
      setDetectedSifenCode('')

      productService
        .searchAdvanced({ category_id: Number(selectedCategory.id), page_size: 1 })
        .then(async (res) => {
          const products = res.data || []
          if (products.length === 0) return
          const firstProduct = products[0]
          const productId = firstProduct.id || firstProduct.product_id

          try {
            const classification = await taxClassificationService.getByProductId(String(productId))
            if (classification?.classification_code) {
              setDetectedSifenCode(classification.classification_code)
            }
          } catch {
            // El producto de muestra no tiene clasificación fiscal activa: estado válido.
          }
        })
        .catch((err) => {
          console.error('Error al buscar productos para clasificar:', err)
        })
        .finally(() => {
          setCheckingClassification(false)
        })
    } else {
      setDetectedSifenCode('')
      setCheckingClassification(false)
    }
  }, [selectedCategory?.id])

  // Pre-selección: detectado en productos > tasa default de la categoría > GENERAL.
  useEffect(() => {
    if (detectedSifenCode) {
      setSelectedSifenCode(detectedSifenCode)
      return
    }
    if (!selectedCategory || sifenCodes.length === 0) {
      setSelectedSifenCode('')
      return
    }
    const defaultRateId = selectedCategory.default_tax_rate_id
    if (!defaultRateId) {
      setSelectedSifenCode('')
      return
    }
    const matchedCode = sifenCodes.find((c) => c.default_tax_rate_id === defaultRateId)
    setSelectedSifenCode(matchedCode ? matchedCode.code : GENERAL_CODE)
  }, [selectedCategory, sifenCodes, detectedSifenCode])

  const defaultRate = useMemo(() => {
    if (!selectedCategory?.default_tax_rate_id) return null
    const rate = taxRates.find((r: any) => r.id === selectedCategory.default_tax_rate_id)
    return rate ? rate.rate : null
  }, [selectedCategory?.default_tax_rate_id, taxRates])

  const autoClassify = useCallback(async (): Promise<boolean> => {
    if (!selectedCategory || !selectedSifenCode) return false
    setApplying(true)

    try {
      const res = await taxClassificationService.autoClassify({
        category_id: Number(selectedCategory.id),
        classification_code: selectedSifenCode,
      })

      if (res.success) {
        toast.success(
          t('categories.tax.toast.applied', {
            code: selectedSifenCode,
            count: res.classified_count || 0,
          }),
        )
      } else {
        toast.success(t('categories.tax.toast.executed', { code: selectedSifenCode }))
      }
      setDetectedSifenCode(selectedSifenCode)
      return true
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || t('categories.tax.toast.apply_error'))
      return false
    } finally {
      setApplying(false)
    }
  }, [selectedCategory, selectedSifenCode, t])

  return {
    taxRates,
    sifenCodes,
    selectedSifenCode,
    setSelectedSifenCode,
    detectedSifenCode,
    defaultRate,
    loading: loadingRates || loadingCodes,
    applying,
    checkingClassification,
    autoClassify,
  }
}

export type UseSifenClassificationReturn = ReturnType<typeof useSifenClassification>
