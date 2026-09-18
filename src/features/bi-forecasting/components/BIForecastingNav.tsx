import { Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

/**
 * Nav del módulo de pronósticos (FASE 6: .tsx + tokens + i18n).
 */

interface BIForecastingNavProps {
  active?: string
}

const BIForecastingNav = ({ active }: BIForecastingNavProps) => {
  const { t } = useI18n();
  const tabs = [
    { id: 'dashboard', label: t('bi.forecast.nav.dashboard', 'Dashboard', {}), href: '/bi/pronosticos/dashboard' },
    { id: 'inventario', label: t('bi.forecast.nav.inventario', 'Inventario', {}), href: '/bi/pronosticos/inventario' },
    { id: 'ventas', label: t('bi.forecast.nav.ventas', 'Ventas', {}), href: '/bi/pronosticos/ventas' },
    { id: 'demanda', label: t('bi.forecast.nav.demanda', 'Demanda', {}), href: '/bi/pronosticos/demanda' },
    { id: 'ingresos', label: t('bi.forecast.nav.ingresos', 'Ingresos', {}), href: '/bi/pronosticos/ingresos' },
  ];

  return (
    <div className="flex items-center gap-md mb-xs border-b border-border-subtle pb-xs">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.href}
          className={`text-body-md-bold transition-colors pb-xs ${
            active === tab.id
              ? 'text-primary border-b-2 border-primary'
              : 'text-on-surface-deep hover:text-primary'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};

export default BIForecastingNav;
