/**
 * Traducciones de los drill-downs relacionales (F3) — español.
 * Namespace `relationalAnalytics.*`, re-agregado por grupo tras el teardown F1.
 */
export const relationalAnalytics = {
  relationalAnalytics: {
    entity: {
      product: 'Producto',
      client: 'Cliente',
      supplier: 'Proveedor',
    },
    context: {
      aria: 'Contexto del análisis',
      fallbackId: 'ID: {id}',
      variant: 'Variante: {name}',
    },
    buyers: {
      title: 'Compradores del producto',
      subtitle: 'Qué clientes compraron este producto.',
      empty: 'Sin compradores para este producto con los filtros aplicados',
    },
    customerTop: {
      title: 'Productos del cliente',
      subtitle: 'Los productos que este cliente compra más.',
      empty: 'Sin compras de este cliente con los filtros aplicados',
    },
    supplierTop: {
      title: 'Productos suministrados',
      subtitle: 'Lo que más se le compra a este proveedor.',
      empty: 'Sin compras completadas de este proveedor con los filtros aplicados',
    },
    productSuppliers: {
      title: 'Comparar proveedores',
      subtitle: 'Quién ofrece este producto y a qué precio, en moneda base.',
      empty: 'Sin proveedores que hayan comprado este producto (compras completadas)',
    },
    picker: {
      title: 'Elegí {entity} para ver el detalle',
      help: 'Buscá por nombre, documento o SKU para ver el análisis.',
      change: 'Cambiar {entity}',
      noResults: 'Sin resultados',
      searchPlaceholderProduct: 'Buscar producto (F2)…',
      searchPlaceholderClient: 'Buscar cliente (F2)…',
      searchPlaceholderSupplier: 'Buscar proveedor (F2)…',
    },
    filters: {
      aria: 'Filtros del análisis',
      from: 'Desde',
      to: 'Hasta',
      search: 'Buscar',
      partyPlaceholder: 'Buscar por nombre o documento (F2)…',
      productPlaceholder: 'Buscar por producto o SKU (F2)…',
      apply: 'Aplicar',
      clear: 'Limpiar',
      refresh: 'Actualizar',
      rangeTitle: 'Rango de fechas inválido',
      rangeMessage: 'La fecha "Desde" no puede ser posterior a "Hasta".',
      rangePending: 'Corregí el rango de fechas para ver el análisis.',
    },
    table: {
      loading: 'Cargando análisis…',
      actions: 'Acciones',
      emptyHint: 'Ajustá los filtros o el rango de fechas.',
      sortToggle: 'alternar orden',
      scrollHint: 'Deslizá la tabla para ver todas las columnas.',
    },
    columns: {
      client: 'Cliente',
      supplier: 'Proveedor',
      product: 'Producto',
      sku: 'SKU',
      doc: 'Documento',
      purchases: 'Compras',
      units: 'Cantidad',
      total: 'Importe total',
      avgPrice: 'Precio prom.',
      avgCost: 'Costo prom.',
      lastPrice: 'Último precio',
      minPrice: 'Mínimo histórico',
      currency: 'Moneda',
      lastPurchase: 'Última compra',
    },
    menu: {
      docLabel: 'Doc: {doc}',
      skuLabel: 'SKU: {sku}',
      summary: '{total} · Compras: {purchases} · {units}',
      avgPrice: 'Precio prom.: {price}',
      avgCost: 'Costo prom.: {price}',
      lastPriceSummary: 'Último: {price} · Compras: {purchases}',
    },
    actions: {
      buyers: 'Ver compradores',
      compareSuppliers: 'Comparar proveedores',
      customerTop: 'Productos que compra',
      supplierTop: 'Productos suministrados',
      copyDoc: 'Copiar documento',
      copySku: 'Copiar SKU',
      copied: 'Copiado al portapapeles',
      copyError: 'No se pudo copiar',
      rowAria: 'Acciones de {name}',
    },
    excludedBanner:
      '{count} compras en otra moneda quedan fuera del ranking (solo se compara la moneda base).',
    errors: {
      title: 'No se pudieron cargar los datos',
      message: 'Verificá la conexión e intentá nuevamente.',
    },
  },
};
