/**
 * Party domain translations (fields shared between clients and suppliers):
 * document type, nationality and structured address.
 */

export const party = {
  // Shared fields
  'party.field.document_type': 'Document type',
  'party.field.nationality': 'Nationality',
  'party.field.address_section': 'Address',
  'party.field.address_street': 'Street and number',
  'party.field.address_city': 'City',
  'party.field.address_state': 'State / Province',
  'party.field.address_zip_code': 'Postal code',
  'party.field.address_country': 'Country',
  'party.select.placeholder': 'Not specified',

  // Document types (backend whitelist, uppercase)
  'party.document_type.CI': 'National ID (CI)',
  'party.document_type.RUC': 'RUC',
  'party.document_type.PASSPORT': 'Passport',
  'party.document_type.CPF': 'CPF (Brazil)',
  'party.document_type.CNPJ': 'CNPJ (Brazil)',
  'party.document_type.DNI': 'DNI (Argentina)',
  'party.document_type.CUIT': 'CUIT (Argentina)',
  'party.document_type.SSN': 'SSN (US)',
  'party.document_type.EIN': 'EIN (US)',
  'party.document_type.ID_CARD': 'ID card',
  'party.document_type.TIN': 'TIN',
  'party.document_type.OTHER': 'Other',
}
