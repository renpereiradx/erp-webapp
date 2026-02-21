import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Download, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal,
  RefreshCcw,
  Columns
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { invoicesMasterData } from '../features/accounts-payable/data/invoicesMockData';

/**
 * Invoices Master List Page.
 * RESPONSIVE OPTIMIZED - High fidelity maintained.
 */
const InvoicesMasterList = () => {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'Lista Maestra de Facturas | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="invoices-master p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* Breadcrumbs - Hidden on tiny screens */}
      <nav className="hidden sm:flex items-center gap-2 text-xs text-slate-500 mb-4">
        <span>Home</span>
        <span className="opacity-50">/</span>
        <span>Finanzas</span>
        <span className="opacity-50">/</span>
        <span className="font-semibold text-slate-900 dark:text-white">Facturas</span>
      </nav>

      {/* Header Section - Responsive stack */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Lista Maestra de Facturas</h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona y rastrea todas las facturas de proveedores y estados de pago.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-4 text-xs font-semibold">
            <Download size={16} />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden text-[10px]">CSV</span>
          </Button>
          <Button className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-4 bg-[#137fec] text-white text-xs font-semibold">
            <Plus size={16} />
            <span>Nueva Factura</span>
          </Button>
        </div>
      </header>

      {/* Filter Panel - Optimized for mobile */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6 md:mb-8">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Buscar</label>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#137fec] transition-colors" size={16} />
            <Input 
              placeholder="Proveedor o factura..." 
              className="pl-10 h-10 text-xs md:text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Estado</label>
          <select className="h-10 px-3 text-xs md:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-[#137fec]/20 outline-none">
            <option>Todos los Estados</option>
            <option>Vencida</option>
            <option>Pendiente</option>
            <option>Pagada</option>
            <option>Parcial</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Prioridad</label>
          <select className="h-10 px-3 text-xs md:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:ring-2 focus:ring-[#137fec]/20 outline-none">
            <option>Todas las Prioridades</option>
            <option>ALTA</option>
            <option>MEDIA</option>
            <option>BAJA</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Rango de Fechas</label>
          <div className="flex items-center gap-2">
            <Input type="date" className="h-10 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-1" />
            <span className="text-slate-400 font-bold">-</span>
            <Input type="date" className="h-10 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-1" />
          </div>
        </div>
      </section>

      {/* Data Grid Container */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <div className="text-xs md:text-sm text-slate-500 font-medium">
            Mostrando <strong>1-{invoicesMasterData.invoices.length}</strong> de <strong>1,248</strong>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#137fec]" title="Actualizar">
              <RefreshCcw size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#137fec]" title="Configurar Columnas">
              <Columns size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table className="w-full text-left border-collapse min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-none">
                  <TableHead className="w-12 px-4 py-4">
                    <input type="checkbox" className="rounded border-slate-300 text-[#137fec] focus:ring-[#137fec]" />
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">ID Factura</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Proveedor</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Fecha</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Vencimiento</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4 text-right">Importe Total</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4 text-right">Pendiente</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4 text-center">Estado</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesMasterData.invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800">
                    <TableCell className="px-4 py-4">
                      <input type="checkbox" className="rounded border-slate-300 text-[#137fec] focus:ring-[#137fec]" />
                    </TableCell>
                    <TableCell className="py-4">
                      <button 
                        onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                        className="text-[#137fec] font-bold hover:underline"
                      >
                        #{invoice.id}
                      </button>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-bold text-[#137fec]">
                          {invoice.vendor.substring(0, 1)}
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{invoice.vendor}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm text-slate-600 dark:text-slate-400 py-4">{invoice.orderDate}</TableCell>
                    <TableCell className="text-xs md:text-sm text-slate-600 dark:text-slate-400 py-4">{invoice.dueDate}</TableCell>
                    <TableCell className="py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell className={`py-4 text-right font-bold ${invoice.pendingAmount > 0 && invoice.status === 'Vencida' ? 'text-[#dc3545]' : 'text-slate-900 dark:text-white'}`}>
                      {formatCurrency(invoice.pendingAmount)}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider 
                        ${invoice.statusType === 'danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          invoice.statusType === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          invoice.statusType === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#137fec]">
                        <MoreHorizontal size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter className="px-4 md:px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Filas por página:</span>
            <select defaultValue="20" className="bg-transparent border-none focus:ring-0 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-xs text-slate-500 font-medium order-2 sm:order-1">Página 1 de 63</span>
            <div className="flex items-center gap-1 order-1 sm:order-2">
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
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InvoicesMasterList;
