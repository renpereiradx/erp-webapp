import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  CheckCircle,
  AlertCircle,
  Package,
  DollarSign,
  User,
  Calendar,
  FileText
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Hooks
import { useCancellationPreview } from '@/hooks/useCancellationPreview';
import { usePurchaseOrderCancellation } from '@/hooks/usePurchaseOrderCancellation';
import { useI18n } from '@/lib/i18n';

/**
 * Modal para cancelación de órdenes de compra con vista previa
 * Implementa el flujo completo: vista previa -> confirmación -> cancelación
 */
export const PurchaseOrderCancellationModal = ({
  isOpen,
  onClose,
  orderId,
  orderInfo = {},
  onCancellationComplete = () => {}
}) => {
  const { t } = useI18n();
  const { previewCancellation, loading: previewLoading, previewData, clearPreview } = useCancellationPreview();
  const { cancelOrder, loading: cancelLoading } = usePurchaseOrderCancellation();

  const [step, setStep] = useState('initial'); // 'initial', 'preview', 'confirm', 'completed'
  const [cancellationReason, setCancellationReason] = useState('');
  const [forceCancel, setForceCancel] = useState(false);
  const [result, setResult] = useState(null);

  // Reset modal state when opening (only once when modal opens)
  React.useEffect(() => {
    if (isOpen) {
      setStep('initial');
      setCancellationReason('');
      setForceCancel(false);
      setResult(null);
      clearPreview();
    }
  }, [isOpen]); // Removed clearPreview from dependencies

  const handleClose = () => {
    setStep('initial');
    setCancellationReason('');
    setForceCancel(false);
    setResult(null);
    clearPreview();
    onClose();
  };

  const handlePreview = async () => {
    try {
      await previewCancellation(orderId);
      setStep('preview');
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!previewData) return;

    try {
      console.log('🚀 Attempting to cancel order:', orderId, {
        cancellation_reason: cancellationReason || 'No reason provided',
        force_cancel: forceCancel,
      });

      const response = await cancelOrder({
        purchase_order_id: orderId,
        cancellation_reason: cancellationReason || 'No reason provided',
        force_cancel: forceCancel,
      });

      console.log('📋 Cancellation response:', response);

      // Adaptar la respuesta del backend para el frontend
      const adaptedResponse = {
        success: response.message === "Purchase cancelled" || response.success === true,
        message: response.message || 'Cancelación procesada',
        cancelled_order_id: orderId,
        ...response
      };

      setResult(adaptedResponse);
      setStep('completed');

      // Call completion callback in a separate try-catch to avoid affecting UI
      try {
        onCancellationComplete(adaptedResponse);
      } catch (callbackError) {
        console.error('Error in cancellation callback:', callbackError);
        // Don't affect the UI result, just log the callback error
      }
    } catch (error) {
      console.error('❌ Cancellation failed:', error);
      // Set error result to show in the UI
      setResult({
        success: false,
        message: error.message || 'Error al cancelar la orden'
      });
      setStep('completed');
    }
  };

  const renderInitialStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200">Confirmar Cancelación</h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            ¿Está seguro que desea cancelar la orden de compra #{orderId}?
          </p>
        </div>
      </div>

      {orderInfo && (
        <Card className="!bg-white !text-gray-900 !border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Información de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orderInfo.supplier_name && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{orderInfo.supplier_name}</span>
              </div>
            )}
            {orderInfo.total_amount && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-green-600">
                  ${orderInfo.total_amount.toLocaleString()}
                </span>
              </div>
            )}
            {orderInfo.order_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(orderInfo.order_date).toLocaleDateString()}</span>
              </div>
            )}
            {orderInfo.status && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <Badge variant={orderInfo.status === 'COMPLETED' ? 'success' : 'secondary'}>
                  {orderInfo.status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Esta acción analizará el impacto antes de proceder con la cancelación.
      </p>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handlePreview} disabled={previewLoading}>
          {previewLoading ? 'Analizando...' : 'Analizar Impacto'}
        </Button>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!previewData) return null;

    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Estado de la cancelación */}
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          previewData.purchase_info?.can_be_cancelled
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {previewData.purchase_info?.can_be_cancelled ? (
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          )}
          <div>
            <h3 className={`font-medium ${
              previewData.purchase_info?.can_be_cancelled ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {previewData.purchase_info?.can_be_cancelled
                ? 'La orden puede cancelarse'
                : 'Problemas detectados para la cancelación'}
            </h3>
            <p className={`text-sm ${
              previewData.purchase_info?.can_be_cancelled ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {previewData.purchase_info?.can_be_cancelled
                ? 'No se detectaron problemas que impidan la cancelación'
                : 'Se requiere revisión adicional o cancelación forzada'}
            </p>
          </div>
        </div>

        {/* Información de la orden */}
        <Card className="!bg-white !text-gray-900 !border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Información de la Orden</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">ID de Orden:</span> {previewData.purchase_info?.purchase_order_id || orderId}
              </div>
              <div>
                <span className="font-medium">Estado:</span>{' '}
                <Badge variant={previewData.purchase_info?.current_status === 'COMPLETED' ? 'success' : 'secondary'}>
                  {previewData.purchase_info?.current_status || 'Pendiente'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Total:</span>{' '}
                <span className="font-bold text-green-600">
                  ${(previewData.purchase_info?.total_amount || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-medium">Puede cancelarse:</span>{' '}
                <span className={previewData.purchase_info?.can_be_cancelled ? 'text-green-600' : 'text-red-600'}>
                  {previewData.purchase_info?.can_be_cancelled ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información sobre datos limitados */}
        {(!previewData.stock_impact || previewData.stock_impact.length === 0) &&
         (!previewData.impact_analysis || !previewData.recommendations || previewData.recommendations.length === 0) && (
          <Card className="!bg-blue-50 !text-blue-900 !border-blue-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <AlertCircle className="w-5 h-5" />
                Vista Previa Básica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-700">
                El endpoint está funcionando correctamente, pero los datos detallados (impacto en stock, análisis, recomendaciones)
                aún no están completamente implementados en el servidor. La funcionalidad básica de cancelación está disponible.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Impacto en Stock */}
        {previewData.stock_impact && previewData.stock_impact.length > 0 && (
          <Card className="!bg-white !text-gray-900 !border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Impacto en Stock ({previewData.stock_impact?.length || 0} productos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left p-2 font-medium">Producto</th>
                      <th className="text-center p-2 font-medium">Cant. a Revertir</th>
                      <th className="text-center p-2 font-medium">Stock Actual</th>
                      <th className="text-center p-2 font-medium">Stock Después</th>
                      <th className="text-center p-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewData.stock_impact || []).map((item, index) => (
                      <tr key={item.product_id || index} className="border-t">
                        <td className="p-2">
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-xs text-muted-foreground">{item.product_id}</div>
                        </td>
                        <td className="p-2 text-center">{item.quantity_to_revert}</td>
                        <td className="p-2 text-center">{item.current_stock}</td>
                        <td className="p-2 text-center">{item.stock_after_cancellation}</td>
                        <td className="p-2 text-center">
                          {item.sufficient_stock ? (
                            <Badge variant="success" className="text-xs">
                              Suficiente
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              Insuficiente
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Análisis de Impacto */}
        <Card className="!bg-white !text-gray-900 !border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle>Análisis de Impacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total de items:</span> {previewData.impact_analysis?.total_items || 0}
              </div>
              <div>
                <span className="font-medium">Productos con stock insuficiente:</span>{' '}
                <span className={(previewData.impact_analysis?.products_with_insufficient_stock || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                  {previewData.impact_analysis?.products_with_insufficient_stock || 0}
                </span>
              </div>
              {previewData.impact_analysis?.requires_payment_reversal && (
                <div>
                  <span className="font-medium">Pagos a cancelar:</span> {previewData.impact_analysis?.payments_to_cancel || 0}
                </div>
              )}
              <div>
                <span className="font-medium">Requiere cancelación forzada:</span>{' '}
                <span className={previewData.impact_analysis?.requires_force_cancel ? 'text-red-600' : 'text-green-600'}>
                  {previewData.impact_analysis?.requires_force_cancel ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recomendaciones */}
        {previewData.recommendations && previewData.recommendations.length > 0 && (
          <Card className="!bg-white !text-gray-900 !border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle>Recomendaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {(previewData.recommendations || []).map((rec, index) => (
                  <li key={index} className="text-muted-foreground">{rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Advertencias */}
        {previewData.warnings && previewData.warnings.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-800 dark:text-amber-200 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Advertencias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
                {(previewData.warnings || []).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setStep('initial')}>
            Volver
          </Button>
          <Button onClick={() => setStep('confirm')}>
            {previewData.purchase_info?.can_be_cancelled ? 'Proceder a Cancelar' : 'Forzar Cancelación'}
          </Button>
        </div>
      </div>
    );
  };

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-red-800 dark:text-red-200">Confirmación Final</h3>
          <p className="text-sm text-red-700 dark:text-red-300">
            Esta acción es irreversible. La orden #{orderId} será cancelada definitivamente.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="cancellation-reason" className="!text-gray-900 font-medium">Motivo de cancelación</Label>
          <Textarea
            id="cancellation-reason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Ingrese el motivo de la cancelación..."
            rows={3}
            className="mt-1 !bg-white !text-gray-900 !border-gray-300"
          />
        </div>

        {!previewData?.purchase_info?.can_be_cancelled && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="force-cancel"
              checked={forceCancel}
              onChange={(e) => setForceCancel(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="force-cancel" className="text-sm">
              Forzar cancelación (se detectaron problemas que impiden la cancelación normal)
            </Label>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end !text-gray-900">
        <Button variant="outline" onClick={() => setStep('preview')} className="!bg-white !text-gray-900 !border-gray-300">
          Volver a Vista Previa
        </Button>
        <Button
          variant="destructive"
          onClick={handleConfirmCancellation}
          disabled={cancelLoading}
          className="!bg-red-600 !text-white !border-red-600 hover:!bg-red-700"
        >
          {cancelLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
        </Button>
      </div>
    </div>
  );

  const renderCompletedStep = () => {
    if (!result) return null;

    return (
      <div className="space-y-4">
        {result.success ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-200">Cancelación Completada</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                La orden #{result.cancelled_order_id || orderId} ha sido cancelada exitosamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">Error en la Cancelación</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{result.message}</p>
            </div>
          </div>
        )}

        {result.success && result.cancellation_details && (
          <Card className="!bg-white !text-gray-900 !border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle>Resumen de Cancelación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Items revertidos:</span> {result.cancellation_details.items_reverted}
                </div>
                <div>
                  <span className="font-medium">Stock actualizado:</span> {result.cancellation_details.stock_items_updated} productos
                </div>
                <div>
                  <span className="font-medium">Pagos cancelados:</span> {result.cancellation_details.payments_cancelled}
                </div>
                <div>
                  <span className="font-medium">Fecha:</span>{' '}
                  {new Date(result.cancellation_details.cancelled_at).toLocaleString()}
                </div>
              </div>
              {result.cancellation_details.force_cancel_used && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">Cancelación forzada utilizada</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      </div>
    );
  };

  const getModalTitle = () => {
    switch (step) {
      case 'initial':
        return `Cancelar Orden de Compra #${orderId}`;
      case 'preview':
        return `Vista Previa de Cancelación - Orden #${orderId}`;
      case 'confirm':
        return `Confirmar Cancelación - Orden #${orderId}`;
      case 'completed':
        return result?.success ? 'Cancelación Completada' : 'Error en Cancelación';
      default:
        return `Cancelar Orden de Compra #${orderId}`;
    }
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 'initial':
        return renderInitialStep();
      case 'preview':
        return renderPreviewStep();
      case 'confirm':
        return renderConfirmStep();
      case 'completed':
        return renderCompletedStep();
      default:
        return renderInitialStep();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col !bg-white !text-gray-900 !border-gray-300 !shadow-xl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between !text-gray-900">
            {getModalTitle()}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Modal para cancelar una orden de compra con vista previa del impacto
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto !text-gray-900">
          {renderCurrentStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
