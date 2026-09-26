/**
 * Unit conversions (admin page /configuracion/conversiones).
 * PLAN_UNITS_FRONTEND: global vs per-product scope.
 */
export const unitConversions = {
  'unitConversions.productOptional': 'Product (optional)',
  'unitConversions.productSearchPlaceholder': 'Leave empty = global conversion; search a product to make it specific...',
  'unitConversions.noResults': 'No results',
  'unitConversions.makeGlobal': 'Use global',
  'unitConversions.specificBeatsGlobal': 'The product conversion takes precedence over the global one for that product.',
  'unitConversions.willSaveSpecific': 'It will be saved as a conversion specific to {product}.',
  'unitConversions.willSaveGlobal': 'It will be saved as a GLOBAL conversion: it applies to every product using those units.',
  'unitConversions.precedenceHelp': 'Registering the conversion for a product makes that factor win over the global one. A box content depends on the product: prefer per-product conversions.',
  'unitConversions.productScope': 'Product',
  'unitConversions.globalScope': 'global',
  'unitConversions.specificFor': 'of {product}',
  'unitConversions.deleteConfirm': 'Delete conversion {from} → {to} ({scope})?',
  'sales.editItem.unitNoPrice': 'This unit has no registered price or conversion: the shown price belongs to another unit and the sale will be rejected until the conversion is registered.',
}
