/**
 * English translations index
 * Imports and combines all translation modules
 */

import { common } from './common.js'
import { products } from './products.js'
import { purchases } from './purchases.js'
import { currencies } from './currencies.js'
import { exchangeRates } from './exchangeRates.js'
import { es } from '../es/index.js'

/**
 * Complete English translation dictionary
 * Organized by modules for better maintainability
 *
 * TEMPORARY FALLBACK: Until English translations are fully migrated,
 * we use Spanish translations as fallback to prevent console warnings.
 * This allows the system to function correctly while translations are
 * being completed incrementally.
 */
export const en = {
  // Use Spanish as fallback for missing translations
  ...es,
  // Override with English translations where available
  ...common,
  ...products,
  ...purchases,
  ...currencies,
  ...exchangeRates,
  // TODO: Add English translations for new modules:
  // - clients
  // - suppliers
  // - sales
  // - inventory
  // - reservations
  // - booking
  // - priceAdjustments
  // - other (login, dashboard, settings)
}
