/**
 * PurchasePaymentModal - Wave 3 Lazy Component
 * Modal lazy para procesar pagos
 * Solo se carga cuando es necesario
 */

import React, { memo, useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PurchasePaymentModal = ({ purchase, onClose, onSuccess }) => {
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      onSuccess?.(purchase);
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Procesar Pago
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="font-medium">Orden:</label>
            <div className="text-sm text-gray-600">#{purchase.id}</div>
          </div>
          
          <div>
            <label className="font-medium">Total a pagar:</label>
            <div className="text-lg font-bold text-green-600">${purchase.total}</div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1"
            >
              {processing ? 'Procesando...' : 'Procesar Pago'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(PurchasePaymentModal);
