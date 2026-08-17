/**
 * Dominio Party — validación del registro rápido de cliente (POS).
 *
 * Función pura y testeable del formulario mínimo del QuickClientModal.
 * Devuelve errores como claves i18n (sin dependencias de React ni locale).
 */

export interface QuickClientForm {
  first_name: string
  last_name: string
  document_type: string
  document_id: string
  phone: string
}

export interface QuickClientErrors {
  first_name?: string
  last_name?: string
  document_type?: string
  document_id?: string
  [key: string]: string | undefined
}

/** Campos mínimos para registrar un cliente desde el checkout de venta. */
export function validateQuickClient(form: QuickClientForm): QuickClientErrors {
  const errors: QuickClientErrors = {}

  if (!form.first_name?.trim()) {
    errors.first_name = 'party.quick_client.error.first_name'
  }
  if (!form.last_name?.trim()) {
    errors.last_name = 'party.quick_client.error.last_name'
  }
  if (!form.document_type) {
    errors.document_type = 'party.quick_client.error.document_type'
  }
  if (!form.document_id?.trim()) {
    errors.document_id = 'party.quick_client.error.document_id'
  }

  return errors
}
