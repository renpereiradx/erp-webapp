/**
 * Mocks para el sistema de Pronósticos (BI Forecasting)
 * Datos en Español y moneda en Guaraníes (₲) basados en diseños de Stitch
 */

export const MOCK_DASHBOARD_PRONOSTICOS = {
  success: true,
  data: {
    generated_at: new Date().toISOString(),
    kpis: {
      ventas_proyectadas: { valor: 150000000, variacion: 5.2, estado: "UP" },
      ingresos_anuales: { valor: 600000000, variacion: 12.8, estado: "UP" },
      riesgo_inventario: { valor: 8, variacion: -2.1, estado: "DOWN" },
      demanda_total: { valor: 1250, variacion: 8.4, estado: "UP" }
    },
    insights: [
      {
        id: 1,
        tipo: "ALTO_IMPACTO",
        impacto: "Alto Impacto",
        variacion: "+15.4%",
        titulo: "Crecimiento en Categoría Electrónica",
        descripcion: "Se observa una tendencia ascendente marcada en la demanda estacional de dispositivos móviles y accesorios para el Q2.",
        icono: "monitoring"
      },
      {
        id: 2,
        tipo: "MEDIO_IMPACTO",
        impacto: "Impacto Medio",
        variacion: "+4.2%",
        titulo: "Optimización de Margen Operativo",
        descripcion: "La reducción de costos logísticos proyectada por el nuevo proveedor nacional impactará positivamente en el margen neto.",
        icono: "account_balance_wallet"
      }
    ],
    recomendaciones: [
      {
        id: 1,
        prioridad: "Alta",
        titulo: "Reabastecimiento de Seguridad",
        accion: "Incrementar stock de SKU #2045 en 15%",
        impacto_potencial: "Evitar pérdida de ₲ 12M en ventas",
        color: "red"
      },
      {
        id: 2,
        prioridad: "Media",
        titulo: "Liquidación de Temporada",
        accion: "Promoción 2x1 en categoría Invierno",
        impacto_potencial: "Reducción 20% costo almacenamiento",
        color: "primary"
      },
      {
        id: 3,
        prioridad: "Media",
        titulo: "Programa de Lealtad B2B",
        accion: "Bonos por volumen a mayoristas top 5",
        impacto_potencial: "Retención de clientes clave +8%",
        color: "emerald"
      }
    ]
  }
};

export const MOCK_SALUD_INVENTARIO = {
  success: true,
  data: {
    kpis: {
      stock_total: { valor: 45200, variacion: -2 },
      cobertura: { valor: 85, variacion: 5 },
      productos_riesgo: { valor: 8 }
    },
    notificaciones: "8 productos alcanzarán quiebre de stock en los próximos 7 días (Aceite Vegetal, Harina, Leche...).",
    productos: [
      { id: "SKU-001", nombre: "Aceite Vegetal 1L", stock: 120, venta_promedio: 15, pronostico: 450, dias_restantes: 3, reorden: 200, riesgo: "ALTO" },
      { id: "SKU-102", nombre: "Harina de Trigo", stock: 45, venta_promedio: 80, pronostico: 2400, dias_restantes: 0, reorden: 150, riesgo: "ALTO" },
      { id: "SKU-088", nombre: "Leche Entera", stock: 320, venta_promedio: 55, pronostico: 1650, dias_restantes: 6, reorden: 100, riesgo: "MEDIO" },
      { id: "SKU-045", nombre: "Arroz Integral 5kg", stock: 850, venta_promedio: 40, pronostico: 1200, dias_restantes: 21, reorden: 300, riesgo: "BAJO" },
      { id: "SKU-034", nombre: "Azúcar Blanca", stock: 1100, venta_promedio: 25, pronostico: 750, dias_restantes: 44, reorden: 250, riesgo: "BAJO" }
    ],
    paginacion: { total: 128, mostrando: 5 }
  }
};

