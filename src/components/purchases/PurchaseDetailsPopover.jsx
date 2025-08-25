/**
 * PurchaseDetailsPopover - Wave 3 Lazy Component
 * Componente lazy para mostrar detalles expandidos de compra
 * Solo se carga cuando es necesario
 */

import React, { memo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PurchaseDetailsPopover = ({ purchase, onClose }) => {
  return (
    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border rounded-lg shadow-lg z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Detalles de Compra</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">ID:</span> {purchase.id}
        </div>
        <div>
          <span className="font-medium">Proveedor:</span> {purchase.supplier?.name || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Total:</span> ${purchase.total}
        </div>
        <div>
          <span className="font-medium">Items:</span> {purchase.items?.length || 0}
        </div>
        {purchase.notes && (
          <div>
            <span className="font-medium">Notas:</span> {purchase.notes}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(PurchaseDetailsPopover);
