import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { 
  LayoutDashboard, 
  BarChart3, 
  Flame, 
  Package, 
  WalletCards 
} from 'lucide-react';

/**
 * DashboardNav - Navigation component for Business Intelligence modules.
 * Aligned with Fluent 2 design principles using Tab-based layout.
 */
const DashboardNav = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      id: 'summary',
      path: '/dashboard',
      label: t('dashboard.nav.summary', 'Resumen'),
      icon: LayoutDashboard
    },
    {
      id: 'kpis',
      path: '/dashboard/kpis',
      label: t('dashboard.nav.kpis', 'Indicadores (KPIs)'),
      icon: BarChart3
    },
    {
      id: 'heatmap',
      path: '/dashboard/sales-heatmap',
      label: t('dashboard.nav.heatmap', 'Mapa de Calor'),
      icon: Flame
    },
    {
      id: 'top-products',
      path: '/dashboard/top-products',
      label: t('dashboard.nav.topProducts', 'Productos Top'),
      icon: Package
    },
    {
      id: 'receivables',
      path: '/dashboard/receivables',
      label: t('dashboard.nav.receivables', 'Cuentas por Cobrar'),
      icon: WalletCards
    }
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="dashboard-nav">
      <div className="dashboard-nav__list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`dashboard-nav__item ${active ? 'dashboard-nav__item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} className="dashboard-nav__icon" />
              <span className="dashboard-nav__label">{item.label}</span>
              {active && <div className="dashboard-nav__indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardNav;
