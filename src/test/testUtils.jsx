/**
 * Testing Utilities - Wave 8
 * Comprehensive testing helpers for the Sales ERP system
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock data factories
export const createMockSale = (overrides = {}) => ({
  id: 'sale_' + Math.random().toString(36).substr(2, 9),
  total: 150.00,
  status: 'completed',
  client: {
    id: 'client_1',
    name: 'Juan Pérez',
    email: 'juan@example.com'
  },
  items: [
    {
      id: 'item_1',
      name: 'Producto Test',
      quantity: 2,
      price: 75.00,
      total: 150.00
    }
  ],
  payments: [
    {
      id: 'payment_1',
      method: 'cash',
      amount: 150.00,
      change: 0
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createMockClient = (overrides = {}) => ({
  id: 'client_' + Math.random().toString(36).substr(2, 9),
  name: 'Cliente Test',
  email: 'cliente@test.com',
  phone: '+54 9 11 1234-5678',
  address: 'Dirección Test 123',
  ...overrides
});

export const createMockProduct = (overrides = {}) => ({
  id: 'product_' + Math.random().toString(36).substr(2, 9),
  name: 'Producto Test',
  description: 'Descripción del producto test',
  price: 25.00,
  stock: 100,
  category: 'test',
  sku: 'TEST-001',
  ...overrides
});

export const createMockPayment = (overrides = {}) => ({
  id: 'payment_' + Math.random().toString(36).substr(2, 9),
  method: 'cash',
  amount: 100.00,
  change: 0,
  status: 'completed',
  createdAt: new Date().toISOString(),
  ...overrides
});

// Store mocks
export const createMockSalesStore = (overrides = {}) => ({
  sales: [],
  currentSale: null,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    dateRange: 'all',
    client: null
  },
  
  // Actions
  createSale: vi.fn(),
  updateSale: vi.fn(),
  deleteSale: vi.fn(),
  getSales: vi.fn(),
  getSaleById: vi.fn(),
  setCurrentSale: vi.fn(),
  clearCurrentSale: vi.fn(),
  setFilters: vi.fn(),
  clearError: vi.fn(),
  
  ...overrides
});

export const createMockMonitoringStore = (overrides = {}) => ({
  businessMetrics: {
    totalSales: 1250,
    totalRevenue: 45000,
    conversionRate: 12.6,
    averageOrderValue: 36.0
  },
  performanceData: [],
  alertsData: [],
  
  // Actions
  refreshBusinessMetrics: vi.fn(),
  addAlert: vi.fn(),
  acknowledgeAlert: vi.fn(),
  clearAlerts: vi.fn(),
  
  ...overrides
});

// Service mocks
export const createMockSalesService = () => ({
  createSale: vi.fn().mockResolvedValue({ success: true, data: createMockSale() }),
  updateSale: vi.fn().mockResolvedValue({ success: true, data: createMockSale() }),
  deleteSale: vi.fn().mockResolvedValue({ success: true }),
  getSales: vi.fn().mockResolvedValue({ success: true, data: [] }),
  getSaleById: vi.fn().mockResolvedValue({ success: true, data: createMockSale() }),
  processPayment: vi.fn().mockResolvedValue({ success: true }),
  cancelSale: vi.fn().mockResolvedValue({ success: true })
});

export const createMockPaymentService = () => ({
  processPayment: vi.fn().mockResolvedValue({ success: true }),
  calculateChange: vi.fn().mockImplementation((total, paid) => Math.max(0, paid - total)),
  validatePayment: vi.fn().mockReturnValue({ valid: true }),
  getPaymentMethods: vi.fn().mockResolvedValue(['cash', 'card', 'transfer'])
});

// Custom render function with providers
export const renderWithProviders = (
  ui,
  {
    preloadedState = {},
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false }
      }
    }),
    ...renderOptions
  } = {}
) => {
  const AllTheProviders = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...renderOptions })
  };
};

// Custom hooks for testing
export const waitForLoadingToFinish = () =>
  waitFor(
    () => {
      expect(screen.queryByTestId(/loading/i)).not.toBeInTheDocument();
    },
    { timeout: 5000 }
  );

export const waitForErrorToAppear = (errorMessage) =>
  waitFor(
    () => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    },
    { timeout: 3000 }
  );

// Form testing utilities
export const fillForm = async (user, formData) => {
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
    await user.clear(field);
    await user.type(field, value.toString());
  }
};

export const submitForm = async (user, buttonText = /submit|save|create/i) => {
  const submitButton = screen.getByRole('button', { name: buttonText });
  await user.click(submitButton);
};

// API testing utilities
export const mockApiSuccess = (data) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data })
  });
};

export const mockApiError = (message = 'API Error', status = 500) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ success: false, error: message })
  });
};

export const mockApiNetworkError = () => {
  global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));
};

// Performance testing utilities
export const measurePerformance = (fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return {
    result,
    duration: end - start
  };
};

export const measureAsyncPerformance = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    duration: end - start
  };
};

// Accessibility testing utilities
export const checkAccessibility = async (element) => {
  // Basic accessibility checks
  const focusableElements = element.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
  );
  
  const checks = {
    hasFocusableElements: focusableElements.length > 0,
    hasProperLabels: true,
    hasAltTexts: true
  };

  // Check for proper labels
  const inputs = element.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const hasLabel = input.getAttribute('aria-label') || 
                    input.getAttribute('aria-labelledby') ||
                    element.querySelector(`label[for="${input.id}"]`);
    if (!hasLabel) checks.hasProperLabels = false;
  });

  // Check for alt texts in images
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.getAttribute('alt')) checks.hasAltTexts = false;
  });

  return checks;
};

// Memory testing utilities
export const createMemoryTestSuite = (componentFactory) => {
  const instances = [];
  
  return {
    createInstance: () => {
      const instance = componentFactory();
      instances.push(instance);
      return instance;
    },
    
    cleanup: () => {
      instances.forEach(instance => {
        if (instance.cleanup) instance.cleanup();
      });
      instances.length = 0;
    },
    
    getInstanceCount: () => instances.length
  };
};

// Test data generators
export const generateSalesData = (count = 10) => {
  return Array.from({ length: count }, (_, index) => 
    createMockSale({ 
      id: `sale_${index + 1}`,
      total: Math.random() * 1000 + 50,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  );
};

export const generateProductsData = (count = 20) => {
  const categories = ['electronics', 'clothing', 'food', 'books', 'toys'];
  return Array.from({ length: count }, (_, index) => 
    createMockProduct({ 
      id: `product_${index + 1}`,
      name: `Producto ${index + 1}`,
      price: Math.random() * 200 + 10,
      category: categories[Math.floor(Math.random() * categories.length)]
    })
  );
};

// Export all utilities
export default {
  createMockSale,
  createMockClient,
  createMockProduct,
  createMockPayment,
  createMockSalesStore,
  createMockMonitoringStore,
  createMockSalesService,
  createMockPaymentService,
  renderWithProviders,
  waitForLoadingToFinish,
  waitForErrorToAppear,
  fillForm,
  submitForm,
  mockApiSuccess,
  mockApiError,
  mockApiNetworkError,
  measurePerformance,
  measureAsyncPerformance,
  checkAccessibility,
  createMemoryTestSuite,
  generateSalesData,
  generateProductsData
};
