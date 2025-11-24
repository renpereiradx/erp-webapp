/**
 * Layout para la sección de Ajustes de Precios
 * Incluye sistema de tabs para navegar entre:
 * - Nuevo Ajuste (búsqueda y selección de productos)
 * - Historial Global (historial de todos los ajustes)
 */

import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import '@/styles/scss/layouts/_price-adjustment-layout.scss';

const PriceAdjustmentLayout = () => {
  const { t } = useI18n();
  const location = useLocation();

  const tabs = [
    {
      id: 'new-adjustment',
      label: t('priceAdjustment.tabs.newAdjustment', 'Nuevo Ajuste'),
      path: '/ajustes-precios',
      exact: true,
    },
    {
      id: 'history',
      label: t('priceAdjustment.tabs.history', 'Historial Global'),
      path: '/ajustes-precios/historial',
      exact: false,
    },
  ];

  return (
    <div className="price-adjustment-layout">
      {/* Sistema de tabs */}
      <nav className="price-adjustment-layout__tabs" aria-label="Price adjustment sections">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            end={tab.exact}
            className={({ isActive }) =>
              `price-adjustment-layout__tab ${isActive ? 'price-adjustment-layout__tab--active' : ''}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Descripción debajo de las tabs */}
      <p className="price-adjustment-layout__description">
        {t('priceAdjustment.layout.description', 'Administra los precios de tus productos y consulta el historial de cambios')}
      </p>

      {/* Contenido de la tab activa */}
      <div className="price-adjustment-layout__content">
        <Outlet />
      </div>
    </div>
  );
};

export default PriceAdjustmentLayout;
