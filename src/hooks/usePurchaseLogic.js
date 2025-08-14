/**
 * Custom hook para lógica de compras
 * Centraliza toda la lógica de negocio, cálculos y validaciones de compras
 * Separa la lógica de negocio de la UI siguiendo las mejores prácticas
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import purchaseService from '../services/purchaseService';
import supplierService from '../services/supplierService';
import { 
  PURCHASE_VALIDATION_RULES, 
  PURCHASE_STATES,
  PURCHASE_MESSAGES,
  TAX_RATES,
  PURCHASE_TAX_CONFIG 
} from '../constants/purchaseData';
import { DELIVERY_METHODS } from '../constants/purchaseData';

export const usePurchaseLogic = () => {
  // Estado principal
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('net_30');
  const [deliveryMethod, setDeliveryMethod] = useState('standard');
  
  // Estado de UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Helper para obtener método de entrega
  const getDeliveryMethod = useCallback((methodId) => {
    return DELIVERY_METHODS.find(method => method.id === methodId);
  }, []);

  // Obtener costo de entrega
  const getDeliveryCost = useCallback(() => {
    const deliveryOption = getDeliveryMethod(deliveryMethod);
    return deliveryOption ? deliveryOption.cost : 0;
  }, [deliveryMethod]);

  // Cálculos automáticos mejorados con tasas de impuestos por producto
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    // Calcular subtotal y impuestos por producto
    purchaseItems.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;

      // Obtener tasa de impuesto del producto (si aplica)
      if (item.taxRateId && TAX_RATES) {
        const taxRate = Object.values(TAX_RATES).find(rate => rate.id === item.taxRateId);
        if (taxRate) {
          totalTax += itemSubtotal * taxRate.rate;
        }
      }
    });

    const deliveryCost = getDeliveryCost();
    const total = subtotal + totalTax + deliveryCost;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(totalTax.toFixed(2)),
      deliveryCost: Number(deliveryCost.toFixed(2)),
      total: Number(total.toFixed(2)),
      itemCount: purchaseItems.reduce((sum, item) => sum + item.quantity, 0),
      uniqueProducts: purchaseItems.length
    };
  }, [purchaseItems, deliveryMethod]);

  // Validaciones centralizadas
  const validations = useMemo(() => {
    const hasSupplier = Boolean(selectedSupplier);
    const hasItems = purchaseItems.length > 0;
    const hasValidItems = purchaseItems.every(item => 
      item.quantity > 0 && item.unitPrice > 0
    );
    const totalWithinLimits = calculations.total > 0 && calculations.total < 1000000;

    return {
      hasSupplier,
      hasItems,
      hasValidItems,
      totalWithinLimits,
      canProceed: hasSupplier && hasItems && hasValidItems && totalWithinLimits,
      itemsCount: purchaseItems.length,
      isValidDeliveryDate: expectedDelivery ? new Date(expectedDelivery) > new Date() : true
    };
  }, [selectedSupplier, purchaseItems, calculations.total, expectedDelivery]);

  // Agregar producto al pedido con soporte para tasas de impuestos
  const addPurchaseItem = useCallback((product, quantity = 1, unitPrice = null) => {
    if (!product) return;

    const price = unitPrice || product.supplier_price || product.price || 0;
    const minQuantity = product.min_order_quantity || 1;
    const finalQuantity = Math.max(quantity, minQuantity);

    setPurchaseItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // Actualizar cantidad del producto existente
        return prevItems.map((item, index) => 
          index === existingItemIndex 
            ? { ...item, quantity: item.quantity + finalQuantity }
            : item
        );
      } else {
        // Agregar nuevo producto con toda la información requerida
        const newItem = {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          quantity: finalQuantity,
          unitPrice: price,
          category: product.category,
          supplierCode: product.supplier_code,
          minOrderQuantity: product.min_order_quantity || 1,
          packaging: product.packaging || 'Unidad',
          unit: product.unit || 'pieza',
          // Nuevos campos según especificación
          expDate: product.expDate || null,
          taxRateId: product.taxRateId || null,
          profitPct: product.profitPct || 0,
          taxCategory: product.tax_category || product.category
        };
        
        return [...prevItems, newItem];
      }
    });
  }, []);



  // Actualizar cantidad de un producto
  const updateItemQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity < 0) return;

    setPurchaseItems(prevItems => 
      prevItems.map(item => {
        if (item.productId === productId) {
          return newQuantity === 0 
            ? null 
            : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean)
    );
  }, []);

  // Actualizar precio unitario de un producto
  const updateItemPrice = useCallback((productId, newPrice) => {
    if (newPrice < 0) return;

    setPurchaseItems(prevItems => 
      prevItems.map(item => 
        item.productId === productId 
          ? { ...item, unitPrice: newPrice }
          : item
      )
    );
  }, []);

  // Remover producto del pedido
  const removeItem = useCallback((productId) => {
    setPurchaseItems(prevItems => 
      prevItems.filter(item => item.productId !== productId)
    );
  }, []);

  // Limpiar todo el pedido
  const clearPurchase = useCallback(() => {
    setPurchaseItems([]);
    setSelectedSupplier(null);
    setPurchaseNotes('');
    setExpectedDelivery('');
    setPaymentTerms('net_30');
    setDeliveryMethod('standard');
    setErrors({});
  }, []);

  // Validar pedido completo
  const validatePurchase = useCallback(() => {
    const newErrors = {};

    // Validar proveedor
    if (!selectedSupplier) {
      newErrors.supplier = PURCHASE_MESSAGES.ERROR.SUPPLIER_REQUIRED;
    }

    // Validar productos
    if (purchaseItems.length === 0) {
      newErrors.items = PURCHASE_MESSAGES.ERROR.ITEMS_REQUIRED;
    }

    // Validar cada item
    purchaseItems.forEach((item, index) => {
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = PURCHASE_MESSAGES.ERROR.QUANTITY_INVALID;
      }
      if (item.unitPrice <= 0) {
        newErrors[`item_${index}_price`] = PURCHASE_MESSAGES.ERROR.PRICE_INVALID;
      }
      if (item.quantity < item.minOrderQuantity) {
        newErrors[`item_${index}_min`] = `Cantidad mínima: ${item.minOrderQuantity}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedSupplier, purchaseItems]);

  // Preparar datos para envío a la API
  const preparePurchaseData = useCallback(() => {
    if (!validatePurchase()) {
      throw new Error('Hay errores en los datos del pedido');
    }

    return {
      supplierId: selectedSupplier.id,
      items: purchaseItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      totalAmount: calculations.total,
      notes: purchaseNotes,
      expectedDelivery: expectedDelivery || null,
      paymentTerms,
      deliveryMethod,
      purchaseDate: new Date().toISOString(),
      status: PURCHASE_STATES.PENDING
    };
  }, [
    selectedSupplier, 
    purchaseItems, 
    calculations.total, 
    purchaseNotes, 
    expectedDelivery, 
    paymentTerms, 
    deliveryMethod,
    validatePurchase
  ]);

  // Crear compra
  const createPurchase = useCallback(async () => {
    if (!validations.canProceed) {
      throw new Error('El pedido no está completo');
    }

    setSaving(true);
    try {
      const purchaseData = preparePurchaseData();
      const result = await purchaseService.createPurchase(purchaseData);
      
      if (result.success) {
        clearPurchase();
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [validations.canProceed, preparePurchaseData, clearPurchase]);

  // Obtener resumen del pedido
  const getPurchaseSummary = useCallback(() => {
    return {
      supplier: selectedSupplier,
      itemCount: calculations.uniqueProducts,
      totalQuantity: calculations.itemCount,
      subtotal: calculations.subtotal,
      tax: calculations.tax,
      deliveryCost: calculations.deliveryCost,
      total: calculations.total,
      expectedDelivery,
      paymentTerms,
      deliveryMethod: getDeliveryMethod(deliveryMethod),
      isValid: validations.canProceed
    };
  }, [
    selectedSupplier, 
    calculations, 
    expectedDelivery, 
    paymentTerms, 
    deliveryMethod, 
    validations.canProceed,
    getDeliveryMethod
  ]);

  // Cargar proveedor por ID (útil para edición)
  const loadSupplier = useCallback(async (supplierId) => {
    setLoading(true);
    try {
      const result = await supplierService.getSupplierById(supplierId);
      if (result.success) {
        setSelectedSupplier(result.data);
      }
      return result;
    } catch (error) {
      console.error('Error loading supplier:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado principal
    purchaseItems,
    selectedSupplier,
    purchaseNotes,
    expectedDelivery,
    paymentTerms,
    deliveryMethod,

    // Estado UI
    loading,
    saving,
    errors,

    // Cálculos
    ...calculations,

    // Validaciones
    validations,

    // Setters
    setSelectedSupplier,
    setPurchaseNotes,
    setExpectedDelivery,
    setPaymentTerms,
    setDeliveryMethod,

    // Acciones sobre items
    addPurchaseItem,
    updateItemQuantity,
    updateItemPrice,
    removeItem,
    clearPurchase,

    // Acciones principales
    createPurchase,
    validatePurchase,
    loadSupplier,

    // Utilidades
    preparePurchaseData,
    getPurchaseSummary,
    getDeliveryCost,

    // Constantes útiles
    TAX_RATE: PURCHASE_TAX_CONFIG.rate
  };
};

export default usePurchaseLogic;
