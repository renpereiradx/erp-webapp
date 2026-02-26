import React from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'

/**
 * Tabla de facturas recientes para el dashboard.
 * Recibe datos transformados del endpoint GET /receivables
 */
const RecentInvoicesTable = ({ invoices = [] }) => {
  const { t } = useI18n()

  if (!invoices.length) {
    return (
      <div className='p-12 text-center bg-surface rounded-xl border border-dashed border-border-subtle'>
        <p className='text-sm font-bold text-text-secondary uppercase tracking-widest'>No hay facturas recientes</p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-border-subtle">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Factura #</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Cliente</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right px-6">Saldo</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-center">Días Vencidos</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Estado</TableHead>
              <TableHead className='w-10'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv, idx) => (
              <TableRow key={inv.id || idx} className="group hover:bg-slate-50 transition-colors border-border-subtle">
                <TableCell className="font-black text-sm text-text-main">{inv.invoiceId}</TableCell>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <div
                      className='size-8 rounded-lg flex items-center justify-center text-xs font-black bg-blue-50 text-primary'
                    >
                      {inv.client?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{inv.client}</span>
                  </div>
                </TableCell>
                <TableCell className='text-right px-6'>
                  <span className="text-sm font-black text-text-main">{formatPYG(inv.balance)}</span>
                </TableCell>
                <TableCell className='text-center'>
                  <span className={`text-sm font-black ${inv.daysOverdue > 0 ? 'text-error' : 'text-text-main'}`}>
                    {inv.daysOverdue} d
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      inv.statusColor === 'danger' ? 'bg-error text-white' : 
                      inv.statusColor === 'warning' ? 'bg-warning text-black' : 
                      inv.statusColor === 'success' ? 'bg-success text-white' :
                      'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell className='text-right'>
                  <Button variant='ghost' size='sm' className="text-primary font-black uppercase tracking-widest text-[10px] hover:bg-blue-50">
                    Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default RecentInvoicesTable
