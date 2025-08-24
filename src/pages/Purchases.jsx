/**
 * Página Principal de Compras - Wave 2 Enterprise Architecture
 * Implementa el sistema completo de gestión de compras con arquitectura enterprise hardened
 * 
 * WAVE 2 FEATURES:
 * - Resiliencia & Confiabilidad con circuit breaker funcional
 * - Telemetría avanzada con eventos específicos
 * - Recovery automático en fallos de red
 * - Validaciones exhaustivas cliente-servidor
 * - Componentes enterprise integrados
 * - Store centralizado con cache y offline support
 * 
 * @since Wave 2 - Resiliencia & Confiabilidad
 * @author Sistema ERP
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { usePurchaseStore } from '@/store/usePurchaseStore';

// Enterprise Components (Wave 1)
import PurchaseModal from '@/components/purchases/PurchaseModal';
import PurchaseCard from '@/components/purchases/PurchaseCard';
import PurchaseFilters from '@/components/purchases/PurchaseFilters';
import PurchaseMetricsPanel from '@/components/purchases/PurchaseMetricsPanel';

// Legacy Components (a migrar gradualmente)
import SupplierSelector from '@/components/SupplierSelector';
import PurchaseSummary from '@/components/PurchaseSummary';

// Hooks & Utils
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import { useTelemetry } from '@/hooks/useTelemetry';

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

  // Estado local para UI (Wave 2)
  const [activeTab, setActiveTab] = useState('purchases-list'); // Cambiar default a lista
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [notification, setNotification] = useState(null);

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

  // Wave 2: Telemetría avanzada
  useEffect(() => {
    trackEvent(PURCHASE_TELEMETRY_EVENTS.PAGE_VIEW, {
      tab: activeTab,
      timestamp: new Date().toISOString()
    });
  }, [activeTab, trackEvent]);

  // Wave 2: Carga inicial con resiliencia
  useEffect(() => {
    const initializePage = async () => {
      try {
        trackEvent(PURCHASE_TELEMETRY_EVENTS.LOAD_START);
        await loadPurchases();
        trackEvent(PURCHASE_TELEMETRY_EVENTS.LOAD_SUCCESS, {
          count: purchases.length,
          cached: cache.isValid
        });
      } catch (error) {
        trackEvent(PURCHASE_TELEMETRY_EVENTS.LOAD_ERROR, {
          error: error.message,
          circuit_state: circuit.state
        });
      }
    };

    initializePage();
  }, [loadPurchases, trackEvent]);

  // Wave 2: Manejo de notificaciones mejorado
  const showNotification = useCallback((message, type = 'success', duration = 5000) => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), duration);
    
    // Telemetría para notificaciones
    trackEvent(PURCHASE_TELEMETRY_EVENTS.NOTIFICATION_SHOWN, {
      type,
      duration,
      has_message: !!message
    });
  }, [trackEvent]);

  // Wave 2: Handlers con telemetría
  const handleCreatePurchase = useCallback(async (purchaseData) => {
    try {
      trackEvent(PURCHASE_TELEMETRY_EVENTS.CREATE_START, {
        items_count: purchaseData.items?.length || 0,
        total_amount: purchaseData.total || 0
      });

      const result = await createPurchase(purchaseData);
      
      if (result.success) {
        showNotification(t('purchases.messages.created') || 'Compra creada exitosamente');
        setIsModalOpen(false);
        setActiveTab('purchases-list');
        
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchases.map((purchase) => (
                <PurchaseCard
                  key={purchase.id}
                  purchase={purchase}
                  onEdit={(purchase) => {
                    setEditingPurchase(purchase);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeletePurchase}
                  onView={(id) => {
                    trackEvent(PURCHASE_TELEMETRY_EVENTS.VIEW_DETAILS, { purchase_id: id });
                    // Aquí iría la navegación a detalle
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab de Analíticas - Wave 2 */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel principal de métricas */}
            <div className="lg:col-span-2">
              <PurchaseMetricsPanel />
            </div>
            
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

export default Purchases;
