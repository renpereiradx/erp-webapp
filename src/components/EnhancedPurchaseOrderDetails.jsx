/**
 * Componente para mostrar detalles enriquecidos de órdenes de compra
 * Incluye nuevos campos: unit, tax_rate, profit_pct, line_total, sale_price, metadata, supplier_status
 */

import React from 'react';
import {
  Package,
  DollarSign,
  TrendingUp,
  Scale,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Calendar,
  User
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Constants
import { PURCHASE_STATE_LABELS, PURCHASE_STATE_COLORS } from '@/constants/purchaseData';

const EnhancedPurchaseOrderDetails = ({ orderData, onClose }) => {
  if (!orderData) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center text-red-800">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>No hay datos de orden disponibles</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Manejar tanto formato enriquecido como legacy
  const purchase = orderData.purchase || orderData;
  const details = orderData.details || [];

  const statusColor = PURCHASE_STATE_COLORS[purchase.status];
  const statusLabel = PURCHASE_STATE_LABELS[purchase.status] || purchase.status;

  // Calcular estadísticas de los detalles
  const itemsStats = details.reduce((acc, item) => {
    return {
      totalItems: acc.totalItems + 1,
      totalQuantity: acc.totalQuantity + item.quantity,
      totalLineTotal: acc.totalLineTotal + (item.line_total || (item.quantity * item.unit_price)),
      totalSalePrice: acc.totalSalePrice + ((item.sale_price || 0) * item.quantity),
      avgProfitPct: acc.avgProfitPct + (item.profit_pct || 0),
      avgTaxRate: acc.avgTaxRate + (item.tax_rate || 0)
    };
  }, {
    totalItems: 0,
    totalQuantity: 0,
    totalLineTotal: 0,
    totalSalePrice: 0,
    avgProfitPct: 0,
    avgTaxRate: 0
  });

  // Calcular promedios
  if (itemsStats.totalItems > 0) {
    itemsStats.avgProfitPct = itemsStats.avgProfitPct / itemsStats.totalItems;
    itemsStats.avgTaxRate = itemsStats.avgTaxRate / itemsStats.totalItems;
  }

  return (
    <div className="space-y-6">
      {/* Header de la orden */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center">
                <Package className="w-6 h-6 mr-2 text-blue-600" />
                Orden de Compra #{purchase.id}
              </CardTitle>
              <div className="flex items-center mt-2 space-x-4">
                <Badge variant={statusColor}>{statusLabel}</Badge>
                {purchase.supplier_status === false && (
                  <Badge variant="destructive">Proveedor Inactivo</Badge>
                )}
              </div>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              Cerrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Proveedor</label>
              <p className="text-lg font-semibold">{purchase.supplier_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Total</label>
              <p className="text-lg font-semibold">${purchase.total_amount?.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Fecha</label>
              <p className="text-lg font-semibold">
                {new Date(purchase.order_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Creado por</label>
              <p className="text-lg font-semibold">{purchase.user_name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas enriquecidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 mr-3 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{itemsStats.totalItems}</div>
                <div className="text-sm text-gray-600">Productos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Scale className="w-8 h-8 mr-3 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{itemsStats.totalQuantity}</div>
                <div className="text-sm text-gray-600">Cantidad Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 mr-3 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{itemsStats.avgProfitPct.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Margen Promedio</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 mr-3 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">${itemsStats.totalSalePrice.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Valor Venta Est.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalles de productos enriquecidos */}
      <Card>
        <CardHeader>
          <CardTitle>Productos de la Orden</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Producto</th>
                  <th className="px-4 py-3 text-left font-medium">Cantidad</th>
                  <th className="px-4 py-3 text-left font-medium">Unidad</th>
                  <th className="px-4 py-3 text-left font-medium">Precio Compra</th>
                  <th className="px-4 py-3 text-left font-medium">Margen %</th>
                  <th className="px-4 py-3 text-left font-medium">Precio Venta</th>
                  <th className="px-4 py-3 text-left font-medium">Total Línea</th>
                  <th className="px-4 py-3 text-left font-medium">IVA %</th>
                </tr>
              </thead>
              <tbody>
                {details.map((item, index) => (
                  <tr key={item.id || index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-600">ID: {item.product_id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.quantity}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{item.unit || 'unit'}</Badge>
                    </td>
                    <td className="px-4 py-3">${item.unit_price?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.profit_pct > 30 ? 'success' : 'warning'}>
                        {item.profit_pct?.toFixed(1) || '30.0'}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-green-600">
                      ${item.sale_price?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ${(item.line_total || (item.quantity * item.unit_price))?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{item.tax_rate?.toFixed(1) || '10.0'}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Metadata si está disponible */}
      {details.some(item => item.metadata) && (
        <Card>
          <CardHeader>
            <CardTitle>Información Adicional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {details.filter(item => item.metadata).map((item, index) => (
                <div key={index} className="border rounded-lg p-3 bg-gray-50">
                  <div className="font-medium mb-2">{item.product_name}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {Object.entries(item.metadata || {}).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen financiero */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${purchase.total_amount?.toLocaleString()}
              </div>
              <div className="text-sm text-blue-800">Costo Total Compra</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${itemsStats.totalSalePrice.toLocaleString()}
              </div>
              <div className="text-sm text-green-800">Valor Venta Estimado</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${(itemsStats.totalSalePrice - purchase.total_amount).toLocaleString()}
              </div>
              <div className="text-sm text-purple-800">Margen Estimado</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedPurchaseOrderDetails;
