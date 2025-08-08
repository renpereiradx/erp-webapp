/**
 * Componente para gestionar ítems de venta con diseño minimalista
 * Incluye funcionalidades de agregar, editar y eliminar productos de la venta
 */

import React, { useState } from 'react';
import { Plus, Minus, X, Package, DollarSign, Hash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrutalistBadge } from '@/components/ui/Card';
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
      <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 space-y-4">
        <h3 className="font-black uppercase text-sm flex items-center">
          <Package className="w-4 h-4 mr-2" />
          Agregar Producto
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold">{product.name}</span>
                      <div className="flex space-x-2 ml-4">
                        <BrutalistBadge color="green" className="text-xs">
                          ${product.price}
                        </BrutalistBadge>
                        <BrutalistBadge 
                          color={product.stock > 10 ? "blue" : product.stock > 0 ? "orange" : "red"} 
                          className="text-xs"
                        >
                          Stock: {product.stock}
                        </BrutalistBadge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-2">
            <div className="flex items-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickQuantity(Math.max(1, quickQuantity - 1))}
                className="border-r-2 border-black rounded-none h-full"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={quickQuantity}
                onChange={(e) => setQuickQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="border-none shadow-none text-center w-16 h-full rounded-none font-bold"
                min="1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickQuantity(quickQuantity + 1)}
                className="border-l-2 border-black rounded-none h-full"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            
            <Button
              variant="green"
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
      <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="border-b-4 border-black p-4">
          <h3 className="font-black uppercase text-sm flex items-center justify-between">
            <span className="flex items-center">
              <Hash className="w-4 h-4 mr-2" />
              Productos ({items.length})
            </span>
            <BrutalistBadge color="blue">
              {items.reduce((sum, item) => sum + item.quantity, 0)} unidades
            </BrutalistBadge>
          </h3>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-bold uppercase text-sm">
                No hay productos agregados
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Selecciona productos de la lista superior
              </p>
            </div>
          ) : (
            <div className="divide-y-2 divide-black">
              {items.map((item, index) => {
                const stock = getProductAvailability(item.id);
                const isLowStock = item.quantity > stock;
                
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 hover:bg-gray-50 transition-colors",
                      isLowStock && "bg-red-50 border-l-4 border-l-red-500"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {/* Información del producto */}
                      <div className="flex-1">
                        <h4 className="font-black text-sm uppercase">
                          {item.name}
                        </h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <BrutalistBadge color="green" className="text-xs">
                            ${item.price?.toFixed(2) || '0.00'}
                          </BrutalistBadge>
                          <span className="text-xs text-gray-600 font-bold">
                            × {item.quantity}
                          </span>
                          {isLowStock && (
                            <BrutalistBadge color="red" className="text-xs">
                              ¡Stock insuficiente! ({stock} disponible)
                            </BrutalistBadge>
                          )}
                        </div>
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className="border-r-2 border-black rounded-none h-8 w-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-black text-sm w-10 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="border-l-2 border-black rounded-none h-8 w-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Precio total del ítem */}
                        <BrutalistBadge color="blue" className="text-sm">
                          ${((item.price || 0) * item.quantity).toFixed(2)}
                        </BrutalistBadge>

                        {/* Botón eliminar */}
                        <Button
                          variant="red"
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
          <div className="border-t-4 border-black p-4 bg-gray-50 space-y-2">
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
            
            <div className="border-t-2 border-black pt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-black uppercase flex items-center">
                  <DollarSign className="w-5 h-5 mr-1" />
                  Total:
                </span>
                <BrutalistBadge color="green" className="text-lg">
                  ${total.toFixed(2)}
                </BrutalistBadge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleItemsManager;
