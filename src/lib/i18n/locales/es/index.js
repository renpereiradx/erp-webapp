/**
 * Índice de traducciones en español
 * Importa y combina todos los módulos de traducción
 */

import { common } from './common.js'
import { products } from './products.js'
import { purchases } from './purchases.js'
import { priceAdjustments } from './priceAdjustments.js'
import { clients } from './clients.js'
import { suppliers } from './suppliers.js'
import { sales } from './sales.js'
import { inventory } from './inventory.js'
import { reservations } from './reservations.js'
import { booking } from './booking.js'
import { other } from './other.js'

/**
 * Diccionario completo de traducciones en español
 * Organizado por módulos para mejor mantenibilidad
 */
export const es = {
  ...common,
  ...products,
  ...purchases,
  ...priceAdjustments,
  ...clients,
  ...suppliers,
  ...sales,
  ...inventory,
  ...reservations,
  ...booking,
  ...other,
}
