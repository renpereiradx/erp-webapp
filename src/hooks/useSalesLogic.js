/**
 * Custom hook para manejo de lógica de ventas
 * Centraliza toda la lógica de cálculos, validaciones y operaciones de venta
 * Separa la lógica de negocio de la UI
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const TAX_RATE = 0.16; // IVA 16%

// Plantillas base para justificaciones de cambio de precio
export const PRICE_CHANGE_REASONS = [
  // ========== DESCUENTOS ==========
  {
    id: 'bulk_discount',
    label: '🔻 Descuento por volumen',
    description: 'Descuento aplicado por compra de grandes cantidades',
    requiresAuth: false,
    type: 'discount'
  },
  {
    id: 'loyalty_discount',
    label: '🔻 Descuento por fidelidad',
    description: 'Descuento especial para cliente frecuente',
    requiresAuth: false,
    type: 'discount'
  },
  {
    id: 'promotional_offer',
    label: '🔻 Oferta promocional',
    description: 'Descuento por campaña promocional activa',
    requiresAuth: false,
    type: 'discount'
  },
  {
    id: 'damaged_product',
    label: '🔻 Producto con daño menor',
    description: 'Descuento por imperfecciones cosméticas que no afectan funcionalidad',
    requiresAuth: true,
    type: 'discount'
  },
  {
    id: 'clearance_sale',
    label: '🔻 Liquidación de inventario',
    description: 'Precio reducido para acelerar rotación de stock',
    requiresAuth: true,
    type: 'discount'
  },
  {
    id: 'price_match',
    label: '🔻 Igualación de precio',
    description: 'Precio ajustado para igualar oferta de competencia',
    requiresAuth: true,
    type: 'discount'
  },
  {
    id: 'manager_approval',
    label: '🔻 Autorización gerencial',
    description: 'Descuento especial autorizado por gerencia',
    requiresAuth: true,
    type: 'discount'
  },
  {
    id: 'customer_service',
    label: '🔻 Compensación al cliente',
    description: 'Descuento como gesto de buena voluntad por inconvenientes',
    requiresAuth: true,
    type: 'discount'
  },
  // ========== AUMENTOS DE PRECIO ==========
  {
    id: 'tournament_price',
    label: '🔺 Precio de torneo/evento',
    description: 'Precio especial para torneos y eventos deportivos',
    requiresAuth: false,
    type: 'increase'
  },
  {
    id: 'peak_hours',
    label: '🔺 Tarifa por hora pico',
    description: 'Precio aumentado durante horarios de alta demanda',
    requiresAuth: false,
    type: 'increase'
  },
  {
    id: 'special_event',
    label: '🔺 Evento especial',
    description: 'Precio especial para eventos corporativos o especiales',
    requiresAuth: false,
    type: 'increase'
  },
  {
    id: 'holiday_surcharge',
    label: '🔺 Recargo por feriado',
    description: 'Precio aumentado para días festivos',
    requiresAuth: false,
    type: 'increase'
  },
  {
    id: 'premium_service',
    label: '🔺 Servicio premium',
    description: 'Precio mayor por servicio o atención premium',
    requiresAuth: true,
    type: 'increase'
  },
  {
    id: 'express_service',
    label: '🔺 Servicio express',
    description: 'Recargo por atención prioritaria o urgente',
    requiresAuth: true,
    type: 'increase'
  }
];

export const useSalesLogic = () => {
  const [saleItems, setSaleItems] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedReserve, setSelectedReserve] = useState(null); // NUEVO: manejo de reservas

  // Cálculos de totales - memoizados para optimización
  // Los precios ya incluyen IVA, solo mostramos el total
  const calculations = useMemo(() => {
    const total = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      subtotal: Number(total.toFixed(2)), // Para UI simplificada, subtotal = total
      tax: 0, // No mostramos IVA en punto de venta
      total: Number(total.toFixed(2)),
      itemCount: saleItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [saleItems]);

  // Agregar producto al carrito
  const addSaleItem = useCallback((product, quantity = 1) => {
    if (!product || quantity <= 0) return;

    setSaleItems(prevItems => {
      const productId = product.product_id || product.id;
      const existingItem = prevItems.find(item => (item.product_id || item.id) === productId);

      if (existingItem) {
        return prevItems.map(item =>
          (item.product_id || item.id) === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Normalizar producto para el carrito - convertir objetos a strings
        const extractedPrice = product.price ||
                              product.unit_prices?.[0]?.price_per_unit ||
                              product.unit_prices?.[0]?.price ||
                              product.unit_prices?.[0]?.selling_price ||
                              product.unit_prices?.[0]?.base_price ||
                              0;

        const normalizedProduct = {
          id: product.product_id || product.id,
          product_id: product.product_id || product.id,
          name: product.product_name || product.name,
          product_name: product.product_name || product.name,
          originalPrice: product.originalPrice || extractedPrice, // Usar originalPrice del producto si existe
          price: product.price || extractedPrice, // Usar price del producto si existe
          category: product.category ? String(product.category?.name || product.category) : '',
          quantity,
          // Mantener campos necesarios para la venta
          stock_quantity: product.stock_quantity,
          product_type: product.product_type,
          state: product.state,
          // Campos para manejo de descuentos según SALE_WITH_DISCOUNT_API.md
          discountPercentage: 0,
          discountAmount: 0,
          hasDiscount: false,
          priceChangeReason: null,
          priceChangeJustification: '',
          priceChangeAuthorizedBy: null,
          // NUEVOS campos para API de descuentos
          discount_amount: null, // Descuento en valor absoluto
          discount_percent: null, // Descuento en porcentaje (0-100)
          discount_reason: null, // Razón del descuento (OBLIGATORIO si hay descuento)
          sale_price: null, // Precio modificado
          // PRESERVAR PROPIEDADES ESPECIALES DE RESERVA SOLAMENTE
          fromReservation: product.fromReservation || false,
          reservation_id: product.reservation_id || null,
          reservation_date: product.reservation_date || null,
          start_time: product.start_time || null,
          end_time: product.end_time || null
        };
        return [...prevItems, normalizedProduct];
      }
    });
  }, []);

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback((itemId, change) => {
    setSaleItems(prevItems =>
      prevItems.map(item => {
        if ((item.product_id || item.id) === itemId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean)
    );
  }, []);

  // Establecer cantidad específica
  const setItemQuantity = useCallback((itemId, quantity) => {
    if (quantity < 0) return;

    setSaleItems(prevItems =>
      prevItems.map(item => {
        if ((item.product_id || item.id) === itemId) {
          return quantity === 0 ? null : { ...item, quantity };
        }
        return item;
      }).filter(Boolean)
    );
  }, []);

  // Remover producto del carrito
  const removeItem = useCallback((itemId) => {
    setSaleItems(prevItems => prevItems.filter(item => (item.product_id || item.id) !== itemId));
  }, []);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setSaleItems([]);
  }, []);

  // Aplicar descuento por porcentaje según SALE_WITH_DISCOUNT_API.md
  const applyPercentageDiscount = useCallback((itemId, percentage, reason, justification, authorizedBy = null) => {
    if (percentage < 0 || percentage > 100) return;

    setSaleItems(prevItems =>
      prevItems.map(item => {
        if ((item.product_id || item.id) === itemId) {
          const discountAmount = (item.originalPrice * percentage) / 100;
          const newPrice = item.originalPrice - discountAmount;

          return {
            ...item,
            price: Number(newPrice.toFixed(2)),
            discountPercentage: percentage,
            discountAmount: Number(discountAmount.toFixed(2)),
            hasDiscount: percentage > 0,
            priceChangeReason: reason,
            priceChangeJustification: justification,
            priceChangeAuthorizedBy: authorizedBy,
            // NUEVOS campos para API
            discount_percent: percentage > 0 ? percentage : null,
            discount_amount: null, // No mezclar tipos de descuento
            discount_reason: percentage > 0 ? justification : null,
            sale_price: null // No modificamos precio directo
          };
        }
        return item;
      })
    );
  }, []);

  // Aplicar descuento por monto fijo según SALE_WITH_DISCOUNT_API.md
  const applyFixedDiscount = useCallback((itemId, amount, reason, justification, authorizedBy = null) => {
    if (amount < 0) return;

    setSaleItems(prevItems =>
      prevItems.map(item => {
        if ((item.product_id || item.id) === itemId) {
          const maxDiscount = item.originalPrice;
          const discountAmount = Math.min(amount, maxDiscount);
          const newPrice = item.originalPrice - discountAmount;
          const percentage = (discountAmount / item.originalPrice) * 100;

          return {
            ...item,
            price: Number(newPrice.toFixed(2)),
            discountPercentage: Number(percentage.toFixed(2)),
            discountAmount: Number(discountAmount.toFixed(2)),
            hasDiscount: discountAmount > 0,
            priceChangeReason: reason,
            priceChangeJustification: justification,
            priceChangeAuthorizedBy: authorizedBy,
            // NUEVOS campos para API
            discount_amount: discountAmount > 0 ? discountAmount : null,
            discount_percent: null, // No mezclar tipos de descuento
            discount_reason: discountAmount > 0 ? justification : null,
            sale_price: null // No modificamos precio directo
          };
        }
        return item;
      })
    );
  }, []);

  // Establecer precio directo (con justificación) - Soporta AUMENTOS Y DESCUENTOS
  const setDirectPrice = useCallback((itemId, newPrice, reason, justification, authorizedBy = null) => {
    if (newPrice < 0) return;

    setSaleItems(prevItems =>
      prevItems.map(item => {
        if ((item.product_id || item.id) === itemId) {
          const priceChange = item.originalPrice - newPrice;
          const isPriceIncrease = newPrice > item.originalPrice;
          const isDiscount = newPrice < item.originalPrice;

          // Calcular el cambio como valor absoluto para el porcentaje
          const absoluteChange = Math.abs(priceChange);
          const percentage = absoluteChange > 0 ? (absoluteChange / item.originalPrice) * 100 : 0;

          return {
            ...item,
            price: Number(newPrice.toFixed(2)),
            discountPercentage: isDiscount ? Number(percentage.toFixed(2)) : 0,
            discountAmount: isDiscount ? Number(absoluteChange.toFixed(2)) : 0,
            // Nuevos campos para aumentos de precio
            priceIncrease: isPriceIncrease ? Number(absoluteChange.toFixed(2)) : 0,
            priceIncreasePercentage: isPriceIncrease ? Number(percentage.toFixed(2)) : 0,
            hasDiscount: isDiscount && Math.abs(priceChange) > 0.01,
            hasPriceIncrease: isPriceIncrease && Math.abs(priceChange) > 0.01,
            isPriceModified: Math.abs(newPrice - item.originalPrice) > 0.01,
            priceChangeReason: reason,
            priceChangeJustification: justification,
            priceChangeAuthorizedBy: authorizedBy,
            // NUEVOS campos para API - precio directo
            sale_price: Math.abs(newPrice - item.originalPrice) > 0.01 ? newPrice : null,
            price_change_reason: Math.abs(newPrice - item.originalPrice) > 0.01 ? justification : null,
            discount_amount: null, // No mezclamos con descuentos
            discount_percent: null,
            discount_reason: null
          };
        }
        return item;
      })
    );
  }, []);

  // Remover descuento según SALE_WITH_DISCOUNT_API.md
  const removeDiscount = useCallback((itemId) => {
    setSaleItems(prevItems =>
      prevItems.map(item => {
        if ((item.product_id || item.id) === itemId) {
          return {
            ...item,
            price: item.originalPrice,
            discountPercentage: 0,
            discountAmount: 0,
            hasDiscount: false,
            priceChangeReason: null,
            priceChangeJustification: '',
            priceChangeAuthorizedBy: null,
            // NUEVOS campos para API - limpiar todos
            discount_amount: null,
            discount_percent: null,
            discount_reason: null,
            sale_price: null,
            price_change_reason: null
          };
        }
        return item;
      })
    );
  }, []);

  // Validaciones
  const validations = useMemo(() => ({
    hasItems: saleItems.length > 0,
    hasClient: Boolean(selectedClient),
    canProceed: saleItems.length > 0 && Boolean(selectedClient),
    hasValidQuantities: saleItems.every(item => item.quantity > 0),
  }), [saleItems, selectedClient]);

  // Preparar datos para envío según SALE_WITH_DISCOUNT_API.md
  const prepareSaleData = useCallback(() => {
    if (!validations.canProceed) {
      throw new Error('Faltan datos requeridos para completar la venta');
    }

    const clientId = selectedClient ? selectedClient : null;

    // Ahora que el backend arregló JSONB, enviamos todos los productos directamente
    const allItems = saleItems;

    // Detectar si hay modificaciones de precio (aumentos o descuentos)
    const hasAnyPriceModifications = allItems.some(item =>
      item.isPriceModified ||
      item.sale_price ||
      item.hasPriceIncrease ||
      item.hasDiscount
    );

    const saleData = {
      client_id: clientId,
      // ⚡ CRÍTICO: Habilitar modificaciones de precio si hay cambios
      allow_price_modifications: hasAnyPriceModifications,
      product_details: allItems.map(item => {
        const productDetail = {
          product_id: item.product_id || item.id,
          quantity: item.quantity
        };

        // Información adicional para productos de reserva (opcional)
        if (item.fromReservation) {
          productDetail.from_reservation = true;
          productDetail.reservation_id = item.reservation_id;
        }

        // Solo agregar campos opcionales si tienen valores válidos
        if (item.tax_rate_id) {
          productDetail.tax_rate_id = item.tax_rate_id;
        }

        // MODIFICACIÓN DE PRECIOS (requiere allow_price_modifications = true)
        // Soporta tanto AUMENTOS como DESCUENTOS
        if (item.sale_price && Math.abs(item.sale_price - item.originalPrice) > 0.01) {
          productDetail.sale_price = item.sale_price;
        }
        if (item.price_change_reason) {
          productDetail.price_change_reason = item.price_change_reason;
        }

        // PRECIO ESPECIAL PARA PRODUCTOS DE RESERVA
        if (item.fromReservation) {
          // Siempre enviar el precio de la reserva como sale_price para evitar conflictos
          productDetail.sale_price = item.price;
          productDetail.price_change_reason = `Precio de reserva confirmada #${item.reservation_id} - Tarifa especial aplicada según reserva`;

        }

        // DESCUENTOS (NUEVO) - Solo incluir si tienen valores
        if (item.discount_amount && item.discount_amount > 0) {
          productDetail.discount_amount = item.discount_amount;
        }
        if (item.discount_percent && item.discount_percent > 0) {
          productDetail.discount_percent = item.discount_percent;
        }
        if (item.discount_reason && (item.discount_amount > 0 || item.discount_percent > 0)) {
          productDetail.discount_reason = item.discount_reason;
        }

        return productDetail;
      }),
      payment_method_id: 1, // Default: Efectivo
      currency_id: 1, // Default: Guaraníes
      allow_price_modifications: true // Necesario para cambios de precio y descuentos
    };

    // Solo agregar reserve_id si existe
    if (selectedReserve?.id) {
      saleData.reserve_id = selectedReserve.id;
    }

    return saleData;
  }, [selectedClient, selectedReserve, saleItems, validations.canProceed]);

  // Reset completo del estado
  const resetSale = useCallback(() => {
    setSaleItems([]);
    setSelectedClient('');
    setSelectedReserve(null); // NUEVO: resetear reserva
  }, []);

  return {
    // Estado
    saleItems,
    selectedClient,
    selectedReserve, // NUEVO: estado de reserva

    // Cálculos
    ...calculations,

    // Acciones
    addSaleItem,
    updateQuantity,
    setItemQuantity,
    removeItem,
    clearCart,
    setSelectedClient,
    setSelectedReserve, // NUEVO: función para seleccionar reserva
    resetSale,

    // Funciones de descuento
    applyPercentageDiscount,
    applyFixedDiscount,
    setDirectPrice,
    removeDiscount,

    // Utilidades
    validations,
    prepareSaleData,

    // Constantes
    TAX_RATE
  };
};

export default useSalesLogic;
