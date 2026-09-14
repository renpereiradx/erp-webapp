import React, { useState, useEffect } from 'react'
import { Search, Check, Package, X } from 'lucide-react'
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic'
import { useI18n } from '@/lib/i18n'
import { formatCurrency } from '@/utils/currencyUtils'
import { variantService } from '@/services/variantService'
import { ProductVariant } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type PurchaseProductModalProps = ReturnType<typeof usePurchasesLogic>

export const PurchaseProductModal: React.FC<PurchaseProductModalProps> = (props) => {
  const {
    isModalOpen,
    setIsModalOpen,
    editingItemId,
    modalProductSearchRef,
    modalProductSearch,
    setModalProductSearch,
    handleModalProductSearchKeyDown,
    setShowProductDropdown,
    searchingProducts,
    showProductDropdown,
    filteredModalProducts,
    productDropdownRef,
    activeProductIndex,
    setActiveProductIndex,
    handleProductSelect,
    getProductName,
    modalSelectedProduct,
    modalQuantityRef,
    modalQuantity,
    setModalQuantity,
    modalUnit,
    setModalUnit,
    modalUnitPrice,
    setModalUnitPrice,
    modalTaxRateId,
    setModalTaxRateId,
    loading,
    taxRates,
    modalPriceIncludesTax,
    setModalPriceIncludesTax,
    pricingMode,
    setPricingMode,
    modalProfitPct,
    setModalProfitPct,
    effectiveProfitPct,
    modalSalePrice,
    setModalSalePrice,
    effectiveSalePrice,
    handleConfirmAddProduct,
    modalVariantId,
    setModalVariantId,
    setModalVariantName,
    setModalSelectedVariant,
  } = props

  const { t } = useI18n()
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [partialSelectedAttrs, setPartialSelectedAttrs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (modalSelectedProduct?.id || modalSelectedProduct?.product_id) {
      if (Array.isArray(modalSelectedProduct.variants) && modalSelectedProduct.variants.length > 0) {
        setVariants(modalSelectedProduct.variants)
        return
      }

      setLoadingVariants(true)
      const productId = modalSelectedProduct.id || modalSelectedProduct.product_id;
      const activeBranch = localStorage.getItem('activeBranch') ? parseInt(localStorage.getItem('activeBranch') as string) : undefined;
      variantService.getEnrichedVariants(productId, activeBranch, false)
        .then(data => setVariants(data))
        .catch(() => {})
        .finally(() => setLoadingVariants(false))
    } else {
      setVariants([])
      setPartialSelectedAttrs({})
      setModalVariantId(undefined)
      setModalVariantName(undefined)
      setModalSelectedVariant(undefined)
    }
  }, [modalSelectedProduct?.id, modalSelectedProduct?.product_id])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen) return;

      const isConfirmValid = !(
        !modalSelectedProduct ||
        modalQuantity === '' || Number(modalQuantity) <= 0 ||
        modalUnitPrice === '' ||
        ((modalSelectedProduct?.has_variant || modalSelectedProduct?.has_variants || variants.length > 0) && modalVariantId === undefined)
      );

      if (e.key === 'F12' || (e.key === 'Enter' && e.ctrlKey)) {
        e.preventDefault();
        if (isConfirmValid) {
          handleConfirmAddProduct();
        }
      }
      if (e.key === 'F3') {
        e.preventDefault();
        modalProductSearchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isModalOpen,
    modalSelectedProduct,
    modalQuantity,
    modalUnitPrice,
    modalVariantId,
    variants,
    handleConfirmAddProduct
  ]);

  if (!isModalOpen) return null

  const hasVariants = !!(
    modalSelectedProduct?.has_variant ||
    modalSelectedProduct?.has_variants ||
    variants.length > 0
  )

  const labelClass = 'text-label-caps uppercase text-on-surface-deep'

  return (
    <Dialog open={isModalOpen} onOpenChange={open => { if (!open) setIsModalOpen(false) }}>
      <DialogContent className='w-[95vw] max-w-5xl max-h-[95vh] p-0 overflow-hidden flex flex-col bg-surface border border-border-subtle shadow-fluent-16 rounded-xl'>
        <DialogTitle className='sr-only'>
          {editingItemId
            ? t('purchases.product_modal.title_edit', 'Editar Artículo')
            : t('purchases.product_modal.title_add', 'Agregar Artículo de Compra')}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          {t('purchases.product_modal.subtitle', 'Seleccione un producto, configure cantidad, costo y estrategia de precio')}
        </DialogDescription>

        {/* Header */}
        <header className='px-lg py-md border-b border-divider bg-surface-muted shrink-0 pr-16'>
          <h2 className='text-title-md text-foreground'>
            {editingItemId
              ? t('purchases.product_modal.title_edit', 'Editar Artículo')
              : t('purchases.product_modal.title_add', 'Agregar Artículo de Compra')}
          </h2>
          <p className='text-body-sm text-on-surface-deep mt-0.5'>
            {t('purchases.product_modal.subtitle', 'Seleccione un producto, configure cantidad, costo y estrategia de precio')}
          </p>
        </header>

        {/* Content - 2-column layout */}
        <div className='flex-1 overflow-y-auto p-lg'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-lg'>
            {/* Column 1: Product Search, Selection & Basic Info */}
            <div className='space-y-md'>
              {/* Product Search */}
              <div className='space-y-xs'>
                <Label htmlFor='purchase-product-search' className={labelClass}>
                  {t('purchases.product_modal.search_label', 'Buscar Producto')}
                </Label>
                <div className='relative'>
                  <Search
                    className='absolute left-3 top-1/2 -translate-y-1/2 text-outline-fg'
                    size={16}
                    aria-hidden='true'
                  />
                  <input
                    ref={modalProductSearchRef}
                    id='purchase-product-search'
                    autoFocus
                    type='text'
                    className='w-full pl-9 pr-9 py-2.5 bg-surface-muted border border-border-subtle rounded-input text-body-md text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-150'
                    placeholder={t('purchases.product_modal.search_placeholder', 'Buscar por SKU, EAN o Nombre...')}
                    value={modalProductSearch}
                    onChange={e => setModalProductSearch(e.target.value)}
                    onKeyDown={handleModalProductSearchKeyDown}
                    onFocus={() => setShowProductDropdown(true)}
                  />
                  {searchingProducts && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin' aria-hidden='true' />
                  )}

                  {showProductDropdown &&
                    filteredModalProducts.length > 0 && (
                      <div
                        ref={productDropdownRef}
                        className='absolute top-full left-0 right-0 mt-1 bg-surface rounded-md shadow-fluent-8 border border-border-subtle overflow-hidden z-50 max-h-[220px] overflow-y-auto py-1'
                        role='listbox'
                      >
                        {filteredModalProducts.map((p, index) => {
                          const isActive = activeProductIndex === index

                          return (
                            <div
                              key={p.variant_id || p.id || p.product_id}
                              data-product-index={index}
                              role='option'
                              aria-selected={isActive}
                              className={cn(
                                'relative px-md py-2.5 cursor-pointer flex justify-between items-center transition-colors duration-150',
                                index < filteredModalProducts.length - 1 && 'border-b border-border-subtle',
                                isActive
                                  ? 'bg-primary/5 ring-1 ring-inset ring-primary'
                                  : 'hover:bg-surface-muted'
                              )}
                              onMouseEnter={() =>
                                setActiveProductIndex(index)
                              }
                              onClick={() => handleProductSelect(p)}
                            >
                              {isActive && (
                                <span
                                  className='absolute left-0 top-1 bottom-1 w-1 rounded-r-sm bg-primary'
                                  aria-hidden='true'
                                />
                              )}
                              <div className='min-w-0 flex-1'>
                                <div
                                  className={cn(
                                    'text-body-md-bold truncate',
                                    isActive ? 'text-primary' : 'text-foreground'
                                  )}
                                >
                                  {/* Fila plana: "Producto · Variante" cuando la unidad es una variante */}
                                  {p.variant_name
                                    ? `${getProductName(p)} · ${p.variant_name}`
                                    : getProductName(p)}
                                </div>
                                <div className='flex flex-wrap gap-1.5 mt-0.5 items-center'>
                                  <span className='text-body-sm font-data-mono text-outline-fg'>
                                    {p.sku || `ID: ${p.id || p.product_id || '-'}`}
                                  </span>
                                  {/* Fila base de un producto con variantes */}
                                  {p.is_base_row && (
                                    <Badge variant='secondary' size='sm'>
                                      {t('purchases.product_modal.base_row', 'Producto base')}
                                    </Badge>
                                  )}
                                  {/* Indicador de variantes (solo filas sin variante resuelta) */}
                                  {!p.variant_id && ((p.has_variant || p.has_variants) || (Array.isArray(p.variants) && p.variants.length > 0)) && (
                                    <Badge variant='info' size='sm'>
                                      {t('purchases.product_modal.variants_badge', 'Variantes')}
                                    </Badge>
                                  )}
                                  {/* Marca */}
                                  {p.brand_name && (
                                    <Badge variant='secondary' size='sm'>
                                      {p.brand_name}
                                    </Badge>
                                  )}
                                  {/* Tags (máx 2, color dinámico del dato) */}
                                  {Array.isArray(p.tags) && p.tags.slice(0, 2).map((tag: any) => (
                                    <span
                                      key={tag.id}
                                      className='inline-flex items-center px-1.5 py-0.5 rounded-xs text-body-sm-bold text-on-primary'
                                      style={tag.color ? { backgroundColor: tag.color } : undefined}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className='text-right shrink-0 ml-3'>
                                <div
                                  className={cn(
                                    'text-body-sm font-data-mono',
                                    (p.stock_quantity ?? p.stock ?? p.quantity_available ?? 0) > 0 ? 'text-success' : 'text-error'
                                  )}
                                >
                                  {t('purchases.product_modal.stock_label', 'Stock:')}{' '}
                                  {p.stock_quantity ?? p.stock ?? p.quantity_available ?? 0}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                </div>
              </div>

              {/* Selected Product Card */}
              {modalSelectedProduct ? (
                <>
                  <div className='p-md bg-primary/5 border border-primary/20 rounded-md'>
                    <div className='flex items-start gap-md'>
                      <div className='size-10 bg-primary rounded-md flex items-center justify-center text-on-primary text-title-md shrink-0'>
                        {(
                          modalSelectedProduct.name ||
                          modalSelectedProduct.product_name ||
                          '?'
                        )?.charAt(0)}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-start justify-between gap-2 flex-wrap'>
                          <h3 className='text-body-md-bold text-foreground'>
                            {modalSelectedProduct.name ||
                              modalSelectedProduct.product_name ||
                              '-'}
                          </h3>
                          <div className='flex items-center gap-1.5 shrink-0 flex-wrap'>
                            {/* Badge: Con Variantes */}
                            {hasVariants && (
                              <Badge variant='info' size='sm'>
                                <Package size={10} className='mr-1' aria-hidden='true' />
                                {t('purchases.product_modal.variants_badge', 'Variantes')}
                              </Badge>
                            )}
                            {/* Badge: Marca */}
                            {modalSelectedProduct.brand_name && (
                              <Badge variant='secondary' size='sm'>
                                {modalSelectedProduct.brand_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Tags row (color dinámico del dato) */}
                        {modalSelectedProduct.tags && modalSelectedProduct.tags.length > 0 && (
                          <div className='flex flex-wrap gap-1 mt-1.5'>
                            {modalSelectedProduct.tags.slice(0, 5).map((tag: any) => (
                              <span
                                key={tag.id}
                                className='inline-flex items-center px-1.5 py-0.5 rounded-xs text-body-sm-bold text-on-primary'
                                style={tag.color ? { backgroundColor: tag.color } : undefined}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {modalSelectedProduct.tags.length > 5 && (
                              <span className='text-body-sm text-outline-fg'>
                                +{modalSelectedProduct.tags.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                        <div className='grid grid-cols-4 gap-2 mt-2'>
                          <div>
                            <p className={labelClass}>ID</p>
                            <p className='text-body-sm text-on-surface-deep font-data-mono'>
                              {modalSelectedProduct.id ||
                                modalSelectedProduct.product_id ||
                                '-'}
                            </p>
                          </div>
                          <div>
                            <p className={labelClass}>
                              {t('purchases.product_modal.last_cost', 'Últ. Costo')}
                            </p>
                            <p className='text-body-sm font-data-mono text-on-surface-deep'>
                              {formatCurrency(
                                modalSelectedProduct.last_purchase_cost ||
                                  modalSelectedProduct.cost_price ||
                                  0
                              )}
                            </p>
                          </div>
                          <div>
                            <p className={labelClass}>
                              {t('purchases.product_modal.sale_price', 'Precio Venta')}
                            </p>
                            <p className='text-body-sm font-data-mono text-primary'>
                              {formatCurrency(
                                modalSelectedProduct.sale_price || modalSelectedProduct.unit_price || modalSelectedProduct.price || 0
                              )}
                            </p>
                          </div>
                          <div>
                            <p className={labelClass}>
                              {t('purchases.product_modal.unit_label', 'Unidad')}
                            </p>
                            <p className='text-body-sm text-on-surface-deep'>
                              {modalSelectedProduct.unit ||
                                modalSelectedProduct.unit_name ||
                                'unit'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>


                  {hasVariants && (
                    <div className='mt-1 space-y-md'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-body-md-bold text-foreground'>
                          {t('purchases.product_modal.select_variant', 'Seleccionar Variante')}{' '}
                          <span className='text-error'>*</span>
                        </Label>
                        {modalVariantId && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setModalVariantId(undefined);
                              setModalVariantName(undefined);
                              setModalSelectedVariant(undefined);
                            }}
                            className='text-outline-fg'
                          >
                            <X size={12} className='mr-1' aria-hidden='true' />
                            {t('purchases.product_modal.clear', 'Limpiar')}
                          </Button>
                        )}
                      </div>

                      {loadingVariants ? (
                        <div className='flex items-center gap-sm py-3 text-on-surface-deep text-body-md'>
                          <div className='w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin' aria-hidden='true' />
                          {t('purchases.product_modal.loading_variants', 'Cargando variantes...')}
                        </div>
                      ) : variants.length === 0 ? (
                        <div className='py-3 text-body-md text-warning flex items-center gap-sm'>
                          <Package size={16} aria-hidden='true' />
                          {t('purchases.product_modal.no_variants', 'Este producto no tiene variantes activas')}
                        </div>
                      ) : (() => {
                        // Extraer atributos únicos de todas las variantes activas
                        const allAttrKeys = Array.from(
                          new Set(variants.flatMap(v => Object.keys(v.variant_attributes || {})))
                        );

                        // Estado de selección por atributo
                        const selectedAttrs: Record<string, string> = { ...partialSelectedAttrs };
                        // Asegurar que si modalVariantId existe pero partialSelectedAttrs no tiene los attrs, se sincronicen (útil al editar)
                        if (modalVariantId && Object.keys(partialSelectedAttrs).length === 0) {
                          const sv = variants.find(v => v.id === modalVariantId);
                          if (sv?.variant_attributes) {
                            Object.assign(selectedAttrs, sv.variant_attributes);
                            // Sincronizamos en el ciclo siguiente para que la UI ya tenga este estado
                            setTimeout(() => setPartialSelectedAttrs(sv.variant_attributes || {}), 0);
                          }
                        }

                        // Función para seleccionar un valor de atributo
                        const handleAttrSelect = (attrKey: string, attrValue: string) => {
                          const newSelected = { ...selectedAttrs };
                          if (newSelected[attrKey] === attrValue) {
                            delete newSelected[attrKey]; // Deseleccionar
                          } else {
                            newSelected[attrKey] = attrValue;
                          }

                          setPartialSelectedAttrs(newSelected);

                          // Buscar la variante que coincida con los atributos seleccionados hasta ahora
                          const matched = variants.find(v =>
                            Object.entries(newSelected).every(
                              ([k, val]) => String(v.variant_attributes?.[k]) === String(val)
                            )
                          );
                          if (matched && Object.keys(newSelected).length === allAttrKeys.length) {
                            setModalVariantId(matched.id);
                            setModalVariantName(matched.variant_name);
                            setModalSelectedVariant(matched);
                          } else {
                            // Parcialmente seleccionado: limpiar variante
                            setModalVariantId(undefined);
                            setModalVariantName(undefined);
                            setModalSelectedVariant(undefined);
                            // Si hay solo 1 atributo y se seleccionó, también auto-seleccionar
                            if (allAttrKeys.length === 1 && matched) {
                              setModalVariantId(matched.id);
                              setModalVariantName(matched.variant_name);
                              setModalSelectedVariant(matched);
                            }
                          }
                        };

                        return (
                          <div className='space-y-md'>
                            {allAttrKeys.map(attrKey => {
                              // Opciones disponibles para este atributo dado lo ya seleccionado en OTROS atributos
                              const otherSelectedAttrs = Object.fromEntries(
                                Object.entries(selectedAttrs).filter(([k]) => k !== attrKey)
                              );
                              const availableForThisAttr = Array.from(
                                new Set(
                                  variants
                                    .filter(v =>
                                      Object.entries(otherSelectedAttrs).every(
                                        ([k, val]) => String(v.variant_attributes?.[k]) === String(val)
                                      )
                                    )
                                    .map(v => String(v.variant_attributes?.[attrKey]))
                                    .filter(Boolean)
                                )
                              );

                              const selectedValue = selectedAttrs[attrKey];

                              return (
                                <div key={attrKey} className='space-y-1.5'>
                                  <span className={labelClass}>
                                    {attrKey}
                                  </span>
                                  <div className='flex flex-wrap gap-2'>
                                    {availableForThisAttr.map(val => {
                                      const isSelected = selectedValue === val;

                                      return (
                                        <button
                                          key={val}
                                          type='button'
                                          onClick={() => handleAttrSelect(attrKey, val)}
                                          className={cn(
                                            'px-md py-1.5 text-body-sm-bold rounded-md border transition-colors duration-150 cursor-pointer',
                                            isSelected
                                              ? 'bg-primary text-on-primary border-primary'
                                              : 'bg-surface-muted text-foreground border-border-subtle hover:border-primary hover:text-primary'
                                          )}
                                        >
                                          {val}
                                          {isSelected && (
                                            <Check size={12} className='inline ml-1 -mt-0.5' aria-hidden='true' />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Resumen de variante seleccionada */}
                            {modalVariantId && (() => {
                              const sv = variants.find(v => v.id === modalVariantId);
                              if (!sv) return null;
                              const stock = sv.stock_quantity ?? 0;
                              return (
                                <div className={cn(
                                  'flex items-center justify-between px-md py-2 rounded-md border text-body-sm-bold transition-colors duration-150',
                                  stock > 0
                                    ? 'bg-success/10 border-success/20 text-success'
                                    : 'bg-error-container border-error/20 text-on-error-container'
                                )}>
                                  <span className='flex items-center gap-1.5'>
                                    <Check size={12} aria-hidden='true' />
                                    {sv.variant_name || sv.sku}
                                    {sv.sku && sv.sku !== sv.variant_name && (
                                      <span className='opacity-70 font-data-mono'>· {sv.sku}</span>
                                    )}
                                  </span>
                                  <span className='font-data-mono'>
                                    {t('purchases.product_modal.stock_label', 'Stock:')} {stock}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}

                      {/* Opción para agregar producto base (principal) */}
                      <div className='mt-1 pt-md border-t border-border-subtle'>
                        <button
                          type='button'
                          onClick={() => {
                            setModalVariantId(null);
                            setModalVariantName(undefined);
                            setModalSelectedVariant(undefined);
                          }}
                          className={cn(
                            'w-full px-md py-2 text-body-sm-bold rounded-md border transition-colors duration-150 flex items-center justify-center gap-sm cursor-pointer',
                            modalVariantId === null
                              ? 'bg-primary text-on-primary border-primary'
                              : 'bg-surface-muted text-foreground border-border-subtle hover:border-primary hover:text-primary'
                          )}
                        >
                          <Package size={14} aria-hidden='true' />
                          {t('purchases.product_modal.add_base', 'Añadir producto principal sin variante')}
                          {modalVariantId === null && <Check size={14} aria-hidden='true' />}
                        </button>
                      </div>
                    </div>
                  )}

                </>
              ) : (
                <div className='h-24 border-2 border-dashed border-border-subtle rounded-md flex flex-col items-center justify-center'>
                  <Package
                    size={24}
                    className='text-outline-fg'
                    aria-hidden='true'
                  />
                  <p className='text-body-sm text-outline-fg mt-1'>
                    {t('purchases.product_modal.select_placeholder', 'Selecciona un producto')}
                  </p>
                </div>
              )}

              {/* Quantity, Unit & Cost */}
              <div className='grid grid-cols-3 gap-md'>
                <div className='space-y-1.5'>
                  <Label htmlFor='purchase-modal-quantity' className={labelClass}>
                    {t('purchases.product_modal.quantity', 'Cantidad')}
                  </Label>
                  <Input
                    ref={modalQuantityRef}
                    id='purchase-modal-quantity'
                    type='number'
                    className='bg-surface-muted text-body-md-bold'
                    value={modalQuantity}
                    onChange={e => setModalQuantity(e.target.value)}
                    placeholder='0'
                  />
                  <p className='text-body-sm text-outline-fg'>
                    {t('purchases.product_modal.quantity_hint', 'Unidades a comprar')}
                  </p>
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='purchase-modal-unit' className={labelClass}>
                    {t('purchases.product_modal.unit_label', 'Unidad')}
                  </Label>
                  <Input
                    id='purchase-modal-unit'
                    type='text'
                    list='allowed-units'
                    className='bg-surface-muted text-body-md-bold'
                    value={modalUnit}
                    onChange={e => setModalUnit(e.target.value)}
                    placeholder={t('purchases.product_modal.unit_placeholder', 'Ej. kg, box, unit')}
                  />
                  <datalist id='allowed-units'>
                    <option value='unit' />
                    <option value='kg' />
                    <option value='g' />
                    <option value='l' />
                    <option value='box' />
                    <option value='pack' />
                    <option value='dozen' />
                  </datalist>
                  <p className='text-body-sm text-outline-fg'>
                    {t('purchases.product_modal.unit_hint', 'Medida de compra')}
                  </p>
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='purchase-modal-cost' className={labelClass}>
                    {t('purchases.product_modal.cost', 'Costo Unit.')}
                  </Label>
                  <Input
                    id='purchase-modal-cost'
                    type='number'
                    className='bg-surface-muted text-body-md-bold'
                    value={modalUnitPrice}
                    onChange={e => setModalUnitPrice(e.target.value)}
                    placeholder='0.00'
                  />
                  <p className='text-body-sm text-outline-fg truncate' title={t('purchases.product_modal.cost_hint', 'Precio por unidad')}>
                    {t('purchases.product_modal.cost_hint', 'Precio por unidad')}
                  </p>
                </div>
              </div>

              {/* Tax Rate */}
              <div className='space-y-1.5'>
                <Label htmlFor='purchase-modal-tax' className={labelClass}>
                  {t('purchases.modal.tax_rate', 'Tasa de Impuesto')}
                </Label>
                <select
                  id='purchase-modal-tax'
                  className='w-full px-md py-2.5 bg-surface-muted border border-border-subtle rounded-input text-body-md text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors duration-150 cursor-pointer'
                  value={modalTaxRateId || ''}
                  onChange={e =>
                    setModalTaxRateId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  disabled={loading}
                >
                  <option value=''>
                    {loading
                      ? t('common.loading', 'Cargando...')
                      : t('purchases.modal.no_tax', 'Sin impuesto')}
                  </option>
                  {taxRates.map(taxRate => (
                    <option key={taxRate.id} value={taxRate.id}>
                      {taxRate.tax_name} - {taxRate.rate}%{' '}
                      {taxRate.country ? `(${taxRate.country})` : ''}
                    </option>
                  ))}
                </select>
                {modalSelectedProduct && (
                  <div className='mt-1.5'>
                    {(() => {
                      const productTaxId = modalSelectedProduct.tax?.rate?.id || modalSelectedProduct.applicable_tax_rate?.id || modalSelectedProduct.tax_rate_id;
                      const categoryTaxId = modalSelectedProduct.category?.default_tax_rate?.id || modalSelectedProduct.category?.default_tax_rate_id;
                      const categoryName = modalSelectedProduct.category?.name || '';

                      if (modalTaxRateId && modalTaxRateId === productTaxId) {
                        return (
                          <Badge variant='info' size='sm'>
                            <span className='size-1.5 rounded-full bg-current mr-1 animate-pulse' aria-hidden='true' />
                            {t('purchases.product_modal.tax_source_product', 'Impuesto específico del producto')}
                          </Badge>
                        );
                      } else if (modalTaxRateId && modalTaxRateId === categoryTaxId) {
                        return (
                          <Badge variant='success' size='sm'>
                            <span className='size-1.5 rounded-full bg-current mr-1 animate-pulse' aria-hidden='true' />
                            {t('purchases.product_modal.tax_source_category', 'Impuesto sugerido por categoría {category}', { category: categoryName })}
                          </Badge>
                        );
                      } else if (modalTaxRateId) {
                        return (
                          <Badge variant='warning' size='sm'>
                            <span className='size-1.5 rounded-full bg-current mr-1' aria-hidden='true' />
                            {t('purchases.product_modal.tax_source_custom', 'Impuesto personalizado manualmente')}
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Price Includes Tax Toggle */}
              <div className='flex items-center gap-md p-2.5 bg-surface-muted border border-border-subtle rounded-md'>
                <input
                  type='checkbox'
                  id='priceIncludesTax'
                  className='w-4 h-4 accent-primary cursor-pointer'
                  checked={modalPriceIncludesTax}
                  onChange={e => setModalPriceIncludesTax(e.target.checked)}
                />
                <label
                  htmlFor='priceIncludesTax'
                  className='text-body-md-bold text-foreground cursor-pointer select-none'
                >
                  {t('purchases.modal.price_includes_tax', 'Precio incluye IVA')}
                </label>
              </div>
            </div>

            {/* Column 2: Pricing Strategy & Financial Summary */}
            <div className='space-y-md'>
              {/* Pricing Mode Toggle */}
              <div className='space-y-1.5'>
                <Label className={labelClass}>
                  {t('purchases.product_modal.pricing_strategy', 'Estrategia de Precio de Venta')}
                </Label>
                <div className='flex p-0.5 bg-surface-subtle rounded-md' role='tablist'>
                  {([
                    { id: 'margin', label: t('purchases.product_modal.mode_margin', 'Por Margen %') },
                    { id: 'sale_price', label: t('purchases.product_modal.mode_fixed', 'Precio Fijo') },
                  ]).map(mode => (
                    <button
                      key={mode.id}
                      role='tab'
                      aria-selected={pricingMode === mode.id}
                      className={cn(
                        'flex-1 py-2.5 text-body-sm-bold rounded-sm transition-colors duration-150 cursor-pointer',
                        pricingMode === mode.id
                          ? 'bg-surface text-primary shadow-fluent-2'
                          : 'text-on-surface-deep hover:text-foreground'
                      )}
                      onClick={() => setPricingMode(mode.id as 'margin' | 'sale_price')}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margin & Price Fields */}
              <div className='grid grid-cols-2 gap-md'>
                <div className='space-y-1.5'>
                  <Label htmlFor='purchase-modal-margin' className={labelClass}>
                    {pricingMode === 'margin'
                      ? t('purchases.product_modal.margin_label_margin', 'Margen de Ganancia')
                      : t('purchases.product_modal.margin_label_calc', 'Margen Calculado')}
                  </Label>
                  <div className='relative'>
                    <Input
                      id='purchase-modal-margin'
                      type='number'
                      className={cn(
                        'bg-surface-muted text-body-md-bold pr-8',
                        pricingMode !== 'margin'
                          ? 'opacity-60 cursor-not-allowed text-outline-fg'
                          : 'text-success'
                      )}
                      value={
                        pricingMode === 'margin'
                          ? modalProfitPct
                          : effectiveProfitPct.toFixed(1)
                      }
                      onChange={e =>
                        pricingMode === 'margin' &&
                        setModalProfitPct(Number(e.target.value))
                      }
                      readOnly={pricingMode !== 'margin'}
                    />
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-body-md text-outline-fg'>
                      %
                    </span>
                  </div>
                  <p className='text-body-sm text-outline-fg'>
                    {pricingMode === 'margin'
                      ? t('purchases.product_modal.margin_hint_margin', 'Define el % de ganancia deseado')
                      : t('purchases.product_modal.margin_hint_calc', 'Porcentaje resultante del precio fijo')}
                  </p>
                </div>
                <div className='space-y-1.5'>
                  <Label htmlFor='purchase-modal-sale-price' className={labelClass}>
                    {pricingMode === 'sale_price'
                      ? t('purchases.product_modal.price_label_fixed', 'Precio de Venta')
                      : t('purchases.product_modal.price_label_suggested', 'Precio Sugerido')}
                  </Label>
                  <Input
                    id='purchase-modal-sale-price'
                    type='number'
                    className={cn(
                      'bg-surface-muted text-body-md-bold',
                      pricingMode !== 'sale_price'
                        ? 'opacity-60 cursor-not-allowed text-outline-fg'
                        : 'text-primary'
                    )}
                    value={
                      pricingMode === 'sale_price'
                        ? modalSalePrice
                        : effectiveSalePrice.toFixed(0)
                    }
                    onChange={e =>
                      pricingMode === 'sale_price' &&
                      setModalSalePrice(Number(e.target.value))
                    }
                    readOnly={pricingMode !== 'sale_price'}
                  />
                  <p className='text-body-sm text-outline-fg'>
                    {pricingMode === 'sale_price'
                      ? t('purchases.product_modal.price_hint_fixed', 'Precio final al público')
                      : t('purchases.product_modal.price_hint_suggested', 'Calculado según margen')}
                  </p>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className='p-md bg-primary/5 rounded-md border border-primary/20'>
                <div className='grid grid-cols-2 gap-md'>
                  <div>
                    <span className='block text-body-sm text-outline-fg'>
                      {t('purchases.product_modal.unit_cost', 'Costo Unitario')}
                    </span>
                    <span className='text-data-mono font-data-mono text-foreground'>
                      {formatCurrency(modalUnitPrice || 0)}
                    </span>
                  </div>
                  <div>
                    <span className='block text-body-sm text-outline-fg'>
                      {t('purchases.product_modal.unit_sale_price', 'Precio Venta Unitario')}
                    </span>
                    <span className='text-data-mono font-data-mono text-success'>
                      {formatCurrency(effectiveSalePrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Projection Panel */}
              <div className='p-md bg-surface-subtle rounded-md border border-border-subtle'>
                <div className='text-label-caps uppercase text-on-surface-deep mb-md'>
                  {t('purchases.product_modal.projection', 'Proyección Financiera')}
                </div>
                <div className='space-y-2'>
                  {/* Resumen de Línea */}
                  <div className='flex justify-between items-center py-2 border-b border-border-subtle'>
                    <span className='text-body-sm text-on-surface-deep'>
                      {t('purchases.product_modal.line_subtotal', 'Subtotal Línea')}
                    </span>
                    <span className='text-body-sm font-data-mono text-outline-fg'>
                      {modalQuantity || 0} ×{' '}
                      {formatCurrency(modalUnitPrice || 0)}
                    </span>
                  </div>

                  {/* Total Compra */}
                  <div className='flex justify-between items-center py-2 border-b border-border-subtle'>
                    <span className='text-body-md text-on-surface-deep'>
                      {t('purchases.totals.total', 'Total Compra')}
                    </span>
                    <span className='text-body-md font-data-mono text-foreground'>
                      {formatCurrency(
                        (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0),
                      )}
                    </span>
                  </div>

                  {/* Total Venta Esperado */}
                  <div className='flex justify-between items-center py-2 border-b border-border-subtle'>
                    <span className='text-body-md text-on-surface-deep'>
                      {t('purchases.totals.expected_sale', 'Venta Esperada')}
                    </span>
                    <span className='text-body-md font-data-mono text-primary'>
                      {formatCurrency(
                        (Number(modalQuantity) || 0) * effectiveSalePrice,
                      )}
                    </span>
                  </div>

                  {/* Ganancia Esperada */}
                  <div className='flex justify-between items-center pt-2'>
                    <span className='text-body-md-bold text-foreground'>
                      {t('purchases.product_modal.expected_profit', 'Ganancia Esperada')}
                    </span>
                    <div className='text-right'>
                      <span
                        className={cn(
                          'text-title-md font-data-mono text-data-mono',
                          (Number(modalQuantity) || 0) * effectiveSalePrice - (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0) >= 0 ? 'text-success' : 'text-error'
                        )}
                      >
                        {formatCurrency(
                          (Number(modalQuantity) || 0) * effectiveSalePrice -
                            (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0),
                        )}
                      </span>
                      {(Number(modalQuantity) || 0) > 0 &&
                        (Number(modalUnitPrice) || 0) > 0 && (
                          <span className='ml-1.5 text-body-sm text-success'>
                            (+{effectiveProfitPct.toFixed(1)}%)
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className='px-lg py-md border-t border-divider bg-surface-muted flex justify-end items-center gap-md shrink-0'>
          <Button variant='secondary' onClick={() => setIsModalOpen(false)}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button variant='ghost' onClick={() => setModalVariantId(null)}>
            {t('purchases.product_modal.select_generic', 'Seleccionar Producto Genérico')}
          </Button>
          <Button
            variant='primary'
            onClick={handleConfirmAddProduct}
            disabled={
              !modalSelectedProduct ||
              modalQuantity === '' || Number(modalQuantity) <= 0 ||
              modalUnitPrice === '' ||
              (hasVariants && modalVariantId === undefined)
            }
          >
            {editingItemId
              ? t('purchases.product_modal.save', 'Guardar Cambios')
              : t('purchases.product_modal.add_to_order', 'Agregar a la Orden')}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
