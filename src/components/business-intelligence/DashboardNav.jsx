import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  BarChart3, 
  Flame, 
  Package, 
  WalletCards,
  AlertCircle,
  History,
  FileText
} from 'lucide-react';

/**
 * DashboardNav - Contextual navigation for BI modules.
 * Shows different items based on the current module (Dashboard vs Receivables).
 */
const DashboardNav = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const isReceivablesModule = location.pathname.includes('receivables');

  const dashboardItems = [
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
      id: 'alerts',
      path: '/dashboard/alerts',
      label: t('dashboard.nav.alerts', 'Alertas'),
      icon: AlertCircle
    }
  ];

  const receivablesItems = [
    {
      id: 'receivables-home',
      path: '/dashboard/receivables',
      label: t('dashboard.nav.receivables', 'Dashboard CXC'),
      icon: WalletCards
    },
    {
      id: 'receivables-list',
      path: '/receivables/list',
      label: t('dashboard.nav.list', 'Listado Facturas'),
      icon: FileText
    },
    {
      id: 'overdue',
      path: '/receivables/overdue',
      label: t('dashboard.nav.overdue', 'Cuentas Vencidas'),
      icon: AlertCircle
    },
    {
      id: 'aging',
      path: '/receivables/aging-report',
      label: t('dashboard.nav.aging', 'Reporte Antigüedad'),
      icon: History
    }
  ];

  const navItems = isReceivablesModule ? receivablesItems : dashboardItems;

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavigation = (path, label) => {
    try {
      navigate(path);
    } catch (error) {
      toast.error(`Error al navegar a ${label}`);
    }
  };

  return (
    <nav className="dashboard-nav dashboard-nav__list">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path, item.label)}
            className={`dashboard-nav__item ${active ? 'dashboard-nav__item--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={18} className="dashboard-nav__icon" />
            <span className="dashboard-nav__label">{item.label}</span>
            {active && <div className="dashboard-nav__indicator" />}
          </button>
        );
      })}
    </nav>
  );
};

export default DashboardNav;
