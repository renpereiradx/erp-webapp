/**
 * Página Dashboard del sistema ERP - Optimizada para Neo-Brutalism
 * Sistema de diseño brutal con énfasis en tipografía bold, colores vibrantes y bordes gruesos
 * Incluye soporte multi-tema mejorado con helper functions específicas
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

const Dashboard = () => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

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
    cursor: 'pointer'
  });

  // Datos de ejemplo para los gráficos con colores Neo-Brutalist
  const salesData = [
    { name: 'Ene', value: 12000 },
    { name: 'Feb', value: 15000 },
    { name: 'Mar', value: 18000 },
    { name: 'Abr', value: 22000 },
    { name: 'May', value: 19000 },
    { name: 'Jun', value: 25000 },
  ];

  const categoryData = [
    { name: 'Electrónicos', value: 35, color: 'var(--brutalist-lime)' },
    { name: 'Ropa', value: 25, color: 'var(--brutalist-blue)' },
    { name: 'Hogar', value: 20, color: 'var(--brutalist-pink)' },
    { name: 'Deportes', value: 15, color: 'var(--brutalist-orange)' },
    { name: 'Otros', value: 5, color: 'var(--brutalist-purple)' },
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

  // Métricas con estilo Neo-Brutalist específico
  const metrics = [
    {
      title: "VENTAS TOTALES",
      value: "$125,430",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "--brutalist-lime",
      description: "Comparado con el mes anterior"
    },
    {
      title: "CLIENTES ACTIVOS", 
      value: "2,847",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "--brutalist-blue",
      description: "Usuarios únicos este mes"
    },
    {
      title: "PRODUCTOS",
      value: "1,253",
      change: "-2.1%",
      trend: "down", 
      icon: Package,
      color: "--brutalist-pink",
      description: "Items en inventario"
    },
    {
      title: "PEDIDOS HOY",
      value: "147",
      change: "+25.8%",
      trend: "up",
      icon: ShoppingCart,
      color: "--brutalist-orange",
      description: "Órdenes procesadas hoy"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Neo-Brutalist */}
        <header className="text-center py-8">
          <h1 
            className="text-primary mb-4"
            style={getBrutalistTypography('title')}
          >
            DASHBOARD ERP
          </h1>
          <p 
            className="text-muted-foreground max-w-2xl mx-auto"
            style={getBrutalistTypography('base')}
          >
            SISTEMA DE GESTIÓN EMPRESARIAL CON DISEÑO NEO-BRUTALIST
          </p>
          
          {/* Botones de acción rápida */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button
              style={getBrutalistButtonStyles()}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translate(-2px, -2px)';
                e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              NUEVA VENTA
            </button>
            <button
              style={{...getBrutalistButtonStyles(), background: 'var(--brutalist-blue)'}}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translate(-2px, -2px)';
                e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
              }}
            >
              <Users className="w-5 h-5 mr-2" />
              AÑADIR CLIENTE
            </button>
            <button
              style={{...getBrutalistButtonStyles(), background: 'var(--brutalist-pink)'}}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translate(-2px, -2px)';
                e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
              }}
            >
              <Package className="w-5 h-5 mr-2" />
              GESTIONAR STOCK
            </button>
          </div>
        </header>

        {/* Métricas principales con estilo Neo-Brutalist */}
        <section>
          <h2 
            className="text-primary mb-6 text-center"
            style={getBrutalistTypography('heading')}
          >
            MÉTRICAS PRINCIPALES
          </h2>
          <div style={getBrutalistGridLayout()}>
            {metrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div
                  key={index}
                  className="p-6 hover:cursor-pointer"
                  style={getBrutalistMetricStyles()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-3px, -3px)';
                    e.currentTarget.style.boxShadow = '9px 9px 0px 0px rgba(0,0,0,1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(0px, 0px)';
                    e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div style={getBrutalistIconBackground(metric.color)}>
                          <IconComponent className="w-8 h-8 text-black" />
                        </div>
                        <div>
                          <h3 
                            className="text-foreground"
                            style={getBrutalistTypography('subheading')}
                          >
                            {metric.title}
                          </h3>
                          <p 
                            className="text-muted-foreground text-sm"
                            style={{...getBrutalistTypography('base'), fontSize: '0.875rem'}}
                          >
                            {metric.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div 
                          className="text-foreground"
                          style={{...getBrutalistTypography('heading'), fontSize: '2.5rem'}}
                        >
                          {metric.value}
                        </div>
                        <div className="flex items-center gap-2">
                          {metric.trend === 'up' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                          <span 
                            className={`font-bold ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
                            style={getBrutalistTypography('base')}
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
            style={getBrutalistMetricStyles()}
          >
            <h3 
              className="text-primary mb-6"
              style={getBrutalistTypography('heading')}
            >
              ACTIVIDAD RECIENTE
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4"
                  style={{
                    background: activity.urgent ? 'var(--brutalist-orange)' : 'var(--background)',
                    border: '2px solid var(--border)',
                    borderRadius: '0px',
                    color: activity.urgent ? '#000000' : 'var(--foreground)'
                  }}
                >
                  <div 
                    style={{
                      ...getBrutalistIconBackground('--brutalist-lime'),
                      width: '40px',
                      height: '40px'
                    }}
                  >
                    <Activity className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p style={getBrutalistTypography('base')}>
                      {activity.message}
                    </p>
                    <p className="text-sm opacity-75">
                      {activity.time}
                    </p>
                  </div>
                  {activity.urgent && (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stock crítico */}
          <div 
            className="p-6"
            style={getBrutalistMetricStyles()}
          >
            <h3 
              className="text-primary mb-6"
              style={getBrutalistTypography('heading')}
            >
              STOCK CRÍTICO
            </h3>
            <div className="space-y-4">
              {lowStockProducts.map((product, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4"
                  style={{
                    background: 'var(--background)',
                    border: '2px solid var(--border)',
                    borderRadius: '0px'
                  }}
                >
                  <div>
                    <p style={getBrutalistTypography('base')}>
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Actual: {product.current} | Mínimo: {product.minimum}
                    </p>
                  </div>
                  <div 
                    className="px-3 py-1 text-sm font-bold"
                    style={{
                      background: product.alert === 'critical' ? 'var(--brutalist-pink)' : 
                                product.alert === 'high' ? 'var(--brutalist-orange)' : 
                                'var(--brutalist-lime)',
                      color: '#000000',
                      border: '2px solid var(--border)',
                      textTransform: 'uppercase'
                    }}
                  >
                    {product.alert}
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
            style={getBrutalistMetricStyles()}
          >
            <h3 
              className="text-primary mb-6"
              style={getBrutalistTypography('heading')}
            >
              VENTAS MENSUALES
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--foreground)"
                    style={{...getBrutalistTypography('base'), fontSize: '12px'}}
                  />
                  <YAxis 
                    stroke="var(--foreground)"
                    style={{...getBrutalistTypography('base'), fontSize: '12px'}}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="var(--brutalist-lime)"
                    stroke="var(--border)"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de categorías */}
          <div 
            className="p-6"
            style={getBrutalistMetricStyles()}
          >
            <h3 
              className="text-primary mb-6"
              style={getBrutalistTypography('heading')}
            >
              CATEGORÍAS DE PRODUCTOS
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
                    stroke="var(--border)"
                    strokeWidth={2}
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
                      border: '1px solid var(--border)'
                    }}
                  />
                  <span 
                    className="text-sm"
                    style={getBrutalistTypography('base')}
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
              style={{...getBrutalistButtonStyles(), background: 'var(--brutalist-purple)'}}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translate(-2px, -2px)';
                e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
              }}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              VER REPORTES
            </button>
            <button
              style={{...getBrutalistButtonStyles(), background: 'var(--brutalist-green)'}}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translate(-2px, -2px)';
                e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translate(0px, 0px)';
                e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
              }}
            >
              <Target className="w-5 h-5 mr-2" />
              CONFIGURAR METAS
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Dashboard;
