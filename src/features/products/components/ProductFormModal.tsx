import { useState, useMemo, useEffect } from 'react'
import { useI18n } from '@/lib/i18n'
import { getGroupedUnitOptions } from '@/constants/units'
import {
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Plus,
  FileText,
  Settings2,
  Barcode,
  Percent,
  Tags,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import EnhancedModal from '@/components/ui/EnhancedModal'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CategoryManagementModal } from '@/features/categories'
import { useProductForm } from '../hooks/useProductForm';

/**
 * ProductFormModal Component
 * Construido sobre EnhancedModal siguiendo DESIGN.md (§6.4, §6.6)
 */
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any | null;
}

type FormTab = 'basic' | 'details' | 'measure'

export default function ProductFormModal({ isOpen, onClose, product = null }: ProductFormModalProps) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<FormTab>('basic')

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
    const name = window.prompt(t('products.modal.prompt.new_brand', 'Ingrese el nombre de la nueva marca:'));
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
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const labelClass = 'text-body-md-bold text-foreground'
  const errorTextClass = 'text-body-md text-error'

  // Detección de errores en tiempo real por pestaña para los indicadores de alerta
  const hasBasicTabErrors = !!errors.name || !!errors.category || !!errors.description || !formData.name.trim() || !formData.category || !formData.description.trim();
  const hasMeasureTabErrors = !!errors.base_unit || !!errors.scale_code || (formData.is_variable_measure && !formData.scale_code);

  const tabs: Array<{ id: FormTab; label: string; icon: React.ReactNode; hasError?: boolean }> = [
    {
      id: 'basic',
      label: t('products.modal.tab.basic', 'Datos Básicos'),
      icon: <FileText className="w-4 h-4" />,
      hasError: hasBasicTabErrors,
    },
    {
      id: 'details',
      label: t('products.modal.tab.details', 'Detalles y SIFEN'),
      icon: <Settings2 className="w-4 h-4" />,
    },
    {
      id: 'measure',
      label: t('products.modal.tab.measure', 'Inventario y Balanza'),
      icon: <Barcode className="w-4 h-4" />,
      hasError: hasMeasureTabErrors,
    },
  ]

  const sectionHeaderClass = 'flex items-center gap-xs pb-sm border-b border-border-subtle text-on-surface-deep'

  const renderErrorText = (message?: string) =>
    message ? <p className={errorTextClass}>{message}</p> : null

  return (
    <>
      <EnhancedModal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? t('products.modal.edit.title') : t('products.modal.create.title')}
        subtitle={isEditMode ? t('products.modal.edit.subtitle') : t('products.modal.create.subtitle')}
        variant="default"
        size="xl"
        closeOnOverlayClick={false}
        className="rounded-xl flex flex-col"
        testId="product-form-modal"
        footer={
          <div className="flex items-center justify-between">
            <div>
              {isEditMode && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-error hover:bg-error-container hover:text-on-error-container"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('products.modal.action.delete')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-sm">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
              >
                {t('products.modal.action.cancel')}
              </Button>
              <Button
                type="submit"
                form="product-form"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting || isDeleting}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? t('products.modal.action.saving') : t('products.modal.action.save')}
              </Button>
            </div>
          </div>
        }
      >
        <div id="product-form-container">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-md">
            {Object.keys(errors).length > 0 && (
              <div
                className="flex items-start gap-sm rounded-md bg-error-container text-on-error-container p-md animate-in fade-in duration-150"
                role="alert"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="space-y-xs">
                  <p className="text-body-md-bold uppercase">
                    {t('products.modal.error.summary', 'Por favor corrige los siguientes errores:')}
                  </p>
                  <ul className="list-disc list-inside space-y-xs text-body-md">
                    {Object.values(errors).map((err: any, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div role="tablist" aria-label={t('products.modal.create.title')} className="flex gap-lg border-b border-border-subtle sticky top-0 bg-surface z-10 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative py-sm px-xs text-body-sm-bold uppercase tracking-wider border-b-2 transition-colors duration-150 flex items-center gap-xs ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-deep hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.hasError && (
                    <span aria-hidden="true" className="absolute top-1.5 right-[-8px] size-2 rounded-full bg-error" />
                  )}
                </button>
              ))}
            </div>

            {/* CONTENIDO PESTAÑA: DATOS BÁSICOS */}
            {activeTab === 'basic' && (
              <div role="tabpanel" className="space-y-md animate-in fade-in duration-150">
                <div className="bg-surface-muted rounded-md p-md space-y-md">
                  <div className={sectionHeaderClass}>
                    <Info className="w-4 h-4 text-primary" />
                    <h3 className="text-label-caps uppercase">
                      {t('products.modal.section.general_info', 'Información General')}
                    </h3>
                  </div>

                  {/* Nombre */}
                  <div className="space-y-xs">
                    <Label htmlFor="product-name" className={labelClass}>
                      {t('products.modal.field.product_name')} <span className="text-error">*</span>
                    </Label>
                    <Input
                      id="product-name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('products.modal.placeholder.product_name')}
                      state={errors.name ? 'error' : ''}
                    />
                    {renderErrorText(errors.name)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    {/* Categoría */}
                    <div className="space-y-xs">
                      <Label className={labelClass}>
                        {t('products.modal.field.category')} <span className="text-error">*</span>
                      </Label>
                      <Select
                        value={formData.category || undefined}
                        onValueChange={v => {
                          setFormData(prev => ({ ...prev, category: v }));
                          setErrors(prev => ({ ...prev, category: undefined }));
                        }}
                        disabled={loadingCategories}
                      >
                        <SelectTrigger
                          id="product-category-trigger"
                          className="rounded-input"
                          data-testid="product-category-trigger"
                          aria-label={t('products.modal.field.category')}
                        >
                          <SelectValue
                            placeholder={loadingCategories ? t('common.loading') : t('products.modal.placeholder.category')}
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-md shadow-fluent-8">
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id.toString()} className="text-body-md">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {renderErrorText(errors.category)}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={openCategoryManager}
                        className="h-auto px-0 py-xs text-primary hover:bg-transparent hover:underline flex items-center gap-xs justify-start"
                        data-testid="product-category-manage"
                      >
                        <Tags className="w-4 h-4" />
                        {t('products.modal.category.manage')}
                      </Button>
                    </div>

                    {/* Tipo de Producto */}
                    <div className="space-y-xs">
                      <Label className={labelClass}>{t('products.modal.field.product_type')}</Label>
                      <Select
                        value={formData.productType || undefined}
                        onValueChange={v => {
                          setFormData(prev => ({ ...prev, productType: v }));
                          setErrors(prev => ({ ...prev, productType: undefined }));
                          // Al salir de SERVICE el flag deja de tener sentido
                          // (D-SR-4: reservable ⇒ SERVICE) y se resetea.
                          if (v !== 'SERVICE') {
                            setFormData(prev => ({ ...prev, is_bookable: false }));
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-input" aria-label={t('products.modal.field.product_type')}>
                          <SelectValue placeholder={t('products.modal.field.product_type')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-md shadow-fluent-8">
                          <SelectItem value="PHYSICAL" className="text-body-md">{t('products.type.physical')}</SelectItem>
                          <SelectItem value="SERVICE" className="text-body-md">{t('products.type.service')}</SelectItem>
                          <SelectItem value="PRODUCTION" className="text-body-md">{t('products.type.production', 'Manufacturado')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Reservable (agenda) — solo SERVICE (D-SR-4) */}
                  {formData.productType === 'SERVICE' && (
                    <div className="flex items-center justify-between gap-md bg-surface rounded-md border border-border-subtle p-md animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex flex-col gap-xs">
                        <span className="text-body-md-bold text-foreground">{t('products.modal.field.bookable')}</span>
                        <span className="text-body-sm-bold text-on-surface-deep">{t('products.modal.field.bookableHint')}</span>
                      </div>
                      <Switch
                        checked={formData.is_bookable}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bookable: checked }))}
                        aria-label={t('products.modal.field.bookable')}
                        data-testid="product-bookable-switch"
                      />
                    </div>
                  )}

                  {/* Descripción */}
                  <div className="space-y-xs">
                    <Label htmlFor="product-description" className={labelClass}>
                      {t('products.modal.field.description')} <span className="text-error">*</span>
                    </Label>
                    <Textarea
                      id="product-description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      placeholder={t('products.modal.placeholder.description')}
                      className="resize-none"
                      aria-invalid={!!errors.description}
                    />
                    {renderErrorText(errors.description)}
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: DETALLES Y SIFEN */}
            {activeTab === 'details' && (
              <div role="tabpanel" className="space-y-md animate-in fade-in duration-150">
                <div className="bg-surface-muted rounded-md p-md space-y-md">
                  <div className={sectionHeaderClass}>
                    <Percent className="w-4 h-4 text-primary" />
                    <h3 className="text-label-caps uppercase">
                      {t('products.modal.section.classification', 'Clasificación e Impuestos')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    {/* Tasa de IVA (SIFEN v1.2) */}
                    <div className="space-y-xs">
                      <Label className={labelClass}>
                        {t('products.modal.field.tax_rate', 'Tasa de IVA (SIFEN)')}
                        <span className="bg-primary-fixed text-on-primary-fixed rounded-xs px-1 py-0.5 text-body-sm-bold">
                          v1.2
                        </span>
                      </Label>
                      <Select
                        value={formData.tax_rate_id || 'default'}
                        onValueChange={v => {
                          setFormData(prev => ({ ...prev, tax_rate_id: v === 'default' ? '' : v }));
                          setErrors(prev => ({ ...prev, tax_rate_id: undefined }));
                        }}
                        disabled={loadingTaxRates}
                      >
                        <SelectTrigger className="rounded-input" aria-label={t('products.modal.field.tax_rate', 'Tasa de IVA (SIFEN)')}>
                          <SelectValue
                            placeholder={loadingTaxRates ? t('common.loading') : t('products.modal.option.default_tax', 'Usar por defecto (Categoría)')}
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-md shadow-fluent-8">
                          <SelectItem value="default" className="text-body-md">
                            {t('products.modal.option.default_tax', 'Usar por defecto (Categoría)')}
                          </SelectItem>
                          {taxRates.map(rate => (
                            <SelectItem key={rate.id} value={rate.id.toString()} className="text-body-md">
                              {rate.tax_name || rate.name} ({rate.rate}%) - {rate.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-body-sm-bold text-on-surface-deep">
                        {t('products.modal.helper.tax_inherit', 'Si no se selecciona, heredará el IVA de la categoría.')}
                      </p>
                    </div>

                    {/* Origen */}
                    <div className="space-y-xs">
                      <Label className={labelClass}>{t('products.modal.field.origin')}</Label>
                      <Select
                        value={formData.origin || undefined}
                        onValueChange={v => {
                          setFormData(prev => ({ ...prev, origin: v }));
                          setErrors(prev => ({ ...prev, origin: undefined }));
                        }}
                      >
                        <SelectTrigger className="rounded-input" aria-label={t('products.modal.field.origin')}>
                          <SelectValue placeholder={t('products.modal.placeholder.origin')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-md shadow-fluent-8">
                          <SelectItem value="NACIONAL" className="text-body-md">{t('products.origin.national')}</SelectItem>
                          <SelectItem value="IMPORTADO" className="text-body-md">{t('products.origin.imported')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Marca */}
                    <div className="space-y-xs">
                      <div className="flex justify-between items-center">
                        <Label className={labelClass}>{t('products.modal.field.brand')}</Label>
                        <Button type="button" variant="link" size="sm" onClick={handleAddBrand} className="text-body-sm-bold">
                          <Plus className="w-4 h-4 mr-1" />
                          {t('products.modal.action.new_brand', '+ Nueva')}
                        </Button>
                      </div>
                      <Select
                        value={formData.brand_id || undefined}
                        onValueChange={v => {
                          setFormData(prev => ({ ...prev, brand_id: v }));
                          setErrors(prev => ({ ...prev, brand_id: undefined }));
                        }}
                        disabled={loadingBrands}
                      >
                        <SelectTrigger className="rounded-input" aria-label={t('products.modal.field.brand')}>
                          <SelectValue
                            placeholder={loadingBrands ? t('products.modal.option.loading_brands', 'Cargando marcas...') : t('products.modal.option.select_brand', 'Seleccione una marca (opcional)')}
                          />
                        </SelectTrigger>
                        <SelectContent className="rounded-md shadow-fluent-8">
                          {brands.map(brand => (
                            <SelectItem key={brand.id} value={brand.id.toString()} className="text-body-md">
                              {brand.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Propietario o Metadata en edición */}
                    {isEditMode && product?.user_id && (
                      <div className="space-y-xs">
                        <span className="text-body-md-bold text-foreground">
                          {t('products.modal.field.owner', 'Creador / Propietario')}
                        </span>
                        <div className="h-10 px-md border border-border-subtle rounded-input bg-surface-muted flex items-center text-data-mono font-data-mono text-on-surface-deep">
                          {product.user_id}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CONTENIDO PESTAÑA: INVENTARIO Y BALANZA */}
            {activeTab === 'measure' && (
              <div role="tabpanel" className="space-y-md animate-in fade-in duration-150">
                <div className="bg-surface-muted rounded-md p-md space-y-md">
                  <div className={sectionHeaderClass}>
                    <Barcode className="w-4 h-4 text-primary" />
                    <h3 className="text-label-caps uppercase">
                      {t('products.modal.section.codes', 'Códigos, Medidas e Inventario')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    {/* Código de Barras */}
                    <div className="space-y-xs">
                      <Label htmlFor="product-barcode" className={labelClass}>{t('products.modal.field.barcode')}</Label>
                      <Input
                        id="product-barcode"
                        name="barcode"
                        value={formData.barcode}
                        onChange={handleChange}
                        placeholder={t('products.modal.placeholder.barcode')}
                        className="text-data-mono font-data-mono"
                      />
                      {renderErrorText(errors.barcode)}
                    </div>

                    {/* Unidad de Medida */}
                    <div className="space-y-xs">
                      <Label className={labelClass}>
                        {t('products.modal.field.unit_of_measure', 'Unidad de Medida')}
                        {isEditMode && (
                          <span className="bg-tertiary-fixed text-on-tertiary-fixed rounded-xs px-1 py-0.5 text-body-sm-bold uppercase">
                            {t('products.modal.field.immutable', 'inmutable')}
                          </span>
                        )}
                      </Label>
                      <Select
                        value={formData.base_unit || undefined}
                        onValueChange={v => {
                          setFormData(prev => ({ ...prev, base_unit: v }));
                          setErrors(prev => ({ ...prev, base_unit: undefined }));
                        }}
                        disabled={isEditMode}
                      >
                        <SelectTrigger
                          className={cn('rounded-input', errors.base_unit && 'border-error')}
                          aria-label={t('products.modal.field.unit_of_measure', 'Unidad de Medida')}
                        >
                          <SelectValue placeholder={t('products.modal.field.unit_of_measure', 'Unidad de Medida')} />
                        </SelectTrigger>
                        <SelectContent className="rounded-md shadow-fluent-8 max-h-64">
                          {getGroupedUnitOptions().map(group => (
                            <SelectGroup key={group.label}>
                              <SelectLabel className="text-label-caps uppercase text-on-surface-deep">
                                {group.label}
                              </SelectLabel>
                              {group.options.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-body-md">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                      {renderErrorText(errors.base_unit)}
                    </div>
                  </div>

                  {/* Medida Variable */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md pt-xs">
                    <div className="flex items-center justify-between gap-md bg-surface rounded-md border border-border-subtle p-md">
                      <div className="flex flex-col gap-xs">
                        <span className="text-body-md-bold text-foreground">
                          {t('products.modal.field.variable_measure', 'Medida Variable')}
                        </span>
                        <span className="text-body-sm-bold text-on-surface-deep">
                          {t('products.modal.field.variable_measure_hint', 'Venta por peso/volumen')}
                        </span>
                      </div>
                      <Switch
                        checked={formData.is_variable_measure}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            is_variable_measure: checked,
                            scale_code: checked ? prev.scale_code : ''
                          }))
                        }}
                        aria-label={t('products.modal.field.variable_measure', 'Medida Variable')}
                      />
                    </div>

                    {/* Código de Balanza */}
                    {formData.is_variable_measure && (
                      <div className="space-y-xs animate-in slide-in-from-top-2 duration-150">
                        <Label htmlFor="product-scale-code" className={labelClass}>
                          {t('products.modal.field.scale_code', 'Código de Balanza')}
                        </Label>
                        <Input
                          id="product-scale-code"
                          name="scale_code"
                          value={formData.scale_code}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 5)
                            setFormData(prev => ({ ...prev, scale_code: val }))
                          }}
                          placeholder="123"
                          className="text-data-mono font-data-mono"
                          state={errors.scale_code ? 'error' : ''}
                        />
                        <p className="text-body-sm-bold text-on-surface-deep">
                          {t('products.modal.field.scale_code_hint', 'Código corto para balanzas EAN-13 (1-5 dígitos)')}
                        </p>
                        {renderErrorText(errors.scale_code)}
                      </div>
                    )}
                  </div>

                  {/* Barra de completitud de datos */}
                  <div className="pt-md border-t border-border-subtle space-y-sm">
                    <div className="flex items-center justify-between text-label-caps uppercase text-on-surface-deep">
                      <span>{t('products.modal.completeness.title', 'Completitud de Ficha')}</span>
                      <span
                        className={cn(
                          'flex items-center gap-xs text-body-sm-bold normal-case',
                          completitudPct === 100 ? 'text-success' : 'text-on-surface-deep'
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {completitudPct === 100
                          ? t('products.modal.completeness.complete', 'Ficha Completa')
                          : t('products.modal.completeness.progress', 'En progreso')}
                      </span>
                    </div>
                    <div
                      className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={completitudPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={t('products.modal.completeness.title', 'Completitud de Ficha')}
                    >
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-150',
                          completitudPct < 50 ? 'bg-error' : completitudPct < 90 ? 'bg-warning' : 'bg-success'
                        )}
                        style={{ width: `${completitudPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </EnhancedModal>

      {/* Delete Confirmation */}
      <EnhancedModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('products.modal.delete.title')}
        variant="error"
        size="sm"
        testId="product-delete-modal"
        footer={
          <div className="flex items-center justify-end gap-sm">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              {t('products.modal.action.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={isDeleting} disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? t('products.modal.action.deleting') : t('products.modal.action.confirmDelete')}
            </Button>
          </div>
        }
      >
        <div className="space-y-md">
          <p className="text-body-md text-foreground">
            {t('products.modal.delete.message', { name: product?.product_name || product?.name || '' })}
          </p>
          <p className="text-body-md text-on-surface-deep bg-surface-muted rounded-md p-sm">
            {t('products.modal.delete.warning')}
          </p>
        </div>
      </EnhancedModal>

      <CategoryManagementModal
        isOpen={isCategoryManagerOpen}
        onClose={closeCategoryManager}
        onCreated={handleCategoryCreated}
        onDeleted={handleCategoryDeleted}
      />
    </>
  )
}
