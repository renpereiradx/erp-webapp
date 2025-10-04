/**
 * Modal de Vista Previa y Reversión de Ventas
 * Implementa REVERT_SALE_API.md
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, XCircle, CheckCircle, Package, CreditCard, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/Input';
import saleService from '@/services/saleService';

const SaleReversionModal = ({ isOpen, onClose, saleId, onReversionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Cargar vista previa cuando se abre el modal
  useEffect(() => {
    if (isOpen && saleId) {
      loadPreview();
    } else {
      // Resetear estado cuando se cierra
      setPreview(null);
      setError(null);
      setReason('');
      setShowConfirmation(false);
    }
  }, [isOpen, saleId]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await saleService.previewSaleCancellation(saleId);

      if (response.success) {
        setPreview(response);
      } else {
        setError(response.message || 'Error al cargar vista previa');
      }
    } catch (err) {
      console.error('Error loading preview:', err);
      setError(err.message || 'Error al cargar vista previa de reversión');
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async () => {
    if (!reason.trim()) {
      setError('Debes ingresar una razón para la reversión');
      return;
    }

    setReverting(true);
    setError(null);

    try {
      const response = await saleService.revertSale(saleId, reason);

      if (response.success) {
        // Notificar éxito
        if (onReversionComplete) {
          onReversionComplete(response);
        }
        onClose();
      } else {
        setError(response.message || 'Error al revertir la venta');
      }
    } catch (err) {
      console.error('Error reverting sale:', err);

      // Manejar errores específicos del backend
      let errorMessage = 'Error al revertir la venta';

      if (err.response?.data) {
        const responseData = err.response.data;

        if (responseData.error_code === 'SALE_NOT_FOUND') {
          errorMessage = 'Venta no encontrada';
        } else if (responseData.error_code === 'ALREADY_CANCELLED') {
          errorMessage = 'La venta ya está cancelada';
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setReverting(false);
      setShowConfirmation(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <Card
        className="w-full max-w-4xl m-4 bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="bg-white border-b sticky top-0 z-10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Vista Previa de Reversión de Venta
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-900">{error}</div>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-gray-600">Cargando vista previa...</p>
            </div>
          )}

          {/* Preview Content */}
          {!loading && preview && (
            <>
              {/* Información de la Venta */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Información de la Venta
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">ID de Venta</div>
                    <div className="font-medium">{preview.sale?.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Estado</div>
                    <Badge variant={preview.sale?.status === 'PAID' ? 'success' : 'secondary'}>
                      {preview.sale?.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Monto Total</div>
                    <div className="font-medium text-lg">
                      ₲{preview.sale?.total_amount?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Fecha de Venta</div>
                    <div className="font-medium">
                      {new Date(preview.sale?.sale_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Productos a Revertir */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Productos a Revertir ({preview.products?.length || 0})
                </h3>
                <div className="space-y-2">
                  {preview.products?.map((product, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{product.product_name}</div>
                          <div className="text-sm text-gray-600">
                            ID: {product.product_id} • Tipo: {product.product_type}
                          </div>
                          <div className="text-sm mt-2">
                            Cantidad: {product.quantity} × ₲{product.unit_price?.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-2">Acciones</div>
                          {product.will_restore_stock && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              ✓ Restaurar stock
                            </Badge>
                          )}
                          {product.will_revert_reserve && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 mt-1">
                              ✓ Revertir reserva
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Reservas a Manejar */}
              {preview.reserves && preview.reserves.length > 0 && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Reservas a Manejar ({preview.reserves.length})
                    </h3>
                    <div className="space-y-2">
                      {preview.reserves.map((reserve, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-blue-50">
                          <div className="font-medium">Reserva #{reserve.id}</div>
                          <div className="text-sm text-gray-600">
                            Estado actual: {reserve.current_status} → Nuevo estado: {reserve.new_status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Pagos a Reembolsar */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Pagos a Reembolsar ({preview.payments?.length || 0})
                </h3>
                <div className="space-y-2">
                  {preview.payments?.map((payment, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Pago #{payment.payment_id}</div>
                          <div className="text-sm text-gray-600">
                            Fecha: {new Date(payment.payment_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ₲{payment.amount_received?.toLocaleString()}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Resumen */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Resumen de Reversión
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {preview.summary?.total_products || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Productos</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {preview.summary?.stock_movements || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Movimientos Stock</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {preview.summary?.reserves_to_handle || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Reservas</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ₲{preview.summary?.total_refund?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Total Reembolso</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Formulario de Reversión */}
              {!showConfirmation ? (
                <div>
                  <Label htmlFor="reason" className="text-sm font-medium mb-2 block">
                    Razón de la Reversión *
                  </Label>
                  <Input
                    id="reason"
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ej: Cliente solicitó cancelación por error en cantidad"
                    className="mb-4"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onClose}
                      disabled={reverting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => setShowConfirmation(true)}
                      disabled={!reason.trim()}
                    >
                      Continuar con Reversión
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-orange-900 mb-2">
                          ⚠️ Confirmar Reversión
                        </div>
                        <div className="text-sm text-orange-800 space-y-1">
                          <p>Esta acción es <strong>irreversible</strong> y realizará lo siguiente:</p>
                          <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                            <li>Cambiará el estado de la venta a CANCELADA</li>
                            <li>Restaurará el stock de {preview.summary?.stock_movements} productos</li>
                            {preview.summary?.reserves_to_handle > 0 && (
                              <li>Revertirá {preview.summary.reserves_to_handle} reservas</li>
                            )}
                            <li>Marcará {preview.summary?.payments_to_refund} pagos como REEMBOLSADOS</li>
                            <li>Registrará la razón: "{reason}"</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowConfirmation(false)}
                      disabled={reverting}
                    >
                      Volver
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleRevert}
                      disabled={reverting}
                    >
                      {reverting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Revirtiendo...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Reversión
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaleReversionModal;
