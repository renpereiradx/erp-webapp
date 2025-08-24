/**
 * Bundle Splitting Configuration - Wave 3 Performance
 * Configuración optimizada para dividir bundles y mejorar tiempo de carga
 * 
 * FEATURES WAVE 3:
 * - Chunks dinámicos por feature
 * - Vendor splitting optimizado
 * - Preload hints automáticos
 * - Tree shaking avanzado
 * - Code splitting por rutas
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

import { defineConfig } from 'vite';

// Configuración de chunks optimizada para ERP
export const bundleSplittingConfig = {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks optimizados
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
          'state-vendor': ['zustand', '@tanstack/react-query'],
          'virtual-vendor': ['react-window', 'react-virtualized-auto-sizer'],
          
          // Feature chunks
          'purchases-core': [
            './src/store/usePurchaseStore.js',
            './src/types/purchaseTypes.js',
            './src/constants/purchaseErrors.js'
          ],
          'purchases-components': [
            './src/components/purchases/PurchaseModal.jsx',
            './src/components/purchases/PurchaseCard.jsx',
            './src/components/purchases/PurchaseFilters.jsx'
          ],
          'purchases-advanced': [
            './src/components/purchases/VirtualizedPurchaseList.jsx',
            './src/components/purchases/PurchaseAnalyticsDashboard.jsx',
            './src/hooks/usePurchasePrefetch.js'
          ],
          
          // Performance chunks
          'performance-hooks': [
            './src/hooks/usePerformanceOptimizations.js',
            './src/hooks/useTelemetry.js',
            './src/services/recovery.js'
          ],
          
          // Theme & UI chunks
          'theme-system': [
            './src/components/ui/Button.jsx',
            './src/components/ui/Card.jsx',
            './src/hooks/useThemeStyles.js'
          ]
        },
        
        // Configuración de nombres de chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '')
            : 'unknown';
          
          // Chunks con hash para cache busting
          if (chunkInfo.name.includes('vendor')) {
            return `vendor/[name].[hash].js`;
          }
          
          if (chunkInfo.name.includes('purchases')) {
            return `features/purchases/[name].[hash].js`;
          }
          
          if (chunkInfo.name.includes('performance')) {
            return `performance/[name].[hash].js`;
          }
          
          return `chunks/${facadeModuleId}.[hash].js`;
        },
        
        // Configuración de assets
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'styles/[name].[hash].css';
          }
          
          return 'assets/[name].[hash][extname]';
        }
      }
    },
    
    // Configuración de minificación
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.log en producción
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: {
        properties: {
          regex: /^_/
        }
      }
    },
    
    // Configuración de sourcemaps
    sourcemap: process.env.NODE_ENV === 'development',
    
    // Configuración de chunks
    chunkSizeWarningLimit: 1000,
    
    // Configuración para análisis de bundles
    reportCompressedSize: true,
    
    // Configuración de target
    target: ['es2020', 'chrome80', 'safari13'],
    
    // Configuración de polyfills
    polyfillModulePreload: false
  },
  
  // Configuración de desarrollo para performance
  server: {
    hmr: {
      overlay: false
    }
  },
  
  // Configuración de optimizaciones
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'lucide-react'
    ],
    exclude: [
      // Excluir componentes lazy para bundle splitting correcto
      './src/components/purchases/VirtualizedPurchaseList.jsx',
      './src/components/purchases/PurchaseAnalyticsDashboard.jsx'
    ]
  },
  
  // Configuración de preload
  preload: {
    // Chunks críticos para preload
    critical: [
      'react-vendor',
      'purchases-core',
      'theme-system'
    ],
    
    // Chunks para prefetch
    prefetch: [
      'purchases-components',
      'ui-vendor',
      'performance-hooks'
    ],
    
    // Chunks para lazy loading
    lazy: [
      'purchases-advanced',
      'virtual-vendor'
    ]
  }
};

// Helper para generar preload hints
export const generatePreloadHints = (chunks) => {
  return chunks.map(chunk => ({
    rel: 'preload',
    href: `/chunks/${chunk}.js`,
    as: 'script',
    crossorigin: true
  }));
};

// Helper para generar prefetch hints
export const generatePrefetchHints = (chunks) => {
  return chunks.map(chunk => ({
    rel: 'prefetch',
    href: `/chunks/${chunk}.js`,
    as: 'script',
    crossorigin: true
  }));
};

// Análisis de chunks para development
export const analyzeChunks = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 Bundle Splitting Analysis:');
    console.log('- Vendor chunks: Optimized for caching');
    console.log('- Feature chunks: Purchases system isolated');
    console.log('- Performance chunks: Lazy loaded for better initial load');
    console.log('- Virtual scrolling: Only loaded when needed');
  }
};

export default bundleSplittingConfig;
