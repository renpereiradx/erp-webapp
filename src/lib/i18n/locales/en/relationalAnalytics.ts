/**
 * Relational drill-down translations (F3) — English.
 * Namespace `relationalAnalytics.*`, re-added per group after the F1 teardown.
 */
export const relationalAnalytics = {
  relationalAnalytics: {
    entity: {
      product: 'Product',
      client: 'Customer',
      supplier: 'Supplier',
    },
    context: {
      aria: 'Analysis context',
      fallbackId: 'ID: {id}',
      variant: 'Variant: {name}',
    },
    buyers: {
      title: 'Product buyers',
      subtitle: 'Which customers bought this product.',
      empty: 'No buyers for this product with the applied filters',
    },
    customerTop: {
      title: 'Customer products',
      subtitle: 'The products this customer buys the most.',
      empty: 'No purchases for this customer with the applied filters',
    },
    supplierTop: {
      title: 'Supplied products',
      subtitle: 'What is bought the most from this supplier.',
      empty: 'No completed purchases from this supplier with the applied filters',
    },
    productSuppliers: {
      title: 'Compare suppliers',
      subtitle: 'Who offers this product and at what price, in base currency.',
      empty: 'No suppliers have purchased this product (completed purchases)',
    },
    picker: {
      title: 'Select a {entity} to see the detail',
      help: 'Search by name, document or SKU to see the analysis.',
      change: 'Change {entity}',
      noResults: 'No results',
      searchPlaceholderProduct: 'Search product (F2)…',
      searchPlaceholderClient: 'Search customer (F2)…',
      searchPlaceholderSupplier: 'Search supplier (F2)…',
    },
    filters: {
      aria: 'Analysis filters',
      from: 'From',
      to: 'To',
      search: 'Search',
      partyPlaceholder: 'Search by name or document (F2)…',
      productPlaceholder: 'Search by product or SKU (F2)…',
      apply: 'Apply',
      clear: 'Clear',
      refresh: 'Refresh',
      rangeTitle: 'Invalid date range',
      rangeMessage: '"From" cannot be later than "To".',
      rangePending: 'Fix the date range to see the analysis.',
    },
    table: {
      loading: 'Loading analysis…',
      actions: 'Actions',
      emptyHint: 'Adjust the filters or the date range.',
      sortToggle: 'toggle sort',
      scrollHint: 'Swipe the table to see all columns.',
    },
    columns: {
      client: 'Customer',
      supplier: 'Supplier',
      product: 'Product',
      sku: 'SKU',
      doc: 'Document',
      purchases: 'Purchases',
      units: 'Quantity',
      total: 'Total amount',
      avgPrice: 'Avg. price',
      avgCost: 'Avg. cost',
      lastPrice: 'Last price',
      minPrice: 'Historical minimum',
      currency: 'Currency',
      lastPurchase: 'Last purchase',
    },
    menu: {
      docLabel: 'Doc: {doc}',
      skuLabel: 'SKU: {sku}',
      summary: '{units} · Compras: {purchases} · {total}',
      avgPrice: 'Avg. price: {price}',
      avgCost: 'Avg. cost: {price}',
      lastPriceSummary: 'Último: {price} · Compras: {purchases}',
    },
    actions: {
      buyers: 'View buyers',
      compareSuppliers: 'Compare suppliers',
      customerTop: 'Products they buy',
      supplierTop: 'Supplied products',
      copyDoc: 'Copy document',
      copySku: 'Copy SKU',
      copied: 'Copied to clipboard',
      copyError: 'Could not copy',
      rowAria: 'Actions for {name}',
    },
    excludedBanner:
      '{count} purchases in another currency are excluded from the ranking (only the base currency is compared).',
    errors: {
      title: 'Could not load the data',
      message: 'Check the connection and try again.',
    },
  },
};
