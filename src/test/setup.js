/**
 * Wave 5: Testing & Coverage Enterprise
 * Setup Principal para Testing - Updated for Clients System
 * 
 * Comprehensive testing utilities and configuration:
 * - Custom render functions with store providers
 * - Mock service architecture for clients APIs
 * - Async testing utilities for complex workflows
 * - Component testing patterns for enterprise UI
 * - Performance testing helpers
 * - Accessibility testing utilities
 * 
 * @since Wave 5 - Testing & Coverage Enterprise (Updated)
 * @author Sistema ERP
 */

import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';
import { vi, beforeEach, afterEach, expect } from 'vitest';

// Configure Testing Library for enterprise use
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true
});

// Global test setup
beforeEach(() => {
  // Reset DOM before each test
  document.body.innerHTML = '';
  
  // Reset all mocks
  vi.clearAllMocks();
  
  // Reset timers
  vi.clearAllTimers();
  
  // Mock console methods to avoid noise in tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  
  // Mock window.matchMedia for responsive testing
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  
  // Mock window.ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };
  
  global.localStorage = localStorageMock;
  global.sessionStorage = localStorageMock;
  
  // Mock fetch for API testing
  global.fetch = vi.fn();
  
  // Mock Date for consistent testing
  const mockDate = new Date('2025-08-23T10:00:00.000Z');
  vi.setSystemTime(mockDate);
});

afterEach(() => {
  // Cleanup DOM after each test
  cleanup();
  
  // Restore console methods
  vi.restoreAllMocks();
  
  // Use real timers
  vi.useRealTimers();
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.VITE_API_BASE_URL = 'http://localhost:3001/api';
process.env.VITE_APP_VERSION = '1.0.0-test';

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Custom matcher para elementos sales específicos
expect.extend({
  toHaveProductData(received, expectedProduct) {
    const productId = received.getAttribute('data-product-id');
    const productName = received.textContent;
    
    const pass = productId === expectedProduct.id && 
                productName.includes(expectedProduct.name);
    
    return {
      message: () => `expected element to contain product data for ${expectedProduct.name}`,
      pass
    };
  },

  toHavePaymentStatus(received, expectedStatus) {
    const statusElement = received.querySelector('[data-payment-status]');
    const actualStatus = statusElement?.getAttribute('data-payment-status');
    
    return {
      message: () => `expected payment status to be ${expectedStatus}, got ${actualStatus}`,
      pass: actualStatus === expectedStatus
    };
  },

  // Wave 5: Accessibility Testing Matchers
  toBeAccessible(received) {
    // Verifica estructura ARIA básica
    const hasAriaLabel = received.hasAttribute('aria-label') || 
                        received.hasAttribute('aria-labelledby') ||
                        received.hasAttribute('aria-describedby');
    
    const hasRole = received.hasAttribute('role') || 
                   ['button', 'link', 'input', 'select', 'textarea'].includes(received.tagName.toLowerCase());
    
    const pass = hasAriaLabel && hasRole;
    
    return {
      message: () => `expected element to be accessible with proper ARIA attributes`,
      pass
    };
  },

  toHaveSkipLink(received) {
    const skipLinks = received.querySelectorAll('a[href^="#"]');
    const hasSkipLink = Array.from(skipLinks).some(link => 
      link.textContent.toLowerCase().includes('skip') ||
      link.textContent.toLowerCase().includes('saltar')
    );
    
    return {
      message: () => `expected element to have skip navigation link`,
      pass: hasSkipLink
    };
  },

  toHaveFocusManagement(received) {
    const focusableElements = received.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const hasFocusable = focusableElements.length > 0;
    const hasTabIndex = received.hasAttribute('tabindex');
    
    return {
      message: () => `expected element to have proper focus management`,
      pass: hasFocusable || hasTabIndex
    };
  },

  // Wave 5: Client Management Testing Matchers
  toHaveClientData(received, expectedClient) {
    const clientId = received.getAttribute('data-client-id');
    const clientName = received.textContent;
    
    const pass = clientId === expectedClient.id && 
                clientName.includes(expectedClient.name);
    
    return {
      message: () => `expected element to contain client data for ${expectedClient.name}`,
      pass
    };
  },

  toHaveValidationError(received, fieldName) {
    const errorElement = received.querySelector(`[data-error-field="${fieldName}"]`) ||
                        received.querySelector('.error-message') ||
                        received.querySelector('[role="alert"]');
    
    return {
      message: () => `expected validation error for field ${fieldName}`,
      pass: !!errorElement
    };
  }
});

// Export testing configuration for reference
export const testConfig = {
  timeout: 10000,
  retries: 2,
  mockApiDelay: 100,
  coverageThreshold: 85
};

/**
 * Wave 5: Client Management Testing Utilities
 * Enterprise-grade testing helpers for client system
 */

// Mock client data factory
export const createMockClient = (overrides = {}) => ({
  id: '1',
  name: 'Juan Pérez',
  email: 'juan.perez@email.com',
  phone: '+34 123 456 789',
  address: 'Calle Mayor 123, Madrid',
  createdAt: '2025-01-01T00:00:00.000Z',
  status: 'active',
  ...overrides
});

// Mock service responses for client API
export const mockClientService = {
  getClients: vi.fn(() => Promise.resolve([
    createMockClient(),
    createMockClient({ id: '2', name: 'María García', email: 'maria.garcia@email.com' })
  ])),
  
  getClient: vi.fn((id) => Promise.resolve(createMockClient({ id }))),
  
  createClient: vi.fn((clientData) => Promise.resolve({
    ...createMockClient(),
    ...clientData,
    id: Date.now().toString()
  })),
  
  updateClient: vi.fn((id, clientData) => Promise.resolve({
    ...createMockClient({ id }),
    ...clientData
  })),
  
  deleteClient: vi.fn((id) => Promise.resolve({ success: true }))
};

// Accessibility testing helpers
export const checkAccessibility = {
  async testFocusManagement(container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    return {
      hasFocusableElements: focusableElements.length > 0,
      focusableCount: focusableElements.length,
      elements: Array.from(focusableElements)
    };
  },

  async testAriaAttributes(element) {
    const hasAriaLabel = element.hasAttribute('aria-label');
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
    const hasAriaDescribedBy = element.hasAttribute('aria-describedby');
    const hasRole = element.hasAttribute('role');
    
    return {
      hasAccessibleName: hasAriaLabel || hasAriaLabelledBy,
      hasDescription: hasAriaDescribedBy,
      hasRole,
      isAccessible: (hasAriaLabel || hasAriaLabelledBy) && hasRole
    };
  },

  async testKeyboardNavigation(element, key = 'Tab') {
    const event = new KeyboardEvent('keydown', {
      key,
      code: key === 'Tab' ? 'Tab' : key,
      bubbles: true
    });
    
    element.dispatchEvent(event);
    
    return {
      eventDispatched: true,
      activeElement: document.activeElement,
      focusChanged: document.activeElement !== element
    };
  }
};

// Performance testing utilities
export const performanceHelpers = {
  async measureRenderTime(renderFunction) {
    const startTime = performance.now();
    const result = await renderFunction();
    const endTime = performance.now();
    
    return {
      renderTime: endTime - startTime,
      result
    };
  },

  async measureMemoryUsage(callback) {
    if (!performance.memory) {
      return { error: 'Memory API not available' };
    }
    
    const beforeMemory = performance.memory.usedJSHeapSize;
    await callback();
    const afterMemory = performance.memory.usedJSHeapSize;
    
    return {
      memoryUsed: afterMemory - beforeMemory,
      beforeMemory,
      afterMemory
    };
  }
};

// Integration testing helpers
export const integrationHelpers = {
  async waitForDataLoad(timeout = 3000) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const loadingElements = document.querySelectorAll('[data-loading="true"]');
        if (loadingElements.length === 0) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Data load timeout'));
      }, timeout);
    });
  },

  async simulateApiDelay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  createMockStore(initialState = {}) {
    return {
      getState: vi.fn(() => initialState),
      dispatch: vi.fn(),
      subscribe: vi.fn(),
      replaceReducer: vi.fn()
    };
  }
};
