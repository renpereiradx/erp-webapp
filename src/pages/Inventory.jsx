import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Package, AlertTriangle, CheckCircle, Calculator, Settings, Layers, TrendingUp, BarChart3, Archive, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DataState from '@/components/ui/DataState';
import ProductSearchInput from '@/components/ui/ProductSearchInput';
import ProductAdjustmentCard from '@/components/ui/ProductAdjustmentCard';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import useInventoryStore from '@/store/useInventoryStore';

const InventoryPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const {
    inventories,
    loading,
    error,
    fetchInventories,
    createInventory,
    invalidateInventory,
    fetchInventoryDetails,
    validateStockConsistency,
    createManualAdjustment,
    clearError
  } = useInventoryStore();
  
  // Estados locales para UI
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'history', 'create', 'adjustment'
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([
    { product_id: '', quantity_checked: 0, selectedProduct: null }
  ]);
  
  // Estados para ajustes manuales
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    new_quantity: 0,
    reason: ''
  });
  
  // NO cargar datos automáticamente - el usuario debe hacerlo explícitamente
  // useEffect(() => {
  //   fetchInventories();
  // }, [fetchInventories]);
  
  // Filtrar inventarios localmente (MVP simple)
  const filteredInventories = inventories.filter(inventory => 
    inventory.id?.toString().includes(searchTerm.toLowerCase()) ||
    inventory.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // Opciones principales de inventario
  const inventoryOptions = [
    {
      id: 'unit-adjustment',
      title: 'Ajuste Unitario',
      description: 'Corrige el stock de un producto específico',
      icon: Settings,
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-600',
      action: () => handleCreateAdjustment(),
      recommended: false
    },
    {
      id: 'mass-inventory',
      title: 'Inventario Masivo',
      description: 'Conteo físico de múltiples productos',
      icon: Layers,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      action: () => handleCreateInventory(),
      recommended: true
    },
    {
      id: 'price-adjustment',
      title: 'Ajuste de Precios',
      description: 'Actualizar precios de productos (Próximamente)',
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      action: () => alert('Funcionalidad disponible próximamente'),
      recommended: false,
      disabled: true
    },
    {
      id: 'stock-validation',
      title: 'Validar Consistencia',
      description: 'Verificar la integridad del inventario',
      icon: CheckCircle,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
      iconColor: 'text-purple-600',
      action: () => handleValidateConsistency(),
      recommended: false
    }
  ];
  
  // Handlers
  const handleCreateInventory = () => {
    setModalType('create');
    setInventoryItems([{ product_id: '', quantity_checked: 0, selectedProduct: null }]);
    setShowModal(true);
  };

  const handleCreateAdjustment = () => {
    setModalType('adjustment');
    setSelectedProduct(null);
    setAdjustmentData({ new_quantity: 0, reason: '' });
    setShowModal(true);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    // Pre-llenar con stock actual si está disponible
    if (product.current_stock !== undefined) {
      setAdjustmentData(prev => ({ 
        ...prev, 
        new_quantity: product.current_stock 
      }));
    }
  };

  const handleSaveAdjustment = async (adjustmentRequest) => {
    if (!adjustmentRequest || !adjustmentRequest.product_id) {
      alert('Datos de ajuste inválidos');
      return;
    }
    
    const result = await createManualAdjustment(adjustmentRequest);
    
    if (result && result.success) {
      setShowModal(false);
      setSelectedProduct(null);
      setAdjustmentData({ new_quantity: 0, reason: '' });
      alert(`Ajuste manual aplicado correctamente:\n${adjustmentRequest.reason}\nCantidad: ${adjustmentRequest.new_quantity}`);
    } else {
      alert(`Error al aplicar ajuste: ${result?.error || 'Error desconocido'}`);
    }
  };
  
  const handleViewDetails = async (inventory) => {
    setSelectedInventory(inventory);
    setModalType('details');
    setShowModal(true);
    
    // Cargar detalles del inventario
    await fetchInventoryDetails(inventory.id);
  };
  
  const handleValidateConsistency = () => {
    setModalType('validate');
    setShowModal(true);
  };
  
  const handleInvalidateInventory = async (inventory) => {
    if (window.confirm(`¿Invalidar inventario ID ${inventory.id}?`)) {
      await invalidateInventory(inventory.id);
    }
  };
  
  const handleAddItem = () => {
    setInventoryItems(prev => [...prev, { product_id: '', quantity_checked: 0, selectedProduct: null }]);
  };
  
  const handleRemoveItem = (index) => {
    if (inventoryItems.length > 1) {
      setInventoryItems(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const handleItemChange = (index, field, value) => {
    setInventoryItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleProductSelectForItem = (index, product) => {
    setInventoryItems(prev => prev.map((item, i) => 
      i === index ? { 
        ...item, 
        product_id: product.product_id,
        selectedProduct: product
      } : item
    ));
  };

  const handleClearProductForItem = (index) => {
    setInventoryItems(prev => prev.map((item, i) => 
      i === index ? { 
        ...item, 
        product_id: '',
        selectedProduct: null,
        quantity_checked: 0
      } : item
    ));
  };
  
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    
    const validItems = inventoryItems
      .filter(item => item.product_id && item.selectedProduct && typeof item.quantity_checked === 'number')
      .map(item => ({
        product_id: item.product_id,
        quantity_checked: item.quantity_checked
      }));
    
    if (validItems.length === 0) {
      alert('Debes agregar al menos un producto válido con cantidad');
      return;
    }
    
    const result = await createInventory({
      check_date: new Date().toISOString(),
      details: validItems
    });
    
    if (result.success) {
      setShowModal(false);
      setInventoryItems([{ product_id: '', quantity_checked: 0, selectedProduct: null }]);
      alert(`Inventario masivo creado exitosamente con ${validItems.length} productos`);
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

  // Renderizar modal como componente común para todos los estados
  const renderModal = () => {
    if (!showModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className={styles.header('h2')}>
              {modalType === 'create' && t('inventory.modal.create', 'INVENTARIO MASIVO')}
              {modalType === 'adjustment' && 'AJUSTE MANUAL UNITARIO'}
              {modalType === 'details' && t('inventory.modal.details', 'DETALLES DEL INVENTARIO')}
              {modalType === 'validate' && t('inventory.consistency.title', 'VALIDACIÓN DE CONSISTENCIA')}
            </h2>
            <Button
              onClick={() => setShowModal(false)}
              className="text-2xl hover:bg-gray-100 px-3 py-1 rounded"
            >
              ×
            </Button>
          </div>
          
          {/* Modal para ajuste manual unitario */}
          {modalType === 'adjustment' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Ajuste Manual Unitario</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Ajusta el stock de un solo producto. Ideal para correcciones rápidas con control granular.
                </p>
              </div>
              
              <div>
                <label className={styles.label()}>
                  Buscar Producto
                </label>
                <ProductSearchInput
                  onProductSelect={handleProductSelect}
                  selectedProduct={selectedProduct}
                  onClear={() => setSelectedProduct(null)}
                  placeholder="Buscar por ID, nombre o código de barras..."
                  showSelectedProduct={false}
                />
              </div>

              {/* Nueva card informativa y completa */}
              {selectedProduct && (
                <ProductAdjustmentCard
                  product={selectedProduct}
                  onClear={() => setSelectedProduct(null)}
                  onAdjustmentSubmit={handleSaveAdjustment}
                  initialQuantity={selectedProduct.current_stock || selectedProduct.stock_quantity || 0}
                />
              )}
              
              {!selectedProduct && (
                <div className="p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">Selecciona un producto</p>
                  <p className="text-sm">
                    Busca el producto que deseas ajustar usando el campo de búsqueda de arriba
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Modal para inventario masivo */}
          {modalType === 'create' && (
            <form onSubmit={handleSaveInventory} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <Layers className="w-5 h-5" />
                  <span className="font-medium">Inventario Masivo</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Conteo físico de múltiples productos. Ideal para inventarios completos o por secciones.
                </p>
              </div>
              
              <div>
                <label className={styles.label()}>
                  {t('inventory.field.check_date', 'Fecha de Conteo')}
                </label>
                <Input
                  type="datetime-local"
                  className={styles.input()}
                  defaultValue={new Date().toISOString().slice(0, -8)}
                />
              </div>
              
              <div>
                <label className={styles.label()}>
                  {t('inventory.field.items', 'Productos a Inventariar')}
                </label>
                
                {inventoryItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-700">Producto #{index + 1}</span>
                      <Button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                        disabled={inventoryItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Buscar Producto</label>
                        <ProductSearchInput
                          onProductSelect={(product) => handleProductSelectForItem(index, product)}
                          selectedProduct={item.selectedProduct}
                          onClear={() => handleClearProductForItem(index)}
                          placeholder="Buscar por ID, nombre o código..."
                          showSelectedProduct={true}
                        />
                      </div>
                      
                      {item.selectedProduct && (
                        <div>
                          <label className="text-sm font-medium">Cantidad Contada</label>
                          <Input
                            type="number"
                            placeholder="Cantidad física contada"
                            min="0"
                            value={item.quantity_checked}
                            onChange={(e) => handleItemChange(index, 'quantity_checked', parseInt(e.target.value) || 0)}
                            className={styles.input()}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className={`w-full mt-2 ${styles.button('secondary')}`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className={`flex-1 ${styles.button('primary')}`}
                  disabled={loading}
                >
                  {t('action.save', 'Guardar')}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 ${styles.button('secondary')}`}
                >
                  {t('action.cancel', 'Cancelar')}
                </Button>
              </div>
            </form>
          )}
          
          {/* Modal para detalles */}
          {modalType === 'details' && selectedInventory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                <div>
                  <span className="font-bold">ID:</span>
                  <span className="ml-2">{selectedInventory.id}</span>
                </div>
                <div>
                  <span className="font-bold">Usuario:</span>
                  <span className="ml-2">{selectedInventory.user_id}</span>
                </div>
                <div>
                  <span className="font-bold">Estado:</span>
                  <span className="ml-2">{selectedInventory.state ? 'Activo' : 'Inactivo'}</span>
                </div>
                <div>
                  <span className="font-bold">Fecha:</span>
                  <span className="ml-2">{formatDate(selectedInventory.check_date)}</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowModal(false)}
                className={`w-full ${styles.button('primary')}`}
              >
                Cerrar
              </Button>
            </div>
          )}
          
          {/* Modal para validación de consistencia */}
          {modalType === 'validate' && (
            <div className="space-y-4">
              <div className="text-center">
                <Calculator className="w-12 h-12 mx-auto text-primary mb-4" />
                <p className="text-muted-foreground">
                  La funcionalidad de validación de consistencia se implementará próximamente.
                </p>
              </div>
              
              <Button 
                onClick={() => setShowModal(false)}
                className={`w-full ${styles.button('primary')}`}
              >
                Entendido
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vista principal del dashboard
  if (currentView === 'dashboard') {
    return (
      <>
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
                onClick={() => setCurrentView('history')}
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
        {renderModal()}
      </>
    );
  }

  // Vista de historial (existente)
  if (currentView === 'history') {
    // Estados de UI
    if (loading && inventories.length === 0) {
      return (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className={styles.header('h1')}>Historial de Inventarios</h1>
            <Button onClick={() => setCurrentView('dashboard')} className={styles.button('outline')}>
              ← Volver al Dashboard
            </Button>
          </div>
          <DataState variant="loading" skeletonVariant="list" />
          {renderModal()}
        </>
      );
    }
    
    if (error) {
      return (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className={styles.header('h1')}>Historial de Inventarios</h1>
            <Button onClick={() => setCurrentView('dashboard')} className={styles.button('outline')}>
              ← Volver al Dashboard
            </Button>
          </div>
          <DataState 
            variant="error" 
            title={t('inventory.error.title', 'Error')}
            message={error}
            onRetry={() => {
              clearError();
              fetchInventories();
            }}
          />
          {renderModal()}
        </>
      );
    }

    if (!loading && inventories.length === 0) {
      return (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className={styles.header('h1')}>Historial de Inventarios</h1>
            <Button onClick={() => setCurrentView('dashboard')} className={styles.button('outline')}>
              ← Volver al Dashboard
            </Button>
          </div>
          <DataState
            variant="empty"
            title={t('inventory.empty.title', 'Sin inventarios')}
            message={t('inventory.empty.message', 'No hay inventarios registrados')}
            actionLabel={t('inventory.action.create', 'Crear Inventario')}
            onAction={handleCreateInventory}
          />
          {renderModal()}
        </>
      );
    }
    
    return (
      <>
        <div className="space-y-6">
          {/* Header del historial */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className={styles.header('h1')}>Historial de Inventarios</h1>
              <p className="text-muted-foreground font-bold uppercase tracking-wide">
                Registro completo de operaciones de inventario
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setCurrentView('dashboard')} className={styles.button('outline')}>
                ← Dashboard
              </Button>
              <Button onClick={handleValidateConsistency} className={styles.button('secondary')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Validar Consistencia
              </Button>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('inventory.search.placeholder', 'Buscar inventarios...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${styles.input()}`}
            />
          </div>

          {/* Lista de inventarios */}
          <div className="space-y-4">
            {filteredInventories.map(inventory => (
              <div key={inventory.id} className={`${styles.card('hover:shadow-lg transition-all cursor-pointer')} p-4`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <Package className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="font-bold text-lg">ID: {inventory.id}</h3>
                        <p className="text-muted-foreground">
                          Usuario: {inventory.user_id} | Fecha: {formatDate(inventory.check_date)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {inventory.state ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleViewDetails(inventory)}
                      className="border-2 border-black hover:bg-blue-50"
                      title={t('inventory.buttons.details', 'Ver Detalles')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {inventory.state && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleInvalidateInventory(inventory)}
                        className="border-2 border-black hover:bg-red-100"
                        title={t('inventory.buttons.invalidate', 'Invalidar')}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {renderModal()}
      </>
    );
  }
};

export default InventoryPage;