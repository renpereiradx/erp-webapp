import React from 'react'
import { Card } from '@/components/ui/card'
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
 * Tabla optimizada para esfuerzos de cobranza.
 */
const OverdueTable = ({ accounts = [] }) => {
  const { t } = useI18n()

  // Defensive check: ensure accounts is always an array
  const safeAccounts = Array.isArray(accounts) ? accounts : []

  return (
    <div className='flex-1 space-y-6'>
      <div className='bg-surface p-4 rounded-xl border border-border-subtle shadow-sm flex flex-col md:flex-row items-center justify-between gap-4'>
        <div className='relative flex-1 w-full'>
          <div className='absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary'>
            <span className='material-symbols-outlined text-[20px]'>search</span>
          </div>
          <input
            className='w-full pl-10 pr-4 h-10 border border-border-subtle rounded-lg bg-background-light/50 focus:bg-white transition-all text-sm font-medium outline-none'
            placeholder={t('common.searching', 'Buscando...')}
          />
        </div>
        <div className='flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0'>
          <Button variant='secondary' size='sm' className="h-10 px-4 bg-white border-border-subtle shadow-sm font-black uppercase tracking-widest text-[10px]">
            <span>{t('receivables.overdue.table.status')}: Todos</span>
            <span className='material-symbols-outlined text-[18px] ml-2'>expand_more</span>
          </Button>
        </div>
      </div>

      <div className='bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden'>
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-border-subtle">
              <TableHead className='w-12 text-center'>
                <input type='checkbox' className='rounded-sm border-slate-300' />
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                {t('receivables.overdue.table.client_invoice')}
              </TableHead>
              <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right px-6'>
                {t('receivables.overdue.table.amount')}
              </TableHead>
              <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-center'>
                {t('receivables.overdue.table.overdue')}
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                {t('receivables.overdue.table.status')}
              </TableHead>
              <TableHead className='text-right px-6 w-32'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeAccounts.map((acc, idx) => (
              <TableRow key={idx} className='group hover:bg-slate-50 transition-colors border-border-subtle'>
                <TableCell className="text-center">
                  <input type='checkbox' className='rounded-sm border-slate-300' />
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-3'>
                    <div
                      className='size-10 rounded-lg flex items-center justify-center text-[10px] font-black bg-blue-50 text-primary shadow-sm border border-blue-100'
                    >
                      {acc.code}
                    </div>
                    <div className='min-w-0 flex flex-col space-y-0.5'>
                      <span className='text-sm font-black text-text-main truncate group-hover:text-primary transition-colors uppercase tracking-tight'>
                        {acc.client}
                      </span>
                      <span className='text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60'>
                        #{acc.id}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className='text-right px-6 font-black text-sm text-text-main'>
                  {formatPYG(acc.amount)}
                </TableCell>
                <TableCell className='text-center'>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${acc.priority === 'High' ? 'bg-red-50 text-error' : 'bg-amber-50 text-warning'}`}
                  >
                    {acc.days} d
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${acc.priority === 'High' ? 'bg-error text-white' : acc.priority === 'Medium' ? 'bg-warning text-black' : 'bg-success text-white'}`}
                  >
                    {acc.priority === 'High'
                      ? 'Crítica'
                      : acc.priority === 'Medium'
                        ? 'Importante'
                        : 'Baja'}
                  </Badge>
                </TableCell>
                <TableCell className='text-right px-6'>
                  <div className='flex items-center justify-end gap-1'>
                    <Button variant='ghost' size='icon' className="size-8 rounded-full text-text-secondary hover:text-primary hover:bg-blue-50" title='Llamar'>
                      <span className='material-symbols-outlined text-[18px]'>call</span>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8 rounded-full text-text-secondary hover:text-success hover:bg-green-50'
                      title='WhatsApp'
                    >
                      <span className='material-symbols-outlined text-[18px]'>chat</span>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8 rounded-full text-text-secondary hover:text-primary hover:bg-blue-50'
                      title='Email'
                    >
                      <span className='material-symbols-outlined text-[18px]'>mail</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default OverdueTable
