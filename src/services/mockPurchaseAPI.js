/**
 * Mock Purchase API - Sistema Mock Robusto
 * Wave 1: Arquitectura Base Sólida
 * Desarrollo 100% independiente del backend con datos realistas
 */

import { telemetry } from '@/utils/telemetry';
import { PURCHASE_STATUS, PAYMENT_STATUS, PURCHASE_ERROR_CODES } from '@/types/purchaseTypes';

/**
 * Datos mock realistas para desarrollo
 */
const MOCK_SUPPLIERS = [
  { id: 1, name: 'Proveedor Alpha S.A.', email: 'ventas@alpha.com', active: true },
  { id: 2, name: 'Beta Distribuciones', email: 'compras@beta.com', active: true },
  { id: 3, name: 'Gamma Solutions', email: 'info@gamma.com', active: true },
  { id: 4, name: 'Delta Trading', email: 'pedidos@delta.com', active: false }
];

const MOCK_PRODUCTS = [
  { id: 'PROD001', name: 'Laptop HP EliteBook', unit_price: 1250.00, category: 'Electronics' },
  { id: 'PROD002', name: 'Monitor Dell 27"', unit_price: 350.00, category: 'Electronics' },
  { id: 'PROD003', name: 'Teclado Mecánico', unit_price: 85.00, category: 'Accessories' },
  { id: 'PROD004', name: 'Mouse Inalámbrico', unit_price: 45.00, category: 'Accessories' },
  { id: 'PROD005', name: 'Silla Ergonómica', unit_price: 280.00, category: 'Furniture' }
];

const MOCK_PAYMENT_METHODS = [
  { id: 1, name: 'Transferencia Bancaria', active: true },
  { id: 2, name: 'Cheque', active: true },
  { id: 3, name: 'Efectivo', active: true },
  { id: 4, name: 'Tarjeta de Crédito', active: false }
];

