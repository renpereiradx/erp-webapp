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
  const stockUpdatedAt = product.stock_updated_at;

  // Financial health indicators from API
  const financialHealth = product.financial_health || {};
  const hasPrices = financialHealth.has_prices || product.has_valid_prices;
  const hasCosts = financialHealth.has_costs || product.has_valid_costs;
  const hasStock = financialHealth.has_stock || product.has_valid_stock;

  // Best margin data from API
  const bestMarginUnit = product.best_margin_unit;
  const bestMarginPercent = product.best_margin_percent;

  // State indicator
  const isActive = product.state === true || product.state === 'ACTIVE';

  // Check for low stock warning
  const hasLowStock = stockQuantity != null && stockQuantity > 0 && stockQuantity < 10;

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
                <div className="product-details-modal__form-grid">
                  <div className="product-details-modal__form-field product-details-modal__form-field--full-width">
                    <label className="product-details-modal__label">
                      {t('products.modal.field.product_name')}
                    </label>
                    <input
                      type="text"
                      className="product-details-modal__input"
                      value={productName}
                      readOnly
                    />
                  </div>
                  {description && (
                    <div className="product-details-modal__form-field product-details-modal__form-field--full-width">
                      <label className="product-details-modal__label">
                        {t('products.modal.field.description')}
                      </label>
                      <input
                        type="text"
                        className="product-details-modal__input"
                        value={description}
                        readOnly
                      />
                    </div>
                  )}
                  <div className="product-details-modal__form-field">
                    <label className="product-details-modal__label">
                      {t('products.modal.field.barcode')}
                    </label>
                    <input
                      type="text"
                      className="product-details-modal__input"
                      value={barcode || '-'}
                      readOnly
                    />
                  </div>
                  <div className="product-details-modal__form-field">
                    <label className="product-details-modal__label">
                      {t('products.modal.field.brand')}
                    </label>
                    <input
                      type="text"
                      className="product-details-modal__input"
                      value={brand || '-'}
                      readOnly
                    />
                  </div>
                  <div className="product-details-modal__form-field">
                    <label className="product-details-modal__label">
                      {t('products.modal.field.origin')}
                    </label>
                    <input
                      type="text"
                      className="product-details-modal__input"
                      value={origin === 'IMPORTADO' ? t('products.origin.imported') : origin === 'NACIONAL' ? t('products.origin.national') : '-'}
                      readOnly
                    />
                  </div>
                  <div className="product-details-modal__form-field">
                    <label className="product-details-modal__label">
                      {t('products.modal.field.category')}
                    </label>
                    <input
                      type="text"
                      className="product-details-modal__input"
                      value={categoryName || '-'}
                      readOnly
                    />
                  </div>
                  <div className="product-details-modal__form-field">
                    <label className="product-details-modal__label">
                      {t('products.modal.field.product_type')}
                    </label>
                    <input
                      type="text"
                      className="product-details-modal__input"
                      value={productType || 'PHYSICAL'}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Unit Prices Table */}
              {unitPrices.length > 0 && (
                <div>
                  <h3 className="product-details-modal__section-title">
                    {t('products.details.section.unit_prices')}
                  </h3>
                  <div className="product-details-modal__table-wrapper">
                    <table className="product-details-modal__table">
                      <thead className="product-details-modal__table-head">
                        <tr>
                          <th className="product-details-modal__table-header">
                            {t('products.details.table.unit')}
                          </th>
                          <th className="product-details-modal__table-header">
                            {t('products.details.table.price')}
                          </th>
                          <th className="product-details-modal__table-header">
                            Fecha Vigencia
                          </th>
                        </tr>
                      </thead>
                      <tbody className="product-details-modal__table-body">
                        {unitPrices.map((unitPrice) => (
                          <tr key={unitPrice.id}>
                            <td className="product-details-modal__table-cell">
                              {unitPrice.unit || '-'}
                            </td>
                            <td className="product-details-modal__table-cell">
                              ${unitPrice.price_per_unit?.toFixed(2) || '0.00'}
                            </td>
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
                <div>
                  <h3 className="product-details-modal__section-title">
                    Resumen de Costos por Unidad
                  </h3>
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
                            <td className="product-details-modal__table-cell">
                              {costSummary.unit || '-'}
                            </td>
                            <td className="product-details-modal__table-cell">
                              ${costSummary.last_cost?.toFixed(2) || '0.00'}
                            </td>
                            <td className="product-details-modal__table-cell">
                              ${costSummary.weighted_avg_cost_6m?.toFixed(2) || '0.00'}
                            </td>
                            <td className="product-details-modal__table-cell product-details-modal__table-cell--secondary">
                              {costSummary.total_purchases || 0}
                            </td>
                            <td className="product-details-modal__table-cell product-details-modal__table-cell--secondary">
                              {costSummary.cost_variance_percent != null
                                ? `${costSummary.cost_variance_percent.toFixed(1)}%`
                                : '-'}
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
            <div className="product-details-modal__sidebar">
              {/* State */}
              <div className="product-details-modal__sidebar-group">
                <p className="product-details-modal__info-label">
                  {t('products.details.label.state')}
                </p>
                <span
                  className={`product-details-modal__status-badge ${
                    isActive
                      ? 'product-details-modal__status-badge--active'
                      : 'product-details-modal__status-badge--inactive'
                  }`}
                >
                  {isActive ? t('products.state.active') : t('products.state.inactive')}
                </span>
              </div>

              {/* Stock Status */}
              <div className="product-details-modal__sidebar-group">
                <h3 className="product-details-modal__sidebar-title">
                  {t('products.details.section.inventory')}
                </h3>
                <div className="product-details-modal__info-row">
                  <span className="product-details-modal__info-label">
                    Estado
                  </span>
                  <span className="product-details-modal__info-value">
                    {stockStatus === 'in_stock' ? 'En Stock' :
                     stockStatus === 'out_of_stock' ? 'Sin Stock' :
                     stockStatus === 'low_stock' ? 'Stock Bajo' : '-'}
                  </span>
                </div>
                <div className="product-details-modal__info-row">
                  <span className="product-details-modal__info-label">
                    Cantidad
                  </span>
                  <span className="product-details-modal__info-value">
                    {stockQuantity != null ? `${stockQuantity} unidades` : '-'}
                  </span>
                </div>
                {stockUpdatedAt && (
                  <div className="product-details-modal__info-row">
                    <span className="product-details-modal__info-label">
                      Actualizado
                    </span>
                    <span className="product-details-modal__info-value">
                      {new Date(stockUpdatedAt).toLocaleDateString('es')}
                    </span>
                  </div>
                )}
              </div>

              {/* Margin Analysis */}
              {bestMarginUnit && bestMarginPercent != null && (
                <div className="product-details-modal__sidebar-group">
                  <h3 className="product-details-modal__sidebar-title">
                    {t('products.details.section.margin_analysis')}
                  </h3>
                  <div className="product-details-modal__info-row">
                    <span className="product-details-modal__info-label">
                      {t('products.details.label.best_margin')}
                    </span>
                    <span className="product-details-modal__info-value product-details-modal__info-value--success">
                      {bestMarginPercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="product-details-modal__info-row">
                    <span className="product-details-modal__info-label">
                      {t('products.details.label.best_unit')}
                    </span>
                    <span className="product-details-modal__info-value">
                      {bestMarginUnit}
                    </span>
                  </div>
                </div>
              )}

              {/* Financial Health */}
              <div className="product-details-modal__sidebar-group">
                <h3 className="product-details-modal__sidebar-title">
                  {t('products.details.section.financial_health')}
                </h3>
                <div className="product-details-modal__health-list">
                  <div className="product-details-modal__health-item">
                    <svg
                      className={`product-details-modal__health-icon ${
                        hasPrices
                          ? 'product-details-modal__health-icon--success'
                          : 'product-details-modal__health-icon--error'
                      }`}
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      {hasPrices ? (
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.354 5.646a.5.5 0 00-.708 0L7 9.293 5.354 7.646a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" />
                      ) : (
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm1 11.5a1 1 0 11-2 0 1 1 0 012 0zM8 10a.5.5 0 00.5-.5v-5a.5.5 0 00-1 0v5A.5.5 0 008 10z" />
                      )}
                    </svg>
                    <span>{t('products.details.health.has_prices')}</span>
                  </div>
                  <div className="product-details-modal__health-item">
                    <svg
                      className={`product-details-modal__health-icon ${
                        hasCosts
                          ? 'product-details-modal__health-icon--success'
                          : 'product-details-modal__health-icon--error'
                      }`}
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      {hasCosts ? (
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.354 5.646a.5.5 0 00-.708 0L7 9.293 5.354 7.646a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" />
                      ) : (
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm1 11.5a1 1 0 11-2 0 1 1 0 012 0zM8 10a.5.5 0 00.5-.5v-5a.5.5 0 00-1 0v5A.5.5 0 008 10z" />
                      )}
                    </svg>
                    <span>{t('products.details.health.has_costs')}</span>
                  </div>
                  <div className="product-details-modal__health-item">
                    <svg
                      className={`product-details-modal__health-icon ${
                        hasStock
                          ? 'product-details-modal__health-icon--success'
                          : 'product-details-modal__health-icon--error'
                      }`}
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      {hasStock ? (
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.354 5.646a.5.5 0 00-.708 0L7 9.293 5.354 7.646a.5.5 0 10-.708.708l2 2a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" />
                      ) : (
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm1 11.5a1 1 0 11-2 0 1 1 0 012 0zM8 10a.5.5 0 00.5-.5v-5a.5.5 0 00-1 0v5A.5.5 0 008 10z" />
                      )}
                    </svg>
                    <span>Tiene Stock</span>
                  </div>
                  {hasLowStock && (
                    <div className="product-details-modal__health-item">
                      <svg
                        className="product-details-modal__health-icon product-details-modal__health-icon--warning"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM7 11.5v1a1 1 0 102 0v-1a1 1 0 10-2 0zM8 10a.5.5 0 01-.5-.5v-5a.5.5 0 011 0v5A.5.5 0 018 10z" />
                      </svg>
                      <span>{t('products.details.health.low_stock')}</span>
                    </div>
                  )}
                </div>
                {financialHealth.price_count != null && (
                  <div className="product-details-modal__info-row" style={{ marginTop: '12px' }}>
                    <span className="product-details-modal__info-label">
                      Precios configurados
                    </span>
                    <span className="product-details-modal__info-value">
                      {financialHealth.price_count}
                    </span>
                  </div>
                )}
                {financialHealth.cost_units_count != null && (
                  <div className="product-details-modal__info-row">
                    <span className="product-details-modal__info-label">
                      Unidades con costos
                    </span>
                    <span className="product-details-modal__info-value">
                      {financialHealth.cost_units_count}
                    </span>
                  </div>
                )}
              </div>
            </div>
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
