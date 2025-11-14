/**
 * Índice de traducciones en español
 * Importa y combina todos los módulos de traducción
 */

import { common } from './common.js'
import { products } from './products.js'
import { purchases } from './purchases.js'

/**
 * Diccionario completo de traducciones en español
 * Organizado por módulos para mejor mantenibilidad
 */
export const es = {
  ...common,
  ...products,
  ...purchases,
  // TODO: Agregar más módulos aquí según sea necesario:
  // ...clients,
  // ...suppliers,
  // ...sales,
  // ...inventory,
  // ...reports,
}
