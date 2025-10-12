import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { PRICE_CHANGE_REASONS } from '../hooks/useSalesLogic';
import { Badge } from './ui/badge';
import { AlertTriangle, Percent, DollarSign, Edit3 } from 'lucide-react';
import { validateDiscount, calculateFinalPrice, requiresAuthorization } from '../utils/discountValidation';

const DiscountModal = ({
  isOpen,
  onClose,
  item,
  onApplyPercentageDiscount,
  onApplyFixedDiscount,
  onSetDirectPrice,
  onRemoveDiscount,
  currentUser = null
}) => {
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage', 'fixed', 'direct'
  const [percentageValue, setPercentageValue] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [directPrice, setDirectPrice] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [justification, setJustification] = useState('');
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  const resetForm = useCallback(() => {
    setDiscountType('percentage');
    setPercentageValue('');
    setFixedAmount('');
    setDirectPrice('');
    setSelectedReason('');
    setJustification('');
    setErrors({});
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!selectedReason) {
      newErrors.reason = 'Debe seleccionar una razón para el cambio de precio';
    }

    const selectedReasonObj = PRICE_CHANGE_REASONS.find(r => r.id === selectedReason);
    if (selectedReasonObj?.requiresAuth && !currentUser) {
      newErrors.auth = 'Este tipo de descuento requiere autorización';
    }

    // La justificación detallada es opcional si hay una razón predeterminada seleccionada
    // Solo es obligatoria si no hay razón predeterminada
    if (!selectedReason && !justification.trim()) {
      newErrors.justification = 'Debe proporcionar una justificación o seleccionar una razón predeterminada';
    }

    if (discountType === 'percentage') {
      const value = parseFloat(percentageValue);
      if (!percentageValue || isNaN(value) || value <= 0 || value > 100) {
        newErrors.percentage = 'Ingrese un porcentaje válido entre 1 y 100';
      }
    } else if (discountType === 'fixed') {
      const value = parseFloat(fixedAmount);
      if (!fixedAmount || isNaN(value) || value <= 0) {
        newErrors.fixed = 'Ingrese un monto válido mayor a 0';
      }
      if (item && value >= item.originalPrice) {
        newErrors.fixed = 'El descuento no puede ser igual o mayor al precio original';
      }
    } else if (discountType === 'direct') {
      const value = parseFloat(directPrice);
      if (!directPrice || isNaN(value) || value < 0) {
        newErrors.direct = 'Ingrese un precio válido mayor o igual a 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApply = () => {
    if (!validateForm()) return;

    const selectedReasonObj = PRICE_CHANGE_REASONS.find(r => r.id === selectedReason);
    const authorizedBy = selectedReasonObj?.requiresAuth ? currentUser?.id : null;

    // Usar justificación detallada si existe, sino usar la descripción de la razón predeterminada
    const finalJustification = justification.trim() || selectedReasonObj?.description || '';

    try {
      if (discountType === 'percentage') {
        onApplyPercentageDiscount(
          item.product_id || item.id,
          parseFloat(percentageValue),
          selectedReason,
          finalJustification,
          authorizedBy
        );
      } else if (discountType === 'fixed') {
        onApplyFixedDiscount(
          item.product_id || item.id,
          parseFloat(fixedAmount),
          selectedReason,
          finalJustification,
          authorizedBy
        );
      } else if (discountType === 'direct') {
        onSetDirectPrice(
          item.product_id || item.id,
          parseFloat(directPrice),
          selectedReason,
          finalJustification,
          authorizedBy
        );
      }

      resetForm();
      onClose();
    } catch (error) {
      setErrors({ general: 'Error al aplicar el descuento' });
    }
  };

  const handleRemoveDiscount = () => {
    onRemoveDiscount(item.product_id || item.id);
    resetForm();
    onClose();
  };

  const calculatePreview = () => {
    if (!item) return null;

    let newPrice = item.originalPrice;
    let changeAmount = 0;
    let percentage = 0;
    let isPriceIncrease = false;

    if (discountType === 'percentage' && percentageValue) {
      const percent = parseFloat(percentageValue);
      if (!isNaN(percent)) {
        changeAmount = (item.originalPrice * percent) / 100;
        newPrice = item.originalPrice - changeAmount;
        percentage = percent;
      }
    } else if (discountType === 'fixed' && fixedAmount) {
      const fixed = parseFloat(fixedAmount);
      if (!isNaN(fixed)) {
        changeAmount = Math.min(fixed, item.originalPrice);
        newPrice = item.originalPrice - changeAmount;
        percentage = (changeAmount / item.originalPrice) * 100;
      }
    } else if (discountType === 'direct' && directPrice) {
      const direct = parseFloat(directPrice);
      if (!isNaN(direct)) {
        newPrice = direct;
        changeAmount = Math.abs(item.originalPrice - direct);
        isPriceIncrease = direct > item.originalPrice;
        percentage = changeAmount > 0 ? (changeAmount / item.originalPrice) * 100 : 0;
      }
    }

    return {
      originalPrice: item.originalPrice,
      newPrice: Math.max(0, newPrice),
      changeAmount: Math.abs(changeAmount),
      percentage: Math.abs(percentage),
      isPriceIncrease,
      isDiscount: !isPriceIncrease && changeAmount > 0,
      savings: isPriceIncrease ? 0 : Math.max(0, changeAmount)
    };
  };

  const preview = calculatePreview();
  const selectedReasonObj = PRICE_CHANGE_REASONS.find(r => r.id === selectedReason);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Modificar Precio - {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del producto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Precio original:</span>
              <span className="text-lg font-bold">₲{item.originalPrice?.toLocaleString()}</span>
            </div>
            {item.hasDiscount && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Descuento actual: {item.discountPercentage.toFixed(1)}%
                </Badge>
                <span className="text-sm text-gray-600">
                  (₲{item.discountAmount?.toLocaleString()} menos)
                </span>
              </div>
            )}
          </div>

          {/* Tipo de descuento */}
          <div>
            <Label>Tipo de modificación</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant={discountType === 'percentage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDiscountType('percentage')}
                className="flex items-center gap-1"
              >
                <Percent className="h-4 w-4" />
                %
              </Button>
              <Button
                variant={discountType === 'fixed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDiscountType('fixed')}
                className="flex items-center gap-1"
              >
                <DollarSign className="h-4 w-4" />
                Fijo
              </Button>
              <Button
                variant={discountType === 'direct' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDiscountType('direct')}
                className="flex items-center gap-1"
              >
                <Edit3 className="h-4 w-4" />
                Directo
              </Button>
            </div>
          </div>

          {/* Input según tipo */}
          <div>
            {discountType === 'percentage' && (
              <div>
                <Label htmlFor="percentage">Porcentaje de descuento (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={percentageValue}
                  onChange={(e) => setPercentageValue(e.target.value)}
                  placeholder="Ej: 10"
                />
                {errors.percentage && (
                  <p className="text-red-500 text-sm mt-1">{errors.percentage}</p>
                )}
              </div>
            )}

            {discountType === 'fixed' && (
              <div>
                <Label htmlFor="fixed">Monto de descuento (₲)</Label>
                <Input
                  id="fixed"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  placeholder="Ej: 5000"
                />
                {errors.fixed && (
                  <p className="text-red-500 text-sm mt-1">{errors.fixed}</p>
                )}
              </div>
            )}

            {discountType === 'direct' && (
              <div>
                <Label htmlFor="direct">Precio final (₲)</Label>
                <Input
                  id="direct"
                  type="number"
                  min="0"
                  step="0.01"
                  value={directPrice}
                  onChange={(e) => setDirectPrice(e.target.value)}
                  placeholder="Ej: 45000"
                />
                {errors.direct && (
                  <p className="text-red-500 text-sm mt-1">{errors.direct}</p>
                )}
              </div>
            )}
          </div>

          {/* Razón del cambio */}
          <div>
            <Label>Razón del cambio de precio</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una razón" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_CHANGE_REASONS.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    <div className="flex items-center gap-2">
                      {reason.requiresAuth && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      <div>
                        <div>{reason.label}</div>
                        <div className="text-xs text-gray-500">{reason.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Justificación */}
          <div>
            <Label htmlFor="justification">
              Justificación detallada
              {!selectedReason && (
                <span className="text-red-500 ml-1">*</span>
              )}
              {selectedReason && (
                <span className="text-gray-500 text-xs ml-2">(Opcional - se usará la razón predeterminada si está vacío)</span>
              )}
            </Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={selectedReason ? "Opcional: Añade detalles específicos si es necesario..." : "Explique el motivo específico para este cambio de precio..."}
              rows={3}
            />
            {errors.justification && (
              <p className="text-red-500 text-sm mt-1">{errors.justification}</p>
            )}
          </div>

          {/* Advertencias */}
          {selectedReasonObj?.requiresAuth && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Requiere autorización</span>
              </div>
              <p className="text-orange-600 text-sm mt-1">
                Este cambio quedará registrado como autorizado por: {currentUser?.name || 'Usuario actual'}
              </p>
            </div>
          )}

          {errors.auth && (
            <p className="text-red-500 text-sm">{errors.auth}</p>
          )}

          {errors.general && (
            <p className="text-red-500 text-sm">{errors.general}</p>
          )}

          {/* Vista previa */}
          {preview && (preview.newPrice !== preview.originalPrice) && (
            <div className={`p-4 rounded-lg border-2 ${
              preview.isPriceIncrease
                ? 'bg-orange-50 border-orange-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {preview.isPriceIncrease ? (
                  <>
                    <span className="text-orange-600">🔺</span>
                    Vista previa - AUMENTO DE PRECIO
                  </>
                ) : (
                  <>
                    <span className="text-green-600">🔻</span>
                    Vista previa - DESCUENTO
                  </>
                )}
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Precio original:</span>
                  <span className="font-medium">₲{preview.originalPrice.toLocaleString()}</span>
                </div>
                <div className={`flex justify-between font-medium ${
                  preview.isPriceIncrease ? 'text-orange-600' : 'text-red-600'
                }`}>
                  <span>{preview.isPriceIncrease ? 'Aumento:' : 'Descuento:'}</span>
                  <span>
                    {preview.isPriceIncrease ? '+' : '-'}₲{preview.changeAmount.toLocaleString()}
                    ({preview.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className={`flex justify-between font-bold text-lg ${
                  preview.isPriceIncrease ? 'text-orange-700' : 'text-green-700'
                }`}>
                  <span>Precio final:</span>
                  <span>₲{preview.newPrice.toLocaleString()}</span>
                </div>
                {preview.isDiscount && preview.savings > 0 && (
                  <div className="flex justify-between text-blue-600 pt-2 border-t border-blue-200">
                    <span>💰 Cliente ahorra:</span>
                    <span className="font-semibold">₲{preview.savings.toLocaleString()}</span>
                  </div>
                )}
                {preview.isPriceIncrease && (
                  <div className="flex justify-between text-orange-600 pt-2 border-t border-orange-200">
                    <span>⚡ Cargo adicional:</span>
                    <span className="font-semibold">₲{preview.changeAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            {item.hasDiscount && (
              <Button
                variant="outline"
                onClick={handleRemoveDiscount}
                className="flex-1"
              >
                Remover descuento
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              disabled={!preview || (preview.newPrice === preview.originalPrice)}
              className="flex-1"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountModal;