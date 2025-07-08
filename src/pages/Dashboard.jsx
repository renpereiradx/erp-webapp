/**
 * Página Dashboard del sistema ERP con estilo Neo-Brutalista
 * Muestra métricas principales, gráficos y resumen del negocio
 */

import React from 'react';
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-wide text-black">
            Dashboard
          </h1>
          <p className="mt-2 text-lg font-bold text-gray-600 uppercase tracking-wide">
            Resumen general de tu negocio
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="red" size="lg">
            <BarChart3 className="mr-2 h-5 w-5" />
            Ver Reportes Completos
            <BrutalistBadge color="yellow" className="ml-2">
              10
            </BrutalistBadge>
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ventas Totales */}
        <MetricCard color="white" className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-gray-600">
                Ventas Totales
              </p>
              <p className="text-3xl font-black text-black">$125,430</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-brutalist-green mr-1" />
                <span className="text-sm font-bold text-brutalist-green uppercase">
                  12.5% vs mes anterior
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-brutalist-lime border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-black" />
            </div>
          </div>
        </MetricCard>

        {/* Clientes */}
        <MetricCard color="white" className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-gray-600">
                Clientes
              </p>
              <p className="text-3xl font-black text-black">1,247</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-brutalist-green mr-1" />
                <span className="text-sm font-bold text-brutalist-green uppercase">
                  8.2% vs mes anterior
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-brutalist-blue border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </MetricCard>

        {/* Productos */}
        <MetricCard color="white" className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-gray-600">
                Productos
              </p>
              <p className="text-3xl font-black text-black">856</p>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-4 w-4 text-brutalist-red mr-1" />
                <span className="text-sm font-bold text-brutalist-red uppercase">
                  2.1% vs mes anterior
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-brutalist-orange border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </MetricCard>

        {/* Pedidos */}
        <MetricCard color="white" className="relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-gray-600">
                Pedidos
              </p>
              <p className="text-3xl font-black text-black">342</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-brutalist-green mr-1" />
                <span className="text-sm font-bold text-brutalist-green uppercase">
                  15.3% vs mes anterior
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-brutalist-purple border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </MetricCard>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Ventas Mensuales */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <h3 className="text-xl font-black uppercase tracking-wide text-black mb-2">
            Ventas Mensuales
          </h3>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-6">
            Evolución de ventas en los últimos 6 meses
          </p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeWidth={2} stroke="#000000" />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                  tickLine={{ stroke: '#000000', strokeWidth: 2 }}
                  tick={{ fontWeight: 'bold', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                  tickLine={{ stroke: '#000000', strokeWidth: 2 }}
                  tick={{ fontWeight: 'bold', fontSize: 12 }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#8b5cf6" 
                  stroke="#000000" 
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Ventas por Categoría */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <h3 className="text-xl font-black uppercase tracking-wide text-black mb-2">
            Ventas por Categoría
          </h3>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-6">
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
                  stroke="#000000"
                  strokeWidth={2}
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
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-6 w-6 text-brutalist-orange mr-2" />
            <h3 className="text-xl font-black uppercase tracking-wide text-black">
              Productos con Stock Bajo
            </h3>
          </div>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-6">
            Productos que necesitan reposición urgente
          </p>
          <div className="space-y-4">
            {lowStockProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black">
                <div>
                  <p className="font-black text-black uppercase">{product.name}</p>
                  <p className="text-sm font-bold text-gray-600 uppercase">
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
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <h3 className="text-xl font-black uppercase tracking-wide text-black mb-2">
            Acciones Rápidas
          </h3>
          <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-6">
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

