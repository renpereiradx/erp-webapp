/**
 * Modal para crear y editar productos
 * Basado en la especificación OpenAPI Business Management API
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { X, Save, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { productService } from '@/services/productService';
import useProductStore from '@/store/useProductStore';

const ProductModal = ({ 
  isOpen, 
  onClose, 
  product = null, // null para crear, objeto para editar
  onSuccess 
}) => {
  const { theme } = useTheme();
  const { categories, fetchCategories } = useProductStore();
  const [formData, setFormData] = useState({
    name: '',
    id_category: '',
    state: true,
    product_type: 'PHYSICAL',
    description: '' // Campo para la descripción del producto
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState('');

  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        id_category: product.id_category || '',
        state: product.state !== undefined ? product.state : true,
        product_type: product.product_type || 'PHYSICAL',
        description: product.description?.description || '' // Manejar descripción desde el objeto product
      });
    } else {
      setFormData({
        name: '',
        id_category: '',
        state: true,
        product_type: 'PHYSICAL',
        description: ''
      });
    }
    setError('');
    setCategoriesError('');
    
    // Load categories when modal opens
    if (isOpen && categories.length === 0) {
      setCategoriesLoading(true);
      
      // Verificar token antes de hacer la llamada
      const token = localStorage.getItem('authToken');
      console.log('ProductModal: Verificando token para categorías:', token ? 'Presente' : 'Ausente');
      
      if (!token) {
        setCategoriesError('Debe iniciar sesión para cargar categorías');
        setCategoriesLoading(false);
        return;
      }
      
      fetchCategories()
        .then(() => {
          console.log('Categorías cargadas exitosamente');
          setCategoriesError('');
        })
        .catch((err) => {
          console.warn('Error cargando categorías:', err.message);
          setCategoriesError(err.message || 'Error cargando categorías');
        })
        .finally(() => {
          setCategoriesLoading(false);
        });
    }
  }, [product, isOpen, fetchCategories, categories.length]);

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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }
    };

    if (isMaterial) return {
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
        background: 'var(--md-surface-main, var(--background))',
        borderRadius: 'var(--md-corner-large, 16px)',
        boxShadow: 'var(--md-elevation-3, 0px 6px 12px rgba(0, 0, 0, 0.15))',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }
    };

    if (isFluent) return {
      overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      },
      modal: {
        background: 'var(--fluent-surface-card, var(--background))',
        border: '1px solid var(--fluent-border-neutral, var(--border))',
        borderRadius: 'var(--fluent-corner-radius-large, 8px)',
        boxShadow: 'var(--fluent-shadow-16, 0px 8px 16px rgba(0, 0, 0, 0.14))',
        width: '100%',
        maxWidth: '500px',
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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }
    };
  };

  const getInputStyles = () => {
    if (isNeoBrutalism) return {
      border: '3px solid var(--border)',
      borderRadius: '0px',
      padding: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      background: 'var(--background)',
      color: 'var(--foreground)'
    };

    if (isMaterial) return {
      border: '1px solid var(--md-outline, var(--border))',
      borderRadius: 'var(--md-corner-small, 4px)',
      padding: '12px 16px',
      fontSize: '1rem',
      background: 'var(--md-surface-main, var(--background))',
      color: 'var(--md-on-surface, var(--foreground))'
    };

    if (isFluent) return {
      border: '1px solid var(--fluent-border-neutral, var(--border))',
      borderRadius: 'var(--fluent-corner-radius-small, 2px)',
      padding: '8px 12px',
      fontSize: '0.875rem',
      background: 'var(--fluent-surface-card, var(--background))',
      color: 'var(--fluent-text-primary, var(--foreground))'
    };

    return {
      border: '1px solid var(--border)',
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '0.875rem',
      background: 'var(--background)',
      color: 'var(--foreground)'
    };
  };

  const getButtonStyles = (variant = 'primary') => {
    if (isNeoBrutalism) return {
      primary: {
        background: 'var(--brutalist-lime)',
        color: '#000000',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        cursor: 'pointer',
        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease'
      },
      secondary: {
        background: 'var(--background)',
        color: 'var(--foreground)',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        cursor: 'pointer',
        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease'
      }
    }[variant];

    return {
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: variant === 'primary' ? 'none' : '1px solid var(--border)',
      background: variant === 'primary' ? 'var(--primary)' : 'var(--background)',
      color: variant === 'primary' ? 'var(--primary-foreground)' : 'var(--foreground)'
    };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar datos
      productService.validateProductData(formData);

      // Convertir id_category a número y preparar datos
      const dataToSend = {
        ...formData,
        id_category: parseInt(formData.id_category),
        description: formData.description.trim() // Incluir descripción en payload principal
      };

      if (product) {
        // 🔥 Editar producto con descripción de forma atómica
        // Una sola operación que actualiza producto + descripción
        await productService.updateProduct(product.id, dataToSend);
      } else {
        // 🔥 Crear nuevo producto con descripción de forma atómica  
        // Una sola operación que crea producto + descripción
        await productService.createProduct(dataToSend);
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error('Error en ProductModal:', err);
      setError(err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  const modalStyles = getModalStyles();
  const inputStyles = getInputStyles();
  const buttonStyles = getButtonStyles();

  if (!isOpen) return null;

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
            <h2 style={{
              fontSize: isNeoBrutalism ? '1.5rem' : '1.25rem',
              fontWeight: isNeoBrutalism ? '800' : '600',
              textTransform: isNeoBrutalism ? 'uppercase' : 'none',
              margin: 0
            }}>
              {product ? 
                (isNeoBrutalism ? 'EDITAR PRODUCTO' : 'Editar Producto') : 
                (isNeoBrutalism ? 'NUEVO PRODUCTO' : 'Nuevo Producto')
              }
            </h2>
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

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
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

          {categoriesError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: 'hsl(var(--warning))',
              color: 'hsl(var(--warning-foreground))',
              borderRadius: isNeoBrutalism ? '0px' : '4px',
              border: isNeoBrutalism ? '2px solid var(--border)' : 'none',
              marginBottom: '16px'
            }}>
              <AlertCircle className="w-4 h-4" />
              <div>
                <strong>{isNeoBrutalism ? 'PROBLEMA CON CATEGORÍAS:' : 'Problema con categorías:'}</strong>
                <br />
                {categoriesError}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Nombre */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: isNeoBrutalism ? 'uppercase' : 'none'
              }}>
                {isNeoBrutalism ? 'NOMBRE DEL PRODUCTO *' : 'Nombre del Producto *'}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  ...inputStyles,
                  width: '100%'
                }}
                placeholder={isNeoBrutalism ? 'INGRESE EL NOMBRE...' : 'Ingrese el nombre del producto'}
              />
            </div>

            {/* Descripción */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: isNeoBrutalism ? 'uppercase' : 'none'
              }}>
                {isNeoBrutalism ? 'DESCRIPCIÓN' : 'Descripción'}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                style={{
                  ...inputStyles,
                  width: '100%',
                  resize: 'vertical',
                  minHeight: '80px',
                  fontFamily: 'inherit'
                }}
                placeholder={isNeoBrutalism ? 'DESCRIPCIÓN DEL PRODUCTO...' : 'Descripción detallada del producto...'}
              />
            </div>

            {/* Categoría */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: isNeoBrutalism ? 'uppercase' : 'none'
              }}>
                {isNeoBrutalism ? 'CATEGORÍA *' : 'Categoría *'}
              </label>
              <select
                name="id_category"
                value={formData.id_category}
                onChange={handleInputChange}
                required
                disabled={categoriesLoading || categoriesError}
                style={{
                  ...inputStyles,
                  width: '100%',
                  opacity: (categoriesLoading || categoriesError) ? 0.6 : 1
                }}
              >
                <option value="">
                  {categoriesLoading 
                    ? (isNeoBrutalism ? 'CARGANDO CATEGORÍAS...' : 'Cargando categorías...')
                    : categoriesError
                    ? (isNeoBrutalism ? 'ERROR AL CARGAR CATEGORÍAS' : 'Error al cargar categorías')
                    : categories.length === 0
                    ? (isNeoBrutalism ? 'NO HAY CATEGORÍAS DISPONIBLES' : 'No hay categorías disponibles')
                    : (isNeoBrutalism ? 'SELECCIONAR CATEGORÍA...' : 'Seleccionar categoría...')
                  }
                </option>
                {categories.length > 0 && categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.description && ` - ${category.description}`}
                  </option>
                ))}
              </select>
              
              {/* Botón de reintento para categorías */}
              {categoriesError && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoriesError('');
                    setCategoriesLoading(true);
                    fetchCategories()
                      .then(() => {
                        setCategoriesError('');
                      })
                      .catch((err) => {
                        setCategoriesError(err.message || 'Error cargando categorías');
                      })
                      .finally(() => {
                        setCategoriesLoading(false);
                      });
                  }}
                  disabled={categoriesLoading}
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    background: 'var(--secondary)',
                    color: 'var(--secondary-foreground)',
                    border: isNeoBrutalism ? '2px solid var(--border)' : '1px solid var(--border)',
                    borderRadius: isNeoBrutalism ? '0px' : '4px',
                    cursor: 'pointer',
                    textTransform: isNeoBrutalism ? 'uppercase' : 'none'
                  }}
                >
                  {isNeoBrutalism ? 'REINTENTAR CARGAR CATEGORÍAS' : 'Reintentar cargar categorías'}
                </button>
              )}
            </div>

            {/* Tipo de Producto */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: isNeoBrutalism ? 'uppercase' : 'none'
              }}>
                {isNeoBrutalism ? 'TIPO DE PRODUCTO' : 'Tipo de Producto'}
              </label>
              <select
                name="product_type"
                value={formData.product_type}
                onChange={handleInputChange}
                style={{
                  ...inputStyles,
                  width: '100%'
                }}
              >
                <option value="PHYSICAL">{isNeoBrutalism ? 'FÍSICO' : 'Físico'}</option>
                <option value="SERVICE">{isNeoBrutalism ? 'SERVICIO' : 'Servicio'}</option>
              </select>
            </div>

            {/* Estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                name="state"
                checked={formData.state}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              <label style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                textTransform: isNeoBrutalism ? 'uppercase' : 'none'
              }}>
                {isNeoBrutalism ? 'PRODUCTO ACTIVO' : 'Producto Activo'}
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: isNeoBrutalism ? '3px solid var(--border)' : '1px solid var(--border)'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={getButtonStyles('secondary')}
              disabled={loading}
            >
              {isNeoBrutalism ? 'CANCELAR' : 'Cancelar'}
            </button>
            <button
              type="submit"
              style={getButtonStyles('primary')}
              disabled={loading || (categoriesError && categories.length === 0)}
            >
              {loading ? (
                isNeoBrutalism ? 'GUARDANDO...' : 'Guardando...'
              ) : (categoriesError && categories.length === 0) ? (
                isNeoBrutalism ? 'CARGAR CATEGORÍAS PRIMERO' : 'Cargar categorías primero'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isNeoBrutalism ? 'GUARDAR' : 'Guardar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
