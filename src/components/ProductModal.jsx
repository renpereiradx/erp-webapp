import React, { useEffect, useMemo, useState } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useI18n } from '@/lib/i18n'
import useProductStore from '@/store/useProductStore'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import '@/styles/ProductDetailModal.css'
import {
  X,
  Save,
  Package,
  AlertCircle,
  Box,
  Briefcase,
  Factory,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'

const PRODUCT_TYPE_CARDS = [
  {
    value: 'PHYSICAL',
    icon: Box,
    label: 'Producto físico',
    badge: 'Inventario',
    description: 'Stock tangible, movimientos y costos estándar.',
  },
  {
    value: 'PRODUCTION',
    icon: Factory,
    label: 'Producto de producción',
    badge: 'Manufactura',
    description: 'Habilita recetas, lotes y costos internos de fabricación.',
  },
  {
    value: 'SERVICE',
    icon: Briefcase,
    label: 'Servicio',
    badge: 'Agenda',
    description: 'Reservas o servicios sin gestión de inventario físico.',
  },
]

const PRODUCT_TYPE_HINTS = {
  PHYSICAL:
    '📦 Usa este tipo para productos tangibles que consumen inventario y movimientos.',
  PRODUCTION:
    '🏭 Ideal para ítems fabricados internamente. Activa la pestaña Manufactura para gestionar recetas, insumos y lotes.',
  SERVICE:
    '💼 Perfecto para servicios profesionales, alquileres o reservas sin stock.',
}

const ProductModal = ({
  isOpen,
  onClose,
  product,
  onSuccess,
  container = null,
}) => {
  const { styles } = useThemeStyles()
  const { t } = useI18n()
  const {
    categories,
    fetchCategories,
    createProduct,
    updateProduct,
    fetchProducts,
  } = useProductStore()
  const { success, info, error: toastError } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    id_category: '',
    state: true,
    description: '',
    barcode: '',
    product_type: 'PHYSICAL',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  const isEditing = useMemo(
    () => !!product && !!(product.id || product.product_id),
    [product]
  )

  useEffect(() => {
    if (!isOpen) return

    if (categories.length === 0) {
      setCategoriesLoading(true)
      fetchCategories().finally(() => setCategoriesLoading(false))
    }

    if (product) {
      const resolvedDescription =
        typeof product.description === 'string'
          ? product.description
          : product.description?.description || ''

      setFormData({
        name: product.name || product.product_name || '',
        id_category: product.id_category || product.category_id || '',
        state: product.state !== undefined ? product.state : true,
        description: resolvedDescription,
        barcode: product.barcode || '',
        product_type: product.product_type || 'PHYSICAL',
      })
    } else {
      setFormData({
        name: '',
        id_category: '',
        state: true,
        description: '',
        barcode: '',
        product_type: 'PHYSICAL',
      })
    }
  }, [isOpen, product, categories.length, fetchCategories])

  const handleChange = event => {
    const { name, value, type, checked } = event.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleProductTypeSelect = value => {
    setFormData(prev => ({ ...prev, product_type: value }))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')

    try {
      if (!formData.name.trim()) {
        throw new Error('El nombre es requerido')
      }
      if (!formData.id_category) {
        throw new Error('La categoría es requerida')
      }
      if (!formData.description.trim()) {
        throw new Error('La descripción es requerida')
      }

      const payload = {
        name: formData.name.trim(),
        id_category: isNaN(Number(formData.id_category))
          ? formData.id_category
          : Number(formData.id_category),
        state: !!formData.state,
        product_type: formData.product_type || 'PHYSICAL',
        description: formData.description.trim(),
        barcode: formData.barcode.trim(),
      }

      const productId = product?.id || product?.product_id
      let savedProduct

      if (isEditing && productId) {
        savedProduct = await updateProduct(productId, payload)
      } else {
        savedProduct = await createProduct(payload)
      }

      let messageOnly = false
      if (!savedProduct || !savedProduct.id) {
        messageOnly = true
        try {
          await fetchProducts()
        } catch (refreshError) {
          console.warn(
            'No se pudo refrescar la lista de productos:',
            refreshError
          )
        }
      }

      if (messageOnly) {
        info(isEditing ? 'Producto actualizado' : 'Producto creado', 2500)
      } else {
        success(isEditing ? 'Producto actualizado' : 'Producto creado', 2500)
      }

      onSuccess?.(savedProduct || null)
      onClose()
    } catch (err) {
      const message = err?.message || 'Error al guardar el producto'
      setError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const activeType = PRODUCT_TYPE_CARDS.find(
    card => card.value === formData.product_type
  )
  const ActiveTypeIcon = activeType?.icon

  return (
    <div
      className={`${
        container ? 'absolute' : 'fixed'
      } inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm product-detail-modal`}
    >
      <div
        className={`w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl ${styles.card()} product-modal shadow-2xl`}
      >
        <div className='flex items-start justify-between gap-3 border-b px-5 py-4'>
          <div className='flex flex-1 flex-col gap-2'>
            <div className='flex items-center gap-2 text-xs text-muted-foreground sm:text-sm'>
              <Package className='h-4 w-4' />
              {isEditing
                ? `ID: ${product.id || product.product_id}`
                : 'Nuevo producto'}
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <h2
                className={`${styles.header(
                  'h2'
                )} text-xl font-semibold tracking-tight`}
              >
                {isEditing ? t('products.edit_title') : t('products.new_title')}
              </h2>
              {isEditing && (
                <Badge
                  variant={formData.state ? 'default' : 'secondary'}
                  className='product-badge'
                >
                  {formData.state ? 'Activo' : 'Inactivo'}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='shrink-0'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <ScrollArea className='flex-1 px-5 py-4'>
          <form
            id='product-modal-form'
            onSubmit={handleSubmit}
            className='space-y-4'
          >
            {error && (
              <div className='flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive sm:text-sm'>
                <AlertCircle className='h-4 w-4 shrink-0' />
                <span>{error}</span>
              </div>
            )}

            <div
              className={`rounded-xl border p-4 sm:p-5 ${styles.card(
                'subtle'
              )} space-y-4`}
            >
              <div className='grid gap-4 md:grid-cols-12'>
                <div className='md:col-span-7 lg:col-span-8 space-y-2'>
                  <label
                    className={`${styles.label()} text-xs font-semibold uppercase tracking-wide`}
                  >
                    Nombre *
                  </label>
                  <Input
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder='Nombre del producto'
                    className={styles.input()}
                  />
                </div>

                <div className='md:col-span-5 lg:col-span-4 space-y-2'>
                  <label
                    className={`${styles.label()} text-xs font-semibold uppercase tracking-wide`}
                  >
                    Código de barras
                  </label>
                  <Input
                    name='barcode'
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder='Escanea o ingresa el código'
                    className={styles.input()}
                  />
                </div>

                <div className='md:col-span-6 space-y-2'>
                  <label
                    className={`${styles.label()} text-xs font-semibold uppercase tracking-wide`}
                  >
                    {t('products.category_label')} *
                  </label>
                  <select
                    name='id_category'
                    value={formData.id_category}
                    onChange={handleChange}
                    required
                    disabled={categoriesLoading}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition ${styles.input()} ${
                      categoriesLoading ? 'opacity-60' : ''
                    }`}
                  >
                    <option value=''>
                      {categoriesLoading
                        ? t('products.categories_loading')
                        : t('products.categories_select')}
                    </option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categoriesLoading && (
                    <div className='flex items-center gap-2 text-[0.7rem] text-muted-foreground'>
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                      Cargando categorías...
                    </div>
                  )}
                </div>

                <div className='md:col-span-6 flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3'>
                  <div className='flex-1'>
                    <p
                      className={`${styles.label()} text-xs font-semibold uppercase tracking-wide`}
                    >
                      {t('products.active_label')}
                    </p>
                    <p className='mt-1 text-[0.7rem] text-muted-foreground'>
                      Define si se mostrará en buscadores y ventas.
                    </p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Badge
                      variant={formData.state ? 'default' : 'secondary'}
                      className='product-badge'
                    >
                      {formData.state ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <input
                      type='checkbox'
                      name='state'
                      checked={formData.state}
                      onChange={handleChange}
                      className='h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <label
                  className={`${styles.label()} text-xs font-semibold uppercase tracking-wide`}
                >
                  Tipo de producto *
                </label>
                <div className='grid gap-2 md:grid-cols-3'>
                  {PRODUCT_TYPE_CARDS.map(card => {
                    const {
                      value,
                      icon: TypeIcon,
                      label,
                      badge,
                      description,
                    } = card
                    const isActive = formData.product_type === value
                    return (
                      <button
                        key={value}
                        type='button'
                        onClick={() => handleProductTypeSelect(value)}
                        className={`flex flex-col gap-2 rounded-lg border-2 p-3 text-left transition-all ${
                          isActive
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/40 hover:bg-muted/30'
                        }`}
                      >
                        <div className='flex items-center justify-between gap-2'>
                          <span
                            className={`text-sm font-semibold ${
                              isActive ? 'text-primary' : ''
                            }`}
                          >
                            {label}
                          </span>
                          <Badge
                            variant={isActive ? 'default' : 'secondary'}
                            className='text-[0.65rem] uppercase tracking-wide'
                          >
                            {badge}
                          </Badge>
                        </div>
                        <div className='flex items-start gap-2 text-[0.7rem] text-muted-foreground'>
                          <TypeIcon
                            className={`mt-0.5 h-3.5 w-3.5 ${
                              isActive ? 'text-primary' : ''
                            }`}
                          />
                          <span>{description}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <p className='text-[0.7rem] text-muted-foreground'>
                  {PRODUCT_TYPE_HINTS[formData.product_type] || ''}
                </p>
                {formData.product_type === 'PRODUCTION' && (
                  <div className='flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3 text-xs sm:text-sm'>
                    <Factory className='mt-0.5 h-4 w-4 text-primary' />
                    <div className='space-y-1'>
                      <p className='text-[0.8rem] font-semibold text-primary'>
                        Manufactura habilitada al guardar
                      </p>
                      <p className='text-muted-foreground'>
                        Después de guardar podrás configurar recetas, lotes y
                        crear insumos base desde la pestaña de manufactura del
                        producto.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className='space-y-2'>
                <label
                  className={`${styles.label()} text-xs font-semibold uppercase tracking-wide`}
                >
                  {t('products.description_label')}
                </label>
                <textarea
                  name='description'
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder='Descripción que aparecerá en listados y tickets'
                  className={`w-full resize-none ${styles.input()}`}
                />
                <p className='text-[0.7rem] text-muted-foreground'>
                  Usa este campo para detallar características, políticas o
                  recomendaciones.
                </p>
              </div>

              {isEditing && (
                <div className='grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-[0.7rem] text-muted-foreground sm:grid-cols-2'>
                  <div className='space-y-1'>
                    <span className='font-semibold text-foreground'>
                      ID interno
                    </span>
                    <p>{product.id || product.product_id}</p>
                  </div>
                  {product.user_id && (
                    <div className='space-y-1'>
                      <span className='font-semibold text-foreground'>
                        Propietario
                      </span>
                      <p>{product.user_id}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </ScrollArea>

        <div className='flex items-center gap-3 border-t bg-muted/30 px-5 py-4'>
          <div className='flex items-center gap-2 text-xs text-muted-foreground sm:text-sm'>
            {ActiveTypeIcon && (
              <ActiveTypeIcon className='h-4 w-4 text-muted-foreground' />
            )}
            <span>
              {isEditing ? 'Guardando como' : 'Se creará como'}{' '}
              <span className='font-semibold text-foreground'>
                {activeType?.label || 'Producto'}
              </span>
            </span>
          </div>
          <div className='ml-auto flex items-center gap-2 sm:gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={loading}
            >
              {t('products.cancel')}
            </Button>
            <Button
              type='submit'
              variant='default'
              disabled={loading}
              form='product-modal-form'
              className='flex items-center gap-2'
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {t('products.saving')}
                </>
              ) : (
                <>
                  <Save className='h-4 w-4' />
                  {t('products.save')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductModal
