import React from 'react';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

/**
 * Table showing major suppliers with the highest debt.
 * RESPONSIVE OPTIMIZED.
 */
const SuppliersDebtTable = ({ vendors = [] }) => {
  return (
    <Card className="overflow-hidden mb-6 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
      <CardHeader className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center gap-3">
          <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Proveedores con Mayor Deuda</h3>
          <span className="px-2 py-0.5 bg-[#137fec1a] text-[#137fec] text-[10px] font-black rounded-full uppercase tracking-widest">Top 100</span>
        </div>
        
        <div className="relative w-full sm:w-64 md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-[#137fec] transition-colors" />
          <Input 
            className="pl-10 h-10 text-xs md:text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg outline-none" 
            placeholder="Buscar proveedor..." 
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre del Proveedor</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">RFC / Tax ID</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Saldo Total</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monto Vencido</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Próximo Pago</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prioridad</th>
                <th className="px-4 md:px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vendors.map(vendor => (
                <tr key={vendor.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 md:px-6 py-4 font-bold text-slate-700 dark:text-slate-200 text-sm">{vendor.name}</td>
                  <td className="px-4 md:px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{vendor.rfc}</td>
                  <td className="px-4 md:px-6 py-4 font-black text-slate-900 dark:text-white text-sm">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(vendor.totalBalance)}
                  </td>
                  <td className={`px-4 md:px-6 py-4 font-black text-sm ${vendor.overdueAmount > 0 ? 'text-[#dc3545]' : 'text-slate-700 dark:text-slate-300'}`}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(vendor.overdueAmount)}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">{vendor.nextPayment}</td>
                  <td className="px-4 md:px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider 
                      ${vendor.priorityType === 'danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                        vendor.priorityType === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {vendor.priority}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#137fec]">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center p-4 md:p-6 gap-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-500 font-medium">Mostrando {vendors.length} de 128 proveedores</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" className="h-8 w-8 p-0" disabled>
            <ChevronLeft size={14} />
          </Button>
          <Button className="h-8 w-8 p-0 bg-[#137fec] text-white text-xs font-bold shadow-sm">1</Button>
          <Button variant="ghost" className="h-8 w-8 p-0 text-xs">2</Button>
          <Button variant="ghost" className="h-8 w-8 p-0 text-xs">3</Button>
          <Button variant="outline" className="h-8 w-8 p-0">
            <ChevronRight size={14} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SuppliersDebtTable;
