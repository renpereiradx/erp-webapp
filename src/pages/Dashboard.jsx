import React, { useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import useDashboardStore from '../store/useDashboardStore';
import { useThemeStyles } from '../hooks/useThemeStyles';
import DataState from '../components/ui/DataState';
import { DollarSign, Users, Package, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Componente para una tarjeta de métrica individual
const MetricCard = ({ title, value, icon: Icon, loading }) => {
  const { styles } = useThemeStyles();
  if (loading) {
    return <div className={`p-6 ${styles.card()}`}><div className="h-24 bg-muted animate-pulse"></div></div>;
  }
  return (
    <div className={`p-6 ${styles.card()}`}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/20 text-primary rounded-md"><Icon className="w-6 h-6" /></div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value ?? '-'}</p>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { t } = useI18n();
  const { styles, chartColors } = useThemeStyles();
  const { clientStats, productStats, salesStats, loading, error, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Datos para los gráficos (a futuro se podrían mover al store)
  const salesChartData = [
    { name: 'Ene', value: 12000 }, { name: 'Feb', value: 15000 }, { name: 'Mar', value: 18000 },
    { name: 'Abr', value: 22000 }, { name: 'May', value: 19000 }, { name: 'Jun', value: 25000 },
  ];
  const categoryChartData = [
    { name: 'Electrónicos', value: 35 }, { name: 'Ropa', value: 25 }, { name: 'Hogar', value: 20 },
    { name: 'Deportes', value: 15 }, { name: 'Otros', value: 5 },
  ];

  if (loading && !clientStats) {
    return <DataState variant="loading" skeletonVariant="list" skeletonProps={{ count: 8 }} />;
  }

  if (error) {
    return <DataState variant="error" title={t('dashboard.error.title', 'Error al cargar el Dashboard')} message={error} onRetry={fetchDashboardData} />;
  }

  return (
    <div className="space-y-6">
      <h1 className={styles.header('h1')}>{t('dashboard.title', 'Dashboard')}</h1>
      
      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={t('dashboard.metrics.sales', 'Ventas Totales')} value={`$${salesStats?.total.toLocaleString()}`} icon={DollarSign} loading={loading} />
        <MetricCard title={t('dashboard.metrics.clients', 'Clientes Activos')} value={clientStats?.active_clients} icon={Users} loading={loading} />
        <MetricCard title={t('dashboard.metrics.products', 'Productos Totales')} value={productStats?.total} icon={Package} loading={loading} />
        <MetricCard title={t('dashboard.metrics.orders', 'Pedidos Hoy')} value={salesStats?.today} icon={ShoppingCart} loading={loading} />
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