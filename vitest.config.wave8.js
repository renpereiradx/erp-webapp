import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './src/test'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@store': resolve(__dirname, './src/store'),
      '@utils': resolve(__dirname, './src/utils')
    }
  },

  test: {
    // Test environment configuration
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    
    // Test file patterns - comprehensive coverage
    include: [
      'src/**/*.test.{js,jsx,ts,tsx}',
      'src/test/**/*.test.{js,jsx,ts,tsx}',
      'tests/**/*.test.{js,jsx,ts,tsx}'
    ],
    
    exclude: [
      'node_modules',
      'dist',
      'build',
      '**/*.config.{js,ts}',
      '**/coverage/**'
    ],
    
    // Global test configuration
    globals: true,
    testTimeout: 30000,
    hookTimeout: 10000,
    
    // Coverage configuration - Wave 8 Quality Standards
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './test-results/coverage',
      
      // Coverage targets - 85% minimum requirement
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      
      include: [
        'src/services/**/*.{js,jsx,ts,tsx}',
        'src/store/**/*.{js,jsx,ts,tsx}',
        'src/components/**/*.{js,jsx,ts,tsx}',
        'src/utils/**/*.{js,jsx,ts,tsx}',
        'src/hooks/**/*.{js,jsx,ts,tsx}'
      ],
      
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/test/**',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/**/*.config.{js,ts}',
        'src/main.jsx',
        'src/App.jsx',
        'src/**/*.d.ts'
      ]
    },
    
    // Parallel testing for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    },
    
    // Enhanced reporting
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/test-results.json',
      html: './test-results/test-report.html'
    },
    
    // Performance testing configuration
    benchmark: {
      outputFile: './test-results/benchmark.json'
    },
    
    // Watch mode configuration
    watch: {
      watchPathsOverride: ['src/**', 'tests/**']
    }
  },
  
  // Optimization for testing
  define: {
    __DEV__: true,
    __TEST__: true
  },
  
  // Mock configuration
  server: {
    deps: {
      inline: ['vitest-canvas-mock']
    }
  }
});
