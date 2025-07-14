/**
 * Página Dashboard del sistema ERP - Multi-tema
 * Soporte para Neo-Brutalism, Material Design y Fluent Design
 * Muestra métricas principales, gráficos y resumen del negocio
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
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MetricCard, BrutalistBadge } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  // Datos de ejemplo para los gráficos
  const salesData = [
    { name: 'Ene', value: 12000 },
    { name: 'Feb', value: 15000 },
    { name: 'Mar', value: 18000 },
    { name: 'Abr', value: 22000 },
    { name: 'May', value: 19000 },
    { name: 'Jun', value: 25000 },
  ];

  const categoryData = [
    { name: 'Electrónicos', value: 35, color: '#84cc16' },
    { name: 'Ropa', value: 25, color: '#3b82f6' },
    { name: 'Hogar', value: 20, color: '#ec4899' },
    { name: 'Deportes', value: 15, color: '#f97316' },
    { name: 'Otros', value: 5, color: '#8b5cf6' },
  ];

  const lowStockProducts = [
    { name: 'iPhone 15', current: 3, minimum: 10 },
    { name: 'Laptop Dell', current: 5, minimum: 15 },
    { name: 'Auriculares Sony', current: 2, minimum: 20 },
  ];

  // Helper functions para generar clases según el tema activo
  const getTitleClass = (size = 'title') => {
    if (isNeoBrutalism) {
      switch(size) {
        case 'display': return 'font-black uppercase tracking-wide text-4xl';
        case 'large-title': return 'font-black uppercase tracking-wide text-3xl';
        case 'title': return 'font-black uppercase tracking-wide text-xl';
        case 'subtitle': return 'font-black uppercase tracking-wide text-lg';
        case 'body-large': return 'font-bold uppercase tracking-wide text-base';
        case 'body': return 'font-bold uppercase tracking-wide text-sm';
        case 'caption': return 'font-bold uppercase tracking-wide text-xs';
        default: return 'font-black uppercase tracking-wide';
      }
    }
    if (isFluent) {
      switch(size) {
        case 'display': return 'fluent-display';
        case 'large-title': return 'fluent-large-title';
        case 'title': return 'fluent-title';
        case 'subtitle': return 'fluent-subtitle';
        case 'body-large': return 'fluent-body-large';
        case 'body': return 'fluent-body';
        case 'caption': return 'fluent-caption';
        case 'caption-strong': return 'fluent-caption-strong';
        default: return 'fluent-title';
      }
    }
    if (isMaterial) {
      switch(size) {
        case 'display': return 'material-display';
        case 'large-title': return 'material-headline-large';
        case 'title': return 'material-headline-medium';
        case 'subtitle': return 'material-headline-small';
        case 'body-large': return 'material-body-large';
        case 'body': return 'material-body-medium';
        case 'caption': return 'material-body-small';
        default: return 'material-headline-medium';
      }
    }
    return 'font-bold';
  };

  const getCardClass = () => {
    if (isNeoBrutalism) return 'border-4 border-foreground shadow-neo-brutal';
    if (isFluent) return 'fluent-elevation-2 fluent-radius-medium fluent-motion-standard';
    if (isMaterial) return 'material-card-elevated';
    return 'border border-border rounded-lg shadow-lg';
  };

  const getButtonClass = () => {
    if (isFluent) return 'fluent-elevation-4 fluent-radius-medium';
    if (isMaterial) return 'material-button-elevated';
    return '';
  };

  const getIconBackgroundClass = (colorType) => {
    if (isNeoBrutalism) {
      const colorMap = {
        success: 'bg-chart-success border-2 border-foreground shadow-neo-brutal',
        primary: 'bg-chart-primary border-2 border-foreground shadow-neo-brutal',
        warning: 'bg-chart-warning border-2 border-foreground shadow-neo-brutal',
        accent: 'bg-chart-accent border-2 border-foreground shadow-neo-brutal'
      };
      return colorMap[colorType] || colorMap.primary;
    }
    if (isFluent) {
      return 'fluent-elevation-2 fluent-radius-small';
    }
    if (isMaterial) {
      return 'material-elevation-2 rounded-lg';
    }
    const colorMap = {
      success: 'bg-chart-success/10 border border-chart-success rounded-lg',
      primary: 'bg-chart-primary/10 border border-chart-primary rounded-lg',
      warning: 'bg-chart-warning/10 border border-chart-warning rounded-lg',
      accent: 'bg-chart-accent/10 border border-chart-accent rounded-lg'
    };
    return colorMap[colorType] || colorMap.primary;
  };

  const getIconColor = (colorType) => {
    if (isNeoBrutalism) {
      return colorType === 'primary' ? 'text-background' : 'text-foreground';
    }
    if (isFluent) {
      return colorType === 'warning' ? 'text-black' : 'text-white';
    }
    if (isMaterial) {
      return 'text-white';
    }
    const colorMap = {
      success: 'text-chart-success',
      primary: 'text-chart-primary',
      warning: 'text-chart-warning',
      accent: 'text-chart-accent'
    };
    return colorMap[colorType] || colorMap.primary;
  };

  const getFluentIconBackground = (colorType) => {
    const colorMap = {
      success: 'var(--fluent-semantic-success)',
      primary: 'var(--fluent-brand-primary)',
      warning: 'var(--fluent-semantic-warning)',
      accent: 'var(--fluent-brand-secondary)'
    };
    return { 
      backgroundColor: colorMap[colorType] || colorMap.primary,
      color: colorType === 'warning' ? 'var(--fluent-neutral-black)' : 'var(--fluent-neutral-white)',
      borderRadius: 'var(--fluent-corner-radius-small)',
      boxShadow: 'var(--fluent-shadow-2)'
    };
  };

  const getMaterialIconBackground = (colorType) => {
    const colorMap = {
      success: 'var(--material-success-primary)',
      primary: 'var(--material-primary)',
      warning: 'var(--material-warning-primary)',
      accent: 'var(--material-secondary)'
    };
    return { 
      backgroundColor: colorMap[colorType] || colorMap.primary,
      color: 'white',
      borderRadius: 'var(--material-radius-small)',
      boxShadow: 'var(--material-elevation-2)'
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-foreground ${getTitleClass('large-title')}`}>
            Dashboard
          </h1>
          <p className={`mt-2 text-muted-foreground ${getTitleClass('body-large')}`}>
            Resumen general de tu negocio
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            variant="red" 
            size="lg" 
            className={getButtonClass()}
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            Ver Reportes Completos
            {isNeoBrutalism && (
              <BrutalistBadge color="yellow" className="ml-2">
                10
              </BrutalistBadge>
            )}
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="erp-metrics-grid grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ventas Totales */}
        <MetricCard color="white" className={`relative ${getCardClass()}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="metric-content flex-1 min-w-0">
              <p className={`text-xs text-muted-foreground ${getTitleClass('caption-strong')} mb-1`}>
                Ventas Totales
              </p>
              <p className={`text-2xl font-bold text-foreground ${getTitleClass('title')} mb-1`}>
                $125,430
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-chart-success flex-shrink-0" />
                <span className={`text-xs text-chart-success ${getTitleClass('caption')}`}>
                  +12.5% este mes
                </span>
              </div>
            </div>
            <div 
              className={`metric-icon flex-shrink-0 w-10 h-10 flex items-center justify-center ${getIconBackgroundClass('success')}`}
              style={isFluent ? getFluentIconBackground('success') : isMaterial ? getMaterialIconBackground('success') : {}}
            >
              <DollarSign className={`h-5 w-5 ${getIconColor('success')}`} />
            </div>
          </div>
        </MetricCard>

        {/* Clientes */}
        <MetricCard color="white" className={`relative ${getCardClass()}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="metric-content flex-1 min-w-0">
              <p className={`text-xs text-muted-foreground ${getTitleClass('caption-strong')} mb-1`}>
                Clientes
              </p>
              <p className={`text-2xl font-bold text-foreground ${getTitleClass('title')} mb-1`}>
                1,247
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-chart-success flex-shrink-0" />
                <span className={`text-xs text-chart-success ${getTitleClass('caption')}`}>
                  +8.2% este mes
                </span>
              </div>
            </div>
            <div 
              className={`metric-icon flex-shrink-0 w-10 h-10 flex items-center justify-center ${getIconBackgroundClass('primary')}`}
              style={isFluent ? getFluentIconBackground('primary') : isMaterial ? getMaterialIconBackground('primary') : {}}
            >
              <Users className={`h-5 w-5 ${getIconColor('primary')}`} />
            </div>
          </div>
        </MetricCard>

        {/* Productos */}
        <MetricCard color="white" className={`relative ${getCardClass()}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="metric-content flex-1 min-w-0">
              <p className={`text-xs text-muted-foreground ${getTitleClass('caption-strong')} mb-1`}>
                Productos
              </p>
              <p className={`text-2xl font-bold text-foreground ${getTitleClass('title')} mb-1`}>
                856
              </p>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-chart-danger flex-shrink-0" />
                <span className={`text-xs text-chart-danger ${getTitleClass('caption')}`}>
                  -2.1% este mes
                </span>
              </div>
            </div>
            <div 
              className={`metric-icon flex-shrink-0 w-10 h-10 flex items-center justify-center ${getIconBackgroundClass('warning')}`}
              style={isFluent ? getFluentIconBackground('warning') : isMaterial ? getMaterialIconBackground('warning') : {}}
            >
              <Package className={`h-5 w-5 ${getIconColor('warning')}`} />
            </div>
          </div>
        </MetricCard>

        {/* Pedidos */}
        <MetricCard color="white" className={`relative ${getCardClass()}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="metric-content flex-1 min-w-0">
              <p className={`text-xs text-muted-foreground ${getTitleClass('caption-strong')} mb-1`}>
                Pedidos
              </p>
              <p className={`text-2xl font-bold text-foreground ${getTitleClass('title')} mb-1`}>
                342
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-chart-success flex-shrink-0" />
                <span className={`text-xs text-chart-success ${getTitleClass('caption')}`}>
                  +15.3% este mes
                </span>
              </div>
            </div>
            <div 
              className={`metric-icon flex-shrink-0 w-10 h-10 flex items-center justify-center ${getIconBackgroundClass('accent')}`}
              style={isFluent ? getFluentIconBackground('accent') : isMaterial ? getMaterialIconBackground('accent') : {}}
            >
              <ShoppingCart className={`h-5 w-5 ${getIconColor('accent')}`} />
            </div>
          </div>
        </MetricCard>
      </div>
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="red" size="lg">
            <BarChart3 className="mr-2 h-5 w-5" />
            Ver Reportes Completos
            {isNeoBrutalism && (
              <BrutalistBadge color="yellow" className="ml-2">
                10
              </BrutalistBadge>
            )}
          </Button>
        </div>
      </div>

      {/* Métricas principales - Layout compacto y responsivo */}
      <div className="erp-metrics-grid grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {/* Ventas Totales */}
        <MetricCard color="white" className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="metric-content flex-1">
              <p className={`text-xs text-muted-foreground ${
                isNeoBrutalism 
                  ? 'font-black uppercase tracking-wide'
                  : 'font-medium'
              }`}>
                Ventas Totales
              </p>
              <p className={`text-lg font-black text-foreground ${
                isNeoBrutalism ? 'font-black' : 'font-bold'
              }`}>$125,430</p>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-chart-success mr-1" />
                <span className={`text-xs text-chart-success ${
                  isNeoBrutalism 
                    ? 'font-bold uppercase'
                    : 'font-medium'
                }`}>
                  12.5%
                </span>
              </div>
            </div>
            <div className={`metric-icon flex-shrink-0 w-8 h-8 flex items-center justify-center ${
              isNeoBrutalism 
                ? 'bg-chart-success border-2 border-foreground shadow-neo-brutal'
                : 'bg-chart-success/10 border border-chart-success rounded-lg'
            }`}>
              <DollarSign className={`h-4 w-4 ${
                isNeoBrutalism ? 'text-foreground' : 'text-chart-success'
              }`} />
            </div>
          </div>
        </MetricCard>

        {/* Clientes */}
        <MetricCard color="white" className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="metric-content flex-1">
              <p className={`text-xs text-muted-foreground ${
                isNeoBrutalism 
                  ? 'font-black uppercase tracking-wide'
                  : 'font-medium'
              }`}>
                Clientes
              </p>
              <p className={`text-lg font-black text-foreground ${
                isNeoBrutalism ? 'font-black' : 'font-bold'
              }`}>1,247</p>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-chart-success mr-1" />
                <span className={`text-xs text-chart-success ${
                  isNeoBrutalism 
                    ? 'font-bold uppercase'
                    : 'font-medium'
                }`}>
                  8.2%
                </span>
              </div>
            </div>
            <div className={`metric-icon flex-shrink-0 w-8 h-8 flex items-center justify-center ${
              isNeoBrutalism 
                ? 'bg-chart-primary border-2 border-foreground shadow-neo-brutal'
                : 'bg-chart-primary/10 border border-chart-primary rounded-lg'
            }`}>
              <Users className={`h-4 w-4 ${
                isNeoBrutalism ? 'text-background' : 'text-chart-primary'
              }`} />
            </div>
          </div>
        </MetricCard>

        {/* Productos */}
        <MetricCard color="white" className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="metric-content flex-1">
              <p className={`text-xs text-muted-foreground ${
                isNeoBrutalism 
                  ? 'font-black uppercase tracking-wide'
                  : 'font-medium'
              }`}>
                Productos
              </p>
              <p className={`text-lg font-black text-foreground ${
                isNeoBrutalism ? 'font-black' : 'font-bold'
              }`}>856</p>
              <div className="flex items-center">
                <TrendingDown className="h-3 w-3 text-chart-danger mr-1" />
                <span className={`text-xs text-chart-danger ${
                  isNeoBrutalism 
                    ? 'font-bold uppercase'
                    : 'font-medium'
                }`}>
                  2.1%
                </span>
              </div>
            </div>
            <div className={`metric-icon flex-shrink-0 w-8 h-8 flex items-center justify-center ${
              isNeoBrutalism 
                ? 'bg-chart-warning border-2 border-foreground shadow-neo-brutal'
                : 'bg-chart-warning/10 border border-chart-warning rounded-lg'
            }`}>
              <Package className={`h-4 w-4 ${
                isNeoBrutalism ? 'text-background' : 'text-chart-warning'
              }`} />
            </div>
          </div>
        </MetricCard>

        {/* Pedidos */}
        <MetricCard color="white" className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="metric-content flex-1">
              <p className={`text-xs text-muted-foreground ${
                isNeoBrutalism 
                  ? 'font-black uppercase tracking-wide'
                  : 'font-medium'
              }`}>
                Pedidos
              </p>
              <p className={`text-lg font-black text-foreground ${
                isNeoBrutalism ? 'font-black' : 'font-bold'
              }`}>342</p>
              <div className="flex items-center">
                <TrendingUp className="h-3 w-3 text-chart-success mr-1" />
                <span className={`text-xs text-chart-success ${
                  isNeoBrutalism 
                    ? 'font-bold uppercase'
                    : 'font-medium'
                }`}>
                  15.3%
                </span>
              </div>
            </div>
            <div className={`metric-icon flex-shrink-0 w-8 h-8 flex items-center justify-center ${
              isNeoBrutalism 
                ? 'bg-chart-accent border-2 border-foreground shadow-neo-brutal'
                : 'bg-chart-accent/10 border border-chart-accent rounded-lg'
            }`}>
              <ShoppingCart className={`h-4 w-4 ${
                isNeoBrutalism ? 'text-background' : 'text-chart-accent'
              }`} />
            </div>
          </div>
        </MetricCard>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Ventas Mensuales */}
        <div className={`bg-card p-6 ${
          isNeoBrutalism 
            ? 'border-4 border-foreground shadow-neo-brutal'
            : 'border border-border rounded-lg shadow-lg'
        }`}>
          <h3 className={`text-xl text-foreground mb-2 ${
            isNeoBrutalism 
              ? 'font-black uppercase tracking-wide'
              : 'font-bold'
          }`}>
            Ventas Mensuales
          </h3>
          <p className={`text-sm text-muted-foreground mb-6 ${
            isNeoBrutalism 
              ? 'font-bold uppercase tracking-wide'
              : 'font-medium'
          }`}>
            Evolución de ventas en los últimos 6 meses
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid 
                  strokeWidth={isNeoBrutalism ? 2 : 1} 
                  stroke="hsl(var(--border))" 
                />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: isNeoBrutalism ? 2 : 1 }}
                  tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: isNeoBrutalism ? 2 : 1 }}
                  tick={{ 
                    fontWeight: isNeoBrutalism ? 'bold' : 'normal', 
                    fontSize: 12,
                    fill: 'hsl(var(--foreground))'
                  }}
                />
                <YAxis 
                  axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: isNeoBrutalism ? 2 : 1 }}
                  tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: isNeoBrutalism ? 2 : 1 }}
                  tick={{ 
                    fontWeight: isNeoBrutalism ? 'bold' : 'normal', 
                    fontSize: 12,
                    fill: 'hsl(var(--foreground))'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--chart-accent))" 
                  stroke={isNeoBrutalism ? "hsl(var(--foreground))" : "none"}
                  strokeWidth={isNeoBrutalism ? 2 : 0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Ventas por Categoría */}
        <div className={`bg-card p-6 ${
          isNeoBrutalism 
            ? 'border-4 border-foreground shadow-neo-brutal'
            : 'border border-border rounded-lg shadow-lg'
        }`}>
          <h3 className={`text-xl text-foreground mb-2 ${
            isNeoBrutalism 
              ? 'font-black uppercase tracking-wide'
              : 'font-bold'
          }`}>
            Ventas por Categoría
          </h3>
          <p className={`text-sm text-muted-foreground mb-6 ${
            isNeoBrutalism 
              ? 'font-bold uppercase tracking-wide'
              : 'font-medium'
          }`}>
            Distribución de ventas por categoría de producto
          </p>
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
                  stroke={isNeoBrutalism ? "hsl(var(--foreground))" : "none"}
                  strokeWidth={isNeoBrutalism ? 2 : 0}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secciones adicionales */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Productos con Stock Bajo */}
        <div className={`bg-card p-6 ${
          isNeoBrutalism 
            ? 'border-4 border-foreground shadow-neo-brutal'
            : 'border border-border rounded-lg shadow-lg'
        }`}>
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-chart-warning mr-2" />
            <h3 className={`text-xl text-foreground ${
              isNeoBrutalism 
                ? 'font-black uppercase tracking-wide'
                : 'font-bold'
            }`}>
              Productos con Stock Bajo
            </h3>
          </div>
          <p className={`text-sm text-muted-foreground mb-6 ${
            isNeoBrutalism 
              ? 'font-bold uppercase tracking-wide'
              : 'font-medium'
          }`}>
            Productos que necesitan reposición urgente
          </p>
          <div className="space-y-4">
            {lowStockProducts.map((product, index) => (
              <div key={index} className={`flex items-center justify-between p-4 bg-muted ${
                isNeoBrutalism 
                  ? 'border-2 border-foreground'
                  : 'border border-border rounded-lg'
              }`}>
                <div>
                  <p className={`text-foreground ${
                    isNeoBrutalism 
                      ? 'font-black uppercase'
                      : 'font-semibold'
                  }`}>{product.name}</p>
                  <p className={`text-sm text-muted-foreground ${
                    isNeoBrutalism 
                      ? 'font-bold uppercase'
                      : 'font-medium'
                  }`}>
                    Stock actual: {product.current} | Mínimo: {product.minimum}
                  </p>
                </div>
                <Button variant="orange" size="sm">
                  Reponer
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className={`bg-card p-6 ${
          isNeoBrutalism 
            ? 'border-4 border-foreground shadow-neo-brutal'
            : 'border border-border rounded-lg shadow-lg'
        }`}>
          <h3 className={`text-xl text-foreground mb-2 ${
            isNeoBrutalism 
              ? 'font-black uppercase tracking-wide'
              : 'font-bold'
          }`}>
            Acciones Rápidas
          </h3>
          <p className={`text-sm text-muted-foreground mb-6 ${
            isNeoBrutalism 
              ? 'font-bold uppercase tracking-wide'
              : 'font-medium'
          }`}>
            Accesos directos a funciones principales
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="lime" className="h-16 flex-col">
              <Plus className="h-5 w-5 mb-1" />
              Nuevo Producto
            </Button>
            <Button variant="blue" className="h-16 flex-col">
              <Plus className="h-5 w-5 mb-1" />
              Nuevo Cliente
            </Button>
            <Button variant="purple" className="h-16 flex-col">
              <Plus className="h-5 w-5 mb-1" />
              Nuevo Pedido
            </Button>
            <Button variant="pink" className="h-16 flex-col">
              <BarChart3 className="h-5 w-5 mb-1" />
              Ver Reportes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

