/**
 * Sales Testing Utils - Enterprise Grade
 * Comprehensive testing utilities for sales system components and workflows
 * 
 * Features:
 * - Custom render functions with store providers
 * - Mock data generators for realistic testing
 * - Async utilities for complex workflows
 * - Store testing helpers with state management
 * - Component interaction helpers
 * 
 * Architecture: Testing utilities with enterprise patterns
 * Enfoque: Hardened Testing - Reusable and maintainable test helpers
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Store imports for provider setup
import { useSalesStore } from '@/store/useSalesStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { useCancellationStore } from '@/store/useCancellationStore';

/**
 * Custom render function with all necessary providers
 */
export const renderWithProviders = (
  ui, 
  {
    initialSalesState = {},
    initialPaymentState = {},
    initialCancellationState = {},
    route = '/',
    ...renderOptions
  } = {}
) => {
  // Create a wrapper component with all providers
  const AllProviders = ({ children }) => {
    // Initialize stores with test data
    React.useEffect(() => {
      if (Object.keys(initialSalesState).length > 0) {
        const salesStore = useSalesStore.getState();
        Object.assign(salesStore, initialSalesState);
      }
      
      if (Object.keys(initialPaymentState).length > 0) {
        const paymentStore = usePaymentStore.getState();
        Object.assign(paymentStore, initialPaymentState);
      }
      
      if (Object.keys(initialCancellationState).length > 0) {
        const cancellationStore = useCancellationStore.getState();
        Object.assign(cancellationStore, initialCancellationState);
      }
    }, []);

    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  };

  // Set initial route if provided
  window.history.pushState({}, 'Test page', route);

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...renderOptions })
  };
};

/**
 * Mock data generators for testing
 */
