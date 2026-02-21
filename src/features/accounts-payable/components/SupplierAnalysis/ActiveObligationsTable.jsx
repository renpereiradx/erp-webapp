import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Filter, 
  Download, 
  MoreHorizontal, 
  ChevronDown 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ActiveObligationsTable = ({ invoices, summary }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Atrasado':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800 font-black text-[10px] tracking-widest uppercase">Atrasado</Badge>;
      case 'En Proceso':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-black text-[10px] tracking-widest uppercase">En Proceso</Badge>;
      case 'Parcialmente Pagado':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-black text-[10px] tracking-widest uppercase">Parcialmente Pagado</Badge>;
      case 'Borrador':
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 font-black text-[10px] tracking-widest uppercase">Borrador</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 font-black text-[10px] tracking-widest uppercase">{status}</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden mb-8 group transition-all duration-500 hover:shadow-2xl">
      <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/20 transition-colors">
        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Obligaciones Activas</h4>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-4 h-10 uppercase tracking-widest">
            <Filter className="h-4 w-4" /> Filtrar
          </Button>
          <Button variant="ghost" className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-4 h-10 uppercase tracking-widest">
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-none">
              <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                ID Factura <ChevronDown className="h-3 w-3 inline-block ml-1 opacity-50" />
              </TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Emisión</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Monto Original</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Pendiente</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</TableHead>
              <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice, idx) => (
              <TableRow key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300 border-slate-100 dark:border-slate-800">
                <TableCell className="px-8 py-5 font-black text-blue-600 tracking-tight">{invoice.id}</TableCell>
                <TableCell className="px-8 py-5 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-tight">{invoice.date}</TableCell>
                <TableCell className="px-8 py-5 text-right font-black text-slate-700 dark:text-slate-200">${invoice.originalAmount.toLocaleString()}</TableCell>
                <TableCell className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">${invoice.pendingAmount.toLocaleString()}</TableCell>
                <TableCell className={`px-8 py-5 font-black tracking-tight ${invoice.isOverdue ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                  {invoice.dueDate}
                </TableCell>
                <TableCell className="px-8 py-5">
                  {getStatusBadge(invoice.status)}
                </TableCell>
                <TableCell className="px-8 py-5 text-center">
                  <Button variant="ghost" size="icon" className="text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all h-9 w-9">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-8 py-5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        <span className="opacity-70 group-hover:opacity-100 transition-opacity">Mostrando {invoices.length} de {summary.total} facturas activas</span>
        <div className="flex gap-2">
          <Button variant="outline" className="h-8 px-4 text-[10px] font-black bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-all active:scale-95 uppercase tracking-widest">
            Anterior
          </Button>
          <Button variant="outline" className="h-8 px-4 text-[10px] font-black bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-all active:scale-95 uppercase tracking-widest">
            Siguiente
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ActiveObligationsTable;
