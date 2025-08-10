/**
 * Componente PurchaseSummary
 * Muestra el resumen completo de una compra antes de confirmarla
 * Incluye cálculos, información del proveedor y detalles de entrega
 */

import React from 'react';
import { 
  Building, 
  Package, 
  DollarSign, 
  Calendar, 
  Truck, 
  CreditCard,
  FileText,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { DELIVERY_METHODS, PAYMENT_TERMS } from '../constants/purchaseData';

const PurchaseSummary = ({ 
  summary, 
  theme = 'neo-brutalism',
  className = ''
}) => {
  const themeStyles = useThemeStyles(theme);
  const styles = themeStyles.styles || themeStyles;

  if (!summary) {
    return (
      <div className={`${styles.card('p-6')} ${className}`}>
        <div className="text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Resumen no disponible</p>
          <p className="text-sm">Completa la información de la compra</p>
        </div>
      </div>
    );
  }

  const {
    supplier,
    itemCount,
    totalQuantity,
    subtotal,
    tax,
    deliveryCost,
    total,
    expectedDelivery,
    paymentTerms,
    deliveryMethod,
    isValid
  } = summary;

  // Obtener información del método de entrega
  const deliveryInfo = DELIVERY_METHODS.find(method => method.id === deliveryMethod?.id);
  const paymentInfo = PAYMENT_TERMS.find(term => term.id === paymentTerms);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header del resumen */}
      <div className={styles.card('p-4')}>
        <h3 className={`${styles.cardHeader()} flex items-center`}>
          <FileText className="w-5 h-5 mr-2" />
          Resumen de Compra
        </h3>
        
        {isValid ? (
          <div className="mt-2 flex items-center text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            <span className="text-sm">Lista para crear</span>
          </div>
        ) : (
          <div className="mt-2 flex items-center text-orange-600">
            <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
            <span className="text-sm">Información incompleta</span>
          </div>
        )}
      </div>

      {/* Información del proveedor */}
      {supplier && (
        <div className={styles.card('p-4')}>
          <h4 className="font-medium text-gray-900 flex items-center mb-3">
            <Building className="w-4 h-4 mr-2" />
            Proveedor
          </h4>
          <div className="space-y-2 text-sm">
            <div className="font-medium">{supplier.name}</div>
            {supplier.contact_person && (
              <div className="flex items-center text-gray-600">
                <User className="w-3 h-3 mr-1" />
                {supplier.contact_person}
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center text-gray-600">
                <Mail className="w-3 h-3 mr-1" />
                {supplier.email}
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center text-gray-600">
                <Phone className="w-3 h-3 mr-1" />
                {supplier.phone}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resumen de productos */}
      <div className={styles.card('p-4')}>
        <h4 className="font-medium text-gray-900 flex items-center mb-3">
          <Package className="w-4 h-4 mr-2" />
          Productos
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Tipos de productos:</span>
            <span className="font-medium">{itemCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cantidad total:</span>
            <span className="font-medium">{totalQuantity} unidades</span>
          </div>
        </div>
      </div>

      {/* Cálculos financieros */}
      <div className={styles.card('p-4')}>
        <h4 className="font-medium text-gray-900 flex items-center mb-3">
          <DollarSign className="w-4 h-4 mr-2" />
          Cálculos
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>${subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">IVA (16%):</span>
            <span>${tax?.toFixed(2) || '0.00'}</span>
          </div>
          {deliveryCost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Envío:</span>
              <span>${deliveryCost?.toFixed(2) || '0.00'}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Información de entrega */}
      <div className={styles.card('p-4')}>
        <h4 className="font-medium text-gray-900 flex items-center mb-3">
          <Truck className="w-4 h-4 mr-2" />
          Entrega
        </h4>
        <div className="space-y-2 text-sm">
          {deliveryInfo && (
            <div className="flex justify-between">
              <span className="text-gray-600">Método:</span>
              <span>{deliveryInfo.name}</span>
            </div>
          )}
          {expectedDelivery && (
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha esperada:</span>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(expectedDelivery).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Términos de pago */}
      <div className={styles.card('p-4')}>
        <h4 className="font-medium text-gray-900 flex items-center mb-3">
          <CreditCard className="w-4 h-4 mr-2" />
          Pago
        </h4>
        <div className="space-y-2 text-sm">
          {paymentInfo && (
            <div className="flex justify-between">
              <span className="text-gray-600">Términos:</span>
              <span>{paymentInfo.name}</span>
            </div>
          )}
          {paymentInfo && paymentInfo.days > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Vencimiento:</span>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(Date.now() + paymentInfo.days * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Estado de validación */}
      {!isValid && (
        <div className={styles.card('p-4 border-orange-200 bg-orange-50')}>
          <div className="flex items-center text-orange-800">
            <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
            <span className="font-medium text-sm">Información pendiente</span>
          </div>
          <p className="text-xs text-orange-700 mt-1">
            Completa todos los campos requeridos para proceder con la compra.
          </p>
        </div>
      )}

      {/* Información adicional */}
      <div className="text-xs text-gray-500 text-center">
        <p>Los precios incluyen IVA</p>
        <p>Compra sujeta a confirmación del proveedor</p>
      </div>
    </div>
  );
};

export default PurchaseSummary;
