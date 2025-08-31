/**
 * Componente para listar y gestionar órdenes de compra
 * Incluye filtros avanzados, búsqueda, paginación y acciones en masa
 * Complementa la funcionalidad de crear nuevas compras
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  X, 
  Check,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  Package,
  TrendingUp
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';

// Custom hooks
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
// useThemeStyles removido para MVP - sin hooks problemáticos

// Constants
import { 
  PURCHASE_STATE_LABELS, 
  PURCHASE_STATE_COLORS, 
  PURCHASE_STATES 
} from '@/constants/purchaseData';

const PurchaseOrdersList = ({ theme }) => {
  // Para MVP - estilos fijos sin hooks problemáticos
  const styles = {};
  const {
    orders,
    loading,
    error,
    filters,
    pagination,
    orderStatistics,
    loadPurchaseOrders,
    searchOrders,
    filterByDateRange,
    cancelOrder,
    updateOrderStatus,
    getOrderDetails,
    setFilters,
    resetFilters,
    exportOrdersData
  } = usePurchaseOrders();

  // Estado local para UI
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  // Manejar selección de órdenes
  const handleOrderSelection = (orderId, isSelected) => {
    if (isSelected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  // Seleccionar todas las órdenes visibles
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  // Manejar cambio de filtros
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Manejar búsqueda
  const handleSearch = (searchTerm) => {
    handleFilterChange('searchTerm', searchTerm);
  };

  // Ver detalles de orden
  const handleViewOrder = async (order) => {
    try {
      const details = await getOrderDetails(order.id);
      if (details.success) {
        setSelectedOrder({ ...order, details: details.data });
        setShowOrderDetail(true);
      }
    } catch (error) {
      console.error('Error viewing order:', error);
    }
  };

  // Exportar órdenes seleccionadas
  const handleExport = () => {
    const dataToExport = exportOrdersData();
    const csvContent = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordenes_compra_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Componente de estadísticas compactas
  const CompactStatisticsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div className={styles.card('p-3')}>
        <div className="flex items-center">
          <Package className={`w-5 h-5 mr-2 ${
            theme?.includes('neo-brutalism') ? 'text-black' : 
            theme?.includes('material') ? 'text-blue-600' : 
            theme?.includes('fluent') ? 'text-sky-600' : 'text-blue-600'
          }`} />
          <div>
            <div className={`text-lg font-bold ${
              theme?.includes('neo-brutalism') ? 'font-black' : 'font-semibold'
            }`}>
              {orderStatistics.total}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
      
      <div className={styles.card('p-3')}>
        <div className="flex items-center">
          <Clock className={`w-5 h-5 mr-2 ${
            theme?.includes('neo-brutalism') ? 'text-black' : 
            theme?.includes('material') ? 'text-yellow-600' : 
            theme?.includes('fluent') ? 'text-amber-600' : 'text-yellow-600'
          }`} />
          <div>
            <div className={`text-lg font-bold ${
              theme?.includes('neo-brutalism') ? 'font-black' : 'font-semibold'
            }`}>
              {orderStatistics.pending}
            </div>
            <div className="text-xs text-muted-foreground">Pendientes</div>
          </div>
        </div>
      </div>
      
      <div className={styles.card('p-3')}>
        <div className="flex items-center">
          <DollarSign className={`w-5 h-5 mr-2 ${
            theme?.includes('neo-brutalism') ? 'text-black' : 
            theme?.includes('material') ? 'text-green-600' : 
            theme?.includes('fluent') ? 'text-emerald-600' : 'text-green-600'
          }`} />
          <div>
            <div className={`text-lg font-bold ${
              theme?.includes('neo-brutalism') ? 'font-black' : 'font-semibold'
            }`}>
              ${orderStatistics.totalAmount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Valor Total</div>
          </div>
        </div>
      </div>
      
      <div className={styles.card('p-3')}>
        <div className="flex items-center">
          <TrendingUp className={`w-5 h-5 mr-2 ${
            theme?.includes('neo-brutalism') ? 'text-black' : 
            theme?.includes('material') ? 'text-purple-600' : 
            theme?.includes('fluent') ? 'text-violet-600' : 'text-purple-600'
          }`} />
          <div>
            <div className={`text-lg font-bold ${
              theme?.includes('neo-brutalism') ? 'font-black' : 'font-semibold'
            }`}>
              ${orderStatistics.averageAmount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Promedio</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente de filtros
  const FiltersPanel = () => (
    <Card className={styles.card('mb-4')}>
      <CardHeader>
        <CardTitle className={styles.cardHeader()}>
          <Filter className="w-5 h-5 mr-2" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtro por estado */}
          <div>
            <label className={styles.label()}>Estado</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.input()}
            >
              <option value="">Todos los estados</option>
              {Object.entries(PURCHASE_STATE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Filtro por proveedor */}
          <div>
            <label className={styles.label()}>Proveedor</label>
            <Input
              placeholder="Nombre del proveedor"
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              className={styles.input()}
            />
          </div>

          {/* Fecha inicio */}
          <div>
            <label className={styles.label()}>Fecha Inicio</label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => filterByDateRange(e.target.value, filters.dateRange.end)}
              className={styles.input()}
            />
          </div>

          {/* Fecha fin */}
          <div>
            <label className={styles.label()}>Fecha Fin</label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => filterByDateRange(filters.dateRange.start, e.target.value)}
              className={styles.input()}
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          <Button
            onClick={resetFilters}
            variant="outline"
            size="sm"
          >
            Limpiar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Componente de fila de tabla
  const OrderRow = ({ order, isSelected, onSelect }) => {
    const statusColor = PURCHASE_STATE_COLORS[order.status];
    const statusLabel = PURCHASE_STATE_LABELS[order.status] || order.status;

    return (
      <tr className={styles.body('hover:bg-gray-50')}>
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(order.id, e.target.checked)}
            className="rounded border-gray-300"
          />
        </td>
        <td className="px-4 py-3 font-medium">#{order.id}</td>
        <td className="px-4 py-3">{order.supplier_name}</td>
        <td className="px-4 py-3">
          <Badge variant={statusColor}>{statusLabel}</Badge>
        </td>
        <td className="px-4 py-3">${order.total_amount}</td>
        <td className="px-4 py-3">
          {new Date(order.order_date).toLocaleDateString()}
        </td>
        <td className="px-4 py-3">
          <div className="flex space-x-2">
            <Button
              onClick={() => handleViewOrder(order)}
              size="sm"
              variant="secondary"
            >
              <Eye className="w-4 h-4" />
            </Button>
            {order.status === PURCHASE_STATES.PENDING && (
              <>
                <Button
                  onClick={() => updateOrderStatus(order.id, PURCHASE_STATES.CONFIRMED)}
                  size="sm"
                  variant="green"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => cancelOrder(order.id, 'Cancelado por usuario')}
                  size="sm"
                  variant="destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Mostrar error si existe
  if (error) {
    return (
      <Card className={styles.card('border-red-200 bg-red-50')}>
        <CardContent className="p-4">
          <div className="flex items-center text-red-800">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Error: {error}</span>
          </div>
          <Button 
            onClick={() => loadPurchaseOrders()}
            className="mt-2"
            size="sm"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas compactas */}
      <CompactStatisticsCards />

      {/* Barra de herramientas compacta */}
      <Card className={styles.card()}>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            {/* Búsqueda */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar órdenes..."
                  value={filters.searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-56 h-8"
                />
              </div>
              
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Filter className="w-4 h-4 mr-1" />
                Filtros
              </Button>
            </div>

            {/* Acciones */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">
                {selectedOrders.length} seleccionadas
              </span>
              
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={orders.length === 0}
                className="h-8"
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel de filtros compacto */}
      {showFilters && (
        <Card className={styles.card('mb-3')}>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Filtro por estado */}
              <div>
                <label className="text-xs font-medium mb-1 block">Estado</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full h-8 text-xs border border-gray-300 rounded px-2"
                >
                  <option value="">Todos</option>
                  {Object.entries(PURCHASE_STATE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por proveedor */}
              <div>
                <label className="text-xs font-medium mb-1 block">Proveedor</label>
                <Input
                  placeholder="Nombre del proveedor"
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Fecha inicio */}
              <div>
                <label className="text-xs font-medium mb-1 block">Fecha Inicio</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => filterByDateRange(e.target.value, filters.dateRange.end)}
                  className="w-full h-8 text-xs border border-gray-300 rounded px-2"
                />
              </div>

              {/* Fecha fin */}
              <div>
                <label className="text-xs font-medium mb-1 block">Fecha Fin</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => filterByDateRange(filters.dateRange.start, e.target.value)}
                  className="w-full h-8 text-xs border border-gray-300 rounded px-2"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-3">
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de órdenes */}
      <Card className={styles.card()}>
        <CardHeader>
          <CardTitle className={styles.cardHeader()}>
            Órdenes de Compra ({orders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Cargando órdenes...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron órdenes de compra</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium">ID</th>
                    <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Total</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      isSelected={selectedOrders.includes(order.id)}
                      onSelect={handleOrderSelection}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <Card className={styles.card()}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => loadPurchaseOrders(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => loadPurchaseOrders(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  variant="outline"
                  size="sm"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PurchaseOrdersList;
