/**
 * Custom hook para manejo de lógica de ventas
 * Centraliza toda la lógica de cálculos, validaciones y operaciones de venta
 * Separa la lógica de negocio de la UI
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const TAX_RATE = 0.16; // IVA 16%

export const useSalesLogic = () => {
  const [saleItems, setSaleItems] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');

  // Cálculos de totales - memoizados para optimización
  const calculations = useMemo(() => {
    const subtotal = saleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      itemCount: saleItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [saleItems]);

  // Agregar producto al carrito
  const addSaleItem = useCallback((product, quantity = 1) => {
    if (!product || quantity <= 0) return;

    setSaleItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });
  }, []);

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback((itemId, change) => {
    setSaleItems(prevItems => 
      prevItems.map(item => {
        if (item.id === itemId) {
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
        if (item.id === itemId) {
          return quantity === 0 ? null : { ...item, quantity };
        }
        return item;
      }).filter(Boolean)
    );
  }, []);

  // Remover producto del carrito
  const removeItem = useCallback((itemId) => {
    setSaleItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setSaleItems([]);
  }, []);

  // Validaciones
  const validations = useMemo(() => ({
    hasItems: saleItems.length > 0,
    hasClient: Boolean(selectedClient),
    canProceed: saleItems.length > 0 && Boolean(selectedClient),
    hasValidQuantities: saleItems.every(item => item.quantity > 0),
  }), [saleItems, selectedClient]);

  // Preparar datos para envío
  const prepareSaleData = useCallback(() => {
    if (!validations.canProceed) {
      throw new Error('Faltan datos requeridos para completar la venta');
    }

    return {
      clientId: selectedClient,
      items: saleItems.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })),
      summary: {
        subtotal: calculations.subtotal,
        tax: calculations.tax,
        total: calculations.total,
        itemCount: calculations.itemCount
      },
      metadata: {
        timestamp: new Date().toISOString(),
        taxRate: TAX_RATE
      }
    };
  }, [selectedClient, saleItems, calculations, validations.canProceed]);

  // Reset completo del estado
  const resetSale = useCallback(() => {
    setSaleItems([]);
    setSelectedClient('');
  }, []);

  return {
    // Estado
    saleItems,
    selectedClient,
    
    // Cálculos
    ...calculations,
    
    // Acciones
    addSaleItem,
    updateQuantity,
    setItemQuantity,
    removeItem,
    clearCart,
    setSelectedClient,
    resetSale,
    
    // Utilidades
    validations,
    prepareSaleData,
    
    // Constantes
    TAX_RATE
  };
};

export default useSalesLogic;
