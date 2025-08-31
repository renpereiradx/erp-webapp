/**
 * StatusBadge simplificado para MVP - Sin hooks problemáticos
 * Versión básica que funciona sin dependencias de contexto
 */

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const StatusBadge = ({
  active = false,
  label,
  showIcon = true,
  className = '',
  ...props
}) => {
  const text = label ?? (active ? 'Activo' : 'Inactivo');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
        active 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      } ${className}`}
      aria-label={active ? 'Activo' : 'Inactivo'}
      {...props}
    >
      {showIcon && (active ? 
        <CheckCircle className="w-3 h-3" /> : 
        <XCircle className="w-3 h-3" />
      )}
      <span>{text}</span>
    </span>
  );
};

export default StatusBadge;