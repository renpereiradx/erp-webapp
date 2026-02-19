import { useEffect } from 'react';
import { useI18n } from '../lib/i18n';

/**
 * ProductDetailsModal Component
 *
 * Modal for viewing comprehensive product details following Fluent Design System 2
 * Displays general information, pricing, costs, inventory, and financial health
 * Uses financial API data structure from /products/financial/{id}
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.product - Product data with financial enrichment
 * @param {Function} props.onEdit - Callback to open edit modal
 */
export default function ProductDetailsModal({ isOpen, onClose, product, onEdit }) {
  const { t } = useI18n();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Extract data from product (already has all fields from financial API search)
  const productId = product.product_id || product.id;
  const productName = product.product_name || product.name;
  const barcode = product.barcode;
  const brand = product.brand;
  const origin = product.origin;
  const categoryName = product.category_name || product.category?.name;
  const productType = product.product_type || product.productType;
  const description = product.description;

  // Unit prices from API
  const unitPrices = product.unit_prices || [];

  // Unit costs summary from API
  const unitCostsSummary = product.unit_costs_summary || [];

  // Stock information
  const stockQuantity = product.stock_quantity;
  const stockStatus = product.stock_status;

  // Financial health indicators from API
  const financialHealth = product.financial_health || {};
  const hasPrices = financialHealth.has_prices || product.has_valid_prices;
  const hasCosts = financialHealth.has_costs || product.has_valid_costs;
  const hasStock = financialHealth.has_stock || product.has_valid_stock;

  // Best margin data from API
  const bestMarginUnit = product.best_margin_unit;
  const bestMarginPercent = product.best_margin_percent;

  return (
    <div
      className="product-details-modal__backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-details-modal-title"
    >
      <div className="product-details-modal__container">
        {/* Header */}
        <div className="product-details-modal__header">
          <div className="product-details-modal__header-content">
            <h2 id="product-details-modal-title" className="product-details-modal__title">
              {productName}
            </h2>
            <p className="product-details-modal__product-id">
              {t('products.details.product_id')}: {productId || 'N/A'}
            </p>
          </div>
          <button
            type="button"
            className="product-details-modal__close-button"
            onClick={onClose}
            aria-label={t('products.modal.action.close')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.293 5.293a1 1 0 011.414 0L12 10.586l5.293-5.293a1 1 0 111.414 1.414L13.414 12l5.293 5.293a1 1 0 01-1.414 1.414L12 13.414l-5.293 5.293a1 1 0 01-1.414-1.414L10.586 12 5.293 6.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="product-details-modal__body">
          <div className="product-details-modal__content-grid">
            {/* Main Content */}
            <div className="product-details-modal__main-section">
              {/* General Information */}
              <div>
                <h3 className="product-details-modal__section-title">
                  {t('products.details.section.general_info')}
                </h3>
                <div className="product-details-modal__info-grid">
                  <div className="product-details-modal__info-field">
                    <label className="product-details-modal__info-label">{t('products.modal.field.product_name')}</label>
                    <p className="product-details-modal__info-value font-semibold">{productName}</p>
                  </div>
                  <div className="product-details-modal__info-field">
                    <label className="product-details-modal__info-label">{t('products.modal.field.category')}</label>
                    <p className="product-details-modal__info-value">{categoryName || '-'}</p>
                  </div>
                  <div className="product-details-modal__info-field">
                    <label className="product-details-modal__info-label">{t('products.modal.field.product_type')}</label>
                    <p className="product-details-modal__info-value capitalize">{(productType || 'PHYSICAL').toLowerCase()}</p>
                  </div>
                  
                  <div className="product-details-modal__info-field">
                    <label className="product-details-modal__info-label">{t('products.modal.field.barcode')}</label>
                    <p className="product-details-modal__info-value tabular-nums">{barcode || '-'}</p>
                  </div>
                  <div className="product-details-modal__info-field">
                    <label className="product-details-modal__info-label">{t('products.modal.field.brand')}</label>
                    <p className="product-details-modal__info-value">{brand || '-'}</p>
                  </div>
                  <div className="product-details-modal__info-field">
                    <label className="product-details-modal__info-label">{t('products.modal.field.origin')}</label>
                    <p className="product-details-modal__info-value">
                      {origin === 'IMPORTADO' ? t('products.origin.imported') : origin === 'NACIONAL' ? t('products.origin.national') : '-'}
                    </p>
                  </div>
                </div>

                {description && (
                  <div className="product-details-modal__description-block">
                    <label className="product-details-modal__info-label">{t('products.modal.field.description')}</label>
                    <p className="product-details-modal__description-text">{description}</p>
                  </div>
                )}
              </div>

              {/* Unit Prices Table */}
              {unitPrices.length > 0 && (
                <div className="product-details-modal__table-section">
                  <h3 className="product-details-modal__section-title">
                    {t('products.details.section.unit_prices')}
                  </h3>
                  <div className="product-details-modal__table-wrapper">
                    <table className="product-details-modal__table">
                      <thead className="product-details-modal__table-head">
                        <tr>
                          <th className="product-details-modal__table-header">{t('products.details.table.unit')}</th>
                          <th className="product-details-modal__table-header">{t('products.details.table.price')}</th>
                          <th className="product-details-modal__table-header">Vigencia</th>
                        </tr>
                      </thead>
                      <tbody className="product-details-modal__table-body">
                        {unitPrices.map((unitPrice) => (
                          <tr key={unitPrice.id}>
                            <td className="product-details-modal__table-cell font-medium">{unitPrice.unit || '-'}</td>
                            <td className="product-details-modal__table-cell tabular-nums">${unitPrice.price_per_unit?.toFixed(2) || '0.00'}</td>
                            <td className="product-details-modal__table-cell product-details-modal__table-cell--secondary">
                              {unitPrice.effective_date ? new Date(unitPrice.effective_date).toLocaleDateString('es') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Unit Costs Summary Table */}
              {unitCostsSummary.length > 0 && (
                <div className="product-details-modal__table-section">
                  <h3 className="product-details-modal__section-title">Resumen de Costos</h3>
                  <div className="product-details-modal__table-wrapper">
                    <table className="product-details-modal__table">
                      <thead className="product-details-modal__table-head">
                        <tr>
                          <th className="product-details-modal__table-header">Unidad</th>
                          <th className="product-details-modal__table-header">Último Costo</th>
                          <th className="product-details-modal__table-header">Promedio 6m</th>
                          <th className="product-details-modal__table-header">Compras</th>
                          <th className="product-details-modal__table-header">Variación</th>
                        </tr>
                      </thead>
                      <tbody className="product-details-modal__table-body">
                        {unitCostsSummary.map((costSummary, index) => (
                          <tr key={index}>
                            <td className="product-details-modal__table-cell font-medium">{costSummary.unit || '-'}</td>
                            <td className="product-details-modal__table-cell tabular-nums">${costSummary.last_cost?.toFixed(2) || '0.00'}</td>
                            <td className="product-details-modal__table-cell tabular-nums">${costSummary.weighted_avg_cost_6m?.toFixed(2) || '0.00'}</td>
                            <td className="product-details-modal__table-cell product-details-modal__table-cell--secondary text-center">{costSummary.total_purchases || 0}</td>
                            <td className={`product-details-modal__table-cell font-medium ${costSummary.cost_variance_percent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {costSummary.cost_variance_percent != null ? `${costSummary.cost_variance_percent.toFixed(1)}%` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="product-details-modal__sidebar">
              {/* Inventory Summary */}
              <div className="product-details-modal__sidebar-group">
                <h3 className="product-details-modal__sidebar-title">{t('products.details.section.inventory')}</h3>
                <div className="product-details-modal__stat-card">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-2xl font-bold tabular-nums">{stockQuantity ?? 0}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stockStatus === 'in_stock' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {stockStatus === 'in_stock' ? 'Disponible' : 'Stock Bajo'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Unidades en inventario</p>
                </div>
              </div>

              {/* Best Margin Card */}
              {bestMarginUnit && bestMarginPercent != null && (
                <div className="product-details-modal__sidebar-group">
                  <h3 className="product-details-modal__sidebar-title">Rendimiento</h3>
                  <div className="product-details-modal__stat-card border-l-4 border-green-500">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-lg font-bold text-green-600 tabular-nums">{bestMarginPercent.toFixed(2)}%</span>
                      <span className="text-xs font-medium uppercase text-muted-foreground">{bestMarginUnit}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Mejor margen actual</p>
                  </div>
                </div>
              )}

              {/* Financial Health Checklist */}
              <div className="product-details-modal__sidebar-group">
                <h3 className="product-details-modal__sidebar-title">Estado de Configuración</h3>
                <div className="product-details-modal__health-checklist">
                  {[
                    { label: t('products.details.health.has_prices'), checked: hasPrices },
                    { label: t('products.details.health.has_costs'), checked: hasCosts },
                    { label: 'Inventario Base', checked: hasStock }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <div className={`size-4 rounded-full flex items-center justify-center ${item.checked ? 'bg-green-500' : 'bg-red-500'}`}>
                        <svg className="size-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.checked ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                      </div>
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Footer */}
        <div className="product-details-modal__footer">
          <button
            type="button"
            className="product-details-modal__button product-details-modal__button--secondary"
            onClick={onClose}
          >
            {t('products.modal.action.cancel')}
          </button>
          {onEdit && (
            <button
              type="button"
              className="product-details-modal__button product-details-modal__button--primary"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
            >
              {t('products.details.action.edit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
