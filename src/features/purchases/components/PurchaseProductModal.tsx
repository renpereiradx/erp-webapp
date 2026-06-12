import React from 'react'
import { X, Search, Check, Package } from 'lucide-react'
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic'
import { formatCurrency } from '@/utils/currencyUtils'

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
    handleConfirmAddProduct
  } = props

  if (!isModalOpen) return null

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4'>
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity'
        onClick={() => setIsModalOpen(false)}
      ></div>
      <div className='relative bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] w-full max-w-4xl max-h-[98vh] rounded-[var(--fluent-corner-radius-xlarge,8px)] shadow-[var(--fluent-shadow-64)] overflow-hidden flex flex-col border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)]'>
        {/* Header */}
        <header className='px-5 py-3 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] flex justify-between items-center bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] shrink-0'>
          <div>
            <h3 className='text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
              {editingItemId
                ? 'Editar Artículo'
                : 'Agregar Artículo de Compra'}
            </h3>
            <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)] mt-0.5'>
              Seleccione un producto, configure cantidad, costo y estrategia
              de precio
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className='w-8 h-8 flex items-center justify-center text-[var(--fluent-text-tertiary,#8A8886)] hover:text-[var(--fluent-semantic-danger,#D13438)] hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[var(--fluent-corner-radius-medium,4px)] transition-all'
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
                <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                  Buscar Producto
                </label>
                <div className='relative'>
                  <Search
                    className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fluent-text-tertiary,#8A8886)]'
                    size={16}
                  />
                  <input
                    ref={modalProductSearchRef}
                    autoFocus
                    type='text'
                    className='w-full pl-9 pr-9 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
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
                        className='absolute top-full left-0 right-0 mt-1 bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-16)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] overflow-hidden z-50 max-h-[220px] overflow-y-auto'
                      >
                        {filteredModalProducts.map((p, index) => {
                          const isActive = activeProductIndex === index

                          return (
                            <div
                              key={p.id || p.product_id}
                              data-product-index={index}
                              role='option'
                              aria-selected={isActive}
                              className={`relative px-4 py-2.5 cursor-pointer border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] last:border-none flex justify-between items-center transition-colors ${
                                isActive
                                  ? 'bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-130,#605E5C)] ring-1 ring-inset ring-[var(--fluent-brand-primary,#0078D4)]'
                                  : 'hover:bg-[var(--fluent-surface-card-hover,#F8F8F8)] dark:hover:bg-[var(--fluent-neutral-grey-140,#484644)]'
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
                                      ? 'text-[var(--fluent-brand-primary,#0078D4)]'
                                      : 'text-[var(--fluent-text-primary,#212121)] dark:text-white'
                                  }`}
                                >
                                  {getProductName(p)}
                                </div>
                                <div className='flex gap-2 mt-0.5'>
                                  <span className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                                    ID: {p.id || p.product_id || '-'}
                                  </span>
                                </div>
                              </div>
                              <div className='text-right flex-shrink-0 ml-3'>
                                {isActive && (
                                  <div className='mb-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--fluent-corner-radius-small,2px)] border border-[var(--fluent-brand-primary,#0078D4)] text-[var(--fluent-brand-primary,#0078D4)] text-[10px] font-semibold'>
                                    <Check size={10} />
                                    Activo
                                  </div>
                                )}

                                <div
                                  className={`text-[10px] font-medium ${(p.stock_quantity ?? p.stock ?? p.quantity_available ?? 0) > 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'}`}
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
                <div className='p-4 bg-[rgba(0,120,212,0.06)] dark:bg-[rgba(0,120,212,0.12)] border border-[rgba(0,120,212,0.15)] rounded-[var(--fluent-corner-radius-large,6px)]'>
                  <div className='flex items-start gap-3'>
                    <div className='w-10 h-10 bg-[var(--fluent-brand-primary,#0078D4)] rounded-[var(--fluent-corner-radius-medium,4px)] flex items-center justify-center text-white font-semibold text-lg shrink-0'>
                      {(
                        modalSelectedProduct.name ||
                        modalSelectedProduct.product_name ||
                        '?'
                      )?.charAt(0)}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h4 className='font-semibold text-sm text-[var(--fluent-text-primary,#212121)] dark:text-white truncate'>
                        {modalSelectedProduct.name ||
                          modalSelectedProduct.product_name ||
                          '-'}
                      </h4>
                      <div className='grid grid-cols-4 gap-2 mt-2'>
                        <div>
                          <p className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                            ID
                          </p>
                          <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)]'>
                            {modalSelectedProduct.id ||
                              modalSelectedProduct.product_id ||
                              '-'}
                          </p>
                        </div>
                        <div>
                          <p className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                            Últ. Costo
                          </p>
                          <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)] font-semibold'>
                            {formatCurrency(
                              modalSelectedProduct.last_purchase_cost ||
                                modalSelectedProduct.cost_price ||
                                0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                            Precio Venta
                          </p>
                          <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)] font-semibold text-[var(--fluent-brand-primary,#0078D4)]'>
                            {formatCurrency(
                              modalSelectedProduct.sale_price || modalSelectedProduct.unit_price || modalSelectedProduct.price || 0
                            )}
                          </p>
                        </div>
                        <div>
                          <p className='text-[10px] text-[var(--fluent-text-tertiary,#8A8886)]'>
                            Unidad
                          </p>
                          <p className='text-xs text-[var(--fluent-text-secondary,#605E5C)]'>
                            {modalSelectedProduct.unit ||
                              modalSelectedProduct.unit_name ||
                              'unit'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='h-24 border-2 border-dashed border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-large,6px)] flex flex-col items-center justify-center'>
                  <Package
                    size={24}
                    className='text-[var(--fluent-text-tertiary,#8A8886)]'
                  />
                  <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)] mt-1'>
                    Selecciona un producto
                  </p>
                </div>
              )}

              {/* Quantity, Unit & Cost */}
              <div className='grid grid-cols-3 gap-3'>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                    Cantidad
                  </label>
                  <input
                    ref={modalQuantityRef}
                    type='number'
                    className='w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
                    value={modalQuantity}
                    onChange={e => setModalQuantity(e.target.value)}
                    placeholder='0'
                  />
                  <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                    Unidades a comprar
                  </p>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                    Unidad
                  </label>
                  <input
                    type='text'
                    list='allowed-units'
                    className='w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
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
                  <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                    Medida de compra
                  </p>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                    Costo Unit.
                  </label>
                  <input
                    type='number'
                    className='w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all'
                    value={modalUnitPrice}
                    onChange={e => setModalUnitPrice(e.target.value)}
                    placeholder='0.00'
                  />
                  <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)] truncate' title='Precio de compra por unidad'>
                    Precio por unidad
                  </p>
                </div>
              </div>

              {/* Tax Rate */}
              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                  {t('purchases.modal.tax_rate', 'Tasa de Impuesto')}
                </label>
                <select
                  className='w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-sm focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)] transition-all cursor-pointer'
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
              <div className='flex items-center gap-3 p-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)]'>
                <input
                  type='checkbox'
                  id='priceIncludesTax'
                  className='w-4 h-4 text-[var(--fluent-brand-primary,#0078D4)] border-[var(--fluent-border-neutral,#E1DFDD)] rounded focus:ring-[var(--fluent-brand-primary,#0078D4)] cursor-pointer'
                  checked={modalPriceIncludesTax}
                  onChange={e => setModalPriceIncludesTax(e.target.checked)}
                />
                <label
                  htmlFor='priceIncludesTax'
                  className='text-sm font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white cursor-pointer select-none'
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
                <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                  Estrategia de Precio de Venta
                </label>
                <div className='flex p-0.5 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-medium,4px)]'>
                  <button
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] ${
                      pricingMode === 'margin'
                        ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]'
                        : 'text-[var(--fluent-text-secondary,#605E5C)]'
                    }`}
                    onClick={() => setPricingMode('margin')}
                  >
                    Por Margen %
                  </button>
                  <button
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-[var(--fluent-corner-radius-small,2px)] transition-all duration-[duration:var(--fluent-duration-fast,150ms)] ${
                      pricingMode === 'sale_price'
                        ? 'bg-[var(--fluent-surface-primary,#FFFFFF)] dark:bg-[var(--fluent-neutral-grey-150,#323130)] shadow-[var(--fluent-shadow-2)] text-[var(--fluent-brand-primary,#0078D4)]'
                        : 'text-[var(--fluent-text-secondary,#605E5C)]'
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
                  <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                    {pricingMode === 'margin'
                      ? 'Margen de Ganancia'
                      : 'Margen Calculado'}
                  </label>
                  <div className='relative'>
                    <input
                      type='number'
                      className={`w-full pl-3 pr-8 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold transition-all ${
                        pricingMode !== 'margin'
                          ? 'opacity-60 cursor-not-allowed text-[var(--fluent-text-tertiary,#8A8886)]'
                          : 'text-[var(--fluent-semantic-success,#107C10)] focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
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
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--fluent-text-tertiary,#8A8886)]'>
                      %
                    </span>
                  </div>
                  <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                    {pricingMode === 'margin'
                      ? 'Define el % de ganancia deseado'
                      : 'Porcentaje resultante del precio fijo'}
                  </p>
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-[var(--fluent-text-secondary,#605E5C)]'>
                    {pricingMode === 'sale_price'
                      ? 'Precio de Venta'
                      : 'Precio Sugerido'}
                  </label>
                  <input
                    type='number'
                    className={`w-full px-3 py-2.5 bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] text-base font-semibold transition-all ${
                      pricingMode !== 'sale_price'
                        ? 'opacity-60 cursor-not-allowed text-[var(--fluent-text-tertiary,#8A8886)]'
                        : 'text-[var(--fluent-brand-primary,#0078D4)] focus:border-[var(--fluent-brand-primary,#0078D4)] focus:outline-none focus:ring-1 focus:ring-[var(--fluent-brand-primary,#0078D4)]'
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
                  <p className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                    {pricingMode === 'sale_price'
                      ? 'Precio final al público'
                      : 'Calculado según margen'}
                  </p>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className='p-4 bg-[rgba(0,120,212,0.06)] dark:bg-[rgba(0,120,212,0.12)] rounded-[var(--fluent-corner-radius-medium,4px)] border border-[rgba(0,120,212,0.15)]'>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <span className='block text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                      Costo Unitario
                    </span>
                    <span className='text-sm font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                      {formatCurrency(modalUnitPrice || 0)}
                    </span>
                  </div>
                  <div>
                    <span className='block text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                      Precio Venta Unitario
                    </span>
                    <span className='text-sm font-semibold text-[var(--fluent-semantic-success,#107C10)]'>
                      {formatCurrency(effectiveSalePrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Projection Panel */}
              <div className='p-4 bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] rounded-[var(--fluent-corner-radius-large,6px)] border border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                <div className='text-xs font-semibold text-[var(--fluent-text-secondary,#605E5C)] uppercase tracking-wide mb-3'>
                  Proyección Financiera
                </div>
                <div className='space-y-2'>
                  {/* Resumen de Línea */}
                  <div className='flex justify-between items-center py-2 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                    <span className='text-xs text-[var(--fluent-text-secondary,#605E5C)]'>
                      Subtotal Línea
                    </span>
                    <span className='text-xs text-[var(--fluent-text-tertiary,#8A8886)]'>
                      {modalQuantity || 0} ×{' '}
                      {formatCurrency(modalUnitPrice || 0)}
                    </span>
                  </div>

                  {/* Total Compra */}
                  <div className='flex justify-between items-center py-2 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                    <span className='text-sm text-[var(--fluent-text-secondary,#605E5C)]'>
                      Total Compra
                    </span>
                    <span className='text-sm font-semibold text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                      {formatCurrency(
                        (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0),
                      )}
                    </span>
                  </div>

                  {/* Total Venta Esperado */}
                  <div className='flex justify-between items-center py-2 border-b border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-130,#605E5C)]'>
                    <span className='text-sm text-[var(--fluent-text-secondary,#605E5C)]'>
                      Venta Esperada
                    </span>
                    <span className='text-sm font-semibold text-[var(--fluent-brand-primary,#0078D4)]'>
                      {formatCurrency(
                        (Number(modalQuantity) || 0) * effectiveSalePrice,
                      )}
                    </span>
                  </div>

                  {/* Ganancia Esperada */}
                  <div className='flex justify-between items-center pt-2'>
                    <span className='text-sm font-medium text-[var(--fluent-text-primary,#212121)] dark:text-white'>
                      Ganancia Esperada
                    </span>
                    <div className='text-right'>
                      <span
                        className={`text-lg font-bold ${(Number(modalQuantity) || 0) * effectiveSalePrice - (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0) >= 0 ? 'text-[var(--fluent-semantic-success,#107C10)]' : 'text-[var(--fluent-semantic-danger,#D13438)]'}`}
                      >
                        {formatCurrency(
                          (Number(modalQuantity) || 0) * effectiveSalePrice -
                            (Number(modalQuantity) || 0) * (Number(modalUnitPrice) || 0),
                        )}
                      </span>
                      {(Number(modalQuantity) || 0) > 0 &&
                        (Number(modalUnitPrice) || 0) > 0 && (
                          <span className='ml-1.5 text-xs font-medium text-[var(--fluent-semantic-success,#107C10)]'>
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
        <footer className='px-5 py-3 border-t border-[var(--fluent-border-neutral,#E1DFDD)] dark:border-[var(--fluent-neutral-grey-140,#484644)] bg-[var(--fluent-surface-secondary,#FAF9F8)] dark:bg-[var(--fluent-neutral-grey-140,#484644)] flex justify-end items-center gap-3 shrink-0'>
          <button
            className='px-5 py-2 font-medium text-[var(--fluent-text-secondary,#605E5C)] hover:text-[var(--fluent-text-primary,#212121)] hover:bg-[var(--fluent-surface-tertiary,#F3F2F1)] dark:hover:bg-[var(--fluent-neutral-grey-130,#605E5C)] rounded-[var(--fluent-corner-radius-medium,4px)] transition-all text-sm border border-[var(--fluent-border-neutral,#E1DFDD)]'
            onClick={() => setIsModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            className='px-5 py-2 bg-[var(--fluent-brand-primary,#0078D4)] hover:bg-[var(--fluent-brand-primary-hover,#005A9E)] text-white font-semibold rounded-[var(--fluent-corner-radius-medium,4px)] shadow-[var(--fluent-shadow-4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none text-sm'
            onClick={handleConfirmAddProduct}
            disabled={
              !modalSelectedProduct || !modalQuantity || !modalUnitPrice
            }
          >
            {editingItemId ? 'Guardar Cambios' : 'Agregar a la Orden'}
          </button>
        </footer>
      </div>
    </div>
  )
}
