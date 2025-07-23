/**
 * Modal de confirmación para eliminación de productos (soft delete)
 * Basado en la especificación OpenAPI Business Management API
 */

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const DeleteProductModal = ({ 
  isOpen, 
  onClose, 
  product,
  onConfirm,
  loading = false
}) => {
  const { theme } = useTheme();

  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

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
        maxWidth: '450px',
        padding: '24px'
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
        maxWidth: '450px',
        padding: '24px'
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
        maxWidth: '450px',
        padding: '24px'
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
        maxWidth: '450px',
        padding: '24px'
      }
    };
  };

  const getButtonStyles = (variant = 'primary') => {
    if (isNeoBrutalism) return {
      primary: {
        background: 'var(--brutalist-pink)',
        color: '#ffffff',
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

    if (isMaterial) return {
      primary: {
        background: 'var(--md-error-main, var(--destructive))',
        color: 'var(--md-on-error, var(--destructive-foreground))',
        border: 'none',
        borderRadius: 'var(--md-corner-small, 4px)',
        padding: '12px 24px',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        boxShadow: 'var(--md-elevation-1, 0px 2px 4px rgba(0, 0, 0, 0.1))',
        transition: 'all 200ms ease'
      },
      secondary: {
        background: 'transparent',
        color: 'var(--md-on-surface, var(--foreground))',
        border: '1px solid var(--md-outline, var(--border))',
        borderRadius: 'var(--md-corner-small, 4px)',
        padding: '12px 24px',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 200ms ease'
      }
    }[variant];

    if (isFluent) return {
      primary: {
        background: 'var(--fluent-semantic-danger, var(--destructive))',
        color: 'var(--fluent-text-on-accent, var(--destructive-foreground))',
        border: 'none',
        borderRadius: 'var(--fluent-corner-radius-small, 2px)',
        padding: '8px 20px',
        fontSize: '0.875rem',
        fontWeight: '400',
        cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.33, 0, 0.67, 1)'
      },
      secondary: {
        background: 'transparent',
        color: 'var(--fluent-text-primary, var(--foreground))',
        border: '1px solid var(--fluent-border-neutral, var(--border))',
        borderRadius: 'var(--fluent-corner-radius-small, 2px)',
        padding: '8px 20px',
        fontSize: '0.875rem',
        fontWeight: '400',
        cursor: 'pointer',
        transition: 'all 200ms cubic-bezier(0.33, 0, 0.67, 1)'
      }
    }[variant];

    return {
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      border: variant === 'primary' ? 'none' : '1px solid var(--border)',
      background: variant === 'primary' ? 'var(--destructive)' : 'var(--background)',
      color: variant === 'primary' ? 'var(--destructive-foreground)' : 'var(--foreground)',
      fontSize: '0.875rem',
      transition: 'all 150ms ease'
    };
  };

  const modalStyles = getModalStyles();

  if (!isOpen || !product) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: isNeoBrutalism ? 'var(--brutalist-pink)' : 'var(--destructive)',
            borderRadius: isNeoBrutalism ? '0px' : '50%',
            border: isNeoBrutalism ? '2px solid var(--border)' : 'none',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle className="w-6 h-6" style={{ color: '#ffffff' }} />
          </div>
          <div>
            <h2 style={{
              fontSize: isNeoBrutalism ? '1.5rem' : '1.25rem',
              fontWeight: isNeoBrutalism ? '800' : '600',
              textTransform: isNeoBrutalism ? 'uppercase' : 'none',
              margin: 0,
              color: 'var(--foreground)'
            }}>
              {isNeoBrutalism ? 'ELIMINAR PRODUCTO' : 'Eliminar Producto'}
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0'
            }}>
              {isNeoBrutalism ? 'ESTA ACCIÓN NO SE PUEDE DESHACER' : 'Esta acción no se puede deshacer'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{
            fontSize: '1rem',
            color: 'var(--foreground)',
            lineHeight: '1.5',
            margin: '0 0 16px 0'
          }}>
            {isNeoBrutalism ? 
              `¿ESTÁS SEGURO QUE DESEAS ELIMINAR EL PRODUCTO "${product.name?.toUpperCase()}"?` :
              `¿Estás seguro que deseas eliminar el producto "${product.name}"?`
            }
          </p>
          
          <div style={{
            background: isNeoBrutalism ? 'var(--brutalist-orange)' : 'var(--muted)',
            border: isNeoBrutalism ? '2px solid var(--border)' : '1px solid var(--border)',
            borderRadius: isNeoBrutalism ? '0px' : '4px',
            padding: '16px',
            marginTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle className="w-4 h-4" style={{ color: isNeoBrutalism ? '#ffffff' : 'var(--foreground)' }} />
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: isNeoBrutalism ? '#ffffff' : 'var(--foreground)',
                textTransform: isNeoBrutalism ? 'uppercase' : 'none'
              }}>
                {isNeoBrutalism ? 'INFORMACIÓN IMPORTANTE' : 'Información Importante'}
              </span>
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '0.875rem',
              color: isNeoBrutalism ? '#ffffff' : 'var(--foreground)',
              lineHeight: '1.4'
            }}>
              <li>
                {isNeoBrutalism ? 
                  'EL PRODUCTO SERÁ MARCADO COMO ELIMINADO (SOFT DELETE)' :
                  'El producto será marcado como eliminado (soft delete)'
                }
              </li>
              <li>
                {isNeoBrutalism ? 
                  'PODRÁS REACTIVARLO DESDE LA ADMINISTRACIÓN' :
                  'Podrás reactivarlo desde la administración'
                }
              </li>
              <li>
                {isNeoBrutalism ? 
                  'LOS DATOS RELACIONADOS SE MANTENDRÁN' :
                  'Los datos relacionados se mantendrán'
                }
              </li>
            </ul>
          </div>

          {/* Product Details */}
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: isNeoBrutalism ? '0px' : '4px',
            padding: '16px',
            marginTop: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted-foreground)',
                  textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                  fontWeight: '600'
                }}>
                  {isNeoBrutalism ? 'ID PRODUCTO' : 'ID Producto'}
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem' }}>{product.id}</p>
              </div>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted-foreground)',
                  textTransform: isNeoBrutalism ? 'uppercase' : 'none',
                  fontWeight: '600'
                }}>
                  {isNeoBrutalism ? 'CATEGORÍA' : 'Categoría'}
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem' }}>{product.id_category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={getButtonStyles('secondary')}
            disabled={loading}
          >
            {isNeoBrutalism ? 'CANCELAR' : 'Cancelar'}
          </button>
          <button
            onClick={() => onConfirm(product)}
            style={getButtonStyles('primary')}
            disabled={loading}
          >
            {loading ? (
              isNeoBrutalism ? 'ELIMINANDO...' : 'Eliminando...'
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {isNeoBrutalism ? 'ELIMINAR' : 'Eliminar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProductModal;
