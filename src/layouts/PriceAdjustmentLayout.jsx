/**
 * Layout para la sección de Ajustes de Precios
 * Incluye sistema de tabs para navegar entre:
 * - Nuevo Ajuste (búsqueda y selección de productos)
 * - Historial Global (historial de todos los ajustes)
 * Alineado a DESIGN.md: escala tipográfica semántica, tokens de color,
 * sin clases genéricas (§1, §3, §8).
 */

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

const PriceAdjustmentLayout = () => {
  const { t } = useI18n();

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
    <div className="flex flex-col animate-in fade-in">
      {/* Header con tabs */}
      <header className="flex flex-col gap-md">
        <div>
          <h1 className="text-headline-lg text-foreground">
            {t('priceAdjustment.layout.title', 'Ajuste de Precios')}
          </h1>
          <p className="mt-xs text-body-md text-on-surface-deep">
            {t('priceAdjustment.layout.description', 'Gestión de precios y seguimiento de cambios')}
          </p>
        </div>

        {/* Sistema de tabs */}
        <nav
          className="flex border-b border-divider"
          aria-label={t('priceAdjustment.layout.navLabel', 'Secciones de ajustes de precios')}
        >
          {tabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              end={tab.exact}
              className={({ isActive }) =>
                `px-md py-sm text-body-sm-bold border-b-2 -mb-px transition-colors duration-150 ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-deep hover:text-foreground'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Contenido de la tab activa */}
      <div className="mt-lg min-h-0">
        <Outlet />
      </div>
    </div>
  );
};

export default PriceAdjustmentLayout;
