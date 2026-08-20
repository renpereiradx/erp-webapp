/**
 * English fiscal (SIFEN) translations
 * Module: National electronic invoicing, DE lifecycle states, documents
 */

export const fiscal = {
  // DE lifecycle states (fiscal.fiscal_documents.estado)
  'fiscal.states.EMITIDO': 'Issued',
  'fiscal.states.APROBADO': 'Approved',
  'fiscal.states.APROBADO_OBS': 'Approved with observation',
  'fiscal.states.RECHAZADO': 'Rejected',
  'fiscal.states.CANCELADO': 'Cancelled',
  'fiscal.states.INUTILIZADO': 'Voided',
  'fiscal.states.CANCELACION_PENDIENTE': 'Cancellation pending',
  'fiscal.states.UNKNOWN': 'Unknown state',

  // Document types (iTiDE, MT v150 C002)
  'fiscal.docTypes.FACTURA': 'Electronic Invoice',
  'fiscal.docTypes.NCE': 'Electronic Credit Note',
  'fiscal.docTypes.NDE': 'Electronic Debit Note',
}
