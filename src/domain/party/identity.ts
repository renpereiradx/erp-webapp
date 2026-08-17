/**
 * Dominio Party — identidad documental y geografía.
 *
 * Espejo de las reglas del backend (business_management/internal/party):
 * - Whitelist de document_type (12 valores, se persisten en mayúsculas).
 * - nationality / address_country como ISO 3166-1 alpha-2.
 *
 * Sin dependencias de React ni side effects.
 */

export const PARTY_DOCUMENT_TYPES = [
  'CI',
  'RUC',
  'PASSPORT',
  'CPF',
  'CNPJ',
  'DNI',
  'CUIT',
  'SSN',
  'EIN',
  'ID_CARD',
  'TIN',
  'OTHER',
] as const

export type PartyDocumentType = (typeof PARTY_DOCUMENT_TYPES)[number]

const DOCUMENT_TYPE_SET: ReadonlySet<string> = new Set(PARTY_DOCUMENT_TYPES)

export const ISO_ALPHA2_PATTERN = /^[A-Z]{2}$/

export function isISOAlpha2(value: string | null | undefined): boolean {
  return typeof value === 'string' && ISO_ALPHA2_PATTERN.test(value)
}

/** Devuelve el document_type canónico en mayúsculas, o '' si no está en la whitelist. */
export function normalizeDocumentType(
  raw: string | null | undefined,
): PartyDocumentType | '' {
  if (typeof raw !== 'string' || raw.trim() === '') return ''
  const upper = raw.trim().toUpperCase()
  return (DOCUMENT_TYPE_SET.has(upper) ? upper : '') as PartyDocumentType | ''
}

export function isValidDocumentType(raw: string | null | undefined): boolean {
  return normalizeDocumentType(raw) !== ''
}

/**
 * Países soportados en selects (ISO 3166-1 alpha-2). América primero —
 * ERP con raíz en Paraguay (SIFEN) —, luego Europa y el resto del mundo.
 * Cualquier alpha-2 válido sigue siendo aceptado por el backend; esta lista
 * solo acota las opciones del formulario.
 */
export const PARTY_COUNTRIES = [
  // América del Sur
  'PY', 'AR', 'BR', 'BO', 'CL', 'CO', 'EC', 'PE', 'UY', 'VE',
  // América Central y Caribe
  'MX', 'GT', 'HN', 'SV', 'NI', 'CR', 'PA', 'DO', 'CU', 'PR', 'JM', 'HT', 'TT', 'BB',
  // América del Norte
  'US', 'CA',
  // Europa
  'ES', 'PT', 'IT', 'FR', 'DE', 'GB', 'NL', 'BE', 'CH', 'AT', 'IE',
  'PL', 'CZ', 'HU', 'RO', 'GR', 'SE', 'NO', 'DK', 'FI', 'UA', 'RU',
  // Asia
  'CN', 'JP', 'KR', 'TW', 'HK', 'IN', 'IL', 'TR', 'AE', 'SA',
  // África y Oceanía
  'ZA', 'EG', 'AU', 'NZ',
] as const

export type PartyCountry = (typeof PARTY_COUNTRIES)[number]

const COUNTRY_SET: ReadonlySet<string> = new Set(PARTY_COUNTRIES)

export function isPartyCountry(code: string | null | undefined): boolean {
  return typeof code === 'string' && COUNTRY_SET.has(code)
}

/**
 * Nombre del país localizado vía Intl.DisplayNames (sin hardcodear nombres
 * en los diccionarios i18n). Fallback: el propio código.
 */
export function countryDisplayName(code: string, locale = 'es'): string {
  if (!isISOAlpha2(code)) return code
  try {
    const regions = new Intl.DisplayNames([locale], { type: 'region' })
    return regions.of(code) || code
  } catch {
    return code
  }
}
