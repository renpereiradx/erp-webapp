
import React from 'react';
import { useTheme } from 'next-themes';
import { X, AlertTriangle } from 'lucide-react';

const DeleteClientModal = ({ isOpen, onClose, client, onConfirm, loading }) => {
  const { theme } = useTheme();
  const isNeoBrutalism = theme.includes('neo-brutalism');

  if (!isOpen) return null;

  const getModalStyles = () => {
    if (isNeoBrutalism) return {
        background: 'var(--background)',
        border: '4px solid var(--border)',
        boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
    };
    return {
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    };
  };

  const getButtonStyles = (variant = 'primary') => {
    if (isNeoBrutalism) return {
        primary: {
            background: 'var(--brutalist-pink)',
            color: '#fff',
            border: '3px solid var(--border)',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        },
        secondary: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '3px solid var(--border)',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        }
    }[variant];
    return {
        primary: { background: 'var(--destructive)', color: 'var(--destructive-foreground)' },
        secondary: { background: 'var(--secondary)', color: 'var(--secondary-foreground)' }
    }[variant];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div style={getModalStyles()} className="p-6 rounded-lg w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-4">¿Estás seguro?</h2>
        <p className="mb-6">Estás a punto de eliminar al cliente "{client?.name}". Esta acción no se puede deshacer.</p>
        <div className="flex justify-center space-x-4">
          <button onClick={onClose} style={getButtonStyles('secondary')} className="px-4 py-2 rounded" disabled={loading}>
            Cancelar
          </button>
          <button onClick={() => onConfirm(client)} style={getButtonStyles('primary')} className="px-4 py-2 rounded" disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteClientModal;
