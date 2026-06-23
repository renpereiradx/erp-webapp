import { useState, useMemo, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { getGroupedUnitOptions } from '@/constants/units'
import {
  X,
  Save,
  Trash2,
  AlertTriangle,
  Package,
  Info,
  ChevronDown,
  CheckCircle2,
  Plus,
  RefreshCw,
  FileText,
  Settings2,
  Barcode,
  Percent,
  Tags,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryManagementModal } from '@/features/categories'
import { useProductForm } from '../hooks/useProductForm';
import { ProductVariantsManager } from './ProductVariantsManager';
import { ProductAttributesManager } from './ProductAttributesManager';
import { ProductTagsManager } from './ProductTagsManager';

/**
 * ProductFormModal Component
 * Rediseñado con Tailwind CSS siguiendo fielmente Fluent Design System 2
 */
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any | null;
}

export default function ProductFormModal({ isOpen, onClose, product = null }: ProductFormModalProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'measure' | 'variants' | 'attributes'>('basic')
  
  const {
    formData,
    setFormData,
    errors,
    setErrors,
    isSubmitting,
    isDeleting,
    isEditMode,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isCategoryManagerOpen,
    openCategoryManager,
    closeCategoryManager,
    handleCategoryCreated,
    handleCategoryDeleted,
    categories,
    taxRates,
    brands,
    loadingCategories,
    loadingTaxRates,
    loadingBrands,
    handleChange,
    handleSubmit,
    handleDelete,
    loadBrands
  } = useProductForm({ product, isOpen, onClose });

  const handleAddBrand = async () => {
    const name = window.prompt('Ingrese el nombre de la nueva marca:');
    if (!name?.trim()) return;
    try {
      const { brandService } = await import('@/services/brandService');
      const newBrand = await brandService.create({ name: name.trim() });
      await loadBrands();
      if (newBrand?.id) {
        setFormData(prev => ({ ...prev, brand_id: newBrand.id.toString() }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Resetear la pestaña activa al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setActiveTab('basic');
    }
  }, [isOpen]);

  // Si la validación del hook arroja algún error, nos movemos a la pestaña correspondiente
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      if (errors.name || errors.category || errors.description || errors.productType) {
        setActiveTab('basic');
      } else if (errors.base_unit || errors.scale_code || errors.barcode) {
        setActiveTab('measure');
      } else if (errors.tax_rate_id || errors.origin || errors.brand_id) {
        setActiveTab('details');
      }
      
      // Scroll to top so the banner is visible
      const formContainer = document.getElementById('product-form-container');
      if (formContainer) {
        formContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [errors]);

  // Calcular la completitud en base a los campos clave
  const completitudPct = useMemo(() => {
    const fields = [
      formData.name,
      formData.category,
      formData.description,
      formData.barcode,
      formData.brand_id,
      formData.origin,
      formData.base_unit,
    ];
    const filled = fields.filter(v => v && String(v).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  }, [formData]);

  if (!isOpen) return null

  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2 flex items-center gap-1 font-display"
  const inputClass = "w-full h-11 px-4 bg-white border border-border-subtle rounded-xl text-sm text-text-main font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300 font-display hover:border-slate-300"
  const selectClass = "w-full h-11 px-4 bg-white border border-border-subtle rounded-xl text-sm text-text-main font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer font-display hover:border-slate-300"

  // Detección de errores en tiempo real por pestaña para los indicadores de alerta
  const hasBasicTabErrors = !!errors.name || !!errors.category || !!errors.description || !formData.name.trim() || !formData.category || !formData.description.trim();
  const hasMeasureTabErrors = !!errors.base_unit || !!errors.scale_code || (formData.is_variable_measure && !formData.scale_code);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 font-display">
      <div 
        className="bg-white rounded-2xl shadow-fluent-16 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 font-display"
        onClick={e => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className="px-8 py-5 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-primary/[0.03] via-transparent to-transparent">
          <div className="flex items-center gap-3.5">
            <div className="size-11 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/10">
              {isEditMode ? <Package size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-text-main tracking-tight uppercase leading-none">
                {isEditMode ? t('products.modal.edit.title') : t('products.modal.create.title')}
              </h2>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">
                {isEditMode ? t('products.modal.edit.subtitle') : t('products.modal.create.subtitle')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full text-text-secondary hover:text-text-main transition-all hover:rotate-90 duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs superiores */}
        <div className="flex border-b border-border-subtle bg-slate-50/50 px-8 gap-6 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === 'basic'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            <FileText size={14} />
            <span>Datos Básicos</span>
            {hasBasicTabErrors && (
              <span className="absolute top-2.5 right-[-6px] h-2 w-2 rounded-full bg-error animate-pulse border border-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            <Settings2 size={14} />
            <span>Detalles y SIFEN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('measure')}
            className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === 'measure'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            <Barcode size={14} />
            <span>Inventario y Balanza</span>
            {hasMeasureTabErrors && (
              <span className="absolute top-2.5 right-[-6px] h-2 w-2 rounded-full bg-error animate-pulse border border-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attributes')}
            className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === 'attributes'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            <Layers size={14} />
            <span>Ficha Técnica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 relative ${
              activeTab === 'variants'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-main'
            }`}
          >
            <Package size={14} />
            <span>Variantes (SKUs)</span>
          </button>
        </div>

        {/* Form Body con Scroll */}
        <div id="product-form-container" className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            {Object.keys(errors).length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-error/20 bg-error/[0.02] p-4 text-xs text-error animate-in fade-in duration-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-error" />
                <div className="space-y-1">
                  <p className="font-bold uppercase tracking-wider text-[10px]">Por favor corrige los siguientes errores:</p>
                  <ul className="list-disc list-inside space-y-0.5 font-medium">
                    {Object.values(errors).map((err: any, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: DATOS BÁSICOS */}
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-in fade-in duration-200 slide-in-from-left-3">
                <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800">
                    <Info size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">Información General</h3>
                  </div>

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
                    {errors.name && <p className="text-[10px] text-error font-black uppercase tracking-widest mt-1.5">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Categoría */}
                    <div className="space-y-1.5">
                      <label className={labelClass}>
                        {t('products.modal.field.category')} <span className="text-error font-black ml-1">*</span>
                      </label>
                      <Select
                        value={formData.category}
                        onValueChange={v => {
                          setFormData(prev => ({ ...prev, category: v }));
                          setErrors(prev => ({ ...prev, category: undefined }));
                        }}
                        disabled={loadingCategories}
                      >
                        <SelectTrigger
                          className={`h-11 rounded-xl border-border-subtle font-bold ${errors.category ? 'border-error' : ''}`}
                          data-testid="product-category-trigger"
                        >
                          <SelectValue
                            placeholder={loadingCategories ? 'Cargando...' : t('products.modal.placeholder.category')}
                          />
                        </SelectTrigger>
                        <SelectContent className="">
                          {categories.map(cat => (
                            <SelectItem
                              key={cat.id}
                              value={cat.id.toString()}
                              className="font-bold text-xs uppercase tracking-wider"
                            >
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-[10px] text-error font-black uppercase tracking-widest mt-1.5">{errors.category}</p>}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={openCategoryManager}
                        className="h-auto px-0 py-1 text-[10px] uppercase tracking-widest font-bold text-primary hover:bg-transparent hover:underline flex items-center gap-1.5 justify-start"
                        data-testid="product-category-manage"
                      >
                        <Tags size={12} />
                        {t('products.modal.category.manage')}
                      </Button>
                    </div>

                    {/* Tipo de Producto */}
                    <div className="space-y-1.5">
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
                  </div>

                  {/* Descripción */}
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
                      className={`${inputClass} h-auto py-3.5 resize-none ${errors.description ? 'border-error' : ''}`}
                    />
                    {errors.description && <p className="text-[10px] text-error font-black uppercase tracking-widest mt-1.5">{errors.description}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: DETALLES Y SIFEN */}
            {activeTab === 'details' && (
              <div className="space-y-6 animate-in fade-in duration-200 slide-in-from-left-3">
                <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800">
                    <Percent size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">Clasificación e Impuestos</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tasa de IVA (SIFEN v1.2) */}
                    <div className="space-y-1.5">
                      <label className={labelClass}>
                        Tasa de IVA (SIFEN)
                        <span className="ml-1.5 text-[9px] text-blue-600 font-bold uppercase bg-blue-50 px-1 rounded border border-blue-100">v1.2</span>
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
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-slate-400 italic mt-1.5">
                        Si no se selecciona, heredará el IVA de la categoría.
                      </p>
                    </div>

                    {/* Origen */}
                    <div className="space-y-1.5">
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

                    {/* Marca */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className={labelClass}>{t('products.modal.field.brand')}</label>
                        <button type="button" onClick={handleAddBrand} className="text-[10px] text-primary hover:underline font-bold uppercase">
                          + Nueva
                        </button>
                      </div>
                      <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                          <select name="brand_id" value={formData.brand_id} onChange={handleChange} className={selectClass}>
                          <option value="">{loadingBrands ? 'Cargando marcas...' : 'Seleccione una marca (opcional)'}</option>
                          {brands.map(brand => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Propietario o Metadata en edición */}
                    {isEditMode && product?.user_id && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2 block font-display">Creador / Propietario</span>
                        <div className="h-11 px-4 border border-slate-100 rounded-xl bg-slate-50 flex items-center text-xs font-bold text-slate-500 font-mono">
                          {product.user_id}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Etiquetas (Tags) */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-50 text-slate-800">
                      <Tags size={16} className="text-primary" />
                      <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">Etiquetas (Tags)</h3>
                    </div>
                    <ProductTagsManager 
                      productId={product?.id || product?.product_id} 
                      disabled={!isEditMode} 
                    />
                    <p className="text-[9px] text-text-secondary font-bold uppercase tracking-wider mt-2 ml-1">
                      Agregue etiquetas como "Nuevo", "Oferta" o "Destacado" para filtros y catálogos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: INVENTARIO Y BALANZA */}
            {activeTab === 'measure' && (
              <div className="space-y-6 animate-in fade-in duration-200 slide-in-from-left-3">
                <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800">
                    <Barcode size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">Códigos, Medidas e Inventario</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Código de Barras */}
                    <div className="space-y-1.5">
                      <label className={labelClass}>{t('products.modal.field.barcode')}</label>
                      <input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Ej: 779123456789" className={inputClass} />
                    </div>

                    {/* Unidad de Medida */}
                    <div className="space-y-1.5">
                      <label className={labelClass}>
                        Unidad de Medida {isEditMode && <span className="ml-1.5 text-[8px] text-amber-600 font-bold uppercase bg-amber-50 px-1 rounded border border-amber-100">inmutable</span>}
                      </label>
                      <div className="relative">
                        <select 
                          name="base_unit" 
                          value={formData.base_unit} 
                          onChange={handleChange} 
                          className={`${selectClass} ${errors.base_unit ? 'border-error' : ''}`} 
                          disabled={isEditMode}
                        >
                          {getGroupedUnitOptions().map(group => (
                            <optgroup key={group.label} label={group.label} className="font-black uppercase text-[10px]">
                              {group.options.map(opt => <option key={opt.value} value={opt.value} className="font-bold">{opt.label}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      {errors.base_unit && <p className="text-[10px] text-error font-black uppercase tracking-widest mt-1.5">{errors.base_unit}</p>}
                    </div>
                  </div>

                  {/* Switch para Medida Variable (Estilizado) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-border-subtle rounded-xl transition-all duration-200 hover:bg-slate-50">
                      <div className="flex flex-col pr-3">
                        <span className="text-xs font-bold text-text-main">Medida Variable</span>
                        <span className="text-[9px] text-text-secondary font-black uppercase tracking-wider mt-0.5">Venta por peso/volumen</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            is_variable_measure: !prev.is_variable_measure,
                            scale_code: !prev.is_variable_measure ? prev.scale_code : ''
                          }))
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-primary/15 ${
                          formData.is_variable_measure ? 'bg-primary' : 'bg-slate-200'
                        }`}
                        role="switch"
                        aria-checked={formData.is_variable_measure}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out ${
                            formData.is_variable_measure ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Código de Balanza */}
                    {formData.is_variable_measure && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                        <label className={labelClass}>Código de Balanza</label>
                        <input
                          name="scale_code"
                          value={formData.scale_code}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 5)
                            setFormData(prev => ({ ...prev, scale_code: val }))
                          }}
                          placeholder="Ej: 123"
                          className={`${inputClass} ${errors.scale_code ? 'border-error' : ''}`}
                        />
                        <p className="text-[9px] text-text-secondary font-bold uppercase tracking-wider mt-1">
                          Código corto para balanzas EAN-13 (1-5 dígitos)
                        </p>
                        {errors.scale_code && <p className="text-[10px] text-error font-black uppercase tracking-widest mt-1.5">{errors.scale_code}</p>}
                      </div>
                    )}
                  </div>

                  {/* Barra de completitud de datos (Fluent) */}
                  <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Completitud de Ficha</span>
                      <span className={`${
                        completitudPct === 100 ? 'text-success' : 'text-slate-400'
                      } flex items-center gap-1 font-bold`}>
                        <CheckCircle2 size={10} /> {completitudPct === 100 ? 'Ficha Completa' : 'En progreso'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner border border-slate-200/40">
                      <div 
                        className={`h-full transition-all duration-700 shadow-sm rounded-full bg-gradient-to-r ${
                          completitudPct < 50 ? 'from-orange-500 to-amber-500' : completitudPct < 90 ? 'from-amber-500 to-emerald-400' : 'from-emerald-400 to-success'
                        }`} 
                        style={{ width: `${completitudPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: VARIANTES */}
            {activeTab === 'variants' && (
              <div className="space-y-6 animate-in fade-in duration-200 slide-in-from-left-3">
                <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800">
                    <Package size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">Variantes (SKUs)</h3>
                  </div>
                  <div className="pt-4">
                    <ProductVariantsManager productId={product?.id || product?.product_id} categoryId={formData.category} />
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: ATRIBUTOS DE PRODUCTO */}
            {activeTab === 'attributes' && (
              <div className="space-y-6 animate-in fade-in duration-200 slide-in-from-left-3">
                <div className="bg-white p-6 rounded-2xl border border-border-subtle shadow-sm space-y-6">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-800">
                    <Layers size={16} className="text-primary" />
                    <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em]">Ficha Técnica (Atributos descriptivos)</h3>
                  </div>
                  <div className="pt-2">
                    <ProductAttributesManager productId={product?.id || product?.product_id} categoryId={formData.category} />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-border-subtle flex items-center justify-between bg-slate-50/50">
          <div>
            {isEditMode && (
              <Button
                type="button"
                variant="ghost"
                className="text-error hover:text-error hover:bg-error/5 font-black uppercase text-[10px] tracking-widest rounded-lg px-4 h-11 border border-transparent hover:border-error/10 transition-colors"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
              >
                <Trash2 size={15} className="mr-2" />
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
              className="bg-white border-border-subtle text-text-main font-black uppercase text-[10px] tracking-widest px-6 h-11 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              {t('products.modal.action.cancel')}
            </Button>
            <Button
              type="submit"
              form="product-form"
              disabled={isSubmitting || isDeleting}
              className="bg-primary hover:bg-primary/95 text-white font-black uppercase text-[10px] tracking-widest px-8 h-11 rounded-xl shadow-md shadow-primary/10 transition-all active:scale-[0.98] flex items-center"
            >
              {isSubmitting ? <RefreshCw size={15} className="animate-spin mr-2" /> : <Save size={15} className="mr-2" />}
              {isSubmitting ? t('products.modal.action.saving') : t('products.modal.action.save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation (Fluent Style) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-fluent-16 w-full max-w-md p-7 animate-in zoom-in-95 border border-slate-100">
            <div className="flex items-center gap-3.5 text-error mb-6">
              <div className="p-3 bg-error/10 rounded-xl">
                <AlertTriangle size={26} className="text-error" />
              </div>
              <h2 className="text-xl font-black tracking-tight uppercase leading-none">{t('products.modal.delete.title')}</h2>
            </div>
            <p className="text-sm text-text-main mb-3 leading-relaxed font-semibold">
              {t('products.modal.delete.message', { name: product?.product_name || product?.name || '' })}
            </p>
            <p className="text-[10px] text-text-secondary mb-8 font-bold uppercase tracking-wider bg-slate-50 p-2.5 rounded-lg border border-slate-200/40">{t('products.modal.delete.warning')}</p>
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="font-black uppercase text-[10px] tracking-widest border-border-subtle h-11 px-5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                {t('products.modal.action.cancel')}
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-error hover:bg-error/95 text-white font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-xl shadow-md shadow-error/10 transition-all active:scale-[0.98] flex items-center"
              >
                {isDeleting ? <RefreshCw size={15} className="animate-spin mr-2" /> : <Trash2 size={15} className="mr-2" />}
                {isDeleting ? t('products.modal.action.deleting') : t('products.modal.action.confirmDelete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CategoryManagementModal
        isOpen={isCategoryManagerOpen}
        onClose={closeCategoryManager}
        onCreated={handleCategoryCreated}
        onDeleted={handleCategoryDeleted}
      />
    </div>
  )
}

