/**
 * Índice de traducciones en español
 * Importa y combina todos los módulos de traducción
 */

import { common } from './common'
import { unitConversions } from './unitConversions'
import { manufacturing } from './manufacturing'
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
import { budgets } from './budgets'
import { party } from './party'
import { sales } from './sales'
import { inventory } from './inventory'
import { other } from './other'
import { cashRegister } from './cashRegister'
import { cashMovement } from './cashMovement'
import { currencies } from './currencies'
import { exchangeRates } from './exchangeRates'
import { users } from './users'
import { sessions } from './sessions'
import { myProfile } from './my-profile'
import { fiscal } from './fiscal'
import { businessPrefs } from './businessPrefs'
import { licensing } from './licensing'
import { printers } from './printers'
import { shell } from './shell'
import { transfers } from './transfers'
import { devices } from './devices'
import { catalog } from './catalog'
import { counterorders } from './counterorders'
import { branches } from './branches'
import { version } from './version'
import { reservations } from './reservations'
import { dashboard } from './dashboard'
import { relationalAnalytics } from './relationalAnalytics'
import { salesAnalytics } from './salesAnalytics'
import { inventoryAnalytics } from './inventoryAnalytics'

/**
 * Diccionario completo de traducciones en español
 * Organizado por módulos para mejor mantenibilidad
 */
export const es = {
  ...common,
  ...manufacturing,
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
  ...budgets,
  ...party,
  ...sales,
  ...inventory,
  ...cashRegister,
  ...cashMovement,
  ...currencies,
  ...exchangeRates,
  ...users,
  ...sessions,
  ...myProfile,
  ...fiscal,
  ...businessPrefs,
  ...licensing,
  ...printers,
  ...shell,
  ...transfers,
  ...devices,
  ...catalog,
  ...counterorders,
  ...branches,
  ...other,
  ...unitConversions,
  ...version,
  ...reservations,
  ...dashboard,
  ...relationalAnalytics,
  ...salesAnalytics,
  ...inventoryAnalytics,
}
