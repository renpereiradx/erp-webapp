import React from 'react';
import { Link } from 'react-router-dom';

const BIForecastingNav = ({ active }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', href: '/bi/pronosticos/dashboard' },
    { id: 'inventario', label: 'Inventario', href: '/bi/pronosticos/inventario' },
    { id: 'ventas', label: 'Ventas', href: '/bi/pronosticos/ventas' },
    { id: 'demanda', label: 'Demanda', href: '/bi/pronosticos/demanda' },
    { id: 'ingresos', label: 'Ingresos', href: '/bi/pronosticos/ingresos' }
  ];

  return (
    <div className="flex items-center gap-6 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          to={tab.href}
          className={`text-sm font-bold transition-colors ${
            active === tab.id 
              ? 'text-primary border-b-2 border-primary pb-1' 
              : 'text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary pb-1'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};

export default BIForecastingNav;
