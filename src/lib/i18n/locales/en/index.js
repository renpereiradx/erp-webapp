/**
 * English translations index
 * Imports and combines all translation modules
 */

import { common } from './common'
import { products } from './products'
import { purchases } from './purchases'
import { currencies } from './currencies'
import { exchangeRates } from './exchangeRates'
import { dashboard } from './dashboard'
import { receivables } from './receivables'
import { purchasePaymentsMvp } from './purchasePaymentsMvp'
import { es } from '../es/index'

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
  ...dashboard,
  ...receivables,
  ...purchasePaymentsMvp,
  // TODO: Add English translations for new modules:
  // - clients
  // - suppliers
  // - sales
  // - inventory
  // - booking
  // - priceAdjustments
  // - other (login, dashboard, settings)
}
