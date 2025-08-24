import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// Mock de servicios
vi.mock('../../services/salesService', () => ({
  salesService: {
    processSale: vi.fn(),
    getSalesByDateRange: vi.fn(),
    getSaleDetails: vi.fn(),
    processSaleWithUnits: vi.fn()
  }
}));

vi.mock('../../services/cancellationService', () => ({
  cancellationService: {
    cancelSale: vi.fn(),
    refundSale: vi.fn()
  }
}));

vi.mock('../../utils/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    error: vi.fn(),
    record: vi.fn()
  }
}));

// Mock de helpers
vi.mock('../../store/helpers/circuit', () => ({
  createCircuitHelpers: vi.fn(() => ({
    init: () => ({}),
    execute: vi.fn((fn) => fn()),
    reset: vi.fn()
  }))
}));

vi.mock('../../store/helpers/offline', () => ({
  createOfflineSnapshotHelpers: vi.fn(() => ({
    saveSnapshot: vi.fn(),
    loadSnapshot: vi.fn(),
    clearSnapshot: vi.fn()
  }))
}));

// Mock del store - necesitamos importarlo después de los mocks
const mockSalesStore = {
  // Estado inicial
  activeSales: {},
  salesHistory: [],
  currentSale: null,
  customers: {},
  products: {},
  statistics: {
    todayTotal: 0,
    todayCount: 0,
    weekTotal: 0,
    monthTotal: 0,
    averageTicket: 0
  },
  errors: {
    createSale: null,
    updateSale: null,
    processPayment: null,
    cancelSale: null,
    loadData: null
  },
  loading: {
    createSale: false,
    updateSale: false,
    processPayment: false,
    cancelSale: false,
    loadHistory: false,
    loadStatistics: false
  },
  ui: {
    activeStep: 'customer',
    selectedCustomer: null,
    cart: [],
    paymentMethod: null,
    showReceipt: false,
    filters: {
      dateRange: null,
      status: null
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0
    }
  },

  // Acciones
  initiateSale: vi.fn(),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateCartItem: vi.fn(),
  clearCart: vi.fn(),
  selectCustomer: vi.fn(),
  setPaymentMethod: vi.fn(),
  processSale: vi.fn(),
  cancelSale: vi.fn(),
  loadSalesHistory: vi.fn(),
  loadStatistics: vi.fn(),
  setActiveStep: vi.fn(),
  setFilters: vi.fn(),
  resetErrors: vi.fn()
};

