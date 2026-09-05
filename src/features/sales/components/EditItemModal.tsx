/**
 * EditItemModal — alta/edición de ítem del carrito (cantidad, unidad, precio
 * final y descuento con razón obligatoria). Reemplaza el modal artesanal de
 * SalesNew (tenía gradiente con hex, prohibido por DESIGN.md) por EnhancedModal.
 *
 * Toda la lógica de negocio (clamp de cantidad, conversión precio↔descuento,
 * razón obligatoria) vive en SalesNew.handleConfirmAdd; acá solo se edita el
 * borrador y se calcula el resumen de línea para previsualizar el impacto.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { DollarSign, Lock, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatNumberInput, parseNumberInput } from '@/domain/shared/moneyInput';
import { isDecimalUnit } from '@/constants/units';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { PRICE_CHANGE_REASONS } from '../constants/priceChangeReasons';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** true = editando ítem existente; false = confirmando adición. */
  editing: boolean;
  productName: string;
  /** Precio base unitario (originalPrice) del producto. */
  baseUnitPrice: number;
  baseUnit: string;
  quantity: number | string;
  onQuantityChange: (v: number | string) => void;
  unit: string;
  onUnitChange: (v: string) => void;
  price: number;
  onPriceChange: (v: number) => void;
  discount: number;
  onDiscountChange: (v: number) => void;
  discountType: 'amount' | 'percent';
  onDiscountTypeChange: (v: 'amount' | 'percent') => void;
  discountReason: string;
  onDiscountReasonChange: (v: string) => void;
  customReason: string;
  onCustomReasonChange: (v: string) => void;
  onConfirm: () => void;
  /**
   * B.4 (PLAN_VENDOR_ROLE): false cuando el usuario carece de
   * sales:apply_discount — precio final, descuento y razón quedan
   * deshabilitados con candado. La validez real la impone el backend (B.3);
   * esto es UX, no seguridad.
   */
  canApplyDiscount?: boolean;
  /** Autofoco en Cantidad (atajo Alt+Q sobre la fila activa del carrito). */
  focusQuantityOnOpen?: boolean;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  editing,
  productName,
  baseUnitPrice,
  baseUnit,
  quantity,
  onQuantityChange,
  unit,
  onUnitChange,
  price,
  onPriceChange,
  discount,
  onDiscountChange,
  discountType,
  onDiscountTypeChange,
  discountReason,
  onDiscountReasonChange,
  customReason,
  onCustomReasonChange,
  onConfirm,
  canApplyDiscount = true,
  focusQuantityOnOpen,
}) => {
  const { t } = useI18n();
  const quantityRef = useRef<HTMLInputElement>(null);
  // Drafts de tipeo para cantidad/precio/descuento: muestran lo escrito (con
  // miles formateados) y commitean solo números válidos, para que borrar no
  // dispare el clamp de cantidad ni el recálculo precio↔descuento a 0.
  const [qtyDraft, setQtyDraft] = React.useState<string | null>(null);
  const [priceDraft, setPriceDraft] = React.useState<string | null>(null);
  const [discountDraft, setDiscountDraft] = React.useState<string | null>(null);

  // EnhancedModal enfoca el contenedor al abrir; 60ms después devolvemos el
  // foco a Cantidad (mismo patrón que los pasos del wizard) para tipear directo.
  useEffect(() => {
    if (!isOpen || !focusQuantityOnOpen) return;
    setQtyDraft(null);
    setPriceDraft(null);
    setDiscountDraft(null);
    const timer = setTimeout(() => {
      quantityRef.current?.focus();
      quantityRef.current?.select();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, focusQuantityOnOpen]);

  const allowDecimal = isDecimalUnit(unit || baseUnit);
  const parsedQuantity = Math.max(0, Number(quantity ?? 1));
  const parsedDiscount = Number(discount) || 0;

  const grossSubtotal = baseUnitPrice * parsedQuantity;
  const discountValue = useMemo(() => {
    let td = 0;
    if (discountType === 'percent') {
      td = baseUnitPrice * (parsedDiscount / 100) * parsedQuantity;
    } else {
      td = parsedDiscount * parsedQuantity;
    }
    return Math.min(Math.max(td, 0), grossSubtotal);
  }, [discountType, parsedDiscount, grossSubtotal, baseUnitPrice, parsedQuantity]);
  const lineTotal = Math.max(0, grossSubtotal - discountValue);

  const setDiscountType = (type: 'amount' | 'percent') => {
    onDiscountTypeChange(type);
    if (type === 'amount') {
      onDiscountChange(Number((baseUnitPrice - price).toFixed(2)));
    } else {
      onDiscountChange(Number((((baseUnitPrice - price) / baseUnitPrice) * 100).toFixed(2)));
    }
  };

  const handleDiscountChange = (value: number) => {
    onDiscountChange(value);
    if (discountType === 'percent') {
      onPriceChange(Math.max(0, Number((baseUnitPrice * (1 - value / 100)).toFixed(2))));
    } else {
      onPriceChange(Math.max(0, Number((baseUnitPrice - value).toFixed(2))));
    }
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editing
          ? t('sales.editItem.titleEdit', 'Editar Detalles')
          : t('sales.editItem.titleNew', 'Configurar Producto')
      }
      subtitle={productName}
      size="md"
      closeOnEscape
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {editing
              ? t('sales.editItem.save', 'Guardar Cambios')
              : t('sales.editItem.confirm', 'Confirmar Adición')}
          </Button>
        </div>
      }
    >
      <div className="space-y-md py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <label htmlFor="edit-item-quantity" className="text-body-md-bold text-foreground">
              {t('sales.editItem.quantity', 'Cantidad')}
            </label>
            <Input
              id="edit-item-quantity"
              ref={quantityRef}
              type={allowDecimal ? 'number' : 'text'}
              inputMode={allowDecimal ? 'decimal' : 'numeric'}
              value={qtyDraft !== null ? qtyDraft : formatNumberInput(quantity)}
              onChange={(e) => {
                const canonical = parseNumberInput(e.target.value);
                setQtyDraft(canonical);
                const parsed = Number(canonical);
                if (canonical !== '' && Number.isFinite(parsed)) {
                  onQuantityChange(allowDecimal ? canonical : Math.max(1, Math.trunc(parsed)));
                }
              }}
              onBlur={() => setQtyDraft(null)}
              min={allowDecimal ? '0.01' : '1'}
              step={allowDecimal ? '0.01' : '1'}
              className="h-10 text-body-md font-data-mono text-foreground"
            />
          </div>
          <div className="space-y-xs">
            <label htmlFor="edit-item-unit" className="text-body-md-bold text-foreground">
              {t('sales.editItem.unit', 'Unidad de Medida')}
            </label>
            <Input
              id="edit-item-unit"
              type="text"
              list="sales-allowed-units"
              value={unit}
              onChange={(e) => onUnitChange(e.target.value)}
              className="h-10 text-body-md text-foreground"
            />
            <datalist id="sales-allowed-units">
              <option value="unit" />
              <option value="kg" />
              <option value="g" />
              <option value="l" />
              <option value="box" />
              <option value="pack" />
              <option value="dozen" />
              <option value="hour" />
            </datalist>
          </div>

          <div className="space-y-xs">
            <label htmlFor="edit-item-base-price" className="text-body-md-bold text-foreground">
              {t('sales.editItem.basePrice', 'Precio Base Unit.')}
            </label>
            <Input
              id="edit-item-base-price"
              type="text"
              value={formatCurrency(baseUnitPrice)}
              disabled
              className="h-10 text-body-md font-data-mono text-on-surface-deep cursor-not-allowed"
            />
          </div>
          <div className="space-y-xs">
            <label htmlFor="edit-item-final-price" className="text-body-md-bold text-primary">
              {t('sales.editItem.finalPrice', 'Precio Final Unit.')}
            </label>
            <Input
              id="edit-item-final-price"
              type="text"
              inputMode="numeric"
              value={priceDraft !== null ? formatNumberInput(priceDraft) : formatNumberInput(price)}
              onChange={(e) => {
                const canonical = parseNumberInput(e.target.value);
                setPriceDraft(canonical);
                const parsed = Number(canonical);
                if (canonical !== '' && Number.isFinite(parsed)) {
                  onPriceChange(Math.max(0, parsed));
                }
              }}
              onBlur={() => setPriceDraft(null)}
              disabled={!canApplyDiscount}
              className="h-10 text-body-md font-data-mono text-primary disabled:cursor-not-allowed disabled:text-on-surface-deep"
            />
          </div>
        </div>

        <hr className="border-divider" />

        {/* Ajuste o descuento */}
        <div className="flex flex-col gap-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-body-md-bold text-foreground">
              {t('sales.editItem.adjustment', 'Ajuste o Descuento')}
            </span>
            {canApplyDiscount ? (
              <div className="flex p-1 bg-surface-muted rounded-md w-fit" role="group" aria-label={t('sales.editItem.adjustment', 'Ajuste o Descuento')}>
                {(['amount', 'percent'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDiscountType(type)}
                    aria-pressed={discountType === type}
                    className={cn(
                      'flex-1 px-3 py-1 text-body-sm-bold rounded-sm transition-colors duration-150',
                      discountType === type
                        ? 'bg-surface text-foreground shadow-whisper'
                        : 'text-on-surface-deep hover:text-foreground',
                    )}
                  >
                    {type === 'amount'
                      ? t('sales.editItem.fixedAmount', 'Monto Fijo')
                      : t('sales.editItem.percentage', 'Porcentaje')}
                  </button>
                ))}
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-body-sm text-on-surface-deep" data-testid="discount-locked-hint">
                <Lock size={14} aria-hidden />
                {t('sales.editItem.discountLocked', 'Requiere permiso para aplicar descuentos')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-on-surface-deep">
                {discountType === 'percent' ? <Percent size={16} /> : <DollarSign size={16} />}
              </div>
              <Input
                type="text"
                inputMode="numeric"
                value={discountDraft !== null ? formatNumberInput(discountDraft) : formatNumberInput(discount)}
                onChange={(e) => {
                  const canonical = parseNumberInput(e.target.value);
                  setDiscountDraft(canonical);
                  const parsed = Number(canonical);
                  if (canonical !== '' && Number.isFinite(parsed)) {
                    handleDiscountChange(Math.max(0, parsed));
                  }
                }}
                onBlur={() => setDiscountDraft(null)}
                placeholder="0"
                disabled={!canApplyDiscount}
                aria-label={t('sales.editItem.discountInput', 'Monto o porcentaje de descuento')}
                className="h-10 pl-9 pr-3 text-body-md font-data-mono disabled:cursor-not-allowed disabled:text-on-surface-deep"
              />
            </div>

            <Select value={discountReason} onValueChange={onDiscountReasonChange} disabled={!canApplyDiscount}>
              <SelectTrigger id="edit-item-reason" className="w-full h-10 text-body-md">
                <SelectValue placeholder={t('sales.editItem.reasonPlaceholder', 'Razón del ajuste...')} />
              </SelectTrigger>
              <SelectContent>
                {PRICE_CHANGE_REASONS.map((reason) => (
                  <SelectItem key={reason.id} value={reason.label}>
                    {reason.label}
                  </SelectItem>
                ))}
                <SelectItem value="Other">{t('sales.editItem.otherReason', 'Otras razones...')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {discountReason === 'Other' && (
            <div className="animate-in slide-in-from-top-1 duration-200">
              <Input
                value={customReason}
                onChange={(e) => onCustomReasonChange(e.target.value)}
                placeholder={t('sales.editItem.customReasonPlaceholder', 'Especificar motivo detallado del ajuste...')}
                aria-label={t('sales.editItem.otherReason', 'Otras razones...')}
                className="h-10 text-body-sm"
              />
            </div>
          )}
        </div>

        {/* Resumen de línea (sin gradientes: superficie + mono) */}
        <div className="bg-surface-muted rounded-md p-md space-y-2">
          <div className="flex justify-between items-center text-body-md text-on-surface-deep">
            <span>{t('sales.editItem.grossSubtotal', 'Subtotal Bruto')}</span>
            <span className="font-data-mono">{formatCurrency(grossSubtotal)}</span>
          </div>
          {discountValue !== 0 && (
            <div className="flex justify-between items-center text-body-md">
              <span className={discountValue > 0 ? 'text-success' : 'text-warning'}>
                {discountValue > 0
                  ? t('sales.editItem.discount', 'Descuento')
                  : t('sales.editItem.surcharge', 'Recargo')}
              </span>
              <span className={cn('font-data-mono', discountValue > 0 ? 'text-success' : 'text-warning')}>
                {discountValue > 0 ? '-' : '+'}
                {formatCurrency(Math.abs(discountValue))}
              </span>
            </div>
          )}
          <div className="flex justify-between items-end pt-3 mt-1 border-t border-divider">
            <span className="text-body-md-bold text-foreground">{t('sales.editItem.lineTotal', 'Total a Pagar')}</span>
            <span className="text-body-lg font-data-mono font-bold text-foreground">
              {formatCurrency(lineTotal)}
            </span>
          </div>
        </div>
      </div>
    </EnhancedModal>
  );
};
