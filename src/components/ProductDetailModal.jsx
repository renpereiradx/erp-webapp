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
  Trash2
} from 'lucide-react';
import { productService } from '@/services/productService';

const ProductDetailModal = ({ 
  isOpen, 
  onClose, 
  product,
  onRefresh
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para descripción, precios y stock
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

  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  useEffect(() => {
    if (isOpen && product?.id) {
      loadProductDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product?.id]); // Solo dependemos de los valores que realmente usamos

  const loadProductDetails = async () => {
    if (!product?.id) return;
    
    setLoading(true);
    try {
      // ESTRATEGIA MEJORADA: Evitar endpoints que fallan con 500
      
      // 1. Primero intentar obtener el producto con detalles completos
      let productWithDetails = null;
      try {
        productWithDetails = await productService.getProductWithDetails(product.id);
        
        if (productWithDetails?.description) {
          setDescription(productWithDetails.description);
        }
      } catch (error) {
        // getProductWithDetails failed, continue with fallback
        productWithDetails = product; // Usar el producto base como fallback
      }

      // 2. Cargar información adicional solo si es necesario
      const promises = [];
      
      // Solo buscar descripción adicional si no la obtuvimos arriba
      if (!productWithDetails?.description && !product.description) {
        promises.push(
          productService.getProductDescriptions(product.id)
            .then(descriptions => {
              if (descriptions && descriptions.length > 0) {
                setDescription(descriptions[0].description || '');
              } else {
                // Sin descripción disponible
                setDescription('Sin descripción disponible');
              }
            })
            .catch(error => {
              setDescription('Sin descripción disponible');
            })
        );
      } else if (product.description && !productWithDetails?.description) {
        // Usar la descripción que ya viene en el producto base
        setDescription(product.description);
      } else if (productWithDetails?.description) {
        // Ya se estableció arriba, no hacer nada
      } else {
        // No hay descripción en ningún lado
        setDescription('Sin descripción disponible');
      }

      // Intentar obtener stock actualizado
      promises.push(
        productService.getStockByProductId(product.id)
          .then(stockData => {
            if (stockData) {
              setStock({
                current: stockData.current_stock || stockData.quantity || 0,
                minimum: stockData.minimum_stock || 0,
                maximum: stockData.maximum_stock || 0,
                reserved: stockData.reserved_stock || 0
              });
            }
          })
          .catch(error => {
            if (product.stock_quantity !== undefined) {
              setStock({
                current: product.stock_quantity,
                minimum: 0,
                maximum: 0,
                reserved: 0
              });
            }
          })
      );

      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }

    } catch (error) {
      setError('Error al cargar detalles del producto: ' + error.message);
      
      if (product.description) {
        setDescription(product.description);
      }
      if (product.stock_quantity !== undefined) {
        setStock({
          current: product.stock_quantity,
          minimum: 0,
          maximum: 0,
          reserved: 0
        });
      }
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
    try {
      await productService.createProductDescription(product.id, { description });
      setEditingDescription(false);
      onRefresh && onRefresh();
    } catch (err) {
      setError('Error al guardar descripción');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrice = async () => {
    if (!product?.id) return;

    setLoading(true);
    try {
      const pricePayload = {
        cost_price: parseFloat(priceData.cost_price),
        sale_price: priceData.sale_price ? parseFloat(priceData.sale_price) : undefined,
        tax: priceData.tax ? parseFloat(priceData.tax) : undefined
      };

      await productService.createProductPrice(product.id, pricePayload);
      setEditingPrice(false);
      onRefresh && onRefresh();
    } catch (err) {
      setError('Error al guardar precio');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStock = async () => {
    if (!product?.id) return;

    setLoading(true);
    try {
      const stockPayload = {
        quantity: parseInt(stockData.quantity),
        exp: stockData.exp || undefined,
        entity: stockData.entity.name ? { name: stockData.entity.name } : undefined
      };

      await productService.createStock(product.id, stockPayload);
      setEditingStock(false);
      onRefresh && onRefresh();
    } catch (err) {
      setError('Error al guardar stock');
    } finally {
      setLoading(false);
    }
  };

  const modalStyles = getModalStyles();
  const inputStyles = getInputStyles();

  if (!isOpen || !product) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
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
              <h2 style={{
                fontSize: isNeoBrutalism ? '1.5rem' : '1.25rem',
                fontWeight: isNeoBrutalism ? '800' : '600',
                textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                margin: 0
              }}>
                {product.name}
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--muted-foreground)',
                margin: '4px 0 0 0'
              }}>
                ID: {product.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              style={getTabStyles('info')}
              onClick={() => setActiveTab('info')}
            >
              <Package className="w-4 h-4 mr-2" />
              {isNeoBrutalism ? 'INFO' : 'Información'}
            </button>
            <button 
              style={getTabStyles('description')}
              onClick={() => setActiveTab('description')}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isNeoBrutalism ? 'DESCRIPCIÓN' : 'Descripción'}
            </button>
            <button 
              style={getTabStyles('price')}
              onClick={() => setActiveTab('price')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {isNeoBrutalism ? 'PRECIOS' : 'Precios'}
            </button>
            <button 
              style={getTabStyles('stock')}
              onClick={() => setActiveTab('stock')}
            >
              <Layers className="w-4 h-4 mr-2" />
              {isNeoBrutalism ? 'STOCK' : 'Stock'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', minHeight: '300px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              borderRadius: isNeoBrutalism ? '0px' : '4px',
              border: isNeoBrutalism ? '2px solid var(--border)' : 'none',
              marginBottom: '16px'
            }}>
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Tab: Información */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Debug: Mostrar todos los campos del producto */}
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '4px',
                    textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                  }}>
                    {isNeoBrutalism ? 'NOMBRE' : 'Nombre'}
                  </label>
                  <p style={{ margin: 0, padding: '8px 0' }}>{product.name || 'Sin nombre'}</p>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '4px',
                    textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                  }}>
                    {isNeoBrutalism ? 'CATEGORÍA' : 'Categoría'}
                  </label>
                  <p style={{ margin: 0, padding: '8px 0' }}>
                    {product.category_id || product.id_category || 'Sin categoría'}
                  </p>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '4px',
                    textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                  }}>
                    {isNeoBrutalism ? 'PRECIO' : 'Precio'}
                  </label>
                  <p style={{ margin: 0, padding: '8px 0' }}>
                    ${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '4px',
                    textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                  }}>
                    {isNeoBrutalism ? 'STOCK' : 'Stock'}
                  </label>
                  <p style={{ margin: 0, padding: '8px 0' }}>
                    {product.stock_quantity !== undefined ? product.stock_quantity : 'N/A'}
                  </p>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '4px',
                    textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                  }}>
                    {isNeoBrutalism ? 'TIPO' : 'Tipo'}
                  </label>
                  <p style={{ margin: 0, padding: '8px 0' }}>{product.product_type || 'PHYSICAL'}</p>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '600', 
                    marginBottom: '4px',
                    textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                  }}>
                    {isNeoBrutalism ? 'ESTADO' : 'Estado'}
                  </label>
                  <p style={{ margin: 0, padding: '8px 0' }}>
                    {(product.is_active !== undefined ? product.is_active : product.state) ? 
                      (isNeoBrutalism ? 'ACTIVO' : 'Activo') : 
                      (isNeoBrutalism ? 'INACTIVO' : 'Inactivo')
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Descripción */}
          {activeTab === 'description' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                  margin: 0
                }}>
                  {isNeoBrutalism ? 'DESCRIPCIÓN DEL PRODUCTO' : 'Descripción del Producto'}
                </h3>
                {!editingDescription && (
                  <button
                    onClick={() => setEditingDescription(true)}
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
                    {isNeoBrutalism ? 'EDITAR' : 'Editar'}
                  </button>
                )}
              </div>

              {editingDescription ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
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
                      style={{
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: isNeoBrutalism ? '0px' : '4px',
                        padding: '8px 16px',
                        cursor: 'pointer'
                      }}
                    >
                      {isNeoBrutalism ? 'CANCELAR' : 'Cancelar'}
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      disabled={loading}
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
                      {loading ? (isNeoBrutalism ? 'GUARDANDO...' : 'Guardando...') : (isNeoBrutalism ? 'GUARDAR' : 'Guardar')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  background: 'var(--muted)',
                  borderRadius: isNeoBrutalism ? '0px' : '4px',
                  border: isNeoBrutalism ? '2px solid var(--border)' : '1px solid var(--border)',
                  minHeight: '120px'
                }}>
                  {description || (
                    <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                      {isNeoBrutalism ? 'NO HAY DESCRIPCIÓN DISPONIBLE' : 'No hay descripción disponible'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Precios */}
          {activeTab === 'price' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                  margin: 0
                }}>
                  {isNeoBrutalism ? 'PRECIOS DEL PRODUCTO' : 'Precios del Producto'}
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
                    {isNeoBrutalism ? 'CONFIGURAR' : 'Configurar'}
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
                        style={inputStyles}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingPrice(false)}
                      style={{
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: isNeoBrutalism ? '0px' : '4px',
                        padding: '8px 16px',
                        cursor: 'pointer'
                      }}
                    >
                      {isNeoBrutalism ? 'CANCELAR' : 'Cancelar'}
                    </button>
                    <button
                      onClick={handleSavePrice}
                      disabled={loading || !priceData.cost_price}
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
                      {loading ? (isNeoBrutalism ? 'GUARDANDO...' : 'Guardando...') : (isNeoBrutalism ? 'GUARDAR' : 'Guardar')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  background: 'var(--muted)',
                  borderRadius: isNeoBrutalism ? '0px' : '4px',
                  border: isNeoBrutalism ? '2px solid var(--border)' : '1px solid var(--border)'
                }}>
                  <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                    {isNeoBrutalism ? 'CONFIGURE LOS PRECIOS DEL PRODUCTO' : 'Configure los precios del producto'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tab: Stock */}
          {activeTab === 'stock' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                  margin: 0
                }}>
                  {isNeoBrutalism ? 'INVENTARIO DEL PRODUCTO' : 'Inventario del Producto'}
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
                    {isNeoBrutalism ? 'CONFIGURAR' : 'Configurar'}
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
                        style={inputStyles}
                        placeholder={isNeoBrutalism ? 'NOMBRE ENTIDAD' : 'Nombre de la entidad'}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingStock(false)}
                      style={{
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: isNeoBrutalism ? '0px' : '4px',
                        padding: '8px 16px',
                        cursor: 'pointer'
                      }}
                    >
                      {isNeoBrutalism ? 'CANCELAR' : 'Cancelar'}
                    </button>
                    <button
                      onClick={handleSaveStock}
                      disabled={loading || !stockData.quantity}
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
                      {loading ? (isNeoBrutalism ? 'GUARDANDO...' : 'Guardando...') : (isNeoBrutalism ? 'GUARDAR' : 'Guardar')}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  background: 'var(--muted)',
                  borderRadius: isNeoBrutalism ? '0px' : '4px',
                  border: isNeoBrutalism ? '2px solid var(--border)' : '1px solid var(--border)'
                }}>
                  <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                    {isNeoBrutalism ? 'CONFIGURE EL INVENTARIO DEL PRODUCTO' : 'Configure el inventario del producto'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
