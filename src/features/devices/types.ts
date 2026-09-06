// ===========================================================================
// Tipos del feature de terminales (FASE E —
// PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES). Registro de terminales POS en
// backend: cada terminal se empareja a una sucursal vía código.
// ===========================================================================

export interface Device {
  id: number
  name: string
  branch_id: number | null
  pairing_code: string
  is_active: boolean
  last_seen_at?: string
  last_seen_by?: string
  created_at: string
  updated_at: string
}

/** Payload de alta/edición de terminal. */
export interface DeviceInput {
  name: string
  branch_id: number
  is_active?: boolean
  /** Solo edición: rota el código de emparejamiento. */
  regenerate_pairing_code?: boolean
}

/** Respuesta del emparejamiento: el binding queda del lado de esta terminal. */
export interface PairedDevice {
  id: number
  name: string
  branch_id: number
}
