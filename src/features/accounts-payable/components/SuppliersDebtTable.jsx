import React from 'react';
import { Search, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

/**
 * Table showing major suppliers with the highest debt.
 * Includes search, priority labels and actions.
 */
const SuppliersDebtTable = ({ vendors = [] }) => {
  return (
    <Card className="card overflow-hidden mb-6 payables-table-container">
      <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="payables-table-card__title">Proveedores con Mayor Deuda</h3>
          <span className="payables-table-card__badge">Top 100</span>
        </div>
        
        <div className="payables-table-card__search-container">
          <Search className="payables-table-card__search-icon" />
          <Input 
            className="payables-table-card__search-input" 
            placeholder="Buscar proveedor..." 
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="high-density-table">
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
                  <TableCell className="payables-table-card__vendor-name">{vendor.name}</TableCell>
                  <TableCell className="payables-table-card__rfc">{vendor.rfc}</TableCell>
                  <TableCell className="payables-table-card__amount">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(vendor.totalBalance)}
                  </TableCell>
                  <TableCell className={`payables-table-card__overdue-amount ${vendor.overdueAmount > 0 ? 'payables-table-card__overdue-amount--danger' : ''}`}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(vendor.overdueAmount)}
                  </TableCell>
                  <TableCell>{vendor.nextPayment}</TableCell>
                  <TableCell>
                    <span className={`payment-list__status payment-list__status--${vendor.priorityType || 'neutral'}`}>
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
      </CardContent>
      
      <CardFooter className="flex justify-between items-center p-4">
        <span className="payables-table-card__pagination-info">Mostrando {vendors.length} de 128 proveedores</span>
        <div className="payables-table-card__pagination-actions">
          <Button variant="secondary" className="btn--icon-only h-8 w-8" disabled>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="primary" className="btn--icon-only h-8 w-8">1</Button>
          <Button variant="ghost" className="btn--icon-only h-8 w-8">2</Button>
          <Button variant="ghost" className="btn--icon-only h-8 w-8">3</Button>
          <Button variant="secondary" className="btn--icon-only h-8 w-8">
            <ChevronRight size={16} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SuppliersDebtTable;
