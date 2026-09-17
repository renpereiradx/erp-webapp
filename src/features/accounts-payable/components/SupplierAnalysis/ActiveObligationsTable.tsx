import type { SupplierInvoiceRow, SupplierTableStats } from '../../types';

interface ActiveObligationsTableProps {
  invoices: SupplierInvoiceRow[];
  summary: SupplierTableStats;
}

/**
 * Main Data Grid: Active Obligations for a Supplier.
 * 100% STITCH FIDELITY - RESPONSIVE
 * H7 (FASE 5): fuera Filtrar/Exportar/paginación muerta y "more_horiz" por
 * fila — el endpoint trae TODAS las facturas del proveedor (sin paginación
 * server-side ni export; regla FE-2: toda afordancia funciona o desaparece).
 */
const ActiveObligationsTable = ({ invoices, summary }: ActiveObligationsTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Atrasado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-error/10 text-error whitespace-nowrap">Atrasado</span>;
      case 'En Proceso':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary whitespace-nowrap">En Proceso</span>;
      case 'Parcialmente Pagado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-warning/10 text-warning whitespace-nowrap">Parcial</span>;
      case 'Borrador':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-subtle text-on-surface-deep whitespace-nowrap">Borrador</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-subtle text-on-surface-deep whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <section className="bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden animate-in fade-in">
      <div className="px-4 md:px-8 py-4 md:py-5 border-b border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-muted/50 gap-4">
        <h4 className="text-base md:text-lg font-bold">Obligaciones Activas</h4>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-muted text-[10px] font-semibold text-on-surface-deep uppercase tracking-wider">
              <th className="px-4 md:px-8 py-4">Factura</th>
              <th className="px-4 py-4">Emisión</th>
              <th className="px-4 py-4 text-right">Monto</th>
              <th className="px-4 py-4 text-right">Saldo</th>
              <th className="px-4 py-4">Vencimiento</th>
              <th className="px-4 py-4">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-xs md:text-sm">
            {invoices.map((invoice, idx) => (
              <tr key={idx} className="hover:bg-surface-muted transition-colors">
                <td className="px-4 md:px-8 py-4 font-mono font-bold text-primary">{invoice.id}</td>
                <td className="px-4 py-4 font-mono text-on-surface-deep">{invoice.date}</td>
                <td className="px-4 py-4 text-right font-mono font-bold text-foreground tabular-nums">Gs. {invoice.originalAmount.toLocaleString("es-PY")}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-foreground tabular-nums">Gs. {invoice.pendingAmount.toLocaleString("es-PY")}</td>
                <td className={`px-4 py-4 font-mono font-bold ${invoice.isOverdue ? 'text-error' : 'text-on-surface-deep'}`}>
                  {invoice.dueDate}
                </td>
                <td className="px-4 py-4">
                  {getStatusBadge(invoice.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 md:px-8 py-4 bg-surface-muted text-xs md:text-sm text-on-surface-deep border-t border-border-subtle">
        <p>Mostrando {invoices.length} de {summary.total} facturas</p>
      </div>
    </section>
  );
};

export default ActiveObligationsTable;
