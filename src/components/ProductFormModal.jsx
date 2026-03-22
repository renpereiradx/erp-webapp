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
    tax_rate_id: '',
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
      const response = await apiClient.getTaxRates(1, 100)
      if (Array.isArray(response)) setTaxRates(response)
      else if (response && response.tax_rates) setTaxRates(response.tax_rates)
      else setTaxRates([])
    } catch (error) {
      console.error('Error loading tax rates:', error)
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
          tax_rate_id: (product.override_tax_rate_id || product.tax_rate_id)?.toString() || '',
        })
      } else {
        setFormData({
          name: '', category: '', productType: 'PHYSICAL', description: '',
          barcode: '', brand: '', origin: '', base_unit: 'unit', tax_rate_id: '',
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
        override_tax_rate_id: formData.tax_rate_id ? parseInt(formData.tax_rate_id) : undefined,
        state: true,
        is_active: true,
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

  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2 flex items-center gap-1 font-display"
  const inputClass = "w-full h-11 px-4 bg-white border border-border-subtle rounded-xl text-sm text-text-main font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300 font-display"
  const selectClass = "w-full h-11 px-4 bg-white border border-border-subtle rounded-xl text-sm text-text-main font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer font-display"

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 font-display">
      <div 
        className="bg-white rounded-2xl shadow-fluent-16 w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-border-subtle font-display"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-10 py-6 border-b border-border-subtle flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-fluent-8">
              {isEditMode ? <Package size={24} /> : <Plus size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-text-main tracking-tighter uppercase leading-none">
                {isEditMode ? t('products.modal.edit.title') : t('products.modal.create.title')}
              </h2>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-1">
                {isEditMode ? t('products.modal.edit.subtitle') : t('products.modal.create.subtitle')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-lg text-text-secondary transition-colors shadow-sm">
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Seccion Principal (Información Básica) */}
              <div className="lg:col-span-2 space-y-10">
                <div className="bg-white p-8 rounded-2xl border border-border-subtle shadow-fluent-2">
                  <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-50">
                    <Info size={18} className="text-primary" />
                    <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">{t('products.modal.section.product_info')}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-8">
                    {/* Nombre */}
                    <div className="space-y-1.5">
                      <label className={labelClass}>
                        {t('products.modal.field.product_name')} <span className="text-error font-black ml-1">*</span>
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('products.modal.placeholder.product_name')}
                        className={`${inputClass} ${errors.name ? 'border-error ring-error/10' : ''}`}
                      />
                      {errors.name && <p className="text-[10px] text-error font-black uppercase tracking-widest mt-2">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Categoria */}
                      <div className="space-y-1.5 relative">
                        <label className={labelClass}>
                          {t('products.modal.field.category')} <span className="text-error font-black ml-1">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`${selectClass} ${errors.category ? 'border-error' : ''}`}
                            disabled={loadingCategories}
                          >
                            <option value="">{loadingCategories ? 'Cargando...' : t('products.modal.placeholder.category')}</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        {errors.category && <p className="text-[10px] text-error font-black uppercase tracking-widest mt-2">{errors.category}</p>}
                      </div>

                      {/* Tipo */}
                      <div className="space-y-1.5 relative">
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
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Tasa de IVA (v1.2) */}
                      <div className="space-y-1 relative">
                        <label className={labelClass}>
                          Tasa de IVA (SIFEN)
                          <span className="ml-1 text-[10px] text-blue-500 font-bold lowercase bg-blue-50 px-1 rounded">v1.2</span>
                        </label>
                        <div className="relative">
                          <select
                            name="tax_rate_id"
                            value={formData.tax_rate_id}
                            onChange={handleChange}
                            className={selectClass}
                            disabled={loadingTaxRates}
                          >
                            <option value="">{loadingTaxRates ? 'Cargando...' : 'Usar por defecto (Categoría)'}</option>
                            {taxRates.map(rate => (
                              <option key={rate.id} value={rate.id}>
                                {rate.tax_name || rate.name} ({rate.rate}%) - {rate.code}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <p className="text-[10px] text-gray-500 italic mt-1">
                          Si no se selecciona, heredará el IVA de la categoría.
                        </p>
                      </div>
                    </div>

                    {/* Descripcion */}
                    <div className="space-y-1.5">
                      <label className={labelClass}>
                        {t('products.modal.field.description')} <span className="text-error font-black ml-1">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder={t('products.modal.placeholder.description')}
                        className={`${inputClass} h-auto py-4 resize-none ${errors.description ? 'border-error' : ''}`}
                      />
                      {errors.description && <p className="text-[10px] text-error font-black uppercase tracking-widest mt-2">{errors.description}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar (Detalles Técnicos) */}
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-slate-50 p-8 rounded-2xl border border-border-subtle h-full shadow-inner">
                  <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-200 text-text-secondary">
                    <Package size={18} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('products.modal.section.additional_details')}</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <label className={labelClass}>{t('products.modal.field.barcode')}</label>
                      <input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="779..." className={inputClass} />
                    </div>

                    <div className="space-y-1.5">
                      <label className={labelClass}>{t('products.modal.field.brand')}</label>
                      <input name="brand" value={formData.brand} onChange={handleChange} placeholder="Marca..." className={inputClass} />
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className={labelClass}>{t('products.modal.field.origin')}</label>
                      <div className="relative">
                        <select name="origin" value={formData.origin} onChange={handleChange} className={selectClass}>
                          <option value="">{t('products.modal.placeholder.origin')}</option>
                          <option value="NACIONAL">{t('products.origin.national')}</option>
                          <option value="IMPORTADO">{t('products.origin.imported')}</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className={labelClass}>Unidad de Medida</label>
                      <div className="relative">
                        <select name="base_unit" value={formData.base_unit} onChange={handleChange} className={selectClass}>
                          {getGroupedUnitOptions().map(group => (
                            <optgroup key={group.label} label={group.label} className="font-black uppercase text-[10px]">
                              {group.options.map(opt => <option key={opt.value} value={opt.value} className="font-bold">{opt.label}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Healthy Status Check (Visual Only) */}
                  <div className="mt-12 pt-8 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Completitud</span>
                      <span className="text-success flex items-center gap-1"><CheckCircle2 size={10} /> Validado</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="bg-success h-full transition-all duration-1000 shadow-sm" 
                        style={{ width: `${(Object.values(formData).filter(v => v !== '').length / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-border-subtle flex items-center justify-between bg-slate-50/50">
          <div>
            {isEditMode && (
              <Button
                type="button"
                variant="ghost"
                className="text-error hover:text-error hover:bg-error/10 font-black uppercase text-[10px] tracking-widest rounded-lg px-4"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
              >
                <Trash2 size={16} className="mr-2" />
                {t('products.modal.action.delete')}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
              className="bg-white border-border-subtle text-text-main font-black uppercase text-[10px] tracking-widest px-8 h-11 rounded-xl shadow-fluent-2 hover:bg-slate-50"
            >
              {t('products.modal.action.cancel')}
            </Button>
            <Button
              type="submit"
              form="product-form"
              disabled={isSubmitting || isDeleting}
              className="bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest px-10 h-11 rounded-xl shadow-fluent-8 transition-all active:scale-95"
            >
              {isSubmitting ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
              {isSubmitting ? t('products.modal.action.saving') : t('products.modal.action.save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation (Fluent Style) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-fluent-16 w-full max-w-md p-8 animate-in zoom-in-95 border border-border-subtle">
            <div className="flex items-center gap-4 text-error mb-8">
              <div className="p-4 bg-error/10 rounded-full shadow-fluent-2">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase">{t('products.modal.delete.title')}</h2>
            </div>
            <p className="text-sm text-text-main mb-3 leading-relaxed font-medium">
              {t('products.modal.delete.message', { name: product?.product_name || product?.name || '' })}
            </p>
            <p className="text-[10px] text-text-secondary mb-10 font-black uppercase tracking-widest">{t('products.modal.delete.warning')}</p>
            <div className="flex items-center gap-4 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="font-black uppercase text-[10px] tracking-widest border-border-subtle h-11 px-6 rounded-xl">
                {t('products.modal.action.cancel')}
              </Button>
              <Button onClick={handleDelete} disabled={isDeleting} className="bg-error hover:bg-error/90 text-white font-black uppercase text-[10px] tracking-widest h-11 px-8 rounded-xl shadow-fluent-8">
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
