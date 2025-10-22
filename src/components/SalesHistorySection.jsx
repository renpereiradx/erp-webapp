/**
 * Sección de Historial de Ventas con Reversión
 * Implementa SALE_GET_BY_RANGE_API.md
 */

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw, Search, Eye, XCircle, Calendar, DollarSign, User, FileText, Tag, Package, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DataState from '@/components/ui/DataState';
import SaleReversionModal from './SaleReversionModal';
import DateRangeFilter from './DateRangeFilter';
import saleService from '@/services/saleService';
import salePaymentService from '@/services/salePaymentService';
import { useAnnouncement } from '@/contexts/AnnouncementContext';

const SalesHistorySection = forwardRef((props, ref) => {
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total_records: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientNameSearch, setClientNameSearch] = useState('');
  const [debouncedClientName, setDebouncedClientName] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [showReversionModal, setShowReversionModal] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const { announceSuccess } = useAnnouncement();

  // Debounce para búsqueda por nombre de cliente
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClientName(clientNameSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [clientNameSearch]);

  // Cargar ventas cuando cambia el nombre debounced
  useEffect(() => {
    if (debouncedClientName.trim()) {
      loadSalesByClientName(debouncedClientName);
    }
  }, [debouncedClientName]);

  // Cargar ventas al montar el componente
  useEffect(() => {
    loadSales();
  }, []);

  // Exponer método de refresco para componentes padres
  useImperativeHandle(ref, () => ({
    refresh: () => loadSales(),
    refreshToday: () => loadTodaySales()
  }));

  const loadSales = async (customDateRange = null, page = 1, pageSize = 50) => {
    setLoading(true);
    setError(null);

    try {
      let startDate, endDate;

      if (customDateRange) {
        startDate = customDateRange.start_date;
        endDate = customDateRange.end_date;
      } else {
        // Obtener ventas del último mes por defecto
        const now = new Date();

        // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        endDate = `${year}-${month}-${day}`;

        // Restar 1 mes
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const startYear = oneMonthAgo.getFullYear();
        const startMonth = String(oneMonthAgo.getMonth() + 1).padStart(2, '0');
        const startDay = String(oneMonthAgo.getDate()).padStart(2, '0');
        startDate = `${startYear}-${startMonth}-${startDay}`;
      }

      const response = await salePaymentService.getSalesByDateRangeWithPaymentStatus({
        start_date: startDate,
        end_date: endDate,
        page: page,
        page_size: pageSize
      });

      if (response?.data) {
        const salesData = response.data;
        setSales(salesData);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setSales([]);
      }
    } catch (err) {
      setError('Error al cargar el historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaySales = async () => {
    setLoading(true);
    setError(null);
    setClientNameSearch(''); // Limpiar búsqueda por nombre

    try {
      // Usar fecha de hoy para el rango
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      const response = await salePaymentService.getSalesByDateRangeWithPaymentStatus({
        start_date: today,
        end_date: today,
        page: 1,
        page_size: 50
      });

      if (response?.data) {
        const salesData = response.data;
        setSales(salesData);
        if (response.pagination) {
          setPagination(response.pagination);
        }
        announceSuccess('Filtro', `${salesData.length} venta${salesData.length !== 1 ? 's' : ''} de hoy`);
      } else {
        setSales([]);
        announceSuccess('Filtro', 'No hay ventas de hoy');
      }
    } catch (err) {
      setError('Error al cargar las ventas de hoy');
    } finally {
      setLoading(false);
    }
  };

  const loadSalesByClientName = async (clientName, page = 1, pageSize = 50) => {
    if (!clientName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await salePaymentService.getSalesByClientNameWithPaymentStatus(clientName, {
        page: page,
        page_size: pageSize
      });

      if (response?.data) {
        const salesData = response.data;
        setSales(salesData);
        if (response.pagination) {
          setPagination(response.pagination);
        }
        announceSuccess('Búsqueda', `${response.pagination?.total_records || 0} venta${response.pagination?.total_records !== 1 ? 's' : ''} encontrada${response.pagination?.total_records !== 1 ? 's' : ''} para "${clientName}"`);
      } else {
        setSales([]);
        announceSuccess('Búsqueda', `No se encontraron ventas para "${clientName}"`);
      }
    } catch (err) {
      setError('Error al buscar ventas por nombre de cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReversion = (saleId) => {
    setSelectedSaleId(saleId);
    setShowReversionModal(true);
  };

  const handleReversionComplete = () => {
    announceSuccess('Reversión', 'Venta revertida exitosamente');
    loadSales(dateRange);
  };

  const handleDateRangeApply = (range) => {
    setDateRange(range);
    setShowDateFilter(false);
    loadSales(range);
  };

  // Filtrar ventas por búsqueda
  const filteredSales = sales.filter(saleData => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    return (
      saleData.sale_id?.toLowerCase().includes(query) ||
      saleData.client_name?.toLowerCase().includes(query) ||
      saleData.client_id?.toLowerCase().includes(query) ||
      saleData.total_amount?.toString().includes(query)
    );
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      'COMPLETED': { variant: 'success', label: 'Completada' },
      'PAID': { variant: 'success', label: 'Pagada' },
      'PENDING': { variant: 'warning', label: 'Pendiente' },
      'PARTIAL_PAYMENT': { variant: 'warning', label: 'Pago Parcial' },
      'CANCELLED': { variant: 'error', label: 'Cancelada' },
      'REFUNDED': { variant: 'secondary', label: 'Reembolsada' }
    };

    const statusInfo = statusMap[status?.toUpperCase()] || { variant: 'secondary', label: status || 'Desconocido' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const canRevert = (sale) => {
    const status = sale.status?.toUpperCase();
    // Permitir cancelar ventas COMPLETED, PAID y PENDING
    // No permitir cancelar ventas ya CANCELLED
    return status === 'COMPLETED' || status === 'PAID' || status === 'PENDING' || status === 'PARTIAL_PAYMENT';
  };

  // Calcular totales de descuentos
  const getTotalDiscounts = (saleData) => {
    const sale = saleData.sale || saleData;
    if (!sale.metadata?.discounts || sale.metadata.discounts.length === 0) {
      return 0;
    }
    return sale.metadata.discounts.reduce((sum, disc) => sum + (disc.discount_amount || 0), 0);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Historial de Ventas
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadTodaySales}
                disabled={loading}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDateFilter(!showDateFilter)}
                disabled={loading}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Filtrar Fechas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSales()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtro de rango de fechas */}
          {showDateFilter && (
            <DateRangeFilter
              onApply={handleDateRangeApply}
              onCancel={() => setShowDateFilter(false)}
            />
          )}

          {/* Barra de búsqueda por nombre de cliente */}
          <div className="mb-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                value={clientNameSearch}
                onChange={(e) => setClientNameSearch(e.target.value)}
                placeholder="Buscar ventas por nombre de cliente..."
                className="pl-10"
              />
              {clientNameSearch && (
                <button
                  onClick={() => {
                    setClientNameSearch('');
                    loadSales();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            {debouncedClientName && (
              <div className="mt-2 text-xs text-gray-500">
                Buscando ventas de "{debouncedClientName}"...
              </div>
            )}
          </div>

          {/* Barra de búsqueda local (filtra resultados cargados) */}
          {!clientNameSearch && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por ID de venta, cliente o monto (en resultados actuales)..."
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Estado de carga */}
          {loading && (
            <DataState variant="loading" skeletonVariant="list" skeletonProps={{ count: 5 }} />
          )}

          {/* Estado de error */}
          {error && !loading && (
            <DataState
              variant="error"
              title="Error al cargar ventas"
              description={error}
              actionLabel="Reintentar"
              onAction={() => loadSales()}
            />
          )}

          {/* Lista de ventas */}
          {!loading && !error && filteredSales.length === 0 && (
            <DataState
              variant="empty"
              title="No hay ventas"
              description={searchQuery ? 'No se encontraron ventas con ese criterio de búsqueda' : 'No hay ventas registradas en el rango seleccionado'}
              icon={FileText}
            />
          )}

          {!loading && !error && filteredSales.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 text-sm font-medium text-gray-700">ID Venta</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Fecha</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">Cliente</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">Monto Total</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">Estado de Pago</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Productos</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Estado</th>
                    <th className="text-center p-3 text-sm font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((saleData, index) => {
                    // Compatibilidad con ambos formatos: nuevo (con payment_status) y antiguo (anidado)
                    const sale = saleData.sale || saleData;
                    const totalAmount = saleData.total_amount || sale.total_amount || 0;
                    const totalPaid = saleData.total_paid || 0;
                    const balanceDue = saleData.balance_due || 0;
                    const paymentProgress = saleData.payment_progress || 0;
                    const paymentCount = saleData.payment_count || 0;
                    const isFullyPaid = saleData.is_fully_paid || false;
                    const hasPaymentStatus = saleData.hasOwnProperty('balance_due');

                    // Key único usando sale_id o index como fallback
                    const uniqueKey = saleData.sale_id || sale.sale_id || sale.id || `sale-${index}`;

                    return (
                      <tr key={uniqueKey} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium text-sm">ID: {saleData.sale_id || sale.sale_id}</div>
                          {(saleData.user_name || sale.user_name) && (
                            <div className="text-xs text-gray-500">Por: {saleData.user_name || sale.user_name}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {(saleData.sale_date || sale.sale_date) ? new Date(saleData.sale_date || sale.sale_date).toLocaleDateString() : 'N/A'}
                          </div>
                          {(saleData.sale_date || sale.sale_date) && (
                            <div className="text-xs text-gray-500">
                              {new Date(saleData.sale_date || sale.sale_date).toLocaleTimeString()}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            {saleData.client_name || sale.client_name || saleData.client_id || sale.client_id || 'N/A'}
                          </div>
                          {(saleData.payment_method || sale.payment_method) && (
                            <div className="text-xs text-gray-500">{saleData.payment_method || sale.payment_method}</div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 font-medium">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              ₲{totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end gap-2">
                            {hasPaymentStatus ? (
                              <>
                                {/* Barra de progreso de pago */}
                                <div className="w-full">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-600">
                                      {paymentProgress.toFixed(0)}%
                                    </span>
                                    {paymentCount > 0 && (
                                      <span className="text-xs text-gray-500">
                                        {paymentCount} pago{paymentCount > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        isFullyPaid ? 'bg-green-500' : 'bg-yellow-500'
                                      }`}
                                      style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Balance pendiente */}
                                {balanceDue > 0 && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Clock className="w-3 h-3 text-orange-600" />
                                    <span className="text-orange-600 font-medium">
                                      Pendiente: ₲{balanceDue.toLocaleString()}
                                    </span>
                                  </div>
                                )}

                                {/* Total pagado */}
                                {totalPaid > 0 && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <TrendingUp className="w-3 h-3 text-green-600" />
                                    <span className="text-green-600 font-medium">
                                      Pagado: ₲{totalPaid.toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-xs text-gray-500">
                                Estado de pago no disponible
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {saleData.details && (
                              <>
                                <Package className="w-4 h-4 text-gray-600" title="Productos" />
                                <span className="text-sm text-gray-600">{saleData.details.length}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {getStatusBadge(saleData.status || sale.status)}
                          {(saleData.metadata?.reserve_details || sale.metadata?.reserve_details) && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                Con Reserva
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenReversion(saleData.sale_id || sale.sale_id)}
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canRevert(sale) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenReversion(saleData.sale_id || sale.sale_id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Revertir venta"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Información adicional y paginación */}
          {!loading && !error && filteredSales.length > 0 && (
            <>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    Mostrando{' '}
                    {((pagination.page - 1) * pagination.page_size) + 1} -{' '}
                    {Math.min(pagination.page * pagination.page_size, pagination.total_records)}{' '}
                    de {pagination.total_records} ventas
                    {dateRange && (
                      <span className="ml-2 text-xs">
                        (Rango: {dateRange.start_date} a {dateRange.end_date})
                      </span>
                    )}
                  </div>

                  {/* Selector de tamaño de página */}
                  <select
                    value={pagination.page_size}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value);
                      if (debouncedClientName) {
                        loadSalesByClientName(debouncedClientName, 1, newSize);
                      } else {
                        loadSales(dateRange, 1, newSize);
                      }
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                </div>

                {/* Controles de paginación */}
                {pagination.total_pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (debouncedClientName) {
                          loadSalesByClientName(debouncedClientName, 1, pagination.page_size);
                        } else {
                          loadSales(dateRange, 1, pagination.page_size);
                        }
                      }}
                      disabled={!pagination.has_previous}
                    >
                      ‹‹ Primera
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (debouncedClientName) {
                          loadSalesByClientName(debouncedClientName, pagination.page - 1, pagination.page_size);
                        } else {
                          loadSales(dateRange, pagination.page - 1, pagination.page_size);
                        }
                      }}
                      disabled={!pagination.has_previous}
                    >
                      ‹ Anterior
                    </Button>

                    <span className="px-3 py-1 text-sm">
                      Página {pagination.page} de {pagination.total_pages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (debouncedClientName) {
                          loadSalesByClientName(debouncedClientName, pagination.page + 1, pagination.page_size);
                        } else {
                          loadSales(dateRange, pagination.page + 1, pagination.page_size);
                        }
                      }}
                      disabled={!pagination.has_next}
                    >
                      Siguiente ›
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (debouncedClientName) {
                          loadSalesByClientName(debouncedClientName, pagination.total_pages, pagination.page_size);
                        } else {
                          loadSales(dateRange, pagination.total_pages, pagination.page_size);
                        }
                      }}
                      disabled={!pagination.has_next}
                    >
                      Última ››
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Reversión */}
      <SaleReversionModal
        isOpen={showReversionModal}
        onClose={() => {
          setShowReversionModal(false);
          setSelectedSaleId(null);
        }}
        saleId={selectedSaleId}
        onReversionComplete={handleReversionComplete}
      />
    </>
  );
});

export default SalesHistorySection;
