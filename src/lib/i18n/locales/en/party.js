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

  // Quick client registration (POS)
  'party.quick_client.title': 'Quick client registration',
  'party.quick_client.subtitle': 'Minimal data to continue the sale',
  'party.quick_client.action': 'New client',
  'party.quick_client.empty_cta': 'Not found? Register as a new client',
  'party.quick_client.field.first_name': 'First name',
  'party.quick_client.field.last_name': 'Last name',
  'party.quick_client.field.document_id': 'Document number',
  'party.quick_client.field.phone': 'Phone (optional)',
  'party.quick_client.placeholder.first_name': 'Enter first name',
  'party.quick_client.placeholder.last_name': 'Enter last name',
  'party.quick_client.placeholder.document_id': 'e.g. 1234567',
  'party.quick_client.placeholder.phone': 'e.g. +595 981 123 456',
  'party.quick_client.submit': 'Register client',
  'party.quick_client.processing': 'Registering...',
  'party.quick_client.error.first_name': 'First name is required',
  'party.quick_client.error.last_name': 'Last name is required',
  'party.quick_client.error.document_type': 'Document type is required',
  'party.quick_client.error.document_id': 'Document number is required',
  'party.quick_client.error.generic': 'Error registering the client',

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
