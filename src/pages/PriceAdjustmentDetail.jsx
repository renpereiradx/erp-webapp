/**
 * Página de Detalle y Ajuste de Precio - Patrón MVP
 * Formulario para ajustar el precio de un producto seleccionado.
 * Alineada a DESIGN.md: tokens semánticos, componentes ui/, Label+htmlFor,
 * estados loading/empty/error (§6.7) y formateo dinámico de miles en el
 * input de precio vía moneyInput (§6.4: 6000 → 6.000).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import PageHeader from '@/components/ui/PageHeader';
import { useI18n } from '@/lib/i18n';
import usePriceAdjustmentNewStore from '@/store/usePriceAdjustmentNewStore';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';
import { useNavigate, useLocation } from 'react-router-dom';
import { variantService } from '@/services/variantService';
import { getGroupedUnitOptions, getUnitLabel } from '@/constants/units';
import { formatPYG } from '@/utils/currencyUtils';
import { formatNumberInput, parseNumberInput } from '@/domain/shared/moneyInput';
import useAuthStore from '@/store/useAuthStore';

// Las variantes enriquecidas (/products/{id}/variants) exponen `id`, no
// `variant_id`; normalizamos para matchear contra selectedVariantId.
const getVariantId = (v) => v?.variant_id || v?.id || '';

// Devuelve el precio de una unidad concreta dentro de unit_prices, o null si no existe.
// Evita tomar ciegamente unit_prices[0] (que el backend ordena alfabéticamente por unidad,
// no por relevancia): para un producto con unit/hour, el precio correcto es el de la unidad
// seleccionada (p. ej. base_unit), no el que aparece primero en el array.
// Con requireParent filtra filas de variantes: unit_prices del padre enriquecido
// viaja mezclado (padre + variantes) y el precio del padre es la fila sin variant_id.
const getUnitPriceFor = (unitList, unit, requireParent = false) => {
  const up = (unitList || []).find(u => u.unit === unit && (!requireParent || !u.variant_id));
  return up ? up.price_per_unit : null;
};

// Devuelve la unidad con el precio más recientemente actualizado (por updated_at).
const getMostRecentUnit = (unitList) => {
  const sorted = [...(unitList || [])].sort(
    (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
  );
  return sorted[0]?.unit || null;
};

// Valores de unidad del catálogo compartido (una sola vez). Se usa para no perder
// el valor actual en el <select> si una unidad viene fuera del catálogo (legacy).
const UNIT_GROUPS = getGroupedUnitOptions();
const CATALOG_UNIT_VALUES = new Set(
  UNIT_GROUPS.flatMap(g => g.options.map(o => o.value))
);

// Selects nativos estilizados con la misma convención que <Input> (§6.4)
const SELECT_CLASSES =
  'w-full h-10 rounded-md border border-border-subtle bg-surface px-3 text-body-md text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer disabled:opacity-60';

const PriceAdjustmentDetail = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const { selectedProduct, creating, error, clearError, createPriceAdjustment, resetState } = usePriceAdjustmentNewStore();
  const { activeBranch } = useAuthStore();

  // Producto de la navegación o del store. Preferimos el ENRIQUECIDO que el
  // handler resolvió por id (unit_prices/tasas del padre); la fila plana del
  // state queda como fallback y aporta variant_id para la preselección.
  const product = selectedProduct || location.state?.selectedProduct;

  // Estado del formulario
  const [formData, setFormData] = useState({
    new_price: '',
    unit: 'unit',
    reason: '',
    reasonTemplate: '',
    approved_by: '',
    metadata: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Estado para el historial de ajustes
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Estado para variantes
  const [variants, setVariants] = useState([]);
  // Fila plana (PLAN_VARIANTES_PLANAS_AJUSTES_PRODUCTOS F-A): la variante ya
  // viene elegida desde la búsqueda — se preselecciona en el formulario.
  const [selectedVariantId, setSelectedVariantId] = useState(
    location.state?.selectedProduct?.variant_id || ''
  );

  // Plantillas predefinidas para razones de ajuste - Alineado con adjustment_type v2.1
  const reasonTemplates = [
    {
      value: '',
      label: t('priceAdjustmentDetail.reasonTemplate.select', 'Seleccionar plantilla...'),
    },
    {
      value: 'MARKET_UPDATE',
      label: '📊 ' + t('priceAdjustmentDetail.reasonTemplate.market', 'Actualización de Mercado'),
    },
    {
      value: 'COMPETITOR_ADJUSTMENT',
      label: '⚔️ ' + t('priceAdjustmentDetail.reasonTemplate.competitive', 'Ajuste por Competencia'),
    },
    {
      value: 'PROMOTION',
      label: '🎉 ' + t('priceAdjustmentDetail.reasonTemplate.promotional', 'Promoción / Oferta'),
    },
    {
      value: 'COST_CHANGE',
      label: '💰 ' + t('priceAdjustmentDetail.reasonTemplate.costChange', 'Cambio en Costo de Proveedor'),
    },
    {
      value: 'CURRENCY_ADJUSTMENT',
      label: '💱 ' + t('priceAdjustmentDetail.reasonTemplate.currency', 'Ajuste por Divisa'),
    },
    {
      value: 'SEASONAL',
      label: '🌟 ' + t('priceAdjustmentDetail.reasonTemplate.seasonal', 'Ajuste Estacional'),
    },
    {
      value: 'CORRECTION',
      label: '🔄 ' + t('priceAdjustmentDetail.reasonTemplate.correction', 'Corrección de Error'),
    },
    {
      value: 'CUSTOM',
      label: '✏️ ' + t('priceAdjustmentDetail.reasonTemplate.custom', 'Razón personalizada...'),
    },
  ]

  // Función para obtener el texto de una plantilla
  const getReasonText = templateValue => {
    const reasonTexts = {
      MARKET_UPDATE: t(
        'priceAdjustmentDetail.reasonText.market',
        'Ajuste de precio por condiciones actuales del mercado',
      ),
      COMPETITOR_ADJUSTMENT: t(
        'priceAdjustmentDetail.reasonText.competitive',
        'Ajuste de precio para mantener competitividad en el mercado',
      ),
      PROMOTION: t(
        'priceAdjustmentDetail.reasonText.promotional',
        'Precio promocional temporal para impulsar ventas',
      ),
      COST_CHANGE: t(
        'priceAdjustmentDetail.reasonText.costChange',
        'Ajuste de precio debido a variaciones en el costo de adquisición',
      ),
      CURRENCY_ADJUSTMENT: t(
        'priceAdjustmentDetail.reasonText.currency',
        'Ajuste por fluctuaciones en el tipo de cambio de la moneda',
      ),
      SEASONAL: t(
        'priceAdjustmentDetail.reasonText.seasonal',
        'Ajuste estacional basado en la demanda del período actual',
      ),
      CORRECTION: t(
        'priceAdjustmentDetail.reasonText.correction',
        'Corrección de error detectado en el precio registrado anteriormente',
      ),
    }
    return reasonTexts[templateValue] || ''
  }

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

  // Cargar variantes si el producto tiene
  useEffect(() => {
    if (product && (product.product_id || product.id)) {
      const fetchVariants = async () => {
        try {
          const productId = product.product_id || product.id;
          const data = await variantService.getEnrichedVariants(productId, activeBranch, false);
          setVariants(data || []);
        } catch (err) {
          console.error('Error fetching variants:', err);
        }
      };
      fetchVariants();
    }
  }, [product, activeBranch]);

  // Pre-seleccionar la unidad: base_unit si tiene precio, si no la de actualización más
  // reciente. Esto evita que "Precio Actual" muestre el precio de una unidad equivocada.
  useEffect(() => {
    if (!product) return;
    const base = product.base_unit;
    const units = (product.unit_prices || []).map(u => u.unit);
    let def = base;
    if (!def || !units.includes(def)) {
      def = getMostRecentUnit(product.unit_prices) || 'unit';
    }
    setFormData(prev => (prev.unit === def ? prev : { ...prev, unit: def }));
  }, [product]);

  // Función para cargar el historial de ajustes (compartida entre montaje y actualización)
  const loadHistory = useCallback(async () => {
    if (!product || !(product.product_id || product.id)) return;

    setLoadingHistory(true);
    setHistoryError(null);

    try {
      // /manual_adjustment/product/{id}/history es de AJUSTES DE STOCK
      // (inventory): filtraba adjustment_type==='price' y quedaba siempre
      // vacío. El historial de precios vive en /manual_adjustment/price/
      // date-range, que acepta product_id sin fechas (owner report 2026-09-14).
      const productId = product.product_id || product.id;
      const result = await priceAdjustmentService.getByDateRange('', '', productId, 10, 0);
      setHistory(result.data || []);
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

  // Setear un campo del formulario y limpiar su error de validación
  const setFieldValue = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Manejar cambio en campos del formulario
  const handleChange = (e) => {
    setFieldValue(e.target.name, e.target.value);
  };

  // Manejar envío del formulario
  const handleSubmit = async e => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const selectedVariant = variants.find(v => getVariantId(v) === selectedVariantId);
    const unitPricesForSubmit = selectedVariant ? selectedVariant.unit_prices : product.unit_prices;
    const currentOldPrice = getUnitPriceFor(unitPricesForSubmit, formData.unit, !selectedVariant)
      ?? (selectedVariant ? (selectedVariant.current_price ?? selectedVariant.price) : (product.current_price ?? product.price))
      ?? 0;

    const newPrice = parseFloat(formData.new_price)

    // Preparar datos para enviar
    const adjustmentData = {
      product_id: product.product_id || product.id,
      variant_id: selectedVariantId || undefined,
      new_price: newPrice,
      old_price: currentOldPrice,
      unit: formData.unit,
      reason: formData.reason.trim(),
      metadata: {
        ...(formData.metadata.trim() ? JSON.parse(formData.metadata) : {}),
        adjustment_type: formData.reasonTemplate || 'MARKET_UPDATE',
        old_price: currentOldPrice,
        new_price: newPrice,
        price_difference: newPrice - currentOldPrice,
        price_change_percent:
          currentOldPrice > 0
            ? ((newPrice - currentOldPrice) / currentOldPrice) * 100
            : 0,
        system_version: '2.1.0-frontend',
        notes: formData.reason.trim(),
        approved_by: formData.approved_by || undefined,
        unit: formData.unit.toLowerCase(),
      },
    }

    const result = await createPriceAdjustment(adjustmentData)

    if (result.success) {
      // Recargar historial después de crear el ajuste
      await loadHistory()

      // Redirigir de vuelta a la página de búsqueda después de un breve delay
      setTimeout(() => {
        navigate('/ajustes-precios')
      }, 1500)
    }
  }

  if (!product) {
    return null;
  }

  // Handle different price formats from API (financial endpoint returns unit_prices array)
  const selectedVariant = variants.find(v => getVariantId(v) === selectedVariantId);
  const unitPricesForDisplay = selectedVariant ? selectedVariant.unit_prices : product.unit_prices;
  const currentPrice = getUnitPriceFor(unitPricesForDisplay, formData.unit, !selectedVariant)
    ?? (selectedVariant ? (selectedVariant.current_price ?? selectedVariant.price) : (product.current_price ?? product.price))
    ?? 0;

  const isFormValid =
    formData.new_price &&
    parseFloat(formData.new_price) > 0 &&
    formData.reason.trim().length >= 10 &&
    Object.keys(formErrors).length === 0;

  return (
    <div className="flex flex-col gap-lg animate-in fade-in">
      {/* Encabezado: volver + título canónico (§6.8) */}
      <div className="flex items-start gap-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/ajustes-precios')}
          aria-label={t('action.back', 'Volver')}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2} />
        </Button>
        <div className="flex-1 min-w-0">
          <PageHeader
            title={product.product_name || product.name}
            subtitle={t('priceAdjustmentDetail.subtitle', 'Modifica el precio de venta y registra el motivo del cambio')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Columna izquierda - Precio actual y formulario */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          {/* Card de precio actual */}
          <section className="bg-surface rounded-md shadow-whisper border-0 p-lg flex items-start justify-between gap-md">
            <div className="flex-1 min-w-0">
              <p className="text-label-caps uppercase text-on-surface-deep">
                {t('priceAdjustmentDetail.currentPrice', 'Precio Actual')}
              </p>
              <p className="mt-xs text-headline-lg text-foreground font-data-mono break-words">
                {formatPYG(currentPrice)}
                <span className="text-title-md text-on-surface-deep">
                  {' / '}{getUnitLabel(formData.unit)}
                </span>
              </p>
              <p className="mt-xs text-data-mono font-data-mono text-on-surface-deep">
                SKU: {product.sku || product.product_id || product.id}
              </p>
            </div>
            <div
              className="shrink-0 size-12 bg-primary/10 text-primary rounded-md flex items-center justify-center"
              aria-hidden="true"
            >
              <TrendingUp className="w-5 h-5" />
            </div>
          </section>

          {/* Formulario de ajuste */}
          <section className="bg-surface rounded-md shadow-whisper border-0 p-lg">
            <h2 className="text-title-md text-foreground">
              {t('priceAdjustmentDetail.formTitle', 'Registrar Nuevo Ajuste')}
            </h2>

            {error && (
              <div
                className="mt-md p-md bg-error-container text-on-error-container rounded-md flex items-start justify-between gap-md"
                role="alert"
              >
                <p className="text-body-md">{error.message || error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  aria-label={t('common.close', 'Cerrar')}
                  className="shrink-0 hover:opacity-70 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form autoComplete="off" onSubmit={handleSubmit} className="mt-md space-y-md">
              {variants.length > 0 && (
                <div className="space-y-xs">
                  <div className="flex items-center justify-between gap-sm">
                    <Label htmlFor="variant-select" className="text-body-md-bold text-foreground">
                      {t('priceAdjustmentDetail.field.variant', 'Variante a Ajustar (Opcional)')}
                    </Label>
                    <Badge variant="warning">
                      {t('priceAdjustmentDetail.field.variant.newBadge', 'Nuevo')}
                    </Badge>
                  </div>
                  <select
                    id="variant-select"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className={SELECT_CLASSES}
                  >
                    <option value="">{t('priceAdjustmentDetail.variant.base', 'Producto Principal (General)')}</option>
                    {variants.map(v => (
                      <option key={getVariantId(v)} value={getVariantId(v)}>
                        {v.variant_name} {v.sku ? `(${v.sku})` : ''} — {formatPYG(getUnitPriceFor(v.unit_prices, formData.unit) ?? v.current_price ?? v.price ?? 0)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {/* Input de precio: formateo dinámico de miles — 6000 → 6.000 (§6.4) */}
                <div className="space-y-xs">
                  <Label htmlFor="new_price" className="text-body-md-bold text-foreground">
                    {t('priceAdjustmentDetail.field.newPrice', 'Nuevo Precio (PYG)')}
                  </Label>
                  <Input
                    id="new_price"
                    name="new_price"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={formatNumberInput(formData.new_price)}
                    onChange={(e) => setFieldValue('new_price', parseNumberInput(e.target.value))}
                    placeholder={t('priceAdjustmentDetail.field.newPrice.placeholder', 'ej. 25.000')}
                    state={formErrors.new_price ? 'error' : ''}
                    className="font-data-mono"
                  />
                  {formErrors.new_price && (
                    <p className="text-body-md text-error">{formErrors.new_price}</p>
                  )}
                </div>

                <div className="space-y-xs">
                  <Label htmlFor="unit" className="text-body-md-bold text-foreground">
                    {t('priceAdjustmentDetail.field.unit', 'Unidad')}
                  </Label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className={SELECT_CLASSES}
                  >
                    {!CATALOG_UNIT_VALUES.has(formData.unit) && (
                      <option value={formData.unit}>{formData.unit}</option>
                    )}
                    {UNIT_GROUPS.map(group => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-xs">
                <Label htmlFor="reasonTemplate" className="text-body-md-bold text-foreground">
                  {t('priceAdjustmentDetail.field.reasonTemplate', 'Plantilla de Razón')}
                </Label>
                <select
                  id="reasonTemplate"
                  name="reasonTemplate"
                  value={formData.reasonTemplate}
                  onChange={(e) => handleReasonTemplateChange(e.target.value)}
                  className={SELECT_CLASSES}
                >
                  {reasonTemplates.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-xs">
                <div className="flex items-center justify-between gap-sm">
                  <Label htmlFor="reason" className="text-body-md-bold text-foreground">
                    {t('priceAdjustmentDetail.field.reason', 'Razón del Ajuste')}
                  </Label>
                  <Badge variant="secondary">
                    {formData.reasonTemplate === 'CUSTOM'
                      ? t('priceAdjustmentDetail.field.reason.hintCustom', 'Personalizada')
                      : t('priceAdjustmentDetail.field.reason.hintAuto', 'Automática')}
                  </Badge>
                </div>
                {formData.reasonTemplate === 'CUSTOM' ? (
                  <>
                    <Textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows={3}
                      maxLength={500}
                      aria-invalid={!!formErrors.reason}
                      placeholder={t('priceAdjustmentDetail.field.reason.placeholder', 'Escriba la razón personalizada...')}
                    />
                    <p className="text-right text-body-sm-bold text-on-surface-deep">
                      {formData.reason.length}/500 {t('priceAdjustmentDetail.field.reason.characters', 'caracteres')}
                    </p>
                  </>
                ) : (
                  <div className="p-md bg-surface-muted border border-border-subtle rounded-md text-body-md text-on-surface-deep italic min-h-20">
                    {formData.reason || t('priceAdjustmentDetail.field.reason.selectTemplate', 'Seleccione una plantilla arriba')}
                  </div>
                )}
                {formErrors.reason && (
                  <p className="text-body-md text-error">{formErrors.reason}</p>
                )}
              </div>

              <div className="space-y-xs">
                <Label htmlFor="approved_by" className="text-body-md-bold text-foreground">
                  {t('priceAdjustmentDetail.field.approvedBy', 'Aprobado por (Opcional)')}
                </Label>
                <Input
                  id="approved_by"
                  name="approved_by"
                  type="text"
                  autoComplete="off"
                  value={formData.approved_by}
                  onChange={handleChange}
                  placeholder={t('priceAdjustmentDetail.field.approvedBy.placeholder', 'ej. Juan Pérez (Gerente)')}
                />
              </div>

              <div className="space-y-xs">
                <Label htmlFor="metadata" className="text-body-md-bold text-foreground">
                  {t('priceAdjustmentDetail.field.metadata', 'Metadata Adicional (JSON)')}
                </Label>
                <Textarea
                  id="metadata"
                  name="metadata"
                  value={formData.metadata}
                  onChange={handleChange}
                  rows={2}
                  aria-invalid={!!formErrors.metadata}
                  className="font-data-mono"
                  placeholder='{ "source": "market_analysis" }'
                />
                {formErrors.metadata && (
                  <p className="text-body-md text-error">{formErrors.metadata}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!isFormValid || creating}
                className="w-full"
              >
                {creating && <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {creating
                  ? t('priceAdjustmentDetail.action.saving', 'Guardando...')
                  : t('priceAdjustmentDetail.action.submit', 'Registrar Cambio')
                }
              </Button>
            </form>
          </section>
        </div>

        {/* Columna derecha - Historial de ajustes */}
        <div className="lg:col-span-7">
          <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden h-full flex flex-col">
            <div className="px-lg py-md border-b border-divider flex justify-between items-center bg-surface-muted">
              <h3 className="text-title-md text-foreground">
                {t('priceAdjustmentDetail.historyTitle', 'Historial de Ajustes')}
              </h3>
              <Info className="w-4 h-4 text-on-surface-deep" aria-hidden="true" />
            </div>

            <div className="flex-1 overflow-auto">
              {loadingHistory ? (
                <div className="p-lg">
                  <GenericSkeletonList count={5} />
                </div>
              ) : historyError ? (
                <div className="p-lg">
                  <ErrorState
                    title={t('priceAdjustmentDetail.history.error', 'Error al cargar historial')}
                    message={historyError}
                    onRetry={loadHistory}
                  />
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  icon={Info}
                  title={t('priceAdjustmentDetail.history.empty', 'No hay historial de ajustes')}
                />
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-surface-muted">
                    <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                      <TableHead className="text-label-caps uppercase text-on-surface-deep text-center">
                        {t('priceAdjustmentDetail.table.date', 'Fecha')}
                      </TableHead>
                      <TableHead className="text-label-caps uppercase text-on-surface-deep text-center">
                        {t('priceAdjustmentDetail.table.prices', 'Precios')}
                      </TableHead>
                      <TableHead className="text-label-caps uppercase text-on-surface-deep text-center">
                        {t('priceAdjustmentDetail.table.change', 'Cambio')}
                      </TableHead>
                      <TableHead className="text-label-caps uppercase text-on-surface-deep">
                        {t('priceAdjustmentDetail.table.reason', 'Razón')}
                      </TableHead>
                      <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                        <span className="sr-only">{t('priceAdjustmentDetail.table.actions', 'Acciones')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((adj) => {
                      const changePercent = adj.old_value > 0
                        ? ((adj.value_change / adj.old_value) * 100).toFixed(1)
                        : 0;
                      const isIncrease = adj.value_change > 0;

                      return (
                        <TableRow
                          key={adj.adjustment_id}
                          className="hover:bg-surface-muted transition-colors duration-150"
                        >
                          <TableCell className="text-center">
                            <span className="block text-data-mono font-data-mono text-foreground">
                              {new Date(adj.adjustment_date).toLocaleDateString('es-PY')}
                            </span>
                            <span className="block text-body-sm-bold text-on-surface-deep">
                              {new Date(adj.adjustment_date).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-xs">
                              <span className="text-data-mono font-data-mono text-on-surface-deep line-through">
                                {formatPYG(adj.old_value)}
                              </span>
                              <span className="text-data-mono font-data-mono text-foreground">
                                {formatPYG(adj.new_value)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`flex items-center justify-center gap-xs text-body-sm-bold font-data-mono ${isIncrease ? 'text-success' : 'text-error'}`}>
                              {isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              {isIncrease ? '+' : ''}{changePercent}%
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {adj.variant_id && (
                              <p className="text-body-sm-bold text-primary truncate">
                                {variants.find(v => getVariantId(v) === adj.variant_id)?.variant_name || adj.variant_id}
                              </p>
                            )}
                            <p className="text-body-md text-on-surface-deep italic truncate" title={adj.reason}>
                              {adj.reason}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/ajustes-precios/historial/${adj.adjustment_id}`, {
                                state: { adjustment: adj, product }
                              })}
                            >
                              {t('priceAdjustmentDetail.action.viewDetails', 'Ver Detalles')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PriceAdjustmentDetail;
