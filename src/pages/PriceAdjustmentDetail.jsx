/**
 * Página de Detalle y Ajuste de Precio - Patrón MVP
 * Formulario para ajustar el precio de un producto seleccionado
 * Siguiendo Fluent Design System 2
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import usePriceAdjustmentNewStore from '@/store/usePriceAdjustmentNewStore';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';
import { useNavigate, useLocation } from 'react-router-dom';

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
      navigate('/ajustes-precios');
    }
  }, [product, navigate]);

  // Limpiar estado al desmontar el componente
  useEffect(() => {
    return () => {
      // Limpiar el estado cuando salimos de la página de detalle
      resetState();
    };
  }, [resetState]);

  // Función para cargar el historial de ajustes (compartida entre montaje y actualización)
  const loadHistory = useCallback(async () => {
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
  }, [product, t]);

  // Cargar historial de ajustes al montar el componente
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
      } catch {
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
      await loadHistory();

      // Redirigir de vuelta a la página de búsqueda después de un breve delay
      setTimeout(() => {
        navigate('/ajustes-precios');
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <header className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => navigate('/ajustes-precios')}
            className="p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={t('action.back', 'Volver')}
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
            <h1 className="text-2xl font-black text-text-main tracking-tighter uppercase leading-tight">
              {product.product_name || product.name}
            </h1>
            <p className='text-xs font-mono text-primary font-bold uppercase tracking-widest'>
              ID: {product.product_id || product.id}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna izquierda - Precio actual y formulario */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Card de precio actual */}
          <div className="bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle flex items-center justify-between overflow-hidden">
            <div className='flex-1 min-w-0'>
              <p className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1'>
                {t('priceAdjustmentDetail.currentPrice', 'Precio Actual')}
              </p>
              <h2 className='text-3xl font-black text-text-main break-words'>
                PYG {currentPrice.toLocaleString('es-PY')}
              </h2>
            </div>
            <div className='flex-shrink-0 size-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center'>
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Formulario de ajuste */}
          <div className="bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden">
            <h2 className='text-sm font-black uppercase text-text-main tracking-widest mb-6 border-b border-slate-100 pb-3'>
              {t('priceAdjustmentDetail.formTitle', 'Registrar Nuevo Ajuste')}
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-error/10 border-l-4 border-error rounded-r-lg flex items-center justify-between">
                <p className="text-xs text-error font-bold">{error}</p>
                <button onClick={clearError} className="text-error hover:text-red-700 transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className='flex flex-col gap-1.5'>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {t('priceAdjustmentDetail.field.newPrice', 'Nuevo Precio (PYG)')}
                  </label>
                  <input
                    name="new_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.new_price}
                    onChange={handleChange}
                    placeholder="ej. 25000"
                    className={`h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold ${formErrors.new_price ? 'border-error ring-1 ring-error' : ''}`}
                  />
                  {formErrors.new_price && (
                    <p className="text-error text-[10px] font-bold uppercase">{formErrors.new_price}</p>
                  )}
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    {t('priceAdjustmentDetail.field.unit', 'Unidad')}
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="UNIT">{t('priceAdjustmentDetail.unit.unit', 'unidad')}</option>
                    <option value="kg">{t('priceAdjustmentDetail.unit.kg', 'kg')}</option>
                    <option value="meter">{t('priceAdjustmentDetail.unit.meter', 'metro')}</option>
                    <option value="pack">{t('priceAdjustmentDetail.unit.pack', 'paquete')}</option>
                  </select>
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {t('priceAdjustmentDetail.field.reasonTemplate', 'Plantilla de Razón')}
                </label>
                <select
                  name="reasonTemplate"
                  value={formData.reasonTemplate}
                  onChange={(e) => handleReasonTemplateChange(e.target.value)}
                  className="h-11 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                >
                  {reasonTemplates.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center justify-between">
                  {t('priceAdjustmentDetail.field.reason', 'Razón del Ajuste')}
                  <span className='text-[9px] px-1.5 py-0.5 rounded bg-slate-100'>
                    {formData.reasonTemplate === 'CUSTOM'
                      ? t('priceAdjustmentDetail.field.reason.hintCustom', 'Personalizada')
                      : t('priceAdjustmentDetail.field.reason.hintAuto', 'Automática')}
                  </span>
                </label>
                {formData.reasonTemplate === 'CUSTOM' ? (
                  <>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows={3}
                      maxLength={500}
                      className={`p-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${formErrors.reason ? 'border-error ring-1 ring-error' : ''}`}
                      placeholder={t('priceAdjustmentDetail.field.reason.placeholder', 'Escriba la razón personalizada...')}
                    />
                    <p className="text-right text-[9px] text-slate-400 font-bold uppercase">
                      {formData.reason.length}/500 {t('priceAdjustmentDetail.field.reason.characters', 'caracteres')}
                    </p>
                  </>
                ) : (
                  <div className="p-3 bg-slate-50 border border-border-subtle rounded-lg text-sm text-text-secondary italic min-h-[80px]">
                    {formData.reason || t('priceAdjustmentDetail.field.reason.selectTemplate', 'Seleccione una plantilla arriba')}
                  </div>
                )}
                {formErrors.reason && (
                  <p className="text-error text-[10px] font-bold uppercase">{formErrors.reason}</p>
                )}
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {t('priceAdjustmentDetail.field.metadata', 'Metadata Adicional (JSON)')}
                </label>
                <textarea
                  name="metadata"
                  value={formData.metadata}
                  onChange={handleChange}
                  rows={2}
                  className={`p-3 border border-border-subtle rounded-lg bg-white text-xs font-mono focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${formErrors.metadata ? 'border-error ring-1 ring-error' : ''}`}
                  placeholder='{ "source": "market_analysis" }'
                />
                {formErrors.metadata && (
                  <p className="text-error text-[10px] font-bold uppercase">{formErrors.metadata}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || creating}
                className="w-full h-12 bg-primary text-white text-xs font-black uppercase rounded shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {creating ? <RefreshCw className='animate-spin' size={16} /> : null}
                {creating
                  ? t('priceAdjustmentDetail.action.saving', 'Guardando...')
                  : t('priceAdjustmentDetail.action.submit', 'Registrar Cambio')
                }
              </Button>
            </form>
          </div>
        </div>

        {/* Columna derecha - Historial de ajustes */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden h-full flex flex-col">
            <div className='px-6 py-4 border-b border-border-subtle flex justify-between items-center bg-[#fafafa]'>
              <h3 className='text-[13px] font-bold text-gray-700 uppercase tracking-widest'>
                {t('priceAdjustmentDetail.historyTitle', 'Historial de Ajustes')}
              </h3>
              <Info size={16} className='text-slate-400' />
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {loadingHistory ? (
                <div className="py-20 flex flex-col items-center gap-3">
                  <RefreshCw className="animate-spin text-primary" size={32} />
                  <p className='text-xs font-bold text-slate-400 uppercase tracking-widest'>Cargando historial...</p>
                </div>
              ) : historyError ? (
                <div className="p-12 text-center text-error italic text-sm">{historyError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-border-subtle text-[11px] font-black uppercase text-slate-500 tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-3 px-6 text-center">{t('priceAdjustmentDetail.table.date', 'Fecha')}</th>
                        <th className="py-3 px-4 text-center">{t('priceAdjustmentDetail.table.prices', 'Precios')}</th>
                        <th className="py-3 px-4 text-center">{t('priceAdjustmentDetail.table.change', 'Cambio')}</th>
                        <th className="py-3 px-4">{t('priceAdjustmentDetail.table.reason', 'Razón')}</th>
                        <th className="py-3 px-6 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-20 text-center italic text-slate-400">
                            {t('priceAdjustmentDetail.history.empty', 'No hay historial de ajustes')}
                          </td>
                        </tr>
                      ) : (
                        history.map((adj) => {
                          const changePercent = adj.old_value > 0
                            ? ((adj.value_change / adj.old_value) * 100).toFixed(1)
                            : 0;
                          const isIncrease = adj.value_change > 0;

                          return (
                            <tr key={adj.adjustment_id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6 text-center">
                                <span className='font-medium block'>
                                  {new Date(adj.adjustment_date).toLocaleDateString('es-PY')}
                                </span>
                                <span className='text-[9px] text-slate-400 font-bold uppercase'>
                                  {new Date(adj.adjustment_date).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className='flex flex-col items-center gap-0.5'>
                                  <span className='text-slate-400 line-through'>
                                    PYG {adj.old_value.toLocaleString('es-PY')}
                                  </span>
                                  <span className='font-black text-text-main'>
                                    PYG {adj.new_value.toLocaleString('es-PY')}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <div className={`flex items-center justify-center gap-1 font-black ${isIncrease ? 'text-success' : 'text-error'}`}>
                                  {isIncrease ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {isIncrease ? '+' : ''}{changePercent}%
                                </div>
                              </td>
                              <td className="py-4 px-4 max-w-[200px]">
                                <p className='truncate italic text-slate-500' title={adj.reason}>
                                  {adj.reason}
                                </p>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  className="px-3 py-1 bg-white border border-border-subtle rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                                  onClick={() => navigate(`/ajustes-precios/historial/${adj.adjustment_id}`, {
                                    state: { adjustment: adj, product }
                                  })}
                                >
                                  {t('priceAdjustmentDetail.action.viewDetails', 'Detalles')}
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
    </div>
  );
};

export default PriceAdjustmentDetail;
