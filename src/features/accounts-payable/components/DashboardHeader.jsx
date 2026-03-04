import React from 'react';
import { Bell, Share2, Clock } from 'lucide-react';

/**
 * Header for the Accounts Payable Dashboard.
 * Polished to match Stitch perfectly.
 */
const DashboardHeader = ({ lastUpdate }) => {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2">
      <div className="animate-in slide-in-from-left duration-700">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Resumen de Cuentas por Pagar
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center font-medium">
          <Clock className="w-4 h-4 mr-1.5 text-primary/70" />
          Última actualización: <span className="ml-1 text-slate-700 dark:text-slate-300">{lastUpdate}</span>
        </p>
      </div>
      <div className="flex items-center gap-3 animate-in slide-in-from-right duration-700">
        <button className="flex items-center px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md active:scale-95">
          <Bell className="w-4.5 h-4.5 mr-2" />
          Configurar Alertas
        </button>
        <button className="flex items-center px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-md hover:shadow-lg active:scale-95 shadow-primary/20">
          <Share2 className="w-4.5 h-4.5 mr-2" />
          Exportar Informe
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
