/**
 * PurchaseAnalyticsDashboard - Wave 3 Lazy Analytics Component
 * Dashboard de analytics lazy-loaded para purchases
 * Solo se carga cuando se navega al tab de analytics
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

import React, { memo, useEffect, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTelemetry } from '@/hooks/useTelemetry';

const PurchaseAnalyticsDashboard = ({ purchases = [] }) => {
  const { trackEvent } = useTelemetry();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    trackEvent('analytics.dashboard.loaded');
    
    // Calcular analytics
    const calculateAnalytics = () => {
      const totalPurchases = purchases.length;
      const totalAmount = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
      const avgAmount = totalAmount / totalPurchases || 0;
      
      const statusBreakdown = purchases.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});

      return {
        totalPurchases,
        totalAmount,
        avgAmount,
        statusBreakdown
      };
    };

    setAnalytics(calculateAnalytics());
  }, [purchases, trackEvent]);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <div className="text-lg">Cargando analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Total Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalPurchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monto Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${analytics.totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${analytics.avgAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="capitalize">{status}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(PurchaseAnalyticsDashboard);
