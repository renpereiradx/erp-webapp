import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Package,
  Calculator,
  Settings,
  Search,
  Plus,
  Trash2,
  Edit,
  Archive,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Eye,
  DollarSign
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ProductSearchInput from '@/components/ui/ProductSearchInput';
import ProductAdjustmentCard from '@/components/ui/ProductAdjustmentCard';
import EmptyState from '@/components/ui/EmptyState';
import DataState from '@/components/ui/DataState';
import useInventoryStore from '@/store/useInventoryStore';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';

const InventoryPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();

  // Store de inventario
  const {
    inventories,
    loading,
    error,
    filteredInventories,
    fetchInventories,
    fetchInventoryHistory,
    fetchInventoryDetails,
    invalidateInventory,
    createInventory,
    createManualAdjustment,
    clearError
  } = useInventoryStore();

  // Estados locales para UI
  const [currentView, setCurrentView] = useState('operations'); // 'dashboard', 'history', 'operations'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('unit-adjustment'); // 'unit-adjustment', 'bulk-adjustment', 'history', 'reports'
  const [showProductSearchModal, setShowProductSearchModal] = useState(false);

  // Estados para historial de inventarios
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(5);
  const [historyData, setHistoryData] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);

  // Estados para ajustes manuales
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    new_quantity: 0,
    reason: ''
  });

  // Estados para ajustes masivos
  const [selectedProductForBulk, setSelectedProductForBulk] = useState(null);
  const [bulkAdjustments, setBulkAdjustments] = useState([]);
  const [editingBulkIndex, setEditingBulkIndex] = useState(null);
  const [inventoryMetadata, setInventoryMetadata] = useState({
    source: 'physical_count',
    operator: '',
    location: 'main_warehouse',
    equipment: 'barcode_scanner',
    counting_method: 'scanner',
    verification: 'single_check',
    timestamp: new Date().toISOString(),
    notes: '',
    template: 'PHYSICAL_COUNT'
  });
  const [bulkProductData, setBulkProductData] = useState({
    quantity_checked: '',
    metadata: {
      source: 'physical_count',
      operator: '',
      location: '',
      timestamp: new Date().toISOString(),
      verification_status: 'pending',
      adjustment_reason: ''
    }
  });

  // Opciones del dashboard
  const inventoryOptions = [
    {
      id: 'unit-adjustment',
      title: 'Ajuste Unitario',
      description: 'Ajusta el stock de un solo producto. Ideal para correcciones rápidas con control granular.',
      icon: Settings,
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-600',
      recommended: true,
      disabled: false,
      action: () => {
        setCurrentView('operations');
        setActiveTab('unit-adjustment');
      }
    },
    {
      id: 'bulk-adjustment',
      title: 'Ajustes Múltiples',
      description: 'Corrige el stock de múltiples productos en una tabla. Perfecto para ajustes en lote.',
      icon: Calculator,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      iconColor: 'text-purple-600',
      recommended: false,
      disabled: false,
      action: () => {
        setCurrentView('operations');
        setActiveTab('bulk-adjustment');
      }
    }
  ];

  // Funciones para ajustes masivos
  const handleProductSelectForBulk = useCallback((product) => {
    setSelectedProductForBulk(product);
    setBulkProductData({
      quantity_checked: '',
      metadata: {
        source: 'physical_count',
        operator: '',
        location: '',
        timestamp: new Date().toISOString(),
        verification_status: 'pending',
        adjustment_reason: ''
      }
    });
  }, []);

  const addProductToBulkAdjustment = useCallback(() => {
    if (!selectedProductForBulk || !bulkProductData.quantity_checked) {
      alert('Por favor completa la cantidad contada antes de agregar');
      return;
    }

    const newAdjustment = {
      product_id: selectedProductForBulk.product_id || selectedProductForBulk.id,
      name: selectedProductForBulk.product_name || selectedProductForBulk.name || selectedProductForBulk.product_id,
      description: selectedProductForBulk.description,
      current_quantity: selectedProductForBulk.stock_quantity || 0,
      quantity_checked: parseFloat(bulkProductData.quantity_checked),
      metadata: {
        ...bulkProductData.metadata,
        operator: inventoryMetadata.operator,
        location: inventoryMetadata.location,
        adjustment_reason: `Ajuste masivo - ${inventoryMetadata.template}`
      }
    };

    const productId = selectedProductForBulk.product_id || selectedProductForBulk.id;
    const productName = selectedProductForBulk.product_name || selectedProductForBulk.name || selectedProductForBulk.product_id;

    const existingProduct = bulkAdjustments.find(adj => adj.product_id === productId);
    if (existingProduct) {
      alert(`El producto "${productName}" (ID: ${productId}) ya está en el inventario`);
      return;
    }

    setBulkAdjustments(prev => [...prev, newAdjustment]);
    setSelectedProductForBulk(null);
    setBulkProductData({
      quantity_checked: '',
      metadata: {
        source: 'physical_count',
        operator: '',
        location: '',
        timestamp: new Date().toISOString(),
        verification_status: 'pending',
        adjustment_reason: ''
      }
    });
  }, [selectedProductForBulk, bulkProductData, bulkAdjustments, inventoryMetadata]);

  const removeBulkAdjustment = useCallback((productId) => {
    setBulkAdjustments(prev => prev.filter(adj => adj.product_id !== productId));
  }, []);

  const updateBulkAdjustment = useCallback((index, field, value) => {
    setBulkAdjustments(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const saveBulkAdjustments = useCallback(async () => {
    if (bulkAdjustments.length === 0) {
      alert('No hay productos en la lista para ajustar');
      return;
    }

    if (!inventoryMetadata.operator || !inventoryMetadata.location) {
      alert('Por favor completa los campos obligatorios del inventario (Operador y Ubicación)');
      return;
    }

    const inventoryData = {
      products: bulkAdjustments,
      metadata: {
        ...inventoryMetadata,
        total_products: bulkAdjustments.length
      }
    };

    try {
      const result = await createInventory(inventoryData);
      if (result && result.success) {
        setBulkAdjustments([]);
        setSelectedProductForBulk(null);
        alert(`${result.message || 'Inventario masivo aplicado correctamente'}\nID: ${result.inventory_id}\nTotal de productos: ${bulkAdjustments.length}`);
        // Navigate back or clear state as needed
      } else {
        alert(`Error al aplicar inventario masivo: ${result?.error || 'Error desconocido'}`);
      }
    } catch (error) {
      alert(`Error al aplicar inventario masivo: ${error.message}`);
    }
  }, [bulkAdjustments, inventoryMetadata, createInventory]);

  // Función para cargar historial de inventarios
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const result = await fetchInventoryHistory(historyPage, historyLimit);
      if (result && result.success) {
        setHistoryData(result.data || []);
        setHistoryPagination(result.pagination || {});
      } else {
        setHistoryData([]);
        setHistoryPagination({});
      }
    } catch (error) {
      setHistoryData([]);
      setHistoryPagination({});
    }
    setHistoryLoading(false);
  }, [fetchInventoryHistory, historyPage, historyLimit]);

  // Cargar historial cuando cambie la página o límite
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyPage, historyLimit, fetchHistory]);

  // Reset page when changing limit
  useEffect(() => {
    setHistoryPage(1);
  }, [historyLimit]);

  // Funciones para ajustes unitarios
  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setAdjustmentData({
      new_quantity: product.current_stock || product.stock_quantity || 0,
      reason: ''
    });
  }, []);

  const handleSaveAdjustment = useCallback(async (adjustmentRequest) => {
    if (!adjustmentRequest || !adjustmentRequest.product_id) {
      alert('Datos de ajuste inválidos');
      return;
    }

    try {
      const result = await createManualAdjustment(adjustmentRequest);
      if (result && result.success) {
        setSelectedProduct(null);
        setAdjustmentData({ new_quantity: 0, reason: '' });
        alert(`Ajuste manual aplicado correctamente:\n${adjustmentRequest.reason}\nCantidad: ${adjustmentRequest.new_quantity}`);
      } else {
        alert(`Error al aplicar ajuste: ${result?.error || 'Error desconocido'}`);
      }
    } catch (error) {
      alert(`Error al aplicar ajuste: ${error.message}`);
    }
  }, [createManualAdjustment]);

  const handleViewDetails = async (inventory) => {
    // TODO: Implementar vista de detalles en una nueva ventana o modal personalizado
    alert(`Ver detalles del inventario ID: ${inventory.id} - Funcionalidad por implementar`);

    // Cargar detalles del inventario
    await fetchInventoryDetails(inventory.id);
  };

  const handleValidateConsistency = () => {
    // TODO: Implementar validación de consistencia
    alert('Validación de consistencia - Funcionalidad por implementar');
  };

  const handleInvalidateInventory = async (inventory) => {
    if (window.confirm(`¿Invalidar inventario ID ${inventory.id}?`)) {
      await invalidateInventory(inventory.id);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render principal del componente
  return (
    <>
      {/* Contenido principal basado en currentView */}
      {currentView === 'dashboard' && (
        <div className="space-y-8">
          {/* Header mejorado */}
          <div className="text-center space-y-4">
            <div>
              <h1 className={`${styles.header('h1')} mb-2`}>
                {t('inventory.title', 'Gestión de Inventario')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Control inteligente de stock, ajustes y operaciones de inventario
              </p>
            </div>
          </div>

          {/* Opciones principales - Cards mejoradas */}
          <div>
            <h2 className={`${styles.header('h2')} mb-6`}>Operaciones de Inventario</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inventoryOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div
                    key={option.id}
                    className={`
                      ${option.bgColor} ${option.borderColor} border-2 rounded-xl p-6
                      transition-all duration-200 hover:shadow-lg cursor-pointer
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                      ${option.recommended ? 'ring-2 ring-blue-200' : ''}
                      relative group
                    `}
                    onClick={option.disabled ? undefined : option.action}
                  >
                    {/* Badge de recomendado */}
                    {option.recommended && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Recomendado
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${option.bgColor} ${option.borderColor} border`}>
                        <IconComponent className={`w-8 h-8 ${option.iconColor}`} />
                      </div>

                      <div className="flex-1">
                        <h3 className={`text-xl font-bold ${option.textColor} mb-2`}>
                          {option.title}
                          {option.disabled && (
                            <span className="ml-2 text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                              Próximamente
                            </span>
                          )}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {option.description}
                        </p>

                        {/* Indicador de acción */}
                        <div className={`mt-4 flex items-center text-sm font-medium ${option.textColor}`}>
                          <span>
                            {option.disabled ? 'Disponible próximamente' : 'Hacer clic para comenzar'}
                          </span>
                          {!option.disabled && (
                            <div className="ml-2 transform transition-transform group-hover:translate-x-1">
                              →
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Acciones secundarias */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className={`${styles.header('h3')} mb-4`}>Acciones Adicionales</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  setCurrentView('operations');
                  setActiveTab('history');
                }}
                className={styles.button('secondary')}
              >
                <Archive className="w-4 h-4 mr-2" />
                Ver Historial
              </Button>

              <Button
                onClick={() => alert('Funcionalidad disponible próximamente')}
                className={styles.button('outline')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Reportes
              </Button>

              <Button
                onClick={() => fetchInventories()}
                className={styles.button('outline')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Cargar Datos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vista de operaciones con tabs */}
      {currentView === 'operations' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className={styles.header('h1')}>Operaciones de Inventario</h1>
              <p className="text-muted-foreground">
                Gestiona ajustes, conteos y operaciones de inventario
              </p>
            </div>
            <Button onClick={() => setCurrentView('dashboard')} className={styles.button('outline')}>
              ← Dashboard
            </Button>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-muted p-1 rounded-lg">
            <div className="flex gap-1">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'unit-adjustment'}
                onClick={() => setActiveTab('unit-adjustment')}
                className={`${
                  activeTab === 'unit-adjustment'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                } h-[calc(100%-1px)] flex-1 justify-center rounded-md border border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] flex items-center gap-2`}
              >
                <Settings className="w-4 h-4" />
                Ajuste Unitario
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'bulk-adjustment'}
                onClick={() => setActiveTab('bulk-adjustment')}
                className={`${
                  activeTab === 'bulk-adjustment'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                } h-[calc(100%-1px)] flex-1 justify-center rounded-md border border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] flex items-center gap-2`}
              >
                <Calculator className="w-4 h-4" />
                Ajustes Múltiples
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                } h-[calc(100%-1px)] flex-1 justify-center rounded-md border border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] flex items-center gap-2`}
              >
                <Archive className="w-4 h-4" />
                Historial
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'reports'}
                onClick={() => setActiveTab('reports')}
                className={`${
                  activeTab === 'reports'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                } h-[calc(100%-1px)] flex-1 justify-center rounded-md border border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] flex items-center gap-2`}
              >
                <BarChart3 className="w-4 h-4" />
                Reportes
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-background rounded-lg p-6">
            {activeTab === 'unit-adjustment' && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-orange-800">
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Ajuste Manual Unitario</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    Ajusta el stock de un solo producto. Ideal para correcciones rápidas con control granular.
                  </p>
                </div>

                <div>
                  <label className={styles.label()}>
                    Seleccionar Producto
                  </label>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowProductSearchModal(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 flex items-center gap-3"
                  >
                    <Search className="w-5 h-5" />
                    Buscar y Seleccionar Producto
                  </Button>
                </div>

                {selectedProduct && (
                  <ProductAdjustmentCard
                    product={selectedProduct}
                    onClear={() => setSelectedProduct(null)}
                    onAdjustmentSubmit={handleSaveAdjustment}
                    initialQuantity={selectedProduct.current_stock || selectedProduct.stock_quantity || 0}
                  />
                )}

                {!selectedProduct && (
                  <EmptyState
                    icon={Package}
                    title="Selecciona un producto"
                    description="Busca el producto que deseas ajustar usando el botón de búsqueda de arriba"
                    variant="instruction"
                    data-testid="inventory-product-selection"
                  />
                )}
              </div>
            )}

            {activeTab === 'bulk-adjustment' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-800">
                    <Calculator className="w-5 h-5" />
                    <span className="font-medium">Ajustes Múltiples de Inventario</span>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">
                    Corrige el stock de múltiples productos en una tabla. Perfecto para ajustes en lote.
                  </p>
                </div>

                {/* Metadata del inventario completo - Grid de 2 columnas */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Información del Inventario</h4>

                  {/* Grid de 2 columnas para desktop */}
                  <div className="grid grid-cols-2 gap-6 w-full">
                    {/* Columna 1 */}
                    <div className="space-y-4">
                      {/* Selector de plantilla */}
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tipo de Inventario *</label>
                        <select
                          value={inventoryMetadata.template || 'PHYSICAL_COUNT'}
                          onChange={(e) => {
                            const template = e.target.value;
                            setInventoryMetadata({
                              source: 'physical_count',
                              operator: '',
                              location: 'main_warehouse',
                              equipment: template === 'PHYSICAL_COUNT' ? 'barcode_scanner' : 'manual',
                              counting_method: template === 'PHYSICAL_COUNT' ? 'scanner' : 'manual',
                              verification: 'single_check',
                              timestamp: new Date().toISOString(),
                              notes: '',
                              template: template
                            });
                          }}
                          className="mt-1 h-9 text-sm border rounded px-3 w-full bg-white"
                        >
                          <option value="PHYSICAL_COUNT">Conteo Físico</option>
                          <option value="CYCLE_COUNT">Conteo Cíclico</option>
                          <option value="DAMAGED_GOODS">Productos Dañados</option>
                          <option value="SYSTEM_ERROR">Corrección de Sistema</option>
                          <option value="INITIAL_STOCK">Stock Inicial</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Operador *</label>
                        <Input
                          type="text"
                          value={inventoryMetadata.operator}
                          onChange={(e) => setInventoryMetadata({...inventoryMetadata, operator: e.target.value})}
                          placeholder="warehouse_manager"
                          className="mt-1 h-8 text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Ubicación *</label>
                        <Input
                          type="text"
                          value={inventoryMetadata.location}
                          onChange={(e) => setInventoryMetadata({...inventoryMetadata, location: e.target.value})}
                          placeholder="main_warehouse"
                          className="mt-1 h-8 text-sm"
                          required
                        />
                      </div>
                    </div>

                    {/* Columna 2 */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Equipo</label>
                        <select
                          value={inventoryMetadata.equipment}
                          onChange={(e) => setInventoryMetadata({...inventoryMetadata, equipment: e.target.value})}
                          className="mt-1 h-8 text-sm border rounded px-2 w-full bg-white"
                        >
                          <option value="barcode_scanner">Escáner</option>
                          <option value="manual">Manual</option>
                          <option value="rfid">RFID</option>
                          <option value="voice_picking">Voice picking</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Método de Conteo</label>
                        <select
                          value={inventoryMetadata.counting_method}
                          onChange={(e) => setInventoryMetadata({...inventoryMetadata, counting_method: e.target.value})}
                          className="mt-1 h-8 text-sm border rounded px-2 w-full bg-white"
                        >
                          <option value="scanner">Escáner</option>
                          <option value="manual">Manual</option>
                          <option value="rfid">RFID</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Verificación</label>
                        <select
                          value={inventoryMetadata.verification}
                          onChange={(e) => setInventoryMetadata({...inventoryMetadata, verification: e.target.value})}
                          className="mt-1 h-8 text-sm border rounded px-2 w-full bg-white"
                        >
                          <option value="single_check">Verificación simple</option>
                          <option value="double_check">Doble verificación</option>
                          <option value="triple_check">Triple verificación</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notas - span completo */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700">Notas</label>
                    <Input
                      type="text"
                      value={inventoryMetadata.notes}
                      onChange={(e) => setInventoryMetadata({...inventoryMetadata, notes: e.target.value})}
                      placeholder="Notas adicionales del inventario..."
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Botón para buscar productos */}
                <div>
                  <label className={styles.label()}>Agregar Producto</label>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowProductSearchModal(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 flex items-center gap-3"
                  >
                    <Search className="w-5 h-5" />
                    Buscar y Seleccionar Producto
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Haz clic para abrir el buscador de productos y seleccionar uno
                  </p>
                </div>

                {/* Card de preparación del producto seleccionado - COMPACTO */}
                {selectedProductForBulk && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-green-800">
                        <Package className="w-4 h-4" />
                        <span className="font-medium text-sm">Preparar Ajuste</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProductForBulk(null);
                          setBulkProductData({
                            quantity_checked: '',
                            metadata: {
                              source: 'physical_count',
                              operator: '',
                              location: '',
                              timestamp: new Date().toISOString(),
                              verification_status: 'pending',
                              adjustment_reason: ''
                            }
                          });
                        }}
                        className="h-6 w-6 p-0 text-green-600"
                      >
                        ×
                      </Button>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-medium text-green-900 text-sm">{selectedProductForBulk.name}</h4>
                      <p className="text-xs text-green-700">ID: {selectedProductForBulk.id}</p>
                    </div>

                    <div className="mb-3">
                      <label className="text-xs font-medium text-green-800">Cantidad</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={bulkProductData.quantity_checked}
                        onChange={(e) => setBulkProductData({...bulkProductData, quantity_checked: e.target.value})}
                        placeholder="15.5"
                        className="mt-1 h-8 text-sm"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={addProductToBulkAdjustment}
                      disabled={!bulkProductData.quantity_checked}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-8 text-sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar a Lista
                    </Button>
                  </div>
                )}

                {/* Lista de ajustes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">Productos para Ajustar ({bulkAdjustments.length})</h3>
                    {bulkAdjustments.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBulkAdjustments([])}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Limpiar Todo
                      </Button>
                    )}
                  </div>

                  {bulkAdjustments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium mb-2">No hay productos agregados</p>
                      <p className="text-sm">Busca y selecciona productos para comenzar</p>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-96 border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-medium">ID Producto</th>
                            <th className="text-left p-3 font-medium">Nombre</th>
                            <th className="text-left p-3 font-medium">Descripción</th>
                            <th className="text-right p-3 font-medium">Cantidad Actual</th>
                            <th className="text-right p-3 font-medium">Nueva Cantidad</th>
                            <th className="text-center p-3 font-medium">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkAdjustments.map((adjustment, index) => (
                            <tr key={adjustment.product_id} className="border-t hover:bg-gray-50">
                              <td className="p-3">
                                <span className="font-mono text-blue-600">{adjustment.product_id}</span>
                              </td>
                              <td className="p-3">
                                <span className="font-medium">
                                  {adjustment.name || `Producto ${adjustment.product_id}`}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="text-gray-600 text-xs">
                                  {adjustment.description || 'Sin descripción'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <span className="font-medium text-gray-900">
                                  {adjustment.current_quantity || 0}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {editingBulkIndex === index ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={adjustment.quantity_checked}
                                    onChange={(e) => updateBulkAdjustment(index, 'quantity_checked', parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right"
                                    onBlur={() => setEditingBulkIndex(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingBulkIndex(null)}
                                    autoFocus
                                  />
                                ) : (
                                  <div
                                    className="cursor-pointer hover:bg-gray-100 p-1 rounded flex items-center justify-end"
                                    onClick={() => setEditingBulkIndex(index)}
                                  >
                                    <span className="font-medium">{adjustment.quantity_checked}</span>
                                    <Edit className="w-3 h-3 inline ml-1 opacity-50" />
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeBulkAdjustment(adjustment.product_id)}
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
                {bulkAdjustments.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm">
                      <span className="font-medium">Resumen:</span> {bulkAdjustments.length} productos listos para ajustar
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    onClick={saveBulkAdjustments}
                    disabled={loading || bulkAdjustments.length === 0}
                    className={`flex-1 ${styles.button('primary')}`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Aplicando ajustes...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        Aplicar Ajustes ({bulkAdjustments.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Archive className="w-5 h-5" />
                    <span className="font-medium">Historial de Inventarios</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Consulta y gestiona el registro completo de todas las operaciones de inventario realizadas.
                  </p>
                </div>

                {/* Controles de búsqueda y paginación */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Registros por página:</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setHistoryLimit(5)}
                        variant={historyLimit === 5 ? "default" : "outline"}
                        size="sm"
                      >
                        5
                      </Button>
                      <Button
                        onClick={() => setHistoryLimit(10)}
                        variant={historyLimit === 10 ? "default" : "outline"}
                        size="sm"
                      >
                        10
                      </Button>
                      <Button
                        onClick={() => setHistoryLimit(20)}
                        variant={historyLimit === 20 ? "default" : "outline"}
                        size="sm"
                      >
                        20
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setHistoryPage(1);
                        fetchHistory();
                      }}
                      disabled={historyLoading}
                      variant="outline"
                      size="sm"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Actualizar
                    </Button>
                    <Button
                      onClick={fetchHistory}
                      disabled={historyLoading}
                      className={styles.button('primary')}
                    >
                      {historyLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      {historyLoading ? 'Buscando...' : 'Buscar Historial'}
                    </Button>
                    <Button onClick={handleValidateConsistency} className={styles.button('secondary')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Validar Consistencia
                    </Button>
                  </div>
                </div>

                {/* Contenido del historial */}
                {historyLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                    <span>Cargando historial de inventarios...</span>
                  </div>
                ) : historyData.length === 0 ? (
                  <EmptyState
                    icon={Archive}
                    title="No hay registros en el historial"
                    description="No se encontraron registros de inventario para mostrar"
                    actionLabel="Cargar Datos"
                    onAction={fetchHistory}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Información de página */}
                    <div className="text-sm text-muted-foreground">
                      Página {historyPage} • Mostrando {historyData.length} de {historyPagination.total || 0} registros
                    </div>

                    {/* Tabla de historial */}
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-3 font-medium">ID</th>
                            <th className="text-center p-3 font-medium">Productos Afectados</th>
                            <th className="text-center p-3 font-medium">Tipo de Inventario</th>
                            <th className="text-center p-3 font-medium">Fecha</th>
                            <th className="text-left p-3 font-medium">Operador</th>
                            <th className="text-left p-3 font-medium">Notas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyData.map((record, index) => {
                            // Extraer información de metadata
                            const metadata = record.metadata || {};
                            const template = metadata.template || metadata.inventory_type || 'MANUAL';
                            const notes = metadata.notes || metadata.checker_notes || metadata.reason || 'Sin notas';
                            const totalProducts = metadata.total_products || 'N/A';

                            return (
                              <tr key={record.id || index} className="border-t hover:bg-gray-50">
                                <td className="p-3 font-mono text-sm">{record.id}</td>
                                <td className="p-3 text-center">
                                  <span className="font-medium">
                                    {totalProducts !== 'N/A' ? `${totalProducts} productos` : 'No especificado'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    template === 'PHYSICAL_COUNT' ? 'bg-blue-100 text-blue-800' :
                                    template === 'manual_check' ? 'bg-green-100 text-green-800' :
                                    template === 'restock_check' ? 'bg-purple-100 text-purple-800' :
                                    template === 'CYCLE_COUNT' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {template === 'PHYSICAL_COUNT' ? 'Conteo Físico' :
                                     template === 'manual_check' ? 'Revisión Manual' :
                                     template === 'restock_check' ? 'Revisión Restock' :
                                     template === 'CYCLE_COUNT' ? 'Conteo Cíclico' :
                                     template || 'Manual'}
                                  </span>
                                </td>
                                <td className="p-3 text-center text-sm">
                                  {record.check_date ?
                                    new Date(record.check_date).toLocaleString('es-ES', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 'N/A'
                                  }
                                </td>
                                <td className="p-3 text-sm">
                                  <div className="font-medium">
                                    {metadata.operator || record.user_id || 'Sistema'}
                                  </div>
                                  {metadata.location && (
                                    <div className="text-xs text-gray-500">
                                      📍 {metadata.location}
                                    </div>
                                  )}
                                </td>
                                <td className="p-3 text-sm">
                                  <div className="max-w-xs truncate" title={notes}>
                                    {notes}
                                  </div>
                                  {metadata.equipment && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      🔧 {metadata.equipment}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Controles de paginación */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Mostrando {historyData.length} de {historyPagination.total || 0} registros
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => {
                            const newPage = Math.max(1, historyPage - 1);
                            setHistoryPage(newPage);
                          }}
                          disabled={historyPage === 1 || historyLoading}
                          variant="outline"
                          size="sm"
                        >
                          Anterior
                        </Button>
                        <span className="px-3 py-2 text-sm">
                          Página {historyPage} de {historyPagination.totalPages || 1}
                        </span>
                        <Button
                          onClick={() => {
                            const newPage = historyPage + 1;
                            const maxPages = historyPagination.totalPages || 1;
                            if (newPage <= maxPages) {
                              setHistoryPage(newPage);
                            }
                          }}
                          disabled={historyPage >= (historyPagination.totalPages || 1) || historyLoading}
                          variant="outline"
                          size="sm"
                        >
                          Siguiente
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-medium">Reportes de Inventario</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Genera y consulta reportes detallados sobre el estado y movimientos del inventario.
                  </p>
                </div>

                <p className="text-gray-500">Funcionalidad de reportes completa disponible próximamente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de búsqueda de productos - siempre disponible */}
      {showProductSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className={styles.header('h2')}>Seleccionar Producto</h2>
              <Button
                onClick={() => {
                  setShowProductSearchModal(false);
                }}
                className="text-2xl hover:bg-gray-100 px-3 py-1 rounded"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <ProductSearchInput
                onProductSelect={(product) => {
                  if (activeTab === 'unit-adjustment') {
                    handleProductSelect(product);
                  } else if (activeTab === 'bulk-adjustment') {
                    handleProductSelectForBulk(product);
                  }
                  setShowProductSearchModal(false);
                }}
                selectedProduct={activeTab === 'unit-adjustment' ? selectedProduct : selectedProductForBulk}
                placeholder="Buscar producto por ID, nombre o código de barras..."
                showSelectedProduct={true}
              />

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProductSearchModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryPage;