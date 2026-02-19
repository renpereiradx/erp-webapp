import React from 'react';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

/**
 * Table showing major suppliers with the highest debt.
 * Includes search, priority labels and actions.
 */
const SuppliersDebtTable = ({ vendors = [] }) => {
  return (
    <Card className="overflow-hidden mb-6 payables-table-container">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg dark:text-white text-center md:text-left">Proveedores con Mayor Deuda</h3>
          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-semibold text-slate-500 uppercase tracking-wider">Top 100</span>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            className="pl-10" 
            placeholder="Buscar proveedor..." 
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Proveedor</TableHead>
              <TableHead>RFC / Tax ID</TableHead>
              <TableHead>Saldo Total</TableHead>
              <TableHead>Monto Vencido</TableHead>
              <TableHead>Próximo Pago</TableHead>
              <TableHead>Estado Prioridad</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map(vendor => (
              <TableRow key={vendor.id}>
                <TableCell className="font-semibold">{vendor.name}</TableCell>
                <TableCell className="text-slate-500 font-mono text-xs">{vendor.rfc}</TableCell>
                <TableCell className="font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(vendor.totalBalance)}
                </TableCell>
                <TableCell className={`font-bold ${vendor.overdueAmount > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(vendor.overdueAmount)}
                </TableCell>
                <TableCell>{vendor.nextPayment}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    vendor.priorityType === 'danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                    vendor.priorityType === 'warning' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                    vendor.priorityType === 'info' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {vendor.priority}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
        <span className="text-xs text-slate-500">Mostrando {vendors.length} de 128 proveedores</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="primary" size="sm" className="h-8 w-8 p-0">1</Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">2</Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">3</Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SuppliersDebtTable;
