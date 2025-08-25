/**
 * Wave 6: Optimización & Performance Enterprise
 * Code Splitting & Lazy Loading System
 * 
 * Sistema avanzado de división de código con:
 * - Route-based code splitting
 * - Component-based lazy loading
 * - Resource hints (preload, prefetch)
 * - Bundle optimization
 * - Performance monitoring
 * 
 * @since Wave 6 - Optimización & Performance Enterprise
 * @author Sistema ERP
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import PerformanceMonitor from './PerformanceMonitor';

// ====================================
// ROUTE-BASED CODE SPLITTING
// ====================================

// Páginas principales - lazy loaded
const ClientsPage = lazy(() => 
  import('../pages/ClientsPage').then(module => ({
    default: module.ClientsPage
  }))
);

const ProductsPage = lazy(() => 
  import('../pages/ProductsPage').then(module => ({
    default: module.ProductsPage
  }))
);

const ReservationsPage = lazy(() => 
  import('../pages/ReservationsPage').then(module => ({
    default: module.ReservationsPage
  }))
);

const PurchasesPage = lazy(() => 
  import('../pages/PurchasesPage').then(module => ({
    default: module.PurchasesPage
  }))
);

const AnalyticsPage = lazy(() => 
  import('../pages/AnalyticsPage').then(module => ({
    default: module.AnalyticsPage
  }))
);

const SettingsPage = lazy(() => 
  import('../pages/SettingsPage').then(module => ({
    default: module.SettingsPage
  }))
);

// Componentes pesados - lazy loaded
const ClientDetailModal = lazy(() => 
  import('../components/ClientDetailModal')
);

const CompactProductDetailModal = lazy(() => 
  import('../components/CompactProductDetailModal')
);

const CalendarReservation = lazy(() => 
  import('../components/CalendarReservation')
);

const MetricsDashboard = lazy(() => 
  import('../components/MetricsDashboard')
);

// ====================================
// PERFORMANCE OPTIMIZED ROUTER
// ====================================

/**
 * Router optimizado con code splitting y preloading
 */
export const OptimizedRouter = () => {
  return (
    <Router>
      <ErrorBoundary>
        <PerformanceMonitor>
          <Routes>
            {/* Rutas principales con Suspense */}
            <Route 
              path="/clients" 
              element={
                <SuspenseWrapper>
                  <ClientsPage />
                </SuspenseWrapper>
              } 
            />
            
            <Route 
              path="/products" 
              element={
                <SuspenseWrapper>
                  <ProductsPage />
                </SuspenseWrapper>
              } 
            />
            
            <Route 
              path="/reservations" 
              element={
                <SuspenseWrapper>
                  <ReservationsPage />
                </SuspenseWrapper>
              } 
            />
            
            <Route 
              path="/purchases" 
              element={
                <SuspenseWrapper>
                  <PurchasesPage />
                </SuspenseWrapper>
              } 
            />
            
            <Route 
              path="/analytics" 
              element={
                <SuspenseWrapper>
                  <AnalyticsPage />
                </SuspenseWrapper>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <SuspenseWrapper>
                  <SettingsPage />
                </SuspenseWrapper>
              } 
            />
          </Routes>
        </PerformanceMonitor>
      </ErrorBoundary>
    </Router>
  );
};

// ====================================
// SUSPENSE WRAPPER OPTIMIZADO
// ====================================

/**
 * Wrapper de Suspense con loading inteligente
 */
