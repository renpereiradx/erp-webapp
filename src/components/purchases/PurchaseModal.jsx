/**
 * PurchaseModal - Modal CRUD Completo para Compras
 * Wave 1: Arquitectura Base Sólida
 * Modal enterprise con validaciones, estados y accesibilidad completa
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Save, Plus, Trash2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// Custom Components
import SupplierSelector from '@/components/SupplierSelector';
import DataState from '@/components/ui/DataState';

// Store y lógica
import usePurchaseStore from '@/store/usePurchaseStore';
import { useI18n } from '@/lib/i18n';

// Types y constantes
import { PURCHASE_STATUS, PURCHASE_PRIORITY } from '@/types/purchaseTypes';
import { formatErrorMessage } from '@/constants/purchaseErrors';

/**
 * @typedef {Object} PurchaseModalProps
 * @property {boolean} isOpen - Si el modal está abierto
 * @property {function} onClose - Callback al cerrar
 * @property {'create'|'edit'|'view'} mode - Modo del modal
 * @property {Object|null} purchase - Orden de compra para editar/ver
 * @property {function} onSuccess - Callback al completar acción exitosamente
 */

/**
 * Modal CRUD completo para gestión de compras
 */
const PurchaseModal = ({ 
  isOpen, 
  onClose, 
  mode = 'create', 
  purchase = null, 
  onSuccess 
}) => {
  const { t } = useI18n();
  
  // Store state
  const { 
    isCreating, 
    isUpdating, 
    error, 
    createPurchase,
    clearError 
  } = usePurchaseStore();

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: null,
    status: PURCHASE_STATUS.PENDING,
    product_details: [],
    payment_method_id: 1,
    currency_id: 1,
    metadata: {
      purchase_priority: PURCHASE_PRIORITY.MEDIUM,
      notes: '',
      delivery_date: ''
    }
  });

  const [formErrors, setFormErrors] = useState({});
  const [currentProduct, setCurrentProduct] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0,
    tax_rate_id: null,
    profit_pct: null
  });

  // Estados derivados
  const isReadOnly = mode === 'view';
  const isLoading = isCreating || isUpdating;
  const modalTitle = useMemo(() => {
    const titles = {
      create: t('purchases.modal.create_title'),
      edit: t('purchases.modal.edit_title'),
      view: t('purchases.modal.view_title')
    };
    return titles[mode] || titles.create;
  }, [mode, t]);

  // Efectos
  useEffect(() => {
    if (isOpen) {
      clearError();
      if (mode !== 'create' && purchase) {
        // Cargar datos existentes
        setFormData({
          supplier_id: purchase.supplier_id,
          status: purchase.status,
          product_details: purchase.purchase_items || [],
          payment_method_id: purchase.payment_method_id || 1,
          currency_id: purchase.currency_id || 1,
          metadata: {
            purchase_priority: purchase.metadata?.purchase_priority || PURCHASE_PRIORITY.MEDIUM,
            notes: purchase.metadata?.notes || '',
            delivery_date: purchase.metadata?.delivery_date || ''
          }
        });
      } else {
        // Reset para crear nuevo
        resetForm();
      }
    }
  }, [isOpen, mode, purchase]);

  // Handlers
  const resetForm = useCallback(() => {
    setFormData({
      supplier_id: null,
      status: PURCHASE_STATUS.PENDING,
      product_details: [],
      payment_method_id: 1,
      currency_id: 1,
      metadata: {
        purchase_priority: PURCHASE_PRIORITY.MEDIUM,
        notes: '',
        delivery_date: ''
      }
    });
    setFormErrors({});
    setCurrentProduct({
      product_id: '',
      quantity: 1,
      unit_price: 0,
      tax_rate_id: null,
      profit_pct: null
    });
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [formErrors]);

  const handleMetadataChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  }, []);

  const handleProductChange = useCallback((field, value) => {
    setCurrentProduct(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const addProduct = useCallback(() => {
    // Validar producto actual
    const errors = validateProduct(currentProduct);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Agregar producto
    setFormData(prev => ({
      ...prev,
      product_details: [...prev.product_details, { ...currentProduct }]
    }));

    // Reset producto actual
    setCurrentProduct({
      product_id: '',
      quantity: 1,
      unit_price: 0,
      tax_rate_id: null,
      profit_pct: null
    });
    
    setFormErrors({});
  }, [currentProduct]);

  const removeProduct = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      product_details: prev.product_details.filter((_, i) => i !== index)
    }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.supplier_id) {
      errors.supplier_id = t('purchases.errors.supplier_required');
    }

    if (!formData.product_details || formData.product_details.length === 0) {
      errors.product_details = t('purchases.errors.products_required');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, t]);

  const validateProduct = useCallback((product) => {
    const errors = {};

    if (!product.product_id || product.product_id.trim() === '') {
      errors.product_id = t('purchases.errors.product_id_required');
    }

    if (!product.quantity || product.quantity <= 0) {
      errors.quantity = t('purchases.errors.quantity_invalid');
    }

    if (!product.unit_price || product.unit_price <= 0) {
      errors.unit_price = t('purchases.errors.unit_price_invalid');
    }

    return errors;
  }, [t]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'create') {
        const result = await createPurchase(formData);
        
        if (result.success) {
          onSuccess?.(result);
          handleClose();
        }
      } else if (mode === 'edit') {
        // TODO: Implementar update cuando esté disponible en el store
        console.log('Update purchase:', formData);
      }
    } catch (error) {
      console.error('Error saving purchase:', error);
    }
  }, [mode, formData, validateForm, createPurchase, onSuccess, handleClose]);

  // Cálculos derivados
  const totalAmount = useMemo(() => {
    return formData.product_details.reduce((total, product) => {
      const subtotal = product.quantity * product.unit_price;
      const taxRate = 0.19; // 19% default tax rate
      const tax = subtotal * taxRate;
      return total + subtotal + tax;
    }, 0);
  }, [formData.product_details]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-labelledby="purchase-modal-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 
            id="purchase-modal-title"
            className="text-xl font-semibold text-gray-900"
          >
            {modalTitle}
          </h2>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">
                  {formatErrorMessage(error.code || 'API_ERROR', {}, t)}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <Card>
              <CardHeader>
                <CardTitle>{t('purchases.modal.basic_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Supplier Selector */}
                <div>
                  <Label htmlFor="supplier">
                    {t('purchases.fields.supplier')} *
                  </Label>
                  <SupplierSelector
                    value={formData.supplier_id}
                    onChange={(supplierId) => handleFieldChange('supplier_id', supplierId)}
                    disabled={isReadOnly}
                    error={formErrors.supplier_id}
                  />
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="status">
                    {t('purchases.fields.status')}
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleFieldChange('status', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PURCHASE_STATUS).map(status => (
                        <SelectItem key={status} value={status}>
                          <Badge variant="outline">
                            {t(`purchases.status.${status}`)}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div>
                  <Label htmlFor="priority">
                    {t('purchases.fields.priority')}
                  </Label>
                  <Select
                    value={formData.metadata.purchase_priority}
                    onValueChange={(value) => handleMetadataChange('purchase_priority', value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PURCHASE_PRIORITY).map(priority => (
                        <SelectItem key={priority} value={priority}>
                          {t(`purchases.priority.${priority}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Productos */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('purchases.modal.products')} *
                  {formData.product_details.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {formData.product_details.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agregar Producto */}
                {!isReadOnly && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <h4 className="font-medium">{t('purchases.modal.add_product')}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="product_id">
                          {t('purchases.fields.product_id')} *
                        </Label>
                        <Input
                          id="product_id"
                          value={currentProduct.product_id}
                          onChange={(e) => handleProductChange('product_id', e.target.value)}
                          placeholder="PROD001"
                          className={formErrors.product_id ? 'border-red-500' : ''}
                        />
                        {formErrors.product_id && (
                          <p className="text-sm text-red-600 mt-1">
                            {formErrors.product_id}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="quantity">
                          {t('purchases.fields.quantity')} *
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={currentProduct.quantity}
                          onChange={(e) => handleProductChange('quantity', Number(e.target.value))}
                          className={formErrors.quantity ? 'border-red-500' : ''}
                        />
                        {formErrors.quantity && (
                          <p className="text-sm text-red-600 mt-1">
                            {formErrors.quantity}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="unit_price">
                          {t('purchases.fields.unit_price')} *
                        </Label>
                        <Input
                          id="unit_price"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={currentProduct.unit_price}
                          onChange={(e) => handleProductChange('unit_price', Number(e.target.value))}
                          className={formErrors.unit_price ? 'border-red-500' : ''}
                        />
                        {formErrors.unit_price && (
                          <p className="text-sm text-red-600 mt-1">
                            {formErrors.unit_price}
                          </p>
                        )}
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          onClick={addProduct}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('purchases.actions.add_product')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Productos */}
                {formData.product_details.length > 0 ? (
                  <div className="space-y-2">
                    {formData.product_details.map((product, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <span className="font-medium">{product.product_id}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">
                              {t('purchases.fields.quantity')}: {product.quantity}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">
                              ${product.unit_price.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-green-600">
                              ${(product.quantity * product.unit_price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(index)}
                            className="text-red-600 hover:text-red-700"
                            aria-label={t('purchases.actions.remove_product')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <DataState
                    state="empty"
                    title={t('purchases.empty.no_products')}
                    description={t('purchases.empty.no_products_desc')}
                  />
                )}

                {formErrors.product_details && (
                  <p className="text-sm text-red-600">
                    {formErrors.product_details}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Información Adicional */}
            <Card>
              <CardHeader>
                <CardTitle>{t('purchases.modal.additional_info')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Delivery Date */}
                <div>
                  <Label htmlFor="delivery_date">
                    {t('purchases.fields.delivery_date')}
                  </Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.metadata.delivery_date}
                    onChange={(e) => handleMetadataChange('delivery_date', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">
                    {t('purchases.fields.notes')}
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.metadata.notes}
                    onChange={(e) => handleMetadataChange('notes', e.target.value)}
                    disabled={isReadOnly}
                    placeholder={t('purchases.placeholders.notes')}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resumen */}
            {formData.product_details.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('purchases.modal.summary')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {t('purchases.fields.total')}: ${totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formData.product_details.length} {t('purchases.summary.items')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>

        {/* Footer */}
        {!isReadOnly && (
          <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading || formData.product_details.length === 0}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? t('common.create') : t('common.save')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PurchaseModal);
