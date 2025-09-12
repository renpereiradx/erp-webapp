/**
 * Página de Transacciones de Precio v1.0 - Septiembre 2025
 * Sistema completo de gestión de transacciones de precio con auditoría
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Eye, DollarSign, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle, Calculator, Calendar, Filter,
  RefreshCw, BarChart3, FileText, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductSearchInput from '@/components/ui/ProductSearchInput';
import DataState from '@/components/ui/DataState';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { usePriceTransactions } from '@/hooks/usePriceTransactions';

const PriceTransactionsPage = () => {
  const { t } = useI18n();
  const { styles, isNeoBrutalism } = useThemeStyles();
  const {
    loading,
    error,
    registerTransaction,
    getProductHistory,
    validateConsistency,
    getVarianceReport,
    getTransactionTypes,
    getRecentTransactions,
    clearError,
    calculatePriceChange,
    formatTransactionType,
    interpretConsistencyStatus
  } = usePriceTransactions();

  // Estados principales
  const [activeTab, setActiveTab] = useState('register');
  const [transactionTypes, setTransactionTypes] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [consistencyReports, setConsistencyReports] = useState([]);
  const [varianceReport, setVarianceReport] = useState(null);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showConsistencyModal, setShowConsistencyModal] = useState(false);
  const [showVarianceModal, setShowVarianceModal] = useState(false);

  // Estado del formulario de transacción
  const [formData, setFormData] = useState({
    transaction_type: '',
    new_price: '',
    effective_date: '',
    reference_type: '',
    reference_id: '',
    reason: '',
    cost_factor: '',
    margin_percent: '',
    metadata: {}
  });

  // Estado de filtros para reportes
  const [dateFilters, setDateFilters] = useState({
    date_from: '',
    date_to: '',
    transaction_type: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Cargar tipos de transacciones
      const typesResult = await getTransactionTypes();
      setTransactionTypes(typesResult.description || {});
      
      // Cargar transacciones recientes
      const recentResult = await getRecentTransactions(20);
      setRecentTransactions(recentResult.transactions || recentResult || []);
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  // Handlers del formulario
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        product_name: product.name || product.product_name,
        previous_price: product.price || product.unit_price
      }
    }));
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      alert('Seleccione un producto');
      return;
    }

    try {
      const transactionData = {
        product_id: selectedProduct.id || selectedProduct.product_id,
        transaction_type: formData.transaction_type,
        new_price: parseFloat(formData.new_price),
        effective_date: formData.effective_date || undefined,
        reference_type: formData.reference_type || undefined,
        reference_id: formData.reference_id || undefined,
        reason: formData.reason || undefined,
        cost_factor: formData.cost_factor ? parseFloat(formData.cost_factor) : undefined,
        margin_percent: formData.margin_percent ? parseFloat(formData.margin_percent) : undefined,
        metadata: {
          ...formData.metadata,
          form_submission: true,
          timestamp: new Date().toISOString()
        }
      };

      const result = await registerTransaction(transactionData);
      
      // Resetear formulario
      setFormData({
        transaction_type: '',
        new_price: '',
        effective_date: '',
        reference_type: '',
        reference_id: '',
        reason: '',
        cost_factor: '',
        margin_percent: '',
        metadata: {}
      });
      setSelectedProduct(null);
      
      // Recargar transacciones recientes
      await loadInitialData();
      
      alert('Transacción de precio registrada exitosamente');
    } catch (err) {
      console.error('Error registering transaction:', err);
      alert('Error al registrar transacción: ' + err.message);
    }
  };

  // Handlers de reportes
  const handleLoadProductHistory = async (productId) => {
    try {
      const result = await getProductHistory(productId, 0, 50);
      setProductHistory(result.history || []);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Error loading history:', err);
      alert('Error al cargar historial: ' + err.message);
    }
  };

  const handleValidateConsistency = async () => {
    try {
      const result = await validateConsistency();
      setConsistencyReports(result.reports || []);
      setShowConsistencyModal(true);
    } catch (err) {
      console.error('Error validating consistency:', err);
      alert('Error en validación: ' + err.message);
    }
  };

  const handleLoadVarianceReport = async () => {
    try {
      const result = await getVarianceReport(
        dateFilters.date_from || undefined,
        dateFilters.date_to || undefined,
        dateFilters.transaction_type || undefined
      );
      setVarianceReport(result);
      setShowVarianceModal(true);
    } catch (err) {
      console.error('Error loading variance report:', err);
      alert('Error al cargar reporte: ' + err.message);
    }
  };

  // Funciones de formato
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-PY');
  };

  const getPriceChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPriceChangeIcon = (change) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return DollarSign;
  };

  // Filtrar transacciones
  const filteredTransactions = recentTransactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (transaction.product_id || '').toLowerCase().includes(searchLower) ||
      (transaction.product_name || '').toLowerCase().includes(searchLower) ||
      (transaction.reason || '').toLowerCase().includes(searchLower) ||
      (transaction.transaction_type || '').toLowerCase().includes(searchLower)
    );
  });

  // Estados de carga y error
  if (loading && recentTransactions.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }

  if (error && recentTransactions.length === 0) {
    return (
      <DataState 
        variant="error" 
        title="Error al cargar transacciones"
        message={error}
        onRetry={() => {
          clearError();
          loadInitialData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Transacciones de Precio</h1>
            <p className="text-muted-foreground">Sistema completo de auditoría de precios</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setActiveTab('register')} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Transacción
          </Button>
          <Button onClick={handleValidateConsistency} variant="outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Validar Consistencia
          </Button>
          <Button onClick={() => setActiveTab('reports')} variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reportes
          </Button>
        </div>
      </div>

      {/* Pestañas principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="register">Registrar Transacción</TabsTrigger>
          <TabsTrigger value="recent">Transacciones Recientes</TabsTrigger>
          <TabsTrigger value="reports">Reportes y Análisis</TabsTrigger>
          <TabsTrigger value="consistency">Validación</TabsTrigger>
        </TabsList>

        {/* Registro de Transacción */}
        <TabsContent value="register" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Registrar Nueva Transacción de Precio
              </CardTitle>
              <CardDescription>
                Registre un cambio de precio con trazabilidad completa y metadatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTransaction} className="space-y-6">
                {/* Selector de producto */}
                <div>
                  <Label htmlFor="product">Producto</Label>
                  <ProductSearchInput
                    onProductSelect={handleProductSelect}
                    selectedProduct={selectedProduct}
                    placeholder="Buscar producto por ID, nombre o código..."
                  />
                  {selectedProduct && (
                    <div className={`${styles.card()} p-4 mt-2 bg-blue-50`}>
                      <h4 className="font-bold text-blue-900">
                        {selectedProduct.name || selectedProduct.product_name}
                      </h4>
                      <p className="text-sm text-blue-700">
                        ID: {selectedProduct.id || selectedProduct.product_id}
                      </p>
                      {selectedProduct.price && (
                        <p className="text-sm text-blue-700">
                          Precio actual: {formatCurrency(selectedProduct.price)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo de transacción */}
                  <div>
                    <Label htmlFor="transaction_type">Tipo de Transacción</Label>
                    <Select 
                      value={formData.transaction_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(transactionTypes).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nuevo precio */}
                  <div>
                    <Label htmlFor="new_price">Nuevo Precio</Label>
                    <Input
                      id="new_price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.new_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, new_price: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                    {selectedProduct?.price && formData.new_price && (
                      <div className="mt-1 text-sm">
                        {(() => {
                          const change = calculatePriceChange(selectedProduct.price, parseFloat(formData.new_price));
                          if (!change) return null;
                          return (
                            <span className={getPriceChangeColor(change.change)}>
                              Cambio: {change.formatted.change} ({change.formatted.percent})
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha efectiva */}
                  <div>
                    <Label htmlFor="effective_date">Fecha Efectiva (opcional)</Label>
                    <Input
                      id="effective_date"
                      type="datetime-local"
                      value={formData.effective_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                    />
                  </div>

                  {/* ID de referencia */}
                  <div>
                    <Label htmlFor="reference_id">ID de Referencia (opcional)</Label>
                    <Input
                      id="reference_id"
                      value={formData.reference_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference_id: e.target.value }))}
                      placeholder="ADJ-001, MKT-001, PROMO-001, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Factor de costo */}
                  <div>
                    <Label htmlFor="cost_factor">Factor de Costo (opcional)</Label>
                    <Input
                      id="cost_factor"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.cost_factor}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_factor: e.target.value }))}
                      placeholder="0.65"
                    />
                    <p className="text-xs text-muted-foreground">Valor entre 0 y 1</p>
                  </div>

                  {/* Margen porcentual */}
                  <div>
                    <Label htmlFor="margin_percent">Margen Porcentual (opcional)</Label>
                    <Input
                      id="margin_percent"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.margin_percent}
                      onChange={(e) => setFormData(prev => ({ ...prev, margin_percent: e.target.value }))}
                      placeholder="35.0"
                    />
                    <p className="text-xs text-muted-foreground">Porcentaje de margen</p>
                  </div>
                </div>

                {/* Razón */}
                <div>
                  <Label htmlFor="reason">Razón del Cambio (opcional)</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Describe el motivo del cambio de precio..."
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.reason.length}/1000 caracteres
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading || !selectedProduct || !formData.transaction_type || !formData.new_price}
                    className="flex-1"
                  >
                    {loading ? 'Registrando...' : 'Registrar Transacción'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setFormData({
                        transaction_type: '',
                        new_price: '',
                        effective_date: '',
                        reference_type: '',
                        reference_id: '',
                        reason: '',
                        cost_factor: '',
                        margin_percent: '',
                        metadata: {}
                      });
                      setSelectedProduct(null);
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transacciones Recientes */}
        <TabsContent value="recent" className="space-y-6">
          {/* Búsqueda */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto, tipo, razón..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={loadInitialData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transacciones</p>
                    <p className="text-2xl font-bold">{recentTransactions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Incrementos</p>
                    <p className="text-2xl font-bold">
                      {recentTransactions.filter(t => t.price_change > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Decrementos</p>
                    <p className="text-2xl font-bold">
                      {recentTransactions.filter(t => t.price_change < 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tipos Únicos</p>
                    <p className="text-2xl font-bold">
                      {new Set(recentTransactions.map(t => t.transaction_type)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de transacciones */}
          <div className="space-y-4">
            {filteredTransactions.length === 0 && !loading ? (
              <DataState
                variant="empty"
                title="No hay transacciones"
                message="No se encontraron transacciones con los criterios de búsqueda"
              />
            ) : (
              filteredTransactions.map(transaction => {
                const ChangeIcon = getPriceChangeIcon(transaction.price_change);
                
                return (
                  <Card key={transaction.transaction_id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          {/* Header de la transacción */}
                          <div className="flex items-center gap-3">
                            <ChangeIcon className={`w-6 h-6 ${getPriceChangeColor(transaction.price_change)}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg">
                                  {transaction.product_name || transaction.product_id}
                                </h3>
                                <Badge variant="outline">
                                  {formatTransactionType(transaction.transaction_type)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(transaction.transaction_date)}
                                {transaction.user_name && ` • ${transaction.user_name}`}
                              </p>
                            </div>
                          </div>
                          
                          {/* Información del cambio de precio */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio Anterior</p>
                              <p className="text-lg font-bold">{formatCurrency(transaction.old_price)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio Nuevo</p>
                              <p className="text-lg font-bold">{formatCurrency(transaction.new_price)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cambio</p>
                              <p className={`text-lg font-bold ${getPriceChangeColor(transaction.price_change)}`}>
                                {transaction.price_change > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.price_change))}
                                {transaction.price_change_percent && (
                                  <span className="text-sm ml-2">
                                    ({transaction.price_change_percent.toFixed(1)}%)
                                  </span>
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Moneda</p>
                              <p className="text-lg font-bold">{transaction.currency_id}</p>
                            </div>
                          </div>
                          
                          {/* Razón y metadatos */}
                          {transaction.reason && (
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">Razón</p>
                              <p className="text-sm">{transaction.reason}</p>
                            </div>
                          )}
                          
                          {transaction.reference_id && (
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Referencia: {transaction.reference_id}</span>
                              {transaction.cost_factor && (
                                <span>Factor Costo: {(transaction.cost_factor * 100).toFixed(1)}%</span>
                              )}
                              {transaction.margin_percent && (
                                <span>Margen: {transaction.margin_percent.toFixed(1)}%</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLoadProductHistory(transaction.product_id)}
                            title="Ver historial del producto"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Reportes y Análisis */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reporte de Variación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Reporte de Variación
                </CardTitle>
                <CardDescription>
                  Análisis de cambios de precio por período
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date_from">Desde</Label>
                    <Input
                      id="date_from"
                      type="date"
                      value={dateFilters.date_from}
                      onChange={(e) => setDateFilters(prev => ({ ...prev, date_from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_to">Hasta</Label>
                    <Input
                      id="date_to"
                      type="date"
                      value={dateFilters.date_to}
                      onChange={(e) => setDateFilters(prev => ({ ...prev, date_to: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="filter_type">Filtrar por Tipo</Label>
                  <Select 
                    value={dateFilters.transaction_type} 
                    onValueChange={(value) => setDateFilters(prev => ({ ...prev, transaction_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos los tipos</SelectItem>
                      {Object.entries(transactionTypes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleLoadVarianceReport} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Generar Reporte
                </Button>
              </CardContent>
            </Card>

            {/* Validación de Consistencia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Validación de Consistencia
                </CardTitle>
                <CardDescription>
                  Verificar integridad de precios vs transacciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Valida que los precios actuales coincidan con las últimas transacciones registradas.
                </p>
                
                <Button onClick={handleValidateConsistency} className="w-full">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Ejecutar Validación
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Validación */}
        <TabsContent value="consistency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Validación de Consistencia</CardTitle>
              <CardDescription>
                Últimos resultados de validación de integridad
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consistencyReports.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay reportes de validación. Ejecute una validación para ver los resultados.
                  </p>
                  <Button onClick={handleValidateConsistency} className="mt-4">
                    Ejecutar Validación
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {consistencyReports.map(report => {
                    const status = interpretConsistencyStatus(report.consistency_status);
                    
                    return (
                      <div key={report.product_id} className={`${styles.card()} p-4`}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{status.icon}</span>
                              <h4 className="font-bold">{report.product_name}</h4>
                              <Badge variant={status.level === 'success' ? 'default' : 'destructive'}>
                                {status.message}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Precio Actual:</span> {formatCurrency(report.current_price)}
                              </div>
                              <div>
                                <span className="font-medium">Última Transacción:</span> {formatCurrency(report.last_transaction_price)}
                              </div>
                            </div>

                            {report.consistency_status === 'INCONSISTENT' && (
                              <div className="text-sm text-red-600">
                                <span className="font-medium">Diferencia:</span> {formatCurrency(Math.abs(report.price_difference))}
                              </div>
                            )}

                            {report.recommendations.length > 0 && (
                              <div className="text-sm">
                                <span className="font-medium">Recomendaciones:</span>
                                <ul className="list-disc list-inside ml-2">
                                  {report.recommendations.map((rec, idx) => (
                                    <li key={idx}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {report.last_transaction_date && (
                            <div className="text-right text-sm text-muted-foreground">
                              <p>Última transacción:</p>
                              <p>{formatDate(report.last_transaction_date)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Historial de Producto */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${styles.card()} w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Historial de Precios</h2>
              <Button
                onClick={() => setShowHistoryModal(false)}
                variant="ghost"
                size="sm"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6">
              {productHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay historial disponible para este producto
                </p>
              ) : (
                <div className="space-y-4">
                  {productHistory.map(item => (
                    <div key={item.transaction_id} className={`${styles.card()} p-4`}>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {formatTransactionType(item.transaction_type)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(item.transaction_date)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span>{formatCurrency(item.old_price)} → {formatCurrency(item.new_price)}</span>
                            <span className={getPriceChangeColor(item.price_change)}>
                              ({item.price_change >= 0 ? '+' : ''}{formatCurrency(item.price_change)})
                            </span>
                          </div>
                          
                          {item.reason && (
                            <p className="text-sm text-muted-foreground">{item.reason}</p>
                          )}
                        </div>
                        
                        {item.user_name && (
                          <div className="text-right text-sm text-muted-foreground">
                            <p>Usuario: {item.user_name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reporte de Variación */}
      {showVarianceModal && varianceReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`${styles.card()} w-full max-w-6xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Reporte de Variación de Precios</h2>
              <Button
                onClick={() => setShowVarianceModal(false)}
                variant="ghost"
                size="sm"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Productos</p>
                    <p className="text-2xl font-bold">{varianceReport.total_products}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Con Cambios</p>
                    <p className="text-2xl font-bold">
                      {varianceReport.reports.filter(r => r.transaction_count > 0).length}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Volatilidad Promedio</p>
                    <p className="text-2xl font-bold">
                      {(varianceReport.reports.reduce((sum, r) => sum + (r.price_volatility || 0), 0) / 
                        varianceReport.reports.length).toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                {varianceReport.reports.map(report => (
                  <div key={report.product_id} className={`${styles.card()} p-4`}>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        <p className="font-bold">{report.product_name}</p>
                        <p className="text-muted-foreground">{report.product_id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Transacciones</p>
                        <p className="font-bold">{report.transaction_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cambio Total</p>
                        <p className={`font-bold ${getPriceChangeColor(report.total_price_change || 0)}`}>
                          {formatCurrency(report.total_price_change || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">% Cambio</p>
                        <p className={`font-bold ${getPriceChangeColor(report.total_change_percent || 0)}`}>
                          {report.total_change_percent?.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Volatilidad</p>
                        <p className="font-bold">{report.price_volatility?.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Último Cambio</p>
                        <p className="text-xs">
                          {report.last_transaction_date && 
                            new Date(report.last_transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceTransactionsPage;