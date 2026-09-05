// ===========================================================================
// TransfersPage (F.4 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Bandeja de transferencias entre sucursales: filtros por estado, badge de
// pendientes, detalle con acciones del workflow y creación (origen = sucursal
// activa, modelo depósito puro §4.6). Ruta: /transferencias, gated
// `transfers:read`; acciones gated `transfers:write` (backend re-valida por
// sucursal, F.3).
// ===========================================================================

import { useMemo, useState } from 'react'
import { ArrowRightLeft, Loader2, Plus } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { useBranch } from '@/contexts/BranchContext'
import { branchService } from '@/features/branches/services/branchService'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import CreateTransferModal from '../components/CreateTransferModal'
import TransferDetailModal from '../components/TransferDetailModal'
import { TRANSFERS_PAGE_SIZE, usePendingTransfersCount, useTransfersList } from '../hooks/useBranchTransfers'
import { TRANSFER_STATUSES, type BranchTransfer, type PreloadedTransferItem, type TransferStatusFilter } from '../types'

const STATUS_BADGE: Record<string, 'warning' | 'info' | 'success' | 'destructive' | 'secondary'> = {
  PENDING: 'warning',
  APPROVED: 'info',
  SHIPPED: 'info',
  IN_TRANSIT: 'info',
  RECEIVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
}

interface TransfersPageProps {
  /** F.5: precarga del CTA post-compra (abre el modal de creación). */
  initialPreloadedItems?: PreloadedTransferItem[]
  initialDestinationId?: number | null
}

const TransfersPage = ({ initialPreloadedItems, initialDestinationId }: TransfersPageProps) => {
  const { t } = useI18n()
  const { hasPermission } = useAuth()
  const { currentBranchId } = useBranch()

  const [statusFilter, setStatusFilter] = useState<TransferStatusFilter>('ALL')
  const [page, setPage] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<BranchTransfer | null>(null)

  const canWrite = hasPermission('transfers:write')
  const { data: pendingCount } = usePendingTransfersCount()

  const { data: listResponse, isLoading } = useTransfersList(statusFilter, page)
  const transfers = listResponse?.transfers ?? []
  const total = listResponse?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / TRANSFERS_PAGE_SIZE))

  const { data: branchesResponse } = useQuery({
    queryKey: ['branches-names'],
    queryFn: () => branchService.getBranches({ page_size: 100 }),
    staleTime: 1000 * 60 * 5,
  })
  const branchNameById = useMemo(() => {
    const branches = (branchesResponse as { branches?: Array<{ id: number; name: string }> })?.branches || []
    return new Map(branches.map((b) => [b.id, b.name]))
  }, [branchesResponse])

  const branchLabel = (transfer: BranchTransfer, which: 'source' | 'destination') => {
    if (which === 'source') {
      return transfer.source_branch_name || branchNameById.get(transfer.source_branch_id) || String(transfer.source_branch_id)
    }
    return (
      transfer.destination_branch_name ||
      branchNameById.get(transfer.destination_branch_id) ||
      String(transfer.destination_branch_id)
    )
  }

  const currentBranchName = currentBranchId !== null ? branchNameById.get(currentBranchId) : undefined

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <header className="mb-xl flex flex-col gap-1 border-l-4 border-primary pl-4">
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-md font-black uppercase leading-none tracking-tight text-foreground">
            {t('transfers.title', 'Transferencias')}
          </h1>
          <p className="text-body-md text-muted-foreground">
            {t('transfers.subtitle', 'Movimientos de stock entre sucursales con aprobación, envío y recepción.')}
          </p>
        </header>

        <div className="mb-md flex flex-wrap items-center justify-between gap-sm">
          <nav aria-label={t('transfers.filterLabel', 'Filtrar por estado')} className="flex flex-wrap items-center gap-xs">
            <button
              type="button"
              aria-pressed={statusFilter === 'ALL'}
              data-testid='transfers-filter-ALL'
              onClick={() => {
                setStatusFilter('ALL')
                setPage(1)
              }}
              className={`rounded-full px-md py-1 text-body-sm-bold transition-colors ${
                statusFilter === 'ALL' ? 'bg-primary text-on-primary' : 'bg-surface-muted text-on-surface-deep hover:text-foreground'
              }`}
            >
              {t('transfers.filterAll', 'Todas')}
            </button>
            {TRANSFER_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                data-testid={`transfers-filter-${status}`}
                aria-pressed={statusFilter === status}
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={`flex items-center gap-xs rounded-full px-md py-1 text-body-sm-bold transition-colors ${
                  statusFilter === status ? 'bg-primary text-on-primary' : 'bg-surface-muted text-on-surface-deep hover:text-foreground'
                }`}
              >
                {status}
                {status === 'PENDING' && (pendingCount ?? 0) > 0 && (
                  <span data-testid='transfers-pending-badge' className="rounded-full bg-error px-xs text-[10px] font-black text-white">{pendingCount}</span>
                )}
              </button>
            ))}
          </nav>
          {canWrite && (
            <Button data-testid='transfers-new-button' onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" />
              {t('transfers.new', 'Nueva Transferencia')}
            </Button>
          )}
        </div>

        <div className="overflow-hidden rounded-md border border-border-subtle bg-surface shadow-whisper">
          {isLoading ? (
            <div className="flex justify-center p-xl">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center gap-sm p-xl text-center">
              <ArrowRightLeft className="size-10 text-on-surface-deep" />
              <p className="text-body-md-bold text-foreground">{t('transfers.empty', 'Sin transferencias')}</p>
              <p className="max-w-md text-body-sm text-on-surface-deep">
                {t('transfers.emptyHint', 'Las transferencias entre sucursales aparecerán acá.')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('transfers.col.code', 'Código')}</TableHead>
                  <TableHead>{t('transfers.col.route', 'Ruta')}</TableHead>
                  <TableHead>{t('transfers.col.status', 'Estado')}</TableHead>
                  <TableHead>{t('transfers.col.date', 'Fecha')}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => (
                  <TableRow key={transfer.id} data-testid={`transfers-row-${transfer.id}`}>
                    <TableCell className="font-mono text-body-sm-bold">{transfer.transfer_code}</TableCell>
                    <TableCell>
                      <span className="text-body-sm text-foreground">
                        {branchLabel(transfer, 'source')} → {branchLabel(transfer, 'destination')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[transfer.status] ?? 'secondary'} size="sm" shape="square">
                        {transfer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-body-sm text-on-surface-deep">
                      {new Date(transfer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" data-testid={`transfers-view-${transfer.id}`} onClick={() => setSelectedTransfer(transfer)}>
                        {t('transfers.view', 'Ver')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {totalPages > 1 && (
          <nav aria-label={t('transfers.pagination', 'Paginación')} className="mt-md flex items-center justify-end gap-sm">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t('transfers.prevPage', 'Anterior')}
            </Button>
            <span className="text-body-sm text-on-surface-deep">
              {page} / {totalPages}
            </span>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              {t('transfers.nextPage', 'Siguiente')}
            </Button>
          </nav>
        )}
      </div>

      <CreateTransferModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        sourceBranchId={currentBranchId}
        sourceBranchName={currentBranchName}
        initialItems={initialPreloadedItems}
        initialDestinationId={initialDestinationId}
      />
      <TransferDetailModal transfer={selectedTransfer} open={selectedTransfer !== null} onOpenChange={(next) => !next && setSelectedTransfer(null)} />
    </div>
  )
}

export default TransfersPage