export const MOCK_PRONOSTICO_VENTAS = {
  success: true,
  data: {
    kpis: {
      crecimiento: { valor: 12.4, periodo_anterior: 2.1 },
      confianza: { valor: 85.5 },
      mae: { valor: 5200000, porcentaje: -1.5 },
      r_cuadrado: { valor: 0.92 }
    },
    historial: [
      { periodo: "Diciembre 2025", valor: 145200000, variacion: "+8.5%", positivo: true },
      { periodo: "Noviembre 2025", valor: 133800000, variacion: "+4.2%", positivo: true },
      { periodo: "Octubre 2025", valor: 128400000, variacion: "-2.1%", positivo: false },
      { periodo: "Septiembre 2025", valor: 131100000, variacion: "+5.0%", positivo: true },
      { periodo: "Agosto 2025", valor: 124900000, variacion: "-1.8%", positivo: false },
      { periodo: "Julio 2025", valor: 127200000, variacion: "--", positivo: null }
    ],
    proyeccion: [
      { periodo: "Enero 2026", valor: 152000000, destacado: true },
      { periodo: "Febrero 2026", valor: 148500000, destacado: false },
      { periodo: "Marzo 2026", valor: 165400000, destacado: false }
    ],
    estacionalidad: {
      picos: [
        { mes: "DIC", descripcion: "Navidad y Aguinaldos" },
        { mes: "MAR", descripcion: "Temporada Escolar" }
      ],
      valles: [
        { mes: "FEB", descripcion: "Post-Vacaciones" },
        { mes: "AGO", descripcion: "Transición Estacional" }
      ],
      factores: [
        { mes: "ENE", factor: 1.12, tipo: "alto" },
        { mes: "FEB", factor: 0.85, tipo: "bajo" },
        { mes: "MAR", factor: 1.25, tipo: "alto" },
        { mes: "ABR", factor: 1.02, tipo: "normal" },
        { mes: "MAY", factor: 1.08, tipo: "normal" },
        { mes: "JUN", factor: 0.98, tipo: "normal" },
        { mes: "JUL", factor: 0.95, tipo: "normal" },
        { mes: "AGO", factor: 0.88, tipo: "bajo" },
        { mes: "SEP", factor: 1.05, tipo: "normal" },
        { mes: "OCT", factor: 1.10, tipo: "normal" },
        { mes: "NOV", factor: 1.15, tipo: "normal" },
        { mes: "DIC", factor: 1.42, tipo: "destacado" }
      ]
    }
  }
};

export const MOCK_PRONOSTICO_DEMANDA = {
  success: true,
  data: {
    kpis: {
      categoria_crecimiento: { nombre: "Electrónica", variacion: 18.5 },
      producto_demanda: { nombre: "Smartphone XYZ", unidades: 450 }
    },
    categorias: [
      { nombre: "Electrónica", historico: 1200, proyectado: 1422, crecimiento: "+18.5%", tendencia: "up", confianza: 85 },
      { nombre: "Hogar y Jardín", historico: 850, proyectado: 910, crecimiento: "+7.1%", tendencia: "flat", confianza: 92 },
      { nombre: "Oficina", historico: 500, proyectado: 480, crecimiento: "-4.0%", tendencia: "down", confianza: 78 },
      { nombre: "Herramientas", historico: 320, proyectado: 345, crecimiento: "+7.8%", tendencia: "up", confianza: 82 }
    ],
    productos_top: [
      { producto: "Smartphone XYZ - Black", categoria: "Electrónica", unidades: 450, valor: 1350000000, confianza: "Alta" },
      { producto: "Notebook Ultra G15", categoria: "Electrónica", unidades: 210, valor: 2100000000, confianza: "Alta" },
      { producto: "Licuadora Pro-Mixer", categoria: "Hogar y Jardín", unidades: 185, valor: 83250000, confianza: "Media" },
      { producto: "Silla Ergonómica Task-1", categoria: "Oficina", unidades: 115, valor: 172500000, confianza: "Media" }
    ]
  }
};

export const MOCK_PRONOSTICO_INGRESOS = {
  success: true,
  data: {
    escenarios: {
      pesimista: { probabilidad: 20, valor: 1620000000, variacion: "+15.7%", descripcion: "Impacto por volatilidad de precios internacionales y reducción inesperada en la demanda local." },
      base: { probabilidad: 65, valor: 1850000000, variacion: "+32.1%", descripcion: "Crecimiento sostenido basado en el rendimiento histórico y estabilidad de la cartera de clientes actual." },
      optimista: { probabilidad: 15, valor: 2100000000, variacion: "+50.0%", descripcion: "Potencial incremento por apertura exitosa de nuevos mercados regionales y optimización operativa." }
    },
    proyeccion_mensual: [
      { mes: "Enero", base: 145000000, inf: 130500000, sup: 159500000, estado: "Estable" },
      { mes: "Febrero", base: 152000000, inf: 136800000, sup: 167200000, estado: "Crecimiento" },
      { mes: "Promedio Q1", base: 154200000, inf: 138780000, sup: 169620000, estado: "-", destacado: true }
    ],
    categorias: [
      { nombre: "Servicios Corporativos", valor: 925000000, porcentaje: "50.0%", crecimiento: "+12.5%", color: "primary" },
      { nombre: "Productos de Suscripción", valor: 555000000, porcentaje: "30.0%", crecimiento: "+45.2%", color: "indigo" },
      { nombre: "Consultoría y Soporte", valor: 370000000, porcentaje: "20.0%", crecimiento: "+5.1%", color: "slate" }
    ],
    total: { valor: 1850000000, porcentaje: "100.0%", crecimiento: "+32.1%" }
  }
};
