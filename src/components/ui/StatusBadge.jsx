import React from 'react';
import { useTheme } from 'next-themes';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * StatusBadge
 * Badge de estado consistente con los tokens del tema.
 * - Activo -> success
 * - Inactivo -> destructive
 * Respeta Neo-Brutalism (bordes rectos, uppercase, borde grueso) y otros temas (pill, radio completo).
 */
const StatusBadge = ({
  active = false,
  label,
  showIcon = true,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme?.includes('neo-brutalism');

  const background = active ? 'var(--success)' : 'var(--destructive)';
  const color = active ? 'var(--primary-foreground)' : 'var(--destructive-foreground)';

  const style = {
    background,
    color,
    border: isNeoBrutalism ? '3px solid var(--border)' : 'none',
    borderRadius: isNeoBrutalism ? '0px' : '9999px',
    textTransform: isNeoBrutalism ? 'uppercase' : 'none',
    fontWeight: isNeoBrutalism ? 900 : 600,
    fontSize: '0.75rem',
    padding: isNeoBrutalism ? '8px 12px' : '4px 10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 'fit-content',
  };

  const text = label ?? (active ? (isNeoBrutalism ? 'ACTIVO' : 'Activo') : (isNeoBrutalism ? 'INACTIVO' : 'Inactivo'));

  return (
    <span
      aria-label={active ? 'Activo' : 'Inactivo'}
      style={style}
      className={className}
      {...props}
    >
      {showIcon && (active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />)}
      <span>{text}</span>
    </span>
  );
};

export default StatusBadge;
