/**
 * English translations index
 * Imports and combines all translation modules
 */

import { common } from './common.js'
import { products } from './products.js'
import { purchases } from './purchases.js'

/**
 * Complete English translation dictionary
 * Organized by modules for better maintainability
 */
export const en = {
  ...common,
  ...products,
  ...purchases,
  // TODO: Add more modules here as needed:
  // ...clients,
  // ...suppliers,
  // ...sales,
  // ...inventory,
  // ...reports,
}
