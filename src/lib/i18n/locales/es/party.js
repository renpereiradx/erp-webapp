/**
 * Traducciones del dominio Party (campos compartidos entre clientes y
 * proveedores): tipo de documento, nacionalidad y dirección estructurada.
 */

export const party = {
  // Campos compartidos
  'party.field.document_type': 'Tipo de documento',
  'party.field.nationality': 'Nacionalidad',
  'party.field.address_section': 'Dirección',
  'party.field.address_street': 'Calle y número',
  'party.field.address_city': 'Ciudad',
  'party.field.address_state': 'Departamento / Estado',
  'party.field.address_zip_code': 'Código postal',
  'party.field.address_country': 'País',
  'party.select.placeholder': 'Sin especificar',

  // Tipos de documento (whitelist del backend, en mayúsculas)
  'party.document_type.CI': 'Cédula de Identidad',
  'party.document_type.RUC': 'RUC',
  'party.document_type.PASSPORT': 'Pasaporte',
  'party.document_type.CPF': 'CPF (Brasil)',
  'party.document_type.CNPJ': 'CNPJ (Brasil)',
  'party.document_type.DNI': 'DNI (Argentina)',
  'party.document_type.CUIT': 'CUIT (Argentina)',
  'party.document_type.SSN': 'SSN (EE.UU.)',
  'party.document_type.EIN': 'EIN (EE.UU.)',
  'party.document_type.ID_CARD': 'Carné de identidad',
  'party.document_type.TIN': 'TIN',
  'party.document_type.OTHER': 'Otro',
}
