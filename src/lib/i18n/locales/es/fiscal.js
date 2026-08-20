/**
 * Traducciones fiscales (SIFEN) en español
 * Módulo: Facturación electrónica nacional, estados del DE, documentos
 */

export const fiscal = {
  // Estados del ciclo de vida (fiscal.fiscal_documents.estado)
  'fiscal.states.EMITIDO': 'Emitido',
  'fiscal.states.APROBADO': 'Aprobado',
  'fiscal.states.APROBADO_OBS': 'Aprobado con observación',
  'fiscal.states.RECHAZADO': 'Rechazado',
  'fiscal.states.CANCELADO': 'Cancelado',
  'fiscal.states.INUTILIZADO': 'Inutilizado',
  'fiscal.states.CANCELACION_PENDIENTE': 'Cancelación pendiente',
  'fiscal.states.UNKNOWN': 'Estado desconocido',

  // Tipos de documento (iTiDE, MT v150 C002)
  'fiscal.docTypes.FACTURA': 'Factura Electrónica',
  'fiscal.docTypes.NCE': 'Nota de Crédito Electrónica',
  'fiscal.docTypes.NDE': 'Nota de Débito Electrónica',

  // FE2 — gestión de timbrados por branch (BranchModal tab fiscal)
  'fiscal.branch.title': 'Timbrados y Puntos de Expedición',
  'fiscal.branch.new': 'Nuevo Timbrado',
  'fiscal.branch.cancel': 'Cancelar',
  'fiscal.branch.discard': 'Descartar',
  'fiscal.branch.save': 'Guardar Configuración',
  'fiscal.branch.saving': 'Guardando...',
  'fiscal.branch.empty.title': 'Sin configuraciones fiscales',
  'fiscal.branch.empty.description': 'Define los puntos de expedición para habilitar la facturación electrónica en esta sucursal.',
  'fiscal.branch.establishment': 'Establecimiento',
  'fiscal.branch.expeditionPoint': 'Punto de Expedición',
  'fiscal.branch.documentType': 'Tipo de Documento',
  'fiscal.branch.timbrado': 'Número de Timbrado',
  'fiscal.branch.serie': 'Serie',
  'fiscal.branch.serieHint': '2 letras, p. ej. AA',
  'fiscal.branch.validFrom': 'Vigencia desde',
  'fiscal.branch.validTo': 'Vigencia hasta',
  'fiscal.branch.nextNumber': 'Próximo N°',
  'fiscal.branch.nextNumberHint': 'Lo asigna el backend automáticamente',
  'fiscal.branch.col.establPunto': 'Establ. / Punto',
  'fiscal.branch.col.type': 'Tipo',
  'fiscal.branch.col.timbrado': 'Timbrado',
  'fiscal.branch.col.serie': 'Serie',
  'fiscal.branch.col.validity': 'Validez',
  'fiscal.branch.col.next': 'Próximo N°',
  'fiscal.branch.col.sifen': 'Emisión SIFEN',
  'fiscal.branch.activate': 'Activar',
  'fiscal.branch.deactivate': 'Desactivar',
  'fiscal.branch.deleteConfirm': '¿Estás seguro de eliminar esta configuración fiscal?',
  'fiscal.branch.added': 'Configuración fiscal agregada',
  'fiscal.branch.deleted': 'Configuración fiscal eliminada',
  'fiscal.branch.enabled': 'Emisión SIFEN activada',
  'fiscal.branch.disabled': 'Emisión SIFEN desactivada',
  'fiscal.branch.saveError': 'Error al guardar configuración',
  'fiscal.branch.deleteError': 'Error al eliminar configuración',

  // FE2 — vigencia del timbrado (domain/fiscal/validity.ts)
  'fiscal.validity.indefinite': 'Indefinido',
  'fiscal.validity.ok': 'Vigente',
  'fiscal.validity.warning': 'Vence en {days} día(s)',
  'fiscal.validity.expired': 'Vencido',
}
