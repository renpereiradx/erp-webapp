/**
 * Página de Ajustes de Precios - Actualizada con nueva API v1.0
 * Sistema completo de gestión de ajustes de precio
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertCircle,
  ArrowRight,
  Zap,
  BarChart3,
  Shield,
  Clock,
  List,
  Trash2,
  Edit3,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import ProductSearchInput from '@/components/ui/ProductSearchInput';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';

const PriceAdjustmentsPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();

  // State management
  const [adjustments, setAdjustments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para ajustes masivos
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkProducts, setBulkProducts] = useState([]);
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [editingBulkIndex, setEditingBulkIndex] = useState(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    new_price: '',
    unit: 'UNIT',
    reason: '',
    reasonTemplate: ''
  });

  // Plantillas predefinidas para razones de ajuste
  const reasonTemplates = [
    { value: '', label: 'Seleccionar plantilla...' },
    { value: 'MARKET_ADJUSTMENT', label: '📊 Ajuste por condiciones del mercado' },
    { value: 'COST_INCREASE', label: '💰 Aumento de costos de proveedor' },
    { value: 'COST_DECREASE', label: '💸 Reducción de costos de proveedor' },
    { value: 'PROMOTIONAL_PRICING', label: '🎉 Precio promocional temporal' },
    { value: 'COMPETITIVE_ADJUSTMENT', label: '⚔️ Ajuste por competencia' },
    { value: 'INVENTORY_CLEARANCE', label: '📦 Liquidación de inventario' },
    { value: 'QUALITY_ADJUSTMENT', label: '🔧 Ajuste por calidad del producto' },
    { value: 'SEASONAL_ADJUSTMENT', label: '🌟 Ajuste estacional' },
    { value: 'BULK_DISCOUNT', label: '📈 Descuento por volumen' },
    { value: 'ERROR_CORRECTION', label: '🔄 Corrección de error previo' },
    { value: 'MANAGEMENT_DECISION', label: '👔 Decisión gerencial' },
    { value: 'SUPPLIER_NEGOTIATION', label: '🤝 Renegociación con proveedor' },
    { value: 'CURRENCY_FLUCTUATION', label: '💱 Fluctuación cambiaria' },
    { value: 'INITIAL_INVENTORY_SETUP', label: '🏗️ Carga inicial de inventario' },
    { value: 'CUSTOM', label: '✏️ Razón personalizada...' }
  ];

  // No auto-load - user must explicitly request data

  // Filter adjustments based on search term
  const filteredAdjustments = useMemo(() => {
    if (!searchTerm) return adjustments;
    
    const term = searchTerm.toLowerCase();
    return adjustments.filter(adj => 
      adj.product_id?.toLowerCase().includes(term) ||
      adj.reason?.toLowerCase().includes(term) ||
      adj.user_id?.toLowerCase().includes(term)
    );
  }, [adjustments, searchTerm]);

  // Functions
  const loadAdjustments = async (pageSize = 20, days = 7) => {
    try {
      setLoading(true);
      setError(null);
      const response = await priceAdjustmentService.getRecent(pageSize, days);
      setAdjustments(response.data || []);
    } catch (err) {
      console.error('Error loading adjustments:', err);
      setError('No se pudieron cargar los ajustes. Usando datos de demostración.');
      // El servicio ya maneja el fallback automáticamente
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdjustment = () => {
    setShowModal(true);
  };

  const handleBulkAdjustment = () => {
    setShowBulkModal(true);
  };

  // Funciones para ajustes masivos
  const addProductToBulk = (product) => {
    if (!bulkProducts.find(p => p.id === product.id)) {
      setBulkProducts([...bulkProducts, {
        ...product,
        new_price: product.price || '',
        reason: '',
        unit: 'UNIT'
      }]);
    }
  };

  const removeProductFromBulk = (productId) => {
    setBulkProducts(bulkProducts.filter(p => p.id !== productId));
  };

  const updateBulkProduct = (index, field, value) => {
    const updated = [...bulkProducts];
    updated[index] = { ...updated[index], [field]: value };
    setBulkProducts(updated);
  };

  const saveBulkAdjustments = async () => {
    if (bulkProducts.length === 0) return;

    setCreating(true);
    try {
      const adjustmentPromises = bulkProducts.map(product => {
        if (!product.new_price || !product.reason) return null;

        return priceAdjustmentService.create({
          product_id: product.id,
          new_price: parseFloat(product.new_price),
          unit: product.unit,
          reason: product.reason
        });
      }).filter(Boolean);

      await Promise.all(adjustmentPromises);

      // Reset and close
      setBulkProducts([]);
      setShowBulkModal(false);
      await loadAdjustments();

    } catch (err) {
      setError(err.message || 'Error al crear ajustes masivos');
    } finally {
      setCreating(false);
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  const handleReasonTemplateChange = (templateValue) => {
    setFormData(prev => ({
      ...prev,
      reasonTemplate: templateValue,
      reason: templateValue === 'CUSTOM' ? '' : getReasonText(templateValue)
    }));
  };

  const getReasonText = (templateValue) => {
    const reasonTexts = {
      'MARKET_ADJUSTMENT': 'Ajuste de precio por condiciones actuales del mercado',
      'COST_INCREASE': 'Aumento de precio debido al incremento en costos de proveedor',
      'COST_DECREASE': 'Reducción de precio por disminución en costos de proveedor',
      'PROMOTIONAL_PRICING': 'Precio promocional temporal para impulsar ventas',
      'COMPETITIVE_ADJUSTMENT': 'Ajuste de precio para mantener competitividad en el mercado',
      'INVENTORY_CLEARANCE': 'Precio reducido para liquidación de inventario',
      'QUALITY_ADJUSTMENT': 'Ajuste de precio por cambios en la calidad del producto',
      'SEASONAL_ADJUSTMENT': 'Ajuste estacional por demanda del período',
      'BULK_DISCOUNT': 'Descuento aplicado por compra en volumen',
      'ERROR_CORRECTION': 'Corrección de error en precio anterior',
      'MANAGEMENT_DECISION': 'Ajuste autorizado por decisión gerencial',
      'SUPPLIER_NEGOTIATION': 'Nuevo precio por renegociación con proveedor',
      'CURRENCY_FLUCTUATION': 'Ajuste por fluctuaciones en tipo de cambio',
      'INITIAL_INVENTORY_SETUP': 'Declaración de precio inicial para carga de inventario'
    };
    return reasonTexts[templateValue] || '';
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !formData.new_price || !formData.reason) return;

    try {
      setCreating(true);
      setError(null);
      
      const adjustmentData = {
        product_id: selectedProduct.id || selectedProduct.product_id,
        old_price: selectedProduct.price || 0,
        new_price: parseFloat(formData.new_price),
        reason: formData.reason,
        unit: formData.unit
      };

      await priceAdjustmentService.create(adjustmentData);
      
      // Reset form and close modal
      setFormData({ new_price: '', unit: 'UNIT', reason: '', reasonTemplate: '' });
      setSelectedProduct(null);
      setShowModal(false);
      
      // Reload adjustments
      await loadAdjustments();
      
    } catch (err) {
      console.error('Error creating adjustment:', err);
      setError(err.message || 'Error al crear el ajuste de precio');
    } finally {
      setCreating(false);
    }
  };

  const handleViewHistory = async (adjustment) => {
    try {
      const response = await priceAdjustmentService.getByProduct(adjustment.product_id);
      setProductHistory(response.data || []);
      setShowHistory(true);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Error al cargar el historial');
    }
  };

  // Utility functions
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getPriceChangeIcon = (change) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return DollarSign;
  };

  const getPriceChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex justify-between items-center">
        <h1 className={styles.header('h1')}>
          <DollarSign className="w-8 h-8 mr-3 inline" />
          {t('priceAdjustment.title', 'Ajustes de Precios')}
        </h1>
        <div className="flex gap-3">
          <div className="flex gap-2">
            <Button 
              onClick={() => loadAdjustments(20, 1)} 
              variant="outline" 
              className={styles.button('secondary')}
              disabled={loading}
              size="sm"
            >
              {loading ? '🔄' : '📅'} Hoy
            </Button>
            <Button 
              onClick={() => loadAdjustments(20, 7)} 
              variant="outline" 
              className={styles.button('secondary')}
              disabled={loading}
              size="sm"
            >
              {loading ? '🔄' : '📊'} 7 días
            </Button>
            <Button 
              onClick={() => loadAdjustments(50, 30)} 
              variant="outline" 
              className={styles.button('secondary')}
              disabled={loading}
              size="sm"
            >
              {loading ? '🔄' : '📈'} 30 días
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateAdjustment} className={styles.button('primary')}>
              <Plus className="w-4 h-4 mr-2" />
              {t('priceAdjustment.action.create', 'Nuevo Ajuste')}
            </Button>
            <Button onClick={handleBulkAdjustment} variant="outline" className={styles.button('secondary')}>
              <List className="w-4 h-4 mr-2" />
              Ajustes Masivos
            </Button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando ajustes de precios...</p>
          </div>
        </div>
      ) : (
        <>
      {/* Búsqueda local - solo activa cuando hay datos */}
      {adjustments.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('priceAdjustment.search.placeholder', 'Buscar por producto, razón o usuario...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${styles.input()}`}
          />
        </div>
      )}

      {/* Estado sin datos */}
      {!loading && adjustments.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ajustes cargados</h3>
          <p className="text-gray-500 mb-6">Haz clic en "Cargar Ajustes" para ver los ajustes de precios recientes</p>
          <Button 
            onClick={() => loadAdjustments(20, 7)} 
            className={styles.button('primary')}
          >
            📊 Cargar Ajustes (7 días)
          </Button>
        </div>
      )}
      
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
                        {adjustment.product_id || adjustment.product_name || `Ajuste #${adjustment.id}`}
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
              
              {/* Plantilla de Razón */}
              <div>
                <label className={styles.label()}>
                  {t('priceAdjustment.field.reasonTemplate', 'PLANTILLA DE RAZÓN')}
                </label>
                <select
                  value={formData.reasonTemplate}
                  onChange={(e) => handleReasonTemplateChange(e.target.value)}
                  className={styles.input()}
                  required
                >
                  {reasonTemplates.map((template) => (
                    <option key={template.value} value={template.value}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo de Razón */}
              <div>
                <label className={styles.label()}>
                  {t('priceAdjustment.field.reason', 'RAZÓN DEL AJUSTE')}
                  <span className="text-xs text-gray-500 ml-2">
                    {formData.reasonTemplate === 'CUSTOM' ? '(Personalizada)' : '(Generada automáticamente)'}
                  </span>
                </label>
                {formData.reasonTemplate === 'CUSTOM' ? (
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className={styles.input()}
                    placeholder={t('priceAdjustment.field.reason.placeholder', 'Escriba la razón personalizada del ajuste de precio...')}
                    rows={3}
                    maxLength={500}
                    required
                  />
                ) : (
                  <div className={`${styles.input()} bg-gray-50 min-h-[80px] flex items-center`}>
                    <p className="text-sm text-gray-700">
                      {formData.reason || 'Seleccione una plantilla arriba para generar la razón automáticamente'}
                    </p>
                  </div>
                )}
                {formData.reasonTemplate === 'CUSTOM' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.reason.length}/500 caracteres
                  </p>
                )}
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

      {/* Modal de Ajustes Masivos */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={styles.container('max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden')}>
            <div className="flex flex-col h-full">
              <h2 className={styles.header('h2')}>
                <List className="w-6 h-6 mr-3 inline" />
                Ajustes Masivos de Precios
              </h2>

              <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                {/* Búsqueda de productos */}
                <div>
                  <label className={styles.label()}>Agregar Productos</label>
                  <ProductSearchInput
                    onProductSelect={addProductToBulk}
                    selectedProduct={null}
                    placeholder="Buscar producto por ID, nombre o código para agregar..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Busca y selecciona productos para agregarlos a la lista de ajustes
                  </p>
                </div>

                {/* Lista de productos para ajustar */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Productos para Ajustar ({bulkProducts.length})</h3>
                    {bulkProducts.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkProducts([])}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Limpiar Todo
                      </Button>
                    )}
                  </div>

                  {bulkProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <List className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium mb-2">No hay productos agregados</p>
                      <p className="text-sm">Busca y selecciona productos para comenzar</p>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-96 border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-medium">Producto</th>
                            <th className="text-left p-3 font-medium">Precio Actual</th>
                            <th className="text-left p-3 font-medium">Nuevo Precio</th>
                            <th className="text-left p-3 font-medium">Unidad</th>
                            <th className="text-left p-3 font-medium">Razón</th>
                            <th className="text-center p-3 font-medium">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkProducts.map((product, index) => (
                            <tr key={product.id} className="border-t hover:bg-gray-50">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-xs text-gray-500">ID: {product.id}</p>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className="font-medium">
                                  ${product.price?.toLocaleString() || '0'}
                                </span>
                              </td>
                              <td className="p-3">
                                {editingBulkIndex === index ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={product.new_price}
                                    onChange={(e) => updateBulkProduct(index, 'new_price', e.target.value)}
                                    className="w-24"
                                    onBlur={() => setEditingBulkIndex(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingBulkIndex(null)}
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                    onClick={() => setEditingBulkIndex(index)}
                                  >
                                    ${product.new_price || '0'}
                                    <Edit3 className="w-3 h-3 inline ml-1 opacity-50" />
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <select
                                  value={product.unit}
                                  onChange={(e) => updateBulkProduct(index, 'unit', e.target.value)}
                                  className="text-xs border rounded px-2 py-1"
                                >
                                  <option value="UNIT">Unidad</option>
                                  <option value="KG">Kg</option>
                                  <option value="DOZEN">Docena</option>
                                </select>
                              </td>
                              <td className="p-3">
                                <Input
                                  type="text"
                                  value={product.reason}
                                  onChange={(e) => updateBulkProduct(index, 'reason', e.target.value)}
                                  placeholder="Razón del ajuste..."
                                  className="text-xs"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeProductFromBulk(product.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Resumen */}
                {bulkProducts.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm">
                      <span className="font-medium">Resumen:</span> {bulkProducts.length} productos •
                      <span className="ml-2">
                        {bulkProducts.filter(p => p.new_price && p.reason).length} listos para ajustar
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  onClick={saveBulkAdjustments}
                  disabled={creating || bulkProducts.filter(p => p.new_price && p.reason).length === 0}
                  className={`flex-1 ${styles.button('primary')}`}
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Ajustes ({bulkProducts.filter(p => p.new_price && p.reason).length})
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBulkModal(false)}
                  className={`flex-1 ${styles.button('secondary')}`}
                >
                  Cancelar
                </Button>
              </div>

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
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default PriceAdjustmentsPage;