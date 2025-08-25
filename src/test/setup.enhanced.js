/**
 * Testing Setup Configuration - Wave 8
 * Enterprise-grade testing infrastructure
 */

import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Global test configuration
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  };

  // Mock IntersectionObserver for components that use it
  global.IntersectionObserver = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }));

  // Mock ResizeObserver for responsive components
  global.ResizeObserver = vi.fn(() => ({
    disconnect: vi.fn(),
    observe: vi.fn(),
    unobserve: vi.fn(),
  }));

  // Mock matchMedia for responsive testing
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

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: localStorageMock
  });

  // Mock fetch for API testing
  global.fetch = vi.fn();

  // Mock window.performance for performance testing
  Object.defineProperty(window, 'performance', {
    value: {
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => []),
      getEntriesByType: vi.fn(() => []),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      now: vi.fn(() => Date.now())
    }
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
});

// Custom matchers for enhanced testing
expect.extend({
  toBeValidCurrency(received) {
    const pass = typeof received === 'number' && received >= 0 && !isNaN(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid currency value`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid currency value`,
        pass: false,
      };
    }
  },

  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },

  toHaveValidSaleStructure(received) {
    const requiredFields = ['id', 'total', 'status', 'client', 'items'];
    const hasAllFields = requiredFields.every(field => field in received);
    
    if (hasAllFields) {
      return {
        message: () => `expected sale object to not have valid structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected sale object to have valid structure with fields: ${requiredFields.join(', ')}`,
        pass: false,
      };
    }
  }
});
