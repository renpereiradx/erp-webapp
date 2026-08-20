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

  // FE2 — per-branch timbrado management (BranchModal fiscal tab)
  'fiscal.branch.title': 'Timbrados and Expedition Points',
  'fiscal.branch.new': 'New Timbrado',
  'fiscal.branch.cancel': 'Cancel',
  'fiscal.branch.discard': 'Discard',
  'fiscal.branch.save': 'Save Configuration',
  'fiscal.branch.saving': 'Saving...',
  'fiscal.branch.empty.title': 'No fiscal configurations',
  'fiscal.branch.empty.description': 'Define expedition points to enable electronic invoicing for this branch.',
  'fiscal.branch.establishment': 'Establishment',
  'fiscal.branch.expeditionPoint': 'Expedition Point',
  'fiscal.branch.documentType': 'Document Type',
  'fiscal.branch.timbrado': 'Timbrado Number',
  'fiscal.branch.serie': 'Serie',
  'fiscal.branch.serieHint': '2 letters, e.g. AA',
  'fiscal.branch.validFrom': 'Valid from',
  'fiscal.branch.validTo': 'Valid until',
  'fiscal.branch.nextNumber': 'Next No.',
  'fiscal.branch.nextNumberHint': 'Assigned automatically by the backend',
  'fiscal.branch.col.establPunto': 'Establ. / Point',
  'fiscal.branch.col.type': 'Type',
  'fiscal.branch.col.timbrado': 'Timbrado',
  'fiscal.branch.col.serie': 'Serie',
  'fiscal.branch.col.validity': 'Validity',
  'fiscal.branch.col.next': 'Next No.',
  'fiscal.branch.col.sifen': 'SIFEN Emission',
  'fiscal.branch.activate': 'Activate',
  'fiscal.branch.deactivate': 'Deactivate',
  'fiscal.branch.deleteConfirm': 'Are you sure you want to delete this fiscal configuration?',
  'fiscal.branch.added': 'Fiscal configuration added',
  'fiscal.branch.deleted': 'Fiscal configuration deleted',
  'fiscal.branch.enabled': 'SIFEN emission enabled',
  'fiscal.branch.disabled': 'SIFEN emission disabled',
  'fiscal.branch.saveError': 'Error saving configuration',
  'fiscal.branch.deleteError': 'Error deleting configuration',

  // FE2 — timbrado validity (domain/fiscal/validity.ts)
  'fiscal.validity.indefinite': 'Indefinite',
  'fiscal.validity.ok': 'Valid',
  'fiscal.validity.warning': 'Expires in {days} day(s)',
  'fiscal.validity.expired': 'Expired',
}
