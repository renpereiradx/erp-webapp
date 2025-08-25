/**
 * Wave 5: Testing & Coverage Enterprise
 * Vitest Configuration - Unit & Integration Tests
 * 
 * Configuración enterprise para testing:
 * - Unit tests con mocking avanzado
 * - Integration tests con DOM testing
 * - Coverage reporting detallado
 * - Setup personalizado para accessibility testing
 * 
 * @since Wave 5 - Testing & Coverage Enterprise
 * @author Sistema ERP
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Entorno de pruebas
    environment: 'jsdom',
    
    // Setup files
    setupFiles: [
      './src/test/setup.js',
      './src/test/setupAccessibility.js'
    ],
    
    // Archivos de prueba
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/integration/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    
    // Excluir archivos
    exclude: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      'tests/e2e/**/*'
    ],
    
    // Configuración de cobertura
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/unit',
      
      // Thresholds enterprise
      thresholds: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },
        // Thresholds específicos por directorio
        'src/pages/': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/hooks/': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/accessibility/': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95
        }
      },
      
      // Incluir archivos para cobertura
      include: [
        'src/**/*.{js,jsx,ts,tsx}'
      ],
      
      // Excluir archivos de cobertura
      exclude: [
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        'src/test/**/*',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/types/**/*',
        'src/constants/**/*',
        'src/config/**/*'
      ]
    },
    
    // Globals para testing
    globals: true,
    
    // Configuración de timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Configuración de workers
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Configuración de reportes
    reporters: [
      'default',
      'json',
      'html'
    ],
    
    // Configuración de mocks
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Variables de entorno para testing
    env: {
      NODE_ENV: 'test',
      VITE_API_URL: 'http://localhost:3001/api',
      VITE_ENABLE_MOCKS: 'true',
      VITE_ENABLE_TELEMETRY: 'false'
    }
  },
  
  // Resolución de paths
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/test': resolve(__dirname, './src/test'),
      '@/mocks': resolve(__dirname, './src/test/mocks')
    }
  }
});
