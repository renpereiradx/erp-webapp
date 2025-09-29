/**
 * Enhanced Purchase Service - Purchase Order Enhanced API Integration
 * Implements the enhanced purchase order system with auto-pricing and cost separation
 * Follows PURCHASE_API.md specification and MVP patterns
 */

import { apiClient } from './api';
import { telemetryService } from './telemetryService';
import {
  DEMO_PURCHASE_ORDERS_DATA,
  DEMO_TAX_RATES_DATA,
  getDemoPurchaseOrders,
  createDemoPurchaseOrder,
  getDemoTaxRates
} from '../config/mockData/purchases.js';
// TypeScript types are available in ../types/purchase.ts

// Configuración de timeouts y reintentos
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

// Utilidad para reintentos con backoff exponencial
const withRetry = async (fn, attempts = RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)));
    }
  }
};

class PurchaseService {
  // ============ ENHANCED PURCHASE ORDER OPERATIONS ============

  // Create enhanced purchase order with auto-pricing
  async createEnhancedPurchaseOrder(orderData) {
    const startTime = performance.now();
    try {
      const requestData = {
        supplier_id: parseInt(orderData.supplier_id),
        status: orderData.status || 'PENDING',
        order_details: orderData.order_details.map(item => ({
          product_id: String(item.product_id),
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          unit: String(item.unit || 'unit'),
          profit_pct: item.profit_pct !== null && item.profit_pct !== undefined ? parseFloat(item.profit_pct) : null,
          tax_rate_id: item.tax_rate_id !== null && item.tax_rate_id !== undefined && item.tax_rate_id !== '' ? parseInt(item.tax_rate_id) : null
        })),
        auto_update_prices: Boolean(orderData.auto_update_prices !== false),
        default_profit_margin: parseFloat(orderData.default_profit_margin || 30.0),
        payment_method_id: orderData.payment_method_id ? parseInt(orderData.payment_method_id) : null,
        currency_id: orderData.currency_id ? parseInt(orderData.currency_id) : null
      };

      const response = await apiClient.makeRequest('/purchase/complete', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      // Manejar diferentes formatos de respuesta del servidor
      let responseData, purchaseOrderId, message;

      if (response?.data) {
        // Formato: { data: { ... } }
        responseData = response.data;
        purchaseOrderId = response.data.purchase_order_id || response.data.id;
        message = response.data.message;
      } else if (response?.purchase_order_id || response?.id) {
        // Formato directo: { purchase_order_id: ..., message: ... }
        responseData = response;
        purchaseOrderId = response.purchase_order_id || response.id;
        message = response.message;
      } else {
        // Respuesta mínima o formato inesperado
        responseData = response;
        purchaseOrderId = null;
        message = 'Orden de compra creada exitosamente';
      }

      telemetryService.recordEvent('enhanced_purchase_order_created', {
        supplier_id: orderData.supplier_id,
        items_count: orderData.order_details?.length || 0,
        auto_pricing: requestData.auto_update_prices
      });

      return {
        success: true,
        data: responseData,
        purchase_order_id: purchaseOrderId,
        message: message
      };
    } catch (error) {
      console.error('Error en /purchase/complete:', error);
      telemetryService.recordEvent('enhanced_purchase_order_error', {
        error: error.message,
        status_code: error.response?.status
      });

      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al crear orden de compra'
      };
    } finally {
      telemetryService.recordMetric('create_enhanced_purchase_duration', performance.now() - startTime);
    }
  }

  // Get detailed analysis of purchase order
  async getPurchaseOrderAnalysis(purchaseOrderId) {
    try {
      const response = await apiClient.get(`/purchase-orders/${purchaseOrderId}/detailed-analysis`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching purchase order analysis:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener análisis de la orden'
      };
    }
  }

  // Validate purchase order integrity
  async validatePurchaseOrderIntegrity(purchaseOrderId) {
    try {
      const response = await apiClient.get(`/purchase-orders/${purchaseOrderId}/integrity-validation`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error validating purchase order integrity:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al validar integridad'
      };
    }
  }

