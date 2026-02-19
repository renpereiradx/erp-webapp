import React from 'react';
import { Bell, Share2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Header for the Accounts Payable Dashboard.
 * Displays title, last update time and global actions.
 */
const DashboardHeader = ({ lastUpdate }) => {
  return (
    <header className="payables-dashboard__header">
      <div>
        <h1 className="payables-dashboard__title">
          Resumen de Cuentas por Pagar
        </h1>
        <p className="payables-dashboard__subtitle">
          <Clock className="w-4 h-4" />
          Última actualización: {lastUpdate}
        </p>
      </div>
      <div className="payables-dashboard__actions">
        <Button variant="secondary" className="gap-2">
          <Bell className="w-4 h-4" />
          Configurar Alertas
        </Button>
        <Button variant="primary" className="gap-2 shadow-sm">
          <Share2 className="w-4 h-4" />
          Exportar Informe
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
