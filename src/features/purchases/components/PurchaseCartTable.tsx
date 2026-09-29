import React from 'react';
import { Package, X } from 'lucide-react';
import { usePurchasesLogic } from '@/features/purchases/hooks/usePurchasesLogic';
import { useI18n } from '@/lib/i18n';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/utils/currencyUtils';
import { PurchaseProductSearchInput } from './PurchaseProductSearchInput';

export type PurchaseCartTableProps = Pick<
  ReturnType<typeof usePurchasesLogic>,
  | 'purchaseItems'
  | 'setIsModalOpen'
  | 'canWrite'
  | 'handleEditItem'
  | 'setPurchaseItems'
  | 'isModalOpen'
  | 'modalProductSearch'
  | 'setModalProductSearch'
  | 'searchingProducts'
  | 'showProductDropdown'
  | 'setShowProductDropdown'
  | 'filteredModalProducts'
  | 'productDropdownRef'
  | 'cartProductSearchRef'
  | 'activeProductIndex'
  | 'setActiveProductIndex'
  | 'handleModalProductSearchKeyDown'
  | 'handleProductSelect'
  | 'getProductName'
>;

const headClass = 'text-label-caps uppercase text-on-surface-deep';

export const PurchaseCartTable: React.FC<PurchaseCartTableProps> = ({
  purchaseItems,
  setIsModalOpen,
  canWrite,
  handleEditItem,
  setPurchaseItems,
  isModalOpen,
  modalProductSearch,
  setModalProductSearch,
  searchingProducts,
  showProductDropdown,
  setShowProductDropdown,
  filteredModalProducts,
  productDropdownRef,
  cartProductSearchRef,
  activeProductIndex,
  setActiveProductIndex,
  handleModalProductSearchKeyDown,
  handleProductSelect,
  getProductName,
}) => {
  const { t } = useI18n();

  // Seleccionar desde el dropmenu del carrito precarga el producto y abre el
  // modal de detalles (cantidad, costo y estrategia de precio). afterSelect
  // cubre el camino por teclado: Enter en el input también abre el modal.
  const handleSelectAndOpen = async (product: any) => {
    await handleProductSelect(product);
    setIsModalOpen(true);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    handleModalProductSearchKeyDown(event, {
      afterSelect: () => setIsModalOpen(true),
    });
  };

  return (
    <section className='bg-surface rounded-md shadow-whisper border-0 overflow-hidden'>
      <div className='px-lg py-md border-b border-divider flex flex-col sm:flex-row justify-between items-center bg-surface-muted gap-md'>
        <div>
          <h2 className='text-title-md text-foreground'>
            {t('purchases.cart.title', 'Productos en la Orden')}
          </h2>
          <p className='text-body-sm text-on-surface-deep mt-0.5'>
            {t('purchases.cart.subtitle', 'Artículos a ingresar al inventario')}
          </p>
        </div>
        <div className='w-full sm:w-96 shrink-0'>
          <PurchaseProductSearchInput
            id='purchase-cart-product-search'
            search={modalProductSearch}
            onSearchChange={setModalProductSearch}
            inputRef={cartProductSearchRef}
            dropdownRef={productDropdownRef}
            results={filteredModalProducts}
            searching={searchingProducts}
            open={showProductDropdown && !isModalOpen}
            onOpenChange={setShowProductDropdown}
            activeIndex={activeProductIndex}
            onActiveIndexChange={setActiveProductIndex}
            onKeyDown={handleSearchKeyDown}
            onSelect={handleSelectAndOpen}
            getProductName={getProductName}
            placeholder={t('purchases.cart.search_placeholder', 'Buscar producto por SKU, nombre o código de barras... (F2)')}
            inputClassName='bg-surface'
            disabled={!canWrite}
          />
        </div>
      </div>

      <div className='overflow-x-auto'>
        <Table className='min-w-[720px]'>
          <TableHeader className='bg-surface-muted'>
            <TableRow className='hover:bg-surface-muted border-0'>
              <TableHead className={`${headClass} px-md py-md`}>{t('purchases.cart.product', 'Producto')}</TableHead>
              <TableHead className={`${headClass} px-md py-md text-center`}>{t('purchases.form.quantity', 'Cant.')}</TableHead>
              <TableHead className={`${headClass} px-md py-md text-right`}>{t('purchases.form.unit_price', 'Costo Unit.')}</TableHead>
              <TableHead className={`${headClass} px-md py-md text-right`}>{t('purchases.form.profit_margin', 'Margen')}</TableHead>
              <TableHead className={`${headClass} px-md py-md text-right`}>{t('purchases.form.subtotal', 'Subtotal')}</TableHead>
              <TableHead className={`${headClass} px-md py-md text-right`}>{t('purchases.modal.sale_price', 'Venta Esp.')}</TableHead>
              <TableHead className='px-md py-md w-12' aria-hidden='true'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseItems.length === 0 ? (
              <TableRow className='hover:bg-transparent border-0'>
                <TableCell colSpan={7} className='py-xl'>
                  <div className='flex flex-col items-center justify-center gap-sm text-on-surface-deep'>
                    <div className='size-16 rounded-full bg-surface-muted flex items-center justify-center'>
                      <Package size={28} strokeWidth={1.5} className='text-outline-fg' aria-hidden='true' />
                    </div>
                    <p className='text-body-md-bold text-foreground'>
                      {t('purchases.form.no_products', 'No hay artículos seleccionados')}
                    </p>
                    <p className='text-body-sm text-on-surface-deep'>
                      {t('purchases.cart.empty_hint', 'Buscá un producto para agregarlo a la orden')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              purchaseItems.map(item => (
                <tr
                  key={item.id}
                  className='hover:bg-surface-muted transition-colors duration-150 group/row cursor-pointer'
                  onDoubleClick={() => handleEditItem(item)}
                >
                  <td className='px-md py-md align-top'>
                    <div className='text-body-md-bold text-foreground group-hover/row:text-primary transition-colors duration-150'>
                      {item.name}
                    </div>
                    {/* Atributos de variante como chips */}
                    {item.variant_attributes && Object.keys(item.variant_attributes).length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {Object.entries(item.variant_attributes).map(([key, val]) => (
                          <span
                            key={key}
                            className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-xs bg-primary/10 border border-primary/20 text-primary text-body-sm-bold'
                          >
                            <span className='opacity-70'>{key}:</span>
                            <span>{String(val)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Tags del producto (color dinámico del dato; fallback con tokens) */}
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {item.tags.slice(0, 3).map((tag: any) => (
                          <span
                            key={tag.id}
                            className='inline-flex items-center px-1.5 py-0.5 rounded-xs text-body-sm-bold text-on-primary'
                            style={tag.color ? { backgroundColor: tag.color } : undefined}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Fallback: variant_name si no hay atributos */}
                    {item.variant_name && (!item.variant_attributes || Object.keys(item.variant_attributes).length === 0) && (
                      <div className='text-body-sm text-outline-fg'>
                        {item.variant_name}
                      </div>
                    )}
                    <div className='text-body-sm text-outline-fg mt-0.5'>
                      {t('purchases.cart.unit', 'Unidad')}: {item.unit}
                    </div>
                  </td>

                  <td className='px-md py-md text-center text-data-mono font-data-mono text-foreground'>
                    {formatNumber(item.quantity)}
                    <span className='text-body-sm text-outline-fg'> {item.unit}</span>
                  </td>
                  <td className='px-md py-md text-right text-data-mono font-data-mono text-on-surface-deep'>
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className='px-md py-md text-right text-data-mono font-data-mono text-success'>
                    {item.profit_pct.toFixed(1)}%
                  </td>
                  <td className='px-md py-md text-right text-data-mono font-data-mono text-foreground'>
                    {formatCurrency(item.unit_price * item.quantity)}
                  </td>
                  <td className='px-md py-md text-right'>
                    <div className='text-data-mono font-data-mono text-primary'>
                      {formatCurrency(item.sale_price * item.quantity)}
                    </div>
                    <div className='text-body-sm text-success'>
                      +{formatCurrency((item.sale_price - item.unit_price) * item.quantity)}
                    </div>
                  </td>
                  <td className='px-md py-md text-right'>
                    <Button
                      variant='ghost'
                      size='icon'
                      aria-label={t('purchases.cart.remove_item', 'Quitar artículo de la orden')}
                      onClick={() => setPurchaseItems(prev => prev.filter(i => i.id !== item.id))}
                      className='text-outline-fg hover:text-error hover:bg-error-container'
                    >
                      <X size={16} aria-hidden='true' />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
