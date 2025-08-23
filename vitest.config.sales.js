// Vitest Configuration for Sales System Testing
// Enterprise-grade testing setup with comprehensive coverage
// 
// Features:
// - Multi-environment testing setup
// - React Testing Library integration
// - Mock service architecture
// - Coverage reporting with detailed metrics
// - Performance testing capabilities
// 
// Architecture: Testing pyramid with unit, integration, and e2e layers
// Enfoque: Hardened Testing - ≥85% coverage requirement

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test environment configuration
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    
    // Test file patterns for sales system
    include: [
      'src/services/__tests__/**/*.test.js',
      'src/store/__tests__/**/*.test.js', 
      'src/components/Sales/__tests__/**/*.test.js',
      'src/test/integration/**/*.test.js'
    ],
    
    // Global test configuration
    globals: true,
    testTimeout: 30000,
    
    // Coverage configuration - Enterprise standards
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './test-results/coverage',
      include: [
        'src/services/**/*.js',
        'src/store/**/*.js',
        'src/components/Sales/**/*.jsx'
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/test/**',
        'src/**/*.test.js',
        'src/**/*.test.jsx'
      ],
      // Enterprise coverage thresholds
      thresholds: {
        global: {
          statements: 85,
          branches: 85,
          functions: 85,
          lines: 85
        },
        // Higher thresholds for critical business logic
        'src/services/**': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90
        },
        'src/store/**': {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90
        }
      }
    },
    
    // Parallel testing for performance
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2
      }
    },
    
    // Test reporting
    reporters: ['default'],
    
    // Performance benchmarking
    benchmark: {
      include: ['src/**/*.bench.js'],
      outputFile: './test-results/benchmark.json'
    },
    
    // Memory and performance monitoring
    logHeapUsage: true,
    isolate: false
  },  // Path Resolution for Testing
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/services': resolve(__dirname, './src/services'),
      '@/store': resolve(__dirname, './src/store'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/test': resolve(__dirname, './src/test')
    }
  },
  
  // Build Configuration for Testing
  build: {
    target: 'node14'
  },
  
  // Define Environment Variables for Testing
  define: {
    'process.env.NODE_ENV': '"test"',
    'import.meta.vitest': true
  }
});