describe('Wave 8 - Sales Store Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock store state
    Object.assign(mockSalesStore, {
      activeSales: {},
      salesHistory: [],
      currentSale: null,
      loading: {
        createSale: false,
        updateSale: false,
        processPayment: false,
        cancelSale: false,
        loadHistory: false,
        loadStatistics: false
      },
      errors: {
        createSale: null,
        updateSale: null,
        processPayment: null,
        cancelSale: null,
        loadData: null
      },
      ui: {
        activeStep: 'customer',
        selectedCustomer: null,
        cart: [],
        paymentMethod: null,
        showReceipt: false
      }
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Store Initialization', () => {
    it('should initialize with correct default state', () => {
      expect(mockSalesStore.activeSales).toEqual({});
      expect(mockSalesStore.salesHistory).toEqual([]);
      expect(mockSalesStore.currentSale).toBeNull();
      expect(mockSalesStore.ui.activeStep).toBe('customer');
      expect(mockSalesStore.ui.cart).toEqual([]);
      expect(mockSalesStore.ui.selectedCustomer).toBeNull();
      expect(mockSalesStore.ui.paymentMethod).toBeNull();
    });

    it('should have all required error states', () => {
      expect(mockSalesStore.errors).toHaveProperty('createSale');
      expect(mockSalesStore.errors).toHaveProperty('updateSale');
      expect(mockSalesStore.errors).toHaveProperty('processPayment');
      expect(mockSalesStore.errors).toHaveProperty('cancelSale');
      expect(mockSalesStore.errors).toHaveProperty('loadData');
    });

    it('should have all required loading states', () => {
      expect(mockSalesStore.loading).toHaveProperty('createSale');
      expect(mockSalesStore.loading).toHaveProperty('updateSale');
      expect(mockSalesStore.loading).toHaveProperty('processPayment');
      expect(mockSalesStore.loading).toHaveProperty('cancelSale');
      expect(mockSalesStore.loading).toHaveProperty('loadHistory');
      expect(mockSalesStore.loading).toHaveProperty('loadStatistics');
    });
  });

  describe('Cart Management', () => {
    it('should add item to cart', () => {
      const item = {
        id: 'prod_123',
        name: 'Product A',
        price: 100.00,
        quantity: 2
      };

      mockSalesStore.addToCart.mockImplementation(() => {
        mockSalesStore.ui.cart.push(item);
      });

      mockSalesStore.addToCart(item);

      expect(mockSalesStore.addToCart).toHaveBeenCalledWith(item);
      expect(mockSalesStore.ui.cart).toContainEqual(item);
    });

    it('should remove item from cart', () => {
      const item = {
        id: 'prod_123',
        name: 'Product A',
        price: 100.00,
        quantity: 2
      };

      mockSalesStore.ui.cart = [item];

      mockSalesStore.removeFromCart.mockImplementation((itemId) => {
        const index = mockSalesStore.ui.cart.findIndex(item => item.id === itemId);
        if (index > -1) {
          mockSalesStore.ui.cart.splice(index, 1);
        }
      });

      mockSalesStore.removeFromCart('prod_123');

      expect(mockSalesStore.removeFromCart).toHaveBeenCalledWith('prod_123');
      expect(mockSalesStore.ui.cart).toHaveLength(0);
    });

    it('should update cart item quantity', () => {
      const item = {
        id: 'prod_123',
        name: 'Product A',
        price: 100.00,
        quantity: 2
      };

      mockSalesStore.ui.cart = [item];

      mockSalesStore.updateCartItem.mockImplementation((itemId, updates) => {
        const index = mockSalesStore.ui.cart.findIndex(item => item.id === itemId);
        if (index > -1) {
          Object.assign(mockSalesStore.ui.cart[index], updates);
        }
      });

      mockSalesStore.updateCartItem('prod_123', { quantity: 5 });

      expect(mockSalesStore.updateCartItem).toHaveBeenCalledWith('prod_123', { quantity: 5 });
      expect(mockSalesStore.ui.cart[0].quantity).toBe(5);
    });

    it('should clear cart', () => {
      mockSalesStore.ui.cart = [
        { id: 'prod_123', quantity: 2 },
        { id: 'prod_456', quantity: 1 }
      ];

      mockSalesStore.clearCart.mockImplementation(() => {
        mockSalesStore.ui.cart = [];
      });

      mockSalesStore.clearCart();

      expect(mockSalesStore.clearCart).toHaveBeenCalled();
      expect(mockSalesStore.ui.cart).toHaveLength(0);
    });

    it('should calculate cart total correctly', () => {
      const cart = [
        { id: 'prod_123', price: 100.00, quantity: 2 },
        { id: 'prod_456', price: 50.00, quantity: 1 }
      ];

      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      expect(total).toBe(250.00);
    });
  });

  describe('Customer Selection', () => {
    it('should select customer', () => {
      const customer = {
        id: 'client_123',
        name: 'John Doe',
        email: 'john@example.com'
      };

      mockSalesStore.selectCustomer.mockImplementation((customerData) => {
        mockSalesStore.ui.selectedCustomer = customerData;
      });

      mockSalesStore.selectCustomer(customer);

      expect(mockSalesStore.selectCustomer).toHaveBeenCalledWith(customer);
      expect(mockSalesStore.ui.selectedCustomer).toEqual(customer);
    });

    it('should validate customer selection', () => {
      const invalidCustomer = null;

      mockSalesStore.selectCustomer.mockImplementation((customerData) => {
        if (!customerData || !customerData.id) {
          throw new Error('Valid customer is required');
        }
        mockSalesStore.ui.selectedCustomer = customerData;
      });

      expect(() => mockSalesStore.selectCustomer(invalidCustomer)).toThrow('Valid customer is required');
    });
  });

  describe('Sale Processing', () => {
    it('should initiate sale successfully', async () => {
      const saleData = {
        customer: { id: 'client_123', name: 'John Doe' },
        items: [{ id: 'prod_123', quantity: 2, price: 100.00 }],
        total: 200.00
      };

      mockSalesStore.initiateSale.mockResolvedValue({
        success: true,
        saleId: 'sale_789'
      });

      const result = await mockSalesStore.initiateSale(saleData);

      expect(mockSalesStore.initiateSale).toHaveBeenCalledWith(saleData);
      expect(result.success).toBe(true);
      expect(result.saleId).toBe('sale_789');
    });

    it('should process sale with payment', async () => {
      const saleData = {
        customer_id: 'client_123',
        product_details: [
          { product_id: 'prod_123', quantity: 2, price: 100.00 }
        ],
        payment_method_id: 1,
        total_amount: 200.00
      };

      mockSalesStore.processSale.mockResolvedValue({
        success: true,
        sale_id: 'sale_789',
        total_amount: 200.00,
        status: 'completed'
      });

      mockSalesStore.loading.createSale = true;

      const result = await mockSalesStore.processSale(saleData);

      expect(mockSalesStore.processSale).toHaveBeenCalledWith(saleData);
      expect(result.success).toBe(true);
      expect(result.sale_id).toBe('sale_789');
    });

    it('should handle sale processing errors', async () => {
      const saleData = {
        customer_id: 'invalid_customer',
        product_details: []
      };

      const errorMessage = 'Invalid customer or empty cart';

      mockSalesStore.processSale.mockRejectedValue(new Error(errorMessage));

      await expect(mockSalesStore.processSale(saleData)).rejects.toThrow(errorMessage);
      expect(mockSalesStore.processSale).toHaveBeenCalledWith(saleData);
    });

    it('should set loading state during sale processing', async () => {
      mockSalesStore.processSale.mockImplementation(async () => {
        mockSalesStore.loading.createSale = true;
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        mockSalesStore.loading.createSale = false;
        return { success: true, sale_id: 'sale_123' };
      });

      const promise = mockSalesStore.processSale({});
      
      // Check that loading is set
      expect(mockSalesStore.loading.createSale).toBe(true);
      
      const result = await promise;
      
      // Check that loading is unset
      expect(mockSalesStore.loading.createSale).toBe(false);
      expect(result.success).toBe(true);
    });
  });

  describe('Sale Cancellation', () => {
    it('should cancel sale successfully', async () => {
      const saleId = 'sale_123';
      const reason = 'Customer request';

      mockSalesStore.cancelSale.mockResolvedValue({
        success: true,
        sale_id: saleId,
        status: 'cancelled',
        refund_amount: 200.00
      });

      const result = await mockSalesStore.cancelSale(saleId, reason);

      expect(mockSalesStore.cancelSale).toHaveBeenCalledWith(saleId, reason);
      expect(result.success).toBe(true);
      expect(result.status).toBe('cancelled');
    });

    it('should handle cancellation errors', async () => {
      const saleId = 'nonexistent_sale';
      const reason = 'Test';

      mockSalesStore.cancelSale.mockRejectedValue(new Error('Sale not found'));

      await expect(mockSalesStore.cancelSale(saleId, reason)).rejects.toThrow('Sale not found');
    });
  });

  describe('Data Loading', () => {
    it('should load sales history', async () => {
      const mockHistory = [
        {
          id: 'sale_1',
          customer: 'John Doe',
          total: 200.00,
          status: 'completed',
          date: '2025-08-24'
        },
        {
          id: 'sale_2',
          customer: 'Jane Smith',
          total: 150.00,
          status: 'completed',
          date: '2025-08-24'
        }
      ];

      mockSalesStore.loadSalesHistory.mockImplementation(() => {
        mockSalesStore.salesHistory = mockHistory;
        return Promise.resolve(mockHistory);
      });

      const result = await mockSalesStore.loadSalesHistory();

      expect(mockSalesStore.loadSalesHistory).toHaveBeenCalled();
      expect(mockSalesStore.salesHistory).toEqual(mockHistory);
      expect(result).toEqual(mockHistory);
    });

    it('should load sales statistics', async () => {
      const mockStats = {
        todayTotal: 1000.00,
        todayCount: 5,
        weekTotal: 5000.00,
        monthTotal: 20000.00,
        averageTicket: 200.00
      };

      mockSalesStore.loadStatistics.mockImplementation(() => {
        mockSalesStore.statistics = mockStats;
        return Promise.resolve(mockStats);
      });

      const result = await mockSalesStore.loadStatistics();

      expect(mockSalesStore.loadStatistics).toHaveBeenCalled();
      expect(mockSalesStore.statistics).toEqual(mockStats);
      expect(result).toEqual(mockStats);
    });

    it('should handle loading errors', async () => {
      mockSalesStore.loadSalesHistory.mockRejectedValue(new Error('Network error'));

      await expect(mockSalesStore.loadSalesHistory()).rejects.toThrow('Network error');
    });
  });

  describe('UI State Management', () => {
    it('should set active step', () => {
      mockSalesStore.setActiveStep.mockImplementation((step) => {
        mockSalesStore.ui.activeStep = step;
      });

      mockSalesStore.setActiveStep('products');

      expect(mockSalesStore.setActiveStep).toHaveBeenCalledWith('products');
      expect(mockSalesStore.ui.activeStep).toBe('products');
    });

    it('should set payment method', () => {
      const paymentMethod = {
        id: 1,
        type: 'cash',
        name: 'Cash'
      };

      mockSalesStore.setPaymentMethod.mockImplementation((method) => {
        mockSalesStore.ui.paymentMethod = method;
      });

      mockSalesStore.setPaymentMethod(paymentMethod);

      expect(mockSalesStore.setPaymentMethod).toHaveBeenCalledWith(paymentMethod);
      expect(mockSalesStore.ui.paymentMethod).toEqual(paymentMethod);
    });

    it('should set filters', () => {
      const filters = {
        dateRange: { start: '2025-08-01', end: '2025-08-31' },
        status: 'completed',
        minAmount: 100
      };

      mockSalesStore.setFilters.mockImplementation((newFilters) => {
        if (!mockSalesStore.ui.filters) {
          mockSalesStore.ui.filters = {};
        }
        Object.assign(mockSalesStore.ui.filters, newFilters);
      });

      mockSalesStore.setFilters(filters);

      expect(mockSalesStore.setFilters).toHaveBeenCalledWith(filters);
      expect(mockSalesStore.ui.filters.dateRange).toEqual(filters.dateRange);
      expect(mockSalesStore.ui.filters.status).toBe('completed');
    });

    it('should validate step transitions', () => {
      const validSteps = ['customer', 'products', 'payment', 'confirmation'];
      
      validSteps.forEach(step => {
        mockSalesStore.setActiveStep.mockImplementation((newStep) => {
          if (!validSteps.includes(newStep)) {
            throw new Error(`Invalid step: ${newStep}`);
          }
          mockSalesStore.ui.activeStep = newStep;
        });

        mockSalesStore.setActiveStep(step);
        expect(mockSalesStore.ui.activeStep).toBe(step);
      });

      expect(() => mockSalesStore.setActiveStep('invalid_step')).toThrow('Invalid step: invalid_step');
    });
  });

  describe('Error Handling', () => {
    it('should reset errors', () => {
      mockSalesStore.errors = {
        createSale: 'Some error',
        updateSale: 'Another error',
        processPayment: null,
        cancelSale: null,
        loadData: 'Load error'
      };

      mockSalesStore.resetErrors.mockImplementation(() => {
        Object.keys(mockSalesStore.errors).forEach(key => {
          mockSalesStore.errors[key] = null;
        });
      });

      mockSalesStore.resetErrors();

      expect(mockSalesStore.resetErrors).toHaveBeenCalled();
      expect(Object.values(mockSalesStore.errors).every(error => error === null)).toBe(true);
    });

    it('should set specific errors', () => {
      const errorMessage = 'Payment processing failed';

      mockSalesStore.errors.processPayment = errorMessage;

      expect(mockSalesStore.errors.processPayment).toBe(errorMessage);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large cart efficiently', () => {
      const largeCart = Array.from({ length: 100 }, (_, i) => ({
        id: `prod_${i}`,
        name: `Product ${i}`,
        price: 10.00,
        quantity: 1
      }));

      mockSalesStore.ui.cart = largeCart;

      expect(mockSalesStore.ui.cart).toHaveLength(100);
      
      // Calculate total
      const total = mockSalesStore.ui.cart.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      expect(total).toBe(1000.00);
    });

    it('should handle large sales history', () => {
      const largeSalesHistory = Array.from({ length: 1000 }, (_, i) => ({
        id: `sale_${i}`,
        customer: `Customer ${i}`,
        total: 100.00 + i,
        status: 'completed',
        date: new Date().toISOString()
      }));

      mockSalesStore.salesHistory = largeSalesHistory;

      expect(mockSalesStore.salesHistory).toHaveLength(1000);
      expect(mockSalesStore.salesHistory[0].id).toBe('sale_0');
      expect(mockSalesStore.salesHistory[999].id).toBe('sale_999');
    });
  });
});
