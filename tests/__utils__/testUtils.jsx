// Test utilities for React Testing Library with providers
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ThemeProvider } from '../../src/themes/ThemeProvider';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../src/i18n';

// Mock Zustand stores
export const mockPurchaseStore = {
  purchases: [],
  loading: false,
  error: null,
  cache: {},
  circuit: {
    isOpen: false,
    failures: 0,
    lastFailure: null,
    nextAttempt: null
  },
  loadPurchases: vi.fn(),
  createPurchase: vi.fn(),
  updatePurchase: vi.fn(),
  deletePurchase: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  reset: vi.fn(),
  openCircuit: vi.fn(),
  closeCircuit: vi.fn(),
  setCache: vi.fn(),
  invalidateCache: vi.fn()
};

export const mockSalesStore = {
  sales: [],
  loading: false,
  error: null,
  loadSales: vi.fn(),
  createSale: vi.fn(),
  updateSale: vi.fn(),
  deleteSale: vi.fn()
};

export const mockProductStore = {
  products: [],
  loading: false,
  error: null,
  loadProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn()
};

export const mockSupplierStore = {
  suppliers: [],
  loading: false,
  error: null,
  loadSuppliers: vi.fn(),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  deleteSupplier: vi.fn()
};

// Mock telemetry service
export const mockTelemetry = {
  trackEvent: vi.fn(),
  trackError: vi.fn(),
  trackPerformance: vi.fn(),
  getMetrics: vi.fn(() => ({
    purchases: { success: 95, errors: 5, latency: 150 },
    sales: { success: 98, errors: 2, latency: 120 },
    cache: { hitRatio: 85, misses: 15 },
    circuit: { openCount: 2, failures: 8 }
  }))
};

// Provider wrapper for testing
export const TestProviders = ({ children, theme = 'light' }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider defaultTheme={theme}>
        {children}
      </ThemeProvider>
    </I18nextProvider>
  );
};

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const { theme = 'light', ...renderOptions } = options;
  
  const Wrapper = ({ children }) => (
    <TestProviders theme={theme}>
      {children}
    </TestProviders>
  );

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

// Accessibility testing utilities
export const checkAccessibility = async (container) => {
  const { axe, toHaveNoViolations } = await import('jest-axe');
  expect.extend(toHaveNoViolations);
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Wait for element utilities
export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
};

export const waitForErrorToAppear = async (errorMessage) => {
  await waitFor(() => {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
};

// Mock API responses
export const mockApiResponse = (data, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data,
        status: 200
      });
    }, delay);
  });
};

export const mockApiError = (error, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(error));
    }, delay);
  });
};

// Form testing utilities
export const fillForm = async (user, formData) => {
  for (const [field, value] of Object.entries(formData)) {
    const input = screen.getByLabelText(new RegExp(field, 'i'));
    await user.clear(input);
    await user.type(input, value);
  }
};

export const submitForm = async (user) => {
  const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
  await user.click(submitButton);
};

// Modal testing utilities
export const openModal = async (user, triggerText) => {
  const trigger = screen.getByRole('button', { name: new RegExp(triggerText, 'i') });
  await user.click(trigger);
  
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
};

export const closeModal = async (user) => {
  const closeButton = screen.getByRole('button', { name: /close|cancel/i });
  await user.click(closeButton);
  
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
};

// Performance testing utilities
export const measureRenderTime = (renderFn) => {
  const start = performance.now();
  const result = renderFn();
  const end = performance.now();
  
  return {
    ...result,
    renderTime: end - start
  };
};

// Error boundary testing
export const ErrorBoundaryFallback = ({ error }) => (
  <div role="alert" data-testid="error-boundary">
    <h2>Something went wrong:</h2>
    <details style={{ whiteSpace: 'pre-wrap' }}>
      {error && error.toString()}
    </details>
  </div>
);

// Network condition simulation
export const simulateNetworkCondition = (condition) => {
  const conditions = {
    offline: () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
    },
    online: () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    },
    slow: () => {
      // Mock slow network by adding delays to fetch
      const originalFetch = global.fetch;
      global.fetch = vi.fn((...args) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(originalFetch(...args));
          }, 2000); // 2 second delay
        });
      });
    }
  };
  
  return conditions[condition]?.();
};

// Store testing utilities
export const setupStoreTest = (storeName, initialState = {}) => {
  const stores = {
    purchase: mockPurchaseStore,
    sales: mockSalesStore,
    product: mockProductStore,
    supplier: mockSupplierStore
  };
  
  const store = stores[storeName];
  if (!store) {
    throw new Error(`Unknown store: ${storeName}`);
  }
  
  // Reset store and apply initial state
  Object.keys(store).forEach(key => {
    if (typeof store[key] === 'function') {
      store[key].mockReset();
    } else {
      store[key] = initialState[key] ?? store[key];
    }
  });
  
  return store;
};

// Theme testing utilities
export const testAllThemes = (testFn) => {
  const themes = ['light', 'dark', 'enterprise', 'high-contrast'];
  
  themes.forEach(theme => {
    describe(`Theme: ${theme}`, () => {
      testFn(theme);
    });
  });
};

// Responsive testing utilities
export const resizeViewport = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

export const testResponsiveBehavior = (component, breakpoints) => {
  breakpoints.forEach(({ width, height, description }) => {
    it(`should work correctly at ${description}`, () => {
      resizeViewport(width, height);
      renderWithProviders(component);
      // Add specific assertions for this breakpoint
    });
  });
};

// Cleanup utilities
export const cleanup = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  
  // Reset network conditions
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  });
  
  // Reset viewport
  resizeViewport(1024, 768);
};

export default {
  renderWithProviders,
  checkAccessibility,
  waitForLoadingToFinish,
  waitForErrorToAppear,
  mockApiResponse,
  mockApiError,
  fillForm,
  submitForm,
  openModal,
  closeModal,
  measureRenderTime,
  simulateNetworkCondition,
  setupStoreTest,
  testAllThemes,
  testResponsiveBehavior,
  cleanup,
  mockTelemetry,
  mockPurchaseStore,
  mockSalesStore,
  mockProductStore,
  mockSupplierStore
};
