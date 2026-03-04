/**
 * Layout para la sección de Ajustes de Precios
 * Incluye sistema de tabs para navegar entre:
 * - Nuevo Ajuste (búsqueda y selección de productos)
 * - Historial Global (historial de todos los ajustes)
 */

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const PriceAdjustmentLayout = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header with Back Button and Tabs */}
      <header className='flex flex-col gap-6'>
        <div className='flex items-center gap-4'>
          <button
            className='p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors'
            onClick={() => navigate('/ajustes-producto')}
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <div className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
            <h1 className='text-2xl font-black text-text-main tracking-tighter uppercase'>
              Ajuste de Precios
            </h1>
            <p className='text-text-secondary text-xs font-medium uppercase tracking-widest'>
              {t('priceAdjustment.layout.description', 'Gestión de precios y seguimiento de cambios')}
            </p>
          </div>
        </div>

        {/* Sistema de tabs */}
        <nav className="flex border-b border-border-subtle" aria-label="Price adjustment sections">
          {tabs.map((tab) => (
            <NavLink
              key={tab.id}
              to={tab.path}
              end={tab.exact}
              className={({ isActive }) =>
                `px-6 py-3 text-sm font-bold transition-all border-b-2 uppercase tracking-widest ${
                  isActive 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-transparent text-text-secondary hover:text-text-main hover:bg-slate-50'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Contenido de la tab activa */}
      <div className="min-h-0">
        <Outlet />
      </div>
    </div>
  );
};

export default PriceAdjustmentLayout;
