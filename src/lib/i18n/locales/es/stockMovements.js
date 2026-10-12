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
      parent_of: 'Producto padre: {name}',
      minChars: 'Escribe al menos 2 caracteres',
      noResults: 'No se encontraron productos',
    },

    form: {
      title: 'Nuevo Movimiento',
      batchHint: 'Registrá una o varias filas en un solo envío.',
      selectedProduct: 'Producto Seleccionado',
      noProduct: 'No hay productos en la cola.',
      searchCta: 'Buscar uno',
      currentStock: 'Stock Actual',
      variant: 'Variante (opcional)',
      mainProduct: 'Producto Principal (General)',
      stock: 'Stock',
      mode: {
        label: 'Modo de ajuste',
        target: 'Establecer stock',
        delta: 'Ajustar por diferencia',
      },
      targetStock: 'Stock objetivo',
      delta: 'Diferencia (+/−)',
      resultingStock: 'Stock resultante',
      unit: 'Unidad de la cantidad',
      unitConversionHint: '1 {unit} = {factor} {base}',
      unitNoConversion: 'Sin conversión de {unit} a {base}',
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
      search: 'Agregar producto',
      submit: 'Registrar movimiento(s)',
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
    batchCount: '{count} movimiento(s) registrado(s).',

    draft: {
      badge: 'Borrador activo',
      badgeCount: '{count} fila(s) sin registrar · se guarda en este navegador',
      discard: 'Descartar borrador',
      exitTitle: '¿Salir de Movimientos de Stock?',
      exitMessage:
        'Hay {count} fila(s) sin registrar. Podés guardarlas como borrador para terminarlas después.',
      exitSave: 'Guardar y salir',
      exitDiscard: 'Salir sin guardar',
      exitStay: 'Seguir editando',
    },

    queue: {
      product: 'Producto',
      adjustment: 'Ajuste',
      reason: 'Motivo',
      actions: 'Acciones',
      edit: 'Editar',
    },

    edit: {
      title: 'Editar movimiento',
    },

    errors: {
      product_required: 'Seleccioná un producto',
      target_invalid: 'Ingresá un stock objetivo válido (≥ 0)',
      delta_nonzero: 'La diferencia no puede ser 0',
      register_failed: 'No se pudo registrar el movimiento',
      unit_no_conversion: 'Sin conversión de {unit} a {base}: registrala en Conversiones de unidades',
      integer_unit_zero: 'La cantidad en {unit} no puede quedar en 0 (unidad entera)',
    },

    history: {
      title: 'Historial de Movimientos',
      view: {
        product: 'Por producto',
        date: 'Por fecha',
      },
      productIdLabel: 'ID de producto',
      productIdPlaceholder: 'ID de producto',
      refresh: 'Consultar',
      empty: 'Sin movimientos para mostrar.',
      emptyHint: 'Consultá por producto o rango de fechas.',
      errorTitle: 'Error al cargar',
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
