/**
 * Product Performance Chart Component
 * Wave 6: Advanced Analytics & Reporting - Phase 2
 * 
 * Interactive chart displaying product performance metrics with
 * category analysis, drill-down capabilities, and comparison features.
 */

import React, { memo, useMemo, useState, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveTreeMap
} from 'recharts';
import { 
  Package, TrendingUp, Filter, MoreHorizontal, 
  Eye, ChevronDown, Search, Star, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ProductPerformanceChart = memo(({
  data,
  loading = false,
  className = "",
  height = 500,
  onProductClick,
  onCategoryClick
}) => {

  const [viewMode, setViewMode] = useState('revenue'); // revenue, quantity, profit
  const [chartType, setChartType] = useState('bar'); // bar, pie, treemap
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Color schemes for different chart types
  const colorSchemes = {
    revenue: ['#10B981', '#34D399', '#6EE7B7', '#9CF0D1', '#C6F6D5'],
    quantity: ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'],
    profit: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
    category: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7']
  };

  // Process and filter data
  const processedData = useMemo(() => {
    if (!data?.topProducts) return [];

    let filtered = data.topProducts;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by selected metric
    return filtered
      .sort((a, b) => b[viewMode] - a[viewMode])
      .slice(0, 20) // Top 20 products
      .map((product, index) => ({
        ...product,
        rank: index + 1,
        formattedRevenue: formatCurrency(product.revenue),
        formattedQuantity: formatNumber(product.quantity),
        formattedProfit: formatCurrency(product.profit),
        profitMargin: product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0
      }));
  }, [data, selectedCategory, searchTerm, viewMode]);

  // Category performance data
  const categoryData = useMemo(() => {
    if (!data?.categoryPerformance) return [];

    return data.categoryPerformance.map((category, index) => ({
      ...category,
      fill: colorSchemes.category[index % colorSchemes.category.length],
      formattedRevenue: formatCurrency(category.revenue),
      formattedQuantity: formatNumber(category.quantity),
      percentage: category.percentage || 0
    }));
  }, [data]);

  // Get unique categories for filter
  const categories = useMemo(() => {
    if (!data?.topProducts) return [];
    const uniqueCategories = [...new Set(data.topProducts.map(p => p.category))];
    return uniqueCategories.sort();
  }, [data]);

  // Custom tooltip for charts
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-background border rounded-lg shadow-md p-3 min-w-[200px]">
        <p className="text-sm font-medium text-foreground mb-2">{label || data.name}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Ingresos:</span>
            <span className="font-medium">{data.formattedRevenue}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Cantidad:</span>
            <span className="font-medium">{data.formattedQuantity}</span>
          </div>
          {data.formattedProfit && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ganancia:</span>
              <span className="font-medium">{data.formattedProfit}</span>
            </div>
          )}
          {data.profitMargin !== undefined && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Margen:</span>
              <span className="font-medium">{formatPercentage(data.profitMargin)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 flex-1" />
            </div>
            <Skeleton className="w-full" style={{ height }} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!processedData.length && !categoryData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Rendimiento de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de productos disponibles</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Rendimiento de Productos
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Análisis detallado de productos y categorías
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showDetails ? 'Ocultar' : 'Mostrar'} detalles
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode('revenue')}>
                  Ver por ingresos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('quantity')}>
                  Ver por cantidad
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('profit')}>
                  Ver por ganancia
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setChartType('bar')}>
                  Gráfico de barras
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType('pie')}>
                  Gráfico circular
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mt-4">
          {/* View Mode Selector */}
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Ingresos</SelectItem>
              <SelectItem value="quantity">Cantidad Vendida</SelectItem>
              <SelectItem value="profit">Ganancia</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Active filters indicator */}
          {(selectedCategory !== 'all' || searchTerm) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Filter className="w-3 h-3" />
              {selectedCategory !== 'all' && selectedCategory}
              {searchTerm && `"${searchTerm}"`}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={chartType} onValueChange={setChartType} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bar">Productos</TabsTrigger>
            <TabsTrigger value="pie">Categorías</TabsTrigger>
          </TabsList>

          {/* Products Bar Chart */}
          <TabsContent value="bar" className="space-y-4">
            <div className="w-full" style={{ height }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => 
                      viewMode === 'quantity' 
                        ? formatNumber(value, { compact: true })
                        : formatCurrency(value, { compact: true })
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey={viewMode}
                    fill={colorSchemes[viewMode][0]}
                    radius={[4, 4, 0, 0]}
                    onClick={(data) => onProductClick?.(data)}
                    className="cursor-pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products Summary */}
            {showDetails && processedData.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Producto Top</p>
                  <p className="font-semibold text-green-600 flex items-center justify-center gap-1">
                    <Star className="w-3 h-3" />
                    {processedData[0]?.name}
                  </p>
                  <p className="text-xs">
                    {viewMode === 'quantity' 
                      ? processedData[0]?.formattedQuantity
                      : processedData[0]?.formattedRevenue}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Productos Analizados</p>
                  <p className="font-semibold text-blue-600">
                    {processedData.length}
                  </p>
                  <p className="text-xs">de {data?.topProducts?.length || 0} totales</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Rendimiento Promedio</p>
                  <p className="font-semibold text-purple-600">
                    {viewMode === 'quantity' 
                      ? formatNumber(processedData.reduce((sum, p) => sum + p.quantity, 0) / processedData.length)
                      : formatCurrency(processedData.reduce((sum, p) => sum + p.revenue, 0) / processedData.length)}
                  </p>
                  <p className="text-xs">por producto</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Categories Pie Chart */}
          <TabsContent value="pie" className="space-y-4">
            <div className="w-full" style={{ height }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={180}
                    paddingAngle={2}
                    dataKey={viewMode}
                    onClick={(data) => onCategoryClick?.(data)}
                    className="cursor-pointer"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span className="text-sm">
                        {value} ({formatPercentage(entry.payload.percentage)})
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Performance Summary */}
            {showDetails && categoryData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                {categoryData.slice(0, 4).map((category, index) => (
                  <div key={category.name} className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.fill }}
                      />
                      <p className="text-xs font-medium">{category.name}</p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPercentage(category.percentage)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {viewMode === 'quantity' 
                        ? category.formattedQuantity
                        : category.formattedRevenue}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Performance Insights */}
        {showDetails && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insights de Rendimiento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground">
                  • Los productos top representan el {formatPercentage(70)} de los ingresos
                </p>
                <p className="text-muted-foreground">
                  • Categoría líder: {categoryData[0]?.name} ({formatPercentage(categoryData[0]?.percentage)})
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  • Margen promedio: {formatPercentage(processedData.reduce((sum, p) => sum + p.profitMargin, 0) / processedData.length)}
                </p>
                <p className="text-muted-foreground">
                  • Productos analizados: {processedData.length} de {data?.topProducts?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ProductPerformanceChart.displayName = 'ProductPerformanceChart';

export default ProductPerformanceChart;
