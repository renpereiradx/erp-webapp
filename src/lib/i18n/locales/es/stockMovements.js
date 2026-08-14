/**
 * Traducciones ES del feature Stock Movements.
 * Reemplaza a inventoryAdjustments.js + inventoryManagement.js (ajuste manual/masivo).
 *
 * Namespace raíz: `stockMovements.*`
 */

export const stockMovements = {
  stockMovements: {
    title: 'Movimientos de Stock',
    subtitle: 'Trazabilidad · /stock-transactions/',
    menu: 'Movimientos de Stock',

    tabs: {
      register: 'Registrar',
      history: 'Historial',
      summary: 'Resumen',
    },

    search: {
      title: 'Buscar Producto',
      hint: 'Ctrl+A para abrir rápido',
      placeholder: 'Nombre, SKU o ID de producto...',
      searching: 'Buscando...',
      stock: 'Stock',
      minChars: 'Escribe al menos 2 caracteres',
      noResults: 'No se encontraron productos',
    },

    form: {
      title: 'Nuevo Movimiento',
      selectedProduct: 'Producto Seleccionado',
      noProduct: 'No hay producto seleccionado.',
      searchCta: 'Buscar uno',
      currentStock: 'Stock Actual',
      variant: 'Variante (opcional)',
      mainProduct: 'Producto Principal (General)',
      stock: 'Stock',
      mode: {
        target: 'Establecer stock',
        delta: 'Ajustar por diferencia',
      },
      targetStock: 'Stock objetivo',
      delta: 'Diferencia (+/−)',
      resultingStock: 'Stock resultante',
      reasonCategory: 'Categoría de motivo',
      approvalLevel: 'Nivel de aprobación',
      approval: {
        operator: 'Operador',
        supervisor: 'Supervisor',
        manager: 'Manager',
        admin: 'Admin',
      },
      reason: 'Motivo / Justificación',
      reasonPlaceholder: 'Detalle del motivo del movimiento...',
      source: 'Fuente',
      date: 'Fecha',
      search: 'Buscar',
      submit: 'Registrar movimiento',
      submitting: 'Registrando...',
    },

    reasons: {
      INVENTORY_COUNT: 'Conteo de inventario',
      CORRECTION: 'Corrección',
      DAMAGE: 'Daño',
      EXPIRY: 'Vencimiento',
      THEFT: 'Hurto',
      RETURN: 'Devolución',
      LOSS: 'Pérdida',
      FOUND: 'Hallazgo',
      INITIAL_COUNT: 'Stock inicial',
    },

    types: {
      PURCHASE: 'Compra',
      SALE: 'Venta',
      ADJUSTMENT: 'Ajuste',
      INVENTORY: 'Inventario',
      INITIAL: 'Inicial',
      LOSS: 'Pérdida',
      FOUND: 'Hallazgo',
    },

    success: 'Movimiento registrado',

    errors: {
      product_required: 'Seleccioná un producto',
      target_invalid: 'Ingresá un stock objetivo válido (≥ 0)',
      delta_nonzero: 'La diferencia no puede ser 0',
      register_failed: 'No se pudo registrar el movimiento',
    },

    history: {
      title: 'Historial de Movimientos',
      view: {
        product: 'Por producto',
        date: 'Por fecha',
      },
      productIdPlaceholder: 'ID de producto',
      refresh: 'Consultar',
      empty: 'Sin movimientos para mostrar.',
      col: {
        date: 'Fecha',
        type: 'Tipo',
        delta: 'Δ',
        balance: 'Saldo',
        reason: 'Motivo',
        operator: 'Operador',
      },
    },

    summary: {
      title: 'Resumen de Movimientos',
      from: 'Desde',
      to: 'Hasta',
      loadSummary: 'Resumen',
      loadDiscrepancies: 'Discrepancias',
      loadConsistency: 'Consistencia',
      initial: 'Inicial',
      in: 'Entradas',
      out: 'Salidas',
      net: 'Neto',
      final: 'Final',
      empty: 'Cargá el resumen para un rango.',
      consistency: 'Consistencia Ledger vs Snapshot',
      consistent: 'Consistente',
      inconsistent: 'Inconsistente',
      consistencyEmpty: 'Ejecutá "Consistencia".',
      discrepancies: 'Discrepancias',
      discrepanciesEmpty: 'Sin discrepancias para el rango.',
    },
  },
};
