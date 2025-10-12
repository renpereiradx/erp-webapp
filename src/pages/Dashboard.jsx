import React, { useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import useDashboardStore from '../store/useDashboardStore';
import { useThemeStyles } from '../hooks/useThemeStyles';
import DataState from '../components/ui/DataState';
import { Button } from '@/components/ui/button';
import { DEMO_CHART_DATA } from '../config/demoData';
import { DollarSign, Users, Package, ShoppingCart, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Componente para una tarjeta de métrica individual (mejorada)
const MetricCard = ({ title, value, icon: Icon, loading, delta }) => {
  const { styles, isNeoBrutalism } = useThemeStyles();
  if (loading) {
    return <div className={`p-6 ${styles.card()} animate-pulse`}><div className="h-28 bg-muted rounded" /></div>;
  }

  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
  <div className={`${styles.card('elevated', { density: 'comfy', interactive: true, extra: 'transition-shadow group' })}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-md ${isNeoBrutalism ? 'border-2 border-black' : ''} bg-primary/10 text-primary`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className={`${styles.body('muted')} text-sm`}>{title}</p>
            <p className="text-2xl font-bold">{formattedValue ?? '-'}</p>
          </div>
        </div>

        {delta != null && (
          <div className="text-right">
            <span className={`text-xs font-medium ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{delta >= 0 ? `+${delta}%` : `${delta}%`}</span>
            <div className="text-xs text-muted-foreground">vs mes anterior</div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-muted/20 text-xs text-muted-foreground flex justify-between items-center">
        <div>Actualizado: <span className="font-mono">{new Date().toLocaleDateString('es-MX')}</span></div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="outline" size="sm">Ver detalles</Button>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const chartColors = styles.chartColors();
  const { clientStats, productStats, salesStats, loading, error, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Usar datos demo para gráficos
  const salesChartData = DEMO_CHART_DATA.salesChart;
  const categoryChartData = DEMO_CHART_DATA.categoryChart;

  if (loading && !clientStats) {
    return <DataState variant="loading" skeletonVariant="list" skeletonProps={{ count: 8 }} />;
  }

  if (error) {
    return <DataState variant="error" title={t('dashboard.error.title', 'Error al cargar el Dashboard')} message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div className="space-y-6">
      <h1 className={styles.header('h1')}>{t('dashboard.title', 'Dashboard')}</h1>
      
      {/* Barra de acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-md w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder={t('dashboard.search.placeholder', 'Buscar...')} className={`pl-10 pr-4 py-2 ${styles.input()}`} />
        </div>
        <div className="flex items-center gap-3">
          <select className={styles.input()} aria-label="Periodo">
            <option>Últimos 30 días</option>
            <option>Hoy</option>
            <option>Este mes</option>
          </select>
          <Button variant="secondary">{t('dashboard.action.refresh', 'Actualizar')}</Button>
        </div>
      </div>
      
      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={t('dashboard.metrics.sales', 'Ventas Totales')} value={`$${salesStats?.total?.toLocaleString?.() ?? salesStats?.total ?? '-'}`} icon={DollarSign} loading={loading} delta={salesStats?.trend ?? 0} />
        <MetricCard title={t('dashboard.metrics.clients', 'Clientes Activos')} value={clientStats?.active_clients} icon={Users} loading={loading} delta={Math.round(((clientStats?.active_clients || 0) - (clientStats?.inactive_clients || 0)) / Math.max(1, clientStats?.total || 1) * 100)} />
        <MetricCard title={t('dashboard.metrics.products', 'Productos Totales')} value={productStats?.total} icon={Package} loading={loading} delta={productStats?.growth_percentage ?? 0} />
        <MetricCard title={t('dashboard.metrics.orders', 'Pedidos Hoy')} value={salesStats?.today} icon={ShoppingCart} loading={loading} delta={Math.round((salesStats?.today || 0) / Math.max(1, salesStats?.total || 1) * 100)} />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`p-6 ${styles.card()}`}>
          <h2 className={styles.header('h2')}>{t('dashboard.charts.sales', 'Ventas Mensuales')}</h2>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--foreground)" fontSize={12} />
                <YAxis stroke="var(--foreground)" fontSize={12} />
                <Bar dataKey="value" fill={chartColors[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`p-6 ${styles.card()}`}>
          <h2 className={styles.header('h2')}>{t('dashboard.charts.categories', 'Categorías Populares')}</h2>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryChartData} dataKey="value" cx="50%" cy="50%" outerRadius={100} stroke={styles.isNeoBrutalism ? "var(--border)" : "none"}>
                  {categoryChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