  // Get unit costs for a product
  async getProductUnitCosts(productId, unit = null, limit = 10) {
    try {
      const params = new URLSearchParams();
      if (unit) params.append('unit', unit);
      params.append('limit', limit.toString());

      const response = await apiClient.get(`/products/${productId}/unit-costs?${params}`);
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Error fetching product unit costs:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener costos unitarios'
      };
    }
  }

  // Get unit prices for a product
  async getProductUnitPrices(productId, unit = null) {
    try {
      const params = unit ? `?unit=${encodeURIComponent(unit)}` : '';
      const response = await apiClient.get(`/products/${productId}/unit-prices${params}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching product unit prices:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al obtener precios unitarios'
      };
    }
  }

  // Calculate suggested price for a product
  async calculateSuggestedPrice(priceData) {
    try {
      const response = await apiClient.post('/products/calculate-suggested-price', priceData);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error calculating suggested price:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error al calcular precio sugerido'
      };
    }
  }

  // ============ CRUD OPERATIONS (MVP Style) ============
  
  // Crear nueva orden de compra
  async createPurchase(purchaseData) {
    const startTime = performance.now();
    try {
      // Validar datos antes del envío
      const validation = this.validatePurchaseData(purchaseData);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Datos inválidos: ' + validation.errors.join(', ')
        };
      }

      return await withRetry(async () => {
        // Preparar datos según la especificación del procedimiento (compatible con ambos formatos)
        const items = purchaseData.order_details || purchaseData.items;
        const requestData = {
          supplier_id: purchaseData.supplier_id || purchaseData.supplierId,
          status: purchaseData.status || 'PENDING',
          expected_delivery: purchaseData.expectedDelivery,
          notes: purchaseData.notes || '',
          purchase_items: items.map(item => ({
            product_id: item.product_id || item.productId,
            quantity: item.quantity,
            unit_price: item.unit_price || item.unitPrice,
            exp_date: item.expDate || null,
            tax_rate_id: item.tax_rate_id || item.taxRateId || null,
            profit_pct: item.profit_pct || item.profitPct || null
          }))
        };

        const response = await apiClient.post('/purchase/', requestData);

        if (response.data) {
          const items = purchaseData.order_details || purchaseData.items;
          telemetryService.recordMetric('purchase_order_created', 1, {
            supplier_id: purchaseData.supplier_id || purchaseData.supplierId,
            items_count: items.length
          });

          return {
            success: true,
            data: response.data,
            message: 'Orden de compra creada exitosamente',
            purchase_order_id: response.data.id || response.data.purchase_order_id
          };
        }
      });
    } catch (error) {
      console.warn('API unavailable, creating demo purchase order');
      telemetryService.recordMetric('purchase_demo_creation', 1);
      
      const items = purchaseData.order_details || purchaseData.items;
      return await createDemoPurchaseOrder({
        supplier_id: purchaseData.supplier_id || purchaseData.supplierId,
        supplier_name: purchaseData.supplierName || 'Proveedor Demo',
        total_amount: this.calculatePurchaseTotals(items).total,
        expected_delivery: purchaseData.expectedDelivery,
        notes: purchaseData.notes || ''
      });
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('create_purchase_duration', endTime - startTime);
    }
  }

  // Obtener compra por ID
  async getPurchaseById(id) {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const response = await apiClient.get(`/purchase/${id}`);
        return {
          success: true,
          data: response.data
        };
      });
    } catch (error) {
      console.warn(`API unavailable, searching demo purchase ${id}`);
      const purchase = DEMO_PURCHASE_ORDERS_DATA.find(p => p.id === parseInt(id));
      if (!purchase) {
        return {
          success: false,
          error: `Purchase order with ID ${id} not found`
        };
      }
      return {
        success: true,
        data: purchase
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_purchase_by_id_duration', endTime - startTime);
    }
  }

  // Cancelar compra
  async cancelPurchase(id, reason = '') {
    try {
      const response = await apiClient.put(`/purchase/cancel/${id}`, {
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString()
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Compra cancelada exitosamente'
      };
    } catch (error) {
      console.error('Error cancelling purchase:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al cancelar la compra'
      };
    }
  }

  // Obtener compras por proveedor ID (con datos enriquecidos y metadata parsing)
  async getPurchasesBySupplier(supplierId, options = {}) {
    try {
      console.log(`🔍 Fetching purchases for supplier ID: ${supplierId}`);
      const response = await apiClient.makeRequest(`/purchase/supplier_id/${supplierId}`);
      const data = Array.isArray(response) ? response : (response.data || []);

      console.log(`📊 Raw API response (${data.length} items):`, data.slice(0, 1)); // Log first item for debugging

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = this.processEnhancedPurchaseData(data, options);

      console.log(`✅ Processed enhanced data (${enrichedData.length} items):`, enrichedData.slice(0, 1)); // Log first processed item

      // Apply supplier status filter if specified
      let filteredData = enrichedData;
      if (options.showInactiveSuppliers === false) {
        filteredData = enrichedData.filter(orderData => {
          const supplierStatus = orderData.purchase?.supplier_status;
          return supplierStatus !== false; // Show only active suppliers (true or undefined)
        });
        console.log(`🔍 Filtered ${enrichedData.length} → ${filteredData.length} orders (active suppliers only)`);
      }

      return {
        success: true,
        data: filteredData
      };
    } catch (error) {
      console.error('❌ Error fetching purchases by supplier:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener compras del proveedor'
      };
    }
  }

  // Obtener orden de compra específica con validación de proveedor
  async getPurchaseOrderWithSupplierValidation(purchaseOrderId, supplierName) {
    try {
      const response = await apiClient.makeRequest(`/purchase/${purchaseOrderId}/supplier/${encodeURIComponent(supplierName)}`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching purchase order with supplier validation:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener orden de compra'
      };
    }
  }

  // Método helper para obtener compras de los últimos N días
  async getRecentPurchases(days = 30, page = 1, pageSize = 50, options = {}) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    return this.getPurchasesByDateRange(startDateStr, endDate, page, pageSize, options);
  }

  // Método helper para obtener compras del mes actual
  async getCurrentMonthPurchases(page = 1, pageSize = 50, options = {}) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    return this.getPurchasesByDateRange(startDate, endDate, page, pageSize, options);
  }

  // Obtener compras por nombre de proveedor (con datos enriquecidos y metadata parsing)
  async getPurchasesBySupplierName(supplierName, options = {}) {
    try {
      console.log(`🔍 Fetching purchases for supplier name: ${supplierName}`);
      const response = await apiClient.makeRequest(`/purchase/supplier_name/${encodeURIComponent(supplierName)}`);
      const data = Array.isArray(response) ? response : (response.data || []);

      console.log(`📊 Raw API response (${data.length} items):`, data.slice(0, 1)); // Log first item for debugging

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = this.processEnhancedPurchaseData(data, options);

      console.log(`✅ Processed enhanced data (${enrichedData.length} items):`, enrichedData.slice(0, 1)); // Log first processed item

      return {
        success: true,
        data: enrichedData
      };
    } catch (error) {
      console.error('❌ Error fetching purchases by supplier name:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al buscar compras del proveedor'
      };
    }
  }

  // Obtener compras por rango de fechas (con datos enriquecidos, metadata parsing y paginación)
  async getPurchasesByDateRange(startDate, endDate, page = 1, pageSize = 50, options = {}) {
    try {
      // Construir query parameters según la nueva especificación API
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        page: parseInt(page).toString(),
        page_size: parseInt(pageSize).toString()
      });

      const response = await apiClient.makeRequest(`/purchase/date_range/?${params.toString()}`);
      const data = Array.isArray(response) ? response : (response.data || []);

      // Process enhanced metadata for each purchase order with filter options
      const enrichedData = this.processEnhancedPurchaseData(data, options);

      return {
        success: true,
        data: enrichedData,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          hasMore: response.length === parseInt(pageSize)
        }
      };
    } catch (error) {
      console.error('Error fetching purchases by date range:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener compras por fecha'
      };
    }
  }

  // Obtener compras paginadas (MVP method)
  async getPurchasesPaginated(page = 1, pageSize = 20, filters = {}) {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        // Intentar varios endpoints posibles en orden de preferencia
        let response;
        const endpoints = [
          `/purchase/${page}/${pageSize}`,
          `/purchase-orders/${page}/${pageSize}`,
          `/purchase`
        ];

        for (const endpoint of endpoints) {
          try {
            console.log(`Probando endpoint: ${endpoint}`);
            response = await apiClient.makeRequest(endpoint);
            console.log(`✅ Endpoint funcionó: ${endpoint}`, response);
            break;
          } catch (error) {
            console.warn(`❌ Endpoint falló: ${endpoint}`, error.message);
            continue;
          }
        }

        if (!response) {
          throw new Error('Ningún endpoint de purchase orders funcionó');
        }

        // Normalizar la respuesta según el formato
        let normalizedData;
        if (Array.isArray(response)) {
          // Si es un array directo, paginar manualmente
          const startIndex = (page - 1) * pageSize;
          const endIndex = startIndex + pageSize;
          normalizedData = response.slice(startIndex, endIndex);
        } else if (response.data && Array.isArray(response.data)) {
          normalizedData = response.data;
        } else {
          normalizedData = response;
        }

        telemetryService.recordMetric('purchases_fetched', normalizedData?.length || 0);
        return {
          success: true,
          data: normalizedData || []
        };
      });
    } catch (error) {
      console.error('Error obteniendo purchase orders:', error);
      telemetryService.recordEvent('purchases_fetch_error', {
        error: error.message
      });
      return {
        success: false,
        error: error.message || 'Error al obtener órdenes de compra',
        data: []
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_purchases_paginated_duration', endTime - startTime);
    }
  }

  // Buscar compras (método helper combinado)
  async searchPurchases(searchTerm, searchType = 'supplier') {
    try {
      let result;
      
      switch (searchType) {
        case 'supplier':
          result = await this.getPurchasesBySupplierName(searchTerm);
          break;
        case 'id':
          result = await this.getPurchaseById(searchTerm);
          // Convertir a array para consistencia
          if (result.success && result.data) {
            result.data = [result.data];
          }
          break;
        default:
          throw new Error('Tipo de búsqueda no válido');
      }

      return result;
    } catch (error) {
      console.error('Error searching purchases:', error);
      return {
        success: false,
        error: 'Error en la búsqueda de compras'
      };
    }
  }

  // Validar datos de compra antes del envío (compatible con ambos formatos)
  validatePurchaseData(purchaseData) {
    const errors = [];

    // Validar supplier_id (nuevo formato) o supplierId (formato anterior)
    if (!purchaseData.supplier_id && !purchaseData.supplierId) {
      errors.push('Debe seleccionar un proveedor');
    }

    // Validar order_details (nuevo formato) o items (formato anterior)
    const items = purchaseData.order_details || purchaseData.items;
    if (!items || items.length === 0) {
      errors.push('Debe agregar al menos un producto');
    }

    if (items) {
      items.forEach((item, index) => {
        // Validar product_id (nuevo) o productId (anterior)
        if (!item.product_id && !item.productId) {
          errors.push(`Producto ${index + 1}: ID requerido`);
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Producto ${index + 1}: Cantidad debe ser mayor a 0`);
        }
        // Validar unit_price (nuevo) o unitPrice (anterior)
        const price = item.unit_price || item.unitPrice;
        if (!price || price <= 0) {
          errors.push(`Producto ${index + 1}: Precio debe ser mayor a 0`);
        }
        // Validación de fecha de expiración si está presente
        if (item.expDate && new Date(item.expDate) <= new Date()) {
          errors.push(`Producto ${index + 1}: Fecha de expiración debe ser futura`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Obtener tasas de impuestos disponibles
  async getTaxRates(start = 1, limit = 10) {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        const response = await apiClient.makeRequest(`/tax_rate/${start}/${limit}`);
        return {
          success: true,
          data: Array.isArray(response) ? response : (response.data || [])
        };
      });
    } catch (error) {
      console.warn('API unavailable, using demo tax rates');
      return await getDemoTaxRates();
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_tax_rates_duration', endTime - startTime);
    }
  }

  // Obtener detalles de una orden de compra específica
  async getPurchaseOrderDetails(purchaseOrderId) {
    try {
      const response = await apiClient.get(`/purchase/${purchaseOrderId}/details`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching purchase order details:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener detalles de la orden'
      };
    }
  }

  // Actualizar estado de orden de compra
  async updatePurchaseOrderStatus(purchaseOrderId, newStatus, notes = '') {
    try {
      const response = await apiClient.put(`/purchase/${purchaseOrderId}/status`, {
        status: newStatus,
        notes,
        updated_at: new Date().toISOString()
      });
      
      return {
        success: true,
        data: response.data,
        message: `Estado actualizado a ${newStatus}`
      };
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al actualizar estado'
      };
    }
  }

  // Recibir productos de orden de compra (actualizar inventario)
  async receivePurchaseOrder(purchaseOrderId, receivedItems) {
    try {
      const response = await apiClient.post(`/purchase/${purchaseOrderId}/receive`, {
        received_items: receivedItems.map(item => ({
          product_id: item.productId,
          quantity_received: item.quantityReceived,
          exp_date: item.expDate,
          received_at: new Date().toISOString()
        }))
      });
      
      return {
        success: true,
        data: response.data,
        message: 'Productos recibidos correctamente'
      };
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al recibir productos'
      };
    }
  }

  // Obtener registros de compras paginados
  async getPurchaseRecords(page = 1, limit = 5) {
    const startTime = performance.now();
    try {
      return await withRetry(async () => {
        // Usar directamente el método del businessAPI
        const response = await apiClient.getInventories(page, limit);
        return {
          success: true,
          data: {
            records: response.data || response,
            total: response.total || (Array.isArray(response) ? response.length : 0)
          },
          pagination: {
            page,
            limit,
            total: response.total || (Array.isArray(response) ? response.length : 0),
            totalPages: Math.ceil((response.total || (Array.isArray(response) ? response.length : 0)) / limit)
          }
        };
      });
    } catch (error) {
      console.warn('API unavailable, using demo records');
      // Fallback to demo data
      const demoRecords = [
        {
          id: 1,
          product_name: 'Producto Demo 1',
          quantity: 10,
          unit_price: 25.50,
          total: 255.00,
          date: new Date().toISOString().split('T')[0],
          supplier: 'Proveedor Demo',
          category: 'Alimentos'
        },
        {
          id: 2,
          product_name: 'Producto Demo 2',
          quantity: 5,
          unit_price: 45.00,
          total: 225.00,
          date: new Date().toISOString().split('T')[0],
          supplier: 'Proveedor Demo 2',
          category: 'Bebidas'
        },
        {
          id: 3,
          product_name: 'Producto Demo 3',
          quantity: 8,
          unit_price: 12.75,
          total: 102.00,
          date: new Date().toISOString().split('T')[0],
          supplier: 'Proveedor Demo 3',
          category: 'Limpieza'
        }
      ];

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRecords = demoRecords.slice(startIndex, endIndex);

      telemetryService.recordMetric('purchase_records_demo_fallback', 1);
      return {
        success: true,
        data: {
          records: paginatedRecords,
          total: demoRecords.length
        },
        pagination: {
          page,
          limit,
          total: demoRecords.length,
          totalPages: Math.ceil(demoRecords.length / limit)
        }
      };
    } finally {
      const endTime = performance.now();
      telemetryService.recordMetric('get_purchase_records_duration', endTime - startTime);
    }
  }

  // Procesar datos enriquecidos con parsing de metadata (según PURCHASE_API.md)
  processEnhancedPurchaseData(purchaseOrders, filterOptions = {}) {
    if (!Array.isArray(purchaseOrders)) {
      return purchaseOrders;
    }

    let processedData = purchaseOrders.map(orderData => {
      // Si ya tiene la estructura procesada, devolverla tal como está
      if (orderData.purchase && orderData.details) {
        // Procesar metadata en los detalles si están disponibles
        const enhancedDetails = this.processDetailsMetadata(orderData.details);

        // Asegurar que el purchase incluye supplier_status si está disponible
        const enhancedPurchase = {
          ...orderData.purchase,
          // Manejar supplier_status si viene en la respuesta
          supplier_status: orderData.purchase.supplier_status !== undefined
            ? orderData.purchase.supplier_status
            : true // default fallback
        };

        return {
          purchase: enhancedPurchase,
          details: enhancedDetails
        };
      }

      // Si es formato legacy, procesarlo
      return orderData;
    });

    // Aplicar filtro de estado de proveedor si se especifica
    if (filterOptions.showInactiveSuppliers === false) {
      processedData = processedData.filter(orderData => {
        const supplierStatus = orderData.purchase?.supplier_status;
        return supplierStatus !== false; // Mostrar solo activos (true o undefined)
      });
    }

    return processedData;
  }

  // Procesar metadata de detalles de compra según la nueva especificación
  processDetailsMetadata(details) {
    if (!Array.isArray(details)) {
      return details;
    }

    return details.map(detail => {
      let processedDetail = { ...detail };

      // Parse metadata JSON si está disponible
      if (detail.metadata) {
        try {
          const metadata = typeof detail.metadata === 'string'
            ? JSON.parse(detail.metadata)
            : detail.metadata;

          // Agregar campos del metadata según la documentación API mejorada
          processedDetail = {
            ...processedDetail,
            unit: metadata.unit || detail.unit || 'unit',
            tax_rate: parseFloat(metadata.tax_rate || detail.tax_rate || 0),
            profit_pct: parseFloat(metadata.profit_pct || detail.profit_pct || 30),
            line_total: parseFloat(metadata.line_total || detail.line_total || (detail.quantity * detail.unit_price)),
            // Calcular precio de venta dinámicamente según la documentación
            sale_price: this.calculateSalePrice(detail.unit_price, metadata.profit_pct || detail.profit_pct),
            metadata: metadata
          };
        } catch (error) {
          console.warn('Error parsing metadata for detail:', detail.id, error);
          // Fallback con valores por defecto si el parsing falla
          processedDetail = {
            ...processedDetail,
            unit: detail.unit || 'unit',
            tax_rate: detail.tax_rate || 0,
            profit_pct: detail.profit_pct || 30,
            line_total: detail.line_total || (detail.quantity * detail.unit_price),
            sale_price: this.calculateSalePrice(detail.unit_price, 30)
          };
        }
      } else {
        // Si no hay metadata, agregar campos con valores por defecto
        processedDetail = {
          ...processedDetail,
          unit: detail.unit || 'unit',
          tax_rate: parseFloat(detail.tax_rate || 0),
          profit_pct: parseFloat(detail.profit_pct || 30),
          line_total: parseFloat(detail.line_total || (detail.quantity * detail.unit_price)),
          sale_price: this.calculateSalePrice(detail.unit_price, detail.profit_pct || 30)
        };
      }

      return processedDetail;
    });
  }

  // Calcular precio de venta según la especificación (precio ya incluye IVA)
  calculateSalePrice(unitPrice, profitPct) {
    if (!unitPrice || unitPrice <= 0) return 0;

    const margin = profitPct && profitPct > 0 ? profitPct : 30; // Default 30%
    return Number((unitPrice * (1 + margin / 100)).toFixed(2));
  }

  // Calcular totales de compra (compatible con ambos formatos)
  calculatePurchaseTotals(items, taxRate = 0) {
    const subtotal = items.reduce((sum, item) => {
      const price = item.unit_price || item.unitPrice || 0;
      return sum + (item.quantity * price);
    }, 0);

    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  // ============ NUEVOS ENDPOINTS DE CANCELACIÓN ============

  // Vista previa de cancelación de orden
  async previewPurchaseOrderCancellation(purchaseOrderId) {
    try {
      const response = await apiClient.makeRequest(`/purchase/${purchaseOrderId}/preview-cancellation`);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error previewing purchase order cancellation:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al obtener vista previa de cancelación'
      };
    }
  }

  // Cancelar orden de compra definitivamente
  async cancelPurchaseOrderWithDetails(cancellationRequest) {
    try {
      const response = await apiClient.makeRequest('/purchase/cancel', {
        method: 'POST',
        body: JSON.stringify(cancellationRequest)
      });
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al cancelar orden de compra'
      };
    }
  }

  // ============ NUEVOS ENDPOINTS DE CONSULTA ============

  // Obtener orden específica con validación de proveedor
  async getPurchaseOrderByIdWithSupplierValidation(orderId, supplierName) {
    try {
      const response = await apiClient.makeRequest(`/purchase/${orderId}/supplier/${encodeURIComponent(supplierName)}`);

      // Procesar datos enriquecidos
      const enrichedData = this.processOrderWithSupplierValidation(response);

      return {
        success: true,
        data: enrichedData
      };
    } catch (error) {
      console.error('Error fetching purchase order with supplier validation:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener orden de compra'
      };
    }
  }

  // Helper para procesar datos de orden con validación de proveedor
  processOrderWithSupplierValidation(orderData) {
    if (!orderData || !orderData.purchase || !orderData.details) {
      return orderData;
    }

    // Asegurar que supplier_status esté disponible
    const enhancedPurchase = {
      ...orderData.purchase,
      supplier_status: orderData.purchase.supplier_status !== undefined
        ? orderData.purchase.supplier_status
        : true // default fallback
    };

    // Procesar detalles con metadata
    const enhancedDetails = this.processDetailsMetadata(orderData.details);

    return {
      purchase: enhancedPurchase,
      details: enhancedDetails
    };
  }
}

// Crear instancia única del servicio
const purchaseService = new PurchaseService();

export { purchaseService };
export default purchaseService;

// TypeScript types are exported from ../types/purchase.ts
