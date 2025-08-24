import { useEffect, useRef } from 'react';
import { useObservability } from '../hooks/useObservability';

// HOC for automatic observability tracking
export const withObservability = (WrappedComponent, componentName) => {
  return function ObservableComponent(props) {
    const { useComponentTracking, trackUserInteraction, trackError } = useObservability();
    const { renderCount } = useComponentTracking(componentName);

    // Error boundary functionality
    const errorBoundaryRef = useRef(null);

    useEffect(() => {
      const handleError = (error, errorInfo) => {
        trackError(error, { 
          component: componentName,
          errorInfo,
          props: Object.keys(props)
        });
      };

      // Set up error boundary
      errorBoundaryRef.current = handleError;

      // Global error handler
      const globalErrorHandler = (event) => {
        if (event.filename && event.filename.includes(componentName)) {
          trackError(new Error(event.message), {
            component: componentName,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          });
        }
      };

      window.addEventListener('error', globalErrorHandler);
      
      return () => {
        window.removeEventListener('error', globalErrorHandler);
      };
    }, [componentName, trackError, props]);

    // Enhanced props with observability helpers
    const enhancedProps = {
      ...props,
      trackInteraction: (action, data) => trackUserInteraction(action, componentName, data),
      renderCount
    };

    try {
      return <WrappedComponent {...enhancedProps} />;
    } catch (error) {
      if (errorBoundaryRef.current) {
        errorBoundaryRef.current(error, { componentStack: error.stack });
      }
      throw error;
    }
  };
};

// Automatic API request tracking
export const observableApi = {
  get: (url, options = {}) => {
    const { trackFetch } = useObservability();
    return trackFetch(url, { ...options, method: 'GET' });
  },
  
  post: (url, data, options = {}) => {
    const { trackFetch } = useObservability();
    return trackFetch(url, { 
      ...options, 
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  },
  
  put: (url, data, options = {}) => {
    const { trackFetch } = useObservability();
    return trackFetch(url, { 
      ...options, 
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
  },
  
  delete: (url, options = {}) => {
    const { trackFetch } = useObservability();
    return trackFetch(url, { ...options, method: 'DELETE' });
  }
};

// Performance measurement decorator
export const measurePerformance = (target, propertyName, descriptor) => {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args) {
    const { trackPerformance } = useObservability();
    const startTime = performance.now();
    
    try {
      const result = originalMethod.apply(this, args);
      
      if (result && typeof result.then === 'function') {
        // Handle async functions
        return result.then(
          (value) => {
            trackPerformance(`${target.constructor.name}.${propertyName}`, startTime);
            return value;
          },
          (error) => {
            trackPerformance(`${target.constructor.name}.${propertyName}`, startTime);
            throw error;
          }
        );
      } else {
        // Handle sync functions
        trackPerformance(`${target.constructor.name}.${propertyName}`, startTime);
        return result;
      }
    } catch (error) {
      trackPerformance(`${target.constructor.name}.${propertyName}`, startTime);
      throw error;
    }
  };
  
  return descriptor;
};

// Cache tracking wrapper
export const createObservableCache = (cacheInstance, cacheName = 'default') => {
  const { trackCacheHit, trackCacheMiss } = useObservability();
  
  return {
    get: (key) => {
      const result = cacheInstance.get(key);
      if (result !== undefined) {
        trackCacheHit(key);
      } else {
        trackCacheMiss(key);
      }
      return result;
    },
    
    set: (key, value, ttl) => {
      return cacheInstance.set(key, value, ttl);
    },
    
    delete: (key) => {
      return cacheInstance.delete(key);
    },
    
    clear: () => {
      return cacheInstance.clear();
    },
    
    has: (key) => {
      return cacheInstance.has(key);
    }
  };
};

// Business event tracker
export const useBusinessTracking = () => {
  const { trackBusinessEvent } = useObservability();
  
  return {
    trackPurchaseFlow: {
      started: (data) => trackBusinessEvent('purchaseStarted', 1),
      productAdded: (productId) => trackBusinessEvent('productAddedToCart', 1),
      cartViewed: () => trackBusinessEvent('cartViewed', 1),
      checkoutStarted: () => trackBusinessEvent('checkoutStarted', 1),
      paymentInfo: () => trackBusinessEvent('paymentInfoEntered', 1),
      completed: (amount) => trackBusinessEvent('purchaseCompleted', amount),
      abandoned: (stage) => trackBusinessEvent('purchaseAbandoned', 1)
    },
    
    trackUserEngagement: {
      sessionStarted: () => trackBusinessEvent('sessionStarted', 1),
      pageViewed: (page) => trackBusinessEvent(`pageViewed_${page}`, 1),
      featureUsed: (feature) => trackBusinessEvent(`featureUsed_${feature}`, 1),
      searchPerformed: (term) => trackBusinessEvent('searchPerformed', 1),
      filterApplied: (filter) => trackBusinessEvent('filterApplied', 1)
    },
    
    trackCustomEvent: (event, value = 1) => trackBusinessEvent(event, value)
  };
};

// Form tracking utilities
export const useFormTracking = (formName) => {
  const { trackUserInteraction, trackBusinessEvent } = useObservability();
  
  return {
    onFieldFocus: (fieldName) => {
      trackUserInteraction('fieldFocus', formName, { fieldName });
    },
    
    onFieldBlur: (fieldName, hasValue) => {
      trackUserInteraction('fieldBlur', formName, { fieldName, hasValue });
    },
    
    onFieldError: (fieldName, error) => {
      trackUserInteraction('fieldError', formName, { fieldName, error });
    },
    
    onFormSubmit: (formData) => {
      trackUserInteraction('formSubmit', formName);
      trackBusinessEvent(`${formName}Submitted`, 1);
    },
    
    onFormAbandoned: (fieldsCompleted, totalFields) => {
      trackUserInteraction('formAbandoned', formName, { 
        completionRate: (fieldsCompleted / totalFields) * 100 
      });
      trackBusinessEvent(`${formName}Abandoned`, 1);
    }
  };
};

// Route/Navigation tracking
export const useRouteTracking = () => {
  const { trackUserInteraction, trackBusinessEvent } = useObservability();
  
  return {
    trackPageView: (path, referrer = null) => {
      trackUserInteraction('pageView', 'navigation', { path, referrer });
      trackBusinessEvent('pageViewed', 1);
    },
    
    trackNavigation: (from, to) => {
      trackUserInteraction('navigation', 'router', { from, to });
    },
    
    trackDeepLink: (path, source) => {
      trackUserInteraction('deepLink', 'navigation', { path, source });
    }
  };
};

// Error boundary with observability
export class ObservabilityErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const { trackError } = this.props;
    if (trackError) {
      trackError(error, {
        component: 'ErrorBoundary',
        errorInfo,
        componentStack: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Algo salió mal
          </h2>
          <p className="text-red-600">
            Ha ocurrido un error inesperado. El incidente ha sido registrado.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Real-time metrics provider
export const ObservabilityProvider = ({ children }) => {
  const observability = useObservability();
  
  useEffect(() => {
    // Initialize real-time monitoring
    observability.trackSystemResources();
    
    // Set up global error handling
    const handleUnhandledRejection = (event) => {
      observability.trackError(new Error(event.reason), {
        type: 'unhandledRejection',
        promise: event.promise
      });
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [observability]);
  
  return children;
};

export default {
  withObservability,
  observableApi,
  measurePerformance,
  createObservableCache,
  useBusinessTracking,
  useFormTracking,
  useRouteTracking,
  ObservabilityErrorBoundary,
  ObservabilityProvider
};
