import React, { useState, useEffect } from 'react'
import { X, Search, Check, Package } from 'lucide-react'
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic'
import { formatCurrency } from '@/utils/currencyUtils'
import { variantService } from '@/services/variantService'
import { ProductVariant } from '@/types'

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
    t,
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

  if (!isModalOpen) return null

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4'>
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity'
        onClick={() => setIsModalOpen(false)}
      ></div>
      <div className='relative bg-surface-container-lowest w-full max-w-4xl max-h-[98vh] rounded-md shadow-whisper overflow-hidden flex flex-col border border-surface-variant'>
        {/* Header */}
        <header className='px-5 py-3 border-b border-surface-variant flex justify-between items-center bg-surface-container-low shrink-0'>
          <div>
            <h3 className='text-base font-semibold text-on-surface'>
              {editingItemId
                ? 'Editar Artículo'
                : 'Agregar Artículo de Compra'}
            </h3>
            <p className='text-xs text-on-surface-variant mt-0.5'>
              Seleccione un producto, configure cantidad, costo y estrategia
              de precio
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className='w-8 h-8 flex items-center justify-center text-outline hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all'
          >
            <X size={18} />
          </button>
        </header>

        {/* Content - 2-column layout */}
        <div className='flex-1 overflow-y-auto p-5'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
            {/* Column 1: Product Search, Selection & Basic Info */}
            <div className='space-y-4'>
              {/* Product Search */}
              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-on-surface-variant'>
                  Buscar Producto
                </label>
                <div className='relative'>
                  <Search
                    className='absolute left-3 top-1/2 -translate-y-1/2 text-outline'
                    size={16}
                  />
                  <input
                    ref={modalProductSearchRef}
                    autoFocus
                    type='text'
                    className='w-full pl-9 pr-9 py-2.5 bg-surface-container-low border border-surface-variant rounded-md text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all'
                    placeholder='Buscar por SKU, EAN o Nombre...'
                    value={modalProductSearch}
                    onChange={e => setModalProductSearch(e.target.value)}
                    onKeyDown={handleModalProductSearchKeyDown}
                    onFocus={() => setShowProductDropdown(true)}
                  />
                  {searchingProducts && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--fluent-brand-primary,#0078D4)] border-t-transparent rounded-full animate-spin'></div>
                  )}

                  {showProductDropdown &&
                    filteredModalProducts.length > 0 && (
                      <div
                        ref={productDropdownRef}
                        className='absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-md shadow-md border border-surface-variant overflow-hidden z-50 max-h-[220px] overflow-y-auto'
                      >
                        {filteredModalProducts.map((p, index) => {
                          const isActive = activeProductIndex === index

                          return (
                            <div
                              key={p.id || p.product_id}
                              data-product-index={index}
                              role='option'
                              aria-selected={isActive}
                              className={`relative px-4 py-2.5 cursor-pointer border-b border-surface-variant last:border-none flex justify-between items-center transition-colors ${
                                isActive
                                  ? 'bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-130,#605E5C)] ring-1 ring-inset ring-[var(--fluent-brand-primary,#0078D4)]'
                                  : 'hover:bg-surface-container-highest'
                              }`}
                              onMouseEnter={() =>
                                setActiveProductIndex(index)
                              }
                              onClick={() => handleProductSelect(p)}
                            >
                              {isActive && (
                                <span
                                  className='absolute left-0 top-1 bottom-1 w-1 rounded-r bg-[var(--fluent-brand-primary,#0078D4)]'
                                  aria-hidden='true'
                                />
                              )}
                              <div className='min-w-0 flex-1'>
                                <div
                                  className={`font-medium text-sm truncate ${
                                    isActive
                                      ? 'text-primary'
                                      : 'text-on-surface'
                                  }`}
                                >
                                  {getProductName(p)}
                                </div>
                                <div className='flex flex-wrap gap-1.5 mt-0.5 items-center'>
                                  <span className='text-[10px] text-outline'>
                                    ID: {p.id || p.product_id || '-'}
                                  </span>
                                  {/* Indicador de variantes */}
                                  {((p.has_variant || p.has_variants) || (Array.isArray(p.variants) && p.variants.length > 0)) && (
                                    <span className='text-[9px] px-1 py-0.5 rounded bg-[rgba(0,120,212,0.1)] border border-[rgba(0,120,212,0.25)] text-primary font-semibold'>
                                      variantes
                                    </span>
                                  )}
                                  {/* Marca */}
                                  {p.brand_name && (
                                    <span className='text-[9px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 font-medium'>
                                      {p.brand_name}
                                    </span>
                                  )}
                                  {/* Tags (máx 2) */}
                                  {Array.isArray(p.tags) && p.tags.slice(0, 2).map((tag: any) => (
                                    <span
                                      key={tag.id}
                                      className='text-[9px] px-1 py-0.5 rounded text-white font-semibold'
                                      style={{ backgroundColor: tag.color || '#8b5cf6' }}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className='text-right flex-shrink-0 ml-3'>
                                <div
                                  className={`text-[10px] font-medium ${(p.stock_quantity ?? p.stock ?? p.quantity_available ?? 0) > 0 ? 'text-success' : 'text-error'}`}
                                >
                                  Stock:{' '}
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
                  <div className='p-4 bg-[rgba(0,120,212,0.06)] dark:bg-[rgba(0,120,212,0.12)] border border-[rgba(0,120,212,0.15)] rounded-[var(--fluent-corner-radius-large,6px)]'>
                  <div className='flex items-start gap-3'>
                    <div className='w-10 h-10 bg-[var(--fluent-brand-primary,#0078D4)] rounded-md flex items-center justify-center text-white font-semibold text-lg shrink-0'>
                      {(
                        modalSelectedProduct.name ||
                        modalSelectedProduct.product_name ||
                        '?'
                      )?.charAt(0)}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-start justify-between gap-2 flex-wrap'>
                        <h4 className='font-semibold text-sm text-on-surface'>
                          {modalSelectedProduct.name ||
                            modalSelectedProduct.product_name ||
                            '-'}
                        </h4>
                        <div className='flex items-center gap-1.5 flex-shrink-0 flex-wrap'>
                          {/* Badge: Con Variantes */}
                          {(modalSelectedProduct.has_variant || modalSelectedProduct.has_variants || variants.length > 0) && (
                            <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--fluent-corner-radius-small,2px)] bg-[rgba(0,120,212,0.1)] border border-[rgba(0,120,212,0.25)] text-primary text-[9px] font-semibold uppercase tracking-wide'>
                              <Package size={9} /> Variantes
                            </span>
                          )}
                          {/* Badge: Marca */}
                          {modalSelectedProduct.brand_name && (
                            <span className='inline-flex items-center px-1.5 py-0.5 rounded-[var(--fluent-corner-radius-small,2px)] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[9px] font-medium'>
                              {modalSelectedProduct.brand_name}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Tags row */}
                      {modalSelectedProduct.tags && modalSelectedProduct.tags.length > 0 && (
                        <div className='flex flex-wrap gap-1 mt-1.5'>
                          {modalSelectedProduct.tags.slice(0, 5).map((tag: any) => (
                            <span
                              key={tag.id}
                              className='inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold text-white'
                              style={{ backgroundColor: tag.color || '#8b5cf6' }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {modalSelectedProduct.tags.length > 5 && (
                            <span className='text-[9px] text-outline'>
                              +{modalSelectedProduct.tags.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                      <div className='grid grid-cols-4 gap-2 mt-2'>
                        <div>
                          <p className='text-[10px] text-outline'>
                            ID
                          </p>
                          <p className='text-xs text-on-surface-variant'>
                            {modalSelectedProduct.id ||
                              modalSelectedProduct.product_id ||
                              '-'}
                          </p>
                        </div>
                        <div>
                          <p className='text-[10px] text-outline'>
                            Últ. Costo
                          </p>
                          <p className='text-xs text-on-surface-variant font-semibold'>
                            {formatCurrency(
                              modalSelectedProduct.last_purchase_cost ||
                                modalSelectedProduct.cost_price ||
                                0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className='text-[10px] text-outline'>
                            Precio Venta
                          </p>
                          <p className='text-xs text-on-surface-variant font-semibold text-primary'>
                            {formatCurrency(
                              modalSelectedProduct.sale_price || modalSelectedProduct.unit_price || modalSelectedProduct.price || 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className='text-[10px] text-outline'>
                            Unidad
                          </p>
                          <p className='text-xs text-on-surface-variant'>
                            {modalSelectedProduct.unit ||
                              modalSelectedProduct.unit_name ||
                              'unit'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                
                {(modalSelectedProduct?.has_variant || modalSelectedProduct?.has_variants || variants.length > 0) && (
                  <div className='mt-4 space-y-3'>
                    <div className='flex items-center justify-between'>
                      <label className='text-sm font-medium text-on-surface-variant'>
                        Seleccionar Variante <span className='text-error'>*</span>
                      </label>
                      {modalVariantId && (
                        <button
                          type='button'
                          onClick={() => {
                            setModalVariantId(undefined);
                            setModalVariantName(undefined);
                            setModalSelectedVariant(undefined);
                          }}
                          className='text-xs text-outline hover:text-error transition-colors flex items-center gap-1'
                        >
                          <X size={12} /> Limpiar
                        </button>
                      )}
                    </div>

                    {loadingVariants ? (
                      <div className='flex items-center gap-2 py-3 text-outline text-sm'>
                        <div className='w-4 h-4 border-2 border-[var(--fluent-brand-primary,#0078D4)] border-t-transparent rounded-full animate-spin' />
                        Cargando variantes...
                      </div>
                    ) : variants.length === 0 ? (
                      <div className='py-3 text-sm text-[var(--fluent-semantic-warning,#F7630C)] flex items-center gap-2'>
                        <Package size={16} />
                        Este producto no tiene variantes activas
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
                        <div className='space-y-3'>
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
                                <span className='text-xs font-semibold text-on-surface-variant uppercase tracking-wide'>
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
                                        className={`
                                          px-3 py-1.5 text-xs font-semibold rounded-md
                                          border transition-all duration-150 relative
                                          ${isSelected
                                            ? 'bg-[var(--fluent-brand-primary,#0078D4)] text-white border-[var(--fluent-brand-primary,#0078D4)] shadow-whisper'
                                            : 'bg-surface-container-low text-on-surface border-surface-variant hover:border-[var(--fluent-brand-primary,#0078D4)] hover:text-primary'
                                          }
                                        `}
                                        disabled={false}
                                      >
                                        {val}
                                        {isSelected && (
                                          <Check size={10} className='inline ml-1 -mt-0.5' />
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
                              <div className={`flex items-center justify-between px-3 py-2 rounded-md border text-xs font-medium transition-colors ${
                                stock > 0
                                  ? 'bg-[rgba(16,124,16,0.06)] border-[rgba(16,124,16,0.2)] text-success'
                                  : 'bg-[rgba(209,52,56,0.06)] border-[rgba(209,52,56,0.2)] text-error'
                              }`}>
                                <span className='flex items-center gap-1.5'>
                                  <Check size={12} />
                                  {sv.variant_name || sv.sku}
                                  {sv.sku && sv.sku !== sv.variant_name && (
                                    <span className='opacity-70 font-mono'>· {sv.sku}</span>
                                  )}
                                </span>
                                <span>
                                  Stock: <strong>{stock}</strong>
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

                    {/* Opción para agregar producto base (principal) */}
                    <div className="mt-4 pt-3 border-t border-surface-variant">
                      <button
                        type="button"
                        onClick={() => {
                          setModalVariantId(null);
                          setModalVariantName(undefined);
                          setModalSelectedVariant(undefined);
                        }}
                        className={`w-full px-3 py-2 text-xs font-semibold rounded-md border transition-all flex items-center justify-center gap-2 ${
                          modalVariantId === null
                            ? 'bg-[var(--fluent-brand-primary,#0078D4)] text-white border-[var(--fluent-brand-primary,#0078D4)] shadow-whisper'
                            : 'bg-surface-container-low text-on-surface border-surface-variant hover:border-[var(--fluent-brand-primary,#0078D4)] hover:text-primary'
                        }`}
                      >
                        <Package size={14} />
                        Añadir producto principal sin variante
                        {modalVariantId === null && <Check size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                </>
              ) : (
                <div className='h-24 border-2 border-dashed border-surface-variant rounded-[var(--fluent-corner-radius-large,6px)] flex flex-col items-center justify-center'>
                  <Package
                    size={24}
                    className='text-outline'
                  />
                  <p className='text-xs text-outline mt-1'>
                    Selecciona un producto
                  </p>
                </div>
              )}

              {/* Quantity, Unit & Cost */}
              <div className='grid grid-cols-3 gap-3'>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-on-surface-variant'>
                    Cantidad
                  </label>
                  <input
                    ref={modalQuantityRef}
                    type='number'
                    className='w-full px-3 py-2.5 bg-surface-container-low border border-surface-variant rounded-md text-base font-semibold text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all'
                    value={modalQuantity}
                    onChange={e => setModalQuantity(e.target.value)}
                    placeholder='0'
                  />
                  <p className='text-xs text-outline'>
                    Unidades a comprar
                  </p>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-on-surface-variant'>
                    Unidad
                  </label>
                  <input
                    type='text'
                    list='allowed-units'
                    className='w-full px-3 py-2.5 bg-surface-container-low border border-surface-variant rounded-md text-base font-semibold text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all'
                    value={modalUnit}
                    onChange={e => setModalUnit(e.target.value)}
                    placeholder='Ej. kg, box, unit'
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
                  <p className='text-xs text-outline'>
                    Medida de compra
                  </p>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-on-surface-variant'>
                    Costo Unit.
                  </label>
                  <input
                    type='number'
                    className='w-full px-3 py-2.5 bg-surface-container-low border border-surface-variant rounded-md text-base font-semibold text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all'
                    value={modalUnitPrice}
                    onChange={e => setModalUnitPrice(e.target.value)}
                    placeholder='0.00'
                  />
                  <p className='text-xs text-outline truncate' title='Precio de compra por unidad'>
                    Precio por unidad
                  </p>
                </div>
              </div>

              {/* Tax Rate */}
              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-on-surface-variant'>
                  {t('purchases.modal.tax_rate', 'Tasa de Impuesto')}
                </label>
                <select
                  className='w-full px-3 py-2.5 bg-surface-container-low border border-surface-variant rounded-md text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer'
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
                      ? 'Cargando...'
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
                          <span className='inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border border-blue-100 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-medium'>
                            <span className='w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse'></span>
                            Impuesto específico del producto
                          </span>
                        );
                      } else if (modalTaxRateId && modalTaxRateId === categoryTaxId) {
                        return (
                          <span className='inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border border-green-100 dark:border-green-900/30 bg-green-50/70 dark:bg-green-950/20 text-green-600 dark:text-green-400 font-medium'>
                            <span className='w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse'></span>
                            Impuesto sugerido por categoría {categoryName ? `(${categoryName})` : ''}
                          </span>
                        );
                      } else if (modalTaxRateId) {
                        return (
                          <span className='inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded border border-amber-100 dark:border-amber-900/30 bg-amber-50/70 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-medium'>
                            <span className='w-1.5 h-1.5 rounded-full bg-amber-500'></span>
                            Impuesto personalizado manualmente
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>

              {/* Price Includes Tax Toggle */}
              <div className='flex items-center gap-3 p-2.5 bg-surface-container-low border border-surface-variant rounded-md'>
                <input
                  type='checkbox'
                  id='priceIncludesTax'
                  className='w-4 h-4 text-primary border-surface-variant rounded focus:ring-primary cursor-pointer'
                  checked={modalPriceIncludesTax}
                  onChange={e => setModalPriceIncludesTax(e.target.checked)}
                />
                <label
                  htmlFor='priceIncludesTax'
                  className='text-sm font-medium text-on-surface cursor-pointer select-none'
                >
                  {t(
                    'purchases.modal.price_includes_tax',
                    'Precio incluye IVA',
                  )}
                </label>
              </div>
            </div>

            {/* Column 2: Pricing Strategy & Financial Summary */}
            <div className='space-y-4'>
              {/* Pricing Mode Toggle */}
              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-on-surface-variant'>
                  Estrategia de Precio de Venta
                </label>
                <div className='flex p-0.5 bg-surface-container rounded-md'>
                  <button
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-150 ${
                      pricingMode === 'margin'
                        ? 'bg-surface-container-lowest shadow-sm text-primary'
                        : 'text-on-surface-variant'
                    }`}
                    onClick={() => setPricingMode('margin')}
                  >
                    Por Margen %
                  </button>
                  <button
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-150 ${
                      pricingMode === 'sale_price'
                        ? 'bg-surface-container-lowest shadow-sm text-primary'
                        : 'text-on-surface-variant'
                    }`}
                    onClick={() => setPricingMode('sale_price')}
                  >
                    Precio Fijo
                  </button>
                </div>
              </div>

              {/* Margin & Price Fields */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-on-surface-variant'>
                    {pricingMode === 'margin'
                      ? 'Margen de Ganancia'
                      : 'Margen Calculado'}
                  </label>
                  <div className='relative'>
                    <input
                      type='number'
                      className={`w-full pl-3 pr-8 py-2.5 bg-surface-container-low border border-surface-variant rounded-md text-base font-semibold transition-all ${
                        pricingMode !== 'margin'
                          ? 'opacity-60 cursor-not-allowed text-outline'
                          : 'text-success focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                      }`}
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
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-outline'>
                      %
                    </span>
                  </div>
                  <p className='text-xs text-outline'>
                    {pricingMode === 'margin'
                      ? 'Define el % de ganancia deseado'
                      : 'Porcentaje resultante del precio fijo'}
                  </p>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-on-surface-variant'>
                    {pricingMode === 'sale_price'
                      ? 'Precio de Venta'
                      : 'Precio Sugerido'}
                  </label>
                  <input
                    type='number'
                    className={`w-full px-3 py-2.5 bg-surface-container-low border border-surface-variant rounded-md text-base font-semibold transition-all ${
                      pricingMode !== 'sale_price'
                        ? 'opacity-60 cursor-not-allowed text-outline'
                        : 'text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
                    }`}
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
                  <p className='text-xs text-outline'>
                    {pricingMode === 'sale_price'
                      ? 'Precio final al público'
                      : 'Calculado según margen'}
                  </p>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className='p-4 bg-[rgba(0,120,212,0.06)] dark:bg-[rgba(0,120,212,0.12)] rounded-md border border-[rgba(0,120,212,0.15)]'>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <span className='block text-xs text-outline'>
                      Costo Unitario
                    </span>
                    <span className='text-sm font-medium text-on-surface'>
                      {formatCurrency(modalUnitPrice || 0)}
                    </span>
                  </div>
                  <div>
                    <span className='block text-xs text-outline'>
                      Precio Venta Unitario
                    </span>
                    <span className='text-sm font-semibold text-success'>
                      {formatCurrency(effectiveSalePrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Projection Panel */}
              <div className='p-4 bg-surface-container rounded-[var(--fluent-corner-radius-large,6px)] border border-surface-variant'>
                <div className='text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3'>
                  Proyección Financiera
                </div>
                <div className='space-y-2'>
                  {/* Resumen de Línea */}
                  <div className='flex justify-between items-center py-2 border-b border-surface-variant'>
                    <span className='text-xs text-on-surface-variant'>
                      Subtotal Línea
                    </span>
                    <span className='text-xs text-outline'>
                      {modalQuantity || 0} ×{' '}
                      {formatCurrency(modalUnitPrice || 0)}
                    </span>
                  </div>

                  {/* Total Compra */}
                  <div className='flex justify-between items-center py-2 border-b border-surface-variant'>
                    <span className='text-sm text-on-surface-variant'>
                      Total Compra
                    </span>
                    <span className='text-sm font-semibold text-on-surface'>
                      {formatCurrency(
                        (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0),
                      )}
                    </span>
                  </div>

                  {/* Total Venta Esperado */}
                  <div className='flex justify-between items-center py-2 border-b border-surface-variant'>
                    <span className='text-sm text-on-surface-variant'>
                      Venta Esperada
                    </span>
                    <span className='text-sm font-semibold text-primary'>
                      {formatCurrency(
                        (Number(modalQuantity) || 0) * effectiveSalePrice,
                      )}
                    </span>
                  </div>

                  {/* Ganancia Esperada */}
                  <div className='flex justify-between items-center pt-2'>
                    <span className='text-sm font-medium text-on-surface'>
                      Ganancia Esperada
                    </span>
                    <div className='text-right'>
                      <span
                        className={`text-lg font-bold ${(Number(modalQuantity) || 0) * effectiveSalePrice - (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0) >= 0 ? 'text-success' : 'text-error'}`}
                      >
                        {formatCurrency(
                          (Number(modalQuantity) || 0) * effectiveSalePrice -
                            (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0),
                        )}
                      </span>
                      {(Number(modalQuantity) || 0) > 0 &&
                        (Number(modalUnitPrice) || 0) > 0 && (
                          <span className='ml-1.5 text-xs font-medium text-success'>
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
        <footer className='px-5 py-3 border-t border-surface-variant bg-surface-container-low flex justify-end items-center gap-3 shrink-0'>
          <button
            className='px-5 py-2 font-medium text-on-surface-variant hover:text-on-surface hover:bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:hover:bg-[var(--fluent-neutral-grey-130,#605E5C)] rounded-md transition-all text-sm border border-surface-variant'
            onClick={() => setIsModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            className='px-5 py-2 text-sm font-medium text-primary hover:bg-[var(--fluent-brand-primary-tint,#EFF6FC)] rounded-md'
            onClick={() => setModalVariantId(null)}
          >
            Seleccionar Producto Genérico
          </button>
          <button
            className='px-5 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-md shadow-whisper active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none text-sm'
            onClick={handleConfirmAddProduct}
            disabled={
              !modalSelectedProduct || !modalQuantity || !modalUnitPrice || ((modalSelectedProduct?.has_variant || modalSelectedProduct?.has_variants || variants.length > 0) && modalVariantId === undefined)
            }
          >
            {editingItemId ? 'Guardar Cambios' : 'Agregar a la Orden'}
          </button>
        </footer>
      </div>
    </div>
  )
}
