import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, X } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';

interface SalesCartGridProps {
  items: any[];
  onEditItem: (item: any) => void;
  onRemoveItem: (id: string) => void;
  getItemBaseUnitPrice: (item: any) => number;
  getItemLineDiscount: (item: any) => number;
  getItemLineTotal: (item: any) => number;
}

export const SalesCartGrid: React.FC<SalesCartGridProps> = ({
  items,
  onEditItem,
  onRemoveItem,
  getItemBaseUnitPrice,
  getItemLineDiscount,
  getItemLineTotal
}) => {
  return (
    <div className="overflow-x-auto">
      {/* Desktop Table View */}
      <table className="w-full text-sm hidden md:table">
        <thead>
          <tr className="border-b bg-surface-container-low">
            <th className="text-left py-3 px-4 text-label-caps text-on-surface-variant rounded-tl-md">ID</th>
            <th className="text-left py-3 px-4 text-label-caps text-on-surface-variant">Producto</th>
            <th className="text-right py-3 px-4 text-label-caps text-on-surface-variant">Cant.</th>
            <th className="text-right py-3 px-4 text-label-caps text-on-surface-variant">Precio</th>
            <th className="text-right py-3 px-4 text-label-caps text-on-surface-variant">Desc.</th>
            <th className="text-right py-3 px-4 text-label-caps text-on-surface-variant">Total</th>
            <th className="w-12 rounded-tr-md"></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-12 text-slate-400 font-medium">Carrito vacío - Busca un producto arriba</td></tr>
          ) : (
            items.map(item => (
              <tr key={item.id} className={cn("border-b transition-colors", item.isFromPendingSale ? "bg-surface-container opacity-60 hover:opacity-100 grayscale-[0.2]" : "hover:bg-surface-container-low")}>
                <td className="py-3 px-4 text-outline font-data-mono">{item.productId || '-'}</td>
                <td className="py-3 px-4 text-body-md-bold text-on-surface">
                  {item.isFromPendingSale && <Badge className="mr-2 bg-surface-variant text-on-surface-variant hover:bg-surface-variant border-none text-[9px] uppercase rounded-[4px]">Procesado</Badge>}
                  {item.name}
                  <div className='text-[10px] font-normal text-outline mt-0.5'>
                    Unidad: {item.unit}
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-data-mono">
                  {formatNumber(item.quantity)} <span className='text-[10px] font-normal text-outline ml-1'>{item.unit}</span>
                </td>
                <td className="py-3 px-4 text-right text-on-surface-variant font-data-mono">{formatCurrency(getItemBaseUnitPrice(item))}</td>
                <td className="py-3 px-4 text-right text-error font-data-mono">-{formatCurrency(getItemLineDiscount(item))}</td>
                <td className="py-3 px-4 text-right font-data-mono font-bold text-on-surface">{formatCurrency(getItemLineTotal(item))}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditItem(item)}
                      disabled={item.isFromPendingSale}
                      className="size-8 text-outline hover:text-primary hover:bg-primary/10 rounded-button"
                    >
                      <MoreVertical size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.id)}
                      disabled={item.isFromPendingSale}
                      className="size-8 text-outline hover:text-error hover:bg-error-container rounded-button"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-medium text-sm">Carrito vacío</div>
        ) : (
          items.map(item => (
            <div key={item.id} className={cn("py-4 space-y-3 px-2 transition-all", item.isFromPendingSale && "opacity-60 grayscale-[0.2] bg-slate-50/50")}>
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">#{item.productId || '-'}</p>
                  <h4 className="font-bold text-slate-800 leading-tight">
                    {item.isFromPendingSale && <Badge className="mr-1.5 bg-slate-200 text-slate-600 border-none text-[8px] uppercase align-middle">P</Badge>}
                    {item.name}
                  </h4>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEditItem(item)}
                    disabled={item.isFromPendingSale}
                    className="size-8 rounded-full border-slate-200 text-slate-500"
                  >
                    <MoreVertical size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={item.isFromPendingSale}
                    className="size-8 rounded-full border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-100"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-lg border border-slate-100/50">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Cant.</p>
                  <p className="text-xs font-black text-slate-700">{item.quantity} {item.unit}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Unitario</p>
                  <p className="text-xs font-bold text-slate-700">{formatCurrency(getItemBaseUnitPrice(item))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Total Línea</p>
                  <p className="text-xs font-black text-primary">{formatCurrency(getItemLineTotal(item))}</p>
                </div>
              </div>

              {getItemLineDiscount(item) > 0 && (
                <div className="flex items-center justify-between px-2 text-[10px] font-bold bg-red-50/50 p-1.5 rounded-md mt-2">
                  <span className="text-slate-500 uppercase">Descuento Aplicado</span>
                  <span className="text-red-600">-{formatCurrency(getItemLineDiscount(item))}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
