import { useState } from 'react';
import { purchasePaymentService } from '@/services/purchasePaymentService';

/**
 * Hook para vista previa de cancelación de órdenes de compra
 * Permite analizar el impacto de cancelar una orden sin realizar cambios reales
 */
export const useCancellationPreview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const previewCancellation = async (orderId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await purchasePaymentService.getCancellationPreview(orderId);

      setPreviewData(response);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Error al obtener vista previa de cancelación';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearPreview = () => {
    setPreviewData(null);
    setError(null);
  };

  return {
    previewCancellation,
    loading,
    error,
    previewData,
    clearPreview,
  };
};
