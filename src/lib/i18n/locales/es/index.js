/**
 * Índice de traducciones en español
 * Importa y combina todos los módulos de traducción
 */

import { common } from './common'
import { products } from './products'
import { purchases } from './purchases'
import { priceAdjustments } from './priceAdjustments'
import { productAdjustments } from './productAdjustments'
import { inventoryAdjustments } from './inventoryAdjustments'
import { inventoryManagement } from './inventoryManagement'
import { purchasePaymentsMvp } from './purchasePaymentsMvp'
import { clients } from './clients'
import { suppliers } from './suppliers'
import { sales } from './sales'
import { inventory } from './inventory'
import { other } from './other'
import { cashRegister } from './cashRegister'
import { cashMovement } from './cashMovement'
import { currencies } from './currencies'
import { exchangeRates } from './exchangeRates'
import { dashboard } from './dashboard'
import { users } from './users'
import { myProfile } from './my-profile'
import { receivables } from './receivables'
import payables from './payables'

/**
 * Diccionario completo de traducciones en español
 * Organizado por módulos para mejor mantenibilidad
 */
export const es = {
  ...common,
  ...products,
  ...purchases,
  ...priceAdjustments,
  ...productAdjustments,
  ...inventoryAdjustments,
  ...inventoryManagement,
  ...purchasePaymentsMvp,
  ...clients,
  ...suppliers,
  ...sales,
  ...inventory,
  ...cashRegister,
  ...cashMovement,
  ...currencies,
  ...exchangeRates,
  ...dashboard,
  ...users,
  ...myProfile,
  ...receivables,
  payables,
  ...other,
}
