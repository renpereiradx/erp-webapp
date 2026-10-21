/**
 * English translations index
 * Imports and combines all translation modules
 */

import { common } from './common'
import { unitConversions } from './unitConversions'
import { manufacturing } from './manufacturing'
import { products } from './products'
import { categories } from './categories'
import { brands } from './brands'
import { attributes } from './attributes'
import { purchases } from './purchases'
import { currencies } from './currencies'
import { exchangeRates } from './exchangeRates'
import { purchasePaymentsMvp } from './purchasePaymentsMvp'
import { party } from './party'
import { budgets } from './budgets'
import { fiscal } from './fiscal'
import { businessPrefs } from './businessPrefs'
import { licensing } from './licensing'
import { printers } from './printers'
import { devices } from './devices'
import { shell } from './shell'
import { other } from './other'
import { version } from './version'
import { reservations } from './reservations'
import { dashboard } from './dashboard'
import { relationalAnalytics } from './relationalAnalytics'
import { salesAnalytics } from './salesAnalytics'
import { inventoryAnalytics } from './inventoryAnalytics'
import { profitability } from './profitability'
import { receivables } from './receivables'
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
  ...manufacturing,
  ...products,
  ...categories,
  ...purchases,
  ...currencies,
  ...exchangeRates,
  ...purchasePaymentsMvp,
  ...party,
  ...budgets,
  ...fiscal,
  ...businessPrefs,
  ...licensing,
  ...printers,
  ...devices,
  ...shell,
  ...brands,
  ...attributes,
  ...other,
  // TODO: Add English translations for new modules:
  // - clients
  // - suppliers
  // - sales
  // - inventory
  // - booking
  // - priceAdjustments
  ...unitConversions,
  ...version,
  ...reservations,
  ...dashboard,
  ...relationalAnalytics,
  ...salesAnalytics,
  ...inventoryAnalytics,
  ...profitability,
  ...receivables,
}
