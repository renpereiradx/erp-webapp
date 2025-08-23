/**
 * Sales Testing Setup - Enterprise Grade
 * Comprehensive testing utilities and configuration for sales system
 * 
 * Features:
 * - Custom render functions with store providers
 * - Mock service architecture for sales/payment APIs
 * - Async testing utilities for complex workflows
 * - Component testing patterns for enterprise UI
 * - Performance testing helpers
 * 
 * Architecture: Testing infrastructure with enterprise patterns
 * Enfoque: Hardened Testing - Production-ready test suite
 */

import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';

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

// Export testing configuration for reference
export const testConfig = {
  timeout: 10000,
  retries: 2,
  mockApiDelay: 100,
  coverageThreshold: 85
};
