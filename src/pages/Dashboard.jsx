/**
 * Dashboard Page - Panel principal del sistema ERP
 * Diseñado con Fluent Design System
 */

import React, { useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import useDashboardStore from '../store/useDashboardStore';
import { DEMO_CHART_DATA } from '../config/demoData';
import { DollarSign, Users, Package, ShoppingCart, Search } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Colores para gráficos
const CHART_COLORS = [
  '#0078d4', // Blue
  '#107c10', // Green
  '#f7630c', // Orange
  '#8764b8', // Purple
  '#00b7c3', // Teal
  '#ea005e', // Pink
];

const Dashboard = () => {
  const { t } = useI18n();
  const { clientStats, productStats, salesStats, loading, error, fetchDashboardData } =
    useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Usar datos demo para gráficos
  const salesChartData = DEMO_CHART_DATA.salesChart;
  const categoryChartData = DEMO_CHART_DATA.categoryChart;

  if (loading && !clientStats) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">
          <div className="dashboard__loading-spinner" />
          <p className="dashboard__loading-text">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">
          <h2 className="dashboard__error-title">
            {t('dashboard.error.title', 'Error al cargar el Dashboard')}
          </h2>
          <p className="dashboard__error-message">{error}</p>
          <button className="dashboard__error-retry" onClick={fetchDashboardData}>
            {t('common.retry', 'Reintentar')}
          </button>
        </div>
      </div>
    );
  }

  const formattedValue = (value) => (typeof value === 'number' ? value.toLocaleString() : value);

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">{t('dashboard.title', 'Dashboard')}</h1>

      {/* Barra de acciones */}
      <div className="dashboard__actions">
        <div className="dashboard__search">
          <Search className="dashboard__search-icon" />
          <input
            placeholder={t('dashboard.search.placeholder', 'Buscar...')}
            className="dashboard__search-input"
          />
        </div>
        <div className="dashboard__filters">
          <select className="dashboard__select" aria-label="Periodo">
            <option>Últimos 30 días</option>
            <option>Hoy</option>
            <option>Este mes</option>
          </select>
          <button className="dashboard__refresh-btn">
            {t('dashboard.action.refresh', 'Actualizar')}
          </button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="dashboard__metrics">
        {/* Ventas Totales */}
        <div className="metric-card">
          <div className="metric-card__content">
            <div className="metric-card__icon metric-card__icon--sales">
              <DollarSign className="metric-card__icon-svg" />
            </div>
            <div className="metric-card__info">
              <p className="metric-card__label">
                {t('dashboard.metrics.sales', 'Ventas Totales')}
              </p>
              <p className="metric-card__value">
                ${formattedValue(salesStats?.total) ?? '-'}
              </p>
            </div>
          </div>
          {salesStats?.trend != null && (
            <div className="metric-card__trend">
              <span
                className={`metric-card__delta ${
                  salesStats.trend >= 0
                    ? 'metric-card__delta--positive'
                    : 'metric-card__delta--negative'
                }`}
              >
                {salesStats.trend >= 0 ? `+${salesStats.trend}%` : `${salesStats.trend}%`}
              </span>
              <span className="metric-card__delta-label">vs mes anterior</span>
            </div>
          )}
          <div className="metric-card__footer">
            <span className="metric-card__date">
              Actualizado: {new Date().toLocaleDateString('es-MX')}
            </span>
          </div>
        </div>

        {/* Clientes Activos */}
        <div className="metric-card">
          <div className="metric-card__content">
            <div className="metric-card__icon metric-card__icon--clients">
              <Users className="metric-card__icon-svg" />
            </div>
            <div className="metric-card__info">
              <p className="metric-card__label">
                {t('dashboard.metrics.clients', 'Clientes Activos')}
              </p>
              <p className="metric-card__value">{formattedValue(clientStats?.active_clients) ?? '-'}</p>
            </div>
          </div>
          {clientStats && (
            <div className="metric-card__trend">
              <span className="metric-card__delta metric-card__delta--positive">
                +
                {Math.round(
                  ((clientStats?.active_clients || 0) - (clientStats?.inactive_clients || 0)) /
                    Math.max(1, clientStats?.total || 1) *
                    100
                )}
                %
              </span>
              <span className="metric-card__delta-label">vs mes anterior</span>
            </div>
          )}
          <div className="metric-card__footer">
            <span className="metric-card__date">
              Actualizado: {new Date().toLocaleDateString('es-MX')}
            </span>
          </div>
        </div>

        {/* Productos Totales */}
        <div className="metric-card">
          <div className="metric-card__content">
            <div className="metric-card__icon metric-card__icon--products">
              <Package className="metric-card__icon-svg" />
            </div>
            <div className="metric-card__info">
              <p className="metric-card__label">
                {t('dashboard.metrics.products', 'Productos Totales')}
              </p>
              <p className="metric-card__value">{formattedValue(productStats?.total) ?? '-'}</p>
            </div>
          </div>
          {productStats?.growth_percentage != null && (
            <div className="metric-card__trend">
              <span
                className={`metric-card__delta ${
                  productStats.growth_percentage >= 0
                    ? 'metric-card__delta--positive'
                    : 'metric-card__delta--negative'
                }`}
              >
                {productStats.growth_percentage >= 0
                  ? `+${productStats.growth_percentage}%`
                  : `${productStats.growth_percentage}%`}
              </span>
              <span className="metric-card__delta-label">vs mes anterior</span>
            </div>
          )}
          <div className="metric-card__footer">
            <span className="metric-card__date">
              Actualizado: {new Date().toLocaleDateString('es-MX')}
            </span>
          </div>
        </div>

        {/* Pedidos Hoy */}
        <div className="metric-card">
          <div className="metric-card__content">
            <div className="metric-card__icon metric-card__icon--orders">
              <ShoppingCart className="metric-card__icon-svg" />
            </div>
            <div className="metric-card__info">
              <p className="metric-card__label">
                {t('dashboard.metrics.orders', 'Pedidos Hoy')}
              </p>
              <p className="metric-card__value">{formattedValue(salesStats?.today) ?? '-'}</p>
            </div>
          </div>
          {salesStats && (
            <div className="metric-card__trend">
              <span className="metric-card__delta metric-card__delta--positive">
                +{Math.round((salesStats?.today || 0) / Math.max(1, salesStats?.total || 1) * 100)}%
              </span>
              <span className="metric-card__delta-label">vs mes anterior</span>
            </div>
          )}
          <div className="metric-card__footer">
            <span className="metric-card__date">
              Actualizado: {new Date().toLocaleDateString('es-MX')}
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="dashboard__charts">
        {/* Ventas Mensuales */}
        <div className="chart-card">
          <h2 className="chart-card__title">
            {t('dashboard.charts.sales', 'Ventas Mensuales')}
          </h2>
          <div className="chart-card__content">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="name" stroke="var(--text-primary)" fontSize={12} />
                <YAxis stroke="var(--text-primary)" fontSize={12} />
                <Bar dataKey="value" fill={CHART_COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categorías Populares */}
        <div className="chart-card">
          <h2 className="chart-card__title">
            {t('dashboard.charts.categories', 'Categorías Populares')}
          </h2>
          <div className="chart-card__content">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  stroke="none"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
