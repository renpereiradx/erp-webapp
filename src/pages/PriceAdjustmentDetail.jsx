/**
 * Página de Detalle y Ajuste de Precio - Patrón MVP
 * Formulario para ajustar el precio de un producto seleccionado
 * Siguiendo Fluent Design System 2
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';
import usePriceAdjustmentNewStore from '@/store/usePriceAdjustmentNewStore';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';
import { useNavigate, useLocation } from 'react-router-dom';
import '@/styles/scss/pages/_price-adjustment-detail.scss';

const PriceAdjustmentDetail = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedProduct, creating, error, clearError, createPriceAdjustment, resetState } = usePriceAdjustmentNewStore();

  // Obtener producto de la navegación o del store
  const product = location.state?.selectedProduct || selectedProduct;

  // Estado del formulario
  const [formData, setFormData] = useState({
    new_price: '',
    unit: 'UNIT',
    reason: '',
    reasonTemplate: '',
    metadata: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Estado para el historial de ajustes
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Plantillas predefinidas para razones de ajuste
  const reasonTemplates = [
    { value: '', label: t('priceAdjustmentDetail.reasonTemplate.select', 'Seleccionar plantilla...') },
    { value: 'MARKET_ADJUSTMENT', label: '📊 ' + t('priceAdjustmentDetail.reasonTemplate.market', 'Ajuste por condiciones del mercado') },
    { value: 'COST_INCREASE', label: '💰 ' + t('priceAdjustmentDetail.reasonTemplate.costIncrease', 'Aumento de costos de proveedor') },
    { value: 'COST_DECREASE', label: '💸 ' + t('priceAdjustmentDetail.reasonTemplate.costDecrease', 'Reducción de costos de proveedor') },
    { value: 'PROMOTIONAL_PRICING', label: '🎉 ' + t('priceAdjustmentDetail.reasonTemplate.promotional', 'Precio promocional temporal') },
    { value: 'COMPETITIVE_ADJUSTMENT', label: '⚔️ ' + t('priceAdjustmentDetail.reasonTemplate.competitive', 'Ajuste por competencia') },
    { value: 'INVENTORY_CLEARANCE', label: '📦 ' + t('priceAdjustmentDetail.reasonTemplate.clearance', 'Liquidación de inventario') },
    { value: 'QUALITY_ADJUSTMENT', label: '🔧 ' + t('priceAdjustmentDetail.reasonTemplate.quality', 'Ajuste por calidad del producto') },
    { value: 'SEASONAL_ADJUSTMENT', label: '🌟 ' + t('priceAdjustmentDetail.reasonTemplate.seasonal', 'Ajuste estacional') },
    { value: 'BULK_DISCOUNT', label: '📈 ' + t('priceAdjustmentDetail.reasonTemplate.bulk', 'Descuento por volumen') },
    { value: 'ERROR_CORRECTION', label: '🔄 ' + t('priceAdjustmentDetail.reasonTemplate.error', 'Corrección de error previo') },
    { value: 'MANAGEMENT_DECISION', label: '👔 ' + t('priceAdjustmentDetail.reasonTemplate.management', 'Decisión gerencial') },
    { value: 'SUPPLIER_NEGOTIATION', label: '🤝 ' + t('priceAdjustmentDetail.reasonTemplate.supplier', 'Renegociación con proveedor') },
    { value: 'CURRENCY_FLUCTUATION', label: '💱 ' + t('priceAdjustmentDetail.reasonTemplate.currency', 'Fluctuación cambiaria') },
    { value: 'INITIAL_INVENTORY_SETUP', label: '🏗️ ' + t('priceAdjustmentDetail.reasonTemplate.initial', 'Carga inicial de inventario') },
    { value: 'CUSTOM', label: '✏️ ' + t('priceAdjustmentDetail.reasonTemplate.custom', 'Razón personalizada...') }
  ];

  // Función para obtener el texto de una plantilla
  const getReasonText = (templateValue) => {
    const reasonTexts = {
      'MARKET_ADJUSTMENT': t('priceAdjustmentDetail.reasonText.market', 'Ajuste de precio por condiciones actuales del mercado'),
      'COST_INCREASE': t('priceAdjustmentDetail.reasonText.costIncrease', 'Aumento de precio debido al incremento en costos de proveedor'),
      'COST_DECREASE': t('priceAdjustmentDetail.reasonText.costDecrease', 'Reducción de precio por disminución en costos de proveedor'),
      'PROMOTIONAL_PRICING': t('priceAdjustmentDetail.reasonText.promotional', 'Precio promocional temporal para impulsar ventas'),
      'COMPETITIVE_ADJUSTMENT': t('priceAdjustmentDetail.reasonText.competitive', 'Ajuste de precio para mantener competitividad en el mercado'),
      'INVENTORY_CLEARANCE': t('priceAdjustmentDetail.reasonText.clearance', 'Precio reducido para liquidación de inventario'),
      'QUALITY_ADJUSTMENT': t('priceAdjustmentDetail.reasonText.quality', 'Ajuste de precio por cambios en la calidad del producto'),
      'SEASONAL_ADJUSTMENT': t('priceAdjustmentDetail.reasonText.seasonal', 'Ajuste estacional por demanda del período'),
      'BULK_DISCOUNT': t('priceAdjustmentDetail.reasonText.bulk', 'Descuento aplicado por compra en volumen'),
      'ERROR_CORRECTION': t('priceAdjustmentDetail.reasonText.error', 'Corrección de error en precio anterior'),
      'MANAGEMENT_DECISION': t('priceAdjustmentDetail.reasonText.management', 'Ajuste autorizado por decisión gerencial'),
      'SUPPLIER_NEGOTIATION': t('priceAdjustmentDetail.reasonText.supplier', 'Nuevo precio por renegociación con proveedor'),
      'CURRENCY_FLUCTUATION': t('priceAdjustmentDetail.reasonText.currency', 'Ajuste por fluctuaciones en tipo de cambio'),
      'INITIAL_INVENTORY_SETUP': t('priceAdjustmentDetail.reasonText.initial', 'Declaración de precio inicial para carga de inventario')
    };
    return reasonTexts[templateValue] || '';
  };

  // Manejar cambio de plantilla de razón
  const handleReasonTemplateChange = (templateValue) => {
    setFormData(prev => ({
      ...prev,
      reasonTemplate: templateValue,
      reason: templateValue === 'CUSTOM' ? '' : getReasonText(templateValue)
    }));
    // Limpiar error de reason cuando se selecciona plantilla
    if (formErrors.reason && templateValue !== 'CUSTOM') {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.reason;
        return newErrors;
      });
    }
  };

  // Redirigir si no hay producto seleccionado
  useEffect(() => {
    if (!product) {
      navigate('/ajustes-precios-nuevo');
    }
  }, [product, navigate]);

  // Limpiar estado al desmontar el componente
  useEffect(() => {
    return () => {
      // Limpiar el estado cuando salimos de la página de detalle
      resetState();
    };
  }, [resetState]);

  // Cargar historial de ajustes al montar el componente
  useEffect(() => {
    const loadHistory = async () => {
      if (!product || !product.product_id) return;

      setLoadingHistory(true);
      setHistoryError(null);

      try {
        const result = await priceAdjustmentService.getProductHistory(product.product_id, 10, 0);
        // Filtrar solo ajustes de precio
        const priceAdjustments = (result.history || []).filter(
          adj => adj.adjustment_type === 'price'
        );
        setHistory(priceAdjustments);
      } catch (error) {
        console.error('Error loading history:', error);
        setHistoryError(error.message || t('priceAdjustmentDetail.history.error', 'Error al cargar historial'));
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [product, t]);

  // Validar formulario
  const validateForm = () => {
    const errors = {};

    if (!formData.new_price || parseFloat(formData.new_price) <= 0) {
      errors.new_price = t('priceAdjustmentDetail.error.price', 'Precio inválido');
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      errors.reason = t('priceAdjustmentDetail.error.reason', 'Mínimo 10 caracteres requeridos');
    }

    // Validar JSON si se proporciona metadata
    if (formData.metadata.trim()) {
      try {
        JSON.parse(formData.metadata);
      } catch (e) {
        errors.metadata = t('priceAdjustmentDetail.error.metadata', 'JSON inválido');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar cambio en campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario escribe
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Preparar datos para enviar
    const adjustmentData = {
      product_id: product.product_id || product.id,
      new_price: parseFloat(formData.new_price),
      old_price: product.unit_prices?.[0]?.price_per_unit || product.current_price || product.price || 0,
      unit: formData.unit,
      reason: formData.reason.trim(),
      metadata: formData.metadata.trim() ? JSON.parse(formData.metadata) : {}
    };

    const result = await createPriceAdjustment(adjustmentData);

    if (result.success) {
      // Recargar historial después de crear el ajuste
      try {
        const historyResult = await priceAdjustmentService.getProductHistory(product.product_id, 10, 0);
        const priceAdjustments = (historyResult.history || []).filter(
          adj => adj.adjustment_type === 'price'
        );
        setHistory(priceAdjustments);
      } catch (err) {
        console.error('Error reloading history:', err);
      }

      // Redirigir de vuelta a la página de búsqueda después de un breve delay
      setTimeout(() => {
        navigate('/ajustes-precios-nuevo');
      }, 1500);
    }
  };

  if (!product) {
    return null;
  }

  // Handle different price formats from API (financial endpoint returns unit_prices array)
  const currentPrice = product.unit_prices?.[0]?.price_per_unit || product.current_price || product.price || 0;
  const isFormValid = formData.new_price && formData.reason.trim().length >= 10 && Object.keys(formErrors).length === 0;

  return (
    <div className="price-adjustment-detail">
      {/* Header con navegación */}
      <div className="price-adjustment-detail__header">
        <button
          onClick={() => navigate('/ajustes-precios-nuevo')}
          className="back-button"
          aria-label={t('action.back', 'Volver')}
        >
          <ArrowLeft className="back-button__icon" />
          <span className="back-button__text">{t('action.back', 'Volver')}</span>
        </button>
        <h1 className="price-adjustment-detail__title">
          {t('priceAdjustmentDetail.title', 'Ajuste de Precio para')}: {product.product_name || product.name} / {product.product_id || product.id}
        </h1>
      </div>

      <div className="price-adjustment-detail__content">
        {/* Columna izquierda - Precio actual y formulario */}
        <div className="price-adjustment-detail__left">
          {/* Card de precio actual */}
          <div className="current-price-card">
            <h2 className="current-price-card__label">
              {t('priceAdjustmentDetail.currentPrice', 'Precio Actual')}
            </h2>
            <p className="current-price-card__value">
              ${currentPrice.toFixed(2)}
            </p>
          </div>

          {/* Formulario de ajuste */}
          <div className="adjustment-form-card">
            <h2 className="adjustment-form-card__title">
              {t('priceAdjustmentDetail.formTitle', 'Registrar Nuevo Ajuste')}
            </h2>

            {error && (
              <div className="form-error">
                <p className="form-error__text">{error}</p>
                <button
                  onClick={clearError}
                  className="form-error__close"
                  aria-label={t('action.close', 'Cerrar')}
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="adjustment-form">
              {/* Nuevo precio */}
              <div className="form-field">
                <label htmlFor="new_price" className="form-field__label">
                  {t('priceAdjustmentDetail.field.newPrice', 'Nuevo Precio ($)')}
                </label>
                <Input
                  id="new_price"
                  name="new_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.new_price}
                  onChange={handleChange}
                  placeholder={t('priceAdjustmentDetail.field.newPrice.placeholder', 'ej., 21.50')}
                  className={formErrors.new_price ? 'form-field__input--error' : ''}
                />
                {formErrors.new_price && (
                  <p className="form-field__error">{formErrors.new_price}</p>
                )}
              </div>

              {/* Unidad de medida */}
              <div className="form-field">
                <label htmlFor="unit" className="form-field__label">
                  {t('priceAdjustmentDetail.field.unit', 'Unidad de Medida')}
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="form-field__select"
                >
                  <option value="UNIT">{t('priceAdjustmentDetail.unit.unit', 'unidad')}</option>
                  <option value="kg">{t('priceAdjustmentDetail.unit.kg', 'kg')}</option>
                  <option value="meter">{t('priceAdjustmentDetail.unit.meter', 'metro')}</option>
                  <option value="pack">{t('priceAdjustmentDetail.unit.pack', 'paquete')}</option>
                </select>
              </div>

              {/* Plantilla de Razón */}
              <div className="form-field">
                <label htmlFor="reasonTemplate" className="form-field__label">
                  {t('priceAdjustmentDetail.field.reasonTemplate', 'Plantilla de Razón')}
                </label>
                <select
                  id="reasonTemplate"
                  name="reasonTemplate"
                  value={formData.reasonTemplate}
                  onChange={(e) => handleReasonTemplateChange(e.target.value)}
                  className="form-field__select"
                >
                  {reasonTemplates.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Razón del ajuste */}
              <div className="form-field">
                <label htmlFor="reason" className="form-field__label">
                  {t('priceAdjustmentDetail.field.reason', 'Razón del Ajuste')}
                  <span className="form-field__label-hint">
                    {formData.reasonTemplate === 'CUSTOM'
                      ? t('priceAdjustmentDetail.field.reason.hintCustom', '(Personalizada)')
                      : t('priceAdjustmentDetail.field.reason.hintAuto', '(Generada automáticamente)')}
                  </span>
                </label>
                {formData.reasonTemplate === 'CUSTOM' ? (
                  <>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows={3}
                      maxLength={500}
                      placeholder={t('priceAdjustmentDetail.field.reason.placeholder', 'Escriba la razón personalizada del ajuste de precio...')}
                      className={formErrors.reason ? 'form-field__textarea form-field__textarea--error' : 'form-field__textarea'}
                    />
                    <p className="form-field__char-count">
                      {formData.reason.length}/500 {t('priceAdjustmentDetail.field.reason.characters', 'caracteres')}
                    </p>
                  </>
                ) : (
                  <div className="form-field__readonly">
                    <p className="form-field__readonly-text">
                      {formData.reason || t('priceAdjustmentDetail.field.reason.selectTemplate', 'Seleccione una plantilla arriba para generar la razón automáticamente')}
                    </p>
                  </div>
                )}
                {formErrors.reason && (
                  <p className="form-field__error">{formErrors.reason}</p>
                )}
              </div>

              {/* Metadata adicional */}
              <div className="form-field">
                <label htmlFor="metadata" className="form-field__label">
                  {t('priceAdjustmentDetail.field.metadata', 'Metadata Adicional (JSON)')}
                </label>
                <textarea
                  id="metadata"
                  name="metadata"
                  value={formData.metadata}
                  onChange={handleChange}
                  rows={3}
                  placeholder='{ "campaign_id": "SUMMER2024", "approved_by": "manager" }'
                  className="form-field__textarea form-field__textarea--code"
                />
                {formErrors.metadata && (
                  <p className="form-field__error">{formErrors.metadata}</p>
                )}
              </div>

              {/* Botón de envío */}
              <Button
                type="submit"
                disabled={!isFormValid || creating}
                className="submit-button"
              >
                {creating
                  ? t('priceAdjustmentDetail.action.saving', 'Guardando...')
                  : t('priceAdjustmentDetail.action.submit', 'Registrar Cambio')
                }
              </Button>
            </form>
          </div>
        </div>

        {/* Columna derecha - Historial de ajustes */}
        <div className="price-adjustment-detail__right">
          <div className="history-card">
            <h2 className="history-card__title">
              {t('priceAdjustmentDetail.historyTitle', 'Historial de Ajustes de Precio')}
            </h2>

            {loadingHistory ? (
              <div className="history-loading">
                <div className="loading-spinner" />
                <p>{t('priceAdjustmentDetail.history.loading', 'Cargando historial...')}</p>
              </div>
            ) : historyError ? (
              <div className="history-error">
                <p className="history-error__text">{historyError}</p>
              </div>
            ) : (
              <div className="history-table-wrapper">
                <table className="history-table">
                  <thead className="history-table__head">
                    <tr>
                      <th className="history-table__th">{t('priceAdjustmentDetail.table.date', 'Fecha')}</th>
                      <th className="history-table__th">{t('priceAdjustmentDetail.table.oldPrice', 'Precio Anterior')}</th>
                      <th className="history-table__th">{t('priceAdjustmentDetail.table.newPrice', 'Nuevo Precio')}</th>
                      <th className="history-table__th">{t('priceAdjustmentDetail.table.change', 'Cambio')}</th>
                      <th className="history-table__th">{t('priceAdjustmentDetail.table.reason', 'Razón')}</th>
                      <th className="history-table__th">{t('priceAdjustmentDetail.table.actions', 'Acciones')}</th>
                    </tr>
                  </thead>
                  <tbody className="history-table__body">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="history-table__empty">
                          <p className="history-empty-message">
                            {t('priceAdjustmentDetail.history.empty', 'No hay historial de ajustes de precio para este producto')}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      history.map((adjustment) => {
                        const changePercent = adjustment.old_value > 0
                          ? ((adjustment.value_change / adjustment.old_value) * 100).toFixed(2)
                          : 0;
                        const isIncrease = adjustment.value_change > 0;

                        return (
                          <tr key={adjustment.adjustment_id} className="history-table__row">
                            <td className="history-table__td">
                              {new Date(adjustment.adjustment_date).toLocaleString('es-PY', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="history-table__td">
                              PYG {adjustment.old_value.toLocaleString('es-PY')}
                            </td>
                            <td className="history-table__td">
                              PYG {adjustment.new_value.toLocaleString('es-PY')}
                            </td>
                            <td className={`history-table__td history-table__td--${isIncrease ? 'increase' : 'decrease'}`}>
                              {isIncrease ? '↑' : '↓'} PYG {Math.abs(adjustment.value_change).toLocaleString('es-PY')}
                              <span className="change-percent">({isIncrease ? '+' : ''}{changePercent}%)</span>
                            </td>
                            <td className="history-table__td history-table__td--reason" title={adjustment.reason}>
                              {adjustment.reason.length > 50
                                ? `${adjustment.reason.substring(0, 50)}...`
                                : adjustment.reason}
                            </td>
                            <td className="history-table__td history-table__td--actions">
                              <button
                                className="btn btn--sm btn--secondary"
                                onClick={() => navigate(`/ajustes-precios-nuevo/historial/${adjustment.adjustment_id}`, {
                                  state: { adjustment, product }
                                })}
                                aria-label={t('priceAdjustmentDetail.action.viewDetails', 'Ver detalles')}
                              >
                                {t('priceAdjustmentDetail.action.viewDetails', 'Ver Detalles')}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceAdjustmentDetail;
