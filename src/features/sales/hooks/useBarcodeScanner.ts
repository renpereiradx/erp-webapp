import { useState, useCallback, RefObject } from 'react';
import { saleService } from '@/services/saleService';
import { CartItem } from '@/types/cart'; // Assuming CartItem is exported or defined somewhere. If not, we will need to create/import it.
// We will type the callback parameters

interface UseBarcodeScannerProps {
  currentBranchId: number | null;
  toast: any;
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  searchInputRef?: RefObject<HTMLInputElement>;
  onSuccess?: () => void;
}

export const useBarcodeScanner = ({
  currentBranchId,
  toast,
  setItems,
  searchInputRef,
  onSuccess
}: UseBarcodeScannerProps) => {
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (isScanningBarcode) return;
    
    setIsScanningBarcode(true);
    const scanToast = toast.loading('Buscando producto por código de barras...');
    
    try {
      const response = await saleService.salesScan(barcode, currentBranchId || undefined);
      
      if (response?.success && response.data) {
        const scanResult = response.data;
        const decoded = scanResult.decoded_barcode;
        const isVariable = !!scanResult.is_variable_measure;
        const quantity = isVariable ? Number(decoded.quantity || 1) : 1;
        const price = Number(scanResult.price_per_unit || 0);
        
        const cartItem = {
          id: isVariable 
            ? `VAR-${decoded.product_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            : `${decoded.product_id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productId: decoded.product_id,
          name: scanResult.product_name || 'Producto Escaneado',
          quantity,
          price: price,
          originalPrice: price,
          stock: Number(scanResult.stock_quantity || 0),
          discount: 0,
          discountType: 'amount',
          discountInput: 0,
          discountReason: '',
          taxRate: Number(scanResult.subtotal) > 0 
            ? Number((Number(scanResult.tax_amount) / Number(scanResult.subtotal)).toFixed(2)) 
            : 0.10,
          unit: decoded.unit || 'unit',
        };
        
        setItems(prev => {
          if (isVariable) {
            return [...prev, cartItem];
          } else {
            const existingIndex = prev.findIndex(item => item.productId === cartItem.productId && !item.reserve_id);
            if (existingIndex >= 0) {
              return prev.map((item, index) => 
                index === existingIndex 
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              );
            } else {
              return [...prev, cartItem];
            }
          }
        });
        
        toast.dismiss(scanToast);
        toast.success(`Agregado: ${scanResult.product_name} (${quantity} ${decoded.unit || 'unit'})`);
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.dismiss(scanToast);
        toast.error(response?.error || 'Producto no encontrado por código de barras');
      }
    } catch (error: any) {
      toast.dismiss(scanToast);
      console.error('Error al escanear código de barras:', error);
      toast.error(error?.message || 'Error al buscar el código de barras');
    } finally {
      setIsScanningBarcode(false);
      setTimeout(() => {
        if (searchInputRef?.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isScanningBarcode, currentBranchId, toast, setItems, onSuccess, searchInputRef]);

  return {
    isScanningBarcode,
    handleBarcodeScan
  };
};
