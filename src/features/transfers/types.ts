// ===========================================================================
// Tipos del feature de transferencias entre sucursales (F.4 —
// PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES). Los tipos de API viven en @/types.
// ===========================================================================

import type { BranchTransfer, BranchTransferItem } from '@/types'

export type { BranchTransfer, BranchTransferItem }

/** Flujo del workflow: PENDING → APPROVED → SHIPPED → IN_TRANSIT → RECEIVED. */
export const TRANSFER_STATUSES = [
  'PENDING',
  'APPROVED',
  'SHIPPED',
  'IN_TRANSIT',
  'RECEIVED',
  'REJECTED',
  'CANCELLED',
] as const

export type TransferStatus = (typeof TRANSFER_STATUSES)[number]
export type TransferStatusFilter = TransferStatus | 'ALL'

/** Ítem precargado desde el CTA post-compra (F.5). */
export interface PreloadedTransferItem {
  product_id: string
  variant_id?: string
  product_name?: string
  quantity: number
  unit_cost?: number
  /** F.6: compra de la que proviene el ítem, para trazabilidad. */
  purchase_order_id?: number
}

/** Normaliza la respuesta del listado: el backend devuelve { transfers }. */
export function extractTransfers(response: unknown): BranchTransfer[] {
  const res = response as { transfers?: BranchTransfer[]; data?: BranchTransfer[] } | null
  return res?.transfers || res?.data || []
}
