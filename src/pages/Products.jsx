/**
 * Página Products - Multi-tema optimizada
 * Sistema de gestión de productos con soporte completo para Neo-Brutalism, Material Design y Fluent Design
 * Incluye helper functions específicas para cada sistema de diseño
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Star,
  ShoppingCart,
  Layers,
  Tag,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useProductStore from '@/store/useProductStore';

const Products = () => {
  const { theme } = useTheme();
  const { products, loading, error, fetchProducts, deleteProduct } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStock, setSelectedStock] = useState('all');
  
  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  // Helper functions específicas para Neo-Brutalism
  const getBrutalistCardStyles = () => ({
    background: 'var(--background)',
    border: '4px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
    transition: 'all 200ms ease',
    overflow: 'hidden'
  });

  const getBrutalistTypography = (level = 'base') => {
    const styles = {
      title: {
        fontSize: '3rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.1',
        textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
      },
      heading: {
        fontSize: '1.5rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2'
      },
      subheading: {
        fontSize: '1.125rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      base: {
        fontSize: '0.875rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      small: {
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      price: {
        fontSize: '1.25rem',
        fontWeight: '900',
        letterSpacing: '0.025em'
      }
    };
    return styles[level] || styles.base;
  };

  const getBrutalistBadgeStyles = (type) => {
    const badges = {
      'en-stock': {
        background: 'var(--brutalist-lime)',
        color: '#000000',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        minWidth: '90px',
        width: '90px',
        maxWidth: '90px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      'poco-stock': {
        background: 'var(--brutalist-orange)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        minWidth: '90px',
        width: '90px',
        maxWidth: '90px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      'sin-stock': {
        background: 'var(--brutalist-pink)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        minWidth: '90px',
        width: '90px',
        maxWidth: '90px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    };
    return badges[type] || badges['en-stock'];
  };

  const getBrutalistButtonStyles = (variant = 'primary') => {
    const buttons = {
      primary: {
        background: 'var(--brutalist-lime)',
        color: '#000000',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontSize: '1rem',
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
        fontSize: '1rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        cursor: 'pointer',
        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease'
      },
      small: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontSize: '0.75rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        cursor: 'pointer',
        boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease'
      }
    };
    return buttons[variant] || buttons.primary;
  };

  // Helper functions universales que se adaptan al tema activo (mejorados como Dashboard)
  const getCardStyles = () => {
    if (isNeoBrutalism) return {
      background: 'var(--background)',
      border: '4px solid var(--border)',
      borderRadius: '0px',
      boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
      transition: 'all 200ms ease',
      overflow: 'hidden',
      padding: '24px'
    };
    if (isMaterial) return {
      background: 'var(--md-surface-main, var(--card))',
      border: 'none',
      borderRadius: 'var(--md-corner-medium, 12px)',
      boxShadow: 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))',
      transition: 'all 200ms ease',
      overflow: 'hidden',
      padding: 'var(--md-spacing-3, 24px)'
    };
    if (isFluent) return {
      background: 'var(--fluent-surface-card, var(--card))',
      border: '1px solid var(--fluent-border-neutral, var(--border))',
      borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
      boxShadow: 'var(--fluent-shadow-8, 0px 4px 8px rgba(0, 0, 0, 0.14))',
      transition: 'all 200ms cubic-bezier(0.33, 0, 0.67, 1)',
      overflow: 'hidden',
      padding: 'var(--fluent-size-160, 16px)'
    };
    return getBrutalistCardStyles();
  };

  const getTypographyStyles = (level = 'base') => {
    if (isNeoBrutalism) return {
      title: {
        fontSize: '3.5rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.1',
        textShadow: '3px 3px 0px rgba(0,0,0,0.8)',
        marginBottom: '1.5rem'
      },
      heading: {
        fontSize: '1.875rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2',
        marginBottom: '1rem'
      },
      subheading: {
        fontSize: '1.25rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        marginBottom: '0.5rem'
      },
      base: {
        fontSize: '1rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      small: {
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      price: {
        fontSize: '1.5rem',
        fontWeight: '900',
        letterSpacing: '0.025em',
        textTransform: 'uppercase'
      }
    }[level] || {
      fontSize: '1rem',
      fontWeight: '600',
      letterSpacing: '0.01em'
    };
    
    if (isMaterial) return {
      title: {
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 500,
        fontSize: '1.75rem',
        letterSpacing: '0.00735em',
        color: 'var(--md-on-background, var(--foreground))',
        lineHeight: 1.167,
        marginBottom: 'var(--md-spacing-3, 24px)'
      },
      heading: {
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 500,
        fontSize: '1.25rem',
        letterSpacing: '0.00938em',
        color: 'var(--md-on-surface, var(--foreground))',
        lineHeight: 1.334,
        marginBottom: 'var(--md-spacing-2, 16px)'
      },
      subheading: {
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 400,
        fontSize: '1rem',
        letterSpacing: '0.00938em',
        color: 'var(--md-on-surface-variant, var(--muted-foreground))',
        lineHeight: 1.5
      },
      base: {
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 400,
        fontSize: '0.875rem',
        letterSpacing: '0.01071em',
        color: 'var(--md-on-surface, var(--foreground))',
        lineHeight: 1.429
      },
      small: {
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 400,
        fontSize: '0.75rem',
        letterSpacing: '0.03333em',
        color: 'var(--md-on-surface-variant, var(--muted-foreground))',
        lineHeight: 1.333
      },
      price: {
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 600,
        fontSize: '1.25rem',
        letterSpacing: '0.00938em',
        color: 'var(--md-on-surface, var(--foreground))'
      }
    }[level] || {
      fontFamily: 'Roboto, sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      letterSpacing: '0.01071em',
      color: 'var(--md-on-surface, var(--foreground))',
      lineHeight: 1.429
    };
    
    if (isFluent) return {
      title: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 600,
        fontSize: '1.75rem',
        letterSpacing: '-0.005em',
        color: 'var(--fluent-text-primary, var(--foreground))',
        lineHeight: 1.286,
        marginBottom: 'var(--fluent-size-160, 16px)'
      },
      heading: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 600,
        fontSize: '1.25rem',
        letterSpacing: '0em',
        color: 'var(--fluent-text-primary, var(--foreground))',
        lineHeight: 1.4,
        marginBottom: 'var(--fluent-size-120, 12px)'
      },
      subheading: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '1rem',
        letterSpacing: '0em',
        color: 'var(--fluent-text-secondary, var(--muted-foreground))',
        lineHeight: 1.429
      },
      base: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '0.875rem',
        letterSpacing: '0em',
        color: 'var(--fluent-text-primary, var(--foreground))',
        lineHeight: 1.429
      },
      small: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '0.75rem',
        letterSpacing: '0em',
        color: 'var(--fluent-text-secondary, var(--muted-foreground))',
        lineHeight: 1.333
      },
      price: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 600,
        fontSize: '1.25rem',
        letterSpacing: '0em',
        color: 'var(--fluent-text-primary, var(--foreground))'
      }
    }[level] || {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      letterSpacing: '0em',
      color: 'var(--fluent-text-primary, var(--foreground))',
      lineHeight: 1.429
    };
    
    return getBrutalistTypography(level);
  };

  const getBadgeStyles = (type) => {
    // Colores de fondo según el tipo de stock (como Dashboard)
    const getBackgroundColor = () => {
      switch (type) {
        case 'sin-stock':
          return isNeoBrutalism ? 'var(--brutalist-pink)' : 
                 isMaterial ? 'var(--md-error-main, var(--destructive))' :
                 isFluent ? 'var(--fluent-semantic-danger, var(--destructive))' : 'var(--destructive)';
        case 'poco-stock':
          return isNeoBrutalism ? 'var(--brutalist-orange)' : 
                 isMaterial ? 'var(--md-warning-main, var(--warning))' :
                 isFluent ? 'var(--fluent-semantic-warning, var(--warning))' : 'var(--warning)';
        default: // en-stock
          return isNeoBrutalism ? 'var(--brutalist-lime)' : 
                 isMaterial ? 'var(--md-semantic-success, var(--success))' :
                 isFluent ? 'var(--fluent-semantic-success, var(--success))' : 'var(--success)';
      }
    };

    return {
      background: getBackgroundColor(),
      color: isNeoBrutalism ? '#000000' : 
            isMaterial ? 'var(--md-on-primary, white)' :
            isFluent ? 'var(--fluent-text-on-accent, white)' : 'white',
      border: isNeoBrutalism ? '2px solid var(--border)' : 'none',
      borderRadius: isNeoBrutalism ? '0px' : 
                   isMaterial ? 'var(--md-corner-small, 4px)' :
                   isFluent ? 'var(--fluent-corner-radius-small, 2px)' : '4px',
      textTransform: isNeoBrutalism ? 'uppercase' : 'none',
      fontWeight: isNeoBrutalism ? 'bold' : 
                 isMaterial ? '500' :
                 isFluent ? '400' : '500',
      minWidth: isNeoBrutalism ? '90px' : 
               isMaterial ? '82px' :
               isFluent ? '78px' : '82px',
      width: isNeoBrutalism ? '90px' : 
             isMaterial ? '82px' :
             isFluent ? '78px' : '82px',
      maxWidth: isNeoBrutalism ? '90px' : 
                isMaterial ? '82px' :
                isFluent ? '78px' : '82px',
      textAlign: 'center',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isNeoBrutalism ? '8px 12px' :
               isMaterial ? '6px 16px' :
               isFluent ? '4px 12px' : '6px 12px',
      fontSize: isNeoBrutalism ? '0.75rem' :
               isMaterial ? '0.75rem' :
               isFluent ? '0.75rem' : '0.75rem',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
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
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        minWidth: variant === 'small' ? '120px' : '180px',
        width: variant === 'small' ? '120px' : '180px',
        maxWidth: variant === 'small' ? '120px' : '180px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontSize: variant === 'small' ? '0.75rem' : '1rem'
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
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        minWidth: variant === 'small' ? '120px' : '180px',
        width: variant === 'small' ? '120px' : '180px',
        maxWidth: variant === 'small' ? '120px' : '180px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontSize: variant === 'small' ? '0.75rem' : '1rem'
      },
      tertiary: {
        background: 'var(--brutalist-purple)',
        color: '#ffffff',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '12px 24px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        minWidth: variant === 'small' ? '120px' : '180px',
        width: variant === 'small' ? '120px' : '180px',
        maxWidth: variant === 'small' ? '120px' : '180px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontSize: variant === 'small' ? '0.75rem' : '1rem'
      },
      small: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        minWidth: '120px',
        width: '120px',
        maxWidth: '120px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontSize: '0.75rem'
      }
    }[variant] || {
      background: 'var(--brutalist-lime)',
      color: '#000000',
      border: '3px solid var(--border)',
      borderRadius: '0px',
      padding: '12px 24px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '0.025em',
      boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
      transition: 'all 150ms ease',
      cursor: 'pointer'
    };
    
    if (isMaterial) return {
      primary: {
        background: 'var(--md-primary-main, var(--primary))',
        color: 'var(--md-on-primary, var(--primary-foreground))',
        border: 'none',
        borderRadius: 'var(--md-corner-small, 8px)',
        padding: '8px 24px',
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 500,
        fontSize: '0.875rem',
        letterSpacing: '0.02857em',
        textTransform: 'uppercase',
        boxShadow: 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        minHeight: '36px',
        minWidth: variant === 'small' ? '100px' : '160px',
        width: variant === 'small' ? '100px' : '160px',
        maxWidth: variant === 'small' ? '100px' : '160px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      secondary: {
        background: 'transparent',
        color: 'var(--md-primary-main, var(--primary))',
        border: '1px solid var(--md-primary-main, var(--primary))',
        borderRadius: 'var(--md-corner-small, 8px)',
        padding: '8px 24px',
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 500,
        fontSize: '0.875rem',
        letterSpacing: '0.02857em',
        textTransform: 'uppercase',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        minHeight: '36px',
        minWidth: variant === 'small' ? '100px' : '160px',
        width: variant === 'small' ? '100px' : '160px',
        maxWidth: variant === 'small' ? '100px' : '160px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      tertiary: {
        background: 'var(--md-secondary-main, var(--secondary))',
        color: 'var(--md-on-secondary, var(--secondary-foreground))',
        border: 'none',
        borderRadius: 'var(--md-corner-small, 8px)',
        padding: '8px 24px',
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 500,
        fontSize: '0.875rem',
        letterSpacing: '0.02857em',
        textTransform: 'uppercase',
        boxShadow: 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        minHeight: '36px',
        minWidth: variant === 'small' ? '100px' : '160px',
        width: variant === 'small' ? '100px' : '160px',
        maxWidth: variant === 'small' ? '100px' : '160px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      small: {
        background: 'var(--md-secondary-main, var(--secondary))',
        color: 'var(--md-on-secondary, var(--secondary-foreground))',
        border: 'none',
        borderRadius: 'var(--md-corner-small, 8px)',
        padding: '6px 16px',
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 500,
        fontSize: '0.75rem',
        letterSpacing: '0.02857em',
        textTransform: 'uppercase',
        boxShadow: 'var(--md-elevation-1, 0px 1px 3px rgba(0, 0, 0, 0.12))',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        minHeight: '32px',
        minWidth: '100px',
        width: '100px',
        maxWidth: '100px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }[variant] || {
      background: 'var(--md-primary-main, var(--primary))',
      color: 'var(--md-on-primary, var(--primary-foreground))',
      border: 'none',
      borderRadius: 'var(--md-corner-small, 8px)',
      padding: '8px 24px',
      cursor: 'pointer'
    };
    
    if (isFluent) return {
      primary: {
        background: 'var(--fluent-brand-primary, var(--primary))',
        color: 'var(--fluent-text-on-accent, var(--primary-foreground))',
        border: '1px solid var(--fluent-border-accent, var(--fluent-brand-primary))',
        borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
        padding: '8px 20px',
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '0.875rem',
        letterSpacing: '0em',
        boxShadow: 'var(--fluent-shadow-4, 0px 2px 4px rgba(0, 0, 0, 0.14))',
        transition: 'all 150ms cubic-bezier(0.33, 0, 0.67, 1)',
        cursor: 'pointer',
        minHeight: '32px',
        minWidth: variant === 'small' ? '90px' : '150px',
        width: variant === 'small' ? '90px' : '150px',
        maxWidth: variant === 'small' ? '90px' : '150px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      secondary: {
        background: 'transparent',
        color: 'var(--fluent-brand-primary, var(--primary))',
        border: '1px solid var(--fluent-border-neutral, var(--border))',
        borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
        padding: '8px 20px',
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '0.875rem',
        letterSpacing: '0em',
        transition: 'all 150ms cubic-bezier(0.33, 0, 0.67, 1)',
        cursor: 'pointer',
        minHeight: '32px',
        minWidth: variant === 'small' ? '90px' : '150px',
        width: variant === 'small' ? '90px' : '150px',
        maxWidth: variant === 'small' ? '90px' : '150px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      tertiary: {
        background: 'var(--fluent-brand-secondary, var(--secondary))',
        color: 'var(--fluent-text-on-accent, var(--secondary-foreground))',
        border: '1px solid var(--fluent-brand-secondary, var(--secondary))',
        borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
        padding: '8px 20px',
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '0.875rem',
        letterSpacing: '0em',
        boxShadow: 'var(--fluent-shadow-4, 0px 2px 4px rgba(0, 0, 0, 0.14))',
        transition: 'all 150ms cubic-bezier(0.33, 0, 0.67, 1)',
        cursor: 'pointer',
        minHeight: '32px',
        minWidth: variant === 'small' ? '90px' : '150px',
        width: variant === 'small' ? '90px' : '150px',
        maxWidth: variant === 'small' ? '90px' : '150px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      small: {
        background: 'var(--fluent-brand-secondary, var(--secondary))',
        color: 'var(--fluent-text-on-accent, var(--secondary-foreground))',
        border: '1px solid var(--fluent-border-neutral, var(--border))',
        borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
        padding: '6px 16px',
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '0.75rem',
        letterSpacing: '0em',
        boxShadow: 'var(--fluent-shadow-2, 0px 1px 2px rgba(0, 0, 0, 0.14))',
        transition: 'all 150ms cubic-bezier(0.33, 0, 0.67, 1)',
        cursor: 'pointer',
        minHeight: '28px',
        minWidth: '90px',
        width: '90px',
        maxWidth: '90px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }[variant] || {
      background: 'var(--fluent-brand-primary, var(--primary))',
      color: 'var(--fluent-text-on-accent, var(--primary-foreground))',
      border: '1px solid var(--fluent-border-accent, var(--fluent-brand-primary))',
      borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
      padding: '8px 20px',
      cursor: 'pointer'
    };
    
    return getBrutalistButtonStyles(variant);
  };

  const getGridLayoutStyles = () => {
    if (isNeoBrutalism) return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    };
    if (isMaterial) return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: 'var(--md-spacing-3, 24px)',
      maxWidth: '1400px',
      margin: '0 auto'
    };
    if (isFluent) return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 'var(--fluent-size-160, 16px)',
      maxWidth: '1400px',
      margin: '0 auto'
    };
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    };
  };

  // Helper function para iconos con background temático (como Dashboard)
  const getIconBackground = (colorVar) => {
    if (isNeoBrutalism) return {
      background: colorVar || 'var(--brutalist-blue)',
      border: '3px solid var(--border)',
      borderRadius: '0px',
      boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
    if (isMaterial) return {
      background: colorVar || 'var(--md-primary-main, var(--primary))',
      border: 'none',
      borderRadius: '50%',
      boxShadow: 'var(--md-elevation-1, 0px 1px 3px rgba(0, 0, 0, 0.12))',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 'var(--md-spacing-2, 16px)'
    };
    if (isFluent) return {
      background: colorVar || 'var(--fluent-brand-primary, var(--primary))',
      border: '1px solid var(--fluent-border-neutral, var(--border))',
      borderRadius: 'var(--fluent-corner-radius-small, 2px)',
      boxShadow: 'var(--fluent-shadow-2, 0px 1px 2px rgba(0, 0, 0, 0.14))',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 'var(--fluent-size-120, 12px)'
    };
    return {
      background: colorVar || 'var(--primary)',
      borderRadius: '8px',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };
  };

  // useEffect para cargar productos
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Funciones de utilidad para productos
  const getStockStatus = (stock) => {
    if (stock === 0) return 'sin-stock';
    if (stock <= 10) return 'poco-stock';
    return 'en-stock';
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'sin-stock': return AlertTriangle;
      case 'poco-stock': return TrendingDown;
      default: return TrendingUp;
    }
  };

  // Funciones de eventos
  const handleButtonHover = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(-2px, -2px)';
      e.target.style.boxShadow = '5px 5px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonLeave = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(0px, 0px)';
      e.target.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,1)';
    }
  };

  // Lógica de filtrado de productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           product.category.toLowerCase() === selectedCategory.toLowerCase();
    
    const stockStatus = getStockStatus(product.stock);
    const matchesStock = selectedStock === 'all' ||
                        (selectedStock === 'in-stock' && stockStatus === 'en-stock') ||
                        (selectedStock === 'low-stock' && stockStatus === 'poco-stock') ||
                        (selectedStock === 'out-of-stock' && stockStatus === 'sin-stock');
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div 
              className="text-primary"
              style={getTypographyStyles('heading')}
            >
              {isNeoBrutalism ? 'CARGANDO PRODUCTOS...' : 'Cargando productos...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <div 
              className="text-red-500 mb-4"
              style={getTypographyStyles('heading')}
            >
              {isNeoBrutalism ? 'ERROR AL CARGAR' : 'Error al cargar'}
            </div>
            <p style={getTypographyStyles('base')}>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center py-8">
          <h1 
            className="text-primary mb-4"
            style={getTypographyStyles('title')}
          >
            {isNeoBrutalism ? 'GESTIÓN DE PRODUCTOS' : 
             isMaterial ? 'Gestión de Productos' : 
             'Product Management'}
          </h1>
          <p 
            className="text-muted-foreground max-w-2xl mx-auto mb-8"
            style={getTypographyStyles('base')}
          >
            {isNeoBrutalism ? 'ADMINISTRA TU INVENTARIO CON ESTILO NEO-BRUTALIST' :
             isMaterial ? 'Administra tu inventario con Material Design' :
             'Manage your inventory with Fluent Design'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={getButtonStyles('primary')}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Plus className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'AÑADIR PRODUCTO' : 'Añadir Producto'}
            </button>
            <button
              style={getButtonStyles('secondary')}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'ANALYTICS' : 'Analytics'}
            </button>
          </div>
        </header>

        {/* Panel de filtros */}
        <section 
          className="p-6"
          style={getCardStyles()}
        >
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={isNeoBrutalism ? "BUSCAR PRODUCTOS..." : "Buscar productos..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 p-3 border rounded-md bg-background"
                style={isNeoBrutalism ? {
                  border: '3px solid var(--border)',
                  borderRadius: '0px',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                } : {}}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-3 border rounded-md bg-background"
              style={isNeoBrutalism ? {
                border: '3px solid var(--border)',
                borderRadius: '0px',
                textTransform: 'uppercase',
                fontWeight: '600'
              } : {}}
            >
              <option value="all">{isNeoBrutalism ? 'TODAS LAS CATEGORÍAS' : 'Todas las categorías'}</option>
              <option value="Electronics">{isNeoBrutalism ? 'ELECTRÓNICOS' : 'Electrónicos'}</option>
              <option value="Clothing">{isNeoBrutalism ? 'ROPA' : 'Ropa'}</option>
              <option value="Home">{isNeoBrutalism ? 'HOGAR' : 'Hogar'}</option>
              <option value="Sports">{isNeoBrutalism ? 'DEPORTES' : 'Deportes'}</option>
            </select>

            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="p-3 border rounded-md bg-background"
              style={isNeoBrutalism ? {
                border: '3px solid var(--border)',
                borderRadius: '0px',
                textTransform: 'uppercase',
                fontWeight: '600'
              } : {}}
            >
              <option value="all">{isNeoBrutalism ? 'TODO EL STOCK' : 'Todo el stock'}</option>
              <option value="in-stock">{isNeoBrutalism ? 'EN STOCK' : 'En stock'}</option>
              <option value="low-stock">{isNeoBrutalism ? 'POCO STOCK' : 'Poco stock'}</option>
              <option value="out-of-stock">{isNeoBrutalism ? 'SIN STOCK' : 'Sin stock'}</option>
            </select>

            <div className="text-center">
              <div 
                className="text-foreground text-2xl font-bold"
                style={getTypographyStyles('heading')}
              >
                {filteredProducts.length}
              </div>
              <div 
                className="text-muted-foreground text-sm"
                style={getTypographyStyles('small')}
              >
                {isNeoBrutalism ? 'PRODUCTOS' : 'Productos'}
              </div>
            </div>
          </div>
        </section>

        {/* Grid de productos */}
        <section style={getGridLayoutStyles()}>
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div 
                className="text-muted-foreground"
                style={getTypographyStyles('heading')}
              >
                {isNeoBrutalism ? 'NO SE ENCONTRARON PRODUCTOS' : 'No se encontraron productos'}
              </div>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock);
              const StockIcon = getStockIcon(stockStatus);
              
              return (
                <div
                  key={product.id}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  style={getCardStyles()}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div style={getIconBackground(
                          stockStatus === 'sin-stock' ? (isNeoBrutalism ? 'var(--brutalist-pink)' : isMaterial ? 'var(--md-error-main)' : 'var(--fluent-semantic-danger)') :
                          stockStatus === 'poco-stock' ? (isNeoBrutalism ? 'var(--brutalist-orange)' : isMaterial ? 'var(--md-warning-main)' : 'var(--fluent-semantic-warning)') :
                          (isNeoBrutalism ? 'var(--brutalist-lime)' : isMaterial ? 'var(--md-semantic-success)' : 'var(--fluent-semantic-success)')
                        )}>
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <h3 style={getTypographyStyles('subheading')}>
                          {product.name}
                        </h3>
                      </div>
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <p 
                      className="text-muted-foreground"
                      style={getTypographyStyles('base')}
                    >
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <div 
                          className="text-foreground font-bold"
                          style={getTypographyStyles('price')}
                        >
                          ${product.price}
                        </div>
                        <div 
                          className="text-muted-foreground text-sm"
                          style={getTypographyStyles('small')}
                        >
                          {isNeoBrutalism ? 'PRECIO' : 'Precio'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <StockIcon className={`w-4 h-4 ${
                            stockStatus === 'sin-stock' ? 'text-red-500' :
                            stockStatus === 'poco-stock' ? 'text-orange-500' :
                            'text-green-500'
                          }`} />
                          <span style={getTypographyStyles('base')}>{product.stock}</span>
                        </div>
                        <div style={getBadgeStyles(stockStatus)}>
                          {stockStatus === 'sin-stock' ? (isNeoBrutalism ? 'SIN STOCK' : 'Sin stock') :
                           stockStatus === 'poco-stock' ? (isNeoBrutalism ? 'POCO STOCK' : 'Poco stock') :
                           (isNeoBrutalism ? 'EN STOCK' : 'En stock')}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        style={getButtonStyles('small')}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {isNeoBrutalism ? 'EDITAR' : 'Editar'}
                      </button>
                      <button
                        style={{
                          ...getButtonStyles('small'), 
                          background: isMaterial ? 'var(--md-error-main, var(--destructive))' : 
                                     isFluent ? 'var(--fluent-semantic-danger, var(--destructive))' : 
                                     'var(--brutalist-pink)'
                        }}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                        onClick={() => deleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Footer */}
        <footer className="text-center py-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={getButtonStyles('secondary')}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Layers className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'GESTIÓN MASIVA' : 'Gestión Masiva'}
            </button>
            <button
              style={getButtonStyles('tertiary')}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Tag className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'ETIQUETAS' : 'Etiquetas'}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Products;
