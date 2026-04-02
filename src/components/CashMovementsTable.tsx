/**
 * Componente de tabla de movimientos de caja con datos enriquecidos (v3.0)
 * 
 * Migrated to TypeScript & Fluent Design System 2.0
 */

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Movement } from '@/store/useCashRegisterStore'
import { 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Receipt, 
  ShoppingCart,
  User,
  Banknote
} from 'lucide-react'

interface CashMovementsTableProps {
  movements: Movement[];
}

const CashMovementsTable: React.FC<CashMovementsTableProps> = ({ movements = [] }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getMovementDisplay = (type: string) => {
    const displays: Record<string, any> = {
      INCOME: {
        icon: <ArrowUp className='w-3.5 h-3.5' />,
        variant: 'success',
        label: 'Ingreso',
        colorClass: 'text-success bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800',
      },
      EXPENSE: {
        icon: <ArrowDown className='w-3.5 h-3.5' />,
        variant: 'destructive',
        label: 'Egreso',
        colorClass: 'text-error bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800',
      },
      ADJUSTMENT: {
        icon: <RefreshCw className='w-3.5 h-3.5' />,
        variant: 'info',
        label: 'Ajuste',
        colorClass: 'text-info bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800',
      },
    }
    return displays[type] || displays.ADJUSTMENT
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (movements.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-border-subtle'>
        <Banknote className='text-slate-300 mb-4 w-12 h-12' />
        <p className='text-xs font-black uppercase tracking-widest text-slate-400'>No se registran movimientos en este periodo</p>
      </div>
    )
  }

  return (
    <div className='rounded-2xl border border-border-subtle overflow-hidden bg-white dark:bg-slate-900 shadow-sm'>
      <div className='overflow-x-auto custom-scrollbar'>
        <Table>
          <TableHeader>
            <TableRow className='bg-slate-50/80 dark:bg-slate-800/50 border-b border-border-subtle'>
              <TableHead className='py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400'>Instante</TableHead>
              <TableHead className='py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400'>Tipo</TableHead>
              <TableHead className='py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400'>Concepto / Auditoría</TableHead>
              <TableHead className='py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right'>Monto</TableHead>
              <TableHead className='py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right'>Balance</TableHead>
              <TableHead className='py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400'>Responsable</TableHead>
              <TableHead className='py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400'>Relación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className='divide-y divide-border-subtle/30'>
            {movements.map(movement => {
              const display = getMovementDisplay(movement.movement_type)

              return (
                <TableRow key={movement.movement_id || movement.id} className='hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group'>
                  <TableCell className='py-4 px-6'>
                    <span className='font-mono text-xs font-black text-text-main'>{formatDate(movement.created_at)}</span>
                  </TableCell>

                  <TableCell className='py-4 px-6'>
                    <Badge variant={display.variant} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${display.colorClass}`}>
                      {display.icon}
                      {display.label}
                    </Badge>
                  </TableCell>

                  <TableCell className='py-4 px-6'>
                    <p className='font-bold text-sm text-text-main max-w-[240px] truncate group-hover:text-primary transition-colors' title={movement.concept}>
                      {movement.concept}
                    </p>
                  </TableCell>

                  <TableCell className='py-4 px-6 text-right'>
                    <span className={`font-mono text-sm font-black tabular-nums ${movement.movement_type === 'EXPENSE' ? 'text-error' : 'text-success'}`}>
                      {movement.movement_type === 'INCOME' ? '+' : '-'} {formatCurrency(movement.amount)}
                    </span>
                  </TableCell>

                  <TableCell className='py-4 px-6 text-right'>
                    <span className='font-mono text-sm font-black text-primary tabular-nums'>
                      {formatCurrency(movement.running_balance || 0)}
                    </span>
                  </TableCell>

                  <TableCell className='py-4 px-6'>
                    <div className='flex items-center gap-2'>
                      <div className='size-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-border-subtle shadow-inner'>
                        <User className='w-3.5 h-3.5' />
                      </div>
                      <span className='text-[11px] font-bold text-text-secondary'>{movement.user_full_name || movement.created_by_name}</span>
                    </div>
                  </TableCell>

                  <TableCell className='py-4 px-6'>
                    {movement as any && (movement as any).related_sale_id && (
                      <div className='flex flex-col gap-1 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30'>
                        <div className='flex items-center gap-1.5 text-blue-700 dark:text-blue-400'>
                          <Receipt className='w-3 h-3' />
                          <span className='text-[9px] font-black uppercase'>Venta {(movement as any).related_sale_id}</span>
                        </div>
                        {(movement as any).sale_client_name && (
                          <span className='text-[9px] text-blue-600/70 font-bold truncate'>Cli: {(movement as any).sale_client_name}</span>
                        )}
                      </div>
                    )}

                    {movement as any && (movement as any).related_purchase_id && (
                      <div className='flex flex-col gap-1 p-2 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30'>
                        <div className='flex items-center gap-1.5 text-purple-700 dark:text-purple-400'>
                          <ShoppingCart className='w-3 h-3' />
                          <span className='text-[9px] font-black uppercase'>Compra #{(movement as any).related_purchase_id}</span>
                        </div>
                        {(movement as any).purchase_supplier && (
                          <span className='text-[9px] text-purple-600/70 font-bold truncate'>Prov: {(movement as any).purchase_supplier}</span>
                        )}
                      </div>
                    )}

                    {!(movement as any).related_sale_id && !(movement as any).related_purchase_id && (
                      <span className='text-[9px] font-black text-slate-300 uppercase tracking-widest'>Manual / Sist.</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default CashMovementsTable
