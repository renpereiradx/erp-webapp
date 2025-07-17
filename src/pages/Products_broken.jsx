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
import { materialColors, materialTypography, materialSpacing, materialCorners, materialElevation } from '@/utils/materialDesignUtils';
import { fluentColors, fluentTypography, fluentSpacing, fluentCorners, fluentElevation } from '@/utils/fluentDesignUtils';

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

  const getBrutalistHeaderStyles = (colorVar = '--brutalist-lime') => ({
    background: `var(${colorVar})`,
    color: colorVar === '--brutalist-lime' ? '#000000' : '#ffffff',
    padding: '16px',
    border: 'none',
    borderBottom: '4px solid var(--border)',
    margin: '-1px -1px 0 -1px'
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
      },
      electronics: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '3px 6px',
        borderRadius: '0px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        minWidth: '80px',
        width: '80px',
        maxWidth: '80px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      clothing: {
        background: 'var(--brutalist-purple)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '3px 6px',
        borderRadius: '0px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        minWidth: '80px',
        width: '80px',
        maxWidth: '80px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      home: {
        background: 'var(--brutalist-green)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '3px 6px',
        borderRadius: '0px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        minWidth: '80px',
        width: '80px',
        maxWidth: '80px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      sports: {
        background: 'var(--brutalist-orange)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '3px 6px',
        borderRadius: '0px',
        fontSize: '0.7rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        minWidth: '80px',
        width: '80px',
        maxWidth: '80px',
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
        padding: '8px 16px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      secondary: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      danger: {
        background: 'var(--brutalist-pink)',
        color: '#ffffff',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      small: {
        background: 'var(--brutalist-purple)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        borderRadius: '0px',
        padding: '6px 12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        letterSpacing: '0.025em',
        boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      }
    };
    return buttons[variant] || buttons.primary;
  };

  const getBrutalistInputStyles = () => ({
    background: 'var(--background)',
    border: '3px solid var(--border)',
    borderRadius: '0px',
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--foreground)',
    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
    transition: 'all 150ms ease',
    textTransform: isNeoBrutalism ? 'uppercase' : 'none'
  });

  // Helper functions específicas para Material Design - Inputs
  const getMaterialInputStyles = () => ({
    background: 'var(--md-sys-color-surface)',
    border: `1px solid var(--md-sys-color-outline)`,
    borderRadius: 'var(--md-corner-small, 4px)',
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: '400',
    color: 'var(--md-sys-color-on-surface)',
    transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
    '&:focus': {
      borderColor: 'var(--md-sys-color-primary)',
      outline: 'none',
      boxShadow: `0 0 0 2px var(--md-sys-color-primary-container)`
    }
  });

  // Helper functions específicas para Fluent Design - Inputs
  const getFluentInputStyles = () => ({
    background: 'var(--fluent-control-fill-default)',
    border: `1px solid var(--fluent-control-stroke-default)`,
    borderRadius: 'var(--fluent-control-corner-radius, 4px)',
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: '400',
    color: 'var(--fluent-text-primary)',
    transition: 'all 100ms cubic-bezier(0.1, 0.9, 0.2, 1)',
    '&:focus': {
      borderColor: 'var(--fluent-accent-default)',
      outline: 'none',
      background: 'var(--fluent-control-fill-input-active)'
    },
    '&:hover': {
      background: 'var(--fluent-control-fill-secondary)'
    }
  });

  // Helper functions para Material Design
  const getMaterialCardStyles = () => ({
    background: 'var(--md-surface-main, var(--card))',
    border: 'none',
    borderRadius: 'var(--md-corner-medium, 12px)',
    boxShadow: 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))',
    transition: 'all 200ms ease',
    overflow: 'hidden',
    padding: 'var(--md-spacing-3, 24px)'
  });

  const getMaterialTypography = (level = 'base') => {
    const styles = {
      title: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: '1.75rem',
        fontWeight: 500,
        letterSpacing: '0.00735em',
        color: 'var(--md-on-background, var(--foreground))',
        lineHeight: 1.167,
        marginBottom: 'var(--md-spacing-3, 24px)'
      },
      heading: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: '1.25rem',
        fontWeight: 500,
        letterSpacing: '0.00938em',
        color: 'var(--md-on-surface, var(--foreground))',
        lineHeight: 1.334
      },
      subheading: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: '1rem',
        fontWeight: 400,
        letterSpacing: '0.00938em',
        color: 'var(--md-on-surface-variant, var(--muted-foreground))',
        lineHeight: 1.5
      },
      base: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 400,
        letterSpacing: '0.01071em',
        color: 'var(--md-on-surface, var(--foreground))',
        lineHeight: 1.429
      },
      small: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: '0.75rem',
        fontWeight: 400,
        letterSpacing: '0.03333em',
        color: 'var(--md-on-surface-variant, var(--muted-foreground))',
        lineHeight: 1.333
      }
    };
    return styles[level] || styles.base;
  };

  const getMaterialBadgeStyles = (type) => {
    const badges = {
      'en-stock': {
        background: 'var(--md-semantic-success, var(--success))',
        color: 'var(--md-on-success, var(--success-foreground))',
        border: 'none',
        padding: '4px 12px',
        borderRadius: 'var(--md-corner-small, 4px)',
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.03333em',
        textTransform: 'uppercase',
        minWidth: '82px',
        width: '82px',
        maxWidth: '82px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      'bajo-stock': {
        background: 'var(--md-warning-main, var(--warning))',
        color: 'var(--md-on-warning, var(--warning-foreground))',
        border: 'none',
        padding: '4px 12px',
        borderRadius: 'var(--md-corner-small, 4px)',
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.03333em',
        textTransform: 'uppercase',
        minWidth: '82px',
        width: '82px',
        maxWidth: '82px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      'sin-stock': {
        background: 'var(--md-error-main, var(--destructive))',
        color: 'var(--md-on-error, var(--destructive-foreground))',
        border: 'none',
        padding: '4px 12px',
        borderRadius: 'var(--md-corner-small, 4px)',
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.03333em',
        textTransform: 'uppercase',
        minWidth: '82px',
        width: '82px',
        maxWidth: '82px',
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

  const getMaterialButtonStyles = (variant = 'primary') => {
    const buttons = {
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
        minWidth: '160px',
        width: '160px',
        maxWidth: '160px',
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
        minWidth: '160px',
        width: '160px',
        maxWidth: '160px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      small: {
        background: 'var(--md-primary-main, var(--primary))',
        color: 'var(--md-on-primary, var(--primary-foreground))',
        border: 'none',
        borderRadius: 'var(--md-corner-small, 8px)',
        padding: '6px 12px',
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 500,
        fontSize: '0.75rem',
        letterSpacing: '0.02857em',
        textTransform: 'uppercase',
        boxShadow: 'var(--md-elevation-1, 0px 1px 3px rgba(0, 0, 0, 0.12))',
        transition: 'all 150ms ease',
        cursor: 'pointer',
        minHeight: '28px',
        minWidth: '32px',
        width: '32px',
        maxWidth: '32px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    };
    return buttons[variant] || buttons.primary;
  };

  // Helper functions para Fluent Design
  const getFluentCardStyles = () => ({
    background: 'var(--fluent-surface-card, var(--card))',
    border: '1px solid var(--fluent-border-neutral, var(--border))',
    borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
    boxShadow: 'var(--fluent-shadow-8, 0px 4px 8px rgba(0, 0, 0, 0.14))',
    transition: 'all 200ms cubic-bezier(0.33, 0, 0.67, 1)',
    overflow: 'hidden',
    padding: 'var(--fluent-size-160, 16px)'
  });

  const getFluentTypography = (level = 'base') => {
    const styles = {
      title: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontSize: '1.75rem',
        fontWeight: 600,
        letterSpacing: '-0.005em',
        color: 'var(--fluent-text-primary, var(--foreground))',
        lineHeight: 1.286,
        marginBottom: 'var(--fluent-size-160, 16px)'
      },
      heading: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '0em',
        color: 'var(--fluent-text-primary, var(--foreground))',
        lineHeight: 1.4
      },
      subheading: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontSize: '1rem',
        fontWeight: 400,
        letterSpacing: '0em',
        color: 'var(--fluent-text-secondary, var(--muted-foreground))',
        lineHeight: 1.429
      },
      base: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 400,
        letterSpacing: '0em',
        color: 'var(--fluent-text-primary, var(--foreground))',
        lineHeight: 1.429
      },
      small: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontSize: '0.75rem',
        fontWeight: 400,
        letterSpacing: '0em',
        color: 'var(--fluent-text-secondary, var(--muted-foreground))',
        lineHeight: 1.333
      }
    };
    return styles[level] || styles.base;
  };

  const getFluentBadgeStyles = (type) => {
    const badges = {
      'en-stock': {
        background: 'var(--fluent-semantic-success, var(--success))',
        color: 'var(--fluent-text-on-accent, var(--success-foreground))',
        border: '1px solid var(--fluent-border-neutral, var(--border))',
        padding: '2px 8px',
        borderRadius: 'var(--fluent-corner-radius-small, 2px)',
        fontSize: '0.75rem',
        fontWeight: 400,
        letterSpacing: '0em',
        minWidth: '78px',
        width: '78px',
        maxWidth: '78px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      'bajo-stock': {
        background: 'var(--fluent-semantic-warning, var(--warning))',
        color: 'var(--fluent-text-on-accent, var(--warning-foreground))',
        border: '1px solid var(--fluent-border-neutral, var(--border))',
        padding: '2px 8px',
        borderRadius: 'var(--fluent-corner-radius-small, 2px)',
        fontSize: '0.75rem',
        fontWeight: 400,
        letterSpacing: '0em',
        minWidth: '78px',
        width: '78px',
        maxWidth: '78px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      'sin-stock': {
        background: 'var(--fluent-semantic-danger, var(--destructive))',
        color: 'var(--fluent-text-on-accent, var(--destructive-foreground))',
        border: '1px solid var(--fluent-border-neutral, var(--border))',
        padding: '2px 8px',
        borderRadius: 'var(--fluent-corner-radius-small, 2px)',
        fontSize: '0.75rem',
        fontWeight: 400,
        letterSpacing: '0em',
        minWidth: '78px',
        width: '78px',
        maxWidth: '78px',
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

  const getFluentButtonStyles = (variant = 'primary') => {
    const buttons = {
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
        minWidth: '150px',
        width: '150px',
        maxWidth: '150px',
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
        minWidth: '150px',
        width: '150px',
        maxWidth: '150px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      small: {
        background: 'var(--fluent-brand-primary, var(--primary))',
        color: 'var(--fluent-text-on-accent, var(--primary-foreground))',
        border: '1px solid var(--fluent-border-accent, var(--fluent-brand-primary))',
        borderRadius: 'var(--fluent-corner-radius-small, 2px)',
        padding: '4px 8px',
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '0.75rem',
        letterSpacing: '0em',
        boxShadow: 'var(--fluent-shadow-2, 0px 1px 2px rgba(0, 0, 0, 0.14))',
        transition: 'all 150ms cubic-bezier(0.33, 0, 0.67, 1)',
        cursor: 'pointer',
        minHeight: '24px',
        minWidth: '28px',
        width: '28px',
        maxWidth: '28px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    };
    return buttons[variant] || buttons.primary;
  };

  // Helper functions universales que se adaptan al tema activo
  const getCardStyles = () => {
    if (isNeoBrutalism) return getBrutalistCardStyles();
    if (isMaterial) return getMaterialCardStyles();
    if (isFluent) return getFluentCardStyles();
    return getBrutalistCardStyles(); // fallback
  };

  const getTypographyStyles = (level = 'base') => {
    if (isNeoBrutalism) return getBrutalistTypography(level);
    if (isMaterial) return getMaterialTypography(level);
    if (isFluent) return getFluentTypography(level);
    return getBrutalistTypography(level); // fallback
  };

  const getBadgeStyles = (type) => {
    if (isNeoBrutalism) return getBrutalistBadgeStyles(type);
    if (isMaterial) return getMaterialBadgeStyles(type);
    if (isFluent) return getFluentBadgeStyles(type);
    return getBrutalistBadgeStyles(type); // fallback
  };

  const getButtonStyles = (variant = 'primary') => {
    if (isNeoBrutalism) return getBrutalistButtonStyles(variant);
    if (isMaterial) return getMaterialButtonStyles(variant);
    if (isFluent) return getFluentButtonStyles(variant);
    return getBrutalistButtonStyles(variant); // fallback
  };

  const getGridLayoutStyles = () => {
    if (isNeoBrutalism) return getBrutalistGridLayout();
    if (isMaterial) return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 'var(--md-spacing-3, 24px)',
      maxWidth: '1400px',
      margin: '0 auto'
    };
    if (isFluent) return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 'var(--fluent-size-160, 16px)',
      maxWidth: '1400px',
      margin: '0 auto'
    };
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1.5rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }; // fallback
  };

  const getInputStyles = () => {
    if (isNeoBrutalism) return getBrutalistInputStyles();
    if (isMaterial) return getMaterialInputStyles();
    if (isFluent) return getFluentInputStyles();
    return {};
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

  const getCategoryColor = (category) => {
    const colors = {
      electronics: '--brutalist-blue',
      clothing: '--brutalist-purple', 
      home: '--brutalist-green',
      sports: '--brutalist-orange'
    };
    return colors[category?.toLowerCase()] || '--brutalist-lime';
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

  const handleCardHover = (e) => {
    if (isNeoBrutalism) {
      e.currentTarget.style.transform = 'translate(-4px, -4px)';
      e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleCardLeave = (e) => {
    if (isNeoBrutalism) {
      e.currentTarget.style.transform = 'translate(0px, 0px)';
      e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
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
        
        {/* Header Multi-tema */}
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
          
          {/* Botones de acción principal */}
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

        {/* Panel de filtros y búsqueda */}
        <section 
          className="p-6"
          style={getCardStyles()}
        >
          <div className="grid md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={isNeoBrutalism ? "BUSCAR PRODUCTOS..." : "Buscar productos..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 ${isMaterial ? 'md-input' : ''} ${isFluent ? 'fluent-input' : ''}`}
                style={getInputStyles()}
                onFocus={(e) => {
                  if (isNeoBrutalism) {
                    e.target.style.transform = 'translate(-2px, -2px)';
                    e.target.style.boxShadow = '5px 5px 0px 0px rgba(0,0,0,1)';
                  }
                }}
                onBlur={(e) => {
                  if (isNeoBrutalism) {
                    e.target.style.transform = 'translate(0px, 0px)';
                    e.target.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,1)';
                  }
                }}
              />
            </div>

            {/* Filtro por categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`${isMaterial ? 'md-select' : ''} ${isFluent ? 'fluent-select' : ''}`}
              style={getInputStyles()}
            >
              <option value="all">{isNeoBrutalism ? 'TODAS LAS CATEGORÍAS' : 'Todas las categorías'}</option>
              <option value="Electronics">{isNeoBrutalism ? 'ELECTRÓNICOS' : 'Electrónicos'}</option>
              <option value="Clothing">{isNeoBrutalism ? 'ROPA' : 'Ropa'}</option>
              <option value="Home">{isNeoBrutalism ? 'HOGAR' : 'Hogar'}</option>
              <option value="Sports">{isNeoBrutalism ? 'DEPORTES' : 'Deportes'}</option>
            </select>

            {/* Filtro por stock */}
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className={`${isMaterial ? 'md-select' : ''} ${isFluent ? 'fluent-select' : ''}`}
              style={getInputStyles()}
            >
              <option value="all">{isNeoBrutalism ? 'TODO EL STOCK' : 'Todo el stock'}</option>
              <option value="in-stock">{isNeoBrutalism ? 'EN STOCK' : 'En stock'}</option>
              <option value="low-stock">{isNeoBrutalism ? 'POCO STOCK' : 'Poco stock'}</option>
              <option value="out-of-stock">{isNeoBrutalism ? 'SIN STOCK' : 'Sin stock'}</option>
            </select>

            {/* Estadísticas rápidas */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div 
                  className="text-foreground"
                  style={getTypographyStyles('heading')}
                >
                  {filteredProducts.length}
                </div>
                <div 
                  className="text-muted-foreground"
                  style={getTypographyStyles('small')}
                >
                  {isNeoBrutalism ? 'PRODUCTOS' : 'Productos'}
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-foreground"
                  style={getBrutalistTypography('heading')}
                >
                  {filteredProducts.filter(p => p.stock <= 10).length}
                </div>
                <div 
                  className="text-muted-foreground"
                  style={getBrutalistTypography('small')}
                >
                  ALERTAS
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid de productos con estilo Neo-Brutalist */}
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
              const categoryColor = getCategoryColor(product.category);
              
              return (
                <div
                  key={product.id}
                  className="cursor-pointer"
                  style={getCardStyles()}
                  onMouseEnter={handleCardHover}
                  onMouseLeave={handleCardLeave}
                >
                  {/* Header de la card */}
                  <div style={isNeoBrutalism ? getBrutalistHeaderStyles(categoryColor) : {
                    background: isMaterial ? 'var(--md-sys-color-primary-container)' : 'var(--fluent-accent-default)',
                    color: isMaterial ? 'var(--md-sys-color-on-primary-container)' : 'var(--fluent-text-on-accent-primary)',
                    padding: '16px',
                    borderRadius: isMaterial ? 'var(--md-corner-large, 16px) var(--md-corner-large, 16px) 0 0' : '8px 8px 0 0'
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div style={isNeoBrutalism ? getBrutalistIconBackground('--background') : {
                          background: isMaterial ? 'var(--md-sys-color-surface)' : 'var(--fluent-control-fill-default)',
                          borderRadius: isMaterial ? 'var(--md-corner-full, 50%)' : '4px',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Package className="w-6 h-6 text-foreground" />
                        </div>
                        <div>
                          <h3 style={getTypographyStyles('subheading')}>
                            {product.name}
                          </h3>
                          <div style={getBadgeStyles(product.category.toLowerCase())}>
                            {product.category}
                          </div>
                        </div>
                      </div>
                      <button
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: isNeoBrutalism ? (categoryColor === '--brutalist-lime' ? '#000000' : '#ffffff') : 'var(--foreground)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Contenido de la card */}
                  <div className="p-6 space-y-4">
                    
                    {/* Descripción */}
                    <p 
                      className="text-muted-foreground"
                      style={getTypographyStyles('base')}
                    >
                      {product.description}
                    </p>

                    {/* Precio y stock */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div 
                          className="text-foreground"
                          style={getTypographyStyles('price')}
                        >
                          ${product.price}
                        </div>
                        <div 
                          className="text-muted-foreground"
                          style={getTypographyStyles('small')}
                        >
                          {isNeoBrutalism ? 'PRECIO' : 'Precio'}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <StockIcon className={`w-5 h-5 ${
                            stockStatus === 'sin-stock' ? 'text-red-500' :
                            stockStatus === 'poco-stock' ? 'text-orange-500' :
                            'text-green-500'
                          }`} />
                          <span 
                            className="text-foreground"
                            style={getTypographyStyles('subheading')}
                          >
                            {product.stock}
                          </span>
                        </div>
                        <div style={getBadgeStyles(stockStatus)}>
                          {stockStatus === 'sin-stock' ? (isNeoBrutalism ? 'SIN STOCK' : 'Sin stock') :
                           stockStatus === 'poco-stock' ? (isNeoBrutalism ? 'POCO STOCK' : 'Poco stock') :
                           (isNeoBrutalism ? 'EN STOCK' : 'En stock')}
                        </div>
                      </div>
                    </div>

                    {/* Métricas adicionales */}
                    <div 
                      className="grid grid-cols-2 gap-3 pt-4"
                      style={{
                        borderTop: isNeoBrutalism ? '2px solid var(--border)' : 
                                 isMaterial ? '1px solid var(--md-sys-color-outline-variant)' :
                                 '1px solid var(--fluent-stroke-control-default)'
                      }}
                    >
                      <div className="text-center">
                        <div 
                          className="text-foreground"
                          style={getTypographyStyles('subheading')}
                        >
                          {product.sold || 0}
                        </div>
                        <div 
                          className="text-muted-foreground"
                          style={getTypographyStyles('small')}
                        >
                          {isNeoBrutalism ? 'VENDIDOS' : 'Vendidos'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${
                                i < (product.rating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <div 
                          className="text-muted-foreground"
                          style={getTypographyStyles('small')}
                        >
                          {isNeoBrutalism ? 'RATING' : 'Rating'}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-4">
                      <button
                        style={getButtonStyles('small')}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                        className="flex-1 small-button"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {isNeoBrutalism ? 'EDITAR' : 'Editar'}
                      </button>
                      <button
                        style={{
                          ...getButtonStyles('small'), 
                          background: isMaterial ? 'var(--md-sys-color-secondary)' : 
                                     isFluent ? 'var(--fluent-warning-default)' : 
                                     'var(--brutalist-orange)'
                        }}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                        className="flex-1 small-button"
                      ></button>
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {isNeoBrutalism ? 'VENDER' : 'Vender'}
                      </button>
                      <button
                        style={{
                          ...getButtonStyles('small'), 
                          background: isMaterial ? 'var(--md-sys-color-error)' : 
                                     isFluent ? 'var(--fluent-danger-default)' : 
                                     'var(--brutalist-pink)'
                        }}
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                        onClick={() => deleteProduct(product.id)}
                        className="small-button"
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

        {/* Footer de acciones avanzadas */}
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
              style={{...getButtonStyles('primary'), background: isMaterial ? 'var(--md-sys-color-tertiary)' : isFluent ? 'var(--fluent-accent-default)' : 'var(--brutalist-purple)'}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Tag className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'ETIQUETAS' : 'Etiquetas'}
            </button>
            <button
              style={{...getButtonStyles('primary'), background: isMaterial ? 'var(--md-sys-color-secondary)' : isFluent ? 'var(--fluent-warning-default)' : 'var(--brutalist-orange)'}}
              onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
              onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
            >
              <Zap className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'AUTOMATIZACIÓN' : 'Automatización'}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Products;
