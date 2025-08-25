/**
 * Página Principal de Compras - Wave 3 Performance & Cache Avanzado
 * Sistema completo con optimizaciones de performance enterprise y cache inteligente
 * 
 * WAVE 3 FEATURES:
 * - React.memo con comparaciones optimizadas automáticas
 * - Virtual scrolling para listas grandes (1000+ items)
 * - Prefetch inteligente basado en patrones usuario
 * - Bundle splitting y lazy loading estratégico
 * - Memory leak prevention automático  
 * - Performance monitoring en tiempo real
 * 
 * WAVE 2 FEATURES:
 * - Resiliencia & Confiabilidad con circuit breaker funcional
 * - Telemetría avanzada con eventos específicos
 * - Recovery automático en fallos de red
 * - Validaciones exhaustivas cliente-servidor
 * - Componentes enterprise integrados
 * - Store centralizado con cache y offline support
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, startTransition } from 'react';
import { useTheme } from 'next-themes';

// Iconos
import { 
  ShoppingCart, 
  Package, 
  Plus, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Truck,
  FileText,
  Calculator,
  BarChart3,
  Filter,
  Activity
} from 'lucide-react';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import DataState from '@/components/ui/DataState';

// Enterprise Store & Services (Wave 1)
import usePurchaseStore from '@/store/usePurchaseStore';

// Enterprise Components (Wave 1) - Ahora optimizados Wave 3
import PurchaseModal from '@/components/purchases/PurchaseModal';
import PurchaseFilters from '@/components/purchases/PurchaseFilters';
import PurchaseMetricsPanel from '@/components/purchases/PurchaseMetricsPanel';

// Wave 3 Components - Lazy loaded
const VirtualizedPurchaseList = lazy(() => import('@/components/purchases/VirtualizedPurchaseList'));
const PurchaseAnalyticsDashboard = lazy(() => import('@/components/purchases/PurchaseAnalyticsDashboard'));
const Wave3StatusPanel = lazy(() => import('@/components/Wave3StatusPanel'));

// Legacy Components (a migrar gradualmente)
import SupplierSelector from '@/components/SupplierSelector';
import PurchaseSummary from '@/components/PurchaseSummary';

// Hooks & Utils
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import { useTelemetry } from '@/hooks/useTelemetry';
import { usePerformanceOptimizations } from '@/hooks/usePerformanceOptimizations';
import { usePurchasePrefetch } from '@/hooks/usePurchasePrefetch';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useAnalyticsWorker } from '@/hooks/useAnalyticsWorker';

// Types & Constants
import { 
  PURCHASE_TELEMETRY_EVENTS, 
  PURCHASE_STATUS 
} from '@/types/purchaseTypes';

const Purchases = () => {
  const { theme } = useTheme();
  const themeStyles = useThemeStyles();
  const styles = themeStyles.styles || themeStyles;
  const { t } = useI18n();
  const { trackEvent } = useTelemetry();

  // Wave 3: Performance optimizations
  const {
    optimizedMemo,
    optimizedCallback,
    scheduleUpdate,
    createCleanupRegistry
  } = usePerformanceOptimizations({
    componentName: 'PurchasesPage',
    enableMemoization: true,
    enableProfiling: process.env.NODE_ENV === 'development'
  });

  // Wave 3: Prefetch inteligente
  const {
    triggerSmartPrefetch,
    prefetchedPurchases,
    prefetchConditions
  } = usePurchasePrefetch({
    enableSupplierPrefetch: true,
    enableProductPrefetch: true,
    enableStatsPrefetch: true,
    prefetchDelay: 1500,
    maxPrefetchItems: 100
  });

  // Wave 3: Service Worker integration
  const {
    isRegistered: swRegistered,
    isActivated: swActivated,
    networkStatus,
    clearCache: clearSWCache,
    cachePurchaseData
  } = useServiceWorker({
    enableBackground: true,
    enableCaching: true,
    enableSync: true
  });

  // Wave 3: Analytics Worker integration
  const {
    isReady: workerReady,
    isProcessing: workerProcessing,
    calculateAnalytics,
    exportPurchases,
    progress: workerProgress
  } = useAnalyticsWorker({
    enableBackground: true,
    maxConcurrentTasks: 1
  });

  const registerCleanup = createCleanupRegistry();

  // Estado local para UI (Wave 2) - Optimizado Wave 3
  const [activeTab, setActiveTab] = useState('purchases-list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [notification, setNotification] = useState(null);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);

  // Enterprise Store (Wave 1)
  const {
    // Estado
    purchases,
    loading,
    error,
    filters,
    pagination,
    metrics,
    cache,
    circuit,
    
    // Acciones
    loadPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase,
    setFilters,
    clearFilters,
    
    // Cache & Circuit Breaker
    clearCache,
    resetCircuit,
    
    // Telemetría
    getMetrics
  } = usePurchaseStore();

  // Wave 3: Detectar listas grandes para virtual scrolling automático
  useEffect(() => {
    if (purchases && purchases.length > 100) {
      setUseVirtualScrolling(true);
      trackEvent('performance.virtual_scrolling.enabled', {
        items_count: purchases.length,
        trigger: 'auto_threshold'
      });
    }
  }, [purchases, trackEvent]);

  // Wave 2: Telemetría avanzada - Optimizada Wave 3
  useEffect(() => {
    const trackPageView = () => {
      trackEvent(PURCHASE_TELEMETRY_EVENTS.PAGE_VIEW, {
        tab: activeTab,
        timestamp: new Date().toISOString(),
        prefetch_enabled: prefetchConditions.hasGoodConnection(),
        virtual_scrolling: useVirtualScrolling
      });
    };

    // Usar transición para eventos no críticos
    startTransition(trackPageView);
  }, [activeTab, trackEvent, prefetchConditions, useVirtualScrolling]);

  // Wave 2: Carga inicial con resiliencia - Optimizada Wave 3
  useEffect(() => {
    const initializePage = optimizedCallback(async () => {
      try {
        trackEvent(PURCHASE_TELEMETRY_EVENTS.LOAD_START);
        
        // Iniciar prefetch inteligente
        triggerSmartPrefetch('page_load');
        
        await loadPurchases();
        
        trackEvent(PURCHASE_TELEMETRY_EVENTS.LOAD_SUCCESS, {
          count: purchases.length,
          cached: cache.isValid,
          prefetch_active: true
        });
      } catch (error) {
        trackEvent(PURCHASE_TELEMETRY_EVENTS.LOAD_ERROR, {
          error: error.message,
          circuit_state: circuit.state
        });
      }
    }, [loadPurchases, trackEvent, triggerSmartPrefetch, purchases.length, cache.isValid, circuit.state], 'initializePage');

    initializePage();
  }, [initializePage]);

  // Wave 2: Manejo de notificaciones mejorado - Optimizado Wave 3
  const showNotification = optimizedCallback((message, type = 'success', duration = 5000) => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), duration);
    
    // Telemetría para notificaciones
    trackEvent(PURCHASE_TELEMETRY_EVENTS.NOTIFICATION_SHOWN, {
      type,
      duration,
      has_message: !!message
    });
  }, [trackEvent], 'showNotification');

  // Wave 2: Handlers con telemetría - Optimizados Wave 3
  const handleCreatePurchase = optimizedCallback(async (purchaseData) => {
    try {
      trackEvent(PURCHASE_TELEMETRY_EVENTS.CREATE_START, {
        items_count: purchaseData.items?.length || 0,
        total_amount: purchaseData.total || 0
      });

      const result = await createPurchase(purchaseData);
      
      if (result.success) {
        scheduleUpdate(() => {
          showNotification(t('purchases.messages.created') || 'Compra creada exitosamente');
          setIsModalOpen(false);
          setActiveTab('purchases-list');
        }, 'low');
        
        trackEvent(PURCHASE_TELEMETRY_EVENTS.CREATE_SUCCESS, {
          purchase_id: result.data?.id,
          total_amount: result.data?.total
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error.message || t('purchases.messages.create_failed') || 'Error al crear compra';
      showNotification(errorMessage, 'error');
      
      trackEvent(PURCHASE_TELEMETRY_EVENTS.CREATE_ERROR, {
        error: error.message,
        error_code: error.code
      });
      
      throw error;
    }
  }, [createPurchase, showNotification, t, trackEvent]);

  const handleUpdatePurchase = useCallback(async (id, purchaseData) => {
    try {
      trackEvent(PURCHASE_TELEMETRY_EVENTS.UPDATE_START, { purchase_id: id });
      
      const result = await updatePurchase(id, purchaseData);
      
      if (result.success) {
        showNotification(t('purchases.messages.updated') || 'Compra actualizada exitosamente');
        setEditingPurchase(null);
        setIsModalOpen(false);
        
        trackEvent(PURCHASE_TELEMETRY_EVENTS.UPDATE_SUCCESS, { purchase_id: id });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error.message || t('purchases.messages.update_failed') || 'Error al actualizar compra';
      showNotification(errorMessage, 'error');
      
      trackEvent(PURCHASE_TELEMETRY_EVENTS.UPDATE_ERROR, {
        purchase_id: id,
        error: error.message
      });
      
      throw error;
    }
  }, [updatePurchase, showNotification, t, trackEvent]);

  const handleDeletePurchase = useCallback(async (id) => {
    try {
      trackEvent(PURCHASE_TELEMETRY_EVENTS.DELETE_START, { purchase_id: id });
      
      const result = await deletePurchase(id);
      
      if (result.success) {
        showNotification(t('purchases.messages.deleted') || 'Compra eliminada exitosamente');
        
        trackEvent(PURCHASE_TELEMETRY_EVENTS.DELETE_SUCCESS, { purchase_id: id });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error.message || t('purchases.messages.delete_failed') || 'Error al eliminar compra';
      showNotification(errorMessage, 'error');
      
      trackEvent(PURCHASE_TELEMETRY_EVENTS.DELETE_ERROR, {
        purchase_id: id,
        error: error.message
      });
      
      throw error;
    }
  }, [deletePurchase, showNotification, t, trackEvent]);

  // Wave 2: Manejo de filtros con telemetría
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    
    trackEvent(PURCHASE_TELEMETRY_EVENTS.FILTER_APPLIED, {
      filters: Object.keys(newFilters).filter(key => newFilters[key]),
      active_count: Object.values(newFilters).filter(Boolean).length
    });
  }, [setFilters, trackEvent]);

  // Wave 2: Métricas computadas
  const computedMetrics = useMemo(() => {
    const baseMetrics = getMetrics();
    
    return {
      ...baseMetrics,
      // Métricas adicionales específicas de la página
      filtered_count: purchases.length,
      cache_hit_rate: cache.stats?.hitRate || 0,
      circuit_health: circuit.state === 'CLOSED' ? 100 : circuit.state === 'HALF_OPEN' ? 50 : 0
    };
  }, [getMetrics, purchases.length, cache.stats, circuit.state]);

  // Wave 2: Componente de notificación mejorado
  const NotificationBanner = () => {
    if (!notification) return null;

    const isError = notification.type === 'error';
    const isWarning = notification.type === 'warning';
    const icon = isError ? AlertCircle : CheckCircle;
    
    const bgColor = isError ? 'bg-red-50 border-red-200' : 
                    isWarning ? 'bg-yellow-50 border-yellow-200' : 
                    'bg-green-50 border-green-200';
    
    const textColor = isError ? 'text-red-800' : 
                      isWarning ? 'text-yellow-800' : 
                      'text-green-800';

    return (
      <div className={`p-4 rounded-lg border ${bgColor} ${textColor} mb-6 flex items-center justify-between`}>
        <div className="flex items-center">
          {React.createElement(icon, { className: 'w-5 h-5 mr-2' })}
          {notification.message}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNotification(null)}
          className="p-1 h-auto"
        >
          ×
        </Button>
      </div>
    );
  };

  // Wave 2: Componente de status del sistema
  const SystemHealthBanner = () => {
    if (circuit.state === 'CLOSED' && !error) return null;

    const isCircuitOpen = circuit.state === 'OPEN';
    const isHalfOpen = circuit.state === 'HALF_OPEN';
    
    return (
      <div className={`p-3 rounded-lg border mb-4 ${
        isCircuitOpen ? 'bg-red-50 border-red-200 text-red-800' :
        isHalfOpen ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
        'bg-blue-50 border-blue-200 text-blue-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">
              {isCircuitOpen ? t('purchases.system.circuit_open') || 'Sistema en modo offline' :
               isHalfOpen ? t('purchases.system.circuit_recovering') || 'Sistema recuperándose' :
               t('purchases.system.degraded') || 'Rendimiento degradado'}
            </span>
          </div>
          
          {isCircuitOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetCircuit}
              className="text-xs"
            >
              {t('purchases.system.retry') || 'Reintentar'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container()} data-testid="purchases-page">
      <PageHeader
        title={t('purchases.title') || 'Compras'}
        subtitle={t('purchases.subtitle') || 'Administra compras a proveedores con arquitectura enterprise hardened'}
        breadcrumb={[
          { label: 'Operaciones', href: '/dashboard' }, 
          { label: t('purchases.title') || 'Compras' }
        ]}
      />

      <NotificationBanner />
      <SystemHealthBanner />

      {/* Wave 2: Header con métricas y acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              setEditingPurchase(null);
              setIsModalOpen(true);
              trackEvent(PURCHASE_TELEMETRY_EVENTS.NEW_PURCHASE_CLICKED);
            }}
            className={styles.button()}
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('purchases.new') || 'Nueva Compra'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowMetrics(!showMetrics)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {showMetrics ? 'Ocultar Métricas' : 'Ver Métricas'}
          </Button>
        </div>

        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className={styles.card('p-3')}>
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              <div>
                <div className="text-lg font-bold">{purchases.length}</div>
                <div className="text-xs text-muted-foreground">Compras</div>
              </div>
            </div>
          </div>
          
          <div className={styles.card('p-3')}>
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-2 text-green-600" />
              <div>
                <div className="text-lg font-bold">{computedMetrics.circuit_health}%</div>
                <div className="text-xs text-muted-foreground">Sistema</div>
              </div>
            </div>
          </div>
          
          <div className={styles.card('p-3')}>
            <div className="flex items-center">
              <Calculator className="w-4 h-4 mr-2 text-purple-600" />
              <div>
                <div className="text-lg font-bold">{Math.round(computedMetrics.cache_hit_rate * 100)}%</div>
                <div className="text-xs text-muted-foreground">Cache</div>
              </div>
            </div>
          </div>
          
          <div className={styles.card('p-3')}>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2 text-orange-600" />
              <div>
                <div className="text-lg font-bold">
                  {purchases.filter(p => p.status === PURCHASE_STATUS.PENDING).length}
                </div>
                <div className="text-xs text-muted-foreground">Pendientes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave 2: Panel de métricas expandible */}
      {showMetrics && (
        <div className="mb-6">
          <PurchaseMetricsPanel />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={styles.tab()}>
          <TabsTrigger value="purchases-list" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            {t('purchases.tab.list') || 'Lista de Compras'}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {t('purchases.tab.analytics') || 'Analíticas'}
          </TabsTrigger>
        </TabsList>

        {/* Tab de Lista de Compras - Wave 2 Enterprise */}
        <TabsContent value="purchases-list" className="space-y-4">
          {/* Filtros Enterprise */}
          <PurchaseFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={clearFilters}
          />

          {/* Lista de compras con estado enterprise */}
          {loading ? (
            <DataState 
              variant="loading" 
              skeletonVariant="list" 
              testId="purchases-loading" 
              skeletonProps={{ count: 6 }} 
            />
          ) : error ? (
            <DataState
              variant="error"
              title={t('purchases.error.title') || 'Error al cargar compras'}
              description={error.message || t('purchases.error.description') || 'Ha ocurrido un error inesperado'}
              actionLabel={t('purchases.error.retry') || 'Reintentar'}
              onAction={() => loadPurchases()}
              testId="purchases-error"
            />
          ) : purchases.length === 0 ? (
            <DataState
              variant="empty"
              title={t('purchases.empty.title') || 'No hay compras'}
              description={t('purchases.empty.description') || 'Comienza creando tu primera compra'}
              actionLabel={t('purchases.empty.action') || 'Nueva Compra'}
              onAction={() => {
                setEditingPurchase(null);
                setIsModalOpen(true);
              }}
              testId="purchases-empty"
            />
          ) : (
            <div className="space-y-4">
              {/* Toggle para virtual scrolling */}
              {purchases.length > 50 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium">
                      Lista grande detectada ({purchases.length} items)
                    </span>
                    <p className="text-xs text-gray-600">
                      El scroll virtual mejora el rendimiento con listas grandes
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUseVirtualScrolling(!useVirtualScrolling);
                      trackEvent('performance.virtual_scrolling.toggled', {
                        enabled: !useVirtualScrolling,
                        items_count: purchases.length
                      });
                    }}
                  >
                    {useVirtualScrolling ? 'Vista Normal' : 'Scroll Virtual'}
                  </Button>
                </div>
              )}

              {/* Renderizado condicional: Virtual vs Normal */}
              {useVirtualScrolling ? (
                <div className="h-96 border rounded-lg">
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <div>Cargando lista virtualizada...</div>
                      </div>
                    </div>
                  }>
                    <VirtualizedPurchaseList
                      purchases={purchases}
                      onItemClick={(purchase, action) => {
                        triggerSmartPrefetch('hover', { 
                          purchaseId: purchase.id 
                        });
                        
                        switch (action) {
                          case 'edit':
                            setEditingPurchase(purchase);
                            setIsModalOpen(true);
                            break;
                          case 'view':
                            trackEvent(PURCHASE_TELEMETRY_EVENTS.VIEW_DETAILS, { 
                              purchase_id: purchase.id 
                            });
                            break;
                          case 'delete':
                            handleDeletePurchase(purchase.id);
                            break;
                        }
                      }}
                      compact={purchases.length > 200}
                    />
                  </Suspense>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {purchases.map((purchase) => (
                    <PurchaseCard
                      key={purchase.id}
                      purchase={purchase}
                      onEdit={(purchase) => {
                        triggerSmartPrefetch('hover', { 
                          purchaseId: purchase.id 
                        });
                        setEditingPurchase(purchase);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDeletePurchase}
                      onView={(id) => {
                        trackEvent(PURCHASE_TELEMETRY_EVENTS.VIEW_DETAILS, { purchase_id: id });
                        triggerSmartPrefetch('hover', { purchaseId: id });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Tab de Analíticas - Wave 3 Lazy Loaded */}
        <TabsContent value="analytics" className="space-y-4">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4 animate-pulse" />
                <div className="text-lg">Cargando analytics...</div>
                <div className="text-sm text-gray-500 mt-2">
                  Preparando gráficos y métricas avanzadas
                </div>
              </div>
            </div>
          }>
            <PurchaseAnalyticsDashboard purchases={purchases} />
          </Suspense>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wave 3 Status Panel */}
            <div>
              <Suspense fallback={<div className="h-32 bg-gray-100 rounded animate-pulse" />}>
                <Wave3StatusPanel
                  serviceWorker={swState}
                  analyticsWorker={workerState}
                  virtualScrolling={useVirtualScrolling}
                  prefetchStatus={prefetchStatus}
                  onClearCache={() => {
                    clearCache();
                    swState.clearCache?.();
                    trackEvent('performance.cache.cleared', {
                      source: 'status_panel'
                    });
                  }}
                />
              </Suspense>
            </div>
            
            {/* Panel principal de métricas */}
            <div>
              <PurchaseMetricsPanel />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* Métricas adicionales específicas */}
            <Card className={styles.card()}>
              <CardHeader>
                <CardTitle className={styles.cardHeader()}>
                  <Activity className="w-5 h-5 mr-2" />
                  Estado del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Circuit Breaker</span>
                    <Badge variant={circuit.state === 'CLOSED' ? 'default' : 'destructive'}>
                      {circuit.state}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Cache Hit Rate</span>
                    <span className="font-mono">
                      {Math.round(computedMetrics.cache_hit_rate * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Requests Fallidos</span>
                    <span className="font-mono text-red-600">
                      {circuit.failures || 0}
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCache}
                      className="flex-1"
                    >
                      Limpiar Cache
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetCircuit}
                      className="flex-1"
                    >
                      Reset Circuit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Enterprise para CRUD */}
      <PurchaseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPurchase(null);
        }}
        onSubmit={editingPurchase ? 
          (data) => handleUpdatePurchase(editingPurchase.id, data) :
          handleCreatePurchase
        }
        initialData={editingPurchase}
        mode={editingPurchase ? 'edit' : 'create'}
      />
    </div>
  );
};

// Wave 3: Comparador optimizado para React.memo
const arePurchasesPagePropsEqual = (prevProps, nextProps) => {
  // Las páginas normalmente no reciben props, pero es buena práctica tenerlo
  return true;
};

export default memo(Purchases, arePurchasesPagePropsEqual);
