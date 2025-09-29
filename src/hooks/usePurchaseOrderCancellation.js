import { useState } from 'react';
import { purchasePaymentService } from '@/services/purchasePaymentService';
import useAuthStore from '@/store/useAuthStore';

/**
 * Hook para cancelación de órdenes de compra
 * Realiza la cancelación definitiva con reversión de stock y pagos
 */
export const usePurchaseOrderCancellation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  const cancelOrder = async (request) => {
    setLoading(true);
    setError(null);

    try {
      // Agregar el user_id automáticamente si no se proporciona
      const requestData = {
        ...request,
        user_id: request.user_id || user?.id
      };

      const response = await purchasePaymentService.cancelPurchaseOrder(
        requestData.purchase_order_id,
        requestData
      );

      return response;
    } catch (err) {
      const errorMessage = err.message || 'Error al cancelar la orden de compra';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    cancelOrder,
    loading,
    error,
    clearError,
  };
};