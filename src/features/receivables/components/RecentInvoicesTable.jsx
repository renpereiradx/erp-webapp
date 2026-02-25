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
      <div className='text-center py-8 text-tertiary'>
        <span className='material-symbols-outlined text-3xl mb-2'>inbox</span>
        <p className='text-sm'>No hay facturas recientes</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Factura #</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead className='text-right'>Saldo</TableHead>
          <TableHead className='text-center'>Días Vencidos</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className='w-10'></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv, idx) => (
          <TableRow key={inv.id || idx}>
            <TableCell className='col-id'>{inv.invoiceId}</TableCell>
            <TableCell>
              <div className='col-customer'>
                <div
                  className='customer-avatar'
                  style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                >
                  {inv.client?.charAt(0) || '?'}
                </div>
                <span>{inv.client}</span>
              </div>
            </TableCell>
            <TableCell className='text-right font-mono font-bold'>
              {formatPYG(inv.balance)}
            </TableCell>
            <TableCell className='text-center font-bold'>
              {inv.daysOverdue} d
            </TableCell>
            <TableCell>
              <span
                className={`status-pill status-pill--${inv.statusColor || 'warning'}`}
              >
                {inv.status}
              </span>
            </TableCell>
            <TableCell className='text-right'>
              <Button variant='link' size='sm'>
                Ver
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default RecentInvoicesTable
