/**
 * Página de Gestión de Horarios (Schedules)
 * Enfoque de herramientas de acción directa - sin cargas automáticas
 * El usuario ejecuta acciones específicas y ve resultados inmediatos
 */

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, RefreshCw, CheckCircle, XCircle, AlertCircle, Zap, CalendarDays, Settings, Search, Info, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/ui/PageHeader';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';

// Stores
import useScheduleStore from '@/store/useScheduleStore';
import useProductStore from '@/store/useProductStore';

const Schedules = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  
  // Estados del store
  const {
    schedules,
    loading,
    error,
    updateScheduleAvailability,
    generateDailySchedules,
    generateSchedulesForDate,
    generateSchedulesForNextDays,
    clearError
  } = useScheduleStore();

  const { products } = useProductStore();

  // Estados locales para acciones
  const [actionResults, setActionResults] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  
  // Estados para herramientas específicas
  const [dateGeneration, setDateGeneration] = useState({
    targetDate: '',
    isGenerating: false
  });
  
  const [bulkGeneration, setBulkGeneration] = useState({
    days: 7,
    isGenerating: false
  });

  const [scheduleQuery, setScheduleQuery] = useState({
    productId: '',
    date: '',
    isQuerying: false,
    results: []
  });

  // Nuevo estado para consulta de horarios disponibles generales
  const [generalQuery, setGeneralQuery] = useState({
    date: new Date().toISOString().split('T')[0], // Hoy por defecto
    isQuerying: false,
    results: null,
    hasChecked: false
  });

  // Estado para el modal de detalles de horarios
  const [schedulesModal, setSchedulesModal] = useState({
    isOpen: false,
    schedules: [],
    date: '',
    title: ''
  });


  // Helper para agregar resultados de acciones
  const addActionResult = (type, success, message, data = null) => {
    const result = {
      id: Date.now(),
      type,
      success,
      message,
      data,
      timestamp: new Date()
    };
    setActionResults(prev => [result, ...prev.slice(0, 9)]); // Mantener últimos 10
  };

  // Acción 1: Generar horarios diarios
  const handleGenerateDaily = async () => {
    setActionLoading(prev => ({ ...prev, daily: true }));
    try {
      const result = await generateDailySchedules();
      addActionResult(
        'generate_daily', 
        true, 
        'Horarios diarios generados exitosamente',
        result
      );
    } catch (error) {
      addActionResult(
        'generate_daily', 
        false, 
        `Error generando horarios diarios: ${error.message}`
      );
    } finally {
      setActionLoading(prev => ({ ...prev, daily: false }));
    }
  };

  // Acción 2: Generar para fecha específica
  const handleGenerateForDate = async () => {
    if (!dateGeneration.targetDate) {
      addActionResult('generate_date', false, 'Selecciona una fecha primero');
      return;
    }

    setDateGeneration(prev => ({ ...prev, isGenerating: true }));
    try {
      const result = await generateSchedulesForDate(dateGeneration.targetDate);
      addActionResult(
        'generate_date', 
        true, 
        `Horarios generados para ${dateGeneration.targetDate}`,
        result
      );
    } catch (error) {
      addActionResult(
        'generate_date', 
        false, 
        `Error generando horarios para fecha: ${error.message}`
      );
    } finally {
      setDateGeneration(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Acción 3: Generar en lote
  const handleBulkGenerate = async () => {
    setBulkGeneration(prev => ({ ...prev, isGenerating: true }));
    try {
      const result = await generateSchedulesForNextDays(bulkGeneration.days);
      addActionResult(
        'bulk_generate', 
        true, 
        `Horarios generados para los próximos ${bulkGeneration.days} días`,
        result
      );
    } catch (error) {
      addActionResult(
        'bulk_generate', 
        false, 
        `Error en generación en lote: ${error.message}`
      );
    } finally {
      setBulkGeneration(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // Acción 4: Consultar horarios específicos
  const handleQuerySchedules = async () => {
    if (!scheduleQuery.productId || !scheduleQuery.date) {
      addActionResult('query', false, 'Selecciona producto y fecha');
      return;
    }

    setScheduleQuery(prev => ({ ...prev, isQuerying: true, results: [] }));
    try {
      // Usar el método específico que sabemos que existe
      const scheduleService = (await import('@/services/scheduleService')).scheduleService;
      const result = await scheduleService.getAvailableSchedules(scheduleQuery.productId, scheduleQuery.date);
      
      setScheduleQuery(prev => ({ ...prev, results: result || [] }));
      addActionResult(
        'query', 
        true, 
        `Encontrados ${result?.length || 0} horarios para la consulta`,
        result
      );
    } catch (error) {
      addActionResult(
        'query', 
        false, 
        `Error en consulta: ${error.message}`
      );
    } finally {
      setScheduleQuery(prev => ({ ...prev, isQuerying: false }));
    }
  };

  // Nueva acción: Verificar horarios disponibles para una fecha
  const handleCheckAvailableSchedules = async () => {
    if (!generalQuery.date) {
      addActionResult('check_general', false, 'Selecciona una fecha primero');
      return;
    }

    setGeneralQuery(prev => ({ ...prev, isQuerying: true, results: null }));
    try {
      const scheduleService = (await import('@/services/scheduleService')).scheduleService;
      const today = new Date().toISOString().split('T')[0];
      
      let result;
      // Usar el endpoint optimizado para HOY
      if (generalQuery.date === today) {
        result = await scheduleService.getTodaySchedules();
      } else {
        // Para otras fechas usar el endpoint general
        result = await scheduleService.getAvailableSchedulesAll({ 
          date: generalQuery.date, 
          limit: 20 
        });
      }
      
      setGeneralQuery(prev => ({ 
        ...prev, 
        results: result,
        hasChecked: true
      }));
      
      const hasSchedules = result.count > 0;
      addActionResult(
        'check_general', 
        hasSchedules, 
        hasSchedules 
          ? `${result.count} horarios ${generalQuery.date === today ? 'programados para hoy' : `disponibles para ${generalQuery.date}`}`
          : result.message || `No hay horarios generados para ${generalQuery.date}`,
        result
      );
    } catch (error) {
      setGeneralQuery(prev => ({ 
        ...prev, 
        results: null,
        hasChecked: true
      }));
      addActionResult(
        'check_general', 
        false, 
        `Error verificando horarios: ${error.message}`
      );
    } finally {
      setGeneralQuery(prev => ({ ...prev, isQuerying: false }));
    }
  };

  // Cargar productos si es necesario (acción explícita)
  const handleLoadProducts = async () => {
    setActionLoading(prev => ({ ...prev, products: true }));
    try {
      await useProductStore.getState().fetchProducts();
      addActionResult('load_products', true, `Cargados ${products.length} productos`);
    } catch (error) {
      addActionResult('load_products', false, `Error cargando productos: ${error.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Abrir modal con detalles de horarios (ahora manejado directamente en las cards)
  const handleOpenSchedulesModal = (schedules = null, title = null) => {
    const schedulesToShow = schedules || generalQuery.results?.schedules;
    const modalTitle = title || (generalQuery.date === new Date().toISOString().split('T')[0] 
      ? 'Horarios de Hoy' 
      : `Horarios para ${generalQuery.date}`);
    
    if (schedulesToShow) {
      setSchedulesModal({
        isOpen: true,
        schedules: schedulesToShow,
        date: generalQuery.date,
        title: modalTitle
      });
    }
  };

  // Cerrar modal
  const handleCloseSchedulesModal = () => {
    setSchedulesModal({
      isOpen: false,
      schedules: [],
      date: '',
      title: ''
    });
  };


  const getActionIcon = (type, success) => {
    if (success) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'generate_daily': return 'border-l-blue-500';
      case 'generate_date': return 'border-l-green-500';
      case 'bulk_generate': return 'border-l-purple-500';
      case 'query': return 'border-l-orange-500';
      case 'check_general': return 'border-l-teal-500';
      case 'load_products': return 'border-l-gray-500';
      default: return 'border-l-gray-400';
    }
  };

  // Verificar horarios de hoy al cargar la página
  useEffect(() => {
    const checkTodaySchedules = async () => {
      if (!generalQuery.hasChecked) {
        // Cargar automáticamente los horarios de hoy al iniciar
        await handleCheckAvailableSchedules();
      }
    };
    
    // Pequeño delay para no interferir con la carga inicial
    const timer = setTimeout(checkTodaySchedules, 1000);
    return () => clearTimeout(timer);
  }, []); // Solo al montar el componente

  return (
    <div className={styles.container()} data-testid="schedules-page">
      <PageHeader
        title={t('schedules.title', 'Gestión de Horarios')}
        subtitle={t('schedules.subtitle', 'Consulta disponibilidad y genera horarios para servicios reservables')}
        breadcrumb={[
          { label: t('navigation.operations', 'Operaciones'), href: '/dashboard' }, 
          { label: t('schedules.title', 'Horarios') }
        ]}
        extra={
          <div className="flex gap-2">
            {/* Indicador rápido de estado de hoy */}
            {generalQuery.hasChecked && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">
                {generalQuery.results?.count > 0 ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{generalQuery.results.count} disponibles hoy</span>
                  </>
                ) : (
                  <>
                    <Info className="w-4 h-4 text-amber-500" />
                    <span>Sin horarios hoy</span>
                  </>
                )}
              </div>
            )}
            <Button
              onClick={() => setActionResults([])}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Herramientas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Grid de cards principal - 2 columnas en desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          
          {/* Herramienta 0: Verificar Horarios Disponibles */}
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-teal-500" />
                Verificar Horarios Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Fecha a consultar</label>
                    <Input
                      type="date"
                      value={generalQuery.date}
                      onChange={(e) => setGeneralQuery(prev => ({ ...prev, date: e.target.value, hasChecked: false, results: null }))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleCheckAvailableSchedules}
                      disabled={generalQuery.isQuerying || !generalQuery.date}
                      variant="primary"
                      className="flex items-center gap-2"
                    >
                      {generalQuery.isQuerying ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Consultar
                    </Button>
                  </div>
                </div>

                {/* Mostrar estado de los horarios */}
                {generalQuery.hasChecked && (
                  <div className="p-4 rounded-lg border">
                    {generalQuery.results?.count > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">
                              {generalQuery.results.count} horarios {
                                generalQuery.date === new Date().toISOString().split('T')[0] 
                                  ? 'programados para hoy' 
                                  : `disponibles para ${generalQuery.date}`
                              }
                            </span>
                          </div>
                          <Button
                            onClick={handleOpenSchedulesModal}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver más
                          </Button>
                        </div>
                        
                        {/* Servicios disponibles - agrupados por servicio */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(() => {
                            // Agrupar horarios por servicio
                            const serviceGroups = {};
                            generalQuery.results.schedules?.forEach(schedule => {
                              const serviceName = schedule.product_name;
                              if (!serviceGroups[serviceName]) {
                                serviceGroups[serviceName] = {
                                  name: serviceName,
                                  total: 0,
                                  available: 0,
                                  schedules: []
                                };
                              }
                              serviceGroups[serviceName].total += 1;
                              if (schedule.is_available) serviceGroups[serviceName].available += 1;
                              serviceGroups[serviceName].schedules.push(schedule);
                            });
                            
                            return Object.values(serviceGroups).map((service, index) => (
                              <Card key={index} className={styles.card()}>
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-sm mb-1">{service.name}</h4>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {service.total} horarios
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            {service.available} disponibles
                                          </span>
                                        </div>
                                      </div>
                                      <div className={`w-3 h-3 rounded-full ${
                                        service.available > 0 ? 'bg-green-500' : 'bg-gray-400'
                                      }`}></div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <Badge 
                                        variant={service.available > 0 ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {service.available > 0 ? 'Disponible' : 'Sin disponibilidad'}
                                      </Badge>
                                      
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs"
                                        onClick={() => {
                                          setSchedulesModal({
                                            isOpen: true,
                                            schedules: service.schedules,
                                            date: generalQuery.date,
                                            title: `Horarios de ${service.name}`
                                          });
                                        }}
                                      >
                                        <Eye className="w-3 h-3 mr-1" />
                                        Ver más
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ));
                          })()
                          }
                        </div>
                        
                        {/* Resumen total */}
                        <div className="text-center text-sm text-muted-foreground mt-2">
                          {(() => {
                            const serviceGroups = {};
                            generalQuery.results.schedules?.forEach(schedule => {
                              const serviceName = schedule.product_name;
                              if (!serviceGroups[serviceName]) serviceGroups[serviceName] = true;
                            });
                            const totalServices = Object.keys(serviceGroups).length;
                            return `${totalServices} servicios con ${generalQuery.results.schedules?.length} horarios totales`;
                          })()
                          }
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <Info className="w-5 h-5" />
                        <div>
                          <div className="font-medium">No hay horarios generados para {generalQuery.date}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Utiliza las herramientas de generación para crear horarios para esta fecha.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Herramienta 1: Generación Rápida */}
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-500" />
                Generación Rápida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleGenerateDaily}
                  disabled={actionLoading.daily}
                  variant="primary"
                  className="flex items-center gap-2 h-12"
                >
                  {actionLoading.daily ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  Generar Horarios Hoy
                </Button>

                {products.length === 0 ? (
                  <Button
                    onClick={handleLoadProducts}
                    disabled={actionLoading.products}
                    variant="secondary"
                    className="flex items-center gap-2 h-12"
                  >
                    {actionLoading.products ? (
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Cargar Productos
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    {products.length} productos disponibles
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Herramienta 2: Generación por Fecha */}
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-green-500" />
                Generar por Fecha Específica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="date"
                  value={dateGeneration.targetDate}
                  onChange={(e) => setDateGeneration(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="flex-1"
                  min={new Date().toISOString().split('T')[0]}
                />
                <Button
                  onClick={handleGenerateForDate}
                  disabled={dateGeneration.isGenerating || !dateGeneration.targetDate}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {dateGeneration.isGenerating ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Generar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Herramienta 3: Generación en Lote */}
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-500" />
                Generación en Lote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <select
                  value={bulkGeneration.days}
                  onChange={(e) => setBulkGeneration(prev => ({ ...prev, days: parseInt(e.target.value) }))}
                  className="flex-1 p-2 border rounded"
                >
                  <option value={7}>Próximos 7 días</option>
                  <option value={14}>Próximos 14 días</option>
                  <option value={30}>Próximos 30 días</option>
                </select>
                <Button
                  onClick={handleBulkGenerate}
                  disabled={bulkGeneration.isGenerating}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  {bulkGeneration.isGenerating ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Generar Lote
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Herramienta 4: Consulta Específica */}
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Consultar Horarios Existentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Producto/Servicio</label>
                  <select
                    value={scheduleQuery.productId}
                    onChange={(e) => setScheduleQuery(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Seleccionar...</option>
                    {/* Opción temporal: IDs conocidos del sistema */}
                    <optgroup label="Servicios Conocidos (Temporal)">
                      <option value="BT_Cancha_1_xyz123abc">Cancha de Beach Tennis 1</option>
                      <option value="BT_Cancha_2_def456ghi">Cancha de Beach Tennis 2</option>
                    </optgroup>
                    {/* Servicios cargados dinámicamente */}
                    {products.length > 0 && (
                      <optgroup label="Servicios Cargados">
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scheduleQuery.productId?.startsWith('BT_Cancha_') ? 
                      'Usando ID directo del sistema' : 
                      'Selecciona un servicio para consultar sus horarios'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha</label>
                  <Input
                    type="date"
                    value={scheduleQuery.date}
                    onChange={(e) => setScheduleQuery(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>
              <Button
                onClick={handleQuerySchedules}
                disabled={scheduleQuery.isQuerying || !scheduleQuery.productId || !scheduleQuery.date}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {scheduleQuery.isQuerying ? (
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Consultar Horarios
              </Button>

              {/* Mostrar resultados de consulta */}
              {scheduleQuery.results.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Horarios encontrados:</p>
                    <Badge variant="outline" className="text-xs">
                      {scheduleQuery.productId?.startsWith('BT_Cancha_') ? 'ID Directo' : 'API'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {scheduleQuery.results.map((schedule, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{new Date(schedule.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        <Badge variant={schedule.is_available ? 'default' : 'secondary'}>
                          {schedule.is_available ? 'Disponible' : 'Ocupado'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          </div>
        </div>
          
        {/* Panel de Resultados de Acciones */}
        <div className="lg:col-span-1">
          <Card className={styles.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Resultados de Acciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Los resultados de tus acciones aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {actionResults.map(result => (
                    <div 
                      key={result.id} 
                      className={`p-3 border-l-4 rounded-r-lg bg-gray-50 dark:bg-gray-800 ${getActionColor(result.type)}`}
                    >
                      <div className="flex items-start gap-2">
                        {getActionIcon(result.type, result.success)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium break-words">{result.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {result.timestamp.toLocaleTimeString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Detalles de Horarios */}
      {schedulesModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseSchedulesModal}
          />
          
          {/* Modal Content */}
          <Card className={`relative w-full max-w-4xl max-h-[90vh] ${styles.card()} shadow-2xl`}>
            {/* Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{schedulesModal.title}</CardTitle>
                <Button
                  onClick={handleCloseSchedulesModal}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Se encontraron {schedulesModal.schedules.length} horarios para {schedulesModal.date}
              </p>
            </CardHeader>
            
            {/* Content */}
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Grid de horarios completo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {schedulesModal.schedules.map((schedule, index) => (
                  <Card key={index} className={styles.card()}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-sm flex-1 pr-2">{schedule.product_name}</h3>
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            schedule.is_available ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(schedule.start_time).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} - {new Date(schedule.end_time).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(schedule.start_time).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {Math.round((new Date(schedule.end_time) - new Date(schedule.start_time)) / (1000 * 60))} min
                          </span>
                          <Badge 
                            variant={schedule.is_available ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {schedule.is_available ? 'Disponible' : 'Ocupado'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Resumen */}
              <Card className={styles.card()}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{schedulesModal.schedules.length}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {schedulesModal.schedules.filter(s => s.is_available).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Disponibles</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-600">
                        {schedulesModal.schedules.filter(s => !s.is_available).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Ocupados</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {[...new Set(schedulesModal.schedules.map(s => s.product_name))].length}
                      </div>
                      <div className="text-xs text-muted-foreground">Servicios</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Schedules;