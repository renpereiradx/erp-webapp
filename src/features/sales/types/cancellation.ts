/**
 * Tipos del flujo supervisado de anulación de ventas (FASE C,
 * PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES). Espejan la entidad
 * `sale.CancellationRequest` del backend (internal/sale/domain.go).
 */

export type CancellationRequestStatus = 'pending' | 'approved' | 'rejected'

export interface CancellationRequest {
  id: number
  sale_id: string
  requested_by: string
  requested_by_name?: string
  reason: string
  status: CancellationRequestStatus
  reviewed_by?: string | null
  reviewed_by_name?: string
  rejection_reason?: string | null
  created_at: string
  reviewed_at?: string | null
}

export interface CancellationRequestPage {
  page: number
  page_size: number
  total_records: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}
