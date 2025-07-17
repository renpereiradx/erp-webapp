/**
 * Página Dashboard del sistema ERP - Multi-tema optimizado
 * Soporte completo para Neo-Brutalism, Material Design y Fluent Design
 * Incluye helper functions específicas para cada sistema de diseño
 */

import React from 'react';
import { useTheme } from 'next-themes';
import { 
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Plus,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MetricCard, BrutalistBadge } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { materialColors, materialTypography, materialSpacing, materialCorners, materialElevation } from '@/utils/materialDesignUtils';
import { fluentColors, fluentTypography, fluentSpacing, fluentCorners, fluentElevation } from '@/utils/fluentDesignUtils';

const Dashboard = () => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme === 'neo-brutalism-light' || theme === 'neo-brutalism-dark';
  const isMaterial = theme === 'material-light' || theme === 'material-dark';
  const isFluent = theme === 'fluent-light' || theme === 'fluent-dark';

  // Helper functions para estilo específico de Neo-Brutalism
  const getBrutalistMetricStyles = () => ({
    background: 'var(--background)',
    border: '4px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
    transform: 'none',
    transition: 'all 200ms ease'
  });

  const getBrutalistIconBackground = (colorVar) => ({
    background: `var(${colorVar})`,
    border: '3px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  const getBrutalistTypography = (level = 'base') => {
    const styles = {
      title: {
        fontSize: '3.5rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.1',
        textShadow: '3px 3px 0px rgba(0,0,0,0.8)'
      },
      heading: {
        fontSize: '1.875rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2'
      },
      subheading: {
        fontSize: '1.25rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      base: {
        fontSize: '1rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      }
    };
    return styles[level] || styles.base;
  };

  const getBrutalistGridLayout = () => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    maxWidth: '1400px',
    margin: '0 auto'
  });

  const getBrutalistButtonStyles = () => ({
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
    minWidth: '180px',
    width: '180px',
    maxWidth: '180px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  });

  // Helper functions para Material Design
  const getMaterialMetricStyles = () => ({
    background: 'var(--md-surface-main, var(--card))',
    border: 'none',
    borderRadius: 'var(--md-corner-medium, 12px)',
    boxShadow: 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))',
    transform: 'none',
    transition: 'all 200ms ease',
    padding: 'var(--md-spacing-3, 24px)'
  });

  const getMaterialIconBackground = (colorVar) => ({
    background: colorVar || 'var(--md-primary-main, var(--primary))',
    border: 'none',
    borderRadius: '50%',
    boxShadow: 'var(--md-elevation-1, 0px 1px 3px rgba(0, 0, 0, 0.12))',
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--md-spacing-2, 16px)'
  });

  const getMaterialTypography = (level = 'base') => {
    const styles = {
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
      }
    };
    return styles[level] || styles.base;
  };

  const getMaterialButtonStyles = () => ({
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
  });

  // Helper functions para Fluent Design
  const getFluentMetricStyles = () => ({
    background: 'var(--fluent-surface-card, var(--card))',
    border: '1px solid var(--fluent-border-neutral, var(--border))',
    borderRadius: 'var(--fluent-corner-radius-medium, 4px)',
    boxShadow: 'var(--fluent-shadow-8, 0px 4px 8px rgba(0, 0, 0, 0.14))',
    transform: 'none',
    transition: 'all 200ms cubic-bezier(0.33, 0, 0.67, 1)',
    padding: 'var(--fluent-size-160, 16px)'
  });

  const getFluentIconBackground = (colorVar) => ({
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
  });

  const getFluentTypography = (level = 'base') => {
    const styles = {
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
      }
    };
    return styles[level] || styles.base;
  };

  const getFluentButtonStyles = () => ({
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
  });

  // Helper functions generales que seleccionan el estilo según el tema
  const getMetricStyles = () => {
    if (isNeoBrutalism) return getBrutalistMetricStyles();
    if (isMaterial) return getMaterialMetricStyles();
    if (isFluent) return getFluentMetricStyles();
    return getBrutalistMetricStyles(); // fallback
  };

  const getIconBackground = (colorVar) => {
    if (isNeoBrutalism) return getBrutalistIconBackground(colorVar);
    if (isMaterial) return getMaterialIconBackground(colorVar);
    if (isFluent) return getFluentIconBackground(colorVar);
    return getBrutalistIconBackground(colorVar); // fallback
  };

  const getTypography = (level = 'base') => {
    if (isNeoBrutalism) return getBrutalistTypography(level);
    if (isMaterial) return getMaterialTypography(level);
    if (isFluent) return getFluentTypography(level);
    return getBrutalistTypography(level); // fallback
  };

  const getButtonStyles = () => {
    if (isNeoBrutalism) return getBrutalistButtonStyles();
    if (isMaterial) return getMaterialButtonStyles();
    if (isFluent) return getFluentButtonStyles();
    return getBrutalistButtonStyles(); // fallback
  };

  const getGridLayout = () => {
    if (isNeoBrutalism) return getBrutalistGridLayout();
    // Material y Fluent usan grid similar pero con diferentes gaps
    if (isMaterial) return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 'var(--md-spacing-3, 24px)',
      maxWidth: '1200px',
      margin: '0 auto'
    };
    if (isFluent) return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 'var(--fluent-size-160, 16px)',
      maxWidth: '1200px',
      margin: '0 auto'
    };
    return getBrutalistGridLayout(); // fallback
  };

  // Datos de ejemplo para los gráficos con colores dinámicos por tema
  const getCategoryColors = () => {
    if (isNeoBrutalism) {
      return [
        'var(--brutalist-lime)',
        'var(--brutalist-blue)', 
        'var(--brutalist-pink)',
        'var(--brutalist-orange)',
        'var(--brutalist-purple)'
      ];
    } else if (isMaterial) {
      return [
        'var(--md-primary-main, #6200EE)',
        'var(--md-secondary-main, #03DAC6)',
        'var(--md-error-main, #B00020)',
        '#FF9800', // Orange
        '#9C27B0'  // Purple
      ];
    } else if (isFluent) {
      return [
        'var(--fluent-brand-primary, #0078D4)',
        'var(--fluent-semantic-success, #107C10)',
        'var(--fluent-semantic-warning, #FFB900)',
        'var(--fluent-semantic-danger, #D13438)',
        '#8764B8' // Purple
      ];
    }
    return [
      'var(--primary)',
      'var(--secondary)', 
      'var(--destructive)',
      'var(--warning)',
      'var(--info)'
    ];
  };

  const salesData = [
    { name: 'Ene', value: 12000 },
    { name: 'Feb', value: 15000 },
    { name: 'Mar', value: 18000 },
    { name: 'Abr', value: 22000 },
    { name: 'May', value: 19000 },
    { name: 'Jun', value: 25000 },
  ];

  const categoryColors = getCategoryColors();
  const categoryData = [
    { name: 'Electrónicos', value: 35, color: categoryColors[0] },
    { name: 'Ropa', value: 25, color: categoryColors[1] },
    { name: 'Hogar', value: 20, color: categoryColors[2] },
    { name: 'Deportes', value: 15, color: categoryColors[3] },
    { name: 'Otros', value: 5, color: categoryColors[4] },
  ];

  const lowStockProducts = [
    { name: 'iPhone 15', current: 3, minimum: 10, alert: 'critical' },
    { name: 'Laptop Dell', current: 5, minimum: 15, alert: 'high' },
    { name: 'Mouse Gaming', current: 8, minimum: 20, alert: 'medium' },
    { name: 'Teclado RGB', current: 12, minimum: 25, alert: 'low' },
  ];

  const recentActivity = [
    { type: 'sale', message: 'Nueva venta por $2,450', time: 'hace 5 min', urgent: true },
    { type: 'inventory', message: 'Stock crítico: iPhone 15', time: 'hace 12 min', urgent: true },
    { type: 'customer', message: 'Nuevo cliente registrado', time: 'hace 28 min', urgent: false },
    { type: 'order', message: 'Pedido #1847 completado', time: 'hace 1 hora', urgent: false },
  ];

  // Métricas con colores dinámicos según el tema
  const getMetricColors = () => {
    if (isNeoBrutalism) {
      return {
        sales: "var(--brutalist-lime)",
        clients: "var(--brutalist-blue)", 
        products: "var(--brutalist-pink)",
        orders: "var(--brutalist-orange)"
      };
    } else if (isMaterial) {
      return {
        sales: "var(--md-primary-main, var(--primary))",
        clients: "var(--md-secondary-main, var(--secondary))",
        products: "var(--md-error-main, var(--destructive))", 
        orders: "var(--md-warning-main, #FF9800)"
      };
    } else if (isFluent) {
      return {
        sales: "var(--fluent-brand-primary, var(--primary))",
        clients: "var(--fluent-semantic-success, var(--secondary))",
        products: "var(--fluent-semantic-warning, var(--destructive))",
        orders: "var(--fluent-semantic-danger, var(--warning))"
      };
    }
    return {
      sales: "var(--primary)",
      clients: "var(--secondary)",
      products: "var(--destructive)",
      orders: "var(--warning)"
    };
  };

  const metricColors = getMetricColors();
  const metrics = [
    {
      title: isNeoBrutalism ? "VENTAS TOTALES" : "Ventas Totales",
      value: "$125,430",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: metricColors.sales,
      description: "Comparado con el mes anterior"
    },
    {
      title: isNeoBrutalism ? "CLIENTES ACTIVOS" : "Clientes Activos", 
      value: "2,847",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: metricColors.clients,
      description: "Usuarios únicos este mes"
    },
    {
      title: isNeoBrutalism ? "PRODUCTOS" : "Productos",
      value: "1,253",
      change: "-2.1%",
      trend: "down", 
      icon: Package,
      color: metricColors.products,
      description: "Items en inventario"
    },
    {
      title: isNeoBrutalism ? "PEDIDOS HOY" : "Pedidos Hoy",
      value: "147",
      change: "+25.8%",
      trend: "up",
      icon: ShoppingCart,
      color: metricColors.orders,
      description: "Órdenes procesadas hoy"
    }
  ];

  // Helper function para texto de alertas localizado
  const getAlertText = (alert) => {
    const translations = {
      critical: {
        'neo-brutalism': 'CRÍTICO',
        'material': 'Crítico', 
        'fluent': 'Crítico'
      },
      high: {
        'neo-brutalism': 'ALTO',
        'material': 'Alto',
        'fluent': 'Alto'
      },
      medium: {
        'neo-brutalism': 'MEDIO', 
        'material': 'Medio',
        'fluent': 'Medio'
      },
      low: {
        'neo-brutalism': 'BAJO',
        'material': 'Bajo', 
        'fluent': 'Bajo'
      }
    };

    const themeKey = isNeoBrutalism ? 'neo-brutalism' : 
                    isMaterial ? 'material' : 
                    isFluent ? 'fluent' : 'material';
    
    return translations[alert]?.[themeKey] || alert;
  };

  // Helper function para estilos de badges de alerta
  const getBadgeStyles = (alertLevel) => {
    // Colores de fondo según el nivel de alerta
    const getBackgroundColor = () => {
      switch (alertLevel) {
        case 'critical':
          return isNeoBrutalism ? 'var(--brutalist-pink)' : 
                 isMaterial ? 'var(--md-error-main, var(--destructive))' :
                 isFluent ? 'var(--fluent-semantic-danger, var(--destructive))' : 'var(--destructive)';
        case 'high':
          return isNeoBrutalism ? 'var(--brutalist-orange)' : 
                 isMaterial ? 'var(--md-warning-main, var(--warning))' :
                 isFluent ? 'var(--fluent-semantic-warning, var(--warning))' : 'var(--warning)';
        default: // medium, low
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

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Neo-Brutalist */}
        <header className="text-center py-8">
          <h1 
            className="text-primary mb-4"
            style={getTypography('title')}
          >
            {isNeoBrutalism ? 'DASHBOARD ERP' : isMaterial ? 'Dashboard ERP' : 'Dashboard ERP'}
          </h1>
          <p 
            className="text-muted-foreground max-w-2xl mx-auto"
            style={getTypography('base')}
          >
            {isNeoBrutalism ? 'SISTEMA DE GESTIÓN EMPRESARIAL CON DISEÑO NEO-BRUTALIST' : 
             isMaterial ? 'Sistema de gestión empresarial con Material Design' :
             isFluent ? 'Sistema de gestión empresarial con Fluent Design' : 
             'Sistema de gestión empresarial'}
          </p>
          
          {/* Botones de acción rápida */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button
              style={getButtonStyles()}
              onMouseEnter={(e) => {
                if (isNeoBrutalism) {
                  e.target.style.transform = 'translate(-2px, -2px)';
                  e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                } else {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = isMaterial ? 'var(--md-elevation-3)' : '0 4px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                e.target.style.boxShadow = isNeoBrutalism ? '4px 4px 0px 0px rgba(0,0,0,1)' : 
                                         isMaterial ? 'var(--md-elevation-1)' : '0 1px 3px rgba(0,0,0,0.1)';
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'NUEVA VENTA' : 
               isMaterial ? 'Nueva Venta' :
               isFluent ? 'Nueva venta' : 'Nueva Venta'}
            </button>
            <button
              style={{
                ...getButtonStyles(), 
                background: isNeoBrutalism ? 'var(--brutalist-blue)' : 
                           isMaterial ? 'var(--md-secondary-main, var(--secondary))' :
                           isFluent ? 'var(--fluent-brand-secondary, var(--secondary))' : 'var(--secondary)'
              }}
              onMouseEnter={(e) => {
                if (isNeoBrutalism) {
                  e.target.style.transform = 'translate(-2px, -2px)';
                  e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                } else {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = isMaterial ? 'var(--md-elevation-3)' : '0 4px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                e.target.style.boxShadow = isNeoBrutalism ? '4px 4px 0px 0px rgba(0,0,0,1)' : 
                                         isMaterial ? 'var(--md-elevation-1)' : '0 1px 3px rgba(0,0,0,0.1)';
              }}
            >
              <Users className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'AÑADIR CLIENTE' : 
               isMaterial ? 'Añadir Cliente' :
               isFluent ? 'Añadir cliente' : 'Añadir Cliente'}
            </button>
            <button
              style={{
                ...getButtonStyles(), 
                background: isNeoBrutalism ? 'var(--brutalist-pink)' : 
                           isMaterial ? 'var(--md-error-main, var(--destructive))' :
                           isFluent ? 'var(--fluent-semantic-danger, var(--destructive))' : 'var(--destructive)'
              }}
              onMouseEnter={(e) => {
                if (isNeoBrutalism) {
                  e.target.style.transform = 'translate(-2px, -2px)';
                  e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                } else {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = isMaterial ? 'var(--md-elevation-3)' : '0 4px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                e.target.style.boxShadow = isNeoBrutalism ? '4px 4px 0px 0px rgba(0,0,0,1)' : 
                                         isMaterial ? 'var(--md-elevation-1)' : '0 1px 3px rgba(0,0,0,0.1)';
              }}
            >
              <Package className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'GESTIONAR STOCK' : 
               isMaterial ? 'Gestionar Stock' :
               isFluent ? 'Gestionar stock' : 'Gestionar Stock'}
            </button>
          </div>
        </header>

        {/* Métricas principales con estilo Neo-Brutalist */}
        <section>
          <h2 
            className="text-primary mb-6 text-center"
            style={getTypography('heading')}
          >
            {isNeoBrutalism ? 'MÉTRICAS PRINCIPALES' : 
             isMaterial ? 'Métricas Principales' :
             isFluent ? 'Métricas Principales' : 'Métricas Principales'}
          </h2>
          <div style={getGridLayout()}>
            {metrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div
                  key={index}
                  className="p-6 hover:cursor-pointer"
                  style={getMetricStyles()}
                  onMouseEnter={(e) => {
                    if (isNeoBrutalism) {
                      e.currentTarget.style.transform = 'translate(-3px, -3px)';
                      e.currentTarget.style.boxShadow = '9px 9px 0px 0px rgba(0,0,0,1)';
                    } else if (isMaterial) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--md-elevation-4, 0px 8px 16px rgba(0, 0, 0, 0.2))';
                    } else if (isFluent) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = 'var(--fluent-shadow-16, 0px 8px 16px rgba(0, 0, 0, 0.18))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(0px, 0px)';
                    if (isNeoBrutalism) {
                      e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                    } else if (isMaterial) {
                      e.currentTarget.style.boxShadow = 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))';
                    } else if (isFluent) {
                      e.currentTarget.style.boxShadow = 'var(--fluent-shadow-8, 0px 4px 8px rgba(0, 0, 0, 0.14))';
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div style={getIconBackground(metric.color)}>
                          <IconComponent className="w-8 h-8" style={{
                            color: isNeoBrutalism ? '#000000' : 
                                  isMaterial ? 'var(--md-on-primary, var(--primary-foreground))' :
                                  isFluent ? 'var(--fluent-text-on-accent, var(--primary-foreground))' : 
                                  'var(--primary-foreground)'
                          }} />
                        </div>
                        <div>
                          <h3 
                            className="text-foreground"
                            style={getTypography('subheading')}
                          >
                            {metric.title}
                          </h3>
                          <p 
                            className="text-muted-foreground text-sm"
                            style={{...getTypography('base'), fontSize: '0.875rem'}}
                          >
                            {metric.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div 
                          className="text-foreground"
                          style={{...getTypography('heading'), fontSize: '2.5rem'}}
                        >
                          {metric.value}
                        </div>
                        <div className="flex items-center gap-2">
                          {metric.trend === 'up' ? (
                            <TrendingUp className="w-5 h-5" style={{
                              color: isNeoBrutalism ? 'var(--brutalist-lime)' : 
                                    isMaterial ? 'var(--md-semantic-success, #4CAF50)' :
                                    isFluent ? 'var(--fluent-semantic-success, #107C10)' : '#10B981'
                            }} />
                          ) : (
                            <TrendingDown className="w-5 h-5" style={{
                              color: isNeoBrutalism ? 'var(--brutalist-pink)' : 
                                    isMaterial ? 'var(--md-error-main, #F44336)' :
                                    isFluent ? 'var(--fluent-semantic-danger, #D13438)' : '#EF4444'
                            }} />
                          )}
                          <span 
                            className="font-bold"
                            style={{
                              ...getTypography('base'),
                              color: metric.trend === 'up' ? 
                                    (isNeoBrutalism ? 'var(--brutalist-lime)' : 
                                     isMaterial ? 'var(--md-semantic-success, #4CAF50)' :
                                     isFluent ? 'var(--fluent-semantic-success, #107C10)' : '#10B981') :
                                    (isNeoBrutalism ? 'var(--brutalist-pink)' : 
                                     isMaterial ? 'var(--md-error-main, #F44336)' :
                                     isFluent ? 'var(--fluent-semantic-danger, #D13438)' : '#EF4444')
                            }}
                          >
                            {metric.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dashboard de actividad reciente con estilo brutal */}
        <section className="grid lg:grid-cols-2 gap-8">
          
          {/* Actividad reciente */}
          <div 
            className="p-6"
            style={getMetricStyles()}
          >
            <h3 
              className="text-primary mb-6"
              style={getTypography('heading')}
            >
              {isNeoBrutalism ? 'ACTIVIDAD RECIENTE' : 
               isMaterial ? 'Actividad Reciente' :
               isFluent ? 'Actividad Reciente' : 'Actividad Reciente'}
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4"
                  style={{
                    background: activity.urgent ? 
                      (isNeoBrutalism ? 'var(--brutalist-orange)' : 
                       isMaterial ? 'rgba(211, 47, 47, 0.08)' : // Error color más visible pero sutil
                       isFluent ? 'rgba(255, 185, 0, 0.12)' : 'rgba(239, 68, 68, 0.1)') : // Warning color más visible
                      (isNeoBrutalism ? 'var(--background)' :
                       isMaterial ? 'var(--md-surface-container-low, var(--muted))' :
                       isFluent ? 'var(--fluent-surface-tertiary, var(--muted))' : 'var(--muted)'),
                    border: isNeoBrutalism ? '2px solid var(--border)' : 
                           isMaterial ? '1px solid var(--md-outline-variant, rgba(0,0,0,0.06))' : 
                           isFluent ? '1px solid var(--fluent-border-neutral, var(--border))' : '1px solid var(--border)',
                    borderRadius: isNeoBrutalism ? '0px' : 
                                 isMaterial ? 'var(--md-corner-small, 4px)' :
                                 isFluent ? 'var(--fluent-corner-radius-small, 2px)' : '4px',
                    color: activity.urgent ? 
                          (isNeoBrutalism ? '#000000' : 
                           isMaterial ? 'var(--md-error-main, var(--destructive))' : // Color del texto, no background
                           isFluent ? 'var(--fluent-semantic-warning, var(--warning))' : 'var(--warning)') :
                          'var(--foreground)'
                  }}
                >
                  <div 
                    style={{
                      ...getIconBackground(isNeoBrutalism ? 'var(--brutalist-lime)' : 
                                         isMaterial ? 'var(--md-primary-main, var(--primary))' :
                                         isFluent ? 'var(--fluent-brand-primary, var(--primary))' : 'var(--primary)'),
                      width: isNeoBrutalism ? '40px' : isMaterial ? '40px' : '36px',
                      height: isNeoBrutalism ? '40px' : isMaterial ? '40px' : '36px'
                    }}
                  >
                    <Activity className="w-5 h-5" style={{ 
                      color: isNeoBrutalism ? '#000000' : 
                            isMaterial ? 'var(--md-on-primary, var(--primary-foreground))' :
                            isFluent ? 'var(--fluent-text-on-accent, var(--primary-foreground))' : 
                            'var(--primary-foreground)'
                    }} />
                  </div>
                  <div className="flex-1">
                    <p style={{
                      ...getTypography('base'),
                      color: activity.urgent ? 
                            (isNeoBrutalism ? '#000000' : 
                             isMaterial ? 'var(--md-on-surface, var(--foreground))' :
                             isFluent ? 'var(--fluent-text-primary, var(--foreground))' : 'var(--foreground)') :
                            'var(--foreground)'
                    }}>
                      {activity.message}
                    </p>
                    <p style={{
                      ...getTypography('base'),
                      fontSize: '0.75rem',
                      opacity: activity.urgent ? 0.9 : 0.75,
                      color: activity.urgent ? 
                            (isNeoBrutalism ? '#000000' : 
                             isMaterial ? 'var(--md-on-surface, var(--foreground))' :
                             isFluent ? 'var(--fluent-text-primary, var(--foreground))' : 'var(--foreground)') :
                            'var(--muted-foreground)'
                    }}>
                      {activity.time}
                    </p>
                  </div>
                  {activity.urgent && (
                    <AlertTriangle className="w-6 h-6" style={{
                      color: isNeoBrutalism ? 'var(--brutalist-pink)' : 
                            isMaterial ? 'var(--md-error-main, #F44336)' :
                            isFluent ? 'var(--fluent-semantic-danger, #D13438)' : '#EF4444'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stock crítico */}
          <div 
            className="p-6"
            style={getMetricStyles()}
          >
            <h3 
              className="text-primary mb-6"
              style={getTypography('heading')}
            >
              {isNeoBrutalism ? 'STOCK CRÍTICO' : 
               isMaterial ? 'Stock Crítico' :
               isFluent ? 'Stock Crítico' : 'Stock Crítico'}
            </h3>
            <div className="space-y-4">
              {lowStockProducts.map((product, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4"
                  style={{
                    background: isNeoBrutalism ? 'var(--background)' :
                               isMaterial ? 'var(--md-surface-variant, var(--muted))' :
                               isFluent ? 'var(--fluent-surface-secondary, var(--muted))' : 'var(--muted)',
                    border: isNeoBrutalism ? '2px solid var(--border)' : 
                           isMaterial ? 'none' : 
                           isFluent ? '1px solid var(--fluent-border-neutral, var(--border))' : '1px solid var(--border)',
                    borderRadius: isNeoBrutalism ? '0px' : 
                                 isMaterial ? 'var(--md-corner-small, 4px)' :
                                 isFluent ? 'var(--fluent-corner-radius-small, 2px)' : '4px'
                  }}
                >
                  <div>
                    <p style={getTypography('base')}>
                      {product.name}
                    </p>
                    <p style={{
                      ...getTypography('base'),
                      fontSize: '0.875rem',
                      color: 'var(--muted-foreground)'
                    }}>
                      Actual: {product.current} | Mínimo: {product.minimum}
                    </p>
                  </div>
                  <div 
                    className="px-3 py-1 text-sm font-bold"
                    style={getBadgeStyles(product.alert)}
                  >
                    {getAlertText(product.alert)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gráficos con estilo Neo-Brutalist */}
        <section className="grid lg:grid-cols-2 gap-8">
          
          {/* Gráfico de ventas */}
          <div 
            className="p-6"
            style={getMetricStyles()}
          >
            <h3 
              className="text-primary mb-6"
              style={getTypography('heading')}
            >
              {isNeoBrutalism ? 'VENTAS MENSUALES' : 
               isMaterial ? 'Ventas Mensuales' :
               isFluent ? 'Ventas Mensuales' : 'Ventas Mensuales'}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid 
                    strokeDasharray={isNeoBrutalism ? "3 3" : isMaterial ? "2 2" : "1 1"} 
                    stroke={isNeoBrutalism ? "var(--border)" : 
                           isMaterial ? "var(--md-outline, var(--border))" :
                           isFluent ? "var(--fluent-border-neutral, var(--border))" : "var(--border)"} 
                  />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--foreground)"
                    style={{
                      ...getTypography('base'), 
                      fontSize: '12px',
                      fontWeight: isNeoBrutalism ? '600' : isMaterial ? '400' : '400'
                    }}
                  />
                  <YAxis 
                    stroke="var(--foreground)"
                    style={{
                      ...getTypography('base'), 
                      fontSize: '12px',
                      fontWeight: isNeoBrutalism ? '600' : isMaterial ? '400' : '400'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill={isNeoBrutalism ? 'var(--brutalist-lime)' : 
                         isMaterial ? 'var(--md-primary-main, var(--primary))' :
                         isFluent ? 'var(--fluent-brand-primary, var(--primary))' : 'var(--primary)'}
                    stroke={isNeoBrutalism ? 'var(--border)' : 'none'}
                    strokeWidth={isNeoBrutalism ? 2 : 0}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de categorías */}
          <div 
            className="p-6"
            style={getMetricStyles()}
          >
            <h3 
              className="text-primary mb-6"
              style={getTypography('heading')}
            >
              {isNeoBrutalism ? 'CATEGORÍAS DE PRODUCTOS' : 
               isMaterial ? 'Categorías de Productos' :
               isFluent ? 'Categorías de Productos' : 'Categorías de Productos'}
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    stroke={isNeoBrutalism ? "var(--border)" : "none"}
                    strokeWidth={isNeoBrutalism ? 2 : 0}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4"
                    style={{
                      backgroundColor: item.color,
                      border: isNeoBrutalism ? '1px solid var(--border)' : 
                             isMaterial ? 'none' :
                             isFluent ? '1px solid var(--fluent-border-neutral, var(--border))' : 'none',
                      borderRadius: isNeoBrutalism ? '0px' : 
                                   isMaterial ? '50%' :
                                   isFluent ? 'var(--fluent-corner-radius-small, 2px)' : '2px'
                    }}
                  />
                  <span 
                    className="text-sm"
                    style={getTypography('base')}
                  >
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer de acciones rápidas */}
        <footer className="text-center py-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={{
                ...getButtonStyles(), 
                background: isNeoBrutalism ? 'var(--brutalist-purple)' : 
                           isMaterial ? 'var(--md-secondary-main, var(--secondary))' :
                           isFluent ? 'var(--fluent-brand-secondary, var(--secondary))' : 'var(--secondary)'
              }}
              onMouseEnter={(e) => {
                if (isNeoBrutalism) {
                  e.target.style.transform = 'translate(-2px, -2px)';
                  e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                } else if (isMaterial) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = 'var(--md-elevation-4, 0px 8px 16px rgba(0, 0, 0, 0.2))';
                } else if (isFluent) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = 'var(--fluent-shadow-16, 0px 8px 16px rgba(0, 0, 0, 0.18))';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                if (isNeoBrutalism) {
                  e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
                } else if (isMaterial) {
                  e.target.style.boxShadow = 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))';
                } else if (isFluent) {
                  e.target.style.boxShadow = 'var(--fluent-shadow-4, 0px 2px 4px rgba(0, 0, 0, 0.14))';
                }
              }}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'VER REPORTES' : 'Ver Reportes'}
            </button>
            <button
              style={{
                ...getButtonStyles(), 
                background: isNeoBrutalism ? 'var(--brutalist-green)' : 
                           isMaterial ? 'var(--md-primary-main, var(--success))' :
                           isFluent ? 'var(--fluent-semantic-success, var(--success))' : 'var(--success)'
              }}
              onMouseEnter={(e) => {
                if (isNeoBrutalism) {
                  e.target.style.transform = 'translate(-2px, -2px)';
                  e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                } else if (isMaterial) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = 'var(--md-elevation-4, 0px 8px 16px rgba(0, 0, 0, 0.2))';
                } else if (isFluent) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = 'var(--fluent-shadow-16, 0px 8px 16px rgba(0, 0, 0, 0.18))';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                if (isNeoBrutalism) {
                  e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
                } else if (isMaterial) {
                  e.target.style.boxShadow = 'var(--md-elevation-2, 0px 3px 6px rgba(0, 0, 0, 0.15))';
                } else if (isFluent) {
                  e.target.style.boxShadow = 'var(--fluent-shadow-4, 0px 2px 4px rgba(0, 0, 0, 0.14))';
                }
              }}
            >
              <Target className="w-5 h-5 mr-2" />
              {isNeoBrutalism ? 'CONFIGURAR METAS' : 'Configurar Metas'}
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Dashboard;
