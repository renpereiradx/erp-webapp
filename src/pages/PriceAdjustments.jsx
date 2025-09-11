/**
 * Página de Ajustes Manuales de Precios - Patrón MVP
 * Implementación simple y funcional siguiendo guía de desarrollo
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DataState from '@/components/ui/DataState';
import ProductSearchInput from '@/components/ui/ProductSearchInput';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import usePriceAdjustmentStore from '@/store/usePriceAdjustmentStore';

const PriceAdjustmentsPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const {
    adjustments,
    loading,
    error,
    creating,
    fetchRecentAdjustments,
    createPriceAdjustment,
    fetchProductHistory,
    clearError
  } = usePriceAdjustmentStore();
  
  // Estados locales para UI
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [productHistory, setProductHistory] = useState([]);
  const [formData, setFormData] = useState({
    new_price: '',
    unit: 'UNIT',
    reason: '',
    metadata: {}
  });
  
  // Cargar ajustes recientes al montar
  useEffect(() => {
    fetchRecentAdjustments();
  }, [fetchRecentAdjustments]);
  
  // Filtrar ajustes localmente (MVP simple)
  const filteredAdjustments = adjustments.filter(adjustment => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (adjustment.product_id || '').toLowerCase().includes(searchLower) ||
      (adjustment.reason || '').toLowerCase().includes(searchLower) ||
      (adjustment.user_id || '').toLowerCase().includes(searchLower)
    );
  });
  
  // Handlers
  const handleCreateAdjustment = () => {
    setSelectedProduct(null);
    setFormData({ 
      new_price: '', 
      unit: 'UNIT', 
      reason: '',
      metadata: {}
    });
    setShowModal(true);
  };
  
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormData(prev => ({ 
      ...prev,
      metadata: {
        ...prev.metadata,
        product_name: product.name || product.product_name
      }
    }));
  };
  
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      alert(t('priceAdjustment.error.noProduct', 'Seleccione un producto'));
      return;
    }
    
    const adjustmentData = {
      product_id: selectedProduct.id || selectedProduct.product_id,
      new_price: parseFloat(formData.new_price),
      unit: formData.unit,
      reason: formData.reason,
      metadata: {
        ...formData.metadata,
        source: 'manual_ui',
        created_by: 'current_user'
      }
    };
    
    const result = await createPriceAdjustment(adjustmentData);
    
    if (result.success) {
      setShowModal(false);
      setSelectedProduct(null);
      setFormData({ 
        new_price: '', 
        unit: 'UNIT', 
        reason: '',
        metadata: {}
      });
      // Recargar ajustes recientes
      fetchRecentAdjustments();
    }
    // Error se maneja automáticamente en el store
  };
  
  const handleViewHistory = async (adjustment) => {
    const result = await fetchProductHistory(adjustment.product_id);
    if (result.success) {
      setProductHistory(result.data);
      setShowHistory(true);
    }
  };
  
  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG'
    }).format(amount);
  };
  
  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-PY');
  };
  
  // Determinar color del cambio de precio
  const getPriceChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  // Determinar icono del cambio de precio
  const getPriceChangeIcon = (change) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return DollarSign;
  };
  
  // Estados de UI
  if (loading && adjustments.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }
  
  if (error) {
    return (
      <DataState 
        variant="error" 
        title={t('priceAdjustment.error.title', 'Error al cargar ajustes')}
        message={error}
        onRetry={() => {
          clearError();
          fetchRecentAdjustments();
        }}
      />
    );
  }
  
  if (!loading && adjustments.length === 0) {
    return (
      <DataState
        variant="empty"
        title={t('priceAdjustment.empty.title', 'Sin ajustes de precios')}
        message={t('priceAdjustment.empty.message', 'No hay ajustes de precios registrados')}
        actionLabel={t('priceAdjustment.action.create', 'Crear Ajuste')}
        onAction={handleCreateAdjustment}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header con acción primaria */}
      <div className="flex justify-between items-center">
        <h1 className={styles.header('h1')}>
          <DollarSign className="w-8 h-8 mr-3 inline" />
          {t('priceAdjustment.title', 'Ajustes de Precios')}
        </h1>
        <Button onClick={handleCreateAdjustment} className={styles.button('primary')}>
          <Plus className="w-4 h-4 mr-2" />
          {t('priceAdjustment.action.create', 'Nuevo Ajuste')}
        </Button>
      </div>
      
      {/* Búsqueda local */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('priceAdjustment.search.placeholder', 'Buscar por producto, razón o usuario...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-10 ${styles.input()}`}
        />
      </div>
      
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={styles.card('p-4')}>
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Ajustes</p>
              <p className="text-2xl font-bold">{adjustments.length}</p>
            </div>
          </div>
        </div>
        
        <div className={styles.card('p-4')}>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Incrementos</p>
              <p className="text-2xl font-bold">
                {adjustments.filter(a => a.price_change > 0).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className={styles.card('p-4')}>
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Decrementos</p>
              <p className="text-2xl font-bold">
                {adjustments.filter(a => a.price_change < 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Listado de ajustes */}
      <div className="grid gap-4">
        {filteredAdjustments.map(adjustment => {
          const ChangeIcon = getPriceChangeIcon(adjustment.price_change);
          
          return (
            <div 
              key={adjustment.id} 
              className={styles.card('p-6')}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  {/* Header del ajuste */}
                  <div className="flex items-center gap-3">
                    <ChangeIcon className={`w-6 h-6 ${getPriceChangeColor(adjustment.price_change)}`} />
                    <div>
                      <h3 className="font-black text-lg">
                        {adjustment.product_id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(adjustment.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Información del cambio de precio */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Precio Anterior</p>
                      <p className="text-lg font-bold">{formatCurrency(adjustment.old_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Precio Nuevo</p>
                      <p className="text-lg font-bold">{formatCurrency(adjustment.new_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Cambio</p>
                      <p className={`text-lg font-bold ${getPriceChangeColor(adjustment.price_change)}`}>
                        {adjustment.price_change > 0 ? '+' : ''}{formatCurrency(Math.abs(adjustment.price_change))}
                        <span className="text-sm ml-2">
                          ({adjustment.price_change_percent?.toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Razón y metadatos */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Razón</p>
                      <p className="text-sm">{adjustment.reason}</p>
                    </div>
                    
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Unidad: {adjustment.unit}</span>
                      <span>Usuario: {adjustment.user_id}</span>
                      {adjustment.metadata?.approval_id && (
                        <span>Aprobación: {adjustment.metadata.approval_id}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Acciones */}
                <div className="flex gap-2 ml-4">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleViewHistory(adjustment)}
                    className="border-2 border-black"
                    title={t('priceAdjustment.action.viewHistory', 'Ver Historial')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Modal de Crear Ajuste */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={styles.container('max-w-2xl w-full mx-4')}>
            <h2 className={styles.header('h2')}>
              <DollarSign className="w-6 h-6 mr-3 inline" />
              {t('priceAdjustment.modal.create', 'CREAR AJUSTE DE PRECIO')}
            </h2>
            
            <form onSubmit={handleSaveAdjustment} className="space-y-6">
              {/* Selector de producto */}
              <div>
                <label className={styles.label()}>
                  {t('priceAdjustment.field.product', 'PRODUCTO')}
                </label>
                <ProductSearchInput
                  onProductSelect={handleProductSelect}
                  selectedProduct={selectedProduct}
                  placeholder={t('priceAdjustment.field.product.placeholder', 'Buscar producto por ID, nombre o código...')}
                />
              </div>
              
              {/* Información del producto seleccionado */}
              {selectedProduct && (
                <div className={styles.card('p-4 bg-blue-50')}>
                  <h4 className="font-bold text-blue-900">
                    {selectedProduct.name || selectedProduct.product_name}
                  </h4>
                  <p className="text-sm text-blue-700">
                    ID: {selectedProduct.id || selectedProduct.product_id}
                  </p>
                  {selectedProduct.price_formatted && (
                    <p className="text-sm text-blue-700">
                      Precio actual: {selectedProduct.price_formatted}
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nuevo precio */}
                <div>
                  <label className={styles.label()}>
                    {t('priceAdjustment.field.newPrice', 'NUEVO PRECIO')}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.new_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_price: e.target.value }))}
                    className={styles.input()}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                {/* Unidad */}
                <div>
                  <label className={styles.label()}>
                    {t('priceAdjustment.field.unit', 'UNIDAD')}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className={styles.input()}
                  >
                    <option value="UNIT">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="box">Caja</option>
                    <option value="dozen">Docena</option>
                  </select>
                </div>
              </div>
              
              {/* Razón */}
              <div>
                <label className={styles.label()}>
                  {t('priceAdjustment.field.reason', 'RAZÓN DEL AJUSTE')}
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className={styles.input()}
                  placeholder={t('priceAdjustment.field.reason.placeholder', 'Explique la razón del ajuste de precio...')}
                  rows={3}
                  maxLength={500}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.reason.length}/500 caracteres
                </p>
              </div>
              
              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={creating || !selectedProduct}
                  className={`flex-1 ${styles.button('primary')}`}
                >
                  {creating ? 
                    t('priceAdjustment.action.creating', 'Creando...') : 
                    t('priceAdjustment.action.create', 'Crear Ajuste')
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  className={`flex-1 ${styles.button('secondary')}`}
                >
                  {t('action.cancel', 'Cancelar')}
                </Button>
              </div>
            </form>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de Historial */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={styles.container('max-w-4xl w-full mx-4')}>
            <h2 className={styles.header('h2')}>
              <Eye className="w-6 h-6 mr-3 inline" />
              {t('priceAdjustment.modal.history', 'HISTORIAL DE AJUSTES')}
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {productHistory.map((item, index) => (
                <div key={`${item.adjustment_id}-${index}`} className={styles.card('p-4')}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        item.adjustment_type === 'price' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.adjustment_type}
                      </span>
                      <p className="mt-2 font-medium">
                        {formatCurrency(item.old_value)} → {formatCurrency(item.new_value)}
                        <span className={`ml-2 ${getPriceChangeColor(item.value_change)}`}>
                          ({item.value_change >= 0 ? '+' : ''}{item.value_change})
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{formatDate(item.adjustment_date)}</p>
                      <p>Usuario: {item.user_id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4">
              <Button 
                onClick={() => setShowHistory(false)}
                className={`w-full ${styles.button('secondary')}`}
              >
                {t('action.close', 'Cerrar')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceAdjustmentsPage;