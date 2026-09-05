// ===========================================================================
// useBranchTransfers (F.4 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Hooks de react-query para la bandeja y el ciclo de vida de transferencias.
// Todas las mutaciones invalidan la lista y el badge de pendientes.
// ===========================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { branchTransferService } from '@/services/branchTransferService'
import type { CreateBranchTransferRequest, UpdateBranchTransferStatusRequest } from '@/types'
import type { TransferStatusFilter } from '../types'
import { extractTransfers } from '../types'

export const TRANSFERS_PAGE_SIZE = 20

export function useTransfersList(status: TransferStatusFilter, page: number) {
  return useQuery({
    queryKey: ['branch-transfers', status, page],
    queryFn: async () => {
      const response = await branchTransferService.getTransfers({
        ...(status !== 'ALL' ? { status } : {}),
        page,
        page_size: TRANSFERS_PAGE_SIZE,
      })
      const res = response as { total?: number; page?: number }
      return {
        transfers: extractTransfers(response),
        total: res?.total ?? 0,
      }
    },
  })
}

/** Conteo de pendientes para el badge de la bandeja y la navegación. */
export function usePendingTransfersCount(enabled = true) {
  return useQuery({
    queryKey: ['branch-transfers', 'pending-count'],
    queryFn: async () => {
      const response = await branchTransferService.getTransfers({
        status: 'PENDING',
        page: 1,
        page_size: 1,
      })
      return (response as { total?: number })?.total ?? 0
    },
    enabled,
    staleTime: 30_000,
  })
}

export function useTransferDetail(transferId: number | null) {
  return useQuery({
    queryKey: ['branch-transfer', transferId],
    queryFn: () => branchTransferService.getTransferById(transferId!),
    enabled: transferId !== null,
  })
}

export function useCreateTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateBranchTransferRequest) => branchTransferService.createTransfer(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-transfers'] })
    },
  })
}

export function useTransferStatusChange(transferId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: UpdateBranchTransferStatusRequest) =>
      branchTransferService.updateTransferStatus(transferId!, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['branch-transfer', transferId] })
    },
  })
}
