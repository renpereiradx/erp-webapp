import React from 'react';
import { AlertTriangle, Server, Wrench } from 'lucide-react';

/**
 * Payment API Status Component
 * Shows informative messages when Payment API endpoints are not available
 */
const PaymentApiStatus = ({
  title = "Sistema de Pagos No Disponible",
  message = "Los endpoints de Payment API no han sido implementados en el backend.",
  type = "warning", // "warning", "error", "info"
  showIcon = true,
  className = ""
}) => {

  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-500',
          IconComponent: AlertTriangle
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-500',
          IconComponent: Server
        };
      default: // warning
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: 'text-amber-500',
          IconComponent: Wrench
        };
    }
  };

  const styles = getStyles();
  const IconComponent = styles.IconComponent;

  return (
    <div className={`border rounded-lg p-6 ${styles.container} ${className}`}>
      <div className="flex items-start space-x-4">
        {showIcon && (
          <div className="flex-shrink-0">
            <IconComponent className={`w-6 h-6 ${styles.icon}`} />
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {title}
          </h3>

          <p className="text-sm mb-4">
            {message}
          </p>

          <div className="text-xs space-y-2">
            <div>
              <strong>Endpoints requeridos:</strong>
            </div>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code>GET /currencies</code> - Lista de monedas</li>
              <li><code>GET /payment-methods</code> - Métodos de pago</li>
              <li><code>GET /exchange-rate/currency/{'{id}'}</code> - Tipos de cambio</li>
            </ul>

            <div className="pt-2">
              <strong>Documentación:</strong> Ver <code>docs/api/PAYMENT_API.md</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentApiStatus;