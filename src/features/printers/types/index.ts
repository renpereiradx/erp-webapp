/**
 * Tipos del feature de impresoras de tickets. Espejan el DTO
 * PrinterResponse del contexto documents del backend (internal/documents).
 * v1: solo impresoras de red (TCP 9100, JetDirect).
 */

export type PrinterPurpose = 'RECEIPT' | 'KITCHEN' | 'BAR'

export type PrinterCodePage = 'CP858' | 'CP850' | 'CP437'

/** Anchos de papel soportados por el backend (CHECK width_mm IN (58, 80)). */
export type PrinterWidthMM = 58 | 80

/** GET/POST/PUT /api/v1/printers — PrinterResponse del backend. */
export interface Printer {
  id: number
  /** null = utilizable desde cualquier sucursal. */
  branch_id?: number | null
  name: string
  purpose: PrinterPurpose
  connection: string
  host: string
  port: number
  width_mm: PrinterWidthMM
  /** Columnas imprimibles según el ancho (32 en 58 mm, 48 en 80 mm). */
  chars_per_line: number
  code_page: PrinterCodePage
  kick_drawer: boolean
  is_default: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/** Payload de creación/edición (CreatePrinterRequest / UpdatePrinterRequest). */
export interface PrinterInput {
  branch_id?: number | null
  name: string
  purpose: PrinterPurpose
  host: string
  port: number
  width_mm: PrinterWidthMM
  code_page: PrinterCodePage
  kick_drawer: boolean
  is_default: boolean
  is_active: boolean
}

/** Parámetros de listado (GET /api/v1/printers?branch_id=&active=true). */
export interface PrinterListParams {
  branch_id?: number
  active?: boolean
}
