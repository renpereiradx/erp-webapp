/**
 * Índice de traducciones en español
 * Importa y combina todos los módulos de traducción
 */

import { common } from './common'
import { products } from './products'
import { categories } from './categories'
import { brands } from './brands'
import { attributes } from './attributes'
import { purchases } from './purchases'
import { priceAdjustments } from './priceAdjustments'
import { productAdjustments } from './productAdjustments'
import { stockMovements } from './stockMovements'
import { purchasePaymentsMvp } from './purchasePaymentsMvp'
import { clients } from './clients'
import { suppliers } from './suppliers'
import { party } from './party'
import { sales } from './sales'
import { inventory } from './inventory'
import { other } from './other'
import { cashRegister } from './cashRegister'
import { cashMovement } from './cashMovement'
import { currencies } from './currencies'
import { exchangeRates } from './exchangeRates'
import { dashboard } from './dashboard'
import { users } from './users'
import { sessions } from './sessions'
import { myProfile } from './my-profile'
import { receivables } from './receivables'
import payables from './payables'
import { fiscal } from './fiscal'
import { businessPrefs } from './businessPrefs'
import { printers } from './printers'
import { shell } from './shell'
import { transfers } from './transfers'
import { devices } from './devices'
import { catalog } from './catalog'
import { counterorders } from './counterorders'

/**
 * Diccionario completo de traducciones en español
 * Organizado por módulos para mejor mantenibilidad
 */
export const es = {
  ...common,
  ...products,
  ...categories,
  ...brands,
  ...attributes,
  ...purchases,
  ...priceAdjustments,
  ...productAdjustments,
  ...stockMovements,
  ...purchasePaymentsMvp,
  ...clients,
  ...suppliers,
  ...party,
  ...sales,
  ...inventory,
  ...cashRegister,
  ...cashMovement,
  ...currencies,
  ...exchangeRates,
  ...dashboard,
  ...users,
  ...sessions,
  ...myProfile,
  ...receivables,
  payables,
  ...fiscal,
  ...businessPrefs,
  ...printers,
  ...shell,
  ...transfers,
  ...devices,
  ...catalog,
  ...counterorders,
  ...other,
}
