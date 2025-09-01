/**
 * Componente para gestionar ítems de venta con diseño minimalista
 * Incluye funcionalidades de agregar, editar y eliminar productos de la venta
 */

import React, { useState } from 'react';
import { Plus, Minus, X, Package, DollarSign, Hash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Eliminamos dependencias específicas brutalist
// import { BrutalistBadge } from '@/components/ui/Card';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { cn } from '@/lib/utils';

const SaleItemsManager = ({ 
  items = [], 
  onItemsChange, 
  products = [],
  onAddItem,
  onUpdateQuantity,
  onRemoveItem,
  total = 0,
  subtotal = 0,
  tax = 0,
  discount = 0
}) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const { styles, isMaterial, isFluent } = useThemeStyles();
  const [quickQuantity, setQuickQuantity] = useState(1);

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (product && onAddItem) {
      onAddItem(product, quickQuantity);
      setSelectedProduct('');
      setQuickQuantity(1);
    }
  };

  const handleQuantityChange = (itemId, change) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(itemId, change);
    }
  };

  const handleRemoveItem = (itemId) => {
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };

  const getProductAvailability = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.stock : 0;
  };

  return (
    <div className="space-y-4">
      {/* Agregar productos */}
      <div className={styles.card(isMaterial ? 'elevated' : 'elevated', { density: 'compact', extra: 'p-4 space-y-4' })}>
        <h3 className="text-sm font-medium flex items-center">
          <Package className="w-4 h-4 mr-2" />
          Agregar Producto
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className={styles.input(isMaterial ? 'outlined' : 'subtle', { density: 'compact', extra: 'min-w-full' })}>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold">{product.name}</span>
                      <div className="flex space-x-2 ml-4 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">${product.price}</span>
                        <span className={cn('px-2 py-0.5 rounded-md font-medium',
                          product.stock === 0 ? 'bg-destructive/10 text-destructive' :
                          product.stock < 5 ? 'bg-yellow-500/10 text-yellow-700' :
                          'bg-secondary/30 text-secondary-foreground'
                        )}>
                          Stock: {product.stock}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2">
            <div className={cn('flex items-center bg-background rounded-md border px-1', isMaterial ? 'md-input md-input-outlined' : 'fluent-input fluent-input-subtle')}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickQuantity(Math.max(1, quickQuantity - 1))}
                className="h-full px-2"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={quickQuantity}
                onChange={(e) => setQuickQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="border-0 shadow-none text-center w-14 h-full font-medium bg-transparent focus-visible:ring-0 focus-visible:outline-none"
                min="1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickQuantity(quickQuantity + 1)}
                className="h-full px-2"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            
            <Button
              variant={isMaterial ? 'filled' : 'primary'}
              onClick={handleAddProduct}
              disabled={!selectedProduct}
              className="px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de ítems */}
      <div className={styles.card(isMaterial ? 'outlined-soft' : 'outline-soft', { density: 'compact' })}>
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center">
              <Hash className="w-4 h-4 mr-2" />
              Productos ({items.length})
            </span>
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
              {items.reduce((sum, item) => sum + item.quantity, 0)} unidades
            </span>
          </h3>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium text-sm">
                No hay productos agregados
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Selecciona productos de la lista superior
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item, index) => {
                const stock = getProductAvailability(item.id);
                const isLowStock = item.quantity > stock;
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 hover:bg-accent/5 transition-colors relative",
                      isLowStock && "bg-red-50/60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {/* Información del producto */}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {item.name}
                        </h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-medium">
                            ${item.price?.toFixed(2) || '0.00'}
                          </span>
                          <span className="text-xs text-gray-600 font-medium">
                            × {item.quantity}
                          </span>
                          {isLowStock && (
                            <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-xs font-medium">
                              ¡Stock insuficiente! ({stock} disponible)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center space-x-3">
                        <div className={cn('flex items-center bg-background rounded-md border px-1', isMaterial ? 'md-input md-input-outlined' : 'fluent-input fluent-input-subtle')}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium text-sm w-10 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Precio total del ítem */}
                        <span className="px-2 py-0.5 rounded bg-secondary/40 text-secondary-foreground text-sm font-medium">
                          ${((item.price || 0) * item.quantity).toFixed(2)}
                        </span>

                        {/* Botón eliminar */}
                        <Button
                          variant={isMaterial ? 'destructive' : 'destructive'}
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="w-8 h-8 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen de totales */}
        {items.length > 0 && (
          <div className="border-t p-4 bg-muted/20 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold uppercase">Subtotal:</span>
              <span className="font-black">${subtotal.toFixed(2)}</span>
            </div>
            
            {tax > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold uppercase">IVA (16%):</span>
                <span className="font-black">${tax.toFixed(2)}</span>
              </div>
            )}
            
            {discount > 0 && (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span className="font-bold uppercase">Descuento:</span>
                <span className="font-black">-${discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium flex items-center">
                  <DollarSign className="w-5 h-5 mr-1" />
                  Total:
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-lg">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleItemsManager;