export const mockData = {
  // Customer data generator
  customer: (overrides = {}) => ({
    id: `customer_${Date.now()}`,
    name: 'Juan Pérez',
    email: 'juan@example.com',
    phone: '+52 555 0123',
    address: 'Calle Ejemplo 123, Ciudad',
    type: 'regular',
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  // Product data generator
  product: (overrides = {}) => ({
    id: `product_${Date.now()}`,
    name: 'Producto de Prueba',
    description: 'Descripción del producto de prueba',
    price: 99.99,
    stock: 10,
    category: 'Electronics',
    sku: `SKU_${Date.now()}`,
    ...overrides
  }),

  // Sale item generator
  saleItem: (overrides = {}) => ({
    productId: `product_${Date.now()}`,
    productName: 'Producto de Prueba',
    unitPrice: 99.99,
    quantity: 1,
    total: 99.99,
    category: 'Electronics',
    ...overrides
  }),

  // Sale data generator
  sale: (overrides = {}) => ({
    id: `sale_${Date.now()}`,
    customerId: 'customer_123',
    customerName: 'Juan Pérez',
    items: [mockData.saleItem()],
    subtotal: 99.99,
    tax: 16.00,
    total: 115.99,
    status: 'completed',
    paymentMethod: 'cash',
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  // Payment data generator
  payment: (overrides = {}) => ({
    id: `payment_${Date.now()}`,
    saleId: `sale_${Date.now()}`,
    amount: 115.99,
    paymentType: 'cash',
    amountReceived: 120.00,
    change: 4.01,
    status: 'completed',
    transactionId: `txn_${Date.now()}`,
    processedAt: new Date().toISOString(),
    ...overrides
  }),

  // Cancellation data generator
  cancellation: (overrides = {}) => ({
    id: `cancellation_${Date.now()}`,
    saleId: `sale_${Date.now()}`,
    reason: 'customer_request',
    comments: 'Cliente solicitó cancelación',
    amount: 115.99,
    status: 'pending',
    riskLevel: 'low',
    createdAt: new Date().toISOString(),
    ...overrides
  })
};

/**
 * Store testing helpers
 */
export const storeHelpers = {
  // Reset all stores to initial state
  resetAllStores: () => {
    act(() => {
      useSalesStore.setState(useSalesStore.getInitialState());
      usePaymentStore.setState(usePaymentStore.getInitialState());
      useCancellationStore.setState(useCancellationStore.getInitialState());
    });
  },

  // Get current store states
  getStoreStates: () => ({
    sales: useSalesStore.getState(),
    payment: usePaymentStore.getState(),
    cancellation: useCancellationStore.getState()
  }),

  // Create mock sale in store
  createMockSale: (saleData = {}) => {
    const sale = mockData.sale(saleData);
    act(() => {
      useSalesStore.getState().setSales([sale]);
      useSalesStore.getState().setCurrentSale(sale);
    });
    return sale;
  },

  // Create mock payment in store
  createMockPayment: (paymentData = {}) => {
    const payment = mockData.payment(paymentData);
    act(() => {
      usePaymentStore.getState().setCurrentPayment(payment);
    });
    return payment;
  }
};

/**
 * Async testing utilities
 */
export const asyncUtils = {
  // Wait for store updates
  waitForStoreUpdate: async (store, predicate, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Store update timeout after ${timeout}ms`));
      }, timeout);

      const unsubscribe = store.subscribe((state) => {
        if (predicate(state)) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(state);
        }
      });

      // Check immediately in case the condition is already met
      if (predicate(store.getState())) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(store.getState());
      }
    });
  },

  // Wait for async operations with act
  waitForAsync: async (fn) => {
    let result;
    await act(async () => {
      result = await fn();
    });
    return result;
  },

  // Simulate API delay
  delay: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
};

/**
 * Component interaction helpers
 */
export const interactionHelpers = {
  // Fill form with data
  fillForm: async (user, formData) => {
    for (const [field, value] of Object.entries(formData)) {
      const input = document.querySelector(`[name="${field}"], [data-testid="${field}"]`);
      if (input) {
        await user.clear(input);
        await user.type(input, String(value));
      }
    }
  },

  // Select option from dropdown
  selectOption: async (user, selectElement, optionText) => {
    await user.click(selectElement);
    const option = document.querySelector(`option:contains("${optionText}")`);
    if (option) {
      await user.click(option);
    }
  },

  // Navigate through wizard steps
  navigateWizard: async (user, steps) => {
    for (let i = 0; i < steps; i++) {
      const nextButton = document.querySelector('[data-testid="next-button"], button:contains("Siguiente")');
      if (nextButton && !nextButton.disabled) {
        await user.click(nextButton);
        await asyncUtils.delay(100);
      }
    }
  }
};

/**
 * Mock API responses
 */
export const mockApiResponses = {
  // Successful sale creation
  createSaleSuccess: (saleData = {}) => ({
    success: true,
    data: mockData.sale(saleData),
    message: 'Venta creada exitosamente'
  }),

  // Failed sale creation
  createSaleError: (error = 'Error al crear la venta') => ({
    success: false,
    error,
    code: 'SALE_CREATION_FAILED'
  }),

  // Successful payment processing
  processPaymentSuccess: (paymentData = {}) => ({
    success: true,
    data: mockData.payment(paymentData),
    message: 'Pago procesado exitosamente'
  }),

  // Failed payment processing
  processPaymentError: (error = 'Error al procesar el pago') => ({
    success: false,
    error,
    code: 'PAYMENT_PROCESSING_FAILED'
  }),

  // Successful cancellation
  cancelSaleSuccess: (cancellationData = {}) => ({
    success: true,
    data: mockData.cancellation(cancellationData),
    message: 'Venta cancelada exitosamente'
  })
};

/**
 * Performance testing utilities
 */
export const performanceUtils = {
  // Measure component render time
  measureRenderTime: async (renderFunction) => {
    const start = performance.now();
    await act(async () => {
      renderFunction();
    });
    const end = performance.now();
    return end - start;
  },

  // Measure store operation time
  measureStoreOperation: async (operation) => {
    const start = performance.now();
    await act(async () => {
      await operation();
    });
    const end = performance.now();
    return end - start;
  }
};

/**
 * Mock service factory
 */
export const createMockService = (serviceName) => {
  const mockMethods = {};
  
  // Common service methods
  const commonMethods = ['get', 'create', 'update', 'delete', 'list'];
  
  commonMethods.forEach(method => {
    mockMethods[method] = vi.fn().mockResolvedValue({
      success: true,
      data: {},
      message: `${method} operation successful`
    });
  });

  // Service-specific methods
  if (serviceName === 'sales') {
    mockMethods.processSale = vi.fn().mockResolvedValue(mockApiResponses.createSaleSuccess());
    mockMethods.cancelSale = vi.fn().mockResolvedValue(mockApiResponses.cancelSaleSuccess());
    mockMethods.calculateTotals = vi.fn().mockReturnValue({
      subtotal: 100,
      tax: 16,
      total: 116
    });
  }

  if (serviceName === 'payment') {
    mockMethods.processPayment = vi.fn().mockResolvedValue(mockApiResponses.processPaymentSuccess());
    mockMethods.calculateChange = vi.fn().mockReturnValue(5.00);
    mockMethods.validatePayment = vi.fn().mockReturnValue({ valid: true });
  }

  return mockMethods;
};

// Export commonly used testing patterns
export const testPatterns = {
  // Standard test structure
  describeComponent: (componentName, tests) => {
    return describe(`${componentName} Component`, () => {
      beforeEach(() => {
        storeHelpers.resetAllStores();
      });
      
      tests();
    });
  },

  // Standard test for component rendering
  itRendersCorrectly: (component, expectedText) => {
    return it('renders correctly', () => {
      const { getByText } = renderWithProviders(component);
      expect(getByText(expectedText)).toBeInTheDocument();
    });
  },

  // Standard test for user interactions
  itHandlesUserInteraction: (component, interaction, assertion) => {
    return it('handles user interaction correctly', async () => {
      const { user } = renderWithProviders(component);
      await interaction(user);
      assertion();
    });
  }
};

export default {
  renderWithProviders,
  mockData,
  storeHelpers,
  asyncUtils,
  interactionHelpers,
  mockApiResponses,
  performanceUtils,
  createMockService,
  testPatterns
};
