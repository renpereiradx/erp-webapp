import React from 'react';
import { useTheme } from 'next-themes';
import { X, AlertTriangle } from 'lucide-react';

const DeleteSupplierModal = ({ isOpen, onClose, supplier, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-card p-6 rounded-lg w-full max-w-md text-center border border-border">
        <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-4">¿Estás seguro?</h2>
        <p className="mb-6">Estás a punto de eliminar al proveedor "{supplier?.name}". Esta acción no se puede deshacer.</p>
        <div className="flex justify-center space-x-4">
          <button onClick={onClose} className="px-4 py-2 rounded bg-secondary text-secondary-foreground" disabled={loading}>Cancelar</button>
          <button onClick={() => onConfirm(supplier)} className="px-4 py-2 rounded bg-destructive text-destructive-foreground" disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSupplierModal;
