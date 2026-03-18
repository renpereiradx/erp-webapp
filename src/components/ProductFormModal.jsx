import { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'
import useProductStore from '../store/useProductStore'
import BusinessManagementAPI from '../services/BusinessManagementAPI'
import { getGroupedUnitOptions } from '../constants/units'
import { X, Save, Trash2, AlertTriangle, Package, Info, ChevronDown, CheckCircle2, Plus, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

/**
 * ProductFormModal Component
 * Rediseñado con Tailwind CSS siguiendo fielmente Fluent Design System 2
 */
export default function ProductFormModal({ isOpen, onClose, product = null }) {
  const { t } = useI18n()
  const { createProduct, updateProduct, deleteProduct } = useProductStore()
  const apiClient = new BusinessManagementAPI()

  const isEditMode = product !== null

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    productType: 'PHYSICAL',
    description: '',
    barcode: '',
    brand: '',
    origin: '',
    base_unit: 'unit',
    taxRateId: '',
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [categories, setCategories] = useState([])
  const [taxRates, setTaxRates] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingTaxRates, setLoadingTaxRates] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      loadTaxRates()
    }
  }, [isOpen])

  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const { categoryService } = await import('../services/categoryService')
      const response = await categoryService.getAll()
      setCategories(Array.isArray(response) ? response : [])
    } catch (error) {
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadTaxRates = async () => {
    setLoadingTaxRates(true)
    try {
      const { taxRateService } = await import('../services/taxRateService')
      const response = await taxRateService.getPaginated(1, 50)
      setTaxRates(Array.isArray(response) ? response : [])
    } catch (error) {
      setTaxRates([])
    } finally {
      setLoadingTaxRates(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          name: product.product_name || product.name || '',
          category: product.category_id?.toString() || product.id_category?.toString() || '',
          productType: product.product_type || 'PHYSICAL',
          description: product.description || '',
          barcode: product.barcode || '',
          brand: product.brand || '',
          origin: product.origin || '',
          base_unit: product.base_unit || 'unit',
          taxRateId: product.tax_rate_id?.toString() || '',
        })
      } else {
        setFormData({
          name: '', category: '', productType: 'PHYSICAL', description: '',
          barcode: '', brand: '', origin: '', base_unit: 'unit', taxRateId: '',
        })
      }
      setErrors({})
    }
  }, [isOpen, product])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = t('products.modal.error.name_required')
    if (!formData.category) newErrors.category = t('products.modal.error.category_required')
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      const productData = {
        name: formData.name.trim(),
        category_id: parseInt(formData.category),
        description: formData.description.trim(),
        product_type: formData.productType,
        barcode: formData.barcode?.trim() || undefined,
        brand: formData.brand?.trim() || undefined,
        origin: formData.origin || undefined,
        base_unit: formData.base_unit || 'unit',
        override_tax_rate_id: formData.taxRateId ? parseInt(formData.taxRateId) : undefined,
      }
      const productId = product?.product_id || product?.id
      if (isEditMode) await updateProduct(productId, productData)
      else await createProduct(productData)
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditMode) return
    setIsDeleting(true)
    try {
      const productId = product.product_id || product.id
      await deleteProduct(productId)
      setShowDeleteConfirm(false)
      onClose()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  const labelClass = "text-xs font-semibold text-[#616161] mb-1.5 flex items-center gap-1 uppercase tracking-wider"
  const inputClass = "w-full h-10 px-3 bg-white border border-[#d1d1d1] rounded-[4px] text-sm text-[#242424] outline-none focus:border-[#106ebe] focus:ring-[1px] focus:ring-[#106ebe] transition-all placeholder:text-[#bdbdbd]"
  const selectClass = "w-full h-10 px-3 bg-white border border-[#d1d1d1] rounded-[4px] text-sm text-[#242424] outline-none focus:border-[#106ebe] focus:ring-[1px] focus:ring-[#106ebe] transition-all appearance-none cursor-pointer"

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="bg-[#fafafa] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#eff6fc] rounded-lg flex items-center justify-center text-[#106ebe]">
              {isEditMode ? <Package size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#242424] tracking-tight">
                {isEditMode ? t('products.modal.edit.title') : t('products.modal.create.title')}
              </h2>
              <p className="text-[11px] text-[#616161] font-medium uppercase tracking-wide">
                {isEditMode ? t('products.modal.edit.subtitle') : t('products.modal.create.subtitle')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Seccion Principal (Información Básica) */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50">
                    <Info size={16} className="text-[#106ebe]" />
                    <h3 className="text-sm font-bold text-[#242424] uppercase tracking-widest">{t('products.modal.section.product_info')}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {/* Nombre */}
                    <div className="space-y-1">
                      <label className={labelClass}>
                        {t('products.modal.field.product_name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('products.modal.placeholder.product_name')}
                        className={`${inputClass} ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {errors.name && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Categoria */}
                      <div className="space-y-1 relative">
                        <label className={labelClass}>
                          {t('products.modal.field.category')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`${selectClass} ${errors.category ? 'border-red-500' : ''}`}
                            disabled={loadingCategories}
                          >
                            <option value="">{loadingCategories ? 'Cargando...' : t('products.modal.placeholder.category')}</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        {errors.category && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.category}</p>}
                      </div>

                      {/* Tipo */}
                      <div className="space-y-1 relative">
                        <label className={labelClass}>{t('products.modal.field.product_type')}</label>
                        <div className="relative">
                          <select
                            name="productType"
                            value={formData.productType}
                            onChange={handleChange}
                            className={selectClass}
                          >
                            <option value="PHYSICAL">{t('products.type.physical')}</option>
                            <option value="SERVICE">{t('products.type.service')}</option>
                            <option value="PRODUCTION">MANUFACTURADO</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Tasa de IVA (Nuevo v1.1) */}
                    <div className="space-y-1 relative">
                      <label className={labelClass}>Tasa de IVA (Opcional - Sobrescribe Categoría)</label>
                      <div className="relative">
                        <select
                          name="taxRateId"
                          value={formData.taxRateId}
                          onChange={handleChange}
                          className={selectClass}
                          disabled={loadingTaxRates}
                        >
                          <option value="">Heredar de Categoría</option>
                          {taxRates.map(rate => (
                            <option key={rate.id} value={rate.id}>
                              {rate.tax_name || rate.name} ({rate.rate}%)
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium italic mt-1">
                        Si no se selecciona, se usará la tasa por defecto de la categoría seleccionada.
                      </p>
                    </div>

                    {/* Descripcion */}
                    <div className="space-y-1">
                      <label className={labelClass}>
                        {t('products.modal.field.description')} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder={t('products.modal.placeholder.description')}
                        className={`${inputClass} h-auto py-2 resize-none ${errors.description ? 'border-red-500' : ''}`}
                      />
                      {errors.description && <p className="text-[10px] text-red-600 font-bold mt-1">{errors.description}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar (Detalles Técnicos) */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full">
                  <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-50 text-gray-600">
                    <Package size={16} />
                    <h3 className="text-sm font-bold uppercase tracking-widest">{t('products.modal.section.additional_details')}</h3>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className={labelClass}>{t('products.modal.field.barcode')}</label>
                      <input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="779..." className={inputClass} />
                    </div>

                    <div className="space-y-1">
                      <label className={labelClass}>{t('products.modal.field.brand')}</label>
                      <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Marca..." className={inputClass} />
                    </div>

                    <div className="space-y-1 relative">
                      <label className={labelClass}>{t('products.modal.field.origin')}</label>
                      <div className="relative">
                        <select name="origin" value={formData.origin} onChange={handleChange} className={selectClass}>
                          <option value="">{t('products.modal.placeholder.origin')}</option>
                          <option value="NACIONAL">{t('products.origin.national')}</option>
                          <option value="IMPORTADO">{t('products.origin.imported')}</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1 relative">
                      <label className={labelClass}>Unidad de Medida</label>
                      <div className="relative">
                        <select name="base_unit" value={formData.base_unit} onChange={handleChange} className={selectClass}>
                          {getGroupedUnitOptions().map(group => (
                            <optgroup key={group.label} label={group.label}>
                              {group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Healthy Status Check (Visual Only) */}
                  <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <span>Estado de completitud</span>
                      <span className="text-[#107c10] flex items-center gap-1"><CheckCircle2 size={10} /> Auto-save</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#107c10] h-full transition-all duration-500" 
                        style={{ width: `${(Object.values(formData).filter(v => v !== '').length / 8) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-200 flex items-center justify-between bg-[#f3f2f1]">
          <div>
            {isEditMode && (
              <Button
                type="button"
                variant="ghost"
                className="text-[#a4262c] hover:text-[#82191f] hover:bg-red-50 font-bold text-xs uppercase tracking-wider"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
              >
                <Trash2 size={16} className="mr-2" />
                {t('products.modal.action.delete')}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
              className="bg-white border-[#d1d1d1] text-[#323130] font-bold text-xs uppercase tracking-wider px-6 h-10 hover:bg-[#f3f2f1]"
            >
              {t('products.modal.action.cancel')}
            </Button>
            <Button
              type="submit"
              form="product-form"
              disabled={isSubmitting || isDeleting}
              className="bg-[#106ebe] hover:bg-[#005a9e] text-white font-bold text-xs uppercase tracking-wider px-8 h-10 shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              {isSubmitting ? t('products.modal.action.saving') : t('products.modal.action.save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation (Fluent Style) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 border border-gray-200">
            <div className="flex items-center gap-4 text-[#a4262c] mb-6">
              <div className="p-3 bg-[#fde7e9] rounded-full">
                <AlertTriangle size={28} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">{t('products.modal.delete.title')}</h2>
            </div>
            <p className="text-sm text-[#242424] mb-2 leading-relaxed">
              {t('products.modal.delete.message', { name: product?.product_name || product?.name || '' })}
            </p>
            <p className="text-xs text-[#616161] mb-8 italic">{t('products.modal.delete.warning')}</p>
            <div className="flex items-center gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="font-bold text-xs uppercase tracking-wider">
                {t('products.modal.action.cancel')}
              </Button>
              <Button onClick={handleDelete} disabled={isDeleting} className="bg-[#a4262c] hover:bg-[#82191f] text-white font-bold text-xs uppercase tracking-wider">
                {isDeleting ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
                {isDeleting ? t('products.modal.action.deleting') : t('products.modal.action.confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