const MOCK_CURRENCIES = [
  { id: 1, code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  { id: 2, code: 'EUR', name: 'Euro', symbol: '€' },
  { id: 3, code: 'COP', name: 'Peso Colombiano', symbol: '$' }
];

// Almacenamiento mock en memoria
let mockPurchaseOrders = [];
let mockPayments = [];
let nextPurchaseId = 1;
let nextPaymentId = 1;

/**
 * Utilidades para generar datos mock
 */
const MockUtils = {
  /**
   * Simular delay de red
   */
  async delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Simular fallos aleatorios para testing
   */
  shouldSimulateError(errorRate = 0.05) {
    return Math.random() < errorRate;
  },

  /**
   * Generar ID único
   */
  generateId() {
    return `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Formatear fecha ISO
   */
  formatDate(date = new Date()) {
    return date.toISOString();
  },

  /**
   * Calcular total de compra
   */
  calculateTotal(productDetails) {
    return productDetails.reduce((total, item) => {
      const subtotal = item.quantity * item.unit_price;
      const taxRate = 0.19; // 19% tax rate por defecto
      const tax = subtotal * taxRate;
      return total + subtotal + tax;
    }, 0);
  },

  /**
   * Validar supplier existe
   */
  validateSupplier(supplierId) {
    const supplier = MOCK_SUPPLIERS.find(s => s.id === supplierId && s.active);
    return {
      isValid: !!supplier,
      supplier,
      error: supplier ? null : 'Supplier not found or inactive'
    };
  },

  /**
   * Validar products existen
   */
  validateProducts(productDetails) {
    const errors = [];
    const validProducts = [];

    productDetails.forEach((item, index) => {
      const product = MOCK_PRODUCTS.find(p => p.id === item.product_id);
      if (!product) {
        errors.push(`Product ${item.product_id} not found (item ${index + 1})`);
      } else {
        validProducts.push({ ...item, product_name: product.name });
      }
    });

    return {
      isValid: errors.length === 0,
      validProducts,
      errors
    };
  }
};

/**
 * Mock API Service
 */
class MockPurchaseAPI {
  constructor() {
    this.errorRate = 0.02; // 2% error rate para testing
    this.delayMs = 200; // Delay base para simular red
  }

  /**
   * 1. Crear Orden de Compra Mejorada
   */
  async createEnhancedPurchase(purchaseData) {
    await MockUtils.delay(this.delayMs);
    telemetry.increment('purchase.mock.create_enhanced_start');

    // Simular errores aleatorios
    if (MockUtils.shouldSimulateError(this.errorRate)) {
      telemetry.increment('purchase.mock.create_enhanced_error');
      return {
        success: false,
        error: 'Simulated network error',
        error_code: PURCHASE_ERROR_CODES.NETWORK_ERROR
      };
    }

    // Validar supplier
    const supplierValidation = MockUtils.validateSupplier(purchaseData.supplier_id);
    if (!supplierValidation.isValid) {
      return {
        success: false,
        error: supplierValidation.error,
        error_code: PURCHASE_ERROR_CODES.SUPPLIER_NOT_FOUND
      };
    }

    // Validar productos
    const productValidation = MockUtils.validateProducts(purchaseData.product_details);
    if (!productValidation.isValid) {
      return {
        success: false,
        error: productValidation.errors.join(', '),
        error_code: PURCHASE_ERROR_CODES.PRODUCT_NOT_FOUND
      };
    }

    // Crear orden mock
    const purchaseOrderId = nextPurchaseId++;
    const totalAmount = MockUtils.calculateTotal(purchaseData.product_details);
    
    const newOrder = {
      id: purchaseOrderId,
      supplier_id: purchaseData.supplier_id,
      supplier_name: supplierValidation.supplier.name,
      status: purchaseData.status || PURCHASE_STATUS.PENDING,
      total_amount: totalAmount,
      created_at: MockUtils.formatDate(),
      user_id: 'user123',
      purchase_items: productValidation.validProducts,
      payment_method_id: purchaseData.payment_method_id,
      currency_id: purchaseData.currency_id,
      metadata: purchaseData.metadata || {}
    };

    mockPurchaseOrders.push(newOrder);

    telemetry.increment('purchase.mock.create_enhanced_success');
    telemetry.increment('purchase.mock.total_created');

    return {
      success: true,
      purchase_order_id: purchaseOrderId,
      total_amount: totalAmount,
      items_processed: purchaseData.product_details.length,
      message: 'Purchase order created successfully'
    };
  }

  /**
   * 2. Procesar Pago de Compra
   */
  async processPayment(paymentData) {
    await MockUtils.delay(this.delayMs);
    telemetry.increment('purchase.mock.process_payment_start');

    // Buscar orden
    const order = mockPurchaseOrders.find(o => o.id === paymentData.purchase_order_id);
    if (!order) {
      return {
        success: false,
        error: 'Purchase order not found',
        error_code: PURCHASE_ERROR_CODES.ORDER_NOT_FOUND
      };
    }

    // Calcular pagos existentes
    const existingPayments = mockPayments.filter(p => p.purchase_order_id === paymentData.purchase_order_id);
    const totalPaidSoFar = existingPayments.reduce((sum, p) => sum + p.amount_paid, 0);
    const outstandingAmount = order.total_amount - totalPaidSoFar;

    // Validar monto
    if (paymentData.amount_paid > outstandingAmount) {
      return {
        success: false,
        error: 'Payment amount exceeds outstanding balance',
        error_code: PURCHASE_ERROR_CODES.PAYMENT_EXCEEDS_BALANCE
      };
    }

    // Crear pago
    const paymentId = nextPaymentId++;
    const newTotalPaid = totalPaidSoFar + paymentData.amount_paid;
    const newOutstanding = order.total_amount - newTotalPaid;
    
    let paymentStatus = PAYMENT_STATUS.PARTIAL;
    if (newOutstanding === 0) paymentStatus = PAYMENT_STATUS.COMPLETE;
    if (newOutstanding < 0) paymentStatus = PAYMENT_STATUS.OVERPAID;

    const payment = {
      payment_id: paymentId,
      purchase_order_id: paymentData.purchase_order_id,
      amount_paid: paymentData.amount_paid,
      outstanding_amount: newOutstanding,
      total_paid_so_far: newTotalPaid,
      total_order_amount: order.total_amount,
      payment_status: paymentStatus,
      order_fully_paid: newOutstanding === 0,
      payment_reference: paymentData.payment_reference,
      payment_notes: paymentData.payment_notes,
      processed_at: MockUtils.formatDate(),
      processed_by: 'user123'
    };

    mockPayments.push(payment);

    telemetry.increment('purchase.mock.process_payment_success');

    return {
      success: true,
      payment_id: paymentId,
      purchase_order_id: paymentData.purchase_order_id,
      payment_details: {
        amount_paid: payment.amount_paid,
        outstanding_amount: payment.outstanding_amount,
        total_paid_so_far: payment.total_paid_so_far,
        total_order_amount: payment.total_order_amount,
        payment_status: payment.payment_status,
        order_fully_paid: payment.order_fully_paid
      },
      message: 'Payment processed successfully',
      processed_at: payment.processed_at,
      processed_by: payment.processed_by
    };
  }

  /**
   * 3. Preview de Cancelación
   */
  async previewCancellation(purchaseId) {
    await MockUtils.delay(this.delayMs);
    telemetry.increment('purchase.mock.preview_cancellation_start');

    const order = mockPurchaseOrders.find(o => o.id === Number(purchaseId));
    if (!order) {
      return {
        success: false,
        error: 'Purchase order not found',
        error_code: PURCHASE_ERROR_CODES.ORDER_NOT_FOUND
      };
    }

    const orderPayments = mockPayments.filter(p => p.purchase_order_id === order.id);
    const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount_paid, 0);

    telemetry.increment('purchase.mock.preview_cancellation_success');

    return {
      success: true,
      purchase_info: {
        purchase_order_id: order.id,
        current_status: order.status,
        total_amount: order.total_amount,
        order_date: order.created_at,
        created_by: order.user_id,
        can_be_cancelled: order.status !== PURCHASE_STATUS.CANCELLED
      },
      impact_analysis: {
        total_items: order.purchase_items.length,
        payments_to_cancel: orderPayments.length,
        total_to_reverse: totalPaid,
        stock_adjustments_required: order.purchase_items.length,
        price_updates_required: 0,
        requires_payment_reversal: totalPaid > 0,
        requires_stock_adjustment: true,
        requires_price_reversion: false
      },
      recommendations: {
        action: totalPaid > 0 ? 'proceed_with_caution' : 'proceed',
        backup_recommended: true,
        notify_supplier: true,
        estimated_complexity: totalPaid > 0 ? 'medium' : 'low'
      },
      generated_at: MockUtils.formatDate()
    };
  }

  /**
   * 4. Cancelación Mejorada
   */
  async cancelEnhanced(purchaseId, reason = '') {
    await MockUtils.delay(this.delayMs);
    telemetry.increment('purchase.mock.cancel_enhanced_start');

    const orderIndex = mockPurchaseOrders.findIndex(o => o.id === Number(purchaseId));
    if (orderIndex === -1) {
      return {
        success: false,
        error: 'Purchase order not found',
        error_code: PURCHASE_ERROR_CODES.ORDER_NOT_FOUND
      };
    }

    const order = mockPurchaseOrders[orderIndex];
    if (order.status === PURCHASE_STATUS.CANCELLED) {
      return {
        success: false,
        error: 'Purchase order already cancelled',
        error_code: PURCHASE_ERROR_CODES.ORDER_ALREADY_CANCELLED
      };
    }

    // Actualizar estado
    mockPurchaseOrders[orderIndex] = {
      ...order,
      status: PURCHASE_STATUS.CANCELLED,
      cancelled_at: MockUtils.formatDate(),
      cancellation_reason: reason
    };

    telemetry.increment('purchase.mock.cancel_enhanced_success');

    return {
      success: true,
      message: 'Purchase order cancelled successfully',
      purchase_id: purchaseId.toString(),
      cancelled_at: MockUtils.formatDate(),
      actions_performed: [
        'order_status_updated',
        'supplier_notified',
        'stock_adjusted'
      ]
    };
  }

  /**
   * 5. Estadísticas de Pagos
   */
  async getPaymentStatistics(params = {}) {
    await MockUtils.delay(this.delayMs);
    telemetry.increment('purchase.mock.payment_statistics_start');

    // Filtrar órdenes por parámetros
    let filteredOrders = mockPurchaseOrders;
    
    if (params.supplier_id) {
      filteredOrders = filteredOrders.filter(o => o.supplier_id === params.supplier_id);
    }

    // Calcular estadísticas
    const totalOrders = filteredOrders.length;
    const orderPaymentStats = filteredOrders.map(order => {
      const orderPayments = mockPayments.filter(p => p.purchase_order_id === order.id);
      const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount_paid, 0);
      return {
        order,
        totalPaid,
        isFullyPaid: totalPaid >= order.total_amount,
        isPartiallyPaid: totalPaid > 0 && totalPaid < order.total_amount
      };
    });

    const fullyPaidOrders = orderPaymentStats.filter(o => o.isFullyPaid).length;
    const partiallyPaidOrders = orderPaymentStats.filter(o => o.isPartiallyPaid).length;
    const unpaidOrders = totalOrders - fullyPaidOrders - partiallyPaidOrders;

    const totalOrderAmount = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalPaidAmount = orderPaymentStats.reduce((sum, o) => sum + o.totalPaid, 0);
    const totalOutstanding = totalOrderAmount - totalPaidAmount;

    telemetry.increment('purchase.mock.payment_statistics_success');

    return {
      period: {
        start_date: params.start_date || '2025-01-01',
        end_date: params.end_date || '2025-12-31',
        supplier_id: params.supplier_id || null
      },
      order_statistics: {
        total_orders: totalOrders,
        fully_paid_orders: fullyPaidOrders,
        partially_paid_orders: partiallyPaidOrders,
        unpaid_orders: unpaidOrders,
        payment_completion_rate: totalOrders > 0 ? fullyPaidOrders / totalOrders : 0
      },
      financial_summary: {
        total_order_amount: totalOrderAmount,
        total_paid_amount: totalPaidAmount,
        total_outstanding: totalOutstanding,
        payment_percentage: totalOrderAmount > 0 ? (totalPaidAmount / totalOrderAmount) * 100 : 0
      },
      generated_at: MockUtils.formatDate()
    };
  }

  /**
   * Métodos de compatibilidad con V1
   */
  async getPurchaseById(id) {
    await MockUtils.delay(this.delayMs);
    
    const order = mockPurchaseOrders.find(o => o.id === Number(id));
    if (!order) {
      return {
        success: false,
        error: 'Purchase order not found'
      };
    }

    return {
      success: true,
      data: order
    };
  }

  async getPurchasesPaginated(page = 1, pageSize = 20, filters = {}) {
    await MockUtils.delay(this.delayMs);

    let filtered = [...mockPurchaseOrders];

    // Aplicar filtros
    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }
    if (filters.supplier_id) {
      filtered = filtered.filter(o => o.supplier_id === filters.supplier_id);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(o => 
        o.supplier_name.toLowerCase().includes(search) ||
        o.id.toString().includes(search)
      );
    }

    // Paginación
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const purchases = filtered.slice(start, end);

    return {
      success: true,
      data: {
        purchases,
        pagination: {
          current_page: page,
          per_page: pageSize,
          total,
          total_pages: totalPages
        }
      }
    };
  }

  /**
   * Utilidades para testing y desarrollo
   */
  resetMockData() {
    mockPurchaseOrders = [];
    mockPayments = [];
    nextPurchaseId = 1;
    nextPaymentId = 1;
  }

  seedMockData() {
    // Crear algunas órdenes de ejemplo
    const sampleOrders = [
      {
        id: nextPurchaseId++,
        supplier_id: 1,
        supplier_name: 'Proveedor Alpha S.A.',
        status: PURCHASE_STATUS.PENDING,
        total_amount: 2840.00,
        created_at: MockUtils.formatDate(new Date(Date.now() - 86400000)), // ayer
        user_id: 'user123',
        purchase_items: [
          { product_id: 'PROD001', product_name: 'Laptop HP EliteBook', quantity: 2, unit_price: 1250.00 },
          { product_id: 'PROD002', product_name: 'Monitor Dell 27"', quantity: 1, unit_price: 350.00 }
        ],
        payment_method_id: 1,
        currency_id: 1,
        metadata: { priority: 'high' }
      },
      {
        id: nextPurchaseId++,
        supplier_id: 2,
        supplier_name: 'Beta Distribuciones',
        status: PURCHASE_STATUS.CONFIRMED,
        total_amount: 425.00,
        created_at: MockUtils.formatDate(new Date(Date.now() - 172800000)), // hace 2 días
        user_id: 'user456',
        purchase_items: [
          { product_id: 'PROD003', product_name: 'Teclado Mecánico', quantity: 3, unit_price: 85.00 },
          { product_id: 'PROD004', product_name: 'Mouse Inalámbrico', quantity: 4, unit_price: 45.00 }
        ],
        payment_method_id: 1,
        currency_id: 1,
        metadata: { priority: 'medium' }
      }
    ];

    mockPurchaseOrders = sampleOrders;
  }
}

// Instancia singleton del mock
const mockPurchaseAPI = new MockPurchaseAPI();

// Inicializar con datos de ejemplo
mockPurchaseAPI.seedMockData();

export default mockPurchaseAPI;
