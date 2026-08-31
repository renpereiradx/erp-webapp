/**
 * Razones de cambio de precio aceptadas por el backend (price_change_reason).
 * type 'discount' = baja el precio, 'increase' = recargo.
 */
export const PRICE_CHANGE_REASONS = [
  { id: 'bulk_discount', label: '🔻 Descuento por volumen', type: 'discount' },
  { id: 'loyalty_discount', label: '🔻 Descuento por fidelidad', type: 'discount' },
  { id: 'promotional_offer', label: '🔻 Oferta promocional', type: 'discount' },
  { id: 'damaged_product', label: '🔻 Producto con daño menor', type: 'discount' },
  { id: 'clearance_sale', label: '🔻 Liquidación de inventario', type: 'discount' },
  { id: 'price_match', label: '🔻 Igualación de precio', type: 'discount' },
  { id: 'tournament_price', label: '🔺 Precio de torneo/evento', type: 'increase' },
  { id: 'peak_hours', label: '🔺 Tarifa por hora pico', type: 'increase' },
  { id: 'holiday_surcharge', label: '🔺 Recargo por feriado', type: 'increase' },
] as const;

export type PriceChangeReason = (typeof PRICE_CHANGE_REASONS)[number];
