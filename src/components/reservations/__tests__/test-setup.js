/**
 * Configuración de setup para tests de reservas
 * Configuraciones globales, mocks y utilidades para testing
 */
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Setup para jsdom
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock de Web APIs
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {
    this.cb([{ borderBoxSize: { inlineSize: 0, blockSize: 0 } }], this);
  }
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// Mock de matchMedia
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

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock de console warnings en tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Cleanup después de cada test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Utilidades para testing
export const testUtils = {
  // Wrapper para React Query
  createQueryWrapper: () => {
    const QueryClient = require('@tanstack/react-query').QueryClient;
    const QueryClientProvider = require('@tanstack/react-query').QueryClientProvider;
    
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
        mutations: { retry: false },
      },
    });

    return ({ children }) => (
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    );
  },

  // Mock de datos comunes
  mockReservation: {
    id: 'test-reservation-1',
    client_name: 'Cliente Test',
    product_name: 'Producto Test',
    date: '2024-08-25',
    time: '14:30',
    duration: 120,
    status: 'confirmed',
    location: 'Sala Test',
    notes: 'Reserva de prueba'
  },

  mockReservations: [
    {
      id: 'test-reservation-1',
      client_name: 'Cliente Test 1',
      product_name: 'Producto A',
      date: '2024-08-25',
      time: '14:30',
      duration: 120,
      status: 'confirmed',
      location: 'Sala A',
      notes: 'Primera reserva'
    },
    {
      id: 'test-reservation-2',
      client_name: 'Cliente Test 2',
      product_name: 'Producto B',
      date: '2024-08-26',
      time: '10:00',
      duration: 90,
      status: 'pending',
      location: 'Sala B',
      notes: 'Segunda reserva'
    }
  ],

  // Utilidades para simular user events
  userEvent: {
    setup: () => require('@testing-library/user-event').default.setup(),
  },

  // Utilidades para accessibility testing
  axe: {
    configure: () => {
      const { configure } = require('jest-axe');
      configure({
        rules: {
          // Configuraciones específicas para WCAG 2.1 AA
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-labels': { enabled: true },
        }
      });
    }
  },

  // Mock factories
  createMockStore: (initialState = {}) => ({
    reservations: [],
    filters: {
      search: '',
      status: 'all',
      dateFrom: null,
      dateTo: null,
      product: 'all',
      client: ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    isLoading: false,
    error: null,
    isOffline: false,
    ...initialState,
    
    // Actions
    fetchReservations: vi.fn(),
    createReservation: vi.fn(),
    updateReservation: vi.fn(),
    deleteReservation: vi.fn(),
    setFilters: vi.fn(),
    setPage: vi.fn(),
    clearError: vi.fn(),
  }),

  createMockApiClient: () => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }),

  // Helpers para tests de performance
  performance: {
    measure: (name, fn) => {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      const duration = end - start;
      
      console.log(`${name}: ${duration}ms`);
      return { result, duration };
    },

    async measureAsync(name, fn) {
      const start = performance.now();
      const result = await fn();
      const end = performance.now();
      const duration = end - start;
      
      console.log(`${name}: ${duration}ms`);
      return { result, duration };
    }
  },

  // Helpers para tests offline
  offline: {
    simulate: () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
      window.dispatchEvent(new Event('offline'));
    },

    restore: () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    }
  },

  // Helpers para tests de cache
  cache: {
    mockLocalStorage: localStorageMock,
    mockSessionStorage: sessionStorageMock,
    
    mockIndexedDB: {
      open: vi.fn(),
      transaction: vi.fn(),
      objectStore: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    }
  },

  // Helpers para mocking de tiempo
  time: {
    mockDate: (dateString) => {
      const mockDate = new Date(dateString);
      vi.setSystemTime(mockDate);
      return mockDate;
    },

    restoreDate: () => {
      vi.useRealTimers();
    }
  }
};

// Configuración específica para cada tipo de test
export const testConfigs = {
  unit: {
    timeout: 5000,
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.js'],
  },

  integration: {
    timeout: 10000,
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.js'],
  },

  e2e: {
    timeout: 30000,
    retries: 2,
  },

  accessibility: {
    timeout: 10000,
    setupFilesAfterEnv: [
      '<rootDir>/src/test-setup.js',
      '<rootDir>/src/accessibility-setup.js'
    ],
  }
};

// Matchers personalizados para reservas
expect.extend({
  toBeValidReservation(received) {
    const required = ['id', 'client_name', 'product_name', 'date', 'time', 'status'];
    const missing = required.filter(field => !received[field]);
    
    if (missing.length > 0) {
      return {
        message: () => `Expected reservation to have required fields: ${missing.join(', ')}`,
        pass: false,
      };
    }

    return {
      message: () => 'Expected reservation to be invalid',
      pass: true,
    };
  },

  toMatchReservationStructure(received, expected) {
    const keys = Object.keys(expected);
    const matches = keys.every(key => 
      received.hasOwnProperty(key) && 
      typeof received[key] === typeof expected[key]
    );

    return {
      message: () => `Expected reservation structure to match`,
      pass: matches,
    };
  },

  toHaveValidDateFormat(received) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;

    const hasValidDate = dateRegex.test(received.date);
    const hasValidTime = timeRegex.test(received.time);

    return {
      message: () => `Expected reservation to have valid date/time format`,
      pass: hasValidDate && hasValidTime,
    };
  }
});

// Configuración para coverage
export const coverageConfig = {
  threshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Umbrales específicos por archivo
    './src/store/useReservationStore.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/components/reservations/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    }
  }
};
