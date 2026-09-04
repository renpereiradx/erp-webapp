/**
 * English translations index
 * Imports and combines all translation modules
 */

import { common } from './common'
import { products } from './products'
import { categories } from './categories'
import { brands } from './brands'
import { attributes } from './attributes'
import { purchases } from './purchases'
import { currencies } from './currencies'
import { exchangeRates } from './exchangeRates'
import { dashboard } from './dashboard'
import { receivables } from './receivables'
import { purchasePaymentsMvp } from './purchasePaymentsMvp'
import { party } from './party'
import { fiscal } from './fiscal'
import { businessPrefs } from './businessPrefs'
import { shell } from './shell'
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
  ...categories,
  ...purchases,
  ...currencies,
  ...exchangeRates,
  ...dashboard,
  ...receivables,
  ...purchasePaymentsMvp,
  ...party,
  ...fiscal,
  ...businessPrefs,
  ...shell,
  ...brands,
  ...attributes,
  // TODO: Add English translations for new modules:
  // - clients
  // - suppliers
  // - sales
  // - inventory
  // - booking
  // - priceAdjustments
  // - other (login, dashboard, settings)
}