const SuspenseWrapper = ({ children, fallback = null }) => {
  const defaultFallback = (
    <div className="suspense-loading">
      <LoadingSpinner size="large" />
      <div className="loading-text">
        Cargando módulo...
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

// ====================================
// DYNAMIC IMPORTS HELPER
// ====================================

/**
 * Helper para imports dinámicos con error handling
 */
export const dynamicImport = (importFunc, componentName = 'Component') => {
  return lazy(async () => {
    try {
      const startTime = performance.now();
      const module = await importFunc();
      const endTime = performance.now();
      
      // Métricas de carga
      reportChunkLoadTime(componentName, endTime - startTime);
      
      return module;
    } catch (error) {
      console.error(`Failed to load ${componentName}:`, error);
      
      // Fallback component
      return {
        default: () => (
          <div className="chunk-load-error">
            <h3>Error cargando componente</h3>
            <p>Por favor, recarga la página</p>
            <button onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        )
      };
    }
  });
};

// ====================================
// PRELOADING STRATEGIES
// ====================================

/**
 * Precargar chunks críticos
 */
export const preloadCriticalChunks = () => {
  // Preload chunks más utilizados
  const criticalChunks = [
    () => import('../pages/ClientsPage'),
    () => import('../pages/ProductsPage'),
    () => import('../components/ClientDetailModal')
  ];
  
  criticalChunks.forEach((importFunc, index) => {
    setTimeout(() => {
      importFunc().catch(err => 
        console.log('Preload failed:', err)
      );
    }, index * 100); // Escalonar preloads
  });
};

/**
 * Prefetch chunks en hover
 */
export const usePrefetchOnHover = (importFunc) => {
  const prefetchChunk = () => {
    importFunc().catch(err => 
      console.log('Prefetch failed:', err)
    );
  };

  return {
    onMouseEnter: prefetchChunk,
    onFocus: prefetchChunk
  };
};

// ====================================
// RESOURCE HINTS
// ====================================

/**
 * Agregar resource hints al DOM
 */
export const addResourceHints = () => {
  const head = document.head;
  
  // Preload critical resources
  const preloadResources = [
    { href: '/icons/icon-192x192.png', as: 'image' },
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }
  ];
  
  preloadResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;
    if (resource.type) link.type = resource.type;
    if (resource.crossOrigin) link.crossOrigin = resource.crossOrigin;
    
    head.appendChild(link);
  });
  
  // Prefetch next likely pages
  const prefetchPages = [
    '/clients',
    '/products',
    '/reservations'
  ];
  
  prefetchPages.forEach(page => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = page;
    
    head.appendChild(link);
  });
};

// ====================================
// BUNDLE OPTIMIZATION
// ====================================

/**
 * Optimización de chunks por feature
 */
export const getOptimizedChunkConfig = () => {
  return {
    // Vendor chunks
    vendor: {
      name: 'vendor',
      chunks: 'all',
      test: /[\\/]node_modules[\\/]/,
      priority: 10,
      reuseExistingChunk: true
    },
    
    // Common chunks
    common: {
      name: 'common',
      chunks: 'all',
      minChunks: 2,
      priority: 5,
      reuseExistingChunk: true
    },
    
    // Feature-specific chunks
    clients: {
      name: 'clients-feature',
      chunks: 'all',
      test: /[\\/](clients|ClientsPage|ClientModal)[\\/]/,
      priority: 20
    },
    
    products: {
      name: 'products-feature',
      chunks: 'all',
      test: /[\\/](products|ProductsPage|ProductModal)[\\/]/,
      priority: 20
    },
    
    reservations: {
      name: 'reservations-feature',
      chunks: 'all',
      test: /[\\/](reservations|ReservationsPage|Calendar)[\\/]/,
      priority: 20
    }
  };
};

// ====================================
// PERFORMANCE MONITORING
// ====================================

/**
 * Reportar métricas de carga de chunks
 */
function reportChunkLoadTime(chunkName, loadTime) {
  // Enviar a analytics
  if (window.gtag) {
    window.gtag('event', 'chunk_load_time', {
      custom_parameter_chunk_name: chunkName,
      custom_parameter_load_time: Math.round(loadTime)
    });
  }
  
  // Log para debugging
  console.log(`📦 Chunk "${chunkName}" loaded in ${loadTime.toFixed(2)}ms`);
  
  // Umbral de performance
  if (loadTime > 1000) {
    console.warn(`⚠️ Slow chunk load: ${chunkName} took ${loadTime.toFixed(2)}ms`);
  }
}

/**
 * Monitorear tamaño de chunks
 */
export const monitorChunkSizes = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('chunk')) {
          console.log(`📊 Chunk size: ${entry.name} - ${entry.transferSize} bytes`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['resource'] });
  }
};

// ====================================
// INITIALIZATION
// ====================================

/**
 * Inicializar sistema de code splitting
 */
export const initializeCodeSplitting = () => {
  console.log('🚀 Initializing Wave 6 Code Splitting System');
  
  // Agregar resource hints
  addResourceHints();
  
  // Precargar chunks críticos
  preloadCriticalChunks();
  
  // Monitorear performance
  monitorChunkSizes();
  
  console.log('✅ Code Splitting System initialized');
};

export default OptimizedRouter;
