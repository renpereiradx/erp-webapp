/**
 * Modal de detalles del producto con tabs para Descripción, Precios y Stock
 * Basado en la especificación OpenAPI Business Management API
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  X, 
  Package, 
  FileText, 
  DollarSign, 
  Layers, 
  Edit, 
  Save,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { productService } from '@/services/productService';
import BusinessManagementAPI from '@/services/BusinessManagementAPI';
import { isEnrichedProduct } from '@/utils/productUtils';
import { analyzeProductData, extractSafeProductData } from '@/utils/productDataUtils';
import StatusBadge from '@/components/ui/StatusBadge';
import { useI18n } from '@/lib/i18n';

const ProductDetailModal = ({ 
  isOpen, 
  onClose, 
  product,
  onRefresh
}) => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para descripción, precios, stock y categorías
  const [description, setDescription] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [priceData, setPriceData] = useState({
    cost_price: '',
    sale_price: '',
    tax: ''
  });
  const [editingPrice, setEditingPrice] = useState(false);
  const [stock, setStock] = useState({
    current: 0,
    minimum: 0,
    maximum: 0,
    reserved: 0
  });
  const [stockData, setStockData] = useState({
    quantity: '',
    exp: '',
    entity: { name: '' }
  });
  const [editingStock, setEditingStock] = useState(false);
  const [categories, setCategories] = useState([]);

  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  useEffect(() => {
    if (isOpen && product?.id) {
      // Limpiar mensajes al abrir el modal
      setError('');
      setSuccessMessage('');
      
      // Cargar detalles del producto y categorías en paralelo
      const loadData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            loadProductDetailsInternal(),
            loadCategories()
          ]);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product?.id]); // Solo dependemos de los valores que realmente usamos

  const loadProductDetailsInternal = async () => {
    if (!product?.id) return;
    
    try {
      // Analizar qué datos ya están disponibles para evitar API calls innecesarias
      const analysis = analyzeProductData(product);
      const safeData = extractSafeProductData(product);
      
      // ✅ DESCRIPCIÓN - Solo API call si es necesario
      if (safeData.description !== null) {
        setDescription(safeData.description);
      } else {
        try {
          const descriptions = await productService.getProductDescriptions(product.id);
          if (descriptions && descriptions.length > 0) {
            setDescription(descriptions[0].description || t('products.no_description'));
          } else {
            setDescription(t('products.no_description'));
          }
        } catch (error) {
          setDescription(t('products.no_description'));
        }
      }

      // ✅ PRECIOS - Usar datos disponibles
      setPriceData(safeData.priceData);

      // ✅ STOCK - Solo API call si es necesario
      if (safeData.stockData.current !== null) {
        setStock(safeData.stockData);
      } else {
        try {
          const stockData = await productService.getStockByProductId(product.id);
          if (stockData) {
            setStock({
              current: stockData.current_stock || stockData.quantity || 0,
              minimum: stockData.minimum_stock || 0,
              maximum: stockData.maximum_stock || 0,
              reserved: stockData.reserved_stock || 0
            });
          } else {
            setStock({
              current: 0,
              minimum: 0,
              maximum: 0,
              reserved: 0
            });
          }
        } catch (error) {
          setStock({
            current: 0,
            minimum: 0,
            maximum: 0,
            reserved: 0
          });
        }
      }
      
    } catch (error) {
      setError(t('products.error.load_details') + ': ' + error.message);
      
      // Fallback usando datos seguros (sin más API calls)
      const safeData = extractSafeProductData(product);
      setDescription(safeData.description || t('products.no_description'));
      setPriceData(safeData.priceData);
      setStock(safeData.stockData.current !== null ? safeData.stockData : {
        current: 0,
        minimum: 0,
        maximum: 0,
        reserved: 0
      });
    }
  };

  // Función pública para llamar externamente si es necesario
  const loadProductDetails = async () => {
    setLoading(true);
    try {
      await loadProductDetailsInternal();
    } finally {
      setLoading(false);
    }
  };

  const getModalStyles = () => {
    if (isNeoBrutalism) return {
      overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      },
      modal: {
        background: 'var(--background)',
        border: '4px solid var(--border)',
        borderRadius: '0px',
        boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto'
      }
    };

    return {
      overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      },
      modal: {
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto'
      }
    };
  };

  const getTabStyles = (tabName) => {
    const isActive = activeTab === tabName;
    
    if (isNeoBrutalism) return {
      padding: '12px 24px',
      border: '3px solid var(--border)',
      borderRadius: '0px',
      background: isActive ? 'var(--brutalist-lime)' : 'var(--background)',
      color: isActive ? '#000000' : 'var(--foreground)',
      cursor: 'pointer',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.025em',
      transition: 'all 150ms ease'
    };

    return {
      padding: '8px 16px',
      border: isActive ? 'none' : '1px solid var(--border)',
      borderRadius: '4px',
      background: isActive ? 'var(--primary)' : 'var(--background)',
      color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
      cursor: 'pointer',
      transition: 'all 150ms ease'
    };
  };

  const getInputStyles = () => {
    if (isNeoBrutalism) return {
      border: '3px solid var(--border)',
      borderRadius: '0px',
      padding: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      background: 'var(--background)',
      color: 'var(--foreground)',
      width: '100%'
    };

    return {
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '0.875rem',
      background: 'var(--background)',
      color: 'var(--foreground)',
      width: '100%'
    };
  };

  const handleSaveDescription = async () => {
    if (!product?.id) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Usar PUT directamente al endpoint correcto
      const api = new BusinessManagementAPI();
      await api.makeRequest(`/product_description/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ description })
      });
      
      // Actualizar el producto local para reflejar los cambios
      if (product._enriched) {
        product.description = description;
      }
      
      setEditingDescription(false);
      setSuccessMessage(t('products.description_updated'));
      
      // Limpiar el mensaje de éxito después de 5 segundos (aumentado para mejor visibilidad)
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Refrescar la lista si es necesario
      onRefresh && onRefresh();
    } catch (err) {
      setError(t('products.error.save_description') + ': ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrice = async () => {
    if (!product?.id) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const pricePayload = {
        cost_price: parseFloat(priceData.cost_price),
        sale_price: priceData.sale_price ? parseFloat(priceData.sale_price) : undefined,
        tax: priceData.tax ? parseFloat(priceData.tax) : undefined
      };

      await productService.createProductPrice(product.id, pricePayload);
      
      // Actualizar el producto local para reflejar los cambios
      if (product._enriched) {
        product.purchase_price = pricePayload.cost_price;
        product.price = pricePayload.sale_price || pricePayload.cost_price;
        product.tax = pricePayload.tax;
      }
      
      setEditingPrice(false);
      setSuccessMessage(t('products.prices_updated'));
      
      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
      
      onRefresh && onRefresh();
    } catch (err) {
      setError(t('products.error.save_price') + ': ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStock = async () => {
    if (!product?.id) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const stockPayload = {
        quantity: parseInt(stockData.quantity),
        exp: stockData.exp || undefined,
        entity: stockData.entity.name ? { name: stockData.entity.name } : undefined
      };

      await productService.createStock(product.id, stockPayload);
      
      // Actualizar el producto local para reflejar los cambios
      if (product._enriched) {
        product.stock_quantity = stockPayload.quantity;
      }
      
      setEditingStock(false);
      setSuccessMessage(t('products.stock_updated'));
      
      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
      
      onRefresh && onRefresh();
    } catch (err) {
      setError(t('products.error.save_stock') + ': ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('Token disponible:', !!token);
      
      const cats = await productService.getAllCategories();
      console.log('Categorías recibidas:', cats);
      
      if (Array.isArray(cats)) {
        setCategories(cats);
        console.log(`${cats.length} categorías cargadas exitosamente`);
      } else if (cats && typeof cats === 'object' && cats.data && Array.isArray(cats.data)) {
        setCategories(cats.data);
        console.log(`${cats.data.length} categorías cargadas exitosamente (de data)`);
      } else if (cats && typeof cats === 'object' && cats.categories && Array.isArray(cats.categories)) {
        setCategories(cats.categories);
        console.log(`${cats.categories.length} categorías cargadas exitosamente (de categories)`);
      } else {
        console.warn('Formato de respuesta de categorías no reconocido:', cats);
        setCategories([]);
      }
    } catch (err) {
      // En caso de error del servidor, usar categorías por defecto
      const fallbackCategories = [
        { id: 1, name: 'Alimentos', description: 'Productos alimenticios' },
        { id: 2, name: 'Bebidas', description: 'Bebidas variadas' },
        { id: 3, name: 'Limpieza', description: 'Productos de limpieza' },
        { id: 4, name: 'Cuidado Personal', description: 'Productos de higiene' },
        { id: 5, name: 'Hogar', description: 'Artículos para el hogar' }
      ];

      let backendMsg = '';
      if (err && err.response && err.response.data && err.response.data.message) {
        backendMsg = err.response.data.message;
      } else if (err && err.message) {
        backendMsg = err.message;
      } else {
        backendMsg = 'Error desconocido';
      }

      if (backendMsg.includes('500') || backendMsg.includes('servidor')) {
        console.warn('Error del servidor, usando categorías por defecto');
        setCategories(fallbackCategories);
        setError('Usando categorías por defecto debido a error del servidor');
      } else {
        setError('Error al cargar categorías: ' + backendMsg);
        setCategories([]);
      }

      // Log detallado para depuración
      console.error('Error completo al cargar categorías:', {
        error: err,
        message: err?.message,
        status: err?.status,
        response: err?.response,
        stack: err?.stack
      });
    }
  };

  const modalStyles = getModalStyles();
  const inputStyles = getInputStyles();

  // Exponer las categorías para el select/filtro local
  // Ejemplo de uso: <select>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select>

  if (!isOpen || !product) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose} data-testid="product-detail-modal-overlay">
      <div
        style={modalStyles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        data-testid="product-detail-modal"
      >
        {/* Header */}
        <div style={{ 
          padding: '24px', 
          borderBottom: isNeoBrutalism ? '3px solid var(--border)' : '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package className="w-6 h-6" />
            <div>
              <h2 id="product-detail-title" data-testid="product-detail-title" style={{
                fontSize: isNeoBrutalism ? '1.5rem' : '1.25rem',
                fontWeight: isNeoBrutalism ? '800' : '600',
                textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                margin: 0
              }}>
                {product.name}
              </h2>
               <p data-testid="product-detail-id" style={{
                 fontSize: '0.875rem',
                 color: 'var(--muted-foreground)',
                 margin: '4px 0 0 0'
               }}>
                {t('products.id_label')}: {product.id}
               </p>
             </div>
           </div>
           <button
            onClick={onClose}
            aria-label={isNeoBrutalism ? 'Cerrar' : 'Close'}
            data-testid="product-detail-close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--muted-foreground)'
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ 
          padding: '16px 24px 0 24px',
          borderBottom: isNeoBrutalism ? '3px solid var(--border)' : '1px solid var(--border)'
        }} data-testid="product-detail-tabs">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              style={getTabStyles('info')}
              onClick={() => setActiveTab('info')}
              data-testid="product-detail-tab-info"
              aria-selected={activeTab === 'info'}
            >
              <Package className="w-4 h-4 mr-2" />
              {isNeoBrutalism ? t('products.tabs.info').toUpperCase() : t('products.tabs.info')}
            </button>
            <button 
              style={getTabStyles('description')}
              onClick={() => setActiveTab('description')}
              data-testid="product-detail-tab-description"
              aria-selected={activeTab === 'description'}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isNeoBrutalism ? t('products.tabs.description').toUpperCase() : t('products.tabs.description')}
            </button>
            <button 
              style={getTabStyles('price')}
              onClick={() => setActiveTab('price')}
              data-testid="product-detail-tab-price"
              aria-selected={activeTab === 'price'}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {isNeoBrutalism ? t('products.tabs.price').toUpperCase() : t('products.tabs.price')}
            </button>
            <button 
              style={getTabStyles('stock')}
              onClick={() => setActiveTab('stock')}
              data-testid="product-detail-tab-stock"
              aria-selected={activeTab === 'stock'}
            >
              <Layers className="w-4 h-4 mr-2" />
              {isNeoBrutalism ? t('products.tabs.stock').toUpperCase() : t('products.tabs.stock')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', minHeight: '300px' }} data-testid="product-detail-content">
          {error && (
            <div data-testid="product-detail-error" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#dc2626',
              borderRadius: isNeoBrutalism ? '0px' : '6px',
              border: isNeoBrutalism ? '3px solid #ef4444' : '2px solid #ef4444',
              marginBottom: '20px',
              fontSize: '0.95rem',
              fontWeight: '600',
              boxShadow: isNeoBrutalism ? '4px 4px 0px #ef4444' : '0 2px 8px rgba(239, 68, 68, 0.3)'
            }}>
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {successMessage && (
            <div data-testid="product-detail-success" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#059669',
              borderRadius: isNeoBrutalism ? '0px' : '6px',
              border: isNeoBrutalism ? '3px solid #10b981' : '2px solid #10b981',
              marginBottom: '20px',
              fontSize: '0.95rem',
              fontWeight: '600',
              boxShadow: isNeoBrutalism ? '4px 4px 0px #10b981' : '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle className="w-5 h-5" />
              {successMessage}
            </div>
          )}

          {/* Tab: Información */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="product-detail-info">
              
              {/* Información general enriquecida */}
              {product._enriched && (
                <div style={{ 
                  padding: '16px', 
                  background: 'rgba(99, 102, 241, 0.1)', 
                  borderRadius: isNeoBrutalism ? '0px' : '6px',
                  border: isNeoBrutalism ? '2px solid #6366f1' : '1px solid #6366f1',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#4338ca',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {isNeoBrutalism ? t('products.info_general').toUpperCase() : t('products.info_general')}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
                    <div>
                      <strong>Nombre:</strong><br />
                      <span style={{ color: '#4338ca', fontWeight: '600' }}>
                        {product.name || t('products.no_name')}
                      </span>
                    </div>
                    <div>
                      <strong>Categoría:</strong><br />
                      <span style={{ color: '#4338ca', fontWeight: '600' }}>
                        {product.category_id || product.id_category || t('products.no_category')}
                      </span>
                    </div>
                    <div>
                      <strong>Precio:</strong><br />
                      <span style={{ color: '#059669', fontWeight: '600' }}>
                        ${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <div>
                      <strong>Stock:</strong><br />
                      <span style={{ color: '#059669', fontWeight: '600' }}>
                        {product.stock_quantity !== undefined ? product.stock_quantity : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <strong>Tipo:</strong><br />
                      <span style={{ color: '#4338ca' }}>
                        {product.product_type || 'PHYSICAL'}
                      </span>
                    </div>
                    <div>
                      <strong>Estado:</strong><br />
                      {/* Reemplazo de texto por StatusBadge consistente */}
                      <StatusBadge active={!!(product.is_active !== undefined ? product.is_active : product.state)} />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Debug: Comentado para producción - descomentar si necesitas debug */}
              {/* 
              <div style={{ 
                padding: '12px', 
                background: 'var(--muted)', 
                borderRadius: isNeoBrutalism ? '0px' : '4px',
                border: isNeoBrutalism ? '2px solid var(--border)' : '1px solid var(--border)',
                fontSize: '0.75rem',
                fontFamily: 'monospace'
              }}>
                <strong>Debug - Estructura del producto:</strong>
                <pre>{JSON.stringify(product, null, 2)}</pre>
              </div>
              */}
            </div>
          )}

          {/* Tab: Descripción */}
          {activeTab === 'description' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="product-detail-description">
              
              {/* Información de descripción enriquecida */}
              {product._enriched && (
                <div style={{ 
                  padding: '16px', 
                  background: 'rgba(168, 85, 247, 0.1)', 
                  borderRadius: isNeoBrutalism ? '0px' : '6px',
                  border: isNeoBrutalism ? '2px solid #a855f7' : '1px solid #a855f7',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#7c3aed',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {isNeoBrutalism ? t('products.description_info').toUpperCase() : t('products.description_info')}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
                    <div>
                      <strong>Descripción Disponible:</strong><br />
                      <span style={{ 
                        color: (description && description.length > 0 && description !== t('products.no_description')) ? '#059669' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        {(description && description.length > 0 && description !== t('products.no_description')) ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div>
                      <strong>Longitud:</strong><br />
                      <span style={{ color: '#7c3aed', fontWeight: '600' }}>
                        {(description && description !== t('products.no_description')) ? `${description.length} caracteres` : '0 caracteres'}
                      </span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Descripción:</strong><br />
                      <span style={{ 
                        color: '#6b7280', 
                        fontSize: '0.875rem',
                        fontStyle: (description && description !== t('products.no_description')) ? 'normal' : 'italic'
                      }}>
                        {(description && description !== t('products.no_description')) ? 
                          description : 
                          t('products.no_description')
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <h3 data-testid="product-detail-description-heading" style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                  margin: 0
                }}>
                  {isNeoBrutalism ? t('products.description_heading').toUpperCase() : t('products.description_heading')}
                 </h3>
                {!editingDescription && (
                  <button
                    onClick={() => setEditingDescription(true)}
                    data-testid="product-detail-edit-description"
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: isNeoBrutalism ? '0px' : '4px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    {isNeoBrutalism ? t('products.edit').toUpperCase() : t('products.edit')}
                  </button>
                )}
              </div>

              {editingDescription ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    data-testid="product-detail-description-input"
                    style={{
                      ...inputStyles,
                      resize: 'vertical',
                      minHeight: '120px'
                    }}
                    placeholder={isNeoBrutalism ? 'INGRESE LA DESCRIPCIÓN...' : 'Ingrese la descripción del producto'}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingDescription(false)}
                      data-testid="product-detail-description-cancel"
                      style={{
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: isNeoBrutalism ? '0px' : '4px',
                        padding: '8px 16px',
                        cursor: 'pointer'
                      }}
                    >
                      {isNeoBrutalism ? t('products.cancel').toUpperCase() : t('products.cancel')}
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      disabled={loading}
                      data-testid="product-detail-description-save"
                      style={{
                        background: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                        borderRadius: isNeoBrutalism ? '0px' : '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Save className="w-4 h-4" />
                      {loading ? (isNeoBrutalism ? t('products.saving').toUpperCase() : t('products.saving')) : (isNeoBrutalism ? t('products.save').toUpperCase() : t('products.save'))}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Tab: Precios */}
          {activeTab === 'price' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="product-detail-price">
              
              {/* Información de precios enriquecida */}
              {product._enriched && (
                <div style={{ 
                  padding: '16px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: isNeoBrutalism ? '0px' : '6px',
                  border: isNeoBrutalism ? '2px solid #10b981' : '1px solid #10b981',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#059669',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {isNeoBrutalism ? t('products.price_info').toUpperCase() : t('products.price_info')}
                   </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
                    <div>
                      <strong>Precio Formateado:</strong><br />
                      <span style={{ color: '#059669', fontWeight: '600' }}>
                        {product.price_formatted || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <strong>Precio por Unidad:</strong><br />
                      <span style={{ color: product.has_unit_pricing ? '#059669' : '#6b7280' }}>
                        {product.has_unit_pricing ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div>
                      <strong>Precio Válido:</strong><br />
                      <span style={{ color: product.has_valid_price ? '#059669' : '#ef4444' }}>
                        {product.has_valid_price ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div>
                      <strong>Última Actualización:</strong><br />
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {product.price_updated_at ? new Date(product.price_updated_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                  margin: 0
                }}>
                  {isNeoBrutalism ? t('products.configure_prices').toUpperCase() : t('products.configure_prices')}
                </h3>
                {!editingPrice && (
                  <button
                    onClick={() => setEditingPrice(true)}
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: isNeoBrutalism ? '0px' : '4px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    {isNeoBrutalism ? t('products.configure').toUpperCase() : t('products.configure')}
                  </button>
                )}
              </div>

              {editingPrice ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                      }}>
                        {isNeoBrutalism ? 'PRECIO COSTO *' : 'Precio Costo *'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={priceData.cost_price}
                        onChange={(e) => setPriceData(prev => ({ ...prev, cost_price: e.target.value }))}
                        data-testid="product-detail-price-cost"
                        style={inputStyles}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                      }}>
                        {isNeoBrutalism ? 'PRECIO VENTA' : 'Precio Venta'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={priceData.sale_price}
                        onChange={(e) => setPriceData(prev => ({ ...prev, sale_price: e.target.value }))}
                        data-testid="product-detail-price-sale"
                        style={inputStyles}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                      }}>
                        {isNeoBrutalism ? 'IMPUESTO (%)' : 'Impuesto (%)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={priceData.tax}
                        onChange={(e) => setPriceData(prev => ({ ...prev, tax: e.target.value }))}
                        data-testid="product-detail-price-tax"
                        style={inputStyles}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingPrice(false)}
                      data-testid="product-detail-price-cancel"
                      style={{
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: isNeoBrutalism ? '0px' : '4px',
                        padding: '8px 16px',
                        cursor: 'pointer'
                      }}
                    >
                      {isNeoBrutalism ? t('products.cancel').toUpperCase() : t('products.cancel')}
                    </button>
                    <button
                      onClick={handleSavePrice}
                      disabled={loading || !priceData.cost_price}
                      data-testid="product-detail-price-save"
                      style={{
                        background: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                        borderRadius: isNeoBrutalism ? '0px' : '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Save className="w-4 h-4" />
                      {loading ? (isNeoBrutalism ? t('products.saving').toUpperCase() : t('products.saving')) : (isNeoBrutalism ? t('products.save').toUpperCase() : t('products.save'))}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Tab: Stock */}
          {activeTab === 'stock' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="product-detail-stock">
              
              {/* Información de stock enriquecida */}
              {product._enriched && (
                <div style={{ 
                  padding: '16px', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: isNeoBrutalism ? '0px' : '6px',
                  border: isNeoBrutalism ? '2px solid #3b82f6' : '1px solid #3b82f6',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#1d4ed8',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {isNeoBrutalism ? t('products.stock_info').toUpperCase() : t('products.stock_info')}
                   </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
                    <div>
                      <strong>Estado del Stock:</strong><br />
                      <span style={{ 
                        color: product.stock_status === 'in_stock' ? '#059669' : 
                               product.stock_status === 'medium_stock' ? '#1d4ed8' :
                               product.stock_status === 'low_stock' ? '#ea580c' : '#dc2626',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {product.stock_status ? product.stock_status.replace('_', ' ') : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <strong>Cantidad Actual:</strong><br />
                      <span style={{ color: '#059669', fontWeight: '600', fontSize: '1.125rem' }}>
                        {product.stock_quantity !== undefined ? product.stock_quantity : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <strong>Stock Válido:</strong><br />
                      <span style={{ color: product.has_valid_stock ? '#059669' : '#ef4444' }}>
                        {product.has_valid_stock ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div>
                      <strong>Última Actualización:</strong><br />
                      <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                        {product.stock_updated_at ? new Date(product.stock_updated_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                  margin: 0
                }}>
                  {isNeoBrutalism ? t('products.configure_stock').toUpperCase() : t('products.configure_stock')}
                </h3>
                {!editingStock && (
                  <button
                    onClick={() => setEditingStock(true)}
                    style={{
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: isNeoBrutalism ? '0px' : '4px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    {isNeoBrutalism ? t('products.configure').toUpperCase() : t('products.configure')}
                  </button>
                )}
              </div>

              {editingStock ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                      }}>
                        {isNeoBrutalism ? 'CANTIDAD *' : 'Cantidad *'}
                      </label>
                      <input
                        type="number"
                        value={stockData.quantity}
                        onChange={(e) => setStockData(prev => ({ ...prev, quantity: e.target.value }))}
                        data-testid="product-detail-stock-quantity"
                        style={inputStyles}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                      }}>
                        {isNeoBrutalism ? 'FECHA VENCIMIENTO' : 'Fecha Vencimiento'}
                      </label>
                      <input
                        type="date"
                        value={stockData.exp}
                        onChange={(e) => setStockData(prev => ({ ...prev, exp: e.target.value }))}
                        data-testid="product-detail-stock-exp"
                        style={inputStyles}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                      }}>
                        {isNeoBrutalism ? 'ENTIDAD' : 'Entidad'}
                      </label>
                      <input
                        type="text"
                        value={stockData.entity.name}
                        onChange={(e) => setStockData(prev => ({ 
                          ...prev, 
                          entity: { ...prev.entity, name: e.target.value }
                        }))}
                        data-testid="product-detail-stock-entity"
                        style={inputStyles}
                        placeholder={isNeoBrutalism ? 'NOMBRE ENTIDAD' : 'Nombre de la entidad'}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingStock(false)}
                      data-testid="product-detail-stock-cancel"
                      style={{
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: isNeoBrutalism ? '0px' : '4px',
                        padding: '8px 16px',
                        cursor: 'pointer'
                      }}
                    >
                      {isNeoBrutalism ? t('products.cancel').toUpperCase() : t('products.cancel')}
                    </button>
                    <button
                      onClick={handleSaveStock}
                      disabled={loading || !stockData.quantity}
                      data-testid="product-detail-stock-save"
                      style={{
                        background: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                        borderRadius: isNeoBrutalism ? '0px' : '4px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Save className="w-4 h-4" />
                      {loading ? (isNeoBrutalism ? t('products.saving').toUpperCase() : t('products.saving')) : (isNeoBrutalism ? t('products.save').toUpperCase() : t('products.save'))}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
