import React from 'react';
// useTheme removido para MVP - sin hooks problemáticos
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DeleteClientModal = ({ isOpen, onClose, client, onConfirm, loading }) => {
  // Para MVP - tema fijo sin hooks problemáticos
  const theme = 'default';
  const isNeoBrutalism = theme?.includes?.('neo-brutalism');

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div style={getModalStyles()} className="p-6 rounded-lg w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-4">¿Estás seguro?</h2>
        <p className="mb-6">Estás a punto de eliminar al cliente "{client?.name}". Esta acción no se puede deshacer.</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={onClose} variant={isNeoBrutalism ? 'secondary' : 'secondary'} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(client)} variant="destructive" disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteClientModal;
