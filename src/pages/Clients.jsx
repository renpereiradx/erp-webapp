/**
 * Página Clients - Multi-tema optimizada
 * Sistema de gestión de clientes con soporte completo para Neo-Brutalism, Material Design y Fluent Design
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
  Phone, 
  Mail, 
  MapPin,
  User,
  Building,
  Calendar,
  DollarSign,
  Star,
  AlertCircle,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import useClientStore from '@/store/useClientStore';

const Clients = () => {
  const { theme } = useTheme();
  const { clients, loading, error, fetchClients, deleteClient } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
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

  const getBrutalistHeaderStyles = () => ({
    background: 'var(--brutalist-lime)',
    color: '#000000',
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
      }
    };
    return styles[level] || styles.base;
  };

  const getBrutalistBadgeStyles = (type) => {
    const badges = {
      vip: {
        background: 'var(--brutalist-orange)',
        color: '#000000',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      regular: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      premium: {
        background: 'var(--brutalist-purple)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      }
    };
    return badges[type] || badges.regular;
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
    transition: 'all 150ms ease'
  });

  const getBrutalistGridLayout = () => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '2rem',
    padding: '2rem 0'
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

  const getMaterialHeaderStyles = () => ({
    background: 'var(--md-surface-variant, var(--muted))',
    padding: 'var(--md-spacing-2, 16px)',
    margin: `calc(-1 * var(--md-spacing-3, 24px)) calc(-1 * var(--md-spacing-3, 24px)) var(--md-spacing-3, 24px) calc(-1 * var(--md-spacing-3, 24px))`,
    borderRadius: 'var(--md-corner-medium, 12px) var(--md-corner-medium, 12px) 0 0'
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
      vip: {
        background: 'var(--md-primary-main, var(--primary))',
        color: 'var(--md-on-primary, var,--primary-foreground))',
        border: 'none',
        padding: '4px 8px',
        borderRadius: 'var(--md-corner-small, 4px)',
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.03333em',
        textTransform: 'uppercase'
      },
      regular: {
        background: 'var(--md-secondary-main, var(--secondary))',
        color: 'var(--md-on-secondary, var,--secondary-foreground))',
        border: 'none',
        padding: '4px 8px',
        borderRadius: 'var(--md-corner-small, 4px)',
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.03333em',
        textTransform: 'uppercase'
      },
      premium: {
        background: 'var(--md-error-main, var(--destructive))',
        color: 'var(--md-on-error, var,--destructive-foreground))',
        border: 'none',
        padding: '4px 8px',
        borderRadius: 'var(--md-corner-small, 4px)',
        fontSize: '0.75rem',
        fontWeight: 500,
        letterSpacing: '0.03333em',
        textTransform: 'uppercase'
      }
    };
    return badges[type] || badges.regular;
  };

  const getMaterialButtonStyles = (variant = 'primary') => {
    const buttons = {
      primary: {
        background: 'var(--md-primary-main, var(--primary))',
        color: 'var(--md-on-primary, var,--primary-foreground))',
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
        minHeight: '36px'
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
        minHeight: '36px'
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

  const getFluentHeaderStyles = () => ({
    background: 'var(--fluent-surface-secondary, var(--muted))',
    padding: 'var(--fluent-size-120, 12px)',
    margin: `calc(-1 * var(--fluent-size-160, 16px)) calc(-1 * var(--fluent-size-160, 16px)) var(--fluent-size-120, 12px) calc(-1 * var(--fluent-size-160, 16px))`,
    borderRadius: 'var(--fluent-corner-radius-medium, 4px) var(--fluent-corner-radius-medium, 4px) 0 0'
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
        color: 'var(--fluent-text-secondary, var,--muted-foreground))',
        lineHeight: 1.333
      }
    };
    return styles[level] || styles.base;
  };

  const getFluentBadgeStyles = (type) => {
    const badges = {
      vip: {
        background: 'var(--fluent-semantic-warning, var(--warning))',
        color: 'var(--fluent-text-primary, var(--warning-foreground))',
        border: '1px solid var(--fluent-border-neutral, var(--border))',
        padding: '2px 8px',
        borderRadius: 'var(--fluent-corner-radius-small, 2px)',
        fontSize: '0.75rem',
        fontWeight: 400,
        letterSpacing: '0em'
      },
      regular: {
        background: 'var(--fluent-brand-primary, var(--primary))',
        color: 'var(--fluent-text-on-accent, var,--primary-foreground))',
        border: '1px solid var(--fluent-border-accent, var(--fluent-brand-primary))',
        padding: '2px 8px',
        borderRadius: 'var(--fluent-corner-radius-small, 2px)',
        fontSize: '0.75rem',
        fontWeight: 400,
        letterSpacing: '0em'
      },
      premium: {
        background: 'var(--fluent-semantic-danger, var(--destructive))',
        color: 'var(--fluent-text-on-accent, var,--destructive-foreground))',
        border: '1px solid var(--fluent-border-neutral, var(--border))',
        padding: '2px 8px',
        borderRadius: 'var(--fluent-corner-radius-small, 2px)',
        fontSize: '0.75rem',
        fontWeight: 400,
        letterSpacing: '0em'
      }
    };
    return badges[type] || badges.regular;
  };

  const getFluentButtonStyles = (variant = 'primary') => {
    const buttons = {
      primary: {
        background: 'var(--fluent-brand-primary, var(--primary))',
        color: 'var(--fluent-text-on-accent, var,--primary-foreground))',
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
        minHeight: '32px'
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
        minHeight: '32px'
      }
    };
    return buttons[variant] || buttons.primary;
  };

  // Helper functions universales que se adaptan al tema activo (consistentes con Products.jsx)
  const getHeaderStyles = () => {
    if (isNeoBrutalism) return getBrutalistHeaderStyles();
    if (isMaterial) return {
      background: 'var(--md-sys-color-surface-variant)',
      padding: '16px',
      margin: '-24px -24px 24px -24px',
      borderRadius: '16px 16px 0 0'
    };
    if (isFluent) return {
      background: 'var(--fluent-control-fill-secondary)',
      padding: '12px',
      margin: '-16px -16px 12px -16px',
      borderRadius: '8px 8px 0 0'
    };
    return getBrutalistHeaderStyles();
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
        color: 'var(--fluent-text-primary, var,--foreground))',
        lineHeight: 1.4,
        marginBottom: 'var(--fluent-size-120, 12px)'
      },
      subheading: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '1rem',
        letterSpacing: '0em',
        color: 'var(--fluent-text-secondary, var,--muted-foreground))',
        lineHeight: 1.429
      },
      base: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '0.875rem',
        letterSpacing: '0em',
        color: 'var(--fluent-text-primary, var,--foreground))',
        lineHeight: 1.429
      },
      small: {
        fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
        fontWeight: 400,
        fontSize: '0.75rem',
        letterSpacing: '0em',
        color: 'var(--fluent-text-secondary, var,--muted-foreground))',
        lineHeight: 1.333
      }
    }[level] || {
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      letterSpacing: '0em',
      color: 'var(--fluent-text-primary, var,--foreground))',
      lineHeight: 1.429
    };
    
    return getBrutalistTypography(level);
  };

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

  const getBadgeStyles = (type) => {
    // Colores de fondo según el tipo de cliente
    const getBackgroundColor = () => {
      switch (type) {
        case 'vip':
          return isNeoBrutalism ? 'var(--brutalist-orange)' : 
                 isMaterial ? 'var(--md-primary-main, var(--primary))' :
                 isFluent ? 'var(--fluent-brand-primary, var(--primary))' : 'var(--primary)';
        case 'premium':
          return isNeoBrutalism ? 'var(--brutalist-purple)' : 
                 isMaterial ? 'var(--md-secondary-main, var(--secondary))' :
                 isFluent ? 'var(--fluent-brand-secondary, var(--secondary))' : 'var(--secondary)';
        default: // regular
          return isNeoBrutalism ? 'var(--brutalist-blue)' : 
                 isMaterial ? 'var(--md-semantic-info, var(--info))' :
                 isFluent ? 'var(--fluent-semantic-info, var(--info))' : 'var(--info)';
      }
    };

    return {
      background: getBackgroundColor(),
      color: isNeoBrutalism ? (type === 'vip' ? '#000000' : '#ffffff') : 
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
        color: 'var(--md-on-primary, var,--primary-foreground))',
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
        color: 'var(--md-on-secondary, var,--secondary-foreground))',
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
        color: 'var(--md-on-secondary, var,--secondary-foreground))',
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
      color: 'var(--md-on-primary, var,--primary-foreground))',
      border: 'none',
      borderRadius: 'var(--md-corner-small, 8px)',
      padding: '8px 24px',
      cursor: 'pointer'
    };
    
    if (isFluent) return {
      primary: {
        background: 'var(--fluent-brand-primary, var(--primary))',
        color: 'var(--fluent-text-on-accent, var,--primary-foreground))',
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
        color: 'var(--fluent-text-on-accent, var,--secondary-foreground))',
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
        color: 'var(--fluent-text-on-accent, var,--secondary-foreground))',
        border: '1px solid var(--fluent-border-neutral, var,--border))',
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

  // Funciones de eventos para animaciones Neo-Brutalism
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

  // Datos de ejemplo de clientes
  const clientsData = [
    {
      id: 1,
      name: 'Ana García',
      company: 'Tech Solutions S.A.',
      email: 'ana.garcia@techsolutions.com',
      phone: '+34 612 345 678',
      address: 'Madrid, España',
      type: 'vip',
      totalPurchases: 45250,
      lastPurchase: '2024-01-15',
      status: 'active'
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      company: 'Innovate Corp',
      email: 'carlos.rodriguez@innovate.com',
      phone: '+34 678 901 234',
      address: 'Barcelona, España',
      type: 'premium',
      totalPurchases: 32100,
      lastPurchase: '2024-01-12',
      status: 'active'
    },
    {
      id: 3,
      name: 'María López',
      company: 'Digital Works',
      email: 'maria.lopez@digitalworks.com',
      phone: '+34 654 321 098',
      address: 'Valencia, España',
      type: 'regular',
      totalPurchases: 18750,
      lastPurchase: '2024-01-10',
      status: 'active'
    },
    {
      id: 4,
      name: 'José Martínez',
      company: 'Future Systems',
      email: 'jose.martinez@futuresystems.com',
      phone: '+34 632 109 876',
      address: 'Sevilla, España',
      type: 'regular',
      totalPurchases: 12400,
      lastPurchase: '2024-01-08',
      status: 'inactive'
    }
  ];

  // Filtros de clientes
  const filteredClients = clientsData.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || client.type === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    if (isNeoBrutalism) {
      return status === 'active' ? 'var(--brutalist-lime)' : 'var(--brutalist-pink)';
    } else if (isMaterial) {
      return status === 'active' ? 'var(--md-semantic-success, var(--success))' : 'var(--md-error-main, var(--destructive))';
    } else if (isFluent) {
      return status === 'active' ? 'var(--fluent-semantic-success, var(--success))' : 'var(--fluent-semantic-danger, var(--destructive))';
    }
    return status === 'active' ? 'var(--success)' : 'var(--destructive)';
  };

  useEffect(() => {
    // Simular carga de datos
    if (fetchClients) {
      fetchClients();
    }
  }, [fetchClients]);

  return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="text-center py-8">
            <h1 
              className="text-primary mb-4"
              style={getTypographyStyles('title')}
            >
              {isNeoBrutalism ? 'GESTIÓN DE CLIENTES' : 
               isMaterial ? 'Gestión de Clientes' :
               'Client Management'}
            </h1>
            <p 
              className="text-muted-foreground max-w-2xl mx-auto mb-8"
              style={getTypographyStyles('base')}
            >
              {isNeoBrutalism ? 'ADMINISTRA TU BASE DE CLIENTES CON ESTILO NEO-BRUTALIST' :
               isMaterial ? 'Administra tu base de clientes con Material Design' :
               'Manage your client base with Fluent Design'}
            </p>
          </header>

          {/* Panel de filtros */}
          <section 
            className="p-6"
            style={getCardStyles()}
          >
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Buscador */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder={isNeoBrutalism ? "BUSCAR CLIENTES..." : "Buscar clientes..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                    style={isNeoBrutalism ? {
                      border: '3px solid var(--border)',
                      borderRadius: '0px',
                      textTransform: 'uppercase',
                      fontWeight: '600'
                    } : {}}
                  />
                </div>

                {/* Filtros */}
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-background"
                  style={isNeoBrutalism ? {
                    border: '3px solid var(--border)',
                    borderRadius: '0px',
                    textTransform: 'uppercase',
                    fontWeight: '600'
                  } : {}}
                >
                  <option value="all">{isNeoBrutalism ? 'TODOS LOS CLIENTES' : 'Todos los clientes'}</option>
                  <option value="vip">{isNeoBrutalism ? 'VIP' : 'VIP'}</option>
                  <option value="premium">{isNeoBrutalism ? 'PREMIUM' : 'Premium'}</option>
                  <option value="regular">{isNeoBrutalism ? 'REGULAR' : 'Regular'}</option>
                </select>
              </div>

              {/* Botón agregar cliente */}
              <button
                style={getButtonStyles('primary')}
                className="flex items-center gap-2"
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              >
                <Plus className="w-4 h-4" />
                {isNeoBrutalism ? 'AGREGAR CLIENTE' : 'Agregar Cliente'}
              </button>
            </div>

            <div className="text-center mt-4">
              <div 
                className="text-foreground text-2xl font-bold"
                style={getTypographyStyles('heading')}
              >
                {filteredClients.length}
              </div>
              <div 
                className="text-muted-foreground text-sm"
                style={getTypographyStyles('small')}
              >
                {isNeoBrutalism ? 'CLIENTES' : 'Clientes'}
              </div>
            </div>
          </section>

          {/* Grid de clientes */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <div 
                  className="text-muted-foreground"
                  style={getTypographyStyles('heading')}
                >
                  {isNeoBrutalism ? 'NO SE ENCONTRARON CLIENTES' : 'No se encontraron clientes'}
                </div>
              </div>
            ) : (
              filteredClients.map((client) => (
                <div key={client.id} style={getCardStyles()}>
                  {/* Header de la tarjeta */}
                  <div style={getHeaderStyles()}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{
                            background: isNeoBrutalism ? 'var(--brutalist-blue)' :
                                       isMaterial ? 'var(--md-primary-main, var(--primary))' :
                                       isFluent ? 'var(--fluent-brand-primary, var(--primary))' : 'var(--primary)',
                            border: isNeoBrutalism ? '2px solid var(--border)' : 'none'
                          }}
                        >
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 style={getTypographyStyles('heading')}>{client.name}</h3>
                          <span style={getBadgeStyles(client.type)}>
                            {isNeoBrutalism ? client.type.toUpperCase() : 
                             client.type.charAt(0).toUpperCase() + client.type.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Estado del cliente */}
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ background: getStatusColor(client.status) }}
                          title={client.status === 'active' ? 'Activo' : 'Inactivo'}
                        />
                        <button style={getButtonStyles('secondary')} className="p-1">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="space-y-4">
                    {/* Información de la empresa */}
                    <div className="flex items-start gap-3">
                      <Building className="w-4 h-4 mt-1 text-muted-foreground" />
                      <div>
                        <p style={getTypographyStyles('base')}>{client.company}</p>
                        <p style={getTypographyStyles('small')} className="text-muted-foreground">
                          {client.address}
                        </p>
                      </div>
                    </div>

                    {/* Información de contacto */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <p style={getTypographyStyles('small')}>{client.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <p style={getTypographyStyles('small')}>{client.phone}</p>
                      </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p style={getTypographyStyles('small')} className="text-muted-foreground mb-1">
                          Total Compras
                        </p>
                        <p style={getTypographyStyles('base')} className="font-semibold">
                          {formatCurrency(client.totalPurchases)}
                        </p>
                      </div>
                      <div>
                        <p style={getTypographyStyles('small')} className="text-muted-foreground mb-1">
                          Última Compra
                        </p>
                        <p style={getTypographyStyles('small')}>
                          {new Date(client.lastPurchase).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-4">
                      <button
                        style={getButtonStyles('primary')}
                        className="flex-1 flex items-center justify-center gap-2"
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                      >
                        <Edit className="w-4 h-4" />
                        {isNeoBrutalism ? 'EDITAR' : 'Editar'}
                      </button>
                      <button
                        style={getButtonStyles('secondary')}
                        className="flex items-center justify-center px-3"
                        onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                        onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
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
                <Users className="w-5 h-5 mr-2" />
                {isNeoBrutalism ? 'GESTIÓN MASIVA' : 'Gestión Masiva'}
              </button>
              <button
                style={getButtonStyles('tertiary')}
                onMouseEnter={isNeoBrutalism ? handleButtonHover : undefined}
                onMouseLeave={isNeoBrutalism ? handleButtonLeave : undefined}
              >
                <Mail className="w-5 h-5 mr-2" />
                {isNeoBrutalism ? 'ENVÍO MASIVO' : 'Envío Masivo'}
              </button>
            </div>
          </footer>

        </div>
      </div>
    );
};

export default Clients;
