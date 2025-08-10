import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Package, DollarSign, Calendar, Tag, AlertTriangle } from 'lucide-react';
import { useThemeStyles } from '@/hooks/useThemeStyles';

const CompactProductDetailModal = ({ product, isOpen, onClose }) => {
  const styles = useThemeStyles();
  
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${styles.card()} shadow-lg`}>
        <DialogHeader className="pb-2">
          <DialogTitle className={`text-lg flex items-center ${
            styles.isNeoBrutalism ? 'font-black uppercase' : 'font-semibold'
          }`}>
            <Package className="w-5 h-5 mr-2" />
            {product.name}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
          </DialogClose>
        </DialogHeader>

        <div className="space-y-3">
          {/* Información básica - compacta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`p-2 rounded ${styles.card('bg-gray-50')}`}>
              <div className="flex items-center mb-1">
                <Tag className="w-3 h-3 mr-1 text-gray-600" />
                <span className="text-xs font-medium text-gray-600">Código</span>
              </div>
              <p className="font-medium text-xs">{product.code}</p>
            </div>

            <div className={`p-2 rounded ${styles.card('bg-gray-50')}`}>
              <div className="flex items-center mb-1">
                <Package className="w-3 h-3 mr-1 text-gray-600" />
                <span className="text-xs font-medium text-gray-600">Stock</span>
              </div>
              <p className="font-medium text-xs">{product.stock} {product.unit}</p>
            </div>

            <div className={`p-2 rounded ${styles.card('bg-gray-50')}`}>
              <div className="flex items-center mb-1">
                <DollarSign className="w-3 h-3 mr-1 text-gray-600" />
                <span className="text-xs font-medium text-gray-600">Precio</span>
              </div>
              <p className="font-bold text-green-600 text-xs">
                ${product.supplier_price || product.price}
              </p>
            </div>

            <div className={`p-2 rounded ${styles.card('bg-gray-50')}`}>
              <span className="text-xs font-medium text-gray-600">Categoría</span>
              <Badge variant="outline" className="mt-1 text-xs h-5">
                {product.category}
              </Badge>
            </div>
          </div>

          {/* Descripción */}
          {product.description && (
            <div className={`p-2 rounded ${styles.card('bg-blue-50 border-blue-200')}`}>
              <p className="text-xs font-medium text-blue-800 mb-1">Descripción</p>
              <p className="text-xs text-blue-700">{product.description}</p>
            </div>
          )}

          {/* Alertas compactas */}
          {product.stock <= 10 && (
            <div className="flex items-center p-2 bg-orange-50 border border-orange-200 rounded text-xs">
              <AlertTriangle className="w-3 h-3 text-orange-600 mr-1" />
              <span className="text-orange-800">Stock bajo</span>
            </div>
          )}

          {/* Información adicional */}
          {(product.min_order_quantity || product.expiration_date) && (
            <div className="text-xs text-gray-600 space-y-1">
              {product.min_order_quantity && (
                <p>• Cantidad mínima de pedido: {product.min_order_quantity}</p>
              )}
              {product.expiration_date && (
                <p className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Vence: {new Date(product.expiration_date).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompactProductDetailModal;
