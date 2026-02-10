/**
 * Índice de traducciones en español
 * Importa y combina todos los módulos de traducción
 */

import { common } from './common.js'
import { products } from './products.js'
import { purchases } from './purchases.js'
import { priceAdjustments } from './priceAdjustments.js'
import { productAdjustments } from './productAdjustments.js'
import { inventoryAdjustments } from './inventoryAdjustments.js'
import { inventoryManagement } from './inventoryManagement.js'
import { purchasePaymentsMvp } from './purchasePaymentsMvp.js'
import { clients } from './clients.js'
import { suppliers } from './suppliers.js'
import { sales } from './sales.js'
import { inventory } from './inventory.js'
import { reservations } from './reservations.js'
import { booking } from './booking.js'
import { bookingManagement } from './booking-management.js'
import { other } from './other.js'
import { availableSlots } from './availableSlots.js'
import { cashRegister } from './cashRegister.js'
import { cashMovement } from './cashMovement.js'
import { currencies } from './currencies.js'
import { exchangeRates } from './exchangeRates.js'
import { dashboard } from './dashboard.js'
import { users } from './users.js'
import { myProfile } from './my-profile.js'
import { receivables } from './receivables.js'

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
  ...reservations,
  ...booking,
  ...bookingManagement,
  ...availableSlots,
  ...cashRegister,
  ...cashMovement,
  ...currencies,
  ...exchangeRates,
  ...dashboard,
  ...users,
  ...myProfile,
  ...receivables,
  ...other,
}
